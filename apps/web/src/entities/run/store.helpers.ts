import type { RunDto } from "@repo/contracts";
import type { JobsByNodeId } from "./store.types";

export function indexJobsByNodeId(run: RunDto): JobsByNodeId {
  return Object.fromEntries(run.jobs.map((job) => [job.nodeId, job]));
}
