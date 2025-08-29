"use client";

import * as React from "react";

interface ReturnFormProps {
  bagType?: string;
  tracking?: boolean;
}

export default function ReturnForm({
  bagType,
  tracking: trackingEnabled,
}: ReturnFormProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = React.useState("");
  const [labelUrl, setLabelUrl] = React.useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    async function init() {
      if (!("BarcodeDetector" in window)) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const code = codes[0].rawValue;
              setSessionId(code);
              active = false;
              stream?.getTracks().forEach((t) => t.stop());
              return;
            }
          } catch {
            /* noop */
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch {
        setError("Unable to access camera.");
      }
    }
    init();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLabelUrl(null);
    setTrackingNumber(null);
    try {
      const res = await fetch("/api/returns/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create return");
        return;
      }
      setLabelUrl(data.labelUrl ?? null);
      setTrackingNumber(data.tracking ?? null);
    } catch {
      setError("Failed to create return");
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Return Item</h1>
      {bagType && <p>Please reuse the {bagType} bag for your return.</p>}
      <video ref={videoRef} className="w-full max-w-md" />
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <button type="submit" className="bg-primary px-4 py-2 text-white">
          Submit
        </button>
      </form>
      {labelUrl && trackingEnabled && (
        <p>
          <a
            href={labelUrl}
            className="text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            Print Label
          </a>
          {trackingNumber && (
            <span className="block">Tracking: {trackingNumber}</span>
          )}
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

