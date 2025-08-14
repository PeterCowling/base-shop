// apps/shop-abc/src/app/account/orders/[id]/page.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { OrderTrackingTimeline, type OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import shop from "../../../../../shop.json";

export const metadata = { title: "Order details" };

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
  const returnSteps: OrderStep[] = [
    { label: "Placed", date: order.startedAt, complete: true },
  ];
  if (order.returnedAt) {
    returnSteps.push({ label: "Returned", date: order.returnedAt, complete: true });
  } else {
    returnSteps.push({ label: "Return pending", complete: false });
  }
  if (order.refundedAt) {
    returnSteps.push({ label: "Refunded", date: order.refundedAt, complete: true });
  }
  const shippingSteps: OrderStep[] = shop.orderTrackingEnabled
    ? ((order.trackingEvents as OrderStep[] | undefined) ?? [])
    : [];
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl">Order {order.id}</h1>
      {shop.orderTrackingEnabled && (
        <OrderTrackingTimeline
          shippingSteps={shippingSteps}
          returnSteps={returnSteps}
          className="mt-2"
        />
      )}
    </div>
  );
}

