// apps/shop-abc/src/app/[lang]/checkout/page.tsx

import CheckoutForm from "@ui/components/checkout/CheckoutForm";
import OrderSummary from "@ui/components/organisms/OrderSummary";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { DeliveryScheduler } from "@ui/components/organisms/DeliveryScheduler";
import { Locale, resolveLocale } from "@/i18n/locales";
import { useTranslations } from "@/i18n/useTranslations";
import {
  CART_COOKIE,
  decodeCartCookie,
} from "@platform-core/cartCookie";
import { getCart } from "@platform-core/cartStore";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { PageComponent } from "@acme/types";
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
  const t = await useTranslations(lang);

  /* ---------- read cart from cookie ---------- */
  const cookieStore = await cookies(); // ← await here
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? await getCart(cartId) : {};

  /* ---------- empty cart guard ---------- */
  if (!Object.keys(cart).length) {
    return <p className="p-8 text-center">{t("checkout.empty")}</p>;
  }

  const components = await loadComponents();
  if (components && components.length) {
    return (
      <DynamicRenderer
        components={components}
        locale={lang}
        runtimeData={{ OrderSummary: { cart } } as any}
      />
    );
  }

  /* ---------- render ---------- */
  const settings = await getShopSettings(shop.id);
  const premierDelivery = settings.premierDelivery;
  const hasPremierShipping = shop.shippingProviders?.includes(
    "premier-shipping",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary />
      {hasPremierShipping && premierDelivery && (
        <PremierDeliveryPicker
          windows={premierDelivery.windows}
          regions={premierDelivery.regions}
        />
      )}
      <CheckoutForm locale={lang} taxRegion={settings.taxRegion} />
    </div>
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

