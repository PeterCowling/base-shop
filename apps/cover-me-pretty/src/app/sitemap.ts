import type { MetadataRoute } from "next";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { readRepo as readProducts } from "@acme/platform-core/repositories/products.server";
import { loadCoreEnv } from "@acme/config/env/core";
import type { ProductPublication } from "@acme/types";
import { nowIso } from "@acme/date-utils";
import { getConfig as getSanityConfig, type BlogPost } from "@acme/sanity";
import { listPosts } from "@acme/platform-core/repositories/blog.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_SHOP_ID } = loadCoreEnv();
  const base = NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shop = NEXT_PUBLIC_SHOP_ID || "shop";
  const now = nowIso();

  const [settings, products, sanityCfg] = await Promise.all([
    getShopSettings(shop),
    readProducts<ProductPublication>(shop),
    getSanityConfig(shop).catch(() => null),
  ]);

  // Use the readonly languages as-is; no mutation needed
  const languages = settings.languages ?? ["en"];
  const primary = languages[0] ?? "en";

  const buildAlternates = (path: string) => {
    const map: Record<string, string> = {};
    for (const lang of languages) {
      map[lang] = `${base}/${lang}${path}`;
    }
    return { languages: map };
  };

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/${primary}`,
      lastModified: now,
      alternates: buildAlternates(""),
    },
  ];

  for (const product of products) {
    const slug = (product as { id: string; slug?: string }).slug ?? product.id;
    entries.push({
      url: `${base}/${primary}/product/${slug}`,
      lastModified: product.updated_at,
      alternates: buildAlternates(`/product/${slug}`),
    });
  }

  if (settings.luxuryFeatures?.blog) {
    // Blog listing page
    entries.push({
      url: `${base}/${primary}/blog`,
      lastModified: now,
      alternates: buildAlternates(`/blog`),
    });

    // Blog posts (when Sanity configured)
    if (sanityCfg) {
      const posts = (await listPosts(sanityCfg)) ?? [];
      for (const post of posts) {
        const slug = (post as BlogPost & { slug?: string }).slug as string;
        if (!slug) continue;
        entries.push({
          url: `${base}/${primary}/blog/${slug}`,
          lastModified: (post as { publishedAt?: string }).publishedAt || now,
          alternates: buildAlternates(`/blog/${slug}`),
        });
      }
    }
  }

  return entries;
}
