"use client";


import * as React from "react";
import Link from "next/link";

import { Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { findOrderByNumber, orderTotal, type XaOrder } from "../../../../lib/ordersStore";
import { xaI18n } from "../../../../lib/xaI18n";

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
          <h1 className="text-2xl font-semibold">{xaI18n.t("xaB.src.app.account.orders.orderid.orderdetail.client.l41c50")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.account.orders.orderid.orderdetail.client.l42c61")}</p>
        </Section>
        <Section padding="default">
          <Link href="/account/orders" className="underline">{xaI18n.t("xaB.src.app.account.orders.orderid.orderdetail.client.l47c62")}</Link>
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
          <Link href="/account/orders" className="underline">{xaI18n.t("xaB.src.app.account.orders.orderid.orderdetail.client.l103c62")}</Link>
          <Link href="/account/trackingorder" className="underline">{xaI18n.t("xaB.src.app.account.orders.orderid.orderdetail.client.l106c69")}</Link>
        </div>
      </Section>
    </main>
  );
}
