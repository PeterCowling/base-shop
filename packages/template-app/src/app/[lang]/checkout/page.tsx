// packages/template-app/src/app/[lang]/checkout/page.tsx
import * as React from "react";
import { cookies } from "next/headers";

import { calculateRentalDays, isoDateInNDays } from "@acme/date-utils";
import { type Locale, resolveLocale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n/Translations";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import {
  CART_COOKIE,
  type CartLine,
  type CartState,
  decodeCartCookie,
} from "@acme/platform-core/cartCookie";
import { createCartStore } from "@acme/platform-core/cartStore";
import { convertCurrency,priceForDays } from "@acme/platform-core/pricing";
import { getProductById } from "@acme/platform-core/products";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import Section from "@acme/ui/components/cms/blocks/Section";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const locale: Locale = resolveLocale(rawLang);
  const t = await getServerTranslations(locale);
  return {
    title: t("checkout.title"),
  };
}

/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang?: string }>;
  searchParams?: Promise<{ returnDate?: string }>;
}) {
  /* ---------- await params ---------- */
  const { lang: rawLang } = await params;
  const { returnDate: queryReturn } = (await searchParams) ?? {};
  const lang: Locale = resolveLocale(rawLang);

  /* ---------- read cart from cookie ---------- */
  const cookieStore = await cookies(); // ← await here
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cartStore = createCartStore();
  const cart: CartState =
    typeof cartId === "string" ? await cartStore.getCart(cartId) : {};

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    const t = await getServerTranslations(lang);
    return <p className="p-8 text-center">{t("checkout.empty")}</p>;
  }

  /* ---------- fetch fresh product data & compute totals ---------- */
  const validatedCart: CartState = {};
  for (const [id, line] of Object.entries(cart)) {
    const sku = getProductById(id);
    if (!sku) continue; // skip items that no longer exist
    validatedCart[id] = { sku, qty: line.qty, size: line.size } as CartLine;
  }

  const [settings, shop] = await Promise.all([
    getShopSettings("shop"),
    readShop("shop"),
  ]);
  const currency = (settings.currency ?? "EUR").toUpperCase();

  if (shop.type !== "rental") {
    const lines = Object.values(validatedCart);
    const subtotal = lines.reduce((sum, l) => sum + l.sku.price * l.qty, 0);
    const deposit = lines.reduce(
      (sum, l) => sum + (l.sku.deposit ?? 0) * l.qty,
      0
    );
    const total = subtotal + deposit;

    return (
      <Section contentWidth="normal">
        <div className="flex flex-col gap-10 p-6">
          <OrderSummary
            cart={validatedCart}
            totals={{ subtotal, deposit, total }}
          />
          <CheckoutSection locale={lang} taxRegion={settings.taxRegion ?? ""} />
        </div>
      </Section>
    );
  }

  const defaultReturn = isoDateInNDays(7);
  let rentalDays: number;
  try {
    rentalDays = calculateRentalDays(queryReturn ?? defaultReturn);
  } catch {
    const t = await getServerTranslations(lang);
    return <p className="p-8 text-center">{t("checkout.invalidReturnDate")}</p>;
  }

  const rentalCart: CartState = {};
  let subtotal = 0;
  let deposit = 0;
  for (const [id, line] of Object.entries(validatedCart)) {
    const basePrice = await priceForDays(line.sku, rentalDays);
    const price = await convertCurrency(basePrice, currency);
    const depBase = line.sku.deposit ?? 0;
    const dep = await convertCurrency(depBase, currency);
    subtotal += price * line.qty;
    deposit += dep * line.qty;
    rentalCart[id] = {
      sku: { ...line.sku, price },
      qty: line.qty,
      size: line.size,
    } as CartLine;
  }
  const total = subtotal + deposit;

  return (
    <Section contentWidth="normal">
      <div className="flex flex-col gap-10 p-6">
        <OrderSummary
          cart={rentalCart}
          totals={{ subtotal, deposit, total }}
        />
        <CheckoutSection locale={lang} taxRegion={settings.taxRegion ?? ""} />
      </div>
    </Section>
  );
}

function CheckoutSection({
  locale,
  taxRegion,
}: {
  locale: Locale;
  taxRegion: string;
}) {
  "use client";
  const t = useTranslations();
  const [coverage, setCoverage] = React.useState(false);
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={coverage}
          onChange={(e) => setCoverage(e.target.checked)}
        />
        {t("checkout.addCoverage")}
      </label>
      <CheckoutForm
        locale={locale}
        taxRegion={taxRegion}
        coverage={coverage ? ["scuff", "tear"] : []}
      />
    </div>
  );
}
