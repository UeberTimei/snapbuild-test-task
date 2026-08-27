import type { WorkflowGraph } from "@repo/contracts";

/** The branching scenario from the brief, so the canvas is never empty on first load. */
export const demoGraph: WorkflowGraph = {
  nodes: [
    {
      id: "prompt-1",
      kind: "prompt",
      position: { x: 40, y: 200 },
      data: { text: "a premium ceramic coffee cup on a marble table" },
    },
    { id: "generateImage-1", kind: "generateImage", position: { x: 360, y: 80 }, data: { presetId: null } },
    { id: "generateImage-2", kind: "generateImage", position: { x: 360, y: 320 }, data: { presetId: null } },
    { id: "result-1", kind: "result", position: { x: 700, y: 80 }, data: {} },
    { id: "result-2", kind: "result", position: { x: 700, y: 320 }, data: {} },
  ],
  edges: [
    { id: "edge-1", source: "prompt-1", sourceHandle: "out", target: "generateImage-1", targetHandle: "prompt" },
    { id: "edge-2", source: "prompt-1", sourceHandle: "out", target: "generateImage-2", targetHandle: "prompt" },
    { id: "edge-3", source: "generateImage-1", sourceHandle: "out", target: "result-1", targetHandle: "in" },
    { id: "edge-4", source: "generateImage-2", sourceHandle: "out", target: "result-2", targetHandle: "in" },
  ],
};
