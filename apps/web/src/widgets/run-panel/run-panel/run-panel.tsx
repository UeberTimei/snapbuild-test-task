import { selectIsRunning, useJobList, useRunStore } from "@/entities/run";
import { demoGraph, useWorkflowStore } from "@/entities/workflow";
import { useRunWorkflow } from "@/features/run-workflow";
import { Badge, Button, Empty, Panel } from "@/shared/ui";
import { JobCard } from "../job-card/job-card";

export function RunPanel() {
  const { start, retry } = useRunWorkflow();
  const status = useRunStore((state) => state.status);
  const error = useRunStore((state) => state.error);
  const jobs = useJobList();
  const running = useRunStore(selectIsRunning);
  const replaceGraph = useWorkflowStore((state) => state.replaceGraph);

  return (
    <Panel
      title="Run"
      actions={
        <div className="row">
          <Button title="Load the branching demo graph" onClick={() => replaceGraph(demoGraph)}>
            Reset graph
          </Button>
          <Button variant="primary" disabled={running} onClick={() => void start()}>
            {running ? "Running…" : "Run workflow"}
          </Button>
        </div>
      }
    >
      {status && (
        <p className="run-status">
          Status: <Badge tone={status}>{status}</Badge>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {jobs.length === 0 ? (
        <Empty>No jobs yet. Run the workflow to see per-node progress.</Empty>
      ) : (
        <ul className="jobs">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onRetry={() => void retry(job.id)} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
