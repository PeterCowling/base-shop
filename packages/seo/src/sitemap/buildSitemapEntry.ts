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

/**
 * Build a single sitemap entry (no i18n alternates).
 */
export function buildSitemapEntry(options: SitemapEntryOptions): SitemapEntry {
  const base = options.siteUrl.replace(/\/$/, "");
  const entry: SitemapEntry = {
    url: `${base}${options.path}`,
  };
  if (options.lastModified !== undefined) entry.lastModified = options.lastModified;
  if (options.changeFrequency !== undefined) entry.changeFrequency = options.changeFrequency;
  if (options.priority !== undefined) entry.priority = options.priority;
  return entry;
}
