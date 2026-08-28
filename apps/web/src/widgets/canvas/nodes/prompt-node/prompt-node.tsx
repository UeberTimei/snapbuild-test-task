import { NodeShell } from "../../node-shell/node-shell";
import type { NodeComponentProps } from "../node.types";

export function PromptNode({ id, data, selected }: NodeComponentProps<"prompt">) {
  return (
    <NodeShell id={id} kind="prompt" selected={selected}>
      {data.text ? (
        <p className="node__text">{data.text}</p>
      ) : (
        <span className="muted">empty prompt</span>
      )}
    </NodeShell>
  );
}
