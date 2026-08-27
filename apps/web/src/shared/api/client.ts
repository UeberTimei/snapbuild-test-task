import type { ZodType } from "zod";
import { API_BASE, CONTENT_TYPE_JSON } from "@/shared/config";
import { readErrorMessage } from "./client.helpers";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);

  return schema.parse(await response.json());
}

export const api = {
  get: <T>(path: string, schema: ZodType<T>) => request(path, schema),

  post: <T>(path: string, schema: ZodType<T>, body?: unknown) =>
    request(path, schema, {
      method: "POST",
      headers: body === undefined ? undefined : { "Content-Type": CONTENT_TYPE_JSON },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  postForm: <T>(path: string, schema: ZodType<T>, form: FormData) =>
    request(path, schema, { method: "POST", body: form }),

  assetUrl: (assetId: string) => `${API_BASE}/assets/${assetId}`,

  eventsUrl: (path: string) => `${API_BASE}${path}`,
};
