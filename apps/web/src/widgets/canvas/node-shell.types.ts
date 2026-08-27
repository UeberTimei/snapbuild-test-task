import type { NodeKind, PortDef } from "@repo/contracts";
import type { HandleType, Position } from "@xyflow/react";
import type { ReactNode } from "react";

export interface NodeShellProps {
  id: string;
  kind: NodeKind;
  selected?: boolean;
  children?: ReactNode;
}

export interface PortHandlesProps {
  ports: PortDef[];
  type: HandleType;
  position: Position;
}
