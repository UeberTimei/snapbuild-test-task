import type { ImageRequest, Preset } from "@repo/contracts";

export function buildImageRequest(userPrompt: string, preset?: Preset | null): ImageRequest {
  const prompt = userPrompt.trim();
  if (!preset) return { prompt, references: [] };

  const negativePrompt = preset.negativePrompt.trim();
  return {
    prompt: [preset.mainPrompt.trim(), prompt].filter(Boolean).join(", "),
    negativePrompt: negativePrompt || undefined,
    references: preset.references,
  };
}
