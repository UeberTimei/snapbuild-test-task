import { validateGraph, type CreateRunResponse, type RunEvent } from "@repo/contracts";
import { useCallback, useEffect, useRef } from "react";
import { useRunStore } from "@/entities/run";
import { useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";

/**
 * Starts a run for the current canvas graph and streams its progress over SSE
 * into the run store. Validation happens client-side first so an incomplete
 * graph gives immediate feedback instead of a round trip.
 */
export function useRunWorkflow() {
  const source = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    source.current?.close();
    source.current = null;
  }, []);

  useEffect(() => close, [close]);

  const start = useCallback(async () => {
    const { start: startRun, apply, fail } = useRunStore.getState();
    const graph = useWorkflowStore.getState().toGraph();

    const check = validateGraph(graph);
    if (!check.ok) {
      fail(check.errors.join("; "));
      return;
    }

    close();
    try {
      const { runId } = await api.post<CreateRunResponse>("/runs", { graph });
      startRun(runId);

      const stream = new EventSource(api.eventsUrl(`/runs/${runId}/events`));
      source.current = stream;
      stream.addEventListener("message", (message) => apply(JSON.parse(message.data) as RunEvent));
      // EventSource surfaces both a server close and a transport failure here;
      // the run store already holds the last known state, so just stop retrying.
      stream.addEventListener("error", () => close());
    } catch (err) {
      fail(err instanceof Error ? err.message : "could not start the run");
    }
  }, [close]);

  const retry = useCallback(async (jobId: string) => {
    const { runId, fail } = useRunStore.getState();
    if (!runId) return;
    try {
      await api.post(`/runs/${runId}/jobs/${jobId}/retry`);
    } catch (err) {
      fail(err instanceof Error ? err.message : "retry failed");
    }
  }, []);

  return { start, retry };
}
