// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import { Locale, resolveLocale } from "@/i18n/locales";
import type { PageComponent, SKU } from "@types";
import type { Metadata } from "next";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

async function loadComponents(): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === "shop" && p.status === "published"
  );
  return page?.components ?? null;
}

export default async function ShopIndexPage({
  params,
}: {
  params: { lang?: string };
}) {
  const lang: Locale = resolveLocale(params.lang);
  const components = await loadComponents();

  if (components && components.length) {
    return (
      <DynamicRenderer
        components={components}
        data={{ locale: lang, products: PRODUCTS as SKU[] }}
      />
    );
  }

  // Fallback to default shop view
  return <ShopClient skus={PRODUCTS as SKU[]} />;
}
