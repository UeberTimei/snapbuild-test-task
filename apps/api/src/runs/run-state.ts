import { EventEmitter } from "node:events";
import type { JobDto, RunDto, RunEvent, RunStatus, WorkflowGraph } from "@repo/contracts";

/** What a resolved node hands to its downstream nodes. */
export type NodeOutput = { type: "text"; value: string } | { type: "image"; assetId: string };

export class RunState {
  readonly events = new EventEmitter();
  readonly jobs = new Map<string, JobDto>(); // nodeId -> job
  readonly outputs = new Map<string, NodeOutput>(); // nodeId -> resolved output
  status: RunStatus = "queued";

  constructor(
    readonly id: string,
    readonly graph: WorkflowGraph,
    readonly createdAt: number,
  ) {}

  toDto(): RunDto {
    return {
      id: this.id,
      status: this.status,
      createdAt: new Date(this.createdAt).toISOString(),
      jobs: [...this.jobs.values()],
    };
  }

  emit(event: RunEvent): void {
    this.events.emit("event", event);
  }

  setStatus(status: RunStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit({ type: "run", run: this.toDto() });
  }

  patchJob(nodeId: string, patch: Partial<JobDto>): JobDto {
    const job = this.jobs.get(nodeId);
    if (!job) throw new Error(`no job for node ${nodeId}`);
    const next = { ...job, ...patch };
    this.jobs.set(nodeId, next);
    this.emit({ type: "job", job: next });
    return next;
  }
}
