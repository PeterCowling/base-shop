"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Price, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { useCart } from "../../contexts/XaCartContext";
import { xaI18n } from "../../lib/xaI18n";


export default function CheckoutPage() {
  const router = useRouter();
  const [currency] = useCurrency();
  const [cart, dispatch] = useCart();

  const lines = React.useMemo(() => Object.entries(cart), [cart]);
  const subtotal = React.useMemo(
    () => lines.reduce((sum, [, line]) => sum + line.qty * (line.sku.price ?? 0), 0),
    [lines],
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const placeOrder = async () => {
    setError(null);

    if (!lines.length) {
      setError("Your cart is empty."); // i18n-exempt -- XA-0023
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          lines: lines.map(([, line]) => ({
            skuId: line.sku.id,
            title: line.sku.title ?? "Item", // i18n-exempt -- XA-0023: fallback label
            size: line.size,
            qty: line.qty,
            unitPrice: line.sku.price ?? 0,
          })),
        }),
      });

      if (!response.ok) {
        setError("Unable to place order right now."); // i18n-exempt -- XA-0111: checkout UX copy
        return;
      }

      const payload = (await response.json()) as {
        order?: { number?: string };
      };
      const orderNumber = payload.order?.number;
      if (!orderNumber) {
        setError("Unable to place order right now."); // i18n-exempt -- XA-0111: checkout UX copy
        return;
      }

      await dispatch({ type: "clear" });
      router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.checkout.page.l72c59")}</p>
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
            <div className="font-medium">{xaI18n.t("xaB.src.app.checkout.page.l113c42")}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              <Link href="/collections/all" className="underline">{xaI18n.t("xaB.src.app.checkout.page.l115c67")}</Link>
            </div>
          </div>
        )}

        <Section as="div" padding="none" width="full" className="max-w-md space-y-4">
          {error ? (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void placeOrder()}
              disabled={loading || !lines.length}
            >
              {loading ? xaI18n.t("xaB.src.app.checkout.page.l148c28") : "Place order"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cart">Back to cart</Link>
            </Button>
          </div>
        </Section>
      </Section>
    </main>
  );
}
