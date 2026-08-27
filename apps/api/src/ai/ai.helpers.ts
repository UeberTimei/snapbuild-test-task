import { MISSING_TOKEN_MESSAGE } from "../common/constants";
import { truncate } from "../common/helpers";
import { MissingApiKeyError } from "./image-provider";

export function requireToken(): string {
  const token = process.env.HF_TOKEN;
  if (!token) throw new MissingApiKeyError(MISSING_TOKEN_MESSAGE);
  return token;
}

export function negativePromptParam(negativePrompt: string | undefined): Record<string, string> {
  return negativePrompt ? { negative_prompt: negativePrompt } : {};
}

export function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

export async function readDetail(response: Response): Promise<string> {
  return truncate(await response.text().catch(() => ""));
}
