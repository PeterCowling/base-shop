"use client";

import { useEffect, useState } from "react";

interface Props {
  sessionId: string;
}

export default function StartReturnButton({ sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dropOffProvider, setDropOffProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!tracking) return;
    let timer: ReturnType<typeof setInterval>;
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
    timer = setInterval(fetchStatus, 5000);
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
        className="rounded bg-primary px-3 py-1"
        data-token="--color-primary"
      >
        <span
          className="text-primary-foreground"
          data-token="--color-primary-fg"
        >
          {loading ? "Processing…" : "Start return"}
        </span>
      </button>
      {labelUrl && (
        <p className="mt-1 text-sm">
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Download label
          </a>
        </p>
      )}
      {dropOffProvider && (
        <p className="mt-1 text-sm">Drop-off: {dropOffProvider}</p>
      )}
      {tracking && (
        <p className="mt-1 text-sm">Tracking: {tracking}</p>
      )}
      {status && <p className="mt-1 text-sm">Status: {status}</p>}
    </div>
  );
}
