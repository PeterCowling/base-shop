"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function SuccessAnalytics({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const orderId = searchParams.get("orderId") ?? undefined;
    const amountRaw = searchParams.get("amount");
    const amount = amountRaw ? Number(amountRaw) : undefined;
    const currency = searchParams.get("currency") ?? undefined;

    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
    void logAnalyticsEvent({
      type: "order_completed",
      path: pathname,
      locale,
      orderId,
      amount: Number.isFinite(amount) ? amount : undefined,
      currency,
    });
  }, [locale, pathname, searchParams]);

  return null;
}
