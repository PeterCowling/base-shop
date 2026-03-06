// src/components/seo/PrivateAccomStructuredDataRsc.tsx
// Server-rendered JSON-LD for the private accommodation booking page.
// Emits Apartment + BreadcrumbList schemas in the initial HTML response.
import "server-only";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import apartment from "@/schema/apartment";
import { buildBreadcrumbList, serializeJsonLdValue } from "@/utils/seo/jsonld";
import { getSlug } from "@/utils/slug";

interface Props {
  lang: AppLanguage;
  slug: string;
}

export default function PrivateAccomStructuredDataRsc({ lang, slug }: Props): JSX.Element {
  const pageUrl = `${BASE_URL}/${lang}/${slug}`;

  const breadcrumb = buildBreadcrumbList({
    lang,
    items: [
      { name: "Hostel Brikette", item: `${BASE_URL}/${lang}` },
      { name: "Private Rooms", item: `${BASE_URL}/${lang}/${getSlug("apartment", lang)}` },
      { name: "Book", item: pageUrl },
    ],
  });

  const graph = [apartment, ...(breadcrumb ? [breadcrumb] : [])];

  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@graph": graph,
  });

  if (!json) return <></>;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
