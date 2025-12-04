// apps/cover-me-pretty/src/app/[lang]/success/SuccessAnalytics.client.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logAnalyticsEvent } from "@platform-core/analytics/client";

export default function SuccessAnalytics({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!pathname) return;
    let payload: { orderId?: string; amount?: number; currency?: string } = {};
    if (searchParams) {
      const oid = searchParams.get("orderId") || undefined;
      const amtRaw = searchParams.get("amount");
      const cur = searchParams.get("currency") || undefined;
      const amt = amtRaw ? Number(amtRaw) : undefined;
      if (oid) payload.orderId = oid;
      if (Number.isFinite(amt)) payload.amount = amt as number;
      if (cur) payload.currency = cur;
    }
    try {
      const raw = window.sessionStorage.getItem("lastOrder");
      if (raw) {
        const parsed = JSON.parse(raw) as typeof payload;
        payload = parsed ?? {};
        window.sessionStorage.removeItem("lastOrder");
      }
    } catch {
      /* ignore */
    }
    const needsPlatformId =
      !payload.orderId || payload.orderId.startsWith("pi_") || payload.orderId.startsWith("cs_");
    (async () => {
      let finalPayload = payload;
      if (needsPlatformId) {
        try {
          const res = await fetch("/api/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentIntentId: payload.orderId,
              amount: payload.amount,
              currency: payload.currency,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as { orderId?: string };
          if (data.orderId) {
            finalPayload = { ...finalPayload, orderId: data.orderId };
            try {
              window.sessionStorage.setItem("lastOrder", JSON.stringify({ ...finalPayload }));
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      }
      void logAnalyticsEvent({ type: "order_completed", path: pathname, locale, ...finalPayload });
    })();
  }, [pathname, locale, searchParams]);
  return null;
}
