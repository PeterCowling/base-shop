// apps/cms/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import { Locale, resolveLocale } from "@/i18n/locales";
import type { Metadata } from "next";
// Use server-side translations in server components/routes
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { createCartStore } from "@platform-core/cartStore";
import { cookies } from "next/headers";
import { getShopSettings } from "@platform-core/repositories/settings.server";

export async function generateMetadata(): Promise<Metadata> {
  const { useTranslations: getServerTranslations } = await import(
    "@acme/i18n/useTranslations.server" // i18n-exempt -- INTL-000 module specifier [ttl=2026-03-31]
  );
  const t = await getServerTranslations("en");
  return { title: t("checkout.title") as string };
}

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
    const { useTranslations: getServerTranslations } = await import(
      "@acme/i18n/useTranslations.server" // i18n-exempt -- INTL-000 module specifier [ttl=2026-03-31]
    );
    const t = await getServerTranslations("en");
    return <p className="p-8 text-center">{t("checkout.empty")}</p>;
  }

  const settings = await getShopSettings("shop");

  /* ---------- render ---------- */
  return (
    <div className="mx-auto flex flex-col gap-10 p-6">
      <OrderSummary />
      <CheckoutForm locale={lang} taxRegion={settings.taxRegion ?? ""} />
    </div>
  );
}
