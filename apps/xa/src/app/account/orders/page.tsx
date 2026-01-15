"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy orders page pending i18n overhaul */
import Link from "next/link";
import * as React from "react";

import { Section } from "@ui/atoms/Section";
import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/components/atoms";

import { orderTotal, readOrders } from "../../../lib/ordersStore";

export default function OrdersPage() {
  const [orders, setOrders] = React.useState(() => readOrders());

  React.useEffect(() => setOrders(readOrders()), []);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </Section>

      <Section padding="default">
        {orders.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.number}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell className="text-end">
                      <Price amount={orderTotal(o)} currency={o.currency} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Link href={`/account/orders/${o.number}`} className="underline">
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
            <div className="font-medium">No orders yet.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Place an order at checkout to see it here.
            </div>
            <div className="mt-4">
              <Link href="/collections/all" className="underline">
                Browse products
              </Link>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
