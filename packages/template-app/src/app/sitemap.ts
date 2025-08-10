import type { MetadataRoute } from 'next';
import { getShopSettings } from '@platform-core/src/repositories/settings.server';
import { readRepo } from '@platform-core/src/repositories/products.server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || 'shop';
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || `https://${shop}.pages.dev`;

  const settings = await getShopSettings(shop);
  const languages = settings.languages?.length
    ? settings.languages
    : ['en'];

  const products = await readRepo<{ id: string; sku?: string; slug?: string }>(
    shop
  );
  const slugs = products.map((p) => p.slug || p.sku || p.id);

  const paths = [''].concat(slugs.map((slug) => `product/${slug}`));
  const primaryLang = languages[0];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    const langUrls = Object.fromEntries(
      languages.map((lang) => [lang, `${base}/${lang}${path ? `/${path}` : ''}`])
    );
    entries.push({
      url: `${base}/${primaryLang}${path ? `/${path}` : ''}`,
      alternates: { languages: langUrls },
    });
  }

  return entries;
}
