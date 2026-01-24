/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/HomeStructuredData.tsx
/* ─────────────────────────────────────────────────────────────
   JSON-LD for the landing page
---------------------------------------------------------------- */
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildHomeGraph } from "@/utils/schema";

function HomeStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}`;
  const homeGraphString = JSON.stringify(buildHomeGraph(pageUrl, lang));
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: homeGraphString }}
    />
  );
}

export default memo(HomeStructuredData);
