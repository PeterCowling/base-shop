// apps/shop-bcd/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { env } from "@acme/config";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default async function ShopIndexPage({
  params,
}: {
  params: { lang: string };
}) {
  let latestPost: BlogPost | undefined;
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
          shopUrl: first.products?.[0]
            ? `/${params.lang}/product/${first.products[0]}`
            : undefined,
        };
      }
    }
  } catch {
    /* ignore bad feature flags */
  }
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
