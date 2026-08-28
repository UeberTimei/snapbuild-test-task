import { usePresets } from "@/entities/preset";
import { useWorkflowStore } from "@/entities/workflow";
import { Field } from "@/shared/ui";
import type { PresetFieldProps } from "./preset-field.types";

export function PresetField({ nodeId, presetId }: PresetFieldProps) {
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
