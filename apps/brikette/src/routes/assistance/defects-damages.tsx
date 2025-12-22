// src/routes/assistance/defects-damages.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("defectsDamages");
export { clientLoader as loader };

export default makeArticlePage("defectsDamages");
export const meta = makeArticleMeta("defectsDamages");
export const links = makeArticleLinks("defectsDamages");
