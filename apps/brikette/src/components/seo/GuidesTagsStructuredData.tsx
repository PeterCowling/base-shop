/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/GuidesTagsStructuredData.tsx
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildTagDefinedTermSets, buildTagDictionary, type TagDictionary } from "@/utils/tags";

export interface GuidesTagListItem {
  url: string;
  name: string;
  description?: string;
}

interface GuidesTagsStructuredDataProps {
  pageUrl: string;
  name: string;
  description?: string;
  items?: GuidesTagListItem[];
  tag?: string;
}

const SCHEMA_CONTEXT = "https://schema.org" as const;

function buildDefinedTermSetJson(
  dictionary: TagDictionary,
  lang: string,
  tag?: string,
): string {
  const sets = buildTagDefinedTermSets(dictionary, BASE_URL, {
    filterLanguages: [lang],
    ...(tag ? { filterTag: tag } : {}),
  });
  if (sets.length === 0) return "";
  const set = sets[0];
  if (!set || !set.hasDefinedTerm.length) return "";
  return JSON.stringify({
    "@context": SCHEMA_CONTEXT,
    ...set,
  });
}

function buildCollectionJson(
  lang: string,
  pageUrl: string,
  name: string,
  description: string | undefined,
  items: GuidesTagListItem[] | undefined,
  opts: { tag?: string; includeAbout?: boolean },
): string {
  if (!items || items.length === 0) return "";
  const baseAboutId = `${BASE_URL}#guide-tags-${lang}`;
  const aboutId = opts.tag ? `${BASE_URL}#guide-tag-${opts.tag}-${lang}` : baseAboutId;

  return JSON.stringify({
    "@context": SCHEMA_CONTEXT,
    "@type": "CollectionPage",
    inLanguage: lang,
    url: pageUrl,
    name,
    ...(description ? { description } : {}),
    ...(opts.includeAbout ? { about: { "@id": aboutId } } : {}),
    isPartOf: { "@id": `${BASE_URL}#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: item.url,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
      })),
    },
  });
}

function GuidesTagsStructuredData({
  pageUrl,
  name,
  description,
  items,
  tag,
}: GuidesTagsStructuredDataProps): JSX.Element | null {
  const lang = useCurrentLanguage();

  const dictionary = buildTagDictionary([lang]);
  const definedTermJson = buildDefinedTermSetJson(dictionary, lang, tag);
  const hasDefinedTerms = definedTermJson.length > 0;
  const collectionJson = buildCollectionJson(lang, pageUrl, name, description, items, {
    includeAbout: hasDefinedTerms,
    ...(tag ? { tag } : {}),
  });

  if (!definedTermJson && !collectionJson) {
    return null;
  }

  return (
    <>
      {definedTermJson ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: definedTermJson }}
        />
      ) : null}
      {collectionJson ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: collectionJson }}
        />
      ) : null}
    </>
  );
}

export default memo(GuidesTagsStructuredData);
