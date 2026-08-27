import { WorkflowGraph } from "@repo/contracts";
import { z } from "zod";

export interface WorkflowRecord {
  id: string;
  name: string;
  graph: WorkflowGraph;
  updatedAt: number;
}

export interface ResolveGraphRequest {
  graph?: WorkflowGraph;
  workflowId?: string;
}

export const SaveWorkflowRequest = z.object({ name: z.string().min(1), graph: WorkflowGraph });
export type SaveWorkflowRequest = z.infer<typeof SaveWorkflowRequest>;
