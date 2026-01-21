// src/routes/assistance/defects-damages.tsx
import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";

export const clientLoader = makeArticleClientLoader("defectsDamages");
export { clientLoader as loader };

export default makeArticlePage("defectsDamages");
export const meta = makeArticleMeta("defectsDamages");
export const links = makeArticleLinks("defectsDamages");
