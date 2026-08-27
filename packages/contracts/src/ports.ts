import { z } from "zod";

export const PortType = z.enum(["text", "image"]);
export type PortType = z.infer<typeof PortType>;

export const NodeKind = z.enum([
  "prompt",
  "imageInput",
  "generateImage",
  "editImage",
  "result",
]);
export type NodeKind = z.infer<typeof NodeKind>;

export interface PortDef {
  id: string;
  type: PortType;
  /** Whether an inbound edge is required for the graph to be runnable. Defaults to true. */
  required?: boolean;
}

export interface NodeKindDef {
  kind: NodeKind;
  label: string;
  inputs: PortDef[];
  outputs: PortDef[];
  /** Node produces a Job on the backend executor (vs. resolved inline). */
  executable: boolean;
}

export const NODE_KINDS: Record<NodeKind, NodeKindDef> = {
  prompt: {
    kind: "prompt",
    label: "Prompt",
    inputs: [],
    outputs: [{ id: "out", type: "text" }],
    executable: false,
  },
  imageInput: {
    kind: "imageInput",
    label: "Image Input",
    inputs: [],
    outputs: [{ id: "out", type: "image" }],
    executable: false,
  },
  generateImage: {
    kind: "generateImage",
    label: "Generate Image",
    inputs: [{ id: "prompt", type: "text" }],
    outputs: [{ id: "out", type: "image" }],
    executable: true,
  },
  editImage: {
    kind: "editImage",
    label: "Edit Image",
    inputs: [
      { id: "image", type: "image" },
      { id: "prompt", type: "text", required: false },
    ],
    outputs: [{ id: "out", type: "image" }],
    executable: true,
  },
  result: {
    kind: "result",
    label: "Result",
    inputs: [{ id: "in", type: "image" }],
    outputs: [],
    executable: false,
  },
};

function resolveHandle(
  ports: PortDef[],
  handle: string | null | undefined,
): PortDef | undefined {
  if (ports.length === 0) return undefined;
  if (handle == null) return ports[0];
  return ports.find((p) => p.id === handle);
}

export function portType(
  kind: NodeKind,
  side: "inputs" | "outputs",
  handle: string | null | undefined,
): PortType | undefined {
  return resolveHandle(NODE_KINDS[kind][side], handle)?.type;
}

export function portsCompatible(
  source: PortType | undefined,
  target: PortType | undefined,
): boolean {
  return source !== undefined && source === target;
}
