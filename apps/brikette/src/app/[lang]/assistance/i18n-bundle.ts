import type { AppLanguage } from "@/i18n.config";

export const ASSISTANCE_INDEX_SEEDED_NAMESPACES = [
  "assistanceSection",
  "assistance",
  "howToGetHere",
  "faq",
] as const;

export type AssistanceSeedNamespace = (typeof ASSISTANCE_INDEX_SEEDED_NAMESPACES)[number];

export type AssistanceNamespaceBundleMap = Partial<
  Record<AssistanceSeedNamespace, Record<string, unknown>>
>;

export type AssistanceIndexI18nSeed = {
  lang: AppLanguage;
  namespaces?: AssistanceNamespaceBundleMap;
  namespacesEn?: AssistanceNamespaceBundleMap;
  guides?: Record<string, unknown>;
  guidesEn?: Record<string, unknown>;
};
