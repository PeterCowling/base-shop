"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";

interface ScannerProps {
  allowedZips: string[];
}

export default function Scanner({ allowedZips }: ScannerProps) {
  const t = useTranslations();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [zip, setZip] = React.useState("");
  const [done, setDone] = React.useState(false);

  const finalize = React.useCallback(
    async (sessionId: string) => {
      try {
        await fetch("/api/returns/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zip ? { sessionId, zip } : { sessionId }),
        });
        setDone(true);
      } catch (err) {
        console.error(err);
        setError(t("returns.scanner.recordError") as string);
      }
    },
    [zip, t]
  );

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    async function init() {
      if (!("BarcodeDetector" in window)) {
        setError(t("returns.scanner.notSupported") as string);
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
        const detector = new (window as unknown as {
          BarcodeDetector: new (config: { formats: string[] }) => {
            detect: (
              source: HTMLVideoElement
            ) => Promise<Array<{ rawValue: string }>>;
          };
        }).BarcodeDetector({
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
      } catch {
        setError(t("returns.scanner.cameraAccessError") as string);
      }
    }
    init();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [allowedZips, finalize, t]);

  if (done) {
    return (
      <div className="space-y-4 p-6">
        <p>{t("returns.scanner.returnRecorded")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">{t("returns.scanner.title")}</h1>
      {!result && <video ref={videoRef} className="w-full" data-aspect="16/9" />}
      {result && allowedZips.length > 0 && (
        <div className="space-y-2">
          <p>
            {t("returns.scanner.scannedLabel")} {result}
          </p>
          <label className="flex flex-col gap-1">
            {t("returns.scanner.homePickupZip")}
            <select
              className="border p-2"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            >
              <option value="">{t("returns.scanner.selectZip")}</option>
              {allowedZips.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
          <button
            className="bg-blue-600 px-4 py-2 text-white disabled:opacity-50 min-h-11 min-w-11"
            disabled={!zip}
            onClick={() => result && finalize(result)}
          >
            {t("returns.scanner.finalize")}
          </button>
        </div>
      )}
      {result && allowedZips.length === 0 && <p>{t("returns.scanner.processing")}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
