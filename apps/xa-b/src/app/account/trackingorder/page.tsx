"use client";

import * as React from "react";
import Link from "next/link";

import { Button, Input, Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

type TrackRow = {
  order: string;
  status: string;
  total: number;
  currency: string;
};

export default function TrackingOrderPage() {
  const [order, setOrder] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [rows, setRows] = React.useState<TrackRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <main className="sf-content">
      <Section padding="wide">
        {/* i18n-exempt -- XAB-313 [ttl=2026-12-31] */}
        <h1 className="text-2xl font-semibold">Track your order</h1>
      </Section>

      <Section padding="default" className="max-w-lg">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            if (!order.trim() || !email.trim()) {
              setRows([]);
              setError("Enter your order number and email."); // i18n-exempt -- XA-0018: form validation
              return;
            }

            setLoading(true);
            try {
              const response = await fetch("/api/account/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order, email }),
              });

              if (!response.ok) {
                setRows([]);
                setError("Unable to check this order right now."); // i18n-exempt -- XA-0111: tracking UX copy
                return;
              }

              const payload = (await response.json()) as { rows?: TrackRow[] };
              const nextRows = Array.isArray(payload.rows) ? payload.rows : [];
              setRows(nextRows);
              if (!nextRows.length) {
                setError("No matching order found."); // i18n-exempt -- XA-0018
              }
            } catch {
              setRows([]);
              setError("Unable to check this order right now."); // i18n-exempt -- XA-0111: tracking UX copy
            } finally {
              setLoading(false);
            }
          }}
        >
          <FormField label="Order number" htmlFor="orderNumber">
            <Input
              id="orderNumber"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Tracking..." : "Track"}
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
                rows.map((row) => (
                  <TableRow key={row.order}>
                    <TableCell>{row.order}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell className="text-end">
                      <Price amount={row.total} currency={row.currency} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${row.order}`}>View</Link>
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
