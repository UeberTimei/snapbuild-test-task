import { useWorkflowStore } from "@/entities/workflow";
import { Field } from "@/shared/ui";
import type { PromptFieldsProps } from "./prompt-fields.types";

export function PromptFields({ node }: PromptFieldsProps) {
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
