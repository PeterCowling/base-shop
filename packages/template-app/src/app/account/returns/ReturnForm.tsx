"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";

interface ReturnFormProps {
  bagType?: string;
  tracking?: boolean;
}

export default function ReturnForm({
  bagType,
  tracking: trackingEnabled,
}: ReturnFormProps) {
  const tRaw = useTranslations();
  const t = (key: string, vars?: Record<string, unknown>) => tRaw(`account.returns.form.${key}`, vars as any);
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
        const detector = new window.BarcodeDetector({
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
        setError(String(t("cameraError")));
      }
    }
    init();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [t]);

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
        setError(data.error || String(t("createReturnFailed")));
        return;
      }
      setLabelUrl(data.labelUrl ?? null);
      setTrackingNumber(data.tracking ?? null);
    } catch {
      setError(String(t("createReturnFailed")));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {bagType && <p>{t("reuseBag", { bagType })}</p>}
      <video ref={videoRef} className="w-full" data-aspect="16/9" />
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder={String(t("sessionIdPlaceholder"))}
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary text-white px-4 min-h-10 min-w-10 inline-flex items-center justify-center"
        >
          {t("submit")}
        </button>
      </form>
      {labelUrl && trackingEnabled && (
        <p>
          <a
            href={labelUrl}
            className="text-blue-600 underline inline-flex items-center min-h-10 min-w-10"
            target="_blank"
            rel="noreferrer"
          >
            {t("printLabel")}
          </a>
          {trackingNumber && (
            <span className="block">{t("tracking", { trackingNumber })}</span>
          )}
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
