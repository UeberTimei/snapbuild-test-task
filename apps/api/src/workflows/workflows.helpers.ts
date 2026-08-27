import { WorkflowGraph } from "@repo/contracts";
import type { WorkflowRow } from "../db/db.types";
import type { WorkflowRecord } from "./workflows.types";

export function toWorkflowRecord(row: WorkflowRow): WorkflowRecord {
  return {
    id: row.id,
    name: row.name,
    graph: WorkflowGraph.parse(JSON.parse(row.graphJson)),
    updatedAt: row.updatedAt,
  };
}
