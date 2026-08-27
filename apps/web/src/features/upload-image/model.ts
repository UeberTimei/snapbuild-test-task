import { AssetUploadResponse } from "@repo/contracts";
import { useCallback, useState } from "react";
import { useWorkflowStore } from "@/entities/workflow";
import { api } from "@/shared/api";
import { ERROR_FALLBACK, UPLOAD_FIELD_NAME } from "@/shared/config";
import { toErrorMessage } from "@/shared/lib";
import type { UseUploadImageResult } from "./model.types";

export function useUploadImage(nodeId: string): UseUploadImageResult {
  const setSourceAsset = useWorkflowStore((state) => state.setSourceAsset);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);

      const form = new FormData();
      form.append(UPLOAD_FIELD_NAME, file);

      try {
        const { id } = await api.postForm("/assets", AssetUploadResponse, form);
        setSourceAsset(nodeId, id);
      } catch (uploadError) {
        setError(toErrorMessage(uploadError, ERROR_FALLBACK.upload));
      } finally {
        setUploading(false);
      }
    },
    [nodeId, setSourceAsset],
  );

  return { upload, uploading, error };
}
