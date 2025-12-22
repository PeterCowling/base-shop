// src/routes/assistance/checkin-checkout.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("checkinCheckout");
export { clientLoader as loader };

export default makeArticlePage("checkinCheckout");
export const meta = makeArticleMeta("checkinCheckout");
export const links = makeArticleLinks("checkinCheckout");
