"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function ProductAnalytics({
  locale,
  productId,
}: {
  locale: string;
  productId: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
    void logAnalyticsEvent({
      type: "product_view",
      productId,
      path: pathname,
      locale,
    });
  }, [locale, pathname, productId]);

  return null;
}
