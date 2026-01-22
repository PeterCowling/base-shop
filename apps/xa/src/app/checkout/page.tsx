"use client";

import * as React from "react";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy checkout page pending i18n overhaul */
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";
import { Section } from "@acme/ui/atoms/Section";
import { Button, Input, Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/components/atoms";
import { FormField } from "@acme/ui/components/molecules";

import { useCart } from "../../contexts/XaCartContext";
import { recordSale } from "../../lib/inventoryStore";
import { createOrder } from "../../lib/ordersStore";

export default function CheckoutPage() {
  const router = useRouter();
  const [currency] = useCurrency();
  const [cart, dispatch] = useCart();

  const lines = React.useMemo(() => Object.entries(cart), [cart]);
  const subtotal = React.useMemo(
    () => lines.reduce((sum, [, line]) => sum + line.qty * (line.sku.price ?? 0), 0),
    [lines],
  );

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const placeOrder = async () => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter an email address."); // i18n-exempt -- XA-0023: demo validation
      return;
    }
    if (!lines.length) {
      setError("Your cart is empty."); // i18n-exempt -- XA-0023
      return;
    }

    setLoading(true);
    try {
      const order = createOrder({
        email: normalizedEmail,
        currency,
        lines: lines.map(([, line]) => ({
          skuId: line.sku.id,
          title: line.sku.title ?? "Item", // i18n-exempt -- XA-0023: fallback label
          size: line.size,
          qty: line.qty,
          unitPrice: line.sku.price ?? 0,
        })),
      });

      for (const [, line] of lines) {
        recordSale(line.sku.id, line.qty);
      }

      await dispatch({ type: "clear" });
      router.push(`/checkout/success?order=${encodeURIComponent(order.number)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This demo checkout stores orders locally in your browser (no backend APIs).
        </p>
      </Section>

      <Section padding="default" className="space-y-8">
        {lines.length ? (
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
                {lines.map(([id, line]) => (
                  <TableRow key={id}>
                    <TableCell>{line.sku.title}</TableCell>
                    <TableCell>{line.size ? `Size: ${line.size}` : "—"}</TableCell>
                    <TableCell className="text-end">{line.qty}</TableCell>
                    <TableCell className="text-end">
                      <Price amount={line.qty * (line.sku.price ?? 0)} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-end font-semibold">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-end font-semibold">
                    <Price amount={subtotal} currency={currency} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border p-6">
            <div className="font-medium">Your cart is empty.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              <Link href="/collections/all" className="underline">
                Browse products
              </Link>
            </div>
          </div>
        )}

        <div className="max-w-md space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void placeOrder();
            }}
          >
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            {error ? (
              <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || !lines.length}>
                {loading ? "Placing order…" : "Place order"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/cart">Back to cart</Link>
              </Button>
            </div>
          </form>
        </div>
      </Section>
    </main>
  );
}
