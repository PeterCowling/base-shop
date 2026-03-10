import type { Metadata } from "next";

import { resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";

import { CheckoutClient } from "./CheckoutClient.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return {
    title: `Checkout (${lang}) | Caryina`,
    description: "Secure checkout for Caryina products.",
    keywords: getSeoKeywords(),
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
