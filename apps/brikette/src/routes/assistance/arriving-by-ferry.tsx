// src/routes/assistance/arriving-by-ferry.tsx
import AssistanceFaqJsonLd from "@/components/seo/AssistanceFaqJsonLd";

import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";

// i18n-exempt -- I18N-TECHDEBT [ttl=2026-12-31] Assistance article identifier used for content lookups; UI copy lives in locale bundles
const ARTICLE_KEY = "arrivingByFerry" as const;

export const clientLoader = makeArticleClientLoader(ARTICLE_KEY);
export { clientLoader as loader };

export default makeArticlePage(ARTICLE_KEY, {
  // i18n-exempt -- I18N-TECHDEBT [ttl=2026-12-31]
  additionalScripts: <AssistanceFaqJsonLd ns={ARTICLE_KEY} />,
  // Guide identifiers used for content lookups; display copy comes from localisation bundles
  relatedGuides: {
    items: [
      { key: "ferrySchedules" }, // i18n-exempt -- I18N-TECHDEBT [ttl=2026-12-31]
      { key: "reachBudget" }, // i18n-exempt -- I18N-TECHDEBT [ttl=2026-12-31]
    ],
  },
});
export const meta = makeArticleMeta(ARTICLE_KEY);
export const links = makeArticleLinks(ARTICLE_KEY);
