"use client";

import * as React from "react";
import type { RentalOrder } from "@acme/types";
import { Price } from "../../atoms/Price";

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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {showDashboard ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">Dashboard</h3>
            <ul className="text-sm text-neutral-700">
              <li>Orders: {orders.length}</li>
              <li>Active rentals: {rentals.filter((r) => !r.returnedAt).length}</li>
            </ul>
          </div>
        ) : null}
        {showOrders ? (
          <div className="rounded border p-4 md:col-span-2">
            <h3 className="mb-2 text-lg font-semibold">Orders</h3>
            {loading && orders.length === 0 ? <div className="text-sm text-neutral-600">Loading…</div> : null}
            {orders.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-start">
                    <th className="py-2">Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2"><a href={`/account/orders/${o.id}`} className="underline">{o.id}</a></td>
                      <td>{new Date(o.date).toLocaleDateString()}</td>
                      <td>{o.status ?? ""}</td>
                      <td className="text-end"><Price amount={o.total} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-neutral-600">No orders yet.</div>
            )}
          </div>
        ) : null}
        {showRentals ? (
          <div className="rounded border p-4 md:col-span-2">
            <h3 className="mb-2 text-lg font-semibold">Rentals</h3>
            {loading && rentals.length === 0 ? <div className="text-sm text-neutral-600">Loading…</div> : null}
            {rentals.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-start">
                    <th className="py-2">Rental</th>
                    <th>Start</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2"><a href={`/account/rentals/${r.id}`} className="underline">{r.id}</a></td>
                      <td>{new Date(r.startedAt).toLocaleDateString()}</td>
                      <td>{r.returnDueDate ? new Date(r.returnDueDate).toLocaleDateString() : "—"}</td>
                      <td>{r.returnedAt ? "Returned" : "Active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-neutral-600">No rentals yet.</div>
            )}
          </div>
        ) : null}
        {showAddresses ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">Addresses</h3>
            <a href="/account/addresses" className="text-sm underline">Manage addresses</a>
          </div>
        ) : null}
        {showPayments ? (
          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-semibold">Payment methods</h3>
            <a href="/account/payments" className="text-sm underline">Manage payment methods</a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

