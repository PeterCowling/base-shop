"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const consent = getCookie("consent.analytics");
    setShown(consent !== "true");
  }, []);
  if (!shown) return null;
  return (
    <div className="relative">
      <div className="sticky inset-x-0 bottom-0 bg-background p-4 text-foreground w-full">
        <div className="mx-auto flex items-center justify-between gap-4">
          <p className="text-sm">{t("consent.message")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-card px-3 py-1 text-sm text-foreground inline-flex items-center justify-center min-h-10 min-w-10"
              onClick={() => { setCookie("consent.analytics", "false"); setShown(false); }}
            >
              {t("consent.reject")}
            </button>
            <button
              type="button"
              className="rounded bg-primary px-3 py-1 text-sm text-foreground inline-flex items-center justify-center min-h-10 min-w-10"
              onClick={() => { setCookie("consent.analytics", "true"); setShown(false); }}
            >
              {t("consent.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
