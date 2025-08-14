// apps/shop-abc/src/app/account/orders/[id]/page.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { OrderTrackingTimeline, type OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import { useState } from "react";
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
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl">Order {order.id}</h1>
      {steps && steps.length > 0 && (
        <OrderTrackingTimeline steps={steps} className="mt-2" />
      )}
      <StartReturn orderId={order.id} />
    </div>
  );
}

function StartReturn({ orderId }: { orderId: string }) {
  "use client";
  const [result, setResult] = useState<
    | { labelUrl: string; trackingNumber?: string | undefined }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    try {
      setError(null);
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to start return");
      }
      setResult({
        labelUrl: data.labelUrl,
        trackingNumber: data.tracking?.number,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Start return
      </button>
      {result && (
        <div className="space-y-1">
          <p>
            Label: {" "}
            <a href={result.labelUrl} className="text-blue-600 underline">
              {result.labelUrl}
            </a>
          </p>
          {result.trackingNumber && <p>Tracking #: {result.trackingNumber}</p>}
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

