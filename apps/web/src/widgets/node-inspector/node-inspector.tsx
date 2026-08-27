import type { NodeKind } from "@repo/contracts";
import { nodeMeta } from "@/entities/node";
import { selectSelectedNode, useWorkflowStore } from "@/entities/workflow";
import { usePresets } from "@/entities/preset";
import { useUploadImage } from "@/features/upload-image";
import { api } from "@/shared/api";
import { Empty, Field, Panel } from "@/shared/ui";

export function NodeInspector() {
  const node = useWorkflowStore(selectSelectedNode);

  if (!node) {
    return (
      <Panel title="Inspector">
        <Empty>Select a node to edit it.</Empty>
      </Panel>
    );
  }

  const kind = node.type as NodeKind;
  return (
    <Panel title={`${nodeMeta(kind).label} settings`}>
      <NodeFields nodeId={node.id} kind={kind} data={node.data} />
    </Panel>
  );
}

function NodeFields({
  nodeId,
  kind,
  data,
}: {
  nodeId: string;
  kind: NodeKind;
  data: Record<string, unknown>;
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  switch (kind) {
    case "prompt":
      return (
        <Field label="Prompt">
          <textarea
            rows={5}
            value={String(data.text ?? "")}
            placeholder="describe the image"
            onChange={(e) => updateNodeData(nodeId, { text: e.target.value })}
          />
        </Field>
      );

    case "imageInput":
      return <ImageInputFields nodeId={nodeId} assetId={data.assetId as string | null} />;

    case "generateImage":
      return <PresetField nodeId={nodeId} presetId={data.presetId as string | null} />;

    case "editImage":
      return (
        <>
          <Field label="Instruction">
            <textarea
              rows={3}
              value={String(data.instruction ?? "")}
              placeholder="make the background blue"
              onChange={(e) => updateNodeData(nodeId, { instruction: e.target.value })}
            />
          </Field>
          <PresetField nodeId={nodeId} presetId={data.presetId as string | null} />
        </>
      );

    default:
      return <Empty>This node has no settings.</Empty>;
  }
}

function ImageInputFields({ nodeId, assetId }: { nodeId: string; assetId: string | null }) {
  const { upload, busy, error } = useUploadImage(nodeId);

  return (
    <>
      <Field label="Source image">
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </Field>
      {busy && <p className="muted">uploading…</p>}
      {error && <p className="error">{error}</p>}
      {assetId && <img className="preview" src={api.assetUrl(assetId)} alt="uploaded source" />}
    </>
  );
}

function PresetField({ nodeId, presetId }: { nodeId: string; presetId: string | null }) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const { presets, error } = usePresets();

  return (
    <>
      <Field label="Preset">
        <select
          value={presetId ?? ""}
          onChange={(e) => updateNodeData(nodeId, { presetId: e.target.value || null })}
        >
          <option value="">No preset</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="error">presets unavailable: {error}</p>}
    </>
  );
}
