"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function CheckoutAnalytics({ locale }: { locale: string }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
  }, [pathname, locale]);
  return null;
}
