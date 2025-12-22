// src/routes/guides/luggage-storage-positano.content.ts
import type { TFunction } from "i18next";

import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { resolveLuggageStorageString } from "./luggage-storage-positano.strings";

type TocEntry = { href: string; label: string };

type Section = { id: string; title: string; body: string[] };

type Faq = { q: string; a: string[] };

export interface LuggageStorageContent {
  intro: string[];
  toc: TocEntry[];
  sections: Section[];
  faqs: Faq[];
  onThisPageLabel: string;
  faqsHeading: string;
  serviceType: string;
  areaServed: string;
  heroAlt: string;
}

interface BuildContentOptions {
  translator: TFunction<"guides">;
  englishTranslator: TFunction<"guides">;
}

const safeString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
};

const normaliseStringArray = (value: unknown): string[] => {
  if (typeof value === "string" || Array.isArray(value)) {
    return ensureStringArray(value);
  }
  return [];
};

const normaliseToc = (value: unknown): TocEntry[] => {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry) => {
      const href = safeString(entry["href"]);
      const label = safeString(entry["label"]);
      if (!href || !label) return null;
      return { href, label } satisfies TocEntry;
    })
    .filter((item): item is TocEntry => item != null);
};

const normaliseSections = (value: unknown): Section[] => {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry, index) => {
      const title = safeString(entry["title"]);
      const idRaw = safeString(entry["id"]);
      const id = idRaw || (title ? title.replace(/\s+/g, "-").toLowerCase() : `section-${index}`);

      const bodyCandidates = Array.isArray(entry["body"])
        ? entry["body"]
        : entry["body"] != null
          ? [entry["body"]]
          : [];
      const body = bodyCandidates
        .map((paragraph) => {
          const text = String(paragraph ?? "").trim();
          return text.length > 0 ? text : null;
        })
        .filter((paragraph): paragraph is string => paragraph != null);

      if (!title || body.length === 0) return null;
      return { id, title: title || `Section ${index + 1}`, body } satisfies Section;
    })
    .filter((section): section is Section => section != null);
};

const normaliseFaqs = (value: unknown): Faq[] => {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry) => {
      const q = safeString(entry["q"]);
      const a = ensureStringArray(entry["a"])
        .map((ans) => safeString(ans))
        .filter((ans) => ans.length > 0);
      if (!q || a.length === 0) return null;
      return { q, a } satisfies Faq;
    })
    .filter((faq): faq is Faq => faq != null);
};

export function buildLuggageStorageContent({
  translator,
  englishTranslator,
}: BuildContentOptions): LuggageStorageContent {
  const intro = normaliseStringArray(
    translator("content.luggageStorage.intro", { returnObjects: true }) as unknown,
  );
  const sections = normaliseSections(
    translator("content.luggageStorage.sections", { returnObjects: true }) as unknown,
  );
  const tocEntries = normaliseToc(
    translator("content.luggageStorage.toc", { returnObjects: true }) as unknown,
  );
  const toc =
    tocEntries.length > 0
      ? tocEntries
      : sections.length > 0
        ? sections.map((section) => ({ href: `#${section.id}`, label: section.title }))
        : [];
  const faqs = normaliseFaqs(translator("content.luggageStorage.faqs", { returnObjects: true }) as unknown);

  const englishOnThisPage = englishTranslator("labels.onThisPage") as string;
  const navLabelRaw = translator("labels.onThisPage") as string;
  const onThisPageLabel =
    typeof navLabelRaw === "string" && navLabelRaw.trim().length > 0 && navLabelRaw !== "labels.onThisPage"
      ? navLabelRaw
      : englishOnThisPage;

  const englishFaqsHeading = englishTranslator("labels.faqsHeading") as string;
  const faqsTitleRaw = translator("content.luggageStorage.faqsTitle") as string;
  const fallbackFaqsRaw = translator("labels.faqsHeading") as string;
  const fallbackFaqsHeading =
    typeof fallbackFaqsRaw === "string" && fallbackFaqsRaw.trim().length > 0 && fallbackFaqsRaw !== "labels.faqsHeading"
      ? fallbackFaqsRaw
      : englishFaqsHeading;

  const faqsHeading =
    typeof faqsTitleRaw === "string" && faqsTitleRaw.trim().length > 0 && faqsTitleRaw !== "content.luggageStorage.faqsTitle"
      ? faqsTitleRaw
      : fallbackFaqsHeading;

  const serviceType =
    resolveLuggageStorageString(
      translator("content.luggageStorage.serviceType"),
      "content.luggageStorage.serviceType",
      englishTranslator("content.luggageStorage.serviceType"),
      englishTranslator("content.luggageStorage.serviceType") as string,
    ) ?? (englishTranslator("content.luggageStorage.serviceType") as string);

  const areaServed =
    resolveLuggageStorageString(
      translator("content.luggageStorage.areaServed"),
      "content.luggageStorage.areaServed",
      englishTranslator("content.luggageStorage.areaServed"),
      englishTranslator("content.luggageStorage.areaServed") as string,
    ) ?? (englishTranslator("content.luggageStorage.areaServed") as string);

  const heroAlt =
    resolveLuggageStorageString(
      translator("content.luggageStorage.heroAlt"),
      "content.luggageStorage.heroAlt",
      englishTranslator("content.luggageStorage.heroAlt"),
      englishTranslator("content.luggageStorage.heroAlt") as string,
    ) ?? (englishTranslator("content.luggageStorage.heroAlt") as string);

  return {
    intro,
    toc,
    sections,
    faqs,
    onThisPageLabel,
    faqsHeading,
    serviceType,
    areaServed,
    heroAlt,
  };
}
