// src/components/checkout/CheckoutForm.tsx
"use client";

import { useTranslations } from "@/i18n/Translations";
import { env } from "@config/src/env";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementLocale } from "@stripe/stripe-js";
import { fetchJson } from "@shared-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { isoDateInNDays } from "@/lib/date";
import { useCurrency } from "@platform-core/src/contexts/CurrencyContext";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

type Props = { locale: "en" | "de" | "it"; taxRegion: string };

type FormValues = { returnDate: string };

export default function CheckoutForm({ locale, taxRegion }: Props) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [currency] = useCurrency();

  const defaultDate = isoDateInNDays(7);

  const form = useForm<FormValues>({
    defaultValues: { returnDate: defaultDate },
  });
  const returnDate = form.watch("returnDate");

  /* --- create session on mount or when returnDate changes --- */
  useEffect(() => {
    (async () => {
      const { clientSecret } = await fetchJson<{ clientSecret: string }>(
        "/api/checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnDate, currency, taxRegion }),
        }
      );
      setClientSecret(clientSecret);
    })();
  }, [returnDate, currency, taxRegion]);

  if (!clientSecret) return <p>Loading payment form…</p>;

  return (
    <Elements
      stripe={stripePromise}
      /*  👇 cast locale to StripeElementLocale to satisfy TS  */
      options={{ clientSecret, locale: locale as StripeElementLocale }}
      key={clientSecret} // re-mount if locale changes
    >
      <PaymentForm form={form} locale={locale} />
    </Elements>
  );
}

/* ---------- inner form ---------- */

function PaymentForm({
  form,
  locale,
}: {
  form: UseFormReturn<FormValues>;
  locale: "en" | "de" | "it";
}) {
  const { register, handleSubmit } = form;
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = handleSubmit(async () => {
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/success`,
      },
    });

    if (error) {
      setError(error.message ?? "Payment failed");
      setProcessing(false);
      router.push(`/${locale}/cancelled`);
    } else {
      router.push(`/${locale}/success`);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block text-sm">
        {t("checkout.return")}
        <input
          type="date"
          {...register("returnDate")}
          className="block w-full border px-2 py-1"
        />
      </label>
      <PaymentElement />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded bg-fg py-2 text-bg disabled:opacity-50"
      >
        {processing ? t("checkout.processing") : t("checkout.pay")}
      </button>
    </form>
  );
}
