// apps/shop-abc/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@/lib/products";
import type { SKU, PageComponent } from "@acme/types";
import type { Metadata } from "next";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { env } from "@acme/config";
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

