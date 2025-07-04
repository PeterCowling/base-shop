// packages/template-app/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import { Locale, resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
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

  /* ---------- render ---------- */
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary />
      <CheckoutForm locale={lang} />
    </div>
  );
}
