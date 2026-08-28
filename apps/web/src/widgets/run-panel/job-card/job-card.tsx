import { nodeLabel } from "@/entities/node";
import { jobTone } from "@/entities/run";
import { api } from "@/shared/api";
import { Badge, Button } from "@/shared/ui";
import type { JobCardProps } from "./job-card.types";

export function JobCard({ job, onRetry }: JobCardProps) {
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
