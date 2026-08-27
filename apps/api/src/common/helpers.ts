import { MAX_ERROR_DETAIL_LENGTH } from "./constants";

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function truncate(text: string, maxLength = MAX_ERROR_DETAIL_LENGTH): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength)}…` : collapsed;
}

export function parseJson<T>(raw: string, parse: (value: unknown) => T): T {
  return parse(JSON.parse(raw));
}
