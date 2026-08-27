import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { type WorkflowGraph, validateGraph } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { workflows } from "../db/schema";

export interface WorkflowRecord {
  id: string;
  name: string;
  graph: WorkflowGraph;
  updatedAt: number;
}

@Injectable()
export class WorkflowsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(): WorkflowRecord[] {
    return this.db.select().from(workflows).all().map(toRecord);
  }

  get(id: string): WorkflowRecord | null {
    const row = this.db.select().from(workflows).where(eq(workflows.id, id)).get();
    return row ? toRecord(row) : null;
  }

  create(name: string, graph: WorkflowGraph): WorkflowRecord {
    const row = { id: randomUUID(), name, graphJson: JSON.stringify(graph), updatedAt: Date.now() };
    this.db.insert(workflows).values(row).run();
    return toRecord(row);
  }

  update(id: string, name: string, graph: WorkflowGraph): WorkflowRecord | null {
    const existing = this.get(id);
    if (!existing) return null;
    const patch = { name, graphJson: JSON.stringify(graph), updatedAt: Date.now() };
    this.db.update(workflows).set(patch).where(eq(workflows.id, id)).run();
    return { ...existing, name, graph, updatedAt: patch.updatedAt };
  }

  /** Returns a validated graph or throws with the collected errors. */
  resolveGraph(input: { graph?: WorkflowGraph; workflowId?: string }): WorkflowGraph {
    const graph = input.graph ?? this.get(input.workflowId ?? "")?.graph;
    if (!graph) throw new Error(`workflow ${input.workflowId} not found`);
    const check = validateGraph(graph);
    if (!check.ok) throw new Error(`invalid graph: ${check.errors.join("; ")}`);
    return graph;
  }
}

function toRecord(row: typeof workflows.$inferSelect): WorkflowRecord {
  return {
    id: row.id,
    name: row.name,
    graph: JSON.parse(row.graphJson) as WorkflowGraph,
    updatedAt: row.updatedAt,
  };
}
