import type { NodeDataByKind, NodeKind } from "@repo/contracts";

export interface NodeMeta<K extends NodeKind> {
  label: string;
  hint: string;
  defaultData: NodeDataByKind[K];
}

export type NodeMetaByKind = { [K in NodeKind]: NodeMeta<K> };
