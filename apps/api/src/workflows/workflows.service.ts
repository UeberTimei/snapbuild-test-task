import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { WorkflowGraph, validateGraph } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { workflows } from "../db/schema";

type WorkflowRow = typeof workflows.$inferSelect;

export interface WorkflowRecord {
  id: string;
  name: string;
  graph: WorkflowGraph;
  updatedAt: number;
}

export class InvalidGraphError extends Error {}
export class WorkflowNotFoundError extends Error {}

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
    const row = {
      id: randomUUID(),
      name,
      graphJson: JSON.stringify(graph),
      updatedAt: Date.now(),
    };
    this.db.insert(workflows).values(row).run();
    return toRecord(row);
  }

  update(id: string, name: string, graph: WorkflowGraph): WorkflowRecord | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updatedAt = Date.now();
    this.db
      .update(workflows)
      .set({ name, graphJson: JSON.stringify(graph), updatedAt })
      .where(eq(workflows.id, id))
      .run();
    return { id, name, graph, updatedAt };
  }

  resolveRunnableGraph(request: { graph?: WorkflowGraph; workflowId?: string }): WorkflowGraph {
    const graph = request.graph ?? this.requireWorkflow(request.workflowId).graph;
    const validation = validateGraph(graph);
    if (!validation.ok) {
      throw new InvalidGraphError(`invalid graph: ${validation.errors.join("; ")}`);
    }
    return graph;
  }

  private requireWorkflow(workflowId: string | undefined): WorkflowRecord {
    const workflow = workflowId ? this.get(workflowId) : null;
    if (!workflow) throw new WorkflowNotFoundError(`workflow ${workflowId} not found`);
    return workflow;
  }
}

function toRecord(row: WorkflowRow): WorkflowRecord {
  return {
    id: row.id,
    name: row.name,
    graph: WorkflowGraph.parse(JSON.parse(row.graphJson)),
    updatedAt: row.updatedAt,
  };
}
