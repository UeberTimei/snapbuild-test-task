import { Inject, Injectable } from "@nestjs/common";
import type { Preset } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { presets } from "../db/schema";

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

function toPreset(row: typeof presets.$inferSelect): Preset {
  return {
    id: row.id,
    name: row.name,
    mainPrompt: row.mainPrompt,
    negativePrompt: row.negativePrompt,
    references: JSON.parse(row.referencesJson) as string[],
  };
}
