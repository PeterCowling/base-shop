// apps/brikette/src/components/guides/generic-content/label-utils.ts
// Utility functions for resolving guide labels and headings

import type { TFunction } from "i18next";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { logError } from "@/utils/errors";

import type { GenericContentTranslator } from "./types";

const FAQS_HEADING_KEY = "labels.faqsHeading" as const;
const FAQS_HEADING_FALLBACK_LANG = "en" as AppLanguage;

export function normalizeLabelCandidate(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === FAQS_HEADING_KEY) {
    return "";
  }
  return trimmed;
}

export function getGuidesLabel(lang: string | undefined, key: string): string {
  if (!lang) {
    return "";
  }
  try {
    const fixed = i18n.getFixedT?.(lang, "guides");
    if (typeof fixed !== "function") {
      return "";
    }
    return normalizeLabelCandidate((fixed as TFunction)(key));
  } catch (error) {
    logError(error, {
      scope: "label-utils",
      event: "getGuidesLabelFailed",
      metadata: { lang, key },
    });
    return "";
  }
}

export function resolveFaqsHeadingLabel(
  lang: AppLanguage,
  translator: GenericContentTranslator
): string {
  try {
    const direct = normalizeLabelCandidate(translator(FAQS_HEADING_KEY) as unknown);
    if (direct) {
      return direct;
    }
  } catch (error) {
    logError(error, {
      scope: "label-utils",
      event: "resolveFaqsHeadingDirectFailed",
      metadata: { lang },
    });
  }
  const localized = getGuidesLabel(lang, FAQS_HEADING_KEY);
  if (localized) {
    return localized;
  }
  const fallback = getGuidesLabel(FAQS_HEADING_FALLBACK_LANG, FAQS_HEADING_KEY);
  if (fallback) {
    return fallback;
  }
  return FAQS_HEADING_KEY;
}

export function resolveSectionFallbackLabel(
  lang: AppLanguage,
  translator: GenericContentTranslator,
  position: number
): string {
  const fallback = `Section ${position}`;
  try {
    const raw = translator("labels.sectionFallback", {
      position,
      defaultValue: fallback,
    }) as unknown;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text && text !== "labels.sectionFallback") return text;
  } catch (error) {
    logError(error, {
      scope: "label-utils",
      event: "sectionFallbackLabelFailed",
      metadata: { position },
    });
  }

  try {
    const fixed = i18n.getFixedT?.(lang, "guides");
    const raw =
      typeof fixed === "function"
        ? (fixed("labels.sectionFallback", { position, defaultValue: fallback }) as unknown)
        : undefined;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text && text !== "labels.sectionFallback") return text;
  } catch (error) {
    logError(error, {
      scope: "label-utils",
      event: "sectionFallbackFixedTFailed",
      metadata: { position, lang },
    });
  }

  return fallback;
}
