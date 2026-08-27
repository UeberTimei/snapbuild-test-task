import type { NodeKind } from "@repo/contracts";
import type { NodeProps } from "@xyflow/react";
import type { FlowNodeOf } from "@/entities/workflow";

export type NodeComponentProps<K extends NodeKind> = NodeProps<FlowNodeOf<K>>;
