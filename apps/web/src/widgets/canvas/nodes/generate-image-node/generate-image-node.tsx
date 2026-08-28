import { NodeShell } from "../../node-shell/node-shell";
import type { NodeComponentProps } from "../node.types";

export function GenerateImageNode({ id, data, selected }: NodeComponentProps<"generateImage">) {
  return (
    <NodeShell id={id} kind="generateImage" selected={selected}>
      <span className="muted">{data.presetId ? `preset: ${data.presetId}` : "no preset"}</span>
    </NodeShell>
  );
}
