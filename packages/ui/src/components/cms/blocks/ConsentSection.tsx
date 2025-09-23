"use client";

import React from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days = 180) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export default function ConsentSection() {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const consent = getCookie("consent.analytics");
    setShown(consent !== "true");
  }, []);
  if (!shown) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 p-4 text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <p className="text-sm">We use cookies to analyze traffic (GA4). You can change your choice anytime.</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-white px-3 py-1 text-sm text-black"
            onClick={() => { setCookie("consent.analytics", "false"); setShown(false); }}
          >
            Reject
          </button>
          <button
            type="button"
            className="rounded bg-green-400 px-3 py-1 text-sm text-black"
            onClick={() => { setCookie("consent.analytics", "true"); setShown(false); }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

