import type { NodeKind, PortDef } from "@repo/contracts";
import { Handle, Position, type HandleType } from "@xyflow/react";
import type { ReactNode } from "react";
import { jobTone, selectJob, useRunStore } from "@/entities/run";
import { inputsOf, nodeLabel, outputsOf } from "@/entities/node";
import { Badge } from "@/shared/ui";

interface NodeShellProps {
  id: string;
  kind: NodeKind;
  selected?: boolean;
  children?: ReactNode;
}

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

interface PortHandlesProps {
  ports: PortDef[];
  type: HandleType;
  position: Position;
}

function PortHandles({ ports, type, position }: PortHandlesProps) {
  return ports.map((port, index) => (
    <Handle
      key={port.id}
      id={port.id}
      type={type}
      position={position}
      className={`handle handle--${port.type}`}
      style={{ top: evenlySpaced(index, ports.length) }}
    />
  ));
}

function evenlySpaced(index: number, total: number): string {
  return `${((index + 1) / (total + 1)) * 100}%`;
}
