// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU, PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import shop from "../../../shop.json";
import type { Metadata } from "next";
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
  params: { lang: string };
}) {
  const components = await loadComponents();
  if (components) {
    return (
      <DynamicRenderer
        components={components}
        locale={params.lang}
        data={{ skus: PRODUCTS as SKU[] }}
      />
    );
  }
  // Fallback to the static client layout if no CMS page exists
  return <ShopClient skus={PRODUCTS as SKU[]} />;
}
