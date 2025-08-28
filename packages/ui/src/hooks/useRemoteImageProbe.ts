"use client";

import { useState, useCallback } from "react";

export type RemoteImageProbeStatus =
  | "idle"
  | "loading"
  | "valid"
  | "invalid"
  | "error";

export interface RemoteImageProbeResult {
  status: RemoteImageProbeStatus;
  error: string | null;
  probe: (url: string) => Promise<boolean>;
}

export default function useRemoteImageProbe(): RemoteImageProbeResult {
  const [status, setStatus] = useState<RemoteImageProbeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const probe = useCallback(async (url: string) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/cms/api/media/probe?url=${encodeURIComponent(url)}`, {
        method: "HEAD",
      });
      if (res.ok) {
        setStatus("valid");
        return true;
      }
      if (res.status === 415) {
        setStatus("invalid");
        return false;
      }
      setStatus("error");
      setError(res.statusText || "Probe failed");
      return false;
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
      return false;
    }
  }, []);

  return { status, error, probe };
}

