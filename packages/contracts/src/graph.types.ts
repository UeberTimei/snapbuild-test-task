import type { z } from "zod";
import type { NODE_DATA_SCHEMAS, WorkflowNode } from "./graph";
import type { NodeKind } from "./ports";

export type NodeDataByKind = {
  [K in NodeKind]: z.infer<(typeof NODE_DATA_SCHEMAS)[K]>;
};

export type NodeOfKind<K extends NodeKind> = Extract<WorkflowNode, { kind: K }>;

export type GraphValidation = { ok: true } | { ok: false; errors: string[] };
