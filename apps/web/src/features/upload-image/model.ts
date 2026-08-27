import { AssetUploadResponse } from "@repo/contracts";
import { useCallback, useState } from "react";
import { useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";

export function useUploadImage(nodeId: string) {
  const setSourceAsset = useWorkflowStore((state) => state.setSourceAsset);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);

      const form = new FormData();
      form.append("file", file);

      try {
        const { id } = await api.postForm("/assets", AssetUploadResponse, form);
        setSourceAsset(nodeId, id);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "upload failed");
      } finally {
        setUploading(false);
      }
    },
    [nodeId, setSourceAsset],
  );

  return { upload, uploading, error };
}
