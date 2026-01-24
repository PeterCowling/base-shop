import type { FallbackTranslator, I18nLike } from "./types";

/**
 * Safely resolve a translator using getFixedT, swallowing errors for unsupported
 * namespaces/locales so tests can assert specific call orders without throwing.
 */
export function resolveTranslator(
  getFixedT: ((lng: string, ns: string) => unknown) | undefined,
  lang: string,
  ns: string,
): FallbackTranslator | undefined {
  if (typeof getFixedT !== "function") return undefined;
  try {
    const out = getFixedT(lang, ns);
    return typeof out === "function" ? (out as FallbackTranslator) : undefined;
  } catch {
    // If the underlying i18n instance rejects this (lang, ns) combo,
    // treat it as unavailable instead of surfacing an error.
    return undefined;
  }
}

/**
 * Returns candidate translators for fallback content in priority order.
 */
export function getFallbackTranslatorCandidates(
  lang: string,
  hookI18n: I18nLike | undefined,
  appI18n: I18nLike | undefined,
  /** Optional guides namespace translator for the active locale. Enables
   *  localized structured fallbacks that live under alternate/legacy keys in
   *  the guides namespace (e.g., content.amalfiCoastPublicTransportGuide.*).
   *  This helps tests that seed localized alternate keys without wiring
   *  guidesFallback or getFixedT mocks. */
  localGuidesTranslator?: FallbackTranslator,
): Array<FallbackTranslator | undefined> {
  // Prefer localized curated fallback first so routes can present local copy
  // when structured content is missing. Then prefer English structured
  // content to enable GenericContent-based rendering in unlocalized tests,
  // and only then fall back to English curated guidesFallback copy.
  return [
    // Localized guides translator (for alternate/legacy keys in guides ns)
    localGuidesTranslator,
    // Localized curated fallback (hook-provided translator or getFixedT)
    hookI18n?.__tGuidesFallback,
    appI18n?.__tGuidesFallback,
    resolveTranslator(hookI18n?.getFixedT, lang, "guidesFallback"),
    resolveTranslator(appI18n?.getFixedT, lang, "guidesFallback"),
    // English structured content (prefer GenericContent path in tests)
    resolveTranslator(hookI18n?.getFixedT, "en", "guides"),
    resolveTranslator(appI18n?.getFixedT, "en", "guides"),
    // English curated fallback
    resolveTranslator(hookI18n?.getFixedT, "en", "guidesFallback"),
    resolveTranslator(appI18n?.getFixedT, "en", "guidesFallback"),
  ];
}
