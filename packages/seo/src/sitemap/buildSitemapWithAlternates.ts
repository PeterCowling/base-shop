import type { SitemapEntry } from "./buildSitemapEntry.js";

export interface SitemapPage {
  path: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}

export interface SitemapAlternatesConfig {
  siteUrl: string;
  locales: string[];
  defaultLocale?: string;
}

/**
 * Build sitemap entries with hreflang alternates for each locale.
 * Each page gets one entry using the default locale as the primary URL,
 * with alternates for all configured locales.
 */
export function buildSitemapWithAlternates(
  pages: SitemapPage[],
  config: SitemapAlternatesConfig,
): SitemapEntry[] {
  const base = config.siteUrl.replace(/\/$/, "");
  const defaultLocale = config.defaultLocale ?? config.locales[0] ?? "en";

  return pages.map((page) => {
    const languages: Record<string, string> = {};
    for (const locale of config.locales) {
      languages[locale] = `${base}/${locale}${page.path}`;
    }

    const entry: SitemapEntry = {
      url: `${base}/${defaultLocale}${page.path}`,
      alternates: { languages },
    };
    if (page.lastModified !== undefined) entry.lastModified = page.lastModified;
    if (page.changeFrequency !== undefined) entry.changeFrequency = page.changeFrequency;
    if (page.priority !== undefined) entry.priority = page.priority;
    return entry;
  });
}
