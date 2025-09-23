"use client";

import React from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function AnalyticsPixelsSection({ measurementId }: { measurementId?: string }) {
  const [consented, setConsented] = React.useState(false);
  React.useEffect(() => {
    setConsented(getCookie("consent.analytics") === "true");
  }, []);
  if (!consented) return null;
  if (!measurementId) return null;

  const inline = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${measurementId}');`;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}></script>
      <script dangerouslySetInnerHTML={{ __html: inline }} />
    </>
  );
}

