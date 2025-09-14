// src/components/checkout/CheckoutForm.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementLocale } from "@stripe/stripe-js";
import { fetchJson } from "@acme/shared-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { isoDateInNDays } from "@acme/date-utils";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

type Props = {
  locale: "en" | "de" | "it";
  taxRegion: string;
  coverage?: string[];
};

type FormValues = { returnDate: string };

export default function CheckoutForm({
  locale,
  taxRegion,
  coverage = [],
}: Props) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [fetchError, setFetchError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [currency] = useCurrency();
  const t = useTranslations();

  const defaultDate = isoDateInNDays(7);

  const form = useForm<FormValues>({
    defaultValues: { returnDate: defaultDate },
  });
  const returnDate = form.watch("returnDate");

  /* --- create session on mount or when returnDate changes --- */
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const { clientSecret } = await fetchJson<{ clientSecret: string }>(
          "/api/checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ returnDate, currency, taxRegion, coverage }),
            signal: controller.signal,
          }
        );
        setClientSecret(clientSecret);
        setFetchError(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name !== "AbortError") {
            console.error(err);
            setFetchError(true);
          }
        } else {
          console.error("An unknown error occurred");
          setFetchError(true);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [returnDate, currency, taxRegion, coverage, retry]);

  if (!clientSecret) {
    if (fetchError)
      return (
        <div className="space-y-2">
          <p>{t("checkout.loadError")}</p>
          <button
            type="button"
            className="rounded bg-fg px-2 py-1 text-bg"
            data-token="--color-fg"
            onClick={() => {
              setFetchError(false);
              setRetry((r) => r + 1);
            }}
          >
            {t("checkout.retry")}
          </button>
        </div>
      );
    return <p>{t("checkout.loading")}</p>;
  }

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
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = form;
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = handleSubmit(
    async () => {
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
        const message = error.message ?? "Payment failed";
        setError(message);
        setProcessing(false);
        const query = new URLSearchParams({ error: message }).toString();
        router.push(`/${locale}/cancelled?${query}`);
      } else {
        router.push(`/${locale}/success`);
      }
    },
    (errs) => {
      const field = Object.keys(errs)[0];
      if (field) setFocus(field as keyof FormValues);
    }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block text-sm">
        {t("checkout.return")}
        <input
          type="date"
          {...register("returnDate", { required: t("checkout.returnDateRequired") as string })}
          className="block w-full border px-2 py-1"
          aria-invalid={errors.returnDate ? "true" : "false"}
          aria-describedby={errors.returnDate ? "returnDate-error" : undefined}
        />
      </label>
      <PaymentElement />
      {errors.returnDate && (
        <p
          id="returnDate-error"
          className="text-sm text-danger"
          data-token="--color-danger"
          role="alert"
        >
          {errors.returnDate.message}
        </p>
      )}
      {error && (
        <p className="text-sm text-danger" data-token="--color-danger" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded bg-fg py-2 disabled:opacity-50"
        data-token="--color-fg"
      >
        <span className="text-bg" data-token="--color-bg">
          {processing ? t("checkout.processing") : t("checkout.pay")}
        </span>
      </button>
    </form>
  );
}
