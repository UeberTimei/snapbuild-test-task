export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export const CONTENT_TYPE_JSON = "application/json";

export const DELETE_KEY_CODES = ["Backspace", "Delete"];

export const NODE_SPAWN_AREA = {
  minX: 120,
  spreadX: 260,
  minY: 80,
  spreadY: 300,
};

export const UPLOAD_FIELD_NAME = "file";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

export const ERROR_FALLBACK = {
  run: "could not start the run",
  retry: "retry failed",
  upload: "upload failed",
  presets: "could not load presets",
  request: "request failed",
};
