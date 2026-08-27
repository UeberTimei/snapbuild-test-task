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

export const IMAGE_PROVIDER = Symbol("IMAGE_PROVIDER");

export class ImageProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ImageProviderError";
  }
}

export class MissingApiKeyError extends ImageProviderError {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}
