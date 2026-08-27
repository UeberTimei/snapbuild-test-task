import { NODE_KINDS, type NodeKind, type WorkflowNode } from "@repo/contracts";

export type NodeData = WorkflowNode["data"];

/** Presentation metadata per node kind. Ports and rules come from contracts. */
interface NodeMeta {
  label: string;
  hint: string;
  defaultData: NodeData;
}

const META: Record<NodeKind, NodeMeta> = {
  prompt: {
    label: NODE_KINDS.prompt.label,
    hint: "Text that feeds generation",
    defaultData: { text: "" },
  },
  imageInput: {
    label: NODE_KINDS.imageInput.label,
    hint: "Upload a source image",
    defaultData: { assetId: null },
  },
  generateImage: {
    label: NODE_KINDS.generateImage.label,
    hint: "Text to image via the backend",
    defaultData: { presetId: null },
  },
  editImage: {
    label: NODE_KINDS.editImage.label,
    hint: "Edit an image with an instruction",
    defaultData: { presetId: null, instruction: "" },
  },
  result: {
    label: NODE_KINDS.result.label,
    hint: "Preview of the produced image",
    defaultData: {},
  },
};

export const NODE_ORDER: NodeKind[] = ["prompt", "imageInput", "generateImage", "editImage", "result"];

export function nodeMeta(kind: NodeKind): NodeMeta {
  return META[kind];
}

export function defaultDataFor(kind: NodeKind): NodeData {
  return structuredClone(META[kind].defaultData);
}

export function inputsOf(kind: NodeKind) {
  return NODE_KINDS[kind].inputs;
}

export function outputsOf(kind: NodeKind) {
  return NODE_KINDS[kind].outputs;
}
