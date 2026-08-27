import type { NodeKind } from "@repo/contracts";
import type { NodeProps, NodeTypes } from "@xyflow/react";
import { selectJob, useRunStore } from "@/entities/run";
import { selectUpstreamNodeId, useWorkflowStore, type FlowNodeOf } from "@/entities/workflow";
import { api } from "@/shared/api";
import { Empty } from "@/shared/ui";
import { NodeShell } from "./node-shell";

type NodeComponentProps<K extends NodeKind> = NodeProps<FlowNodeOf<K>>;

function PromptNode({ id, data, selected }: NodeComponentProps<"prompt">) {
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

function ImageInputNode({ id, data, selected }: NodeComponentProps<"imageInput">) {
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

function GenerateImageNode({ id, data, selected }: NodeComponentProps<"generateImage">) {
  return (
    <NodeShell id={id} kind="generateImage" selected={selected}>
      <span className="muted">{data.presetId ? `preset: ${data.presetId}` : "no preset"}</span>
    </NodeShell>
  );
}

function EditImageNode({ id, data, selected }: NodeComponentProps<"editImage">) {
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

function ResultNode({ id, selected }: NodeComponentProps<"result">) {
  const upstreamId = useWorkflowStore(selectUpstreamNodeId(id, "in"));
  const upstreamJob = useRunStore(selectJob(upstreamId ?? ""));
  const assetId = upstreamJob?.outputAssetId ?? null;

  return (
    <NodeShell id={id} kind="result" selected={selected}>
      {assetId === null ? (
        <Empty>{upstreamJob?.status === "running" ? "generating…" : "no result yet"}</Empty>
      ) : (
        <img className="node__image" src={api.assetUrl(assetId)} alt="result" />
      )}
    </NodeShell>
  );
}

export const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  imageInput: ImageInputNode,
  generateImage: GenerateImageNode,
  editImage: EditImageNode,
  result: ResultNode,
};
