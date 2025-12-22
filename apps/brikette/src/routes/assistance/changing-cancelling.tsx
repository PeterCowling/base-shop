// src/routes/assistance/changing-cancelling.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("changingCancelling");
export { clientLoader as loader };

export default makeArticlePage("changingCancelling");
export const meta = makeArticleMeta("changingCancelling");
export const links = makeArticleLinks("changingCancelling");
