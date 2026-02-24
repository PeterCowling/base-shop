import type { Metadata } from "next";

import type { SeoSiteConfig } from "../config/index.js";

import { buildAlternates } from "./buildAlternates.js";
import { ensureNoTrailingSlash } from "./ensureNoTrailingSlash.js";

export interface PageSeo {
  title: string;
  description: string;
  /** Canonical pathname beginning with "/" */
  path: string;
  /** Current page locale (used for OG locale and hreflang) */
  locale?: string;
  /** Defaults to "website"; use "article" for editorial content */
  ogType?: "website" | "article";
  /** Custom OG image — overrides config.defaultOgImage */
  image?: { url: string; width: number; height: number; alt?: string };
  /** When false, emit robots noindex,follow */
  isPublished?: boolean;
}

/**
 * Build a Next.js App Router Metadata object.
 *
 * Generic version of Brikette's buildAppMetadata() — accepts SeoSiteConfig
 * instead of importing site constants, making it reusable across apps.
 */
export function buildMetadata(config: SeoSiteConfig, pageSeo: PageSeo): Metadata {
  const {
    siteName,
    siteUrl,
    supportedLocales,
    defaultLocale,
    twitter,
    defaultOgImage,
  } = config;

  const {
    title,
    description,
    path,
    locale,
    ogType = "website",
    image,
    isPublished = true,
  } = pageSeo;

  const normalizedSiteUrl = ensureNoTrailingSlash(siteUrl);

  // Build hreflang alternates
  const alternates = buildAlternates(
    { siteUrl },
    {
      canonicalPath: path,
      locales: supportedLocales,
      defaultLocale: locale ?? defaultLocale,
    },
  );

  // Resolve OG image — custom image takes precedence over default
  const ogImage = image ?? defaultOgImage;

  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(`${normalizedSiteUrl}/`),
    alternates: {
      canonical: alternates.canonical,
      languages: Object.keys(alternates.languages).length > 0
        ? alternates.languages
        : undefined,
    },
    openGraph: {
      siteName,
      title,
      description,
      url: alternates.canonical,
      type: ogType,
      ...(locale ? { locale } : {}),
      ...(supportedLocales && locale
        ? { alternateLocale: supportedLocales.filter((l) => l !== locale) }
        : {}),
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage.url,
                width: ogImage.width,
                height: ogImage.height,
                ...(ogImage.alt ? { alt: ogImage.alt } : {}),
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(twitter?.site ? { site: twitter.site } : {}),
      ...(twitter?.creator ? { creator: twitter.creator } : {}),
      title,
      description,
      ...(ogImage ? { images: [ogImage.url] } : {}),
    },
  };

  if (!isPublished) {
    metadata.robots = {
      index: false,
      follow: true,
    };
  }

  return metadata;
}
