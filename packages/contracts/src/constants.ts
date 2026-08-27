import type { NodeKind } from "./ports";
import type { NodeKindDef } from "./ports.types";

export const NODE_KINDS: Record<NodeKind, NodeKindDef> = {
  prompt: {
    kind: "prompt",
    label: "Prompt",
    inputs: [],
    outputs: [{ id: "out", type: "text", required: true }],
    producesJob: false,
  },
  imageInput: {
    kind: "imageInput",
    label: "Image Input",
    inputs: [],
    outputs: [{ id: "out", type: "image", required: true }],
    producesJob: false,
  },
  generateImage: {
    kind: "generateImage",
    label: "Generate Image",
    inputs: [{ id: "prompt", type: "text", required: true }],
    outputs: [{ id: "out", type: "image", required: true }],
    producesJob: true,
  },
  editImage: {
    kind: "editImage",
    label: "Edit Image",
    inputs: [
      { id: "image", type: "image", required: true },
      { id: "prompt", type: "text", required: false },
    ],
    outputs: [{ id: "out", type: "image", required: true }],
    producesJob: true,
  },
  result: {
    kind: "result",
    label: "Result",
    inputs: [{ id: "in", type: "image", required: true }],
    outputs: [],
    producesJob: false,
  },
};

export const NODE_KIND_ORDER: NodeKind[] = [
  "prompt",
  "imageInput",
  "generateImage",
  "editImage",
  "result",
];

export const CYCLE_ERROR = "graph contains a cycle";
