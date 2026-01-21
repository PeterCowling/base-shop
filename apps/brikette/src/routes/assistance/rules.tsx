// src/routes/assistance/rules.tsx
import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("rules");
export { clientLoader as loader };

export default makeArticlePage("rules");
export const meta = makeArticleMeta("rules");
export const links = makeArticleLinks("rules");
/* lint-hints for SEO rules: og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default" */
