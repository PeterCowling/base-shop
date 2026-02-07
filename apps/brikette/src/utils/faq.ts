/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/utils/faq.ts
// -----------------------------------------------------------------------------
// Helpers for working with FAQ translations across runtimes.
// -----------------------------------------------------------------------------

import { isSupportedLanguage } from "@/config";
import { i18nConfig } from "@/i18n.config";
import type { FAQEntry, LanguageCode, LocalizedString } from "@/types/machine-layer/ml";

export interface FaqResourceItem {
  id?: string;
  question?: string;
  answer?: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

export interface FaqResource {
  items?: FaqResourceItem[];
}

export interface LocalisedFaqItem {
  id: string;
  question: string;
  answer: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

export type FaqResourceImporter = (lang: string) => Promise<FaqResource | undefined>;

const normalise = (value?: string): string => value?.trim() ?? "";

const pickResource = (
  primary?: FaqResource | null,
  fallback?: FaqResource | null,
): FaqResource | undefined => {
  if (primary?.items?.length) return primary;
  if (fallback?.items?.length) return fallback;
  return undefined;
};

const findItemById = (resource: FaqResource | undefined, id: string): FaqResourceItem | undefined =>
  resource?.items?.find((item) => item?.id === id);

export const parseFaqResource = (
  primary?: FaqResource | null,
  fallback?: FaqResource | null,
): LocalisedFaqItem[] => {
  const resource = pickResource(primary, fallback);
  if (!resource?.items) return [];

  return resource.items.reduce<LocalisedFaqItem[]>((acc, item, index) => {
    const id = normalise(item.id) || `faq-${index + 1}`;
    const question = normalise(item.question);
    const answer = normalise(item.answer);

    if (!question || !answer) return acc;

    const sourceUrl = normalise(item.sourceUrl);
    const sourceLabel = normalise(item.sourceLabel);
    acc.push({
      id,
      question,
      answer,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(sourceLabel ? { sourceLabel } : {}),
    });
    return acc;
  }, []);
};

const importFaqResource = async (lang: string): Promise<FaqResource | undefined> => {
  try {
    const faqModule = await import(`../locales/${lang}/faq.json`);
    return faqModule.default as FaqResource;
  } catch (err) {
    if (process.env.NODE_ENV === "development") console.warn(`⚠️  Missing FAQ resource for ${lang}:`, err);
    return undefined;
  }
};

const isLanguageCode = (lang: string): lang is LanguageCode => isSupportedLanguage(lang);

export const loadFaqEntries = async (
  importer: FaqResourceImporter = importFaqResource,
): Promise<FAQEntry[]> => {
  const languages = [...i18nConfig.supportedLngs];
  const resources = await Promise.all(
    languages.map(async (lang) => ({ lang, resource: await importer(lang) })),
  );

  const english = resources.find((entry) => entry.lang === "en")?.resource;
  if (!english?.items?.length) throw new Error("English FAQ translations are required");

  const machineLayerResources = resources.filter((entry): entry is { lang: LanguageCode; resource: FaqResource | undefined } =>
    isLanguageCode(entry.lang),
  );

  return english.items.map((item, index) => {
    const id = normalise(item.id) || `faq-${index + 1}`;
    const q: Partial<Record<LanguageCode, string>> = {};
    const a: Partial<Record<LanguageCode, string>> = {};

    for (const { lang, resource } of machineLayerResources) {
      const match = findItemById(resource, id);
      const fallbackQuestion = normalise(item.question);
      const fallbackAnswer = normalise(item.answer);
      q[lang] = normalise(match?.question) || fallbackQuestion;
      a[lang] = normalise(match?.answer) || fallbackAnswer;
    }

    return { id, q: q as LocalizedString, a: a as LocalizedString } satisfies FAQEntry;
  });
};
