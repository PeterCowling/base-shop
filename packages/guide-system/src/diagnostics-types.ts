/**
 * Guide diagnostic result types.
 *
 * Extracted from apps/brikette/src/routes/guides/guide-diagnostics.types.ts
 */
import type { AppLanguage } from "./languages";
import type { SeoAuditResult } from "./manifest-overrides";

export type GuideFieldStatus = {
  intro: boolean;
  sections: boolean;
  faqs: boolean;
  seo: boolean;
};

export type SeoFieldStatus = {
  title: boolean;
  description: boolean;
};

export type TranslationCoverageLocale = {
  locale: AppLanguage;
  fields: GuideFieldStatus;
  missing: Array<keyof GuideFieldStatus>;
  complete: boolean;
};

export type TranslationCoverageResult = {
  guideKey: string;
  totalLocales: number;
  locales: TranslationCoverageLocale[];
  completeLocales: AppLanguage[];
  missingLocales: AppLanguage[];
};

export type GuideDiagnosticResult = {
  guideKey: string;
  lang: AppLanguage;
  fields: GuideFieldStatus;
  seoFields: SeoFieldStatus;
  faqCount: number;
};

export type DateValidationResult = {
  hasEnglishDate: boolean;
  englishDate?: string;
  localesWithDate: AppLanguage[];
  localesMissingDate: AppLanguage[];
};

export type GuideChecklistDiagnostics = {
  translations?: TranslationCoverageResult;
  content?: {
    intro: boolean;
    sections: boolean;
  };
  faqs?: {
    count: number;
    hasFaqs: boolean;
  };
  seo?: SeoFieldStatus;
  seoAudit?: SeoAuditResult;
  dateValidation?: DateValidationResult;
};
