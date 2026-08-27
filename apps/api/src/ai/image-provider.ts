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
