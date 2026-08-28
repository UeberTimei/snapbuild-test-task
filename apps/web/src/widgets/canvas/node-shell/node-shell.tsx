import { inputsOf, outputsOf } from "@repo/contracts";
import { Position } from "@xyflow/react";
import { nodeLabel } from "@/entities/node";
import { jobTone, selectJob, useRunStore } from "@/entities/run";
import { Badge } from "@/shared/ui";
import { PortHandles } from "../port-handles/port-handles";
import type { NodeShellProps } from "./node-shell.types";

export function NodeShell({ id, kind, selected, children }: NodeShellProps) {
  const job = useRunStore(selectJob(id));

  return (
    <div className={`node node--${kind} ${selected ? "node--selected" : ""}`}>
      <PortHandles ports={inputsOf(kind)} type="target" position={Position.Left} />

      <header className="node__head">
        <span className="node__title">{nodeLabel(kind)}</span>
        {job && <Badge tone={jobTone(job.status)}>{job.status}</Badge>}
      </header>

      <div className="node__body">{children}</div>

      <PortHandles ports={outputsOf(kind)} type="source" position={Position.Right} />
    </div>
  );
}
