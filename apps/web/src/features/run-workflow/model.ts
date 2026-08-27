import { CreateRunResponse, RetryResponse, RunEvent, validateGraph } from "@repo/contracts";
import { useCallback, useEffect, useRef } from "react";
import { useRunStore } from "@/entities/run";
import { useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";

export function useRunWorkflow() {
  const streamRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
  }, []);

  useEffect(() => closeStream, [closeStream]);

  const openStream = useCallback(
    (runId: string) => {
      const { apply } = useRunStore.getState();
      const stream = new EventSource(api.eventsUrl(`/runs/${runId}/events`));

      stream.addEventListener("message", (message: MessageEvent<string>) => {
        const event = RunEvent.safeParse(JSON.parse(message.data));
        if (event.success) apply(event.data);
      });
      stream.addEventListener("error", closeStream);

      streamRef.current = stream;
    },
    [closeStream],
  );

  const start = useCallback(async () => {
    const { start: startRun, fail } = useRunStore.getState();
    const graph = useWorkflowStore.getState().toGraph();

    const validation = validateGraph(graph);
    if (!validation.ok) {
      fail(validation.errors.join("; "));
      return;
    }

    closeStream();
    try {
      const { runId } = await api.post("/runs", CreateRunResponse, { graph });
      startRun(runId);
      openStream(runId);
    } catch (error) {
      fail(describe(error, "could not start the run"));
    }
  }, [closeStream, openStream]);

  const retry = useCallback(async (jobId: string) => {
    const { runId, fail } = useRunStore.getState();
    if (runId === null) return;

    try {
      await api.post(`/runs/${runId}/jobs/${jobId}/retry`, RetryResponse);
    } catch (error) {
      fail(describe(error, "retry failed"));
    }
  }, []);

  return { start, retry };
}

function describe(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
