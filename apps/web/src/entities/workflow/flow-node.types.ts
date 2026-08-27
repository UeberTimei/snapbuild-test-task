import type { NodeDataByKind, NodeKind } from "@repo/contracts";
import type { Edge, Node } from "@xyflow/react";

export type FlowNodeOf<K extends NodeKind> = Node<NodeDataByKind[K], K>;

export type FlowNode = { [K in NodeKind]: FlowNodeOf<K> }[NodeKind];

export type FlowEdge = Edge;
