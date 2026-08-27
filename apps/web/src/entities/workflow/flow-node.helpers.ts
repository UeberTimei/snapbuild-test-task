import type { WorkflowEdge, WorkflowNode } from "@repo/contracts";
import type { FlowEdge, FlowNode } from "./flow-node.types";

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

export function toWorkflowEdge(edge: FlowEdge): WorkflowEdge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? null,
    target: edge.target,
    targetHandle: edge.targetHandle ?? null,
  };
}
