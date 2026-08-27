import { useCallback, useState } from "react";
import { useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";

/** Uploads a file to the backend and stores the returned asset id on the node. */
export function useUploadImage(nodeId: string) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const { id } = await api.postForm<{ id: string }>("/assets", form);
        updateNodeData(nodeId, { assetId: id });
      } catch (err) {
        setError(err instanceof Error ? err.message : "upload failed");
      } finally {
        setBusy(false);
      }
    },
    [nodeId, updateNodeData],
  );

  return { upload, busy, error };
}
