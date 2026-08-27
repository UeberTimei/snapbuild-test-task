import { inputsOf, outputsOf } from "@repo/contracts";
import { Handle, Position } from "@xyflow/react";
import { nodeLabel } from "@/entities/node";
import { jobTone, selectJob, useRunStore } from "@/entities/run";
import { evenlySpacedPercent } from "@/shared/lib";
import { Badge } from "@/shared/ui";
import type { NodeShellProps, PortHandlesProps } from "./node-shell.types";

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

function PortHandles({ ports, type, position }: PortHandlesProps) {
  return ports.map((port, index) => (
    <Handle
      key={port.id}
      id={port.id}
      type={type}
      position={position}
      className={`handle handle--${port.type}`}
      style={{ top: evenlySpacedPercent(index, ports.length) }}
    />
  ));
}
