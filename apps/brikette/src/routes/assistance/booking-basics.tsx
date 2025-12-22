// src/routes/assistance/booking-basics.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("bookingBasics");
export { clientLoader as loader };

export default makeArticlePage("bookingBasics");
export const meta = makeArticleMeta("bookingBasics");
export const links = makeArticleLinks("bookingBasics");
