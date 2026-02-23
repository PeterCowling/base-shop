/**
 * Home breadcrumb label resolution utilities.
 */
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

import type { Translator } from "../types";

import { toCandidate } from "./sanitizers";

type HookI18n = { getFixedT?: (lng: string, ns?: string) => TFunction };

interface HomeLabelResolverParams {
  lang: AppLanguage;
  tGuides: Translator;
  tHeader: Translator;
  tAny: Translator;
  hookI18n: HookI18n | undefined;
  englishHomeResource: unknown;
  englishHomeTranslatorValue: unknown;
}

/**
 * Build English fallback set for home label.
 */
function buildEnglishFallbacks(
  englishHomeResource: unknown,
  englishHomeTranslatorValue: unknown,
  englishHeaderNamespaceHook: unknown,
  englishHeaderNamespaceApp: unknown,
  englishHeaderKeyHook: unknown,
  englishHeaderKeyApp: unknown,
): Set<string> {
  const values = new Set<string>(["home", "header:home"]);
  const register = (candidate: unknown) => {
    if (typeof candidate !== "string") return;
    const trimmed = candidate.trim();
    if (trimmed.length === 0) return;
    values.add(trimmed.toLowerCase());
  };

  register(englishHomeResource);
  register(englishHomeTranslatorValue);
  register(englishHeaderNamespaceHook);
  register(englishHeaderNamespaceApp);
  register(englishHeaderKeyHook);
  register(englishHeaderKeyApp);

  return values;
}

/**
 * Check if any English fallback has meaningful content.
 */
function hasEnglishFallbackMeaningful(
  candidates: readonly unknown[],
  placeholderSentinels: Set<string>,
): boolean {
  return candidates.some((value) => {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.startsWith("［Stub］")) return false;
    const normalized = trimmed.toLowerCase();
    return !placeholderSentinels.has(normalized);
  });
}

type EnglishHeaderValues = {
  namespaceHook: unknown;
  namespaceApp: unknown;
  keyHook: unknown;
  keyApp: unknown;
};

function resolveEnglishHeaderValues(hookI18n: HookI18n | undefined): EnglishHeaderValues {
  const safeRead = (reader: () => unknown): unknown => {
    try {
      return reader();
    } catch {
      return undefined;
    }
  };
  return {
    namespaceHook: safeRead(() => hookI18n?.getFixedT?.("en", "header")?.("home")),
    namespaceApp: safeRead(() => i18n.getFixedT?.("en", "header")?.("home")),
    keyHook: safeRead(() => hookI18n?.getFixedT?.("en")?.("header:home")),
    keyApp: safeRead(() => i18n.getFixedT?.("en")?.("header:home")),
  };
}

function isMeaningfulEnglishHomeTranslatorValue(value: unknown, placeholders: readonly string[]): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.startsWith("［Stub］")) return false;
  const normalized = trimmed.toLowerCase();
  return !placeholders.some((placeholder) => normalized === placeholder.toLowerCase());
}

function collectEnglishHomeCandidates(
  englishHomeTranslatorValue: unknown,
  englishHomeResource: unknown,
  englishHeaders: EnglishHeaderValues,
): string[] {
  const candidates: string[] = [];
  const register = (value: unknown) => {
    if (typeof value === "string") candidates.push(value);
  };
  register(englishHomeTranslatorValue);
  register(englishHomeResource);
  register(englishHeaders.namespaceHook);
  register(englishHeaders.namespaceApp);
  register(englishHeaders.keyHook);
  register(englishHeaders.keyApp);
  return candidates;
}

function resolveHomeFromEnglishCandidates(params: {
  candidates: string[];
  primaryKey: string;
  allowEnglishFallback: boolean;
  englishFallbacks: Set<string>;
}): string | undefined {
  const { candidates, primaryKey, allowEnglishFallback, englishFallbacks } = params;
  for (const candidate of candidates) {
    if (candidate === primaryKey) continue;
    const trimmed = candidate.trim();
    if (trimmed.length === 0) return "";
    if (trimmed.startsWith("［Stub］")) continue;
    const normalized = trimmed.toLowerCase();
    if (!allowEnglishFallback && englishFallbacks.has(normalized)) continue;
    if (normalized === "header:home") continue;
    if (normalized === "home") {
      if (allowEnglishFallback && trimmed === "Home") return trimmed;
      continue;
    }
    if (allowEnglishFallback || !englishFallbacks.has(normalized)) return trimmed;
  }
  return undefined;
}

type HomeEnglishResolutionContext = {
  englishHeaders: EnglishHeaderValues;
  englishFallbacks: Set<string>;
  allowEnglishFallback: boolean;
};

