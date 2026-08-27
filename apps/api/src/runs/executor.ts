import { randomUUID } from "node:crypto";
import {
  descendantsOf,
  findNode,
  producesJob,
  requiredInputsOf,
  type NodeOfKind,
  type Preset,
  type WorkflowNode,
} from "@repo/contracts";
import { buildImageRequest } from "../ai/request-builder";
import { RUN_CONCURRENCY } from "../common/constants";
import { toErrorMessage } from "../common/helpers";
import { inputOf, settledStatus } from "./executor.helpers";
import type { ExecutorDeps } from "./executor.types";
import { RunState } from "./run-state";

export class JobNotFoundError extends Error {}
export class JobNotRetryableError extends Error {}

export class Executor {
  private readonly concurrency: number;

  constructor(private readonly deps: ExecutorDeps) {
    this.concurrency = deps.concurrency ?? RUN_CONCURRENCY;
  }

  initJobs(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (!producesJob(node.kind)) continue;

      run.jobsByNodeId.set(node.id, {
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

  async run(run: RunState): Promise<void> {
    this.resolveSourceNodes(run);
    run.setStatus("running");

    const inFlight = new Map<string, Promise<void>>();

    while (true) {
      this.resolveResultNodes(run);
      this.startReadyJobs(run, inFlight);

      if (inFlight.size === 0) break;
      await Promise.race(inFlight.values());
    }

    this.resolveResultNodes(run);
    run.setStatus(settledStatus(run));
  }

  prepareRetry(run: RunState, jobId: string): void {
    const job = run.findJobById(jobId);
    if (!job) throw new JobNotFoundError(`job ${jobId} not found`);
    if (job.status !== "error") {
      throw new JobNotRetryableError(
        `job ${jobId} is ${job.status}, only failed jobs can be retried`,
      );
    }

    for (const nodeId of descendantsOf(run.graph, job.nodeId)) {
      run.outputsByNodeId.delete(nodeId);
      if (run.jobsByNodeId.has(nodeId)) {
        run.patchJob(nodeId, { status: "idle", error: null, outputAssetId: null });
      }
    }
  }

  async retry(run: RunState, jobId: string): Promise<void> {
    this.prepareRetry(run, jobId);
    await this.run(run);
  }

  private startReadyJobs(run: RunState, inFlight: Map<string, Promise<void>>): void {
    while (inFlight.size < this.concurrency) {
      const nodeId = this.nextReadyNodeId(run, inFlight);
      if (!nodeId) return;

      run.patchJob(nodeId, { status: "queued" });
      inFlight.set(
        nodeId,
        this.runJob(run, nodeId).finally(() => inFlight.delete(nodeId)),
      );
    }
  }

  private resolveSourceNodes(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (node.kind === "prompt") {
        run.outputsByNodeId.set(node.id, { type: "text", value: node.data.text });
      }
      if (node.kind === "imageInput" && node.data.assetId !== null) {
        run.outputsByNodeId.set(node.id, { type: "image", assetId: node.data.assetId });
      }
    }
  }

  private resolveResultNodes(run: RunState): void {
    for (const node of run.graph.nodes) {
      if (node.kind !== "result" || run.outputsByNodeId.has(node.id)) continue;

      const upstream = inputOf(run, node, "in");
      if (upstream) run.outputsByNodeId.set(node.id, upstream);
    }
  }

  private nextReadyNodeId(run: RunState, inFlight: Map<string, unknown>): string | undefined {
    for (const [nodeId, job] of run.jobsByNodeId) {
      if (job.status !== "idle" || inFlight.has(nodeId)) continue;
      if (this.dependenciesResolved(run, nodeId)) return nodeId;
    }
    return undefined;
  }

  private dependenciesResolved(run: RunState, nodeId: string): boolean {
    const node = this.requireNode(run, nodeId);
    return requiredInputsOf(node.kind).every((port) => inputOf(run, node, port.id) !== undefined);
  }

  private async runJob(run: RunState, nodeId: string): Promise<void> {
    const node = this.requireNode(run, nodeId);
    const attempts = (run.jobFor(nodeId)?.attempts ?? 0) + 1;
    run.patchJob(nodeId, { status: "running", attempts, error: null });

    try {
      const assetId = await this.produceImage(run, node);
      run.outputsByNodeId.set(nodeId, { type: "image", assetId });
      run.patchJob(nodeId, { status: "success", outputAssetId: assetId });
    } catch (error) {
      run.patchJob(nodeId, { status: "error", error: toErrorMessage(error) });
    } finally {
      this.deps.onJobSettled?.(run, nodeId);
    }
  }

  private produceImage(run: RunState, node: WorkflowNode): Promise<string> {
    if (node.kind === "generateImage") return this.generate(run, node);
    if (node.kind === "editImage") return this.edit(run, node);
    throw new Error(`node kind ${node.kind} does not produce an image`);
  }

  private async generate(run: RunState, node: NodeOfKind<"generateImage">): Promise<string> {
    const prompt = this.requireTextInput(run, node, "prompt");
    const request = buildImageRequest(prompt, this.presetFor(node.data.presetId));

    const image = await this.deps.provider.generate(request);
    return this.deps.assets.save(image.bytes, image.mime, "generated");
  }

  private async edit(run: RunState, node: NodeOfKind<"editImage">): Promise<string> {
    const source = inputOf(run, node, "image");
    if (source?.type !== "image") {
      throw new Error("edit image: the image input is not connected to an image");
    }

    const bytes = await this.deps.assets.bytes(source.assetId);
    if (!bytes) throw new Error(`edit image: asset ${source.assetId} not found`);

    const request = buildImageRequest(
      this.optionalTextInput(run, node, "prompt"),
      this.presetFor(node.data.presetId),
    );
    const image = await this.deps.provider.edit({
      ...request,
      image: bytes,
      instruction: node.data.instruction,
    });
    return this.deps.assets.save(image.bytes, image.mime, "generated");
  }

  private requireTextInput(run: RunState, node: WorkflowNode, handle: string): string {
    const input = inputOf(run, node, handle);
    if (input?.type !== "text") {
      throw new Error(`node ${node.id}: input "${handle}" is not connected to text`);
    }
    return input.value;
  }

  private optionalTextInput(run: RunState, node: WorkflowNode, handle: string): string {
    const input = inputOf(run, node, handle);
    return input?.type === "text" ? input.value : "";
  }

  private presetFor(presetId: string | null): Preset | null {
    return presetId === null ? null : this.deps.presets.get(presetId);
  }

  private requireNode(run: RunState, nodeId: string): WorkflowNode {
    const node = findNode(run.graph, nodeId);
    if (!node) throw new Error(`node ${nodeId} not found`);
    return node;
  }
}
