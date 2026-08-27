import { nodeLabel } from "@/entities/node";
import { jobTone, selectIsRunning, useRunStore } from "@/entities/run";
import { demoGraph, useWorkflowStore } from "@/entities/workflow";
import { useRunWorkflow } from "@/features/run-workflow";
import { api } from "@/shared/api";
import { Badge, Button, Empty, Panel } from "@/shared/ui";
import type { JobCardProps } from "./run-panel.types";

export function RunPanel() {
  const { start, retry } = useRunWorkflow();
  const status = useRunStore((state) => state.status);
  const jobs = useRunStore((state) => state.jobs);
  const error = useRunStore((state) => state.error);
  const running = useRunStore(selectIsRunning);
  const replaceGraph = useWorkflowStore((state) => state.replaceGraph);

  const jobList = Object.values(jobs);

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

      {jobList.length === 0 ? (
        <Empty>No jobs yet. Run the workflow to see per-node progress.</Empty>
      ) : (
        <ul className="jobs">
          {jobList.map((job) => (
            <JobCard key={job.id} job={job} onRetry={() => void retry(job.id)} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function JobCard({ job, onRetry }: JobCardProps) {
  return (
    <li className="job">
      <div className="job__head">
        <span>{nodeLabel(job.kind)}</span>
        <Badge tone={jobTone(job.status)}>{job.status}</Badge>
      </div>

      <span className="muted">
        {job.nodeId}
        {job.attempts > 1 && ` · attempt ${job.attempts}`}
      </span>

      {job.error && <p className="error">{job.error}</p>}

      {job.status === "error" && (
        <Button variant="danger" onClick={onRetry}>
          Retry node
        </Button>
      )}

      {job.outputAssetId !== null && (
        <img className="preview" src={api.assetUrl(job.outputAssetId)} alt="job output" />
      )}
    </li>
  );
}
