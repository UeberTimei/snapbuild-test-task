import { jobTone, selectIsRunning, useRunStore } from "@/entities/run";
import { nodeMeta } from "@/entities/node";
import { demoGraph, useWorkflowStore } from "@/entities/workflow";
import { useRunWorkflow } from "@/features/run-workflow";
import { api } from "@/shared/api";
import { Badge, Button, Empty, Panel } from "@/shared/ui";
import type { NodeKind } from "@repo/contracts";

export function RunPanel() {
  const { start, retry } = useRunWorkflow();
  const status = useRunStore((s) => s.status);
  const jobs = useRunStore((s) => s.jobs);
  const error = useRunStore((s) => s.error);
  const running = useRunStore(selectIsRunning);
  const replaceGraph = useWorkflowStore((s) => s.replaceGraph);

  const jobList = Object.values(jobs);

  return (
    <Panel
      title="Run"
      actions={
        <div className="row">
          <Button onClick={() => replaceGraph(demoGraph)} title="Load the branching demo graph">
            Reset graph
          </Button>
          <Button variant="primary" onClick={() => void start()} disabled={running}>
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
            <li key={job.id} className="job">
              <div className="job__head">
                <span>{nodeMeta(job.kind as NodeKind).label}</span>
                <Badge tone={jobTone(job.status)}>{job.status}</Badge>
              </div>
              <span className="muted">
                {job.nodeId}
                {job.attempts > 1 && ` · attempt ${job.attempts}`}
              </span>
              {job.error && <p className="error">{job.error}</p>}
              {job.status === "error" && (
                <Button variant="danger" onClick={() => void retry(job.id)}>
                  Retry node
                </Button>
              )}
              {job.outputAssetId && (
                <img className="preview" src={api.assetUrl(job.outputAssetId)} alt="job output" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
