import type { JobDto, RunDto, RunEvent, RunStatus, WorkflowGraph } from "@repo/contracts";
import type { NodeOutput, RunEventListener, Unsubscribe } from "./run-state.types";

export class RunState {
  private readonly listeners = new Set<RunEventListener>();
  readonly jobsByNodeId = new Map<string, JobDto>();
  readonly outputsByNodeId = new Map<string, NodeOutput>();
  status: RunStatus = "queued";

  constructor(
    readonly id: string,
    readonly graph: WorkflowGraph,
    readonly createdAt: number,
  ) {}

  get jobs(): JobDto[] {
    return [...this.jobsByNodeId.values()];
  }

  toDto(): RunDto {
    return {
      id: this.id,
      status: this.status,
      createdAt: new Date(this.createdAt).toISOString(),
      jobs: this.jobs,
    };
  }

  findJobById(jobId: string): JobDto | undefined {
    return this.jobs.find((job) => job.id === jobId);
  }

  jobFor(nodeId: string): JobDto | undefined {
    return this.jobsByNodeId.get(nodeId);
  }

  onEvent(listener: RunEventListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: RunEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  setStatus(status: RunStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit({ type: "run", run: this.toDto() });
  }

  patchJob(nodeId: string, patch: Partial<JobDto>): JobDto {
    const job = this.jobsByNodeId.get(nodeId);
    if (!job) throw new Error(`no job for node ${nodeId}`);

    const updated = { ...job, ...patch };
    this.jobsByNodeId.set(nodeId, updated);
    this.emit({ type: "job", job: updated });
    return updated;
  }
}
