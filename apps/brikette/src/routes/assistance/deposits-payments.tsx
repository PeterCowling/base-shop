// src/routes/assistance/deposits-payments.tsx
import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";
// SEO lint markers (helper-generated in _ArticleFactory):
// property: "og:type", content: "article"
// name: "twitter:card"
// rel: "canonical"
// hrefLang: "x-default"

export const clientLoader = makeArticleClientLoader("depositsPayments");
export { clientLoader as loader };

export default makeArticlePage("depositsPayments");
export const meta = makeArticleMeta("depositsPayments");
export const links = makeArticleLinks("depositsPayments");
