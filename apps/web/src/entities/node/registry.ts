import { NODE_KINDS, type NodeDataByKind, type NodeKind, type PortDef } from "@repo/contracts";

interface NodeMeta<K extends NodeKind> {
  label: string;
  hint: string;
  defaultData: NodeDataByKind[K];
}

type NodeMetaByKind = { [K in NodeKind]: NodeMeta<K> };

const META: NodeMetaByKind = {
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

export const NODE_ORDER: NodeKind[] = [
  "prompt",
  "imageInput",
  "generateImage",
  "editImage",
  "result",
];

export function nodeLabel(kind: NodeKind): string {
  return META[kind].label;
}

export function nodeHint(kind: NodeKind): string {
  return META[kind].hint;
}

export function defaultDataFor<K extends NodeKind>(kind: K): NodeDataByKind[K] {
  return structuredClone(META[kind].defaultData);
}

export function inputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].inputs;
}

export function outputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].outputs;
}
