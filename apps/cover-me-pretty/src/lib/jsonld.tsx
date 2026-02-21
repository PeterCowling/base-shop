/**
 * JSON-LD builders for Cover-Me-Pretty.
 *
 * Common builders are re-exported from @acme/seo/jsonld.
 * CMP-specific builders (blogItemListJsonLd) remain local.
 */
import React from "react";

import { serializeJsonLdValue } from "@acme/seo/jsonld";

// Re-export shared builders (identical signatures)
export { articleJsonLd, organizationJsonLd, productJsonLd } from "@acme/seo/jsonld";

/**
 * Render a `<script type="application/ld+json">` tag.
 * Uses XSS-safe serialization from @acme/seo.
 */
export function JsonLdScript({ data }: { data: unknown }) {
  if (data == null) return null;
  return (
    <script
      // i18n-exempt -- SEO-09 MIME type constant, not user-facing copy [ttl=2027-12-31]
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLdValue(data) }}
    />
  );
}

function toIsoDate(input?: string) {
  if (!input) return undefined;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** CMP-specific blog item list with BlogPosting items and date normalization. */
export function blogItemListJsonLd({
  url,
  items,
}: {
  url?: string;
  items: Array<{ title: string; url: string; date?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url,
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: it.url,
      item: {
        "@type": "BlogPosting",
        headline: it.title,
        url: it.url,
        ...(toIsoDate(it.date) ? { datePublished: toIsoDate(it.date) } : {}),
      },
    })),
  } as const;
}
