// src/utils/seo/jsonld/article.ts
import { normalizeString } from "./normalize";

export interface BuildArticleInput {
  headline: unknown;
  description: unknown;
  lang: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | string[];
  authorName?: string; // Organization name preferred
  publisherName?: string;
  publisherLogoUrl?: string;
}

export function buildArticlePayload(input: BuildArticleInput): Record<string, unknown> | null {
  const headline = normalizeString(input.headline);
  const description = normalizeString(input.description);
  // Require a meaningful headline; allow description to be omitted so pages
  // without a localized description can still emit valid Article JSON-LD.
  if (!headline) return null;

  const img = input.image ?? undefined;
  const images = Array.isArray(img) ? img.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : img ? [img] : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    ...(description ? { description } : {}),
    inLanguage: input.lang,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    ...(images
      ? {
          image: images.length === 1 ? images[0] : images,
        }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.authorName
      ? {
          author: { "@type": "Person", name: input.authorName },
        }
      : {}),
    ...(input.publisherName
      ? {
          publisher: {
            "@type": "Organization",
            name: input.publisherName,
            ...(input.publisherLogoUrl
              ? { logo: { "@type": "ImageObject", url: input.publisherLogoUrl } }
              : {}),
          },
        }
      : {}),
  };
}
