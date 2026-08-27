import { portType, portsCompatible, type NodeKind } from "@repo/contracts";
import type { Connection, Edge, Node } from "@xyflow/react";

/**
 * Connection rule for the canvas: ports must carry the same type (text/image)
 * and a node may not connect to itself. The rule comes from @repo/contracts so
 * the canvas and the backend validator cannot drift apart.
 */
export function isValidConnection(
  connection: Connection | Edge,
  nodes: Pick<Node, "id" | "type">[],
): boolean {
  if (connection.source === connection.target) return false;

  const sourceKind = nodes.find((n) => n.id === connection.source)?.type as NodeKind | undefined;
  const targetKind = nodes.find((n) => n.id === connection.target)?.type as NodeKind | undefined;
  if (!sourceKind || !targetKind) return false;

  return portsCompatible(
    portType(sourceKind, "outputs", connection.sourceHandle),
    portType(targetKind, "inputs", connection.targetHandle),
  );
}
