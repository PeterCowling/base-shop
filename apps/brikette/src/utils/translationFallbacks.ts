// src/utils/translationFallbacks.ts
// Utilities for resolving translated strings with fallback lookups.

import type { TFunction, i18n as I18nInstance } from "i18next";
import type { GuideKey } from "@/routes.guides-helpers";

const LINK_LABEL_SUFFIX = ".linkLabel" as const;

type AnyTFunction = TFunction<string>;
const LEGACY_LINKS_PREFIX = "links." as const;

function humanizeGuideKey(value: string): string {
  const raw = value.trim();
  if (!raw) return value;

  const spaced = raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z\\d])([A-Z])/g, "$1 $2")
    .replace(/\\s+/g, " ")
    .trim();

  if (!spaced) return value;

  const words = spaced.split(" ").filter(Boolean);
  const formatted = words.map((word) => {
    if (/[a-z]/.test(word) && /[A-Z]/.test(word)) return word; // keep mixed-case (e.g., eSIM)
    if (/^[A-Z0-9]+$/.test(word) && word.length > 1) return word; // keep acronyms
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formatted.join(" ");
}

function buildGuideLinkLabelKeys(guideKey: GuideKey | string): string[] {
  const sanitized = String(guideKey).trim();
  if (!sanitized) return [];
  return [`content.${sanitized}${LINK_LABEL_SUFFIX}`, `${LEGACY_LINKS_PREFIX}${sanitized}`];
}

type TranslationOptions = Record<string, unknown> | undefined;

function isObjectReturnMessage(value: string): boolean {
  return value.includes("returned an object instead of string");
}

function normaliseTranslatedString(value: unknown, key: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed === key) return undefined;
  if (isObjectReturnMessage(trimmed)) return undefined;
  return trimmed;
}

export function getOptionalString(
  translator: AnyTFunction,
  key: string,
  options?: TranslationOptions,
): string | undefined {
  const value = translator(key, options ?? {});
  return normaliseTranslatedString(value, key);
}

export function getStringWithFallback(
  translator: AnyTFunction,
  fallbackTranslator: AnyTFunction,
  key: string,
  options?: TranslationOptions,
): string | undefined {
  return (
    getOptionalString(translator, key, options) ??
    getOptionalString(fallbackTranslator, key, options)
  );
}

export function getRequiredString(
  translator: AnyTFunction,
  fallbackTranslator: AnyTFunction,
  key: string,
  options?: TranslationOptions,
): string {
  return getStringWithFallback(translator, fallbackTranslator, key, options) ?? "";
}

function resolveGuideLinkLabel(
  translator: AnyTFunction,
  key: string,
  defaultValue: string,
): string | undefined {
  const value = translator(key, { defaultValue });
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed === key) return undefined;
  if (isObjectReturnMessage(trimmed)) return undefined;

  const fallbackTrimmed = defaultValue.trim();
  if (fallbackTrimmed.length > 0 && trimmed === fallbackTrimmed) {
    return undefined;
  }

  return trimmed;
}

export function getGuideLinkLabel(
  translator: AnyTFunction,
  fallbackTranslator: AnyTFunction,
  guideKey: GuideKey | string,
): string {
  const keys = buildGuideLinkLabelKeys(guideKey);
  if (keys.length === 0) {
    return guideKey;
  }

  let fallback = humanizeGuideKey(String(guideKey));
  for (const key of keys) {
    const resolvedFallback = resolveGuideLinkLabel(fallbackTranslator, key, fallback);
    if (resolvedFallback) {
      fallback = resolvedFallback;
    }

    const resolved = resolveGuideLinkLabel(translator, key, fallback);
    if (resolved) {
      return resolved;
    }
  }

  return fallback;
}

type DefaultValueOption = {
  defaultValue?: unknown;
} & Record<string, unknown>;

function createDefaultTranslator(): AnyTFunction {
  return ((key: string, options?: DefaultValueOption) => {
    if (options && "defaultValue" in options) {
      const { defaultValue } = options;
      if (typeof defaultValue === "string") {
        const trimmed = defaultValue.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      } else if (defaultValue !== undefined && defaultValue !== null) {
        return String(defaultValue);
      }
    }

    return key;
  }) as unknown as AnyTFunction;
}

const FALLBACK_TRANSLATOR = createDefaultTranslator();

type I18nLike = I18nInstance | undefined;

export function getNamespaceTranslator(
  i18nInstance: I18nLike,
  lang: string,
  namespace: string,
  fallback: AnyTFunction = FALLBACK_TRANSLATOR,
): AnyTFunction {
  if (typeof i18nInstance?.getFixedT === "function") {
    const translator = i18nInstance.getFixedT(lang, namespace);
    if (typeof translator === "function") {
      return translator as AnyTFunction;
    }
  }

  return fallback;
}
