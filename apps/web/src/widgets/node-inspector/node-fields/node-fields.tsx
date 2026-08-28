import { Empty } from "@/shared/ui";
import { EditImageFields } from "../edit-image-fields/edit-image-fields";
import { ImageInputFields } from "../image-input-fields/image-input-fields";
import { PresetField } from "../preset-field/preset-field";
import { PromptFields } from "../prompt-fields/prompt-fields";
import type { NodeFieldsProps } from "./node-fields.types";

export function NodeFields({ node }: NodeFieldsProps) {
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
