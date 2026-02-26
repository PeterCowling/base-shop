"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useCart } from "@acme/platform-core/contexts/CartContext";

import CheckoutAnalytics from "./CheckoutAnalytics.client";

function formatEur(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function CheckoutClient() {
  const [cart] = useCart();
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang ?? "en";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = Object.entries(cart);
  const total = lines.reduce((sum, [, line]) => sum + line.sku.price * line.qty, 0);

  if (!lines.length) {
    return (
      <section className="space-y-4 py-12 text-center">
        <h1 className="text-3xl font-display">Checkout</h1>
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href={`/${lang}/shop`} className="text-sm hover:underline">
          Browse products
        </Link>
      </section>
    );
  }

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) {
        setError("Payment failed to initiate — please try again.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned — please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <CheckoutAnalytics locale={lang} value={total} currency="EUR" />
      <section className="space-y-8">
        <h1 className="text-3xl font-display">Checkout</h1>
        <ul className="divide-y list-none">
          {lines.map(([key, line]) => (
            <li key={key} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{String(line.sku.title)}</p>
                <p className="text-sm text-muted-foreground">Qty: {line.qty}</p>
              </div>
              <p className="text-sm font-medium">{formatEur(line.sku.price * line.qty)}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-medium">Total</p>
          <p className="text-xl font-medium" data-cy="checkout-total">
            {formatEur(total)}
          </p>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              void handlePayNow();
            }}
            disabled={loading}
            className="btn-primary min-h-11 min-w-11 rounded-full px-6 text-sm disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Pay now"}
          </button>
          <Link
            href={`/${lang}/cart`}
            className="flex min-h-11 items-center rounded-full px-5 text-sm text-muted-foreground hover:text-foreground"
          >
            Return to cart
          </Link>
        </div>
      </section>
    </>
  );
}
