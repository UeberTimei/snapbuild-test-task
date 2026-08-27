import { NODE_KINDS } from "./constants";
import type { NodeKind, PortType } from "./ports";
import type { PortDef, PortSide } from "./ports.types";

export function requiredInputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].inputs.filter((port) => port.required);
}

export function inputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].inputs;
}

export function outputsOf(kind: NodeKind): PortDef[] {
  return NODE_KINDS[kind].outputs;
}

export function labelOf(kind: NodeKind): string {
  return NODE_KINDS[kind].label;
}

export function producesJob(kind: NodeKind): boolean {
  return NODE_KINDS[kind].producesJob;
}

export function hasSingleInput(kind: NodeKind): boolean {
  return NODE_KINDS[kind].inputs.length === 1;
}

export function defaultInputHandle(kind: NodeKind): string | undefined {
  return NODE_KINDS[kind].inputs[0]?.id;
}

export function portType(
  kind: NodeKind,
  side: PortSide,
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

function resolvePort(ports: PortDef[], handle: string | null | undefined): PortDef | undefined {
  if (handle == null) return ports.length === 1 ? ports[0] : undefined;
  return ports.find((port) => port.id === handle);
}
