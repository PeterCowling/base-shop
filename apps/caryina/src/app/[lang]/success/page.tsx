import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";
import { verifyStripeSession } from "@/lib/verifyStripeSession";

import SuccessAnalytics from "./SuccessAnalytics.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return {
    title: `Order success (${lang}) | Caryina`,
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

  let paid = true;
  let amount: number | undefined;
  let currency: string | undefined;

  if (sessionId) {
    try {
      const result = await verifyStripeSession(sessionId);
      paid = result.paid;
      amount = result.amount;
      currency = result.currency;
    } catch {
      // Stripe lookup failed — fall through to show generic confirmation
    }
  }

  if (!paid && sessionId) {
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

  const amountLabel =
    amount != null && currency
      ? new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(amount / 100)
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
