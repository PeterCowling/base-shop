// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx

import { getProductBySlug, getProductById } from "@/lib/products";
import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient.client";
import shop from "../../../../shop.json";
import { fetchPostById } from "@acme/sanity";
import EditorialBlock from "@ui/components/cms/blocks/EditorialBlock";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";
import type { SKU } from "@acme/types";

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({
      lang,
      slug,
    }))
  );
}

export const revalidate = 60;

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProductBySlug(params.slug);
  return {
    title: product ? `${product.title} · Base-Shop` : "Product not found",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();
  const editorialBlocks: { post: BlogPost; products: SKU[] }[] = [];
  if (shop.luxuryFeatures?.contentMerchandising) {
    for (const cfg of shop.editorialMerchandising ?? []) {
      if (cfg.productIds.includes(product.id)) {
        const post = await fetchPostById(shop.id, cfg.postId);
        if (post) {
          const products = cfg.productIds
            .map((id) => getProductById(id))
            .filter(Boolean) as SKU[];
          editorialBlocks.push({ post, products });
        }
      }
    }
  }
  return (
    <>
      {editorialBlocks.map((b, i) => (
        <EditorialBlock key={i} post={b.post} products={b.products} />
      ))}
      <PdpClient product={product} />
    </>
  );
}
