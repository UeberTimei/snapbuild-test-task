import { Database } from "bun:sqlite";
import { Global, Module } from "@nestjs/common";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { seed } from "./seed";

export const DB = Symbol("DB");
export type Db = BunSQLiteDatabase<typeof schema>;

// ponytail: idempotent DDL on boot instead of a migration tool. Upgrade to
// drizzle-kit migrations if the schema starts changing in flight.
const DDL = `
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, graph_json TEXT NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, main_prompt TEXT NOT NULL,
  negative_prompt TEXT NOT NULL, references_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY, workflow_id TEXT, status TEXT NOT NULL,
  graph_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY, run_id TEXT NOT NULL, node_id TEXT NOT NULL, kind TEXT NOT NULL,
  status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, error TEXT, output_asset_id TEXT
);
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY, path TEXT NOT NULL, mime TEXT NOT NULL, kind TEXT NOT NULL, created_at INTEGER NOT NULL
);
`;

export function createDb(file = process.env.DB_FILE ?? "app.sqlite"): Db {
  const sqlite = new Database(file);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec(DDL);
  const db = drizzle(sqlite, { schema });
  seed(db);
  return db;
}

@Global()
@Module({
  providers: [{ provide: DB, useFactory: () => createDb() }],
  exports: [DB],
})
export class DbModule {}
