import { getReturnLogistics } from "@platform-core/returnLogistics";
import { useEffect, useRef, useState } from "react";

export const metadata = { title: "Mobile Returns" };

export default async function MobileReturnPage() {
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return <p className="p-6">Mobile returns are not enabled.</p>;
  }
  return <Scanner />;
}

function Scanner() {
  "use client";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
              await fetch("/api/returns/mobile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: code }),
              });
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
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Scan to mark return</h1>
      <video ref={videoRef} className="w-full max-w-md" />
      {result && <p>Scanned: {result}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

