// apps/shop-bcd/src/app/[lang]/shop/page.tsx
import { PRODUCTS, getProductById } from "@/lib/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import ShopClient from "./ShopClient.client";
import shop from "../../../../shop.json";
import { fetchPostById } from "@acme/sanity";
import EditorialBlock from "@ui/components/cms/blocks/EditorialBlock";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default async function ShopIndexPage() {
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
  return (
    <>
      {editorialBlocks.map((b, i) => (
        <EditorialBlock key={i} post={b.post} products={b.products} />
      ))}
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
