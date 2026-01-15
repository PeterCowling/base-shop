// src/components/checkout/CheckoutForm.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import {
  CheckoutProvider,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { fetchJson } from "@acme/shared-utils";
import { useRouter } from "next/navigation";
import { Alert, Button } from "../atoms";
import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { isoDateInNDays } from "@acme/date-utils";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

function hasConsent() {
  try {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("consent.analytics=true"); // i18n-exempt -- ENG-2003 consent cookie flag, not user-facing copy
  } catch {
    return false;
  }
}

async function logAnalytics(event: { type: string; [key: string]: unknown }) {
  if (!hasConsent()) return;
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    /* best effort */
  }
}

type Props = {
  locale: "en" | "de" | "it" | "es";
  taxRegion: string;
  coverage?: string[];
};

type FormValues = { returnDate: string };

export default function CheckoutForm({
  locale,
  taxRegion,
  coverage = [],
}: Props) {
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string>();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [cartValue, setCartValue] = useState<number | undefined>(undefined);
  const [fetchError, setFetchError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [currency] = useCurrency();
  const [trackedStart, setTrackedStart] = useState(false);
  const t = useTranslations();
  if (!stripePublishableKey && typeof window !== "undefined") {
    console.error(
      "[checkout] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; Stripe Elements are disabled in CheckoutForm.", // i18n-exempt -- ENG-2002 developer-focused configuration warning in console only [ttl=2026-12-31]
    );
  }

  const defaultDate = isoDateInNDays(7);

  const form = useForm<FormValues>({
    defaultValues: { returnDate: defaultDate },
  });
  const returnDate = form.watch("returnDate");

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("cart");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, { sku: { price: number }; qty: number }>;
      const total = Object.values(parsed).reduce(
        (sum, line) => sum + (Number(line.sku?.price) || 0) * (Number(line.qty) || 0),
        0,
      );
      if (Number.isFinite(total)) setCartValue(total);
    } catch {
      /* ignore parse errors */
    }
  }, []);

  /* --- create session on mount or when returnDate changes --- */
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const { clientSecret, sessionId, amount, orderId } = await fetchJson<{
          clientSecret: string;
          sessionId?: string;
          amount?: number;
          orderId?: string;
        }>(
          "/api/checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ returnDate, currency, taxRegion, coverage }),
            signal: controller.signal,
          }
        );
        setCheckoutClientSecret(clientSecret);
        setSessionId(sessionId);
        const checkoutValue = typeof amount === "number" ? amount : cartValue;
        if (typeof amount === "number") setCartValue(amount);
        setFetchError(false);
        if (!trackedStart && clientSecret) {
          setTrackedStart(true);
          void logAnalytics({ type: "checkout_started", currency, value: checkoutValue });
        }
        if (orderId) {
          try {
            window.sessionStorage.setItem(
              "lastOrder",
              JSON.stringify({ orderId, amount: checkoutValue, currency }),
            );
          } catch {
            /* ignore */
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name !== "AbortError") {
            console.error(err);
            setFetchError(true);
          }
        } else {
          console.error("An unknown error occurred"); // i18n-exempt -- ABC-123 dev log only [ttl=2026-01-31]
          setFetchError(true);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [returnDate, currency, taxRegion, coverage, retry, trackedStart, cartValue]);

  if (!checkoutClientSecret) {
    if (fetchError)
      return (
        <div className="space-y-3">
          <Alert variant="danger" tone="soft" heading={t("checkout.loadError") as string} />
          <Button
            type="button"
            color="primary"
            tone="solid"
            onClick={() => {
              setFetchError(false);
              setRetry((r) => r + 1);
            }}
          >
            {t("checkout.retry")}
          </Button>
        </div>
      );
    return <p>{t("checkout.loading")}</p>;
  }

  return (
    <CheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret: async () => checkoutClientSecret,
      }}
      key={checkoutClientSecret} // re-mount if returnDate changes
    >
      <PaymentForm
        form={form}
        locale={locale}
        sessionId={sessionId}
        cartValue={cartValue}
        currency={currency}
      />
    </CheckoutProvider>
  );
}

/* ---------- inner form ---------- */

function PaymentForm({
  form,
  locale,
  sessionId,
  cartValue,
  currency,
}: {
  form: UseFormReturn<FormValues>;
  locale: "en" | "de" | "it" | "es";
  sessionId?: string;
  cartValue?: number;
  currency?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = form;
  const checkout = useCheckout();
  const t = useTranslations();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = handleSubmit(
    async () => {
      if (!checkout.canConfirm) return;
      setProcessing(true);

      const result = await checkout.confirm({
        redirect: "if_required",
        returnUrl: `${window.location.origin}/${locale}/success`,
      });

      if (result.type === "error") {
        const message =
          result.error.message ?? (t("checkout.paymentFailed") as string);
        setError(message);
        setProcessing(false);
        const query = new URLSearchParams({ error: message }).toString();
        router.push(`/${locale}/cancelled?${query}`);
      } else {
        const orderId = result.session.id ?? sessionId;
        const amount = cartValue;
        if (orderId || amount) {
          void logAnalytics({ type: "order_completed", orderId, amount, currency });
          try {
            window.sessionStorage.setItem(
              "lastOrder",
              JSON.stringify({ orderId, amount, currency }),
            );
          } catch {
            /* ignore */
          }
        } else {
          void logAnalytics({ type: "order_completed" });
        }
        const qp = new URLSearchParams();
        const hasAmount = amount !== undefined && Number.isFinite(amount);
        const hasOrderId = Boolean(orderId);
        const hasOrderDetails = hasAmount || hasOrderId;
        if (hasOrderId) qp.set("orderId", orderId);
        if (hasAmount) qp.set("amount", String(amount));
        if (hasOrderDetails && currency) qp.set("currency", currency);
        const query = qp.toString();
        router.push(`/${locale}/success${query ? `?${query}` : ""}`);
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
        <Alert
          variant="danger"
          tone="soft"
          heading={errors.returnDate.message as string}
        />
      )}
      {error && <Alert variant="danger" tone="soft" heading={error} />}
      <Button type="submit" disabled={!checkout.canConfirm || processing} className="w-full" color="primary" tone="solid">
        {processing ? t("checkout.processing") : t("checkout.pay")}
      </Button>
    </form>
  );
}
