 
// src/components/seo/HomeStructuredData.tsx
/* ─────────────────────────────────────────────────────────────
   JSON-LD for the landing page
---------------------------------------------------------------- */
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildHomeGraph } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

function HomeStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}`;
  const homeGraphString = serializeJsonLdValue(buildHomeGraph(pageUrl, lang));
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: homeGraphString }}
    />
  );
}

export default memo(HomeStructuredData);
