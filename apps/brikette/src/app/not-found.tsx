// src/app/not-found.tsx
// Global 404 page (for requests without language prefix)
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { type AppLanguage, i18nConfig } from "@/i18n.config";

export default function GlobalNotFound() {
  const lang = i18nConfig.fallbackLng as AppLanguage;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Fire GA4 page_not_found event (GA4-07)
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === "function") {
      win.gtag("event", "page_not_found", {
        page_path: pathname ?? window.location.pathname,
      });
    }

    // Redirect to the language-prefixed home page
    router.replace(`/${lang}`);
  }, [lang, pathname, router]);

  return null;
}
