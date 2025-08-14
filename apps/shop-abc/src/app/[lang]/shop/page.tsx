// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS, getProductById } from "@/lib/products";
import type { SKU, PageComponent } from "@acme/types";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";
import type { Metadata } from "next";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../../shop.json";
import { fetchPostById } from "@acme/sanity";
import EditorialBlock from "@ui/components/cms/blocks/EditorialBlock";
import ShopClient from "./ShopClient.client";
import { trackPageView } from "@platform-core/analytics";

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
  const editorialBlocks: { post: BlogPost; products: SKU[] }[] = [];
  if (shop.luxuryFeatures?.contentMerchandising) {
    for (const cfg of shop.editorialMerchandising ?? []) {
      const post = await fetchPostById(shop.id, cfg.postId);
      if (post) {
        const products = cfg.productIds
          .map((id: string) => getProductById(id))
          .filter(Boolean) as SKU[];
        editorialBlocks.push({ post, products });
      }
    }
  }
  await trackPageView(shop.id, "shop");
  if (components && components.length) {
    return (
      <>
        {editorialBlocks.map((b, i) => (
          <EditorialBlock key={i} post={b.post} products={b.products} />
        ))}
        <DynamicRenderer components={components} locale={params.lang} />
      </>
    );
  }
  return (
    <>
      {editorialBlocks.map((b, i) => (
        <EditorialBlock key={i} post={b.post} products={b.products} />
      ))}
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}

