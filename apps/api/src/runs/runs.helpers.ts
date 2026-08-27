import { JobDto } from "@repo/contracts";
import type { JobRow } from "../db/db.types";

export function toJobDto(row: JobRow): JobDto {
  return JobDto.parse({
    id: row.id,
    nodeId: row.nodeId,
    kind: row.kind,
    status: row.status,
    attempts: row.attempts,
    error: row.error,
    outputAssetId: row.outputAssetId,
  });
}
