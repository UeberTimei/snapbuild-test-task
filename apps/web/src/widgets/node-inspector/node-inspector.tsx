import { nodeLabel } from "@/entities/node";
import { usePresets } from "@/entities/preset";
import { selectSelectedNode, useWorkflowStore } from "@/entities/workflow";
import { useUploadImage } from "@/features/upload-image";
import { api } from "@/shared/api";
import { IMAGE_ACCEPT } from "@/shared/config";
import { Empty, Field, Panel } from "@/shared/ui";
import type {
  EditImageFieldsProps,
  ImageInputFieldsProps,
  NodeFieldsProps,
  PresetFieldProps,
  PromptFieldsProps,
} from "./node-inspector.types";

export function NodeInspector() {
  const node = useWorkflowStore(selectSelectedNode);

  if (!node) {
    return (
      <Panel title="Inspector">
        <Empty>Select a node to edit it.</Empty>
      </Panel>
    );
  }

  return (
    <Panel title={`${nodeLabel(node.type)} settings`}>
      <NodeFields node={node} />
    </Panel>
  );
}

function NodeFields({ node }: NodeFieldsProps) {
  switch (node.type) {
    case "prompt":
      return <PromptFields node={node} />;
    case "imageInput":
      return <ImageInputFields node={node} />;
    case "generateImage":
      return <PresetField nodeId={node.id} presetId={node.data.presetId} />;
    case "editImage":
      return <EditImageFields node={node} />;
    case "result":
      return <Empty>This node has no settings.</Empty>;
  }
}

function PromptFields({ node }: PromptFieldsProps) {
  const setPromptText = useWorkflowStore((state) => state.setPromptText);

  return (
    <Field label="Prompt">
      <textarea
        rows={5}
        value={node.data.text}
        placeholder="describe the image"
        onChange={(event) => setPromptText(node.id, event.target.value)}
      />
    </Field>
  );
}

function EditImageFields({ node }: EditImageFieldsProps) {
  const setEditInstruction = useWorkflowStore((state) => state.setEditInstruction);

  return (
    <>
      <Field label="Instruction">
        <textarea
          rows={3}
          value={node.data.instruction}
          placeholder="make the background blue"
          onChange={(event) => setEditInstruction(node.id, event.target.value)}
        />
      </Field>
      <PresetField nodeId={node.id} presetId={node.data.presetId} />
    </>
  );
}

function ImageInputFields({ node }: ImageInputFieldsProps) {
  const { upload, uploading, error } = useUploadImage(node.id);
  const { assetId } = node.data;

  return (
    <>
      <Field label="Source image">
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </Field>
      {uploading && <p className="muted">uploading…</p>}
      {error && <p className="error">{error}</p>}
      {assetId !== null && (
        <img className="preview" src={api.assetUrl(assetId)} alt="uploaded source" />
      )}
    </>
  );
}

function PresetField({ nodeId, presetId }: PresetFieldProps) {
  const setPreset = useWorkflowStore((state) => state.setPreset);
  const { presets, error } = usePresets();

  return (
    <>
      <Field label="Preset">
        <select
          value={presetId ?? ""}
          onChange={(event) => setPreset(nodeId, event.target.value || null)}
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
