import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { resolveLocale } from "@i18n/locales";
import BlogListing, {
  type BlogPost,
} from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import shop from "../../../../shop.json";
import ShopClient from "./ShopClient.client";
import { listShopSkus } from "@platform-core/repositories/catalogSkus.server";
import { draftMode } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  try {
    const { lang: rawLang } = await params;
    const locale = resolveLocale(rawLang);
    const t = await getTranslations(locale);
    return { title: t("shop.title") };
  } catch {
    // Fallback metadata when i18n/env lookups fail
    return { title: "Shop" }; // i18n-exempt -- SEO-1234 [ttl=2025-12-31] LHCI fallback title for /shop
  }
}

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { isEnabled } = await draftMode();
  let latestPost: BlogPost | undefined;
  try {
    const { lang: rawLang } = await params;
    const lang = resolveLocale(rawLang);
    const rawLuxury = process.env.NEXT_PUBLIC_LUXURY_FEATURES;
    const luxury = JSON.parse(typeof rawLuxury === "string" ? rawLuxury : "{}");
    if (luxury.contentMerchandising && luxury.blog) {
      const posts = await fetchPublishedPosts(shop.id);
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${lang}/blog/${first.slug}`,
          shopUrl: first.products?.[0]
            ? `/${lang}/product/${first.products[0]}`
            : undefined,
        };
      }
    }
  } catch {
    /* ignore bad feature flags / blog fetch issues */
  }

  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  let skus: SKU[] = [];
  try {
    skus = await listShopSkus(shop.id, lang, { includeDraft: isEnabled });
  } catch {
    skus = [];
  }
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <ShopClient skus={skus} />
    </>
  );
}
