import type { NodeKind } from "@repo/contracts";
import type { Connection, XYPosition } from "@xyflow/react";
import { defaultDataFor } from "@/entities/node";
import type { FlowEdge, FlowNode } from "./flow-node.types";

let nodeCounter = 0;

export function nextNodeId(kind: NodeKind): string {
  nodeCounter += 1;
  return `${kind}-${nodeCounter}`;
}

export function createFlowNode(kind: NodeKind, position: XYPosition): FlowNode {
  const id = nextNodeId(kind);

  switch (kind) {
    case "prompt":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "imageInput":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "generateImage":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "editImage":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "result":
      return { id, position, type: kind, data: defaultDataFor(kind) };
  }
}

export function feedsAnotherPort(connection: Connection): (edge: FlowEdge) => boolean {
  return (edge) =>
    edge.target !== connection.target || edge.targetHandle !== connection.targetHandle;
}

export function selectedNodeIds(nodes: FlowNode[]): Set<string> {
  return new Set(nodes.filter((node) => node.selected).map((node) => node.id));
}
