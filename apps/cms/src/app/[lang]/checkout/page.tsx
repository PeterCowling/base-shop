// apps/cms/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import { Locale, resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { createCartStore } from "@platform-core/cartStore";
import { cookies } from "next/headers";
import { getShopSettings } from "@platform-core/repositories/settings.server";

export const metadata = {
  title: "Checkout · Base-Shop",
};

/**
 * Params is a plain object in Next 15. `cookies()` may be async in
 * some runtimes; keep awaiting that.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  /* ---------- read params ---------- */
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);

  /* ---------- read cart from cookie ---------- */
  const cookieStore = await cookies(); // ← await here
  const rawCartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cartId = typeof rawCartId === "string" ? rawCartId : null;
  const store = createCartStore();
  const cart = cartId ? await store.getCart(cartId) : {};

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    return <p className="p-8 text-center">Your cart is empty.</p>;
  }

  const settings = await getShopSettings("shop");

  /* ---------- render ---------- */
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary />
      <CheckoutForm locale={lang} taxRegion={settings.taxRegion ?? ""} />
    </div>
  );
}
