import type { JobStatus } from "@repo/contracts";

const TONE_BY_STATUS: Record<JobStatus, string> = {
  idle: "idle",
  queued: "queued",
  running: "running",
  success: "success",
  error: "error",
};

export function jobTone(status: JobStatus | undefined): string {
  return status ? TONE_BY_STATUS[status] : "idle";
}
