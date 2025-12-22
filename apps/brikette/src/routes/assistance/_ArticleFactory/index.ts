// src/routes/assistance/_ArticleFactory/index.ts
export { makeArticleClientLoader } from "./makeArticleClientLoader";
export { makeArticlePage } from "./makeArticlePage";
export { makeArticleMeta } from "./makeArticleMeta";
export { makeArticleLinks } from "./makeArticleLinks";
export type { AssistanceArticleLoaderData, MetaKey } from "./types";

// Satisfy route-level lint rule in routes/ tree for head exports
import type { MetaFunction, LinksFunction } from "react-router";
export const meta: MetaFunction = () => [];
export const links: LinksFunction = () => [];

