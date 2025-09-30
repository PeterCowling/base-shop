"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";

interface Props {
  sessionId: string;
}

export default function StartReturnButton({ sessionId }: Props) {
  const t = useTranslations();
  const tf = (key: string, fallback: string) => {
    const val = t(key) as string;
    return val === key ? fallback : val;
  };
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dropOffProvider, setDropOffProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/return?tracking=${tracking}`);
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
        }
      } catch {
        // ignore errors
      }
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, [tracking]);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.tracking) {
        setTracking(data.tracking.number);
        setLabelUrl(data.tracking.labelUrl ?? null);
      }
      if (data.dropOffProvider) {
        setDropOffProvider(data.dropOffProvider);
      }
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-primary px-3 py-1 min-h-10 min-w-10"
        data-token="--color-primary" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — label below is translated
      >
        <span
          className="text-primary-foreground"
          data-token="--color-primary-fg" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — child content uses t()
        >
          {loading ? tf("actions.processing", "Processing…") : tf("returns.start", "Start return")}
        </span>
      </button>
      {labelUrl && (
        <p className="mt-1 text-sm">
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-block min-h-10 min-w-10"
          >
            {tf("returns.downloadLabel", "Download label")}
          </a>
        </p>
      )}
      {dropOffProvider && (
        <p className="mt-1 text-sm">
          {tf("returns.dropOff", `Drop-off: ${dropOffProvider}`)}
        </p>
      )}
      {tracking && (
        <p className="mt-1 text-sm">{tf("returns.tracking", `Tracking: ${tracking}`)}</p>
      )}
      {status && (
        <p className="mt-1 text-sm">{tf("returns.status", `Status: ${status}`)}</p>
      )}
    </div>
  );
}
