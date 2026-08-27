import { labelOf } from "@repo/contracts";
import type { NodeMetaByKind } from "./registry.types";

export const NODE_META: NodeMetaByKind = {
  prompt: {
    label: labelOf("prompt"),
    hint: "Text that feeds generation",
    defaultData: { text: "" },
  },
  imageInput: {
    label: labelOf("imageInput"),
    hint: "Upload a source image",
    defaultData: { assetId: null },
  },
  generateImage: {
    label: labelOf("generateImage"),
    hint: "Text to image via the backend",
    defaultData: { presetId: null },
  },
  editImage: {
    label: labelOf("editImage"),
    hint: "Edit an image with an instruction",
    defaultData: { presetId: null, instruction: "" },
  },
  result: {
    label: labelOf("result"),
    hint: "Preview of the produced image",
    defaultData: {},
  },
};
