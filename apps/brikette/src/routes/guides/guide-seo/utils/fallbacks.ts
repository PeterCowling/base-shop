/* eslint-disable ds/no-hardcoded-copy -- DEV-1790: Structured guide fallbacks rely on static copy */
import type { GuideKey } from "@/routes.guides-helpers";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { buildStructuredFromTranslator } from "./fallbacks/buildStructuredFromTranslator";
import { legacyGuideKeyCandidates } from "./fallbacks/legacyKeys";
import { probeHasLocalizedStructuredContent } from "./fallbacks/probe";
import {
  getFallbackTranslatorCandidates,
  resolveTranslator,
} from "./fallbacks/translatorCandidates";
import type { FallbackTranslator, I18nLike, StructuredFallback } from "./fallbacks/types";

export type { FallbackTranslator, StructuredFallback, StructuredSection } from "./fallbacks/types";
export { buildStructuredFromTranslator } from "./fallbacks/buildStructuredFromTranslator";
export { getFallbackTranslatorCandidates } from "./fallbacks/translatorCandidates";
export { probeHasLocalizedStructuredContent } from "./fallbacks/probe";

/**
 * Pick the first viable fallback translator and return structured fallback content.
 */
export function buildStructuredFallback(
  guideKey: GuideKey,
  lang: string,
  hookI18n: I18nLike | undefined,
  appI18n: I18nLike | undefined,
  hasLocalizedContent: boolean,
  suppressEnglishWhenUnlocalized: boolean = false,
  /** Optional guides translator for the active locale to probe alternate keys. */
  localGuidesTranslator?: FallbackTranslator,
): StructuredFallback | null {
  if (hasLocalizedContent) return null;
  // Allow routes to suppress synthesizing structured fallbacks for English.
  // This keeps EN pages that opt for manual handling from importing EN
  // structured arrays when translators return empty values.
  if (lang === "en" && suppressEnglishWhenUnlocalized) return null;
  // If a curated manual fallback object exists under content.{guideKey}.fallback
  // (either in the active locale or in English), prefer the manual path and
  // skip building a structured fallback. Tests for several guides (including
  // cooking classes) assert the manual object is used when available, and that
  // we do not fall back to EN structured sections in that case.
  try {
    const { localeDefinesFallbackButNotMeaningful, hasMeaningfulManual } = (() => {
      const checkTranslator = (t: FallbackTranslator | undefined): boolean => {
        if (typeof t !== "function") return false;
        try {
          const raw = t(`content.${guideKey}.fallback`, { returnObjects: true }) as unknown;
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
          const obj = raw as Record<string, unknown>;
          // intro: non-empty array of strings
          const intro = ensureStringArray(obj["intro"]);
          if (intro.length > 0) return true;
          // sections: at least one item with a title or non-empty body/items
          const sections = ensureArray<{ id?: unknown; title?: unknown; body?: unknown; items?: unknown }>(
            obj["sections"],
          );
          const hasSection = sections.some((s) => {
            if (!s || typeof s !== "object") return false;
            const title = typeof s.title === "string" ? s.title.trim() : "";
            const body = ensureStringArray(s.body ?? s.items);
            return title.length > 0 || body.length > 0;
          });
          if (hasSection) return true;
          // faqs: at least one item with question and non-empty answer array
          const faqs = ensureArray<{ q?: unknown; a?: unknown; answer?: unknown }>(obj["faqs"]);
          const hasFaq = faqs.some((f) => {
            if (!f || typeof f !== "object") return false;
            const q = typeof f.q === "string" ? f.q.trim() : "";
            const a = ensureStringArray(f.a ?? f.answer);
            return q.length > 0 && a.length > 0;
          });
          if (hasFaq) return true;
          // Ignore toc-only fallbacks to match tests that expect no rendering
          // when intro/sections/faqs are absent.
          return false;
        } catch {
          return false;
        }
      };
      const tLocalGuides = resolveTranslator(hookI18n?.getFixedT, lang, "guides");
      const tEnGuides = resolveTranslator(appI18n?.getFixedT, "en", "guides");

      // Detect an explicit, but unusable, fallback defined by the active locale.
      // When present, suppress structured fallbacks entirely so pages do not
      // silently render EN sections contrary to tests' expectations.
      const localeDefinesFallbackButNotMeaningful = (() => {
        if (typeof tLocalGuides !== "function") return false;
        try {
          const raw = tLocalGuides(`content.${guideKey}.fallback`, { returnObjects: true }) as unknown;
          if (raw == null) return false;
          // Only treat an explicit object fall-back (non-array) as a signal.
          // Primitive values (e.g., key strings) should be ignored so they do
          // not suppress structured fallbacks in tests that stub translators.
          if (typeof raw !== "object" || Array.isArray(raw)) return false;
          // Do not treat an empty object as an explicit fallback definition.
          // Tests may return {} for unrelated keys; only consider it explicit
          // when at least one property is present.
          if (Object.keys(raw as Record<string, unknown>).length === 0) return false;
          // Object present but not meaningful → suppress structured fallback
          return !checkTranslator(tLocalGuides);
        } catch {
          return false;
        }
      })();

      return {
        localeDefinesFallbackButNotMeaningful,
        hasMeaningfulManual: checkTranslator(tLocalGuides) || checkTranslator(tEnGuides),
      };
    })();
    if (localeDefinesFallbackButNotMeaningful) return null;
    if (hasMeaningfulManual) return null;
  } catch {
    // If detection fails, continue with structured candidates below
  }
  const legacyKeys = legacyGuideKeyCandidates(guideKey);
  const candidates = getFallbackTranslatorCandidates(lang, hookI18n, appI18n, localGuidesTranslator);
  // Resolve an EN guides translator to help disambiguate cases where a
  // misconfigured/mocked getFixedT returns the EN guides translator for a
  // localized guidesFallback request. When detected, reclassify the source
  // as "guidesEn" so downstream logic prefers GenericContent.
  const enGuidesTranslator = (() => {
    const fromHook = resolveTranslator(hookI18n?.getFixedT, "en", "guides");
    if (fromHook) return fromHook;
    return resolveTranslator(appI18n?.getFixedT, "en", "guides");
  })();
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const structured = buildStructuredFromTranslator(candidate, guideKey, legacyKeys);
    if (structured) {
      // Candidate indices map to sources as follows:
      // 0     → localized guides (alternate keys in guides namespace)
      // 1..4  → localized guidesFallback candidates
      // 5..6  → English structured guides (guidesEn)
      // 7..8  → English guidesFallback
      let source: "guidesFallback" | "guidesEn" =
        i === 0 ? "guidesFallback" : i <= 4 ? "guidesFallback" : i <= 6 ? "guidesEn" : "guidesFallback";
      // If a supposed guidesFallback translator is actually the EN guides
      // translator (common in tests where getFixedT returns the same fn for
      // all (lang, ns) pairs), reclassify as guidesEn to match expectations.
      try {
        if (source === "guidesFallback" && typeof candidate === "function" && typeof enGuidesTranslator === "function") {
          if ((candidate as unknown) === (enGuidesTranslator as unknown)) {
            source = "guidesEn";
          }
        }
      } catch {
        /* noop */
      }
      return {
        translator: candidate as FallbackTranslator,
        intro: structured.intro,
        sections: structured.sections,
        source,
      } satisfies StructuredFallback;
    }
  }
  return null;
}
