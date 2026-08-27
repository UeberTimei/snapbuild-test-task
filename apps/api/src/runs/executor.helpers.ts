import { hasSingleInput, type RunStatus, type WorkflowNode } from "@repo/contracts";
import type { RunState } from "./run-state";
import type { NodeOutput } from "./run-state.types";

export function settledStatus(run: RunState): RunStatus {
  return run.jobs.every((job) => job.status === "success") ? "completed" : "failed";
}

export function inputOf(run: RunState, node: WorkflowNode, handle: string): NodeOutput | undefined {
  const acceptsUnlabelledEdge = hasSingleInput(node.kind);

  const edge = run.graph.edges.find(
    (candidate) =>
      candidate.target === node.id &&
      (candidate.targetHandle === handle ||
        (candidate.targetHandle === null && acceptsUnlabelledEdge)),
  );

  return edge ? run.outputsByNodeId.get(edge.source) : undefined;
}
