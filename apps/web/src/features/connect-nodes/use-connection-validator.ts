import type { Connection, Edge } from "@xyflow/react";
import { useCallback } from "react";
import { useWorkflowStore } from "@/entities/workflow";
import { isValidConnection } from "./model";

export function useConnectionValidator(): (connection: Connection | Edge) => boolean {
  return useCallback(
    (connection) => isValidConnection(connection, useWorkflowStore.getState().nodes),
    [],
  );
}
