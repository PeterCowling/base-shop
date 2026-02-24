import type { Metadata } from "next";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { getSeoKeywords } from "@/lib/contentPacket";
import {
  formatMoney,
  readShopCurrency,
  readShopSkuBySlug,
  readShopSkus,
} from "@/lib/shop";

import CheckoutAnalytics from "./CheckoutAnalytics.client";

type CheckoutSearchParams = {
  sku?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return {
    title: `Checkout (${lang}) | Caryina`,
    description: "Secure checkout for Caryina launch products.",
    keywords: getSeoKeywords(),
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang?: string }>;
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const { lang: rawLang } = await params;
  const locale: Locale = resolveLocale(rawLang);
  const { sku: requestedSku } = await searchParams;

  const [currency, catalog] = await Promise.all([
    readShopCurrency(),
    readShopSkus(locale),
  ]);

  const selected =
    (requestedSku ? await readShopSkuBySlug(locale, requestedSku) : null) ??
    catalog[0] ??
    null;

  if (!selected) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-display">Checkout</h1>
        <p className="text-muted-foreground">
          Your checkout is empty because no active products are available yet.
        </p>
        <Link href={`/${locale}/shop`} className="text-sm hover:underline">
          Browse products
        </Link>
      </section>
    );
  }

  const successHref = `/${locale}/success?orderId=launch-order&amount=${selected.price}&currency=${currency}`;

  return (
    <>
      <CheckoutAnalytics locale={locale} value={selected.price} currency={currency} />
      <section className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-display">Checkout</h1>
          <p className="text-muted-foreground">
            Review your selected launch product and continue to payment confirmation.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected item</p>
              <p className="text-lg font-medium">{selected.title}</p>
            </div>
            <p className="text-lg font-medium">{formatMoney(selected.price, currency)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={successHref}
            className="btn-primary rounded-full px-6 py-2.5 text-sm"
          >
            Complete purchase
          </Link>
          <Link
            href={`/${locale}/cancelled`}
            className="rounded-full px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </section>
    </>
  );
}
