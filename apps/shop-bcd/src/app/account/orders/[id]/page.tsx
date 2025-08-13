// apps/shop-bcd/src/app/account/orders/[id]/page.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { redirect } from "next/navigation";
import { OrderTrackingTimeline, type OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import shop from "../../../../../shop.json";

interface PageProps {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: PageProps) {
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
  if (!order) {
    return <p className="p-6">Order not found.</p>;
  }

  let shipment: OrderStep[] = [];
  let returns: OrderStep[] = [];
  try {
    const res = await fetch(`/api/orders/${params.id}/tracking`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      shipment = data.shipment ?? [];
      returns = data.returns ?? [];
    }
  } catch {
    // ignore tracking errors
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl">Order {order.id}</h1>
      {shipment.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Delivery</h2>
          <OrderTrackingTimeline steps={shipment} />
        </div>
      )}
      {returns.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Return</h2>
          <OrderTrackingTimeline steps={returns} />
        </div>
      )}
    </div>
  );
}

