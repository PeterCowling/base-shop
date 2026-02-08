import type { AppLanguage } from "../../i18n.config";
import { slugify } from "../../utils/slugify";
import { transliterateGuideLabel } from "../../utils/transliterate-guide-label";

import { ENGLISH_SLUGS, type GuideKey } from "./keys";
import { getGuideLinkLabels, isPlaceholderGuideLabel } from "./labels";
import { GUIDE_SLUG_OVERRIDES } from "./overrides";
import { SUPPORTED_LANGS } from "./supported-langs";

type PerLang = Readonly<Record<string, string>>;

function buildSlugMap(key: GuideKey, fallbackSlug: string): PerLang {
  const overrides = GUIDE_SLUG_OVERRIDES[key];
  const labels = getGuideLinkLabels("en");
  const fallbackLabel = labels[key] ?? ENGLISH_SLUGS[key] ?? key;
  const perLang = {} as Record<string, string>;

  for (const lang of SUPPORTED_LANGS) {
    if (overrides?.[lang as AppLanguage]) {
      perLang[lang] = overrides[lang as AppLanguage]!;
      continue;
    }

    if (lang === "en") {
      perLang["en"] = fallbackSlug;
      continue;
    }

    const label = getGuideLinkLabels(lang)?.[key] ?? fallbackLabel;
    if (isPlaceholderGuideLabel(label)) {
      perLang[lang] = fallbackSlug;
      continue;
    }

    const transliterated = transliterateGuideLabel(label);
    const slug = slugify(transliterated);
    const hasMeaningfulCharacters = /[a-z0-9]/.test(slug);

    // Prefer a locale-specific slug when the locale provides unique copy.
    // If the generated slug collides with the fallback, suffix with language code.
    if (hasMeaningfulCharacters && slug.length > 0) {
      const isUniqueLabel = label.trim() !== (fallbackLabel || "").trim();
      if (isUniqueLabel && slug === fallbackSlug) {
        const alt = slugify(`${transliterated} ${lang}`);
        perLang[lang] = /[a-z0-9]/.test(alt) && alt.length > 0 ? alt : `${fallbackSlug}-${lang}`;
        continue;
      }
      perLang[lang] = slug;
      continue;
    }

    perLang[lang] = fallbackSlug;
  }

  return Object.freeze(perLang) as PerLang;
}

const GUIDE_SLUG_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    (Object.keys(ENGLISH_SLUGS) as GuideKey[]).map((key) => {
      // Prefer the generated English slug when present; otherwise fall back to
      // an override for English, and finally a slugified form of the key.
      const englishFallback =
        ENGLISH_SLUGS[key] ||
        GUIDE_SLUG_OVERRIDES[key]?.["en"] ||
        slugify(transliterateGuideLabel(key));
      return [key, buildSlugMap(key, englishFallback)];
    }),
  ) as Record<GuideKey, PerLang>,
);

export const GUIDE_SLUGS: Record<GuideKey, PerLang> = GUIDE_SLUG_DEFINITIONS;
