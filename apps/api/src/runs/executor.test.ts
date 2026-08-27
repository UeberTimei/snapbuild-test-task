import { expect, test } from "bun:test";
import type { ImageRequest, JobDto, WorkflowGraph } from "@repo/contracts";
import type { EditRequest, GeneratedImage, ImageProvider } from "../ai/image-provider";
import { Executor, type AssetStore, type PresetStore } from "./executor";
import { RunState } from "./run-state";

const at = { x: 0, y: 0 };
const IMAGE: GeneratedImage = { bytes: new Uint8Array([1, 2, 3]), mime: "image/png" };

class StubProvider implements ImageProvider {
  readonly calls: string[] = [];

  constructor(
    private readonly delayMs = 0,
    private readonly failOn: string[] = [],
  ) {}

  async generate(request: ImageRequest): Promise<GeneratedImage> {
    return this.record(request.prompt);
  }

  async edit(request: EditRequest): Promise<GeneratedImage> {
    return this.record(`edit:${request.instruction}`);
  }

  private async record(call: string): Promise<GeneratedImage> {
    this.calls.push(call);
    await Bun.sleep(this.delayMs);
    if (this.failOn.includes(call)) throw new Error(`boom: ${call}`);
    return IMAGE;
  }
}

class StubAssetStore implements AssetStore {
  private saved = 0;

  async save(): Promise<string> {
    this.saved += 1;
    return `asset-${this.saved}`;
  }

  async bytes(): Promise<Uint8Array> {
    return new Uint8Array([9]);
  }
}

const presets: PresetStore = { get: () => null };

function makeExecutor(provider: ImageProvider, overrides: { concurrency?: number } = {}) {
  return new Executor({ provider, assets: new StubAssetStore(), presets, ...overrides });
}

function makeRun(graph: WorkflowGraph, executor: Executor): RunState {
  const run = new RunState("run-1", graph, Date.now());
  executor.initJobs(run);
  return run;
}

function jobOf(run: RunState, nodeId: string): JobDto {
  const job = run.jobFor(nodeId);
  if (!job) throw new Error(`expected a job for node ${nodeId}`);
  return job;
}

function branchingGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: "p", kind: "prompt", position: at, data: { text: "a cat" } },
      { id: "genA", kind: "generateImage", position: at, data: { presetId: null } },
      { id: "genB", kind: "generateImage", position: at, data: { presetId: null } },
      { id: "rA", kind: "result", position: at, data: {} },
      { id: "rB", kind: "result", position: at, data: {} },
    ],
    edges: [
      { id: "e1", source: "p", sourceHandle: "out", target: "genA", targetHandle: "prompt" },
      { id: "e2", source: "p", sourceHandle: "out", target: "genB", targetHandle: "prompt" },
      { id: "e3", source: "genA", sourceHandle: "out", target: "rA", targetHandle: "in" },
      { id: "e4", source: "genB", sourceHandle: "out", target: "rB", targetHandle: "in" },
    ],
  };
}

function chainedGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: "p", kind: "prompt", position: at, data: { text: "a cat" } },
      { id: "gen", kind: "generateImage", position: at, data: { presetId: null } },
      {
        id: "edit",
        kind: "editImage",
        position: at,
        data: { presetId: null, instruction: "make it blue" },
      },
      { id: "r", kind: "result", position: at, data: {} },
    ],
    edges: [
      { id: "e1", source: "p", sourceHandle: "out", target: "gen", targetHandle: "prompt" },
      { id: "e2", source: "gen", sourceHandle: "out", target: "edit", targetHandle: "image" },
      { id: "e3", source: "edit", sourceHandle: "out", target: "r", targetHandle: "in" },
    ],
  };
}

test("independent branches run concurrently", async () => {
  const provider = new StubProvider(200);
  const executor = makeExecutor(provider);
  const run = makeRun(branchingGraph(), executor);

  const started = Date.now();
  await executor.run(run);
  const elapsed = Date.now() - started;

  expect(run.status).toBe("completed");
  expect(provider.calls).toHaveLength(2);
  expect(elapsed).toBeLessThan(350);
});

test("concurrency limit serialises work beyond the cap", async () => {
  const executor = makeExecutor(new StubProvider(150), { concurrency: 1 });
  const run = makeRun(branchingGraph(), executor);

  const started = Date.now();
  await executor.run(run);

  expect(Date.now() - started).toBeGreaterThanOrEqual(300);
  expect(run.status).toBe("completed");
});

test("a downstream job never starts before its dependency succeeds", async () => {
  const provider = new StubProvider(20);
  const settled: string[] = [];
  const executor = new Executor({
    provider,
    assets: new StubAssetStore(),
    presets,
    onJobSettled: (_run, nodeId) => settled.push(nodeId),
  });
  const run = makeRun(chainedGraph(), executor);

  await executor.run(run);

  expect(run.status).toBe("completed");
  expect(settled).toEqual(["gen", "edit"]);
  expect(provider.calls).toEqual(["a cat", "edit:make it blue"]);
});

test("a failing job fails the run and leaves downstream work unstarted", async () => {
  const executor = makeExecutor(new StubProvider(0, ["a cat"]));
  const run = makeRun(chainedGraph(), executor);

  await executor.run(run);

  expect(run.status).toBe("failed");
  expect(jobOf(run, "gen").status).toBe("error");
  expect(jobOf(run, "gen").error).toContain("boom");
  expect(jobOf(run, "edit").status).toBe("idle");
});

test("retry re-runs the failed node and its downstream, completing the run", async () => {
  const executor = makeExecutor(new StubProvider(0, ["a cat"]));
  const run = makeRun(chainedGraph(), executor);
  await executor.run(run);
  expect(run.status).toBe("failed");

  const retrier = makeExecutor(new StubProvider(0));
  await retrier.retry(run, jobOf(run, "gen").id);

  expect(run.status).toBe("completed");
  expect(jobOf(run, "gen").status).toBe("success");
  expect(jobOf(run, "gen").attempts).toBe(2);
  expect(jobOf(run, "edit").status).toBe("success");
});

test("retry is rejected for a job that did not fail", async () => {
  const executor = makeExecutor(new StubProvider());
  const run = makeRun(chainedGraph(), executor);
  await executor.run(run);

  expect(executor.retry(run, jobOf(run, "gen").id)).rejects.toThrow("only failed jobs");
});

test("run emits job and run events for the whole lifecycle", async () => {
  const executor = makeExecutor(new StubProvider());
  const run = makeRun(branchingGraph(), executor);

  const seen: string[] = [];
  run.onEvent((event) =>
    seen.push(event.type === "run" ? `run:${event.run.status}` : `job:${event.job.status}`),
  );
  await executor.run(run);

  expect(seen).toContain("run:running");
  expect(seen).toContain("run:completed");
  expect(seen.filter((entry) => entry === "job:success")).toHaveLength(2);
});
