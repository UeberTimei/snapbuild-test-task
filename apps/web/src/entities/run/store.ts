import type { JobDto, RunDto, RunEvent, RunStatus } from "@repo/contracts";
import { create } from "zustand";

type JobsByNodeId = Record<string, JobDto>;

interface RunStore {
  runId: string | null;
  status: RunStatus | null;
  jobs: JobsByNodeId;
  error: string | null;

  start: (runId: string) => void;
  apply: (event: RunEvent) => void;
  fail: (message: string) => void;
  reset: () => void;
}

const IDLE = { runId: null, status: null, jobs: {}, error: null } satisfies Omit<
  RunStore,
  "start" | "apply" | "fail" | "reset"
>;

export const useRunStore = create<RunStore>((set) => ({
  ...IDLE,

  start: (runId) => set({ ...IDLE, runId, status: "queued" }),

  apply: (event) =>
    set((state) =>
      event.type === "job"
        ? { jobs: { ...state.jobs, [event.job.nodeId]: event.job } }
        : { status: event.run.status, jobs: indexByNodeId(event.run) },
    ),

  fail: (error) => set({ error, status: "failed" }),

  reset: () => set(IDLE),
}));

function indexByNodeId(run: RunDto): JobsByNodeId {
  return Object.fromEntries(run.jobs.map((job) => [job.nodeId, job]));
}

export const selectJob =
  (nodeId: string) =>
  (state: RunStore): JobDto | undefined =>
    state.jobs[nodeId];

export const selectIsRunning = (state: RunStore): boolean =>
  state.status === "queued" || state.status === "running";
