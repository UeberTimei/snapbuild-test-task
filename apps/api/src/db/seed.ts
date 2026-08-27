import type { Db } from "./db.module";
import { presets } from "./schema";

const DEMO_PRESET = {
  id: "preset-demo",
  name: "Premium 3D",
  mainPrompt: "premium minimal 3D visual, studio lighting, soft shadows, high detail",
  negativePrompt: "clutter, noisy background, watermark, text, low quality",
  referencesJson: JSON.stringify(["/references/ref-1.png", "/references/ref-2.png"]),
};

export function seed(db: Db): void {
  db.insert(presets).values(DEMO_PRESET).onConflictDoNothing().run();
}
