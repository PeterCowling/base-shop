"use client";

import * as React from "react";
import type { RentalOrder } from "@acme/types";
import { Price } from "../../atoms/Price";
import { Grid as GridPrimitive } from "../../atoms/primitives/Grid";
import { LinkText } from "../../atoms";
import { useTranslations } from "@acme/i18n";

type OrderSummary = { id: string; total: number; date: string; status?: string };

export interface AccountSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  showDashboard?: boolean;
  showOrders?: boolean;
  showRentals?: boolean;
  showAddresses?: boolean;
  showPayments?: boolean;
  ordersAdapter?: () => Promise<OrderSummary[]>;
  rentalsAdapter?: () => Promise<RentalOrder[]>;
}

export default function AccountSection({ showDashboard = true, showOrders = true, showRentals = true, showAddresses = true, showPayments = true, ordersAdapter, rentalsAdapter, className, ...rest }: AccountSectionProps) {
  const t = useTranslations();
  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [rentals, setRentals] = React.useState<RentalOrder[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        if (ordersAdapter) {
          const o = await ordersAdapter();
          if (active) setOrders(o);
        }
        if (rentalsAdapter) {
          const r = await rentalsAdapter();
          if (active) setRentals(r);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [ordersAdapter, rentalsAdapter]);

  return (
    <section className={className} {...rest}>
      <GridPrimitive className="mx-auto md:grid-cols-3" cols={1} gap={6}>
        {showDashboard ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">{t("Dashboard")}</h3>
            <ul className="text-sm text-neutral-700">
              <li>{t("Orders:") } {orders.length}</li>
              <li>{t("Active rentals:") } {rentals.filter((r) => !r.returnedAt).length}</li>
            </ul>
          </div>
        ) : null}
        {showOrders ? (
          <div className="rounded border p-4 md:col-span-2">
            <h3 className="mb-2 text-lg font-semibold">{t("Orders")}</h3>
            {loading && orders.length === 0 ? <div className="text-sm text-neutral-600">{t("Loading…")}</div> : null}
            {orders.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-start">
                    <th className="py-2">{t("Order")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Status")}</th>
                    <th className="text-end">{t("Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2">
                        <LinkText href={`/account/orders/${o.id}`} className="min-h-10 min-w-10">{o.id}</LinkText>
                      </td>
                      <td>{new Date(o.date).toLocaleDateString()}</td>
                      <td>{o.status ?? ""}</td>
                      <td className="text-end"><Price amount={o.total} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-neutral-600">{t("No orders yet.")}</div>
            )}
          </div>
        ) : null}
        {showRentals ? (
          <div className="rounded border p-4 md:col-span-2">
            <h3 className="mb-2 text-lg font-semibold">{t("Rentals")}</h3>
            {loading && rentals.length === 0 ? <div className="text-sm text-neutral-600">{t("Loading…")}</div> : null}
            {rentals.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-start">
                    <th className="py-2">{t("Rental")}</th>
                    <th>{t("Start")}</th>
                    <th>{t("Due")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2">
                        <LinkText href={`/account/rentals/${r.id}`} className="min-h-10 min-w-10">{r.id}</LinkText>
                      </td>
                      <td>{new Date(r.startedAt).toLocaleDateString()}</td>
                      <td>{r.returnDueDate ? new Date(r.returnDueDate).toLocaleDateString() : "—"}</td>
                      <td>{r.returnedAt ? t("Returned") : t("Active")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-neutral-600">{t("No rentals yet.")}</div>
            )}
          </div>
        ) : null}
        {showAddresses ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">{t("Addresses")}</h3>
            <LinkText href="/account/addresses" className="text-sm min-h-10 min-w-10">{t("Manage addresses")}</LinkText>
          </div>
        ) : null}
        {showPayments ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">{t("Payment methods")}</h3>
            <LinkText href="/account/payments" className="text-sm min-h-10 min-w-10">{t("Manage payment methods")}</LinkText>
          </div>
        ) : null}
      </GridPrimitive>
    </section>
  );
}
