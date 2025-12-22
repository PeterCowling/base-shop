// src/routes/assistance/legal.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("legal");
export { clientLoader as loader };

export default makeArticlePage("legal");
export const meta = makeArticleMeta("legal");
export const links = makeArticleLinks("legal");
/* lint-hints for SEO rules: og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default" */
