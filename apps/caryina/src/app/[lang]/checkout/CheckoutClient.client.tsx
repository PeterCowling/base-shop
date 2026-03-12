"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useCart } from "@acme/platform-core/contexts/CartContext";

import CheckoutAnalytics from "./CheckoutAnalytics.client";

const LOCALE_MAP: Record<string, string> = { en: "en-IE", de: "de-DE", it: "it-IT" };

function formatEur(cents: number, lang: string) {
  return new Intl.NumberFormat(LOCALE_MAP[lang] ?? "en-IE", {
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

const CARD_FIELD_NAMES = [
  "cardNumber",
  "expiryMonth",
  "expiryYear",
  "cvv",
  "buyerName",
  "buyerEmail",
] as const;

type CardFieldName = (typeof CARD_FIELD_NAMES)[number];

type CheckoutClientProps = {
  provider: "axerve" | "stripe";
};

type CheckoutSessionResponse = {
  success?: boolean;
  error?: string;
  mode?: "redirect";
  provider?: "stripe";
  sessionId?: string;
  url?: string;
};

const EMPTY_CARD: CardState = {
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  buyerName: "",
  buyerEmail: "",
};

function isCardFieldName(value: string): value is CardFieldName {
  return CARD_FIELD_NAMES.includes(value as CardFieldName);
}

function validateCard(card: CardState): string | null {
  if (!card.cardNumber || !card.expiryMonth || !card.expiryYear || !card.cvv) {
    return "Please fill in all required card fields.";
  }
  if (!/^\d{3,4}$/.test(card.cvv)) {
    return "CVV must be 3 or 4 digits.";
  }
  return null;
}

function createIdempotencyKey() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildCheckoutPayload(
  lang: string,
  provider: "axerve" | "stripe",
  card: CardState,
) {
  if (provider === "stripe") {
    return {
      idempotencyKey: createIdempotencyKey(),
      lang,
    };
  }

  return {
    idempotencyKey: createIdempotencyKey(),
    lang,
    cardNumber: card.cardNumber,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    cvv: card.cvv,
    buyerName: card.buyerName,
    buyerEmail: card.buyerEmail,
  };
}

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

function StripeCheckoutNotice({ lang }: { lang: string }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Secure Stripe checkout</h2>
        <p className="text-sm text-muted-foreground">
          You will be redirected to Stripe to complete your payment securely.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        If you cancel on the Stripe page, your Caryina cart stays available and you can try
        again from{" "}
        <Link href={`/${lang}/cart`} className="underline underline-offset-4">
          your cart
        </Link>
        .
      </p>
    </div>
  );
}

export function CheckoutClient({ provider }: CheckoutClientProps) {
  const [cart] = useCart();
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang ?? "en";
  const isAxerve = provider === "axerve";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardState>(EMPTY_CARD);

  const lines = useMemo(() => Object.entries(cart), [cart]);
  const total = useMemo(
    () => lines.reduce((sum, [, line]) => sum + line.sku.price * line.qty, 0),
    [lines],
  );

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
    if (!isCardFieldName(name)) {
      return;
    }
    setCard((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePayNow() {
    setError(null);

    if (isAxerve) {
      const validationError = validateCard(card);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutPayload(lang, provider, card)),
      });
      const data = (await res.json()) as CheckoutSessionResponse;
      if (!res.ok || !data.success) {
        setError(data.error ?? "Payment failed — please try again.");
        setLoading(false);
        return;
      }

      if (!isAxerve) {
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError("No checkout URL returned — please try again.");
        setLoading(false);
        return;
      }

      window.location.href = `/${lang}/success`;
    } catch {
      setError(isAxerve ? "Something went wrong — please try again." : "Network error — please try again.");
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
              <p className="text-sm font-medium">{formatEur(line.sku.price * line.qty, lang)}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-medium">Total</p>
          <p className="text-xl font-medium" data-cy="checkout-total">
            {formatEur(total, lang)}
          </p>
        </div>
        {isAxerve ? (
          <CardForm card={card} onChange={handleCardChange} disabled={loading} />
        ) : (
          <StripeCheckoutNotice lang={lang} />
        )}
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
            {loading ? (isAxerve ? "Processing..." : "Redirecting...") : "Pay now"}
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
