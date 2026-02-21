/** SEO site configuration — used by all builder functions. */
export interface SeoSiteConfig {
  siteName: string;
  siteUrl: string;
  defaultLocale?: string;
  supportedLocales?: string[];
  twitter?: {
    site?: string;
    creator?: string;
  };
  defaultOgImage?: {
    url: string;
    width: number;
    height: number;
    alt?: string;
  };
}

/** Robots.txt configuration. */
export interface SeoRobotsConfig {
  siteUrl: string;
  sitemapPath?: string;
  disallow?: string[];
  allow?: string[];
}

/** AI discovery configuration (llms.txt, ai-plugin.json). */
export interface SeoAiConfig {
  siteUrl: string;
  siteName: string;
  description: string;
  contactEmail?: string;
}
