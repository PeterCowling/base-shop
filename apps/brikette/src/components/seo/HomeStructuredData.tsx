// src/components/seo/HomeStructuredData.tsx
/* ─────────────────────────────────────────────────────────────
   JSON-LD for the landing page
---------------------------------------------------------------- */
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildHomeGraph } from "@/utils/schema";
import { memo, useMemo } from "react";

function HomeStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}`;
  const homeGraphString = useMemo(
    () => JSON.stringify(buildHomeGraph(pageUrl, lang)),
    [pageUrl, lang]
  );
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: homeGraphString }}
    />
  );
}

export default memo(HomeStructuredData);
