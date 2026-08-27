import { Inject, Injectable } from "@nestjs/common";
import { PresetReferences, type Preset } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { presets } from "../db/schema";

type PresetRow = typeof presets.$inferSelect;

@Injectable()
export class PresetsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(): Preset[] {
    return this.db.select().from(presets).all().map(toPreset);
  }

  get(id: string): Preset | null {
    const row = this.db.select().from(presets).where(eq(presets.id, id)).get();
    return row ? toPreset(row) : null;
  }
}

function toPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    name: row.name,
    mainPrompt: row.mainPrompt,
    negativePrompt: row.negativePrompt,
    references: PresetReferences.parse(JSON.parse(row.referencesJson)),
  };
}
