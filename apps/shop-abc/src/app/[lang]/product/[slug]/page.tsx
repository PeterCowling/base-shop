// apps/shop-abc/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug, getProductById } from "@/lib/products";
import type { PageComponent, SKU } from "@acme/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { LOCALES } from "@acme/i18n";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { trackPageView } from "@platform-core/analytics";
import { fetchPostById } from "@acme/sanity";
import EditorialBlock from "@ui/components/cms/blocks/EditorialBlock";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === `product/${slug}` && p.status === "published"
  );
  return page?.components ?? null;
}

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
  params: { slug: string; lang: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  const components = await loadComponents(params.slug);
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
  await trackPageView(shop.id, `product/${params.slug}`);
  if (components && components.length) {
    return (
      <>
        {editorialBlocks.map((b, i) => (
          <EditorialBlock key={i} post={b.post} products={b.products} />
        ))}
        <DynamicRenderer
          components={components}
          locale={params.lang}
          runtimeData={{ ProductDetailTemplate: { product } }}
        />
      </>
    );
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

