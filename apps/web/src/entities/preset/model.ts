import type { Preset } from "@repo/contracts";
import { useEffect, useState } from "react";
import { api } from "@/shared/api";

export function usePresets(): { presets: Preset[]; error: string | null } {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Preset[]>("/presets")
      .then((data) => !cancelled && setPresets(data))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return { presets, error };
}
