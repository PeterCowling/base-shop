"use client";
// apps/shop-bcd/src/app/account/orders/[id]/page.tsx
import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { OrderTrackingTimeline, type OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import shop from "../../../../../shop.json";

export const metadata = { title: "Order details" };

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
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/orders/${params.id}`)}`);
    return null as never;
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    if (!order) return <p className="p-6">Order not found.</p>;
    const steps = await getTracking(order.id);
    const cfg = await getReturnLogistics();
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl">Order {order.id}</h1>
        {steps && steps.length > 0 && (
          <OrderTrackingTimeline steps={steps} className="mt-2" />
        )}
        {cfg.mobileApp && <MobileReturnLink />}
      </div>
    );
  } catch (err) {
    console.error("Failed to load order", err);
    return <p className="p-6">Unable to load order.</p>;
  }
}

function MobileReturnLink() {
  "use client";
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/returns/mobile`;
    QRCode.toDataURL(url).then(setQr).catch(console.error);
  }, []);
  return (
    <div className="space-y-2">
      <a href="/returns/mobile" className="text-blue-600 underline">
        Return using mobile app
      </a>
      {qr && <img src={qr} alt="Mobile return QR" className="h-32 w-32" />}
    </div>
  );
}

