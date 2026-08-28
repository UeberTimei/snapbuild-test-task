import type { PortDef } from "@repo/contracts";
import type { HandleType, Position } from "@xyflow/react";

export interface PortHandlesProps {
  ports: PortDef[];
  type: HandleType;
  position: Position;
}
