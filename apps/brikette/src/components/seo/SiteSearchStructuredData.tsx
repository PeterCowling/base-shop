 
/* /src/components/seo/SiteSearchStructuredData.tsx
   Emits the SearchAction JSON‑LD that powers Google’s
   “Search Hostel Brikette” auto‑suggest box.  */
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import type { SearchActionSchema } from "@/types/seo";
import { ORG_ID, WEBSITE_ID } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

/* Keep this component *tiny* so React can memo‑skip it. */
interface Props {
  lang: AppLanguage;
}

function SiteSearchStructuredData({ lang }: Props): JSX.Element {
  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BASE_URL,
    name: "Hostel Brikette",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      // Use locale-aware browse URL
      target: `${BASE_URL}/${lang}/assistance?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    inLanguage: lang,
  } satisfies SearchActionSchema & { "@id": string; name?: string; publisher?: { "@id": string } });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(SiteSearchStructuredData);
