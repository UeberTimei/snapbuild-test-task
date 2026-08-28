import type { XYPosition } from "@xyflow/react";
import { NODE_SPAWN_AREA } from "@/shared/config";
import { randomBetween } from "@/shared/lib";

export function spawnPosition(): XYPosition {
  return {
    x: randomBetween(NODE_SPAWN_AREA.minX, NODE_SPAWN_AREA.spreadX),
    y: randomBetween(NODE_SPAWN_AREA.minY, NODE_SPAWN_AREA.spreadY),
  };
}
