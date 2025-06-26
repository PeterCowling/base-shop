// src/components/checkout/CheckoutForm.tsx
"use client";

import { useTranslations } from "@/i18n/Translations";
import { env } from "@config/env";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementLocale } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

type Props = { locale: "en" | "de" | "it" }; // narrow to our three

export default function CheckoutForm({ locale }: Props) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  /* --- create session on mount --- */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnDate }),
      });
      const { id } = (await res.json()) as { id: string };
      setClientSecret(id);
    })();
  }, [returnDate]);

  if (!clientSecret) return <p>Loading payment form…</p>;

  return (
    <Elements
      stripe={stripePromise}
      /*  👇 cast locale to StripeElementLocale to satisfy TS  */
      options={{ clientSecret, locale: locale as StripeElementLocale }}
      key={clientSecret} // re-mount if locale changes
    >
      <PaymentForm returnDate={returnDate} setReturnDate={setReturnDate} />
    </Elements>
  );
}

/* ---------- inner form ---------- */

function PaymentForm({
  returnDate,
  setReturnDate,
}: {
  returnDate: string;
  setReturnDate: (v: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setError(error.message ?? "Payment failed");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block text-sm">
        {t("checkout.return")}
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          className="block w-full border px-2 py-1"
        />
      </label>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50"
      >
        {processing ? t("checkout.processing") : t("checkout.pay")}
      </button>
    </form>
  );
}
