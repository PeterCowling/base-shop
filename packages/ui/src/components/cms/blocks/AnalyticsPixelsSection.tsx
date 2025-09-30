"use client";

import React from "react";
import Script from "next/script";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  // Avoid dynamic RegExp to satisfy security/detect-non-literal-regexp
  const pairs = document.cookie.split("; ");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const key = decodeURIComponent(pair.slice(0, eqIndex));
    if (key === name) {
      return decodeURIComponent(pair.slice(eqIndex + 1));
    }
  }
  return null;
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

  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — script content is code, not user-facing copy
  const inline = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${measurementId}');`;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        async
        nonce={nonce}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — strategy is a config string, not user copy
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        nonce={nonce}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — strategy is a config string, not user copy
        strategy="afterInteractive"
      >
        {inline}
      </Script>
    </>
  );
}
