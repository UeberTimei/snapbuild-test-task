import { BINARY_EXTENSION, EXTENSION_BY_MIME } from "../common/constants";

export function extensionForMime(mime: string): string {
  return EXTENSION_BY_MIME[mime] ?? BINARY_EXTENSION;
}

export function fileNameFor(id: string, mime: string): string {
  return id + extensionForMime(mime);
}
