// apps/shop-abc/src/app/account/orders/[id]/page.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import {
  OrderTrackingTimeline,
  type OrderStep,
} from "@ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import shop from "../../../../../shop.json";

export const metadata = { title: "Order details" };

async function getTracking(id: string): Promise<OrderStep[] | null> {
  try {
    const res = await fetch(`/api/orders/${id}/tracking`, {
      cache: "no-store",
    });
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
  if (!hasPermission(session.role, "view_orders")) {
    return <p className="p-6">Not authorized.</p>;
  }
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
      {shop.luxuryFeatures?.returns && <StartReturn orderId={order.id} />}
      {cfg.mobileApp && <MobileReturnLink />}
    </div>
  );
}

function StartReturn({ orderId }: { orderId: string }) {
  "use client";
  const [result, setResult] = useState<{ labelUrl?: string; trackingNumber?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: orderId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create return");
      }
      const data = (await res.json()) as {
        tracking: { number: string; labelUrl: string } | null;
      };
      if (data.tracking) {
        setResult({
          labelUrl: data.tracking.labelUrl,
          trackingNumber: data.tracking.number,
        });
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Start return
      </button>
      {result?.labelUrl && (
        <p>
          Label: <a href={result.labelUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">Download</a>
        </p>
      )}
      {result?.trackingNumber && <p>Tracking #: {result.trackingNumber}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
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

