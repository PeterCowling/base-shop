// src/routes/assistance/security.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("security");
export { clientLoader as loader };

export default makeArticlePage("security", {
  relatedGuides: {
    items: [{ key: "reachBudget" }, { key: "ferrySchedules" }, { key: "pathOfTheGods" }],
  },
  alsoSeeGuides: {
    listLayout: "twoColumn",
    items: [{ key: "backpackerItineraries" }, { key: "onlyHostel" }],
  },
  suppressDefaultAlsoSee: true,
});
export const meta = makeArticleMeta("security");
export const links = makeArticleLinks("security");
/* lint-hints for SEO rules: og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default" */
