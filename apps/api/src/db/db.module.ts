import { Database } from "bun:sqlite";
import { Global, Module } from "@nestjs/common";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DB_FILE } from "../common/constants";
import { DDL, WAL_PRAGMA } from "./db.constants";
import type { Db } from "./db.types";
import * as schema from "./schema";
import { seed } from "./seed";

export const DB = Symbol("DB");

export function createDb(file = DB_FILE): Db {
  const sqlite = new Database(file);
  sqlite.exec(WAL_PRAGMA);
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
