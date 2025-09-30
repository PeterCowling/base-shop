// apps/shop-bcd/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@platform-core/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { resolveLocale } from "@i18n/locales";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { coreEnv as env } from "@acme/config/env/core";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getTranslations(resolveLocale(params.lang));
  return { title: t("shop.title") };
}

export default async function ShopIndexPage({
  params,
}: {
  params: { lang: string };
}) {
  let latestPost: BlogPost | undefined;
  try {
    const luxury = JSON.parse(
      typeof env.NEXT_PUBLIC_LUXURY_FEATURES === "string"
        ? env.NEXT_PUBLIC_LUXURY_FEATURES
        : "{}",
    );
    if (luxury.contentMerchandising && luxury.blog) {
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
