// packages/ui/src/components/account/Orders.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { redirect } from "next/navigation";
import StartReturnButton from "./StartReturnButton";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";

export interface OrdersPageProps {
  /** ID of the current shop for fetching orders */
  shopId: string;
  /** Optional heading override */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  shopId,
  title = "Orders",
  callbackUrl = "/account/orders",
}: OrdersPageProps) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  if (!hasPermission(session.role, "view_orders")) {
    return <p className="p-6">Not authorized.</p>;
  }
  const orders = await getOrdersForCustomer(shopId, session.customerId);
  if (!orders.length) return <p className="p-6">No orders yet.</p>;
  return (
    <>
      <h1 className="p-6 text-xl">{title}</h1>
      <ul className="space-y-2 p-6">
        {orders.map((o) => {
          const steps: OrderStep[] = [
            { label: "Placed", date: o.startedAt, complete: true },
          ];
          if (o.returnedAt) {
            steps.push({ label: "Returned", date: o.returnedAt, complete: true });
          } else {
            steps.push({ label: "Return pending", complete: false });
          }
          if (o.refundedAt) {
            steps.push({ label: "Refunded", date: o.refundedAt, complete: true });
          }
          return (
            <li key={o.id} className="rounded border p-4">
              <div>Order: {o.id}</div>
              {o.expectedReturnDate && (
                <div>Return: {o.expectedReturnDate}</div>
              )}
              <OrderTrackingTimeline steps={steps} className="mt-2" />
              {!o.returnedAt && <StartReturnButton sessionId={o.sessionId} />}
            </li>
          );
        })}
      </ul>
    </>
  );
}

