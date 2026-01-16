// src/types/loaderSchemas.ts

import { ARTICLE_SLUGS } from "@/article-slug-map";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { z } from "zod";
import enTranslation from "@/locales/en/translation.json";

const supportedLanguages = Array.isArray(i18nConfig.supportedLngs) ? i18nConfig.supportedLngs : [];
if (supportedLanguages.length === 0) {
  throw new Error("i18nConfig.supportedLngs must include at least one language");
}
const supportedLanguageTuple = [supportedLanguages[0], ...supportedLanguages.slice(1)] as [
  AppLanguage,
  ...AppLanguage[]
];

export const langParamSchema = z.object({
  lang: z.enum(supportedLanguageTuple),
});

const assistanceSlugValues = Array.from(
  new Set(
    Object.values(ARTICLE_SLUGS).flatMap((dict) => Object.values(dict)),
  ),
);

const assistanceSlugInvariantMessage =
  typeof enTranslation.internalErrors?.assistanceSlugMissing === "string"
    ? enTranslation.internalErrors.assistanceSlugMissing
    : "internalErrors.assistanceSlugMissing";

if (assistanceSlugValues.length === 0) {
  throw new Error(assistanceSlugInvariantMessage);
}

export const assistanceSlugSchema = z.object({
  slug: z.enum(assistanceSlugValues as [string, ...string[]]),
});

export type LangParams = z.infer<typeof langParamSchema>;
export type AssistanceSlugParams = z.infer<typeof assistanceSlugSchema>;
