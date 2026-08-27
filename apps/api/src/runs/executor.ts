import { randomUUID } from "node:crypto";
import {
  NODE_KINDS,
  type Preset,
  type WorkflowGraph,
  type WorkflowNode,
} from "@repo/contracts";
import { buildImageRequest } from "../ai/request-builder";
import type { ImageProvider } from "../ai/image-provider";
import { RunState, type NodeOutput } from "./run-state";

export interface AssetStore {
  save(bytes: Uint8Array, mime: string, kind: "upload" | "generated"): Promise<string>;
  bytes(id: string): Promise<Uint8Array | null>;
}

export interface PresetStore {
  get(id: string): Preset | null;
}

export interface ExecutorDeps {
  provider: ImageProvider;
  assets: AssetStore;
  presets: PresetStore;
  /** Max jobs in flight per run. */
  concurrency?: number;
  onJobSettled?: (run: RunState, nodeId: string) => void;
}

const DEFAULT_CONCURRENCY = Number(process.env.RUN_CONCURRENCY ?? 4);

/**
 * Executes a workflow graph as a DAG. Nodes without an AI call (prompt,
 * imageInput, result) resolve inline; generateImage/editImage become Jobs.
 * Independent jobs run concurrently, bounded by `concurrency`.
 *
 * ponytail: single-process, in-memory scheduling. BullMQ + Redis is the
 * upgrade path when runs must survive a restart or span workers.
 */
export class Executor {
  private readonly concurrency: number;

  constructor(private readonly deps: ExecutorDeps) {
    this.concurrency = deps.concurrency ?? DEFAULT_CONCURRENCY;
  }

