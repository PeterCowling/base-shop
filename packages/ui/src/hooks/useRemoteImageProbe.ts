"use client";

import { useCallback,useState } from "react";

export interface RemoteImageProbeResult {
  probe: (url: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  valid: boolean | null;
}

export default function useRemoteImageProbe(): RemoteImageProbeResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  const probe = useCallback(async (url: string) => {
    if (!url) {
      setValid(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/probe?url=${encodeURIComponent(url)}`, {
        method: "HEAD",
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !type.startsWith("image/")) {
        setError("not-image");
        setValid(false);
      } else {
        setValid(true);
      }
    } catch (err) {
      setError((err as Error).message);
      setValid(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { probe, loading, error, valid };
}
