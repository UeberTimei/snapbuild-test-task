import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "./schema";
import type { assets, jobs, presets, runs, workflows } from "./schema";

export type Db = BunSQLiteDatabase<typeof schema>;

export type WorkflowRow = typeof workflows.$inferSelect;
export type PresetRow = typeof presets.$inferSelect;
export type RunRow = typeof runs.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type AssetRow = typeof assets.$inferSelect;
