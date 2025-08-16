// apps/shop-bcd/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { getPublishedPosts } from "@acme/blog";
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
  if (shop.luxuryFeatures?.blog) {
    const posts = getPublishedPosts();
    const first = posts[0];
    if (first) {
      latestPost = {
        title: first.title,
        excerpt: first.excerpt,
        url: `/${params.lang}/blog/${first.slug}`,
        shopUrl: first.skus?.[0]
          ? `/${params.lang}/product/${first.skus[0]}`
          : undefined,
      };
    }
  }
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
