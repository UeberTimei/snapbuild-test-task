import type { JobStatus } from "@repo/contracts";
import { DEFAULT_TONE, TONE_BY_STATUS } from "./job-tone.constants";

export function jobTone(status: JobStatus | undefined): string {
  return status ? TONE_BY_STATUS[status] : DEFAULT_TONE;
}
