import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";
import { finalizeStripeSession } from "@/lib/payments/stripeCheckout.server";

import SuccessAnalytics from "./SuccessAnalytics.client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order Confirmed | Caryina",
    description: "Your Caryina order has been confirmed.",
    keywords: getSeoKeywords(),
  };
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang?: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  const { session_id: sessionId } = await searchParams;

  let stripeResult:
    | Awaited<ReturnType<typeof finalizeStripeSession>>
    | null = null;

  if (sessionId) {
    try {
      stripeResult = await finalizeStripeSession(sessionId);
    } catch {
      stripeResult = {
        state: "processing",
        paid: true,
        sessionId,
      };
    }
  }

  if (stripeResult?.state === "not_paid") {
    return (
      <>
        <SuccessAnalytics locale={lang} />
        <section className="space-y-6 text-center">
          <h1 className="text-4xl font-display">Payment not completed</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Your payment could not be confirmed. Please return to your cart and try again.
          </p>
          <div>
            <Link href={`/${lang}/cart`} className="text-sm hover:underline">
              Return to cart
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (stripeResult?.state === "processing") {
    return (
      <>
        <SuccessAnalytics locale={lang} />
        <section className="space-y-6 text-center">
          <h1 className="text-4xl font-display">Payment received</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Your payment has been received and Caryina is finalizing your order. If anything
            still needs attention, support will follow up directly.
          </p>
          <div>
            <Link href={`/${lang}/shop`} className="text-sm hover:underline">
              Continue shopping
            </Link>
          </div>
        </section>
      </>
    );
  }

  const amountLabel =
    stripeResult?.amount != null && stripeResult.currency
      ? new Intl.NumberFormat(
          lang === "de" ? "de-DE" : lang === "it" ? "it-IT" : "en-IE",
          { style: "currency", currency: stripeResult.currency.toUpperCase() },
        ).format(stripeResult.amount / 100)
      : null;

  return (
    <>
      <SuccessAnalytics locale={lang} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-display">Order confirmed</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          {amountLabel
            ? `Thank you for shopping Caryina. Your payment of ${amountLabel} was received.`
            : "Thank you for shopping Caryina. Your order has been logged and support can help with any follow-up requests."}
        </p>
        <div>
          <Link href={`/${lang}/shop`} className="text-sm hover:underline">
            Continue shopping
          </Link>
        </div>
      </section>
    </>
  );
}
