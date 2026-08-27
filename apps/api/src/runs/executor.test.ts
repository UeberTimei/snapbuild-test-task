import { expect, test } from "bun:test";
import type { WorkflowGraph } from "@repo/contracts";
import type { EditRequest, GeneratedImage, ImageProvider } from "../ai/image-provider";
import { Executor, type AssetStore, type PresetStore } from "./executor";
import { RunState } from "./run-state";

const at = { x: 0, y: 0 };
const IMAGE: GeneratedImage = { bytes: new Uint8Array([1, 2, 3]), mime: "image/png" };

class StubProvider implements ImageProvider {
  calls: string[] = [];
  constructor(
    private readonly delayMs = 0,
    private readonly failOn: string[] = [],
  ) {}

  async generate(req: { prompt: string }): Promise<GeneratedImage> {
    this.calls.push(req.prompt);
    await Bun.sleep(this.delayMs);
    if (this.failOn.includes(req.prompt)) throw new Error(`boom: ${req.prompt}`);
    return IMAGE;
  }

  async edit(req: EditRequest): Promise<GeneratedImage> {
    this.calls.push(`edit:${req.instruction}`);
    await Bun.sleep(this.delayMs);
    if (this.failOn.includes(`edit:${req.instruction}`)) throw new Error("boom: edit");
    return IMAGE;
  }
}

const assets: AssetStore = {
  saved: 0,
  async save() {
    return `asset-${++(assets as unknown as { saved: number }).saved}`;
  },
  async bytes() {
    return new Uint8Array([9]);
  },
} as AssetStore & { saved: number };

const presets: PresetStore = { get: () => null };

function makeRun(graph: WorkflowGraph, id = "run-1"): RunState {
  return new RunState(id, graph, Date.now());
}

/** Prompt fans out to two independent generate branches. */
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

/** Two generates in series: the second edits the first's output. */
function chainedGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: "p", kind: "prompt", position: at, data: { text: "a cat" } },
      { id: "gen", kind: "generateImage", position: at, data: { presetId: null } },
      { id: "edit", kind: "editImage", position: at, data: { presetId: null, instruction: "make it blue" } },
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
  const executor = new Executor({ provider, assets, presets });
  const run = makeRun(branchingGraph());
  executor.initJobs(run);

  const started = Date.now();
  await executor.run(run);
  const elapsed = Date.now() - started;

  expect(run.status).toBe("completed");
  expect(provider.calls).toHaveLength(2);
  // Serial execution would take >=400ms; concurrent stays well under.
  expect(elapsed).toBeLessThan(350);
});

test("concurrency limit serialises work beyond the cap", async () => {
  const provider = new StubProvider(150);
  const executor = new Executor({ provider, assets, presets, concurrency: 1 });
  const run = makeRun(branchingGraph());
  executor.initJobs(run);

  const started = Date.now();
  await executor.run(run);

  expect(Date.now() - started).toBeGreaterThanOrEqual(300);
  expect(run.status).toBe("completed");
});

test("a downstream job never starts before its dependency succeeds", async () => {
  const provider = new StubProvider(20);
  const order: string[] = [];
  const executor = new Executor({
    provider,
    assets,
    presets,
    onJobSettled: (_run, nodeId) => order.push(nodeId),
  });
  const run = makeRun(chainedGraph());
  executor.initJobs(run);
  await executor.run(run);

  expect(run.status).toBe("completed");
  expect(order).toEqual(["gen", "edit"]);
  expect(provider.calls).toEqual(["a cat", "edit:make it blue"]);
});

test("a failing job fails the run and leaves downstream work unstarted", async () => {
  const provider = new StubProvider(0, ["a cat"]);
  const executor = new Executor({ provider, assets, presets });
  const run = makeRun(chainedGraph());
  executor.initJobs(run);
  await executor.run(run);

  expect(run.status).toBe("failed");
  expect(run.jobs.get("gen")?.status).toBe("error");
  expect(run.jobs.get("gen")?.error).toContain("boom");
  expect(run.jobs.get("edit")?.status).toBe("idle");
});

test("retry re-runs the failed node and its downstream, completing the run", async () => {
  const provider = new StubProvider(0, ["a cat"]);
  const executor = new Executor({ provider, assets, presets });
  const run = makeRun(chainedGraph());
  executor.initJobs(run);
  await executor.run(run);
  expect(run.status).toBe("failed");

  // second attempt succeeds
  const healthy = new StubProvider(0);
  const retrier = new Executor({ provider: healthy, assets, presets });
  const failedJob = run.jobs.get("gen")!;
  await retrier.retry(run, failedJob.id);

  expect(run.status).toBe("completed");
  expect(run.jobs.get("gen")?.status).toBe("success");
  expect(run.jobs.get("gen")?.attempts).toBe(2);
  expect(run.jobs.get("edit")?.status).toBe("success");
});

test("retry is rejected for a job that did not fail", async () => {
  const executor = new Executor({ provider: new StubProvider(), assets, presets });
  const run = makeRun(chainedGraph());
  executor.initJobs(run);
  await executor.run(run);

  const job = run.jobs.get("gen")!;
  expect(executor.retry(run, job.id)).rejects.toThrow("only failed jobs");
});

test("run emits job and run events for the whole lifecycle", async () => {
  const executor = new Executor({ provider: new StubProvider(), assets, presets });
  const run = makeRun(branchingGraph());
  executor.initJobs(run);

  const seen: string[] = [];
  run.events.on("event", (e) => seen.push(e.type === "run" ? `run:${e.run.status}` : `job:${e.job.status}`));
  await executor.run(run);

  expect(seen).toContain("run:running");
  expect(seen).toContain("run:completed");
  expect(seen.filter((s) => s === "job:success")).toHaveLength(2);
});
