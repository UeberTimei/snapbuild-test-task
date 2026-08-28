import { selectJob, useRunStore } from "@/entities/run";
import { selectUpstreamNodeId, useWorkflowStore } from "@/entities/workflow";
import type { UpstreamResult } from "./result-node.types";

export function useUpstreamResult(nodeId: string): UpstreamResult {
  const upstreamId = useWorkflowStore(selectUpstreamNodeId(nodeId, "in"));
  const job = useRunStore(selectJob(upstreamId ?? ""));

  return { assetId: job?.outputAssetId ?? null, generating: job?.status === "running" };
}
