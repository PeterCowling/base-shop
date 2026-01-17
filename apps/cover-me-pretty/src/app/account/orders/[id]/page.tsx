// apps/cover-me-pretty/src/app/account/orders/[id]/page.tsx
import { getCustomerSession } from "@acme/auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getReturnLogistics } from "@acme/platform-core/returnLogistics";
import { OrderTrackingTimeline, type OrderStep } from "@acme/ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import type { Metadata } from "next";
import shop from "../../../../../shop.json";
import { MobileReturnLink } from "./MobileReturnLink";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
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

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerTranslations("en");
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/orders/${params.id}`)}`);
    return null as never;
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    if (!order) return <p className="p-6">{t("account.orders.notFound")}</p>;
    const steps = await getTracking(order.id);
    const cfg = await getReturnLogistics();
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl">{t("account.orders.detailsTitle", { id: order.id })}</h1>
        {steps && steps.length > 0 && (
          <OrderTrackingTimeline steps={steps} className="mt-2" />
        )}
        {cfg.mobileApp && <MobileReturnLink />}
      </div>
    );
  } catch (err) {
    // i18n-exempt -- ABC-123 developer log message [ttl=2025-06-30]
    console.error("Failed to load order", err);
    return <p className="p-6">{t("account.orders.loadFailed")}</p>;
  }
}
