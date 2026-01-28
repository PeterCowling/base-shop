// src/app/_lib/metadata.ts
// App Router metadata utilities - wraps existing SEO helpers for generateMetadata
import type { Metadata } from "next";

import { BASE_URL } from "@/config/site";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import * as seo from "@/utils/seo";

export type AppMetadataArgs = {
  lang: AppLanguage;
  title: string;
  description: string;
  /** Canonical pathname beginning with "/" */
  path: string;
  /** OG image URL or object with src, width, height */
  image?: string | { src: string; width: number; height: number };
  /** Image dimensions (used when image is a string) */
  imageWidth?: number;
  imageHeight?: number;
  /** Image alt text */
  imageAlt?: string;
  /** Defaults to "website"; use "article" for guides */
  ogType?: "website" | "article";
  /** When false, emit robots noindex,follow */
  isPublished?: boolean;
};

/**
 * Build Next.js App Router Metadata object from route head args.
 * This replaces the Remix-style buildRouteMeta() for App Router pages.
 */
export function buildAppMetadata({
  lang,
  title,
  description,
  path,
  image,
  imageWidth = DEFAULT_OG_IMAGE.width,
  imageHeight = DEFAULT_OG_IMAGE.height,
  imageAlt,
  ogType = "website",
  isPublished = true,
}: AppMetadataArgs): Metadata {
  const origin = BASE_URL || "https://hostel-positano.com";
  const url = seo.ensureTrailingSlash(`${origin}${path}`);

  // Normalize image to extract src, width, height
  const imageUrl = typeof image === "string" ? image : image?.src;
  const finalImageWidth = typeof image === "object" ? image.width : imageWidth;
  const finalImageHeight = typeof image === "object" ? image.height : imageHeight;

  // Build hreflang alternates using proven buildLinks() logic
  const links = seo.buildLinks({ lang, origin, path });
  const languages: Record<string, string> = {};

  // Convert HtmlLinkDescriptor[] → Record<string, string> for Next.js alternates.languages
  // Apply trailing-slash policy to alternates (buildLinks only applies it to canonical)
  for (const link of links) {
    if (link.rel === "alternate" && link.hrefLang) {
      languages[link.hrefLang] = seo.ensureTrailingSlash(link.href);
    }
  }


  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      type: ogType,
      locale: lang,
      alternateLocale: i18nConfig.supportedLngs.filter((l) => l !== lang),
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                width: finalImageWidth,
                height: finalImageHeight,
                ...(imageAlt ? { alt: imageAlt } : {}),
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
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

/**
 * Build link descriptors for preload/prefetch hints.
 * Can be included in generateMetadata via the `other` field or rendered directly.
 */
export function buildAppLinks(args: { lang: AppLanguage; path: string; origin?: string }) {
  const origin = args.origin || BASE_URL || "https://hostel-positano.com";
  try {
    return seo.buildLinks({
      lang: args.lang,
      origin,
      path: args.path,
    });
  } catch {
    // Fallback to basic canonical
    const canonicalPath = args.path !== "/" && args.path.endsWith("/") ? args.path.slice(0, -1) : args.path;
    return [
      {
        rel: "canonical",
        href: `${origin}${canonicalPath === "/" ? "" : canonicalPath}`,
      },
    ];
  }
}
