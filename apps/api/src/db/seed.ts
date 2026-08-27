import { DEMO_PRESET } from "./db.constants";
import type { Db } from "./db.types";
import { presets } from "./schema";

export function seed(db: Db): void {
  db.insert(presets).values(DEMO_PRESET).onConflictDoNothing().run();
}
