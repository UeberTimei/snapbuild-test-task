import { PresetList, type Preset } from "@repo/contracts";
import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import { ERROR_FALLBACK } from "@/shared/config";
import { toErrorMessage } from "@/shared/lib";
import type { UsePresetsResult } from "./model.types";

export function usePresets(): UsePresetsResult {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/presets", PresetList)
      .then((loaded) => {
        if (!controller.signal.aborted) setPresets(loaded);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(toErrorMessage(loadError, ERROR_FALLBACK.presets));
        }
      });

    return () => controller.abort();
  }, []);

  return { presets, error };
}
