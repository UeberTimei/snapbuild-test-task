import type { NodeKind, PortType } from "./ports";

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

export type PortSide = "inputs" | "outputs";
