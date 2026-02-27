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

interface CardState {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  buyerName: string;
  buyerEmail: string;
}

const EMPTY_CARD: CardState = {
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  buyerName: "",
  buyerEmail: "",
};

function CardForm({
  card,
  onChange,
  disabled,
}: {
  card: CardState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-4 border-0 p-0">
      <legend className="text-base font-medium">Card details</legend>
      <div className="space-y-1">
        <label htmlFor="cardNumber" className="text-sm font-medium">
          Card number <span aria-hidden="true">*</span>
        </label>
        <input
          id="cardNumber"
          name="cardNumber"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={card.cardNumber}
          onChange={onChange}
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label htmlFor="expiryMonth" className="text-sm font-medium">
            Expiry month <span aria-hidden="true">*</span>
          </label>
          <input
            id="expiryMonth"
            name="expiryMonth"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            value={card.expiryMonth}
            onChange={onChange}
            placeholder="MM"
            className="w-24 rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="expiryYear" className="text-sm font-medium">
            Expiry year <span aria-hidden="true">*</span>
          </label>
          <input
            id="expiryYear"
            name="expiryYear"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            value={card.expiryYear}
            onChange={onChange}
            placeholder="YYYY"
            className="w-24 rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="cvv" className="text-sm font-medium">
            CVV <span aria-hidden="true">*</span>
          </label>
          <input
            id="cvv"
            name="cvv"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={card.cvv}
            onChange={onChange}
            className="w-20 rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="buyerName" className="text-sm font-medium">
          Name on card
        </label>
        <input
          id="buyerName"
          name="buyerName"
          type="text"
          autoComplete="cc-name"
          value={card.buyerName}
          onChange={onChange}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="buyerEmail" className="text-sm font-medium">
          Email
        </label>
        <input
          id="buyerEmail"
          name="buyerEmail"
          type="email"
          autoComplete="email"
          value={card.buyerEmail}
          onChange={onChange}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </fieldset>
  );
}

export function CheckoutClient() {
  const [cart] = useCart();
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang ?? "en";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardState>(EMPTY_CARD);

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

  function handleCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCard((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePayNow() {
    setError(null);

    if (!card.cardNumber || !card.expiryMonth || !card.expiryYear || !card.cvv) {
      setError("Please fill in all required card fields.");
      return;
    }
    if (!/^\d{3,4}$/.test(card.cvv)) {
      setError("CVV must be 3 or 4 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          cardNumber: card.cardNumber,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          cvv: card.cvv,
          buyerName: card.buyerName,
          buyerEmail: card.buyerEmail,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Payment failed — please try again.");
        setLoading(false);
        return;
      }
      window.location.href = `/${lang}/success`;
    } catch {
      setError("Something went wrong — please try again.");
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
        <CardForm card={card} onChange={handleCardChange} disabled={loading} />
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
            {loading ? "Processing…" : "Pay now"}
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
