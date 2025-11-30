// apps/cover-me-pretty/src/app/[lang]/checkout/page.tsx

import { Locale, resolveLocale } from "@i18n/locales";
import Section from "@ui/components/cms/blocks/Section";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@platform-core/cartCookie";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import CheckoutForm from "@ui/components/checkout/CheckoutForm";
import { DeliveryScheduler } from "@ui/components/organisms";
import OrderSummary from "@ui/components/organisms/OrderSummary";
import { cookies } from "next/headers";
import shop from "../../../../shop.json";

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
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in the edge runtime.
 * Await both, then render the checkout page or an empty cart notice.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  /* ----- await params ----- */
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);

  /* ----- read cart from cookie ----- */
  const cookieStore = await cookies(); // ← await here
  const cart = (decodeCartCookie(cookieStore.get(CART_COOKIE)?.value) ??
    {}) as CartState;

  /* ----- empty cart guard ----- */
  if (!Object.keys(cart).length) {
    const t = await getServerTranslations(lang);
    return <p className="p-8 text-center">{t("checkout.empty")}</p>;
  }

  const settings = await getShopSettings(shop.id);
  const premierDelivery = settings.premierDelivery;
  const hasPremierShipping =
    shop.shippingProviders?.includes("premier-shipping");

  /* ----- render ----- */
  return (
    <Section contentWidth="normal">
      <div className="flex flex-col gap-10 p-6">
        <OrderSummary />
        {hasPremierShipping && premierDelivery && (
          <PremierDeliveryPicker
            windows={premierDelivery.windows}
            regions={premierDelivery.regions}
          />
        )}
        {/* taxRegion may be undefined; coerce to empty string for CheckoutForm */}
        <CheckoutForm locale={lang} taxRegion={settings.taxRegion ?? ""} />
      </div>
    </Section>
  );
}

function PremierDeliveryPicker({
  windows,
  regions,
}: {
  windows: string[];
  regions: string[];
}) {
  "use client";
  return (
    <DeliveryScheduler
      windows={windows}
      regions={regions}
      onChange={({ region, window, date }) => {
        if (!region || !window || !date) return;
        fetch("/api/delivery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ region, date, window }),
        }).catch(() => {});
      }}
    />
  );
}
