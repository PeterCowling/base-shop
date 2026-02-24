"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function ShopAnalytics({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
  }, [locale, pathname]);

  return null;
}
