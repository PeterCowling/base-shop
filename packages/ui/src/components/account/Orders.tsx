// packages/ui/src/components/account/Orders.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getTrackingStatus as getShippingTrackingStatus } from "@acme/platform-core/shipping";
import { getTrackingStatus as getReturnTrackingStatus } from "@acme/platform-core/returnAuthorization";
import type { RentalOrder } from "@acme/types";
import { redirect } from "next/navigation";
import type { Locale } from "@acme/i18n/locales";
import type { TranslatableText } from "@acme/types/i18n";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import StartReturnButton from "./StartReturnButton";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";
import AccountNavigation from "./AccountNavigation";
import type { ReactNode } from "react";
import { resolveTranslatableText } from "./translations";
import {
  ACCOUNT_PROFILE_PATH,
  ACCOUNT_ORDERS_PATH,
  ACCOUNT_SESSIONS_PATH,
  ACCOUNT_SHELL_TEST_ID,
} from "./constants";

export interface OrdersPageProps {
  /** ID of the current shop for fetching orders */
  shopId: string;
  /** Optional heading override */
  title?: TranslatableText;
  /** Destination to return to after login */
  callbackUrl?: string;
  /** Locale for resolving inline values */
  locale?: Locale;
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
  title,
  callbackUrl = ACCOUNT_ORDERS_PATH,
  returnsEnabled = false,
  returnPolicyUrl,
  trackingEnabled = true,
  trackingProviders = [],
  locale = "en",
}: OrdersPageProps) {
  const t = await getServerTranslations(locale);
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }

  const navLabel = t("account.navigation.ariaLabel");
  const navItems = [
    { href: ACCOUNT_PROFILE_PATH, label: t("account.profile.title") },
    { href: ACCOUNT_ORDERS_PATH, label: t("account.orders.title") },
    { href: ACCOUNT_SESSIONS_PATH, label: t("account.sessions.title") },
  ];
  const headingId = "account-orders-heading";
  const heading = resolveTranslatableText(t, title, "account.orders.title", locale);

  const canViewOrders = hasPermission(session.role, "view_orders");
  let body: ReactNode;

  if (!canViewOrders) {
    body = <p>{t("account.orders.notAuthorized")}</p>;
  } else {
    const orders: RentalOrder[] = await getOrdersForCustomer(
      shopId,
      session.customerId,
    );

    if (!orders.length) {
      body = <p>{t("account.orders.empty")}</p>;
    } else {
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
            if (typeof ship.status === "string") {
              status = ship.status as string;
            }
            const ret = await getReturnTrackingStatus({
              provider,
              trackingNumber: o.trackingNumber,
            });
            returnSteps = ret.steps as OrderStep[];
          }
          return (
            <li key={o.id} className="rounded border p-4">
              <div>{t("account.orders.orderLabel")} {o.id}</div>
              {o.expectedReturnDate && <div>{t("account.orders.returnLabel")} {o.expectedReturnDate}</div>}
              <OrderTrackingTimeline
                shippingSteps={shippingSteps}
                returnSteps={returnSteps}
                trackingEnabled={trackingEnabled}
                className="mt-2"
              />
              {status && <p className="mt-2 text-sm">{t("account.orders.statusLabel")} {status}</p>}
              {returnStatus && (
                <p className="mt-2 text-sm">{t("account.orders.returnLabel")} {returnStatus}</p>
              )}
              {returnsEnabled && !o.returnedAt && (
                <StartReturnButton sessionId={o.sessionId} />
              )}
            </li>
          );
        }),
      );

      body = (
        <>
          {returnsEnabled && returnPolicyUrl && (
            <p className="pb-4">
              <a
                href={returnPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-block min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("account.orders.returnPolicy")}
              </a>
            </p>
          )}
          <ul className="space-y-2" data-testid="orders-list" data-cy="orders-list">
            {items}
          </ul>
        </>
      );
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row" data-testid={ACCOUNT_SHELL_TEST_ID}>
        <AccountNavigation ariaLabel={navLabel} currentPath={ACCOUNT_ORDERS_PATH} items={navItems} />
        <main
          className="flex-1 rounded border p-4 md:p-6"
          role="main"
          aria-labelledby={headingId}
        >
          <h1 id={headingId} className="mb-4 text-xl">{heading}</h1>
          {body}
        </main>
      </div>
    </div>
  );
}