  /** Creates the job records for every executable node in the graph. */
  initJobs(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (!NODE_KINDS[node.kind].executable) continue;
      run.jobs.set(node.id, {
        id: randomUUID(),
        nodeId: node.id,
        kind: node.kind,
        status: "idle",
        attempts: 0,
        error: null,
        outputAssetId: null,
      });
    }
  }

  /** Runs (or resumes) the graph until no more progress can be made. */
  async run(run: RunState): Promise<void> {
    this.resolveInlineSources(run);
    run.setStatus("running");

    const inFlight = new Map<string, Promise<void>>();
    for (;;) {
      this.resolvePassthroughNodes(run);

      while (inFlight.size < this.concurrency) {
        const nodeId = this.nextReadyJob(run, inFlight);
        if (!nodeId) break;
        run.patchJob(nodeId, { status: "queued" });
        inFlight.set(nodeId, this.runJob(run, nodeId).finally(() => inFlight.delete(nodeId)));
      }

      if (inFlight.size === 0) break;
      await Promise.race(inFlight.values());
    }

    this.resolvePassthroughNodes(run);
    run.setStatus(this.settleStatus(run));
  }

  /**
   * Resets a failed job and everything downstream of it back to idle.
   * Throws if the job is not retryable, so callers can reject the request
   * before kicking off execution.
   */
  prepareRetry(run: RunState, jobId: string): void {
    const job = [...run.jobs.values()].find((j) => j.id === jobId);
    if (!job) throw new Error(`job ${jobId} not found`);
    if (job.status !== "error") throw new Error(`job ${jobId} is ${job.status}, only failed jobs can be retried`);

    for (const nodeId of this.downstreamOf(run.graph, job.nodeId)) {
      run.outputs.delete(nodeId);
      if (run.jobs.has(nodeId)) {
        run.patchJob(nodeId, { status: "idle", error: null, outputAssetId: null });
      }
    }
  }

  /** Retries one failed job and everything downstream of it. */
  async retry(run: RunState, jobId: string): Promise<void> {
    this.prepareRetry(run, jobId);
    await this.run(run);
  }

  // --- internals -----------------------------------------------------------

  private resolveInlineSources(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (node.kind === "prompt") {
        run.outputs.set(node.id, { type: "text", value: node.data.text });
      } else if (node.kind === "imageInput" && node.data.assetId) {
        run.outputs.set(node.id, { type: "image", assetId: node.data.assetId });
      }
    }
  }

  /** `result` nodes just mirror their upstream image once it exists. */
  private resolvePassthroughNodes(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (node.kind !== "result" || run.outputs.has(node.id)) continue;
      const upstream = this.inputOf(run, node.id, "in");
      if (upstream) run.outputs.set(node.id, upstream);
    }
  }

  private nextReadyJob(run: RunState, inFlight: Map<string, unknown>): string | undefined {
    for (const [nodeId, job] of run.jobs) {
      if (job.status !== "idle" || inFlight.has(nodeId)) continue;
      if (this.dependenciesReady(run, nodeId)) return nodeId;
    }
    return undefined;
  }

  private dependenciesReady(run: RunState, nodeId: string): boolean {
    const node = this.node(run.graph, nodeId);
    const required = NODE_KINDS[node.kind].inputs.filter((p) => p.required !== false);
    return required.every((port) => this.inputOf(run, nodeId, port.id) !== undefined);
  }

  private inputOf(run: RunState, nodeId: string, handle: string): NodeOutput | undefined {
    // A null targetHandle only resolves for single-input nodes, otherwise an
    // unlabelled edge could satisfy the wrong port.
    const singleInput = NODE_KINDS[this.node(run.graph, nodeId).kind].inputs.length === 1;
    const edge = run.graph.edges.find(
      (e) =>
        e.target === nodeId &&
        (e.targetHandle === handle || (e.targetHandle === null && singleInput)),
    );
    return edge ? run.outputs.get(edge.source) : undefined;
  }

  private async runJob(run: RunState, nodeId: string): Promise<void> {
    const node = this.node(run.graph, nodeId);
    const attempts = (run.jobs.get(nodeId)?.attempts ?? 0) + 1;
    run.patchJob(nodeId, { status: "running", attempts, error: null });

    try {
      const assetId = await this.execute(run, node);
      run.outputs.set(nodeId, { type: "image", assetId });
      run.patchJob(nodeId, { status: "success", outputAssetId: assetId });
    } catch (err) {
      run.patchJob(nodeId, { status: "error", error: message(err) });
    } finally {
      this.deps.onJobSettled?.(run, nodeId);
    }
  }

  private async execute(run: RunState, node: WorkflowNode): Promise<string> {
    if (node.kind === "generateImage") {
      const prompt = this.textInput(run, node.id, "prompt");
      const request = buildImageRequest(prompt, this.preset(node.data.presetId));
      const image = await this.deps.provider.generate(request);
      return this.deps.assets.save(image.bytes, image.mime, "generated");
    }

    if (node.kind === "editImage") {
      const source = this.inputOf(run, node.id, "image");
      if (source?.type !== "image") throw new Error("edit image: no source image on the image input");
      const bytes = await this.deps.assets.bytes(source.assetId);
      if (!bytes) throw new Error(`edit image: asset ${source.assetId} not found`);
      const extraPrompt = this.optionalTextInput(run, node.id, "prompt");
      const request = buildImageRequest(extraPrompt, this.preset(node.data.presetId));
      const image = await this.deps.provider.edit({
        ...request,
        image: bytes,
        instruction: node.data.instruction,
      });
      return this.deps.assets.save(image.bytes, image.mime, "generated");
    }

    throw new Error(`node kind ${node.kind} is not executable`);
  }

  private textInput(run: RunState, nodeId: string, handle: string): string {
    const input = this.inputOf(run, nodeId, handle);
    if (input?.type !== "text") throw new Error(`node ${nodeId}: input "${handle}" is not connected to text`);
    return input.value;
  }

  private optionalTextInput(run: RunState, nodeId: string, handle: string): string {
    const input = this.inputOf(run, nodeId, handle);
    return input?.type === "text" ? input.value : "";
  }

  private preset(presetId: string | null): Preset | null {
    return presetId ? this.deps.presets.get(presetId) : null;
  }

  private node(graph: WorkflowGraph, nodeId: string): WorkflowNode {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`node ${nodeId} not found`);
    return node;
  }

  /** The node itself plus every node reachable from it. */
  private downstreamOf(graph: WorkflowGraph, nodeId: string): string[] {
    const seen = new Set<string>([nodeId]);
    const stack = [nodeId];
    while (stack.length) {
      const current = stack.pop()!;
      for (const edge of graph.edges) {
        if (edge.source === current && !seen.has(edge.target)) {
          seen.add(edge.target);
          stack.push(edge.target);
        }
      }
    }
    return [...seen];
  }

  private settleStatus(run: RunState) {
    const jobs = [...run.jobs.values()];
    if (jobs.some((j) => j.status === "error")) return "failed" as const;
    return jobs.every((j) => j.status === "success") ? ("completed" as const) : ("failed" as const);
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
