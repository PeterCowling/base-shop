// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@acme/products";
import type { SKU, PageComponent } from "@types";
import type { Metadata } from "next";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";
import { trackPageView } from "@acme/analytics";

async function loadComponents(): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === "shop" && p.status === "published"
  );
  return page?.components ?? null;
}

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default async function ShopIndexPage({
  params,
}: {
  params: { lang: string };
}) {
  const components = await loadComponents();
  await trackPageView(shop.id, "shop");
  if (components && components.length) {
    return <DynamicRenderer components={components} locale={params.lang} />;
  }
  return <ShopClient skus={PRODUCTS as SKU[]} />;
}

