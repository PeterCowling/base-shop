"use client";
import { useCallback, useState } from "react";

export interface RemoteImageProbeResult {
  probe: (url: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useRemoteImageProbe(): RemoteImageProbeResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const probe = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/cms/api/media/probe?url=${encodeURIComponent(url)}`,
        { method: "HEAD" }
      );
      const type = res.headers.get("content-type");
      if (!res.ok || !type || !type.startsWith("image/")) {
        throw new Error("Invalid image");
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { probe, loading, error };
}

export default useRemoteImageProbe;
