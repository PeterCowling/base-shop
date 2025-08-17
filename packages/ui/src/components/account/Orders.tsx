// packages/ui/src/components/account/Orders.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { getTrackingStatus as getShippingTrackingStatus } from "@platform-core/shipping";
import { getTrackingStatus as getReturnTrackingStatus } from "@platform-core/returnAuthorization";
import type { RentalOrder } from "@acme/types";
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
  /** Whether returns are enabled */
  returnsEnabled?: boolean;
  /** Optional return policy link */
  returnPolicyUrl?: string;
  /** Whether tracking is enabled for this shop */
  trackingEnabled?: boolean;
  /** List of carriers supported for tracking */
  trackingProviders?: string[];
}

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  shopId,
  title = "Orders",
  callbackUrl = "/account/orders",
  returnsEnabled = false,
  returnPolicyUrl,
  trackingEnabled = true,
  trackingProviders = [],
}: OrdersPageProps) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  if (!hasPermission(session.role, "view_orders")) {
    return <p className="p-6">Not authorized.</p>;
  }
  const orders: RentalOrder[] = await getOrdersForCustomer(
    shopId,
    session.customerId,
  );
  if (!orders.length) return <p className="p-6">No orders yet.</p>;

  const items = await Promise.all(
    orders.map(async (o) => {
      let shippingSteps: OrderStep[] = [];
      let returnSteps: OrderStep[] = [];
      let status: string | null = null;
      const returnStatus = o.returnStatus ?? null;
      if (trackingEnabled && trackingProviders.length > 0 && o.trackingNumber) {
        const provider = trackingProviders[0] as "ups" | "dhl";
        const ship = await getShippingTrackingStatus({
          provider,
          trackingNumber: o.trackingNumber,
        });
        shippingSteps = ship.steps as OrderStep[];
        status = ship.status;
        const ret = await getReturnTrackingStatus({
          provider,
          trackingNumber: o.trackingNumber,
        });
        returnSteps = ret.steps as OrderStep[];
      }
      return (
        <li key={o.id} className="rounded border p-4">
          <div>Order: {o.id}</div>
          {o.expectedReturnDate && <div>Return: {o.expectedReturnDate}</div>}
          <OrderTrackingTimeline
            shippingSteps={shippingSteps}
            returnSteps={returnSteps}
            trackingEnabled={trackingEnabled}
            className="mt-2"
          />
          {status && <p className="mt-2 text-sm">Status: {status}</p>}
          {returnStatus && (
            <p className="mt-2 text-sm">Return: {returnStatus}</p>
          )}
          {returnsEnabled && !o.returnedAt && (
            <StartReturnButton sessionId={o.sessionId} />
          )}
        </li>
      );
    }),
  );

  return (
    <>
      <h1 className="p-6 text-xl">{title}</h1>
      {returnsEnabled && returnPolicyUrl && (
        <p className="p-6 pt-0">
          <a
            href={returnPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Return policy
          </a>
        </p>
      )}
      <ul className="space-y-2 p-6">{items}</ul>
    </>
  );
}

