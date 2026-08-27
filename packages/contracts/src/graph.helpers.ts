import type { WorkflowGraph, WorkflowNode } from "./graph";
import type { NodeKind } from "./ports";
import { defaultInputHandle, portType, portsCompatible, requiredInputsOf } from "./ports.helpers";

export function inputKey(nodeId: string, handle: string): string {
  return `${nodeId}:${handle}`;
}

export function kindsById(graph: WorkflowGraph): Map<string, NodeKind> {
  return new Map(graph.nodes.map((node) => [node.id, node.kind]));
}

export function outgoingEdges(graph: WorkflowGraph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(graph.nodes.map((node) => [node.id, []]));
  for (const edge of graph.edges) adjacency.get(edge.source)?.push(edge.target);
  return adjacency;
}

export function connectedInputKeys(graph: WorkflowGraph): Set<string> {
  const nodeKinds = kindsById(graph);
  const keys = new Set<string>();

  for (const edge of graph.edges) {
    const targetKind = nodeKinds.get(edge.target);
    if (!targetKind) continue;

    const handle = edge.targetHandle ?? defaultInputHandle(targetKind);
    if (handle) keys.add(inputKey(edge.target, handle));
  }

  return keys;
}

export function edgeErrors(graph: WorkflowGraph): string[] {
  const nodeKinds = kindsById(graph);
  const errors: string[] = [];
  const occupied = new Set<string>();

  for (const edge of graph.edges) {
    const sourceKind = nodeKinds.get(edge.source);
    const targetKind = nodeKinds.get(edge.target);

    if (!sourceKind) {
      errors.push(`edge ${edge.id}: unknown source node ${edge.source}`);
      continue;
    }
    if (!targetKind) {
      errors.push(`edge ${edge.id}: unknown target node ${edge.target}`);
      continue;
    }

    const source = portType(sourceKind, "outputs", edge.sourceHandle);
    const target = portType(targetKind, "inputs", edge.targetHandle);
    if (!portsCompatible(source, target)) {
      errors.push(`edge ${edge.id}: incompatible ports (${source ?? "?"} -> ${target ?? "?"})`);
      continue;
    }

    const handle = edge.targetHandle ?? defaultInputHandle(targetKind);
    if (!handle) continue;

    const key = inputKey(edge.target, handle);
    if (occupied.has(key)) {
      errors.push(`node ${edge.target}: input port ${handle} has multiple inbound edges`);
    }
    occupied.add(key);
  }

  return errors;
}

export function missingRequiredInputErrors(graph: WorkflowGraph): string[] {
  const connected = connectedInputKeys(graph);

  return graph.nodes.flatMap((node) =>
    requiredInputsOf(node.kind)
      .filter((port) => !connected.has(inputKey(node.id, port.id)))
      .map(
        (port) => `node ${node.id} (${node.kind}): required input "${port.id}" is not connected`,
      ),
  );
}

export function hasCycle(graph: WorkflowGraph): boolean {
  const adjacency = outgoingEdges(graph);
  const onStack = new Set<string>();
  const finished = new Set<string>();

  const reachesItself = (nodeId: string): boolean => {
    if (onStack.has(nodeId)) return true;
    if (finished.has(nodeId)) return false;

    onStack.add(nodeId);
    const cyclic = (adjacency.get(nodeId) ?? []).some(reachesItself);
    onStack.delete(nodeId);
    finished.add(nodeId);
    return cyclic;
  };

  return graph.nodes.some((node) => reachesItself(node.id));
}

export function topoOrder(graph: WorkflowGraph): string[] {
  const adjacency = outgoingEdges(graph);
  const indegree = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) {
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const ready = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id);
  const order: string[] = [];

  while (ready.length > 0) {
    const nodeId = ready.shift();
    if (nodeId === undefined) break;
    order.push(nodeId);

    for (const next of adjacency.get(nodeId) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }

  return order;
}

export function dependenciesOf(graph: WorkflowGraph, nodeId: string): string[] {
  return graph.edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source);
}

export function findNode(graph: WorkflowGraph, nodeId: string): WorkflowNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function descendantsOf(graph: WorkflowGraph, nodeId: string): Set<string> {
  const adjacency = outgoingEdges(graph);
  const reached = new Set<string>([nodeId]);
  const pending = [nodeId];

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;

    for (const next of adjacency.get(current) ?? []) {
      if (reached.has(next)) continue;
      reached.add(next);
      pending.push(next);
    }
  }

  return reached;
}
