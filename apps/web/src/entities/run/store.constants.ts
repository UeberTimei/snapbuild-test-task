import type { RunSnapshot } from "./store.types";

export const IDLE_RUN: RunSnapshot = {
  runId: null,
  status: null,
  jobs: {},
  error: null,
};
