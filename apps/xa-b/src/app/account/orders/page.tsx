"use client";

import * as React from "react";
import Link from "next/link";

import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

type OrderRow = {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: number;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/account/orders", { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false);
            setOrders([]);
          }
          return;
        }
        if (!response.ok) {
          throw new Error("load_failed");
        }

        const payload = (await response.json()) as { orders?: OrderRow[] };
        if (!cancelled) {
          setAuthenticated(true);
          setOrders(Array.isArray(payload.orders) ? payload.orders : []);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load your orders right now."); // i18n-exempt -- XA-0111: account UX copy
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </Section>

      <Section padding="default">
        {loading ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Loading your orders...
          </div>
        ) : !authenticated ? (
          <div className="rounded-lg border p-6">
            <div className="font-medium">Sign in to view your orders.</div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href="/account/login" className="underline">Login</Link>
              <Link href="/account/register" className="underline">Create account</Link>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border p-6 text-sm text-danger-fg">{error}</div>
        ) : orders.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.number}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-end">
                      <Price amount={order.total} currency={order.currency} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Link href={`/account/orders/${order.number}`} className="underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border p-6">
            <div className="font-medium">You have no orders yet.</div>
            <div className="mt-2 text-sm text-muted-foreground">Start shopping to place your first order.</div>
            <div className="mt-4">
              <Link href="/collections/all" className="underline">Shop all</Link>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
