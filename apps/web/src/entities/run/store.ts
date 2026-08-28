import type { JobDto } from "@repo/contracts";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { IDLE_RUN } from "./store.constants";
import { indexJobsByNodeId } from "./store.helpers";
import type { RunStore } from "./store.types";

export const useRunStore = create<RunStore>((set) => ({
  ...IDLE_RUN,

  start: (runId) => set({ ...IDLE_RUN, runId, status: "queued" }),

  apply: (event) =>
    set((state) =>
      event.type === "job"
        ? { jobs: { ...state.jobs, [event.job.nodeId]: event.job } }
        : { status: event.run.status, jobs: indexJobsByNodeId(event.run) },
    ),

  fail: (error) => set({ error, status: "failed" }),

  reset: () => set(IDLE_RUN),
}));

export const selectJob =
  (nodeId: string) =>
  (state: RunStore): JobDto | undefined =>
    state.jobs[nodeId];

const selectJobList = (state: RunStore): JobDto[] => Object.values(state.jobs);

export const useJobList = (): JobDto[] => useRunStore(useShallow(selectJobList));

export const selectIsRunning = (state: RunStore): boolean =>
  state.status === "queued" || state.status === "running";
