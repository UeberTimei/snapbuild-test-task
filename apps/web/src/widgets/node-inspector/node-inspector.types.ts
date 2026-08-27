import type { FlowNode, FlowNodeOf } from "@/entities/workflow";

export interface NodeFieldsProps {
  node: FlowNode;
}

export interface PromptFieldsProps {
  node: FlowNodeOf<"prompt">;
}

export interface ImageInputFieldsProps {
  node: FlowNodeOf<"imageInput">;
}

export interface EditImageFieldsProps {
  node: FlowNodeOf<"editImage">;
}

export interface PresetFieldProps {
  nodeId: string;
  presetId: string | null;
}
