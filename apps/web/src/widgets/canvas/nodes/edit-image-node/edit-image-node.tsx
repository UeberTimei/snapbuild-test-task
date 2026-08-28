import { NodeShell } from "../../node-shell/node-shell";
import type { NodeComponentProps } from "../node.types";

export function EditImageNode({ id, data, selected }: NodeComponentProps<"editImage">) {
  return (
    <NodeShell id={id} kind="editImage" selected={selected}>
      {data.instruction ? (
        <p className="node__text">{data.instruction}</p>
      ) : (
        <span className="muted">no instruction</span>
      )}
    </NodeShell>
  );
}
