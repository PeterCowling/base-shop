import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";
import { CONTACT_EMAIL } from "@/lib/legalContent";
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
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          A confirmation email has been sent to your email address.
        </p>
        <p className="mx-auto max-w-xl text-muted-foreground">
          {amountLabel
            ? `Thank you for shopping Caryina. Your payment of ${amountLabel} was received.`
            : "Thank you for shopping Caryina. Your order has been logged and support can help with any follow-up requests."}
        </p>
        {stripeResult?.shopTransactionId ? (
          <p className="text-sm text-muted-foreground">
            Order reference: <span className="font-medium text-foreground">{stripeResult.shopTransactionId}</span>
          </p>
        ) : null}
        <div className="mx-auto max-w-xl rounded border bg-muted/30 p-4 text-start text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tracking your order</p>
          <p className="mt-1">
            We ship via DHL. You will receive a tracking link by email once your order is dispatched.
            {/* TODO: PLACEHOLDER — operator to confirm typical dispatch window, e.g. 2 business days */}
            {" "}If you don&apos;t receive it within 2 business days, check your spam folder or contact us using the link below.
          </p>
        </div>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          For cancellations, returns, exchange requests, faulty-item claims, or privacy requests,
          contact{" "}
          <a
            className="inline-flex min-h-11 min-w-11 items-center underline underline-offset-4"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>{" "}
          or use the linked policy pages below.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href={`/${lang}/returns`} className="rounded-full border px-4 py-2 hover:underline">
            Returns policy
          </Link>
          <Link href={`/${lang}/terms`} className="rounded-full border px-4 py-2 hover:underline">
            Terms
          </Link>
          <Link href={`/${lang}/privacy`} className="rounded-full border px-4 py-2 hover:underline">
            Privacy
          </Link>
          <Link href={`/${lang}/support`} className="rounded-full border px-4 py-2 hover:underline">
            Support
          </Link>
        </div>
        <div>
          <Link href={`/${lang}/shop`} className="text-sm hover:underline">
            Continue shopping
          </Link>
        </div>
      </section>
    </>
  );
}
