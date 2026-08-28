import type { NodeKind } from "@repo/contracts";
import type { ReactNode } from "react";

export interface NodeShellProps {
  id: string;
  kind: NodeKind;
  selected?: boolean;
  children?: ReactNode;
}
