// src/components/seo/PrivateAccomStructuredDataRsc.tsx
// Server-rendered JSON-LD for the private accommodation chooser page.
// Emits CollectionPage + ItemList + BreadcrumbList so the page describes the
// chooser itself instead of incorrectly masquerading as one apartment listing.
import "server-only";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { WEBSITE_ID } from "@/utils/schema/types";
import { buildBreadcrumbList, serializeJsonLdValue } from "@/utils/seo/jsonld";

interface PrivateAccommodationOption {
  name: string;
  url: string;
}

interface Props {
  lang: AppLanguage;
  pageTitle: string;
  pageUrl: string;
  options: readonly PrivateAccommodationOption[];
}

export default function PrivateAccomStructuredDataRsc({
  lang,
  pageTitle,
  pageUrl,
  options,
}: Props): JSX.Element | null {
  const breadcrumb = buildBreadcrumbList({
    lang,
    items: [
      { name: "Hostel Brikette", item: `${BASE_URL}/${lang}` },
      { name: pageTitle, item: pageUrl },
    ],
  });

  const itemList = {
    "@type": "ItemList",
    "@id": `${pageUrl}#options`,
    inLanguage: lang,
    itemListElement: options.map((option, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: option.name,
      url: option.url,
    })),
  };

  const page = {
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: pageTitle,
    inLanguage: lang,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": `${pageUrl}#options` },
  };

  const graph = [page, itemList, ...(breadcrumb ? [breadcrumb] : [])];
  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@graph": graph,
  });

  if (!json) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
