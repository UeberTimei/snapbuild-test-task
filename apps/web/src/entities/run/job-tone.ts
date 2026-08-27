import type { JobStatus } from "@repo/contracts";

/** Visual tone for a job status, shared by the canvas badges and the run panel. */
export function jobTone(status: JobStatus | undefined): string {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "success":
      return "success";
    case "error":
      return "error";
    default:
      return "idle";
  }
}
