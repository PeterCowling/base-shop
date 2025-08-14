// packages/template-app/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { useState } from "react";
import OrderSummary from "@/components/organisms/OrderSummary";
import { Locale, resolveLocale } from "@/i18n/locales";
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartLine,
  type CartState,
} from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { getProductById } from "@platform-core/src/products";
import { cookies } from "next/headers";
import { getShopSettings } from "@platform-core/src/repositories/settings.server";

export const metadata = {
  title: "Checkout · Base-Shop",
};

/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  /* ---------- await params ---------- */
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);

  /* ---------- read cart from cookie ---------- */
  const cookieStore = await cookies(); // ← await here
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? await getCart(cartId) : {};

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    return <p className="p-8 text-center">Your cart is empty.</p>;
  }

  /* ---------- fetch fresh product data & compute totals ---------- */
  const validatedCart: CartState = {};
  for (const [id, line] of Object.entries(cart)) {
    const sku = getProductById(id);
    if (!sku) continue; // skip items that no longer exist
    validatedCart[id] = { sku, qty: line.qty, size: line.size } as CartLine;
  }

  const lines = Object.values(validatedCart);
  const subtotal = lines.reduce((sum, l) => sum + l.sku.price * l.qty, 0);
  const deposit = lines.reduce(
    (sum, l) => sum + (l.sku.deposit ?? 0) * l.qty,
    0
  );
  const total = subtotal + deposit;

  const settings = await getShopSettings("shop");

  /* ---------- render ---------- */
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary
        cart={validatedCart}
        totals={{ subtotal, deposit, total }}
      />
      <CoverageWrapper locale={lang} taxRegion={settings.taxRegion} />
    </div>
  );
}

function CoverageWrapper({
  locale,
  taxRegion,
}: {
  locale: Locale;
  taxRegion: string;
}) {
  "use client";
  const [addCoverage, setAddCoverage] = useState(false);
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={addCoverage}
          onChange={(e) => setAddCoverage(e.target.checked)}
        />
        <span>Damage coverage</span>
      </label>
      <CheckoutForm
        locale={locale}
        taxRegion={taxRegion}
        coverage={addCoverage ? ["scuff", "tear"] : []}
      />
    </div>
  );
}
