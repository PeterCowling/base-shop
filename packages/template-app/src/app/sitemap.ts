import type { MetadataRoute } from "next";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { readRepo } from "@platform-core/repositories/products.server";
import { env } from "@acme/config";
import type { ProductPublication } from "@acme/types";
import { nowIso } from "@date-utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const shop = env.NEXT_PUBLIC_SHOP_ID ?? "shop";
  const now = nowIso();

  const [settings, products] = await Promise.all([
    getShopSettings(shop),
    readRepo<ProductPublication>(shop),
  ]);
  const languages = settings.languages ?? ["en"];

  const buildAlternates = (path: string) => {
    const map: Record<string, string> = {};
    for (const lang of languages) {
      map[lang] = `${base}/${lang}${path}`;
    }
    return { languages: map };
  };

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/${languages[0]}`,
      lastModified: now,
      alternates: buildAlternates(""),
    },
  ];

  for (const product of products) {
    const slug = (product as { id: string; slug?: string }).slug ?? product.id;
    entries.push({
      url: `${base}/${languages[0]}/product/${slug}`,
      lastModified: product.updated_at,
      alternates: buildAlternates(`/product/${slug}`),
    });
  }

  return entries;
}
