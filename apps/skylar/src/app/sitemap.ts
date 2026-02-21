import type { MetadataRoute } from "next";

import { buildSitemapWithAlternates } from "@acme/seo/sitemap";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/locales";

const SITE_URL = "https://skylarsrl.com";

const pages = [
  { path: "", priority: 1.0, changeFrequency: "monthly" as const },
  { path: "/products", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/real-estate", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/people", priority: 0.7, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapWithAlternates(pages, {
    siteUrl: SITE_URL,
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
  }) as MetadataRoute.Sitemap;
}
