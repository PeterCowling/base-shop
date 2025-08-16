// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU, PageComponent } from "@acme/types";
import type { Metadata } from "next";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { getPublishedPosts } from "@acme/blog";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../../shop.json";
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
  await trackPageView(shop.id, "shop");

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

  const content =
    components && components.length ? (
      <DynamicRenderer components={components} locale={params.lang} />
    ) : (
      <ShopClient skus={PRODUCTS as SKU[]} />
    );

  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      {content}
    </>
  );
}

