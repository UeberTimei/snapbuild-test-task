import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { assets } from "../db/schema";

export type AssetKind = "upload" | "generated";

export interface StoredAsset {
  path: string;
  mime: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

@Injectable()
export class AssetsService {
  private readonly directory = process.env.STORAGE_DIR ?? join(process.cwd(), "storage");

  constructor(@Inject(DB) private readonly db: Db) {
    mkdirSync(this.directory, { recursive: true });
  }

  async save(bytes: Uint8Array, mime: string, kind: AssetKind): Promise<string> {
    const id = randomUUID();
    const path = join(this.directory, id + (EXTENSION_BY_MIME[mime] ?? ".bin"));

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
