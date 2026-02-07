"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy tracking page pending i18n overhaul */

import * as React from "react";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms/Section";
import { Button, Input, Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { findOrdersByNumberAndEmail, orderTotal } from "../../../lib/ordersStore";

type TrackRow = { order: string; status: string; total: number };

export default function TrackingOrderPage() {
  const [order, setOrder] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [rows, setRows] = React.useState<TrackRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Check your order status</h1>
      </Section>

      <Section padding="default" className="max-w-lg">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (!order.trim() || !email.trim()) {
              setRows([]);
              setError("Enter your order number and email."); // i18n-exempt -- XA-0018: demo form validation
              return;
            }

            setLoading(true);
            try {
              const orders = findOrdersByNumberAndEmail(order, email);
              const nextRows = orders.map((o) => ({
                order: o.number,
                status: o.status,
                total: orderTotal(o),
              }));
              setRows(nextRows);
              if (!nextRows.length) setError("No matching order found."); // i18n-exempt -- XA-0018
            } finally {
              setLoading(false);
            }
          }}
        >
          <FormField label="Order number" htmlFor="orderNumber">
            <Input
              id="orderNumber"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Tracking…" : "Track"}
            </Button>
            <Link href="/service-center" className="text-sm underline">
              Need help?
            </Link>
          </div>
        </form>

        <div className="mt-8 overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-end">Total price</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((r) => (
                  <TableRow key={r.order}>
                    <TableCell>{r.order}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-end">
                      <Price amount={r.total} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="outline" asChild>
                        <Link href={`/account/orders/${r.order}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="py-6 text-sm text-muted-foreground">
                      {error ?? "Enter your order number and email to track."}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Section>
    </main>
  );
}
