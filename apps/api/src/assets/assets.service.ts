import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { STORAGE_DIR } from "../common/constants";
import type { AssetKind, StoredAsset } from "../common/types";
import { DB } from "../db/db.module";
import type { Db } from "../db/db.types";
import { assets } from "../db/schema";
import { fileNameFor } from "./assets.helpers";

@Injectable()
export class AssetsService {
  private readonly directory = STORAGE_DIR;

  constructor(@Inject(DB) private readonly db: Db) {
    mkdirSync(this.directory, { recursive: true });
  }

  async save(bytes: Uint8Array, mime: string, kind: AssetKind): Promise<string> {
    const id = randomUUID();
    const path = join(this.directory, fileNameFor(id, mime));

    await Bun.write(path, bytes);
    this.db.insert(assets).values({ id, path, mime, kind, createdAt: Date.now() }).run();
    return id;
  }

  get(id: string): StoredAsset | null {
    const row = this.db.select().from(assets).where(eq(assets.id, id)).get();
    return row ? { path: row.path, mime: row.mime } : null;
  }

  async bytes(id: string): Promise<Uint8Array | null> {
    const asset = this.get(id);
    if (!asset) return null;
    return new Uint8Array(await Bun.file(asset.path).arrayBuffer());
  }
}
