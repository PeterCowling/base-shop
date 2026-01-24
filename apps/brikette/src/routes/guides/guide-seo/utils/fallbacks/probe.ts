import type { GuideKey } from "@/routes.guides-helpers";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { FallbackTranslator, SectionLike } from "./types";

/**
 * Probe whether the active locale contains meaningful structured arrays for a guide.
 * Checks intro and sections for non-empty content without mutating downstream translators.
 */
export function probeHasLocalizedStructuredContent(
  guideKey: GuideKey,
  tGuides: FallbackTranslator,
): boolean {
  try {
    // Treat raw i18n keys and bare guide keys as placeholders; ignore them
    // when determining whether localized structured arrays exist.
    const isMeaningfulString = (val: unknown, expectedKey: string): boolean => {
      if (typeof val !== "string") return false;
      const normalisedPrefix = val.replace(/^[a-z]{2,3}:/i, "").trim();
      if (!normalisedPrefix) return false;
      if (normalisedPrefix === expectedKey) return false;
      if (normalisedPrefix === String(guideKey)) return false;
      if (normalisedPrefix.startsWith(`${expectedKey}.`)) return false;
      if (
        normalisedPrefix.startsWith("content.") &&
        normalisedPrefix.includes(String(guideKey))
      ) {
        return false;
      }
      const stripped = normalisedPrefix.replace(/[.!?…]+$/u, "").trim().toLowerCase();
      if (stripped === "traduzione in arrivo") return false;
      return true;
    };

    const introLocalRaw = tGuides(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
    const introLocal = ensureStringArray(introLocalRaw);
    if (introLocal.some((p) => isMeaningfulString(p, `content.${guideKey}.intro`))) {
      return true;
    }
    const sectionsLocalRaw = ensureArray<unknown>(
      tGuides(`content.${guideKey}.sections`, { returnObjects: true }) as unknown,
    );
    const sectionsMeaningful = sectionsLocalRaw.some((s) => {
      if (Array.isArray(s)) {
        const body = ensureStringArray(s);
        return body.some((b) => isMeaningfulString(b, `content.${guideKey}.sections`));
      }
      if (!s || typeof s !== "object") return false;
      const obj = s as SectionLike;
      const title = typeof obj.title === "string" ? obj.title.trim() : "";
      const body = ensureStringArray(obj.body ?? obj.items);
      const titleOk = isMeaningfulString(title, `content.${guideKey}.sections`);
      const bodyOk = body.some((b) => isMeaningfulString(b, `content.${guideKey}.sections`));
      return titleOk || bodyOk;
    });
    if (sectionsMeaningful) return true;

    const miscKeys: Array<{ key: string; placeholder: string }> = [
      { key: `content.${guideKey}.tips`, placeholder: `content.${guideKey}.tips` },
      { key: `content.${guideKey}.warnings`, placeholder: `content.${guideKey}.warnings` },
    ];
    for (const entry of miscKeys) {
      try {
        const raw = tGuides(entry.key, { returnObjects: true }) as unknown;
        const values = ensureStringArray(raw);
        if (values.some((value) => isMeaningfulString(value, entry.placeholder))) {
          return true;
        }
      } catch {
        /* noop */
      }
    }
    return false;
  } catch {
    return false;
  }
}
