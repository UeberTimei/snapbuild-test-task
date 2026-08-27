import type { NodeKind } from "@repo/contracts";

export interface ConnectableNode {
  id: string;
  type: NodeKind;
}
