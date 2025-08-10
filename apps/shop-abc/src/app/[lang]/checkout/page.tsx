// apps/shop-abc/src/app/[lang]/checkout/page.tsx

import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { Locale, resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { getCart } from "@/lib/cartStore";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { PageComponent } from "@types";
import { cookies } from "next/headers";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../../shop.json";

export const metadata = {
  title: "Checkout · Base-Shop",
};

async function loadComponents(): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === "checkout" && p.status === "published"
  );
  return page?.components ?? null;
}

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

  /* ---------- read cart from server storage ---------- */
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? getCart(cartId) : {};

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    return <p className="p-8 text-center">Your cart is empty.</p>;
  }

  const components = await loadComponents();
  if (components && components.length) {
    return (
      <DynamicRenderer
        components={components}
        locale={lang}
        runtimeData={{ OrderSummary: { cart } }}
      />
    );
  }

  /* ---------- render ---------- */
  const settings = await getShopSettings(shop.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary cart={cart} />
      <CheckoutForm locale={lang} taxRegion={settings.taxRegion} />
    </div>
  );
}

