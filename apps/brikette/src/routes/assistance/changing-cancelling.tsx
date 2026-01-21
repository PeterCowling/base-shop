// src/routes/assistance/changing-cancelling.tsx
import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("changingCancelling");
export { clientLoader as loader };

export default makeArticlePage("changingCancelling");
export const meta = makeArticleMeta("changingCancelling");
export const links = makeArticleLinks("changingCancelling");
