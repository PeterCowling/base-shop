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

type LinkDescriptor = ReturnType<typeof seo.buildLinks>[number];

type OpenGraphImage = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
};

const resolveCanonicalFallback = (origin: string, path: string): string =>
  `${origin}${path === "/" ? "" : path.replace(/\/+$/, "")}`;

const resolveCanonicalUrl = (
  links: LinkDescriptor[],
  origin: string,
  path: string,
): string => links.find((link) => link.rel === "canonical")?.href ?? resolveCanonicalFallback(origin, path);

const buildAlternateLanguages = (links: LinkDescriptor[]): Record<string, string> => {
  const languages: Record<string, string> = {};
  for (const link of links) {
    if (link.rel === "alternate" && link.hrefLang) {
      languages[link.hrefLang] = link.href;
    }
  }
  return languages;
};

const resolveOpenGraphImage = ({
  image,
  imageWidth,
  imageHeight,
  origin,
}: {
  image?: string | { src: string; width: number; height: number };
  imageWidth: number;
  imageHeight: number;
  origin: string;
}): OpenGraphImage => {
  const imageUrl = typeof image === "string" ? image : image?.src;
  const resolvedWidth = typeof image === "object" ? image.width : imageWidth;
  const resolvedHeight = typeof image === "object" ? image.height : imageHeight;

  return {
    imageUrl: imageUrl || `${origin}${DEFAULT_OG_IMAGE.path}`,
    imageWidth: imageUrl ? resolvedWidth : DEFAULT_OG_IMAGE.width,
    imageHeight: imageUrl ? resolvedHeight : DEFAULT_OG_IMAGE.height,
  };
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

  // Build hreflang alternates using proven buildLinks() logic
  const links = seo.buildLinks({ lang, origin, path });
  const canonicalUrl = resolveCanonicalUrl(links, origin, path);
  const languages = buildAlternateLanguages(links);
  const { imageUrl: ogImageUrl, imageWidth: ogImageWidth, imageHeight: ogImageHeight } = resolveOpenGraphImage({
    image,
    imageWidth,
    imageHeight,
    origin,
  });

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      siteName: "Hostel Brikette",
      title,
      description,
      url: canonicalUrl,
      type: ogType,
      locale: lang,
      alternateLocale: i18nConfig.supportedLngs.filter((l) => l !== lang),
      images: [
        {
          url: ogImageUrl,
          width: ogImageWidth,
          height: ogImageHeight,
          ...(imageAlt ? { alt: imageAlt } : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@hostelbrikette",
      creator: "@hostelbrikette",
      title,
      description,
      images: [ogImageUrl],
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
    const canonicalPath = args.path === "/" ? "/" : args.path.replace(/\/+$/, "");
    return [
      {
        rel: "canonical",
        href: `${origin}${canonicalPath === "/" ? "" : canonicalPath}`,
      },
    ];
  }
}
