// packages/ui/src/components/account/OrderDetail.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { getShopSettings } from "@platform-core/src/repositories/settings.server";
import { redirect } from "next/navigation";
import StartReturnButton from "./StartReturnButton";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";

export interface OrderDetailPageProps {
  /** ID of the current shop for fetching orders */
  shopId: string;
  /** Order identifier coming from the route */
  orderId: string;
  /** Optional heading override */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: "Order" };

export default async function OrderDetailPage({
  shopId,
  orderId,
  title = "Order",
  callbackUrl = `/account/orders/${orderId}`,
}: OrderDetailPageProps) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  if (!hasPermission(session.role, "view_orders")) {
    return <p className="p-6">Not authorized.</p>;
  }

  const orders = await getOrdersForCustomer(shopId, session.customerId);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return <p className="p-6">Order not found.</p>;

  let steps: OrderStep[] | undefined;
  const settings = await getShopSettings(shopId);
  if (settings.trackingProviders?.length) {
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { steps?: OrderStep[] };
        if (data.steps && data.steps.length) {
          steps = [
            { label: "Placed", date: order.startedAt, complete: true },
            ...data.steps,
          ];
          if (order.returnedAt) {
            steps.push({ label: "Returned", date: order.returnedAt, complete: true });
          } else {
            steps.push({ label: "Return pending", complete: false });
          }
          if (order.refundedAt) {
            steps.push({ label: "Refunded", date: order.refundedAt, complete: true });
          }
        }
      }
    } catch {
      // ignore fetch errors
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl">{title}</h1>
      <div className="mt-2">Order: {order.id}</div>
      {order.expectedReturnDate && (
        <div className="mt-2">Return: {order.expectedReturnDate}</div>
      )}
      {steps && <OrderTrackingTimeline steps={steps} className="mt-4" />}
      {!order.returnedAt && (
        <div className="mt-4">
          <StartReturnButton sessionId={order.sessionId} />
        </div>
      )}
    </div>
  );
}

