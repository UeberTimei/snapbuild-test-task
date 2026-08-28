import { api } from "@/shared/api";
import { NodeShell } from "../../node-shell/node-shell";
import type { NodeComponentProps } from "../node.types";

export function ImageInputNode({ id, data, selected }: NodeComponentProps<"imageInput">) {
  return (
    <NodeShell id={id} kind="imageInput" selected={selected}>
      {data.assetId === null ? (
        <span className="muted">no image uploaded</span>
      ) : (
        <img className="node__image" src={api.assetUrl(data.assetId)} alt="source" />
      )}
    </NodeShell>
  );
}
