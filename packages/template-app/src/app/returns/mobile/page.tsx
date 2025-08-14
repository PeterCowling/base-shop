"use client";

import { useEffect, useRef, useState } from "react";

export default function MobileReturnPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream;
    const detector =
      typeof window !== "undefined" && "BarcodeDetector" in window
        ? new (window as any).BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a"],
          })
        : null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (detector) requestAnimationFrame(scan);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    }

    async function scan() {
      if (!active || !detector || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          const code = results[0].rawValue;
          if (code !== lastCode) {
            setLastCode(code);
            await fetch("/api/returns/mobile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            }).catch(() => void 0);
          }
        }
      } catch (err) {
        console.error(err);
      }
      requestAnimationFrame(scan);
    }

    start();
    return () => {
      active = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [lastCode]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Scan Return</h1>
      <video ref={videoRef} className="w-full rounded" />
      {lastCode && <p>Last scan: {lastCode}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

