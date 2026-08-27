import type { ImageRequest, Preset } from "@repo/contracts";

/**
 * Composes what actually goes to the image provider out of the user's prompt
 * and the selected preset. Pure — no I/O, no provider specifics.
 */
export function buildImageRequest(userPrompt: string, preset?: Preset | null): ImageRequest {
  const user = userPrompt.trim();
  if (!preset) {
    return { prompt: user, references: [] };
  }
  const main = preset.mainPrompt.trim();
  const prompt = [main, user].filter(Boolean).join(", ");
  const negativePrompt = preset.negativePrompt.trim() || undefined;
  return { prompt, negativePrompt, references: preset.references };
}
