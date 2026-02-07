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

  // Fetch English header namespace values
  const englishHeaderNamespaceHook = (() => {
    try {
      return hookI18n?.getFixedT?.("en", "header")?.("home");
    } catch {
      return undefined;
    }
  })();
  const englishHeaderNamespaceApp = (() => {
    try {
      return i18n.getFixedT?.("en", "header")?.("home");
    } catch {
      return undefined;
    }
  })();
  const englishHeaderKeyHook = (() => {
    try {
      return hookI18n?.getFixedT?.("en")?.("header:home");
    } catch {
      return undefined;
    }
  })();
  const englishHeaderKeyApp = (() => {
    try {
      return i18n.getFixedT?.("en")?.("header:home");
    } catch {
      return undefined;
    }
  })();

  const englishFallbacks = buildEnglishFallbacks(
    englishHomeResource,
    englishHomeTranslatorValue,
    englishHeaderNamespaceHook,
    englishHeaderNamespaceApp,
    englishHeaderKeyHook,
    englishHeaderKeyApp,
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
      englishHeaderNamespaceHook,
      englishHeaderNamespaceApp,
      englishHeaderKeyHook,
      englishHeaderKeyApp,
    ],
    englishPlaceholderSentinels,
  );

  const englishTranslatorMeaningful =
    typeof englishHomeTranslatorValue === "string" &&
    (() => {
      const trimmed = (englishHomeTranslatorValue as string).trim();
      if (trimmed.length === 0) return false;
      if (trimmed.startsWith("［Stub］")) return false;
      const normalized = trimmed.toLowerCase();
      if (normalized === primaryKey.toLowerCase()) return false;
      if (normalized === altKey.toLowerCase()) return false;
      if (normalized === "header:home") return false;
      return true;
    })();

  const allowEnglishFallback = lang === "en" || englishTranslatorMeaningful || englishFallbackHasMeaningful;

  // Try primary and alt keys from active locale
  const primaryRaw = tGuides(primaryKey) as unknown;
  const primaryCandidate = toCandidate(primaryRaw, primaryKey, {
    allowEnglishFallback,
    englishFallbacks,
  });
  if (primaryCandidate !== null) return primaryCandidate;

  const altRaw = tGuides(altKey) as unknown;
  const altCandidate = toCandidate(altRaw, altKey, {
    allowEnglishFallback,
    englishFallbacks,
  });
  if (altCandidate !== null) return altCandidate;

  // Check for empty English resources
  const englishTranslatorMissing = typeof englishHomeTranslatorValue !== "string";
  const englishResourceBlank =
    typeof englishHomeResource === "string" && (englishHomeResource as string).trim().length === 0;
  if (englishTranslatorMissing && englishResourceBlank) return primaryKey;

  // Try header namespace
  const headerRaw = tHeader("home") as unknown;
  const headerCandidate = toCandidate(headerRaw, "home", {
    disallowed: ["header:home"],
    allowEnglishFallback,
    englishFallbacks,
  });
  if (headerCandidate !== null) return headerCandidate;
  if (typeof headerRaw === "string" && (headerRaw as string).trim().length === 0) return "";

  // Try generic namespace
  const genericRaw = tAny("header:home") as unknown;
  const genericCandidate = toCandidate(genericRaw, "header:home", {
    disallowed: ["home"],
    allowEnglishFallback,
    englishFallbacks,
  });
  if (genericCandidate !== null) return genericCandidate;
  if (typeof genericRaw === "string" && (genericRaw as string).trim().length === 0) return "";

  // Check for placeholder strings in locale
  const localeProvidedPlaceholder =
    (typeof primaryRaw === "string" && (primaryRaw as string).trim() === primaryKey) ||
    (typeof altRaw === "string" && (altRaw as string).trim() === altKey) ||
    (typeof headerRaw === "string" && (headerRaw as string).trim() === "home") ||
    (typeof genericRaw === "string" && (genericRaw as string).trim() === "header:home");

  const hasLocaleCandidate = [
    toCandidate(primaryRaw, primaryKey, { allowEnglishFallback, englishFallbacks }),
    toCandidate(altRaw, altKey, { allowEnglishFallback, englishFallbacks }),
    toCandidate(headerRaw, "home", { disallowed: ["header:home"], allowEnglishFallback, englishFallbacks }),
    toCandidate(genericRaw, "header:home", { disallowed: ["home"], allowEnglishFallback, englishFallbacks }),
  ].some((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);

  if (!hasLocaleCandidate && localeProvidedPlaceholder && !allowEnglishFallback) {
    return primaryKey;
  }

  // Try English candidates
  const englishCandidates: string[] = [];
  const registerCandidate = (value: unknown) => {
    if (typeof value === "string") englishCandidates.push(value);
  };
  registerCandidate(englishHomeTranslatorValue);
  registerCandidate(englishHomeResource);
  registerCandidate(englishHeaderNamespaceHook);
  registerCandidate(englishHeaderNamespaceApp);
  registerCandidate(englishHeaderKeyHook);
  registerCandidate(englishHeaderKeyApp);

  for (const candidate of englishCandidates) {
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
    if (trimmed.length > 0 && (allowEnglishFallback || !englishFallbacks.has(normalized))) {
      return trimmed;
    }
  }

  return primaryKey;
}
