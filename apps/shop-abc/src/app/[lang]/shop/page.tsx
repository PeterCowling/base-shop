// apps/shop-abc/src/app/[lang]/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU } from "@types";
import type { Metadata } from "next";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { Locale, resolveLocale } from "@/i18n/locales";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const locale: Locale = resolveLocale(rawLang);

  const pages = await getPages(shop.id);
  const components = pages.find((p) => p.slug === "shop")?.components ?? [];

  if (!components.length) {
    return <ShopClient skus={PRODUCTS as SKU[]} />;
  }

  return (
    <DynamicRenderer
      components={components}
      locale={locale}
      runtimeData={{ skus: PRODUCTS as SKU[] }}
    />
  );
}
