import type { NodeProps } from "@xyflow/react";
import { selectJob, useRunStore } from "@/entities/run";
import { selectUpstreamNodeId, useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";
import { Empty } from "@/shared/ui";
import { NodeShell } from "./node-shell";

export function PromptNode({ id, data, selected }: NodeProps) {
  const text = String(data.text ?? "");
  return (
    <NodeShell id={id} kind="prompt" selected={selected}>
      <p className="node__text">{text || <span className="muted">empty prompt</span>}</p>
    </NodeShell>
  );
}

export function ImageInputNode({ id, data, selected }: NodeProps) {
  const assetId = data.assetId as string | null;
  return (
    <NodeShell id={id} kind="imageInput" selected={selected}>
      {assetId ? (
        <img className="node__image" src={api.assetUrl(assetId)} alt="source" />
      ) : (
        <span className="muted">no image uploaded</span>
      )}
    </NodeShell>
  );
}

export function GenerateImageNode({ id, data, selected }: NodeProps) {
  const presetId = data.presetId as string | null;
  return (
    <NodeShell id={id} kind="generateImage" selected={selected}>
      <span className="muted">{presetId ? `preset: ${presetId}` : "no preset"}</span>
    </NodeShell>
  );
}

export function EditImageNode({ id, data, selected }: NodeProps) {
  const instruction = String(data.instruction ?? "");
  return (
    <NodeShell id={id} kind="editImage" selected={selected}>
      <p className="node__text">{instruction || <span className="muted">no instruction</span>}</p>
    </NodeShell>
  );
}

export function ResultNode({ id, selected }: NodeProps) {
  // A result node has no job of its own — it mirrors whatever its upstream produced.
  const upstreamId = useWorkflowStore(selectUpstreamNodeId(id, "in"));
  const upstreamJob = useRunStore(selectJob(upstreamId ?? ""));
  const assetId = upstreamJob?.outputAssetId;

  return (
    <NodeShell id={id} kind="result" selected={selected}>
      {assetId ? (
        <img className="node__image" src={api.assetUrl(assetId)} alt="result" />
      ) : (
        <Empty>{upstreamJob?.status === "running" ? "generating…" : "no result yet"}</Empty>
      )}
    </NodeShell>
  );
}

export const nodeTypes = {
  prompt: PromptNode,
  imageInput: ImageInputNode,
  generateImage: GenerateImageNode,
  editImage: EditImageNode,
  result: ResultNode,
};
