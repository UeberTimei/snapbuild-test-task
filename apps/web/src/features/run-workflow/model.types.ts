export interface UseRunWorkflowResult {
  start: () => Promise<void>;
  retry: (jobId: string) => Promise<void>;
}
