// src/routes/assistance/_ArticleFactory/types.ts
import type { AppLanguage } from "@/i18n.config";

export type MetaKey = "meta.title" | "meta.description";

export interface AssistanceArticleLoaderData {
  lang: AppLanguage;
  title: string;
  description: string;
}

