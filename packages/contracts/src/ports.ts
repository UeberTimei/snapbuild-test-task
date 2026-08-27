import { z } from "zod";

export const PortType = z.enum(["text", "image"]);
export type PortType = z.infer<typeof PortType>;

export const NodeKind = z.enum(["prompt", "imageInput", "generateImage", "editImage", "result"]);
export type NodeKind = z.infer<typeof NodeKind>;

export interface PortDef {
  id: string;
  type: PortType;
  required: boolean;
}

export interface NodeKindDef {
  kind: NodeKind;
  label: string;
  inputs: PortDef[];
  outputs: PortDef[];
  producesJob: boolean;
}

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

export function requiredInputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].inputs.filter((port) => port.required);
}

export function hasSingleInput(kind: NodeKind): boolean {
  return NODE_KINDS[kind].inputs.length === 1;
}

function resolvePort(ports: PortDef[], handle: string | null | undefined): PortDef | undefined {
  if (handle == null) return ports.length === 1 ? ports[0] : undefined;
  return ports.find((port) => port.id === handle);
}

export function portType(
  kind: NodeKind,
  side: "inputs" | "outputs",
  handle: string | null | undefined,
): PortType | undefined {
  return resolvePort(NODE_KINDS[kind][side], handle)?.type;
}

export function portsCompatible(
  source: PortType | undefined,
  target: PortType | undefined,
): boolean {
  return source !== undefined && source === target;
}

export function defaultInputHandle(kind: NodeKind): string | undefined {
  return NODE_KINDS[kind].inputs[0]?.id;
}
