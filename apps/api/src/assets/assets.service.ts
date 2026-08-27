import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module";
import { assets } from "../db/schema";

const EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

@Injectable()
export class AssetsService {
  private readonly dir = process.env.STORAGE_DIR ?? join(process.cwd(), "storage");

  constructor(@Inject(DB) private readonly db: Db) {
    mkdirSync(this.dir, { recursive: true });
  }

  async save(bytes: Uint8Array, mime: string, kind: "upload" | "generated"): Promise<string> {
    const id = randomUUID();
    const path = join(this.dir, id + (EXT[mime] ?? ".bin"));
    await Bun.write(path, bytes);
    this.db.insert(assets).values({ id, path, mime, kind, createdAt: Date.now() }).run();
    return id;
  }

  get(id: string): { path: string; mime: string } | null {
    const row = this.db.select().from(assets).where(eq(assets.id, id)).get();
    return row ? { path: row.path, mime: row.mime } : null;
  }

  async bytes(id: string): Promise<Uint8Array | null> {
    const row = this.get(id);
    if (!row) return null;
    return new Uint8Array(await Bun.file(row.path).arrayBuffer());
  }
}
