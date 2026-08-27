import { z } from "zod";

export const Preset = z.object({
  id: z.string(),
  name: z.string(),
  mainPrompt: z.string(),
  negativePrompt: z.string(),
  references: z.array(z.string()),
});
export type Preset = z.infer<typeof Preset>;

export const PresetList = z.array(Preset);

export const PresetReferences = z.array(z.string());
