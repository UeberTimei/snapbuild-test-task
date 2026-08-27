import { portType, portsCompatible } from "@repo/contracts";
import type { Connection, Edge } from "@xyflow/react";
import type { ConnectableNode } from "./model.types";

export function isValidConnection(
  connection: Connection | Edge,
  nodes: ConnectableNode[],
): boolean {
  if (connection.source === connection.target) return false;

  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  if (!source || !target) return false;

  return portsCompatible(
    portType(source.type, "outputs", connection.sourceHandle),
    portType(target.type, "inputs", connection.targetHandle),
  );
}
