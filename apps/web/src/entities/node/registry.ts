import type { NodeDataByKind, NodeKind } from "@repo/contracts";
import { NODE_META } from "./registry.constants";

export function nodeLabel(kind: NodeKind): string {
  return NODE_META[kind].label;
}

export function nodeHint(kind: NodeKind): string {
  return NODE_META[kind].hint;
}

export function defaultDataFor<K extends NodeKind>(kind: K): NodeDataByKind[K] {
  return structuredClone(NODE_META[kind].defaultData);
}
