export const DDL = `
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

export const WAL_PRAGMA = "PRAGMA journal_mode = WAL;";

export const DEMO_PRESET = {
  id: "preset-demo",
  name: "Premium 3D",
  mainPrompt: "premium minimal 3D visual, studio lighting, soft shadows, high detail",
  negativePrompt: "clutter, noisy background, watermark, text, low quality",
  referencesJson: JSON.stringify(["/references/ref-1.png", "/references/ref-2.png"]),
};
