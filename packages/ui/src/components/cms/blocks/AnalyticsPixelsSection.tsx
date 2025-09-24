"use client";

import React from "react";
import Script from "next/script";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function AnalyticsPixelsSection({ measurementId }: { measurementId?: string }) {
  const [consented, setConsented] = React.useState(false);
  const [nonce, setNonce] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setConsented(getCookie("consent.analytics") === "true");
    setNonce(getCookie("csp-nonce") ?? undefined);
  }, []);

  if (!consented) return null;
  if (!measurementId) return null;

  const inline = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${measurementId}');`;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        async
        nonce={nonce}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        nonce={nonce}
        strategy="afterInteractive"
      >
        {inline}
      </Script>
    </>
  );
}
