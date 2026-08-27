import { PresetList, type Preset } from "@repo/contracts";
import { useEffect, useState } from "react";
import { api } from "@/shared/api";

export function usePresets(): { presets: Preset[]; error: string | null } {
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
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "could not load presets");
      });

    return () => controller.abort();
  }, []);

  return { presets, error };
}
