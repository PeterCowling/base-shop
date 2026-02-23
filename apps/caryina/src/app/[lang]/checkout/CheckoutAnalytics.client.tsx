"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function CheckoutAnalytics({
  locale,
  value,
  currency,
}: {
  locale: string;
  value?: number;
  currency?: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
    void logAnalyticsEvent({
      type: "checkout_started",
      value,
      currency,
      locale,
    });
  }, [currency, locale, pathname, value]);

  return null;
}