function buildHomeEnglishResolutionContext(params: {
  lang: AppLanguage;
  hookI18n: HookI18n | undefined;
  englishHomeResource: unknown;
  englishHomeTranslatorValue: unknown;
  primaryKey: string;
  altKey: string;
}): HomeEnglishResolutionContext {
  const { lang, hookI18n, englishHomeResource, englishHomeTranslatorValue, primaryKey, altKey } = params;
  const englishHeaders = resolveEnglishHeaderValues(hookI18n);
  const englishFallbacks = buildEnglishFallbacks(
    englishHomeResource,
    englishHomeTranslatorValue,
    englishHeaders.namespaceHook,
    englishHeaders.namespaceApp,
    englishHeaders.keyHook,
    englishHeaders.keyApp,
  );
  const englishPlaceholderSentinels = new Set<string>([
    primaryKey.toLowerCase(),
    altKey.toLowerCase(),
    "home",
    "header:home",
  ]);
  const englishFallbackHasMeaningful = hasEnglishFallbackMeaningful(
    [
      englishHomeResource,
      englishHomeTranslatorValue,
      englishHeaders.namespaceHook,
      englishHeaders.namespaceApp,
      englishHeaders.keyHook,
      englishHeaders.keyApp,
    ],
    englishPlaceholderSentinels,
  );
  const englishTranslatorMeaningful = isMeaningfulEnglishHomeTranslatorValue(
    englishHomeTranslatorValue,
    [primaryKey, altKey, "header:home"],
  );
  return {
    englishHeaders,
    englishFallbacks,
    allowEnglishFallback: lang === "en" || englishTranslatorMeaningful || englishFallbackHasMeaningful,
  };
}

/**
 * Resolve the home breadcrumb label.
 */
export function resolveHomeLabel({
  lang,
  tGuides,
  tHeader,
  tAny,
  hookI18n,
  englishHomeResource,
  englishHomeTranslatorValue,
}: HomeLabelResolverParams): string {
  const primaryKey = "labels.homeBreadcrumb" as const;
  const altKey = "breadcrumbs.home" as const;
  const { englishHeaders, englishFallbacks, allowEnglishFallback } = buildHomeEnglishResolutionContext({
    lang,
    hookI18n,
    englishHomeResource,
    englishHomeTranslatorValue,
    primaryKey,
    altKey,
  });

  // Check for empty English resources
  const englishTranslatorMissing = typeof englishHomeTranslatorValue !== "string";
  const englishResourceBlank =
    typeof englishHomeResource === "string" && (englishHomeResource as string).trim().length === 0;
  if (englishTranslatorMissing && englishResourceBlank) return primaryKey;

  const localeChecks = [
    { raw: tGuides(primaryKey) as unknown, key: primaryKey, disallowed: [] as string[], blankReturnsEmpty: false },
    { raw: tGuides(altKey) as unknown, key: altKey, disallowed: [] as string[], blankReturnsEmpty: false },
    { raw: tHeader("home") as unknown, key: "home", disallowed: ["header:home"], blankReturnsEmpty: true },
    { raw: tAny("header:home") as unknown, key: "header:home", disallowed: ["home"], blankReturnsEmpty: true },
  ];
  for (const localeCheck of localeChecks) {
    const candidate = toCandidate(localeCheck.raw, localeCheck.key, {
      ...(localeCheck.disallowed.length > 0 ? { disallowed: localeCheck.disallowed } : {}),
      allowEnglishFallback,
      englishFallbacks,
    });
    if (candidate !== null) return candidate;
    if (localeCheck.blankReturnsEmpty && typeof localeCheck.raw === "string" && localeCheck.raw.trim().length === 0) {
      return "";
    }
  }

  // Check for placeholder strings in locale
  const placeholderByKey = new Map<string, string>([
    [primaryKey, primaryKey],
    [altKey, altKey],
    ["home", "home"],
    ["header:home", "header:home"],
  ]);
  const localeProvidedPlaceholder = localeChecks.some((localeCheck) => {
    if (typeof localeCheck.raw !== "string") return false;
    const placeholder = placeholderByKey.get(localeCheck.key);
    return typeof placeholder === "string" && localeCheck.raw.trim() === placeholder;
  });
  const hasLocaleCandidate = localeChecks.some((localeCheck) => {
    const candidate = toCandidate(localeCheck.raw, localeCheck.key, {
      ...(localeCheck.disallowed.length > 0 ? { disallowed: localeCheck.disallowed } : {}),
      allowEnglishFallback,
      englishFallbacks,
    });
    return typeof candidate === "string" && candidate.length > 0;
  });

  if (!hasLocaleCandidate && localeProvidedPlaceholder && !allowEnglishFallback) {
    return primaryKey;
  }

  const englishCandidates = collectEnglishHomeCandidates(
    englishHomeTranslatorValue,
    englishHomeResource,
    englishHeaders,
  );
  const englishResolved = resolveHomeFromEnglishCandidates({
    candidates: englishCandidates,
    primaryKey,
    allowEnglishFallback,
    englishFallbacks,
  });
  if (typeof englishResolved !== "undefined") return englishResolved;

  return primaryKey;
}
