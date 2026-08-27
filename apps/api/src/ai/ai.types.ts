import type { ImageRequest } from "@repo/contracts";

export interface GeneratedImage {
  bytes: Uint8Array;
  mime: string;
}

export interface EditRequest extends ImageRequest {
  image: Uint8Array;
  instruction: string;
}

export interface ImageProvider {
  generate(request: ImageRequest): Promise<GeneratedImage>;
  edit(request: EditRequest): Promise<GeneratedImage>;
}

export interface InferencePayload {
  inputs: string;
  parameters: Record<string, string>;
}
