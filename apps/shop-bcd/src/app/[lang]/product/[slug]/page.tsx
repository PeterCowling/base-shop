// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx

import { getProductBySlug } from "@/lib/products";
import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { env } from "@acme/config";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { getReturnLogistics } from "@platform-core/returnLogistics";

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

  let latestPost: BlogPost | undefined;
  const returnCfg = await getReturnLogistics();
  try {
    const luxury = JSON.parse(env.NEXT_PUBLIC_LUXURY_FEATURES ?? "{}");
    if (luxury.contentMerchandising) {
      const posts = await fetchPublishedPosts(shop.id);
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${params.lang}/blog/${first.slug}`,
        };
      }
    }
  } catch {
    /* ignore bad feature flags */
  }

  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <PdpClient product={product} />
      {(returnCfg.requireTags || !returnCfg.allowWear) && (
        <div className="p-6 space-y-2">
          {returnCfg.requireTags && (
            <p>Original tags must be attached for a return.</p>
          )}
          {!returnCfg.allowWear && (
            <p>Worn items will not be accepted.</p>
          )}
        </div>
      )}
    </>
  );
}
