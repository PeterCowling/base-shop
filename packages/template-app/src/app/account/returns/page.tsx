import { getReturnLogistics } from "@platform-core/returnLogistics";
import { useEffect, useRef, useState } from "react";

export const metadata = { title: "Return Items" };

export default async function AccountReturnsPage() {
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return <p className="p-6">Mobile returns are not enabled.</p>;
  }
  return <Scanner />;
}

function Scanner() {
  "use client";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState("");
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          formats: ["qr_code", "code_128", "ean_13", "upc_a"],
        });
        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const code = codes[0].rawValue;
              active = false;
              stream?.getTracks().forEach((t) => t.stop());
              setSessionId(code);
              await handleReturn(code);
              return;
            }
          } catch {
            // ignore scanning errors
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch {
        // ignore camera errors
      }
    }
    init();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleReturn(id: string) {
    if (!id) return;
    try {
      const res = await fetch("/api/returns/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLabelUrl(null);
        setTracking(null);
      } else {
        setLabelUrl(data.labelUrl ?? null);
        setTracking(data.trackingNumber ?? null);
        setError(null);
      }
    } catch {
      setError("Failed to process return");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Return Items</h1>
      <video ref={videoRef} className="w-full max-w-md" />
      <div className="flex gap-2">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID"
          className="flex-1 border p-1"
        />
        <button
          type="button"
          onClick={() => handleReturn(sessionId)}
          className="rounded bg-black px-2 py-1 text-white"
        >
          Submit
        </button>
      </div>
      {labelUrl && (
        <p>
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
      {tracking && <p>Tracking: {tracking}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

