"use client";
// apps/shop-bcd/src/app/account/orders/[id]/MobileReturnLink.tsx
import Image from "next/image";
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
      {qr && (
        <Image
          src={qr}
          alt="Mobile return QR"
          width={128}
          height={128}
          className="h-32 w-32"
        />
      )}
    </div>
  );
}
