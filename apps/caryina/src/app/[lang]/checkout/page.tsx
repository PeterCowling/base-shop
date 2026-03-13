import type { Metadata } from "next";

import { getSeoKeywords } from "@/lib/contentPacket";
import { resolveCaryinaPaymentProvider } from "@/lib/payments/provider.server";

import { CheckoutClient } from "./CheckoutClient.client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout | Caryina",
    description: "Secure checkout for Caryina products.",
    keywords: getSeoKeywords(),
  };
}

export default async function CheckoutPage() {
  const provider = await resolveCaryinaPaymentProvider();
  return <CheckoutClient provider={provider} />;
}
