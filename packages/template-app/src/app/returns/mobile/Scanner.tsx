"use client";

import * as React from "react";

interface ScannerProps {
  allowedZips: string[];
}

export default function Scanner({ allowedZips }: ScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [zip, setZip] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function finalize(sessionId: string) {
    try {
      await fetch("/api/returns/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zip ? { sessionId, zip } : { sessionId }),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("Failed to record return.");
    }
  }

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    async function init() {
      if (!("BarcodeDetector" in window)) {
        setError("Scanning not supported on this device.");
        return;
      }
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
              setResult(code);
              active = false;
              stream?.getTracks().forEach((t) => t.stop());
              if (allowedZips.length === 0) {
                await finalize(code);
              }
              return;
            }
          } catch (err) {
            console.error(err);
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch (err) {
        setError("Unable to access camera.");
      }
    }
    init();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [allowedZips]);

  if (done) {
    return (
      <div className="space-y-4 p-6">
        <p>Return recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Scan to mark return</h1>
      {!result && <video ref={videoRef} className="w-full max-w-md" />}
      {result && allowedZips.length > 0 && (
        <div className="space-y-2">
          <p>Scanned: {result}</p>
          <label className="flex flex-col gap-1">
            Home pickup ZIP
            <select
              className="border p-2"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            >
              <option value="">Select ZIP</option>
              {allowedZips.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
          <button
            className="bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={!zip}
            onClick={() => result && finalize(result)}
          >
            Finalize
          </button>
        </div>
      )}
      {result && allowedZips.length === 0 && <p>Processing...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

