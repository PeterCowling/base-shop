import type { MetadataRoute } from "next";

import { LOCALES } from "@acme/i18n/locales";

import { readShopSkus } from "@/lib/shop";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://caryina.com";

/**
 * Static pages included in the sitemap for every locale.
 * Checkout, cart, success, cancelled, and admin routes are excluded
 * (blocked in robots.txt).
 */
const STATIC_PATHS = [
  "", // homepage
  "/about",
  "/shop",
  "/support",
  "/privacy",
  "/cookie-policy",
  "/terms",
  "/returns",
  "/shipping",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale
  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.8,
      });
    }
  }

  // Product detail pages — one entry per product per locale
  const skus = await readShopSkus("en");
  for (const locale of LOCALES) {
    for (const sku of skus) {
      entries.push({
        url: `${SITE_URL}/${locale}/product/${sku.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  return entries;
}
