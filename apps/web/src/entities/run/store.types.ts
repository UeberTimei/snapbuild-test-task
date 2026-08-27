import type { JobDto, RunEvent, RunStatus } from "@repo/contracts";

export type JobsByNodeId = Record<string, JobDto>;

export interface RunSnapshot {
  runId: string | null;
  status: RunStatus | null;
  jobs: JobsByNodeId;
  error: string | null;
}

export interface RunStore extends RunSnapshot {
  start: (runId: string) => void;
  apply: (event: RunEvent) => void;
  fail: (message: string) => void;
  reset: () => void;
}
