import type { Preset } from "@repo/contracts";
import type { AssetKind } from "../common/types";
import type { ImageProvider } from "../ai/ai.types";
import type { RunState } from "./run-state";

export interface AssetStore {
  save(bytes: Uint8Array, mime: string, kind: AssetKind): Promise<string>;
  bytes(id: string): Promise<Uint8Array | null>;
}

export interface PresetStore {
  get(id: string): Preset | null;
}

export interface ExecutorDeps {
  provider: ImageProvider;
  assets: AssetStore;
  presets: PresetStore;
  concurrency?: number;
  onJobSettled?: (run: RunState, nodeId: string) => void;
}
