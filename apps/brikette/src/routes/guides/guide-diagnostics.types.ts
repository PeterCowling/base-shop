import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import type { SeoAuditResult } from "@/routes/guides/guide-manifest-overrides";

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
  guideKey: GuideKey;
  totalLocales: number;
  locales: TranslationCoverageLocale[];
  completeLocales: AppLanguage[];
  missingLocales: AppLanguage[];
};

export type GuideDiagnosticResult = {
  guideKey: GuideKey;
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
