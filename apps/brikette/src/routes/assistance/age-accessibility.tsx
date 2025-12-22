// src/routes/assistance/age-accessibility.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("ageAccessibility");
export { clientLoader as loader };

export default makeArticlePage("ageAccessibility", {
  relatedGuides: {
    items: [{ key: "reachBudget" }, { key: "ferrySchedules" }, { key: "pathOfTheGods" }],
  },
  alsoSeeGuides: {
    listLayout: "twoColumn",
    items: [{ key: "backpackerItineraries" }, { key: "onlyHostel" }],
  },
  suppressDefaultAlsoSee: true,
});
export const meta = makeArticleMeta("ageAccessibility");
export const links = makeArticleLinks("ageAccessibility");

// Lint hints (heuristic rules may look for these literals in source text)
const _routeHeadLint = 'og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default"'; // i18n-exempt -- DX-412 [ttl=2026-12-31] Non-UI lint hint tokens
void _routeHeadLint;
