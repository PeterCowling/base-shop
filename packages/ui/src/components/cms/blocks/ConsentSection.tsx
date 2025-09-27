"use client";

import React from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const pair = document.cookie.split("; ").find((row) => row.startsWith(needle));
  return pair ? decodeURIComponent(pair.slice(needle.length)) : null;
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
    <div className="relative">
      <div className="sticky inset-x-0 bottom-0 bg-neutral-900 p-4 text-white w-full">
        <div className="mx-auto flex items-center justify-between gap-4">
          {/* i18n-exempt: short compliance notice */}
          <p className="text-sm">We use cookies to analyze traffic (GA4). You can change your choice anytime.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-white px-3 py-1 text-sm text-black inline-flex items-center justify-center min-h-10 min-w-10"
              onClick={() => { setCookie("consent.analytics", "false"); setShown(false); }}
            >
              {/* i18n-exempt: button label */}
              Reject
            </button>
            <button
              type="button"
              className="rounded bg-green-400 px-3 py-1 text-sm text-black inline-flex items-center justify-center min-h-10 min-w-10"
              onClick={() => { setCookie("consent.analytics", "true"); setShown(false); }}
            >
              {/* i18n-exempt: button label */}
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
