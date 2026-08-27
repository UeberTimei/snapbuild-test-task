import { z } from "zod";

export const Preset = z.object({
  id: z.string(),
  name: z.string(),
  mainPrompt: z.string(),
  negativePrompt: z.string(),
  references: z.array(z.string()),
});
export type Preset = z.infer<typeof Preset>;

/** Output of the RequestBuilder: what actually gets sent to the image provider. */
export interface ImageRequest {
  prompt: string;
  negativePrompt?: string;
  references: string[];
}
