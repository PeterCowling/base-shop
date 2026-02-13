export interface SitemapEntryOptions {
  siteUrl: string;
  path: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
  alternates?: { languages: Record<string, string> };
}

export function buildSitemapEntry(_options: SitemapEntryOptions): SitemapEntry {
  throw new Error("Not implemented");
}
