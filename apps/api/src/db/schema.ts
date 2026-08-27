import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  graphJson: text("graph_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const presets = sqliteTable("presets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mainPrompt: text("main_prompt").notNull(),
  negativePrompt: text("negative_prompt").notNull(),
  referencesJson: text("references_json").notNull(),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id"),
  status: text("status").notNull(),
  graphJson: text("graph_json").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  nodeId: text("node_id").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  attempts: integer("attempts").notNull().default(0),
  error: text("error"),
  outputAssetId: text("output_asset_id"),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  mime: text("mime").notNull(),
  kind: text("kind").notNull(),
  createdAt: integer("created_at").notNull(),
});
