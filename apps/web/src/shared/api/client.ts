const BASE = import.meta.env.VITE_API_BASE ?? "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new ApiError(await errorMessage(res), res.status);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown; issues?: unknown };
    if (Array.isArray(body.issues) && body.issues.length > 0) return body.issues.join("; ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* non-JSON error body */
  }
  return `request failed with ${res.status}`;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
  /** Absolute URL for an asset, usable directly as an <img> src. */
  assetUrl: (assetId: string) => `${BASE}/assets/${assetId}`,
  eventsUrl: (path: string) => `${BASE}${path}`,
};
