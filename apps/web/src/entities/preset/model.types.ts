import type { Preset } from "@repo/contracts";

export interface UsePresetsResult {
  presets: Preset[];
  error: string | null;
}
