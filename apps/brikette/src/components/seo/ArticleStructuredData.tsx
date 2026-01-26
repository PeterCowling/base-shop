 
// src/components/seo/ArticleStructuredData.tsx
import { memo } from "react";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildArticlePayload } from "@/utils/seo/jsonld";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

import { ensureLeadingSlash, normaliseWindowPath, useOptionalRouterPathname } from "./locationUtils";

type Props = {
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | string[];
  authorName?: string; // Organization name preferred
  publisherName?: string;
  publisherLogoUrl?: string;
};

function ArticleStructuredData({
  headline,
  description,
  datePublished,
  dateModified,
  image,
  authorName = "Hostel Brikette",
  publisherName = "Hostel Brikette",
  publisherLogoUrl = `${BASE_URL}/img/hostel_brikette_icon.png`,
}: Props): JSX.Element {
  const lang = useCurrentLanguage();
  const routerPathname = useOptionalRouterPathname();
  const fallbackPath = normaliseWindowPath();
  const rawPathname = routerPathname ?? fallbackPath;
  const pathname = rawPathname ? ensureLeadingSlash(rawPathname) : "/";

  const canonicalUrl = buildCanonicalUrl(BASE_URL, pathname);
  const img = image || `${BASE_URL}/img/hostel-communal-terrace-lush-view.webp`;
  const payload =
    buildArticlePayload({
      headline,
      description,
      lang,
      url: canonicalUrl,
      image: img,
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      authorName,
      publisherName,
      publisherLogoUrl,
    }) || undefined;
  const json = payload ? serializeJsonLdValue(payload) : "";
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(ArticleStructuredData);
