import { z, type ZodType } from "zod";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

const ErrorBody = z.object({
  message: z.string().optional(),
  issues: z.array(z.string()).optional(),
});

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
  const response = await fetch(`${BASE}${path}`, init);
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);

  return schema.parse(await response.json());
}

async function errorMessage(response: Response): Promise<string> {
  const body = await response
    .json()
    .then((payload: unknown) => ErrorBody.safeParse(payload))
    .catch(() => null);

  if (body?.success) {
    const { issues, message } = body.data;
    if (issues && issues.length > 0) return issues.join("; ");
    if (message) return message;
  }
  return `request failed with ${response.status}`;
}

export const api = {
  get: <T>(path: string, schema: ZodType<T>) => request(path, schema),

  post: <T>(path: string, schema: ZodType<T>, body?: unknown) =>
    request(path, schema, {
      method: "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  postForm: <T>(path: string, schema: ZodType<T>, form: FormData) =>
    request(path, schema, { method: "POST", body: form }),

  assetUrl: (assetId: string) => `${BASE}/assets/${assetId}`,

  eventsUrl: (path: string) => `${BASE}${path}`,
};
