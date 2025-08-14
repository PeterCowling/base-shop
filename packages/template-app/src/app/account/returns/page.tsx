import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import React, { useEffect, useRef, useState } from "react";

const SHOP_ID = "bcd";
import CleaningInfo from "../../../components/CleaningInfo";
import shop from "../../../../shop.json";

export const metadata = { title: "Mobile Returns" };

export default async function ReturnsPage() {
  const [cfg, info, settings] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
  ]);
  if (!cfg.mobileApp) {
    return <p className="p-6">Mobile returns are not enabled.</p>;
  }
  const bagType = settings.returnService?.bagEnabled ? info.bagType : undefined;
  const tracking = info.tracking;
  return (
    <>
      <ReturnForm bagType={bagType} tracking={tracking} />
      {shop.showCleaningTransparency && <CleaningInfo />}
    </>
  );
}

interface ReturnFormProps {
  bagType?: string;
  tracking?: boolean;
}

function ReturnForm({ bagType, tracking: trackingEnabled }: ReturnFormProps) {
  "use client";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState("");
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
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
