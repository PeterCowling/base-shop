import appI18n from "@/i18n";

import { safeString } from "./how-to-reach-positano-on-a-budget.normalisers";

export type BasicTranslator = (key: string, options?: Record<string, unknown>) => unknown;

const FALLBACK_TRANSLATOR: BasicTranslator = (key, options) => {
  if (options && typeof options === "object") {
    const { defaultValue } = options as { defaultValue?: unknown };
    if (typeof defaultValue === "string") {
      return safeString(defaultValue, key);
    }
  }

  return key;
};

function ensureTranslator(candidate: unknown): BasicTranslator {
  if (typeof candidate === "function") {
    return (key, options) =>
      (candidate as (key: string, options?: Record<string, unknown>) => unknown)(key, options);
  }

  return FALLBACK_TRANSLATOR;
}

export function getGuidesTranslator(locale: string): BasicTranslator {
  return ensureTranslator(appI18n.getFixedT(locale, "guides"));
}

export function getHeaderTranslator(locale: string): BasicTranslator {
  return ensureTranslator(appI18n.getFixedT(locale, "header"));
}

export function resolveTranslatorString(
  translator: BasicTranslator,
  fallback: BasicTranslator,
  key: string,
  defaultValue: string,
): string {
  const primary = translator(key);
  if (typeof primary === "string") {
    const trimmed = primary.trim();
    if (trimmed.length > 0 && trimmed !== key) {
      return trimmed;
    }
  }

  const fallbackKeys: readonly string[] =
    key === "labels.homeBreadcrumb" ? [key, "labels.guidesBreadcrumb"] : [key];

  for (const candidateKey of fallbackKeys) {
    const fallbackValue = fallback(candidateKey);
    if (typeof fallbackValue === "string") {
      const trimmed = fallbackValue.trim();
      if (trimmed.length > 0 && trimmed !== candidateKey) {
        return trimmed;
      }
    }
  }

  return safeString(defaultValue, defaultValue);
}
