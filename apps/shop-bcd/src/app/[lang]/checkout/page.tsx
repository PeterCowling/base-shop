// apps/shop-bcd/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import DeliveryScheduler from "@ui/components/organisms/DeliveryScheduler";
import { Locale, resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { cookies } from "next/headers";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../shop.json";

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

  const settings = await getShopSettings(shop.id);
  const premierDelivery = settings.premierDelivery;
  const hasPremierShipping = shop.shippingProviders?.includes(
    "premier-shipping",
  );

  /* ---------- render ---------- */
  const showPremier =
    hasPremierShipping &&
    premierDelivery &&
    settings.luxuryFeatures?.premierDelivery;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
      <OrderSummary />
      {showPremier && (
        <PremierDeliveryPicker
          windows={premierDelivery.windows}
          regions={premierDelivery.regions}
          carriers={premierDelivery.carriers}
        />
      )}
      <CheckoutForm locale={lang} taxRegion={settings.taxRegion} />
    </div>
  );
}

function PremierDeliveryPicker({
  windows,
  regions,
  carriers,
}: {
  windows: string[];
  regions: string[];
  carriers: string[];
}) {
  "use client";
  return (
    <DeliveryScheduler
      windows={windows}
      regions={regions}
      carriers={carriers}
      onChange={({ region, carrier, window }) => {
        if (!region || !carrier || !window) return;
        fetch("/api/delivery/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ region, carrier, window }),
        }).catch(() => {});
      }}
    />
  );
}
