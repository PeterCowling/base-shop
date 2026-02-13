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

export function buildSitemapWithAlternates(
  _pages: SitemapPage[],
  _config: SitemapAlternatesConfig,
): SitemapEntry[] {
  throw new Error("Not implemented");
}
