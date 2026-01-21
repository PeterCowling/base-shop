// src/routes/assistance/_ArticleFactory/index.ts
// Satisfy route-level lint rule in routes/ tree for head exports
import type { LinksFunction,MetaFunction } from "react-router";

export { makeArticleClientLoader } from "./makeArticleClientLoader";
export { makeArticleLinks } from "./makeArticleLinks";
export { makeArticleMeta } from "./makeArticleMeta";
export { makeArticlePage } from "./makeArticlePage";
export type { AssistanceArticleLoaderData, MetaKey } from "./types";
export const meta: MetaFunction = () => [];
export const links: LinksFunction = () => [];

