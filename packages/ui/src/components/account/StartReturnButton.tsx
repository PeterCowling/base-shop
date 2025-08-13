"use client";

import { useState } from "react";

interface Props {
  sessionId: string;
}

export default function StartReturnButton({ sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.trackingNumber) {
        setTracking(data.trackingNumber);
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
        className="rounded bg-primary px-3 py-1 text-primary-foreground"
      >
        {loading ? "Processing…" : "Start return"}
      </button>
      {tracking && (
        <p className="mt-1 text-sm">Tracking: {tracking}</p>
      )}
    </div>
  );
}
