import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";

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
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);

  return (
    <>
      <SuccessAnalytics locale={lang} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-display">Order confirmed</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Thank you for shopping Caryina. Your order has been logged and support can help with any follow-up requests.
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
