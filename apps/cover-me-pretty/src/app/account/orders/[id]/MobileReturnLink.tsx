"use client";
// apps/cover-me-pretty/src/app/account/orders/[id]/MobileReturnLink.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

import { useTranslations } from "@acme/i18n";

export function MobileReturnLink() {
  const t = useTranslations();
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/returns/mobile`;
    QRCode.toDataURL(url).then(setQr).catch(console.error);
  }, []);
  return (
    <div className="space-y-2">
      <a href="/returns/mobile" className="inline-flex min-h-11 min-w-11 items-center text-blue-600 underline px-2">
        {t("returns.mobile.link")}
      </a>
      {qr && (
        <Image
          src={qr}
          alt={t("returns.mobile.qrAlt") as string}
          width={128}
          height={128}
          className="h-32 w-32"
        />
      )}
    </div>
  );
}
