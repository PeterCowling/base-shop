import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return {
    title: `Checkout cancelled (${lang}) | Caryina`,
    description: "Checkout was cancelled before payment confirmation.",
    keywords: getSeoKeywords(),
  };
}

export default async function CancelledPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);

  return (
    <section className="space-y-6 text-center">
      <h1 className="text-4xl font-display">Payment cancelled</h1>
      <p className="mx-auto max-w-xl text-muted-foreground">
        Your payment was not completed. Your cart is still saved — you can try again anytime.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={`/${lang}/cart`} className="text-sm hover:underline">
          Return to cart
        </Link>
        <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
          Back to shop
        </Link>
      </div>
    </section>
  );
}
