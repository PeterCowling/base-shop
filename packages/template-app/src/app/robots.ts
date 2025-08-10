import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || 'shop';
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || `https://${shop}.pages.dev`;

  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/ai-sitemap.xml`],
  };
}
