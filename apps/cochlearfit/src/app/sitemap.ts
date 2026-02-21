import type { MetadataRoute } from "next";

import { buildSitemapWithAlternates } from "@acme/seo/sitemap";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/locales";
import { SITE_URL } from "@/lib/site";

const pages = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/sizing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/policies/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/shipping", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/terms-sale-eu", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapWithAlternates(pages, {
    siteUrl: SITE_URL,
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
  }) as MetadataRoute.Sitemap;
}
