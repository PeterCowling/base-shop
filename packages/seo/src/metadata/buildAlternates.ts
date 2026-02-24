import type { SeoSiteConfig } from "../config/index.js";

import { ensureNoTrailingSlash } from "./ensureNoTrailingSlash.js";

export interface AlternatesOptions {
  canonicalPath: string;
  locales?: string[];
  defaultLocale?: string;
}

export interface AlternatesResult {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Build canonical URL and hreflang alternate links.
 *
 * Generic version of Brikette's buildLinks() — accepts config injection
 * instead of importing site constants. Does NOT include slug translation
 * (that stays app-local).
 */
export function buildAlternates(
  config: Pick<SeoSiteConfig, "siteUrl">,
  options: AlternatesOptions,
): AlternatesResult {
  const { siteUrl } = config;
  const { canonicalPath, locales, defaultLocale } = options;
  const normalizedSiteUrl = ensureNoTrailingSlash(siteUrl);
  const normalizedCanonicalPath = (() => {
    const withLeadingSlash = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
    return ensureNoTrailingSlash(withLeadingSlash);
  })();

  const canonical = `${normalizedSiteUrl}${normalizedCanonicalPath === "/" ? "" : normalizedCanonicalPath}`;

  const languages: Record<string, string> = {};

  if (locales && locales.length > 0) {
    for (const locale of locales) {
      const localizedPath = normalizedCanonicalPath === "/" ?
        `/${locale}` :
        `/${locale}${normalizedCanonicalPath}`;
      languages[locale] = `${normalizedSiteUrl}${localizedPath}`;
    }

    // x-default points to the default locale variant
    if (defaultLocale && languages[defaultLocale]) {
      languages["x-default"] = languages[defaultLocale];
    }
  }

  return { canonical, languages };
}
