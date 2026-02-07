/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/types/loaderSchemas.ts

import { z } from "zod";

import { ASSISTANCE_GUIDE_KEYS } from "@/data/assistanceGuideKeys";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import enTranslation from "@/locales/en/translation.json";
import { guideSlug } from "@/routes.guides-helpers";

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

// Derive all assistance slugs by iterating languages × guide keys
const assistanceSlugValues = Array.from(
  new Set(
    supportedLanguages.flatMap((lang) =>
      ASSISTANCE_GUIDE_KEYS.map((key) => guideSlug(lang as AppLanguage, key)),
    ),
  ),
);

const assistanceSlugInvariantMessage =
  typeof enTranslation.internalErrors?.assistanceSlugMissing === "string"
    ? enTranslation.internalErrors.assistanceSlugMissing
    : "Assistance guide slugs are missing — check ASSISTANCE_GUIDE_KEYS";

if (assistanceSlugValues.length === 0) {
  throw new Error(assistanceSlugInvariantMessage);
}

export const assistanceSlugSchema = z.object({
  slug: z.enum(assistanceSlugValues as [string, ...string[]]),
});

export type LangParams = z.infer<typeof langParamSchema>;
export type AssistanceSlugParams = z.infer<typeof assistanceSlugSchema>;
