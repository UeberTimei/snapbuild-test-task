import type { JobDto, RunDto, RunEvent, RunStatus } from "@repo/contracts";
import { create } from "zustand";

interface RunStore {
  runId: string | null;
  status: RunStatus | null;
  jobs: Record<string, JobDto>; // keyed by nodeId
  error: string | null;

  start: (runId: string) => void;
  apply: (event: RunEvent) => void;
  fail: (message: string) => void;
  reset: () => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runId: null,
  status: null,
  jobs: {},
  error: null,

  start: (runId) => set({ runId, status: "queued", jobs: {}, error: null }),

  apply: (event) =>
    set((s) => {
      if (event.type === "job") {
        return { jobs: { ...s.jobs, [event.job.nodeId]: event.job } };
      }
      return { status: event.run.status, jobs: byNodeId(event.run) };
    }),

  fail: (error) => set({ error, status: "failed" }),

  reset: () => set({ runId: null, status: null, jobs: {}, error: null }),
}));

function byNodeId(run: RunDto): Record<string, JobDto> {
  return Object.fromEntries(run.jobs.map((job) => [job.nodeId, job]));
}

export const selectJob = (nodeId: string) => (s: RunStore) => s.jobs[nodeId];
export const selectIsRunning = (s: RunStore) => s.status === "queued" || s.status === "running";
