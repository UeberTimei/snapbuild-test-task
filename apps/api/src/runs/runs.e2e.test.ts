import "reflect-metadata";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { Module, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CreateRunResponse,
  PresetList,
  RunDto,
  RunEvent,
  type WorkflowGraph,
} from "@repo/contracts";
import { AiModule } from "../ai/ai.module";
import { IMAGE_PROVIDER, type GeneratedImage, type ImageProvider } from "../ai/image-provider";
import { AssetsModule } from "../assets/assets.module";
import { DbModule } from "../db/db.module";
import { PresetsModule } from "../presets/presets.module";
import { RunsModule } from "./runs.module";
import { WorkflowsModule } from "../workflows/workflows.module";

const DB_FILE = "test-e2e.sqlite";
const PNG: GeneratedImage = { bytes: new Uint8Array([137, 80, 78, 71]), mime: "image/png" };

class FakeProvider implements ImageProvider {
  async generate(): Promise<GeneratedImage> {
    await Bun.sleep(30);
    return PNG;
  }
  async edit(): Promise<GeneratedImage> {
    return PNG;
  }
}

@Module({
  imports: [DbModule, AssetsModule, PresetsModule, WorkflowsModule, AiModule, RunsModule],
})
class TestAppModule {}

let app: INestApplication;
let baseUrl: string;

beforeAll(async () => {
  process.env.DB_FILE = DB_FILE;
  process.env.STORAGE_DIR = "test-storage";
  const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] })
    .overrideProvider(IMAGE_PROVIDER)
    .useClass(FakeProvider)
    .compile();
  app = moduleRef.createNestApplication({ logger: false });
  await app.listen(0);
  baseUrl = await app.getUrl();
});

afterAll(async () => {
  await app.close();
  try {
    unlinkSync(DB_FILE);
  } catch {
    return;
  }
});

const at = { x: 0, y: 0 };
const graph: WorkflowGraph = {
  nodes: [
    { id: "p", kind: "prompt", position: at, data: { text: "a cat" } },
    { id: "genA", kind: "generateImage", position: at, data: { presetId: "preset-demo" } },
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

test("POST /runs runs the branching graph to completion and streams SSE", async () => {
  const created = await fetch(`${baseUrl}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ graph }),
  });
  expect(created.status).toBe(201);
  const { runId } = CreateRunResponse.parse(await created.json());

  const statuses = await collectSse(`${baseUrl}/runs/${runId}/events`);
  expect(statuses).toContain("run:completed");
  expect(statuses.filter((status) => status === "job:success")).toHaveLength(2);

  const final = RunDto.parse(await (await fetch(`${baseUrl}/runs/${runId}`)).json());
  expect(final.status).toBe("completed");
  const assetId = final.jobs[0]?.outputAssetId;
  expect(assetId).toBeTruthy();

  const image = await fetch(`${baseUrl}/assets/${assetId}`);
  expect(image.headers.get("content-type")).toContain("image/png");
});

test("POST /runs rejects a cyclic graph with 400", async () => {
  const cyclic: WorkflowGraph = {
    ...graph,
    edges: [
      ...graph.edges,
      { id: "cy", source: "rA", sourceHandle: "in", target: "genA", targetHandle: "prompt" },
    ],
  };
  const res = await fetch(`${baseUrl}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ graph: cyclic }),
  });
  expect(res.status).toBe(400);
});

test("GET /presets returns the seeded preset", async () => {
  const presets = PresetList.parse(await (await fetch(`${baseUrl}/presets`)).json());
  expect(presets.map((preset) => preset.id)).toContain("preset-demo");
});

async function collectSse(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { Accept: "text/event-stream" } });
  if (!res.body) throw new Error("SSE response has no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const seen: string[] = [];
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((candidate) => candidate.startsWith("data:"));
      if (!line) continue;

      const event = RunEvent.parse(JSON.parse(line.slice(5)));
      seen.push(event.type === "run" ? `run:${event.run.status}` : `job:${event.job.status}`);
      if (event.type === "run" && event.run.status === "completed") {
        await reader.cancel();
        return seen;
      }
    }
  }
  return seen;
}
