import { join } from "node:path";

export const API_PORT = Number(process.env.PORT ?? 3001);

export const DB_FILE = process.env.DB_FILE ?? "app.sqlite";
export const STORAGE_DIR = process.env.STORAGE_DIR ?? join(process.cwd(), "storage");

export const RUN_CONCURRENCY = Number(process.env.RUN_CONCURRENCY ?? 4);

export const HF_BASE_URL =
  process.env.HF_BASE_URL ?? "https://router.huggingface.co/hf-inference/models";
export const HF_TEXT_TO_IMAGE_MODEL =
  process.env.HF_T2I_MODEL ?? "stabilityai/stable-diffusion-3-medium-diffusers";
export const HF_IMAGE_TO_IMAGE_MODEL = process.env.HF_I2I_MODEL ?? "timbrooks/instruct-pix2pix";
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 60_000);

export const MAX_ERROR_DETAIL_LENGTH = 200;

export const CONTENT_TYPE_JSON = "application/json";
export const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";
export const DEFAULT_IMAGE_MIME = "image/png";
export const IMAGE_MIME_PREFIX = "image/";
export const BINARY_EXTENSION = ".bin";

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export const MISSING_TOKEN_MESSAGE =
  "HF_TOKEN is not set. Create apps/api/.env with HF_TOKEN=<your huggingface token>.";

export const UPLOAD_FIELD_NAME = "file";
