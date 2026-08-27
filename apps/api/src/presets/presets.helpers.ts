import { PresetReferences, type Preset } from "@repo/contracts";
import type { PresetRow } from "../db/db.types";

export function toPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    name: row.name,
    mainPrompt: row.mainPrompt,
    negativePrompt: row.negativePrompt,
    references: PresetReferences.parse(JSON.parse(row.referencesJson)),
  };
}
