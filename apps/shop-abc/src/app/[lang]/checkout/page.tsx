// apps/shop-abc/src/app/[lang]/checkout/page.tsx

import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import { Locale, resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@types";
import shop from "../../../../shop.json";
import { cookies } from "next/headers";

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
  const cart = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    return <p className="p-8 text-center">Your cart is empty.</p>;
  }

  /* ---------- check for CMS layout ---------- */
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === "checkout" && p.status === "published"
  );
  const components: PageComponent[] | null = page?.components ?? null;

  if (components && components.length) {
    return (
      <DynamicRenderer components={components} data={{ locale: lang, cart }} />
    );
  }

  /* ---------- fallback render ---------- */
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary />
      <CheckoutForm locale={lang} />
    </div>
  );
}
