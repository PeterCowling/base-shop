// apps/cover-me-pretty/src/app/account/orders/[id]/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCustomerSession } from "@acme/auth";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getReturnLogistics } from "@acme/platform-core/returnLogistics";
import {
  type OrderStep,
  OrderTrackingTimeline,
} from "@acme/ui/components/organisms/OrderTrackingTimeline";

import shop from "../../../../../shop.json";

import { MobileReturnLink } from "./MobileReturnLink";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  // Default to English; this route is not currently locale-scoped
  const t = await getServerTranslations("en");
  return { title: t("account.orders.detailsTitle", { id: params.id }) };
}

async function getTracking(id: string): Promise<OrderStep[] | null> {
  try {
    const res = await fetch(`/api/orders/${id}/tracking`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { steps?: OrderStep[] };
    return data.steps ?? null;
  } catch {
    return null;
  }
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const t = await getServerTranslations("en");
  const session = await getCustomerSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/orders/${params.id}`)}`);
    return null as never;
  }

  let orderId: string | null = null;
  let steps: OrderStep[] | null = null;
  let mobileAppEnabled = false;
  let loadError = false;

  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    orderId = order?.id ?? null;

    if (orderId) {
      steps = await getTracking(orderId);
      const cfg = await getReturnLogistics();
      mobileAppEnabled = Boolean(cfg.mobileApp);
    }
  } catch (err) {
    // i18n-exempt -- ABC-123 developer log message [ttl=2025-06-30]
    console.error("Failed to load order", err);
    loadError = true;
  }

  if (loadError) {
    return <p className="p-6">{t("account.orders.loadFailed")}</p>;
  }

  if (!orderId) {
    return <p className="p-6">{t("account.orders.notFound")}</p>;
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl">
        {t("account.orders.detailsTitle", { id: orderId })}
      </h1>
      {steps && steps.length > 0 && (
        <OrderTrackingTimeline steps={steps} className="mt-2" />
      )}
      {mobileAppEnabled && <MobileReturnLink />}
    </div>
  );
}
