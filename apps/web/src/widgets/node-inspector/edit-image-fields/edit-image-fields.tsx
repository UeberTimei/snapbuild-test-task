import { useWorkflowStore } from "@/entities/workflow";
import { Field } from "@/shared/ui";
import { PresetField } from "../preset-field/preset-field";
import type { EditImageFieldsProps } from "./edit-image-fields.types";

export function EditImageFields({ node }: EditImageFieldsProps) {
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
