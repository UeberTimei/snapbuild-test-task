import { expect, test } from "bun:test";
import { validateGraph, type WorkflowGraph } from "./graph";
import { topoOrder } from "./graph.helpers";

const at = { x: 0, y: 0 };

function baseGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: "p1", kind: "prompt", position: at, data: { text: "a cat" } },
      { id: "genA", kind: "generateImage", position: at, data: { presetId: null } },
      { id: "genB", kind: "generateImage", position: at, data: { presetId: null } },
      { id: "rA", kind: "result", position: at, data: {} },
      { id: "rB", kind: "result", position: at, data: {} },
      { id: "img1", kind: "imageInput", position: at, data: { assetId: "asset-1" } },
      {
        id: "edit1",
        kind: "editImage",
        position: at,
        data: { presetId: null, instruction: "make it blue" },
      },
      { id: "rC", kind: "result", position: at, data: {} },
    ],
    edges: [
      { id: "e1", source: "p1", sourceHandle: "out", target: "genA", targetHandle: "prompt" },
      { id: "e2", source: "p1", sourceHandle: "out", target: "genB", targetHandle: "prompt" },
      { id: "e3", source: "genA", sourceHandle: "out", target: "rA", targetHandle: "in" },
      { id: "e4", source: "genB", sourceHandle: "out", target: "rB", targetHandle: "in" },
      { id: "e5", source: "img1", sourceHandle: "out", target: "edit1", targetHandle: "image" },
      { id: "e6", source: "edit1", sourceHandle: "out", target: "rC", targetHandle: "in" },
    ],
  };
}

test("valid 3-scenario graph passes", () => {
  expect(validateGraph(baseGraph())).toEqual({ ok: true });
});

test("branches are independent in topo order", () => {
  const order = topoOrder(baseGraph());
  expect(order.indexOf("p1")).toBeLessThan(order.indexOf("genA"));
  expect(order.indexOf("p1")).toBeLessThan(order.indexOf("genB"));
  expect(order.indexOf("genA")).toBeLessThan(order.indexOf("rA"));
});

test("cycle is rejected", () => {
  const g = baseGraph();
  g.edges.push({
    id: "cy",
    source: "rA",
    sourceHandle: "in",
    target: "genA",
    targetHandle: "prompt",
  });
  const res = validateGraph(g);
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.errors.join()).toContain("cycle");
});

test("a text output wired into an image input is rejected", () => {
  const g = baseGraph();
  g.edges.push({ id: "bad", source: "p1", sourceHandle: "out", target: "rA", targetHandle: "in" });
  expect(validateGraph(g).ok).toBe(false);
});

test("a generate node without a connected prompt is rejected", () => {
  const g = baseGraph();
  g.edges = g.edges.filter((edge) => edge.id !== "e1");

  const res = validateGraph(g);
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.errors.join()).toContain("genA");
});

test("unknown node kind is rejected", () => {
  const withUnknownKind = {
    ...baseGraph(),
    nodes: [{ id: "x", kind: "frobnicate", position: at, data: {} }],
  };
  expect(validateGraph(withUnknownKind).ok).toBe(false);
});
