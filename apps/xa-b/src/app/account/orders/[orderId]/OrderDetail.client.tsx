"use client";

import * as React from "react";
import Link from "next/link";

import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

type OrderDetail = {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: number;
  lines: Array<{
    title: string;
    size?: string;
    qty: number;
    unitPrice: number;
  }>;
};

export function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/account/orders/${encodeURIComponent(orderNumber)}`,
          { cache: "no-store" },
        );

        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false);
            setOrder(null);
          }
          return;
        }

        if (response.status === 404) {
          if (!cancelled) {
            setAuthenticated(true);
            setOrder(null);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("load_failed");
        }

        const payload = (await response.json()) as { order?: OrderDetail };
        if (!cancelled) {
          setAuthenticated(true);
          setOrder(payload.order ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load this order right now."); // i18n-exempt -- XA-0111: account UX copy
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order</h1>
        </Section>
        <Section padding="default">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        </Section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to view this order.</p>
        </Section>
        <Section padding="default">
          <Link href="/account/login" className="underline">Login</Link>
        </Section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order</h1>
        </Section>
        <Section padding="default">
          <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">{error}</div>
        </Section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This order could not be found.</p>
        </Section>
        <Section padding="default">
          <Link href="/account/orders" className="underline">Back to your orders</Link>
        </Section>
      </main>
    );
  }

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Order {order.number}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: {order.status}
        </p>
      </Section>

      <Section padding="default">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-end">Qty</TableHead>
                <TableHead className="text-end">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line, idx) => (
                <TableRow key={`${order.id}-line-${idx}`}>
                  <TableCell>{line.title}</TableCell>
                  <TableCell>{line.size ? `Size: ${line.size}` : "—"}</TableCell>
                  <TableCell className="text-end">{line.qty}</TableCell>
                  <TableCell className="text-end">
                    <Price
                      amount={line.qty * line.unitPrice}
                      currency={order.currency}
                      className="font-medium"
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-end font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-end font-semibold">
                  <Price amount={order.total} currency={order.currency} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/orders" className="underline">Back to your orders</Link>
          <Link href="/account/trackingorder" className="underline">Track order</Link>
        </div>
      </Section>
    </main>
  );
}
