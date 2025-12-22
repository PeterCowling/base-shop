import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";
import i18n from "@/i18n";
import type { Translator } from "../../types";

/** Probe for any localized structured guide content (intro/sections/tips/warnings). */
export function hasStructuredLocal(
  translations: { tGuides: Translator },
  guideKey: string,
): boolean {
  try {
    const introLocalRaw = translations.tGuides(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
    const introLocal = ensureStringArray(introLocalRaw);
    if (introLocal.length > 0) return true;

    const sectionsLocalRaw = ensureArray<{
      title?: unknown;
      body?: unknown;
      items?: unknown;
    }>(
      translations.tGuides(`content.${guideKey}.sections`, { returnObjects: true }) as unknown,
    );
    if (
      sectionsLocalRaw.some((s) => {
        if (!s || typeof s !== "object") return false;
        const title = typeof s?.title === "string" ? s.title.trim() : "";
        const body = ensureStringArray(s?.body ?? s?.items);
        return title.length > 0 || body.length > 0;
      })
    )
      return true;
    // Support sections as an array of arrays (e.g., [["line 1", ...]]) used by some tests
    try {
      const sectionsUnknown = translations.tGuides(`content.${guideKey}.sections`, {
        returnObjects: true,
      }) as unknown;
      if (
        Array.isArray(sectionsUnknown) &&
        (sectionsUnknown as unknown[]).some((entry) => Array.isArray(entry) && ensureStringArray(entry).length > 0)
      )
        return true;
    } catch {
      /* noop */
    }

    const nonEmptyString = (val: unknown, key: string) => {
      if (typeof val !== "string") return false;
      const s = val.trim();
      return s.length > 0 && s !== key;
    };
    try {
      const tips = translations.tGuides(`content.${guideKey}.tips`, { returnObjects: true }) as unknown;
      if (nonEmptyString(tips, `content.${guideKey}.tips`)) return true;
    } catch {
      /* noop */
    }
    try {
      const warnings = translations.tGuides(`content.${guideKey}.warnings`, { returnObjects: true }) as unknown;
      if (nonEmptyString(warnings, `content.${guideKey}.warnings`)) return true;
    } catch {
      /* noop */
    }
    return false;
  } catch {
    return false;
  }
}

/** Probe for any EN structured content. Skips probing when localized content exists. */
export function hasStructuredEn(
  hookI18n: { getFixedT?: (lng: string, ns: string) => unknown } | undefined,
  hasLocalizedContent: boolean,
  guideKey: string,
): boolean {
  if (hasLocalizedContent) return false;
  const candidates: Array<unknown> = [];
  try {
    if (typeof hookI18n?.getFixedT === "function") {
      candidates.push(hookI18n.getFixedT("en", "guides"));
    }
  } catch {
    /* ignore hook errors */
  }
  try {
    if (typeof i18n?.getFixedT === "function") {
      candidates.push(i18n.getFixedT("en", "guides"));
    }
  } catch {
    /* ignore global errors */
  }
  for (const candidate of candidates) {
    if (typeof candidate !== "function") continue;
    try {
      const introRaw = candidate(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const intro = ensureStringArray(introRaw);
      if (intro.length > 0) return true;
      const sectionsRaw = ensureArray<{
        title?: unknown;
        body?: unknown;
        items?: unknown;
      }>(candidate(`content.${guideKey}.sections`, { returnObjects: true }) as unknown);
      if (
        sectionsRaw.some((s) => {
          if (!s || typeof s !== "object") return false;
          const title = typeof s?.title === "string" ? s.title.trim() : "";
          const body = ensureStringArray(s?.body ?? s?.items);
          return title.length > 0 || body.length > 0;
        })
      ) {
        return true;
      }
    } catch {
      /* ignore candidate errors */
    }
  }
  return false;
}
