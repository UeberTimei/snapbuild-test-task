import type { JobStatus } from "@repo/contracts";

export const DEFAULT_TONE = "idle";

export const TONE_BY_STATUS: Record<JobStatus, string> = {
  idle: "idle",
  queued: "queued",
  running: "running",
  success: "success",
  error: "error",
};
