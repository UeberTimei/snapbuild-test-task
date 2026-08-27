import { Inject, Injectable } from "@nestjs/common";
import type { Preset } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { DB } from "../db/db.module";
import type { Db } from "../db/db.types";
import { presets } from "../db/schema";
import { toPreset } from "./presets.helpers";

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
