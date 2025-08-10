import type { MetadataRoute } from "next";
import { getShopSettings } from "@platform-core/src/repositories/settings.server";
import { readRepo } from "@platform-core/src/repositories/products.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "shop";
  const now = new Date().toISOString();

  const [settings, products] = await Promise.all([
    getShopSettings(shop),
    readRepo<Record<string, unknown>>(shop),
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
    const slug = (product as any).slug || (product as any).id;
    if (!slug) continue;
    entries.push({
      url: `${base}/${languages[0]}/product/${slug}`,
      lastModified: (product as any).updated_at || now,
      alternates: buildAlternates(`/product/${slug}`),
    });
  }

  return entries;
}
