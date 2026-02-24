"use client";

import * as React from "react";
import Link from "next/link";

import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { orderTotal, readOrders } from "../../../lib/ordersStore";
import { xaI18n } from "../../../lib/xaI18n";

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
            <div className="font-medium">{xaI18n.t("xaB.src.app.account.orders.page.l54c42")}</div>
            <div className="mt-2 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.account.orders.page.l55c65")}</div>
            <div className="mt-4">
              <Link href="/collections/all" className="underline">{xaI18n.t("xaB.src.app.account.orders.page.l59c67")}</Link>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
