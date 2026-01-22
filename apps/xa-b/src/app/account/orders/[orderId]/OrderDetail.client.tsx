"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy order detail page pending i18n overhaul */

import * as React from "react";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms/Section";
import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { findOrderByNumber, orderTotal, type XaOrder } from "../../../../lib/ordersStore";

export function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = React.useState<XaOrder | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    setOrder(findOrderByNumber(orderNumber));
    setLoading(false);
  }, [orderNumber]);

  if (loading) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order</h1>
        </Section>
        <Section padding="default">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Loading…
          </div>
        </Section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="sf-content">
        <Section padding="wide">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This order may not exist in this browser.
          </p>
        </Section>
        <Section padding="default">
          <Link href="/account/orders" className="underline">
            Back to orders
          </Link>
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
                  <Price amount={orderTotal(order)} currency={order.currency} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/orders" className="underline">
            Back to orders
          </Link>
          <Link href="/account/trackingorder" className="underline">
            Track another order
          </Link>
        </div>
      </Section>
    </main>
  );
}
