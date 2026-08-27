import type { NodeKind } from "@repo/contracts";
import { Handle, Position } from "@xyflow/react";
import type { ReactNode } from "react";
import { jobTone, selectJob, useRunStore } from "@/entities/run";
import { inputsOf, nodeMeta, outputsOf } from "@/entities/node";
import { Badge } from "@/shared/ui";

/** Common chrome for every node: title, typed handles, live job status. */
export function NodeShell({
  id,
  kind,
  selected,
  children,
}: {
  id: string;
  kind: NodeKind;
  selected?: boolean;
  children?: ReactNode;
}) {
  const job = useRunStore(selectJob(id));
  const meta = nodeMeta(kind);

  return (
    <div className={`node node--${kind} ${selected ? "node--selected" : ""}`}>
      {inputsOf(kind).map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          className={`handle handle--${port.type}`}
          style={{ top: handleOffset(index, inputsOf(kind).length) }}
        />
      ))}

      <header className="node__head">
        <span className="node__title">{meta.label}</span>
        {job && <Badge tone={jobTone(job.status)}>{job.status}</Badge>}
      </header>

      <div className="node__body">{children}</div>

      {outputsOf(kind).map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          className={`handle handle--${port.type}`}
          style={{ top: handleOffset(index, outputsOf(kind).length) }}
        />
      ))}
    </div>
  );
}

/** Spread multiple handles evenly down the node's edge. */
function handleOffset(index: number, total: number): string {
  return `${((index + 1) / (total + 1)) * 100}%`;
}
