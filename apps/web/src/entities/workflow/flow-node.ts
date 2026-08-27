import type { NodeDataByKind, NodeKind, WorkflowNode } from "@repo/contracts";
import type { Edge, Node } from "@xyflow/react";

export type FlowNodeOf<K extends NodeKind> = Node<NodeDataByKind[K], K>;

export type FlowNode = { [K in NodeKind]: FlowNodeOf<K> }[NodeKind];

export type FlowEdge = Edge;

export function toFlowNode(node: WorkflowNode): FlowNode {
  const { id, position } = node;
  switch (node.kind) {
    case "prompt":
      return { id, position, type: node.kind, data: node.data };
    case "imageInput":
      return { id, position, type: node.kind, data: node.data };
    case "generateImage":
      return { id, position, type: node.kind, data: node.data };
    case "editImage":
      return { id, position, type: node.kind, data: node.data };
    case "result":
      return { id, position, type: node.kind, data: node.data };
  }
}

export function toWorkflowNode(node: FlowNode): WorkflowNode {
  const { id, position } = node;
  switch (node.type) {
    case "prompt":
      return { id, position, kind: node.type, data: node.data };
    case "imageInput":
      return { id, position, kind: node.type, data: node.data };
    case "generateImage":
      return { id, position, kind: node.type, data: node.data };
    case "editImage":
      return { id, position, kind: node.type, data: node.data };
    case "result":
      return { id, position, kind: node.type, data: node.data };
  }
}
