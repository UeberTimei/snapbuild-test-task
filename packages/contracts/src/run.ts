import { z } from "zod";
import { WorkflowGraph } from "./graph";

export const JobStatus = z.enum(["idle", "queued", "running", "success", "error"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const RunStatus = z.enum(["queued", "running", "completed", "failed"]);
export type RunStatus = z.infer<typeof RunStatus>;

export const JobDto = z.object({
  id: z.string(),
  nodeId: z.string(),
  kind: z.string(),
  status: JobStatus,
  attempts: z.number().int(),
  error: z.string().nullable(),
  outputAssetId: z.string().nullable(),
});
export type JobDto = z.infer<typeof JobDto>;

export const RunDto = z.object({
  id: z.string(),
  status: RunStatus,
  createdAt: z.string(),
  jobs: z.array(JobDto),
});
export type RunDto = z.infer<typeof RunDto>;

export const RunEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("run"), run: RunDto }),
  z.object({ type: z.literal("job"), job: JobDto }),
]);
export type RunEvent = z.infer<typeof RunEvent>;

export const CreateRunRequest = z
  .object({
    graph: WorkflowGraph.optional(),
    workflowId: z.string().optional(),
  })
  .refine((v) => v.graph !== undefined || v.workflowId !== undefined, {
    message: "either graph or workflowId is required",
  });
export type CreateRunRequest = z.infer<typeof CreateRunRequest>;

export const CreateRunResponse = z.object({ runId: z.string() });
export type CreateRunResponse = z.infer<typeof CreateRunResponse>;
