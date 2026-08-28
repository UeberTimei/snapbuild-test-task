import type { NodeTypes } from "@xyflow/react";
import { EditImageNode } from "./edit-image-node/edit-image-node";
import { GenerateImageNode } from "./generate-image-node/generate-image-node";
import { ImageInputNode } from "./image-input-node/image-input-node";
import { PromptNode } from "./prompt-node/prompt-node";
import { ResultNode } from "./result-node/result-node";

export const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  imageInput: ImageInputNode,
  generateImage: GenerateImageNode,
  editImage: EditImageNode,
  result: ResultNode,
};
