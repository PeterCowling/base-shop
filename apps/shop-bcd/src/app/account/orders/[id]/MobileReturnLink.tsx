"use client";
// apps/shop-bcd/src/app/account/orders/[id]/MobileReturnLink.tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function MobileReturnLink() {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/returns/mobile`;
    QRCode.toDataURL(url).then(setQr).catch(console.error);
  }, []);
  return (
    <div className="space-y-2">
      <a href="/returns/mobile" className="text-blue-600 underline">
        Return using mobile app
      </a>
      {qr && <img src={qr} alt="Mobile return QR" className="h-32 w-32" />}
    </div>
  );
}
