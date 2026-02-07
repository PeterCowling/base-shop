import { createGuideUrlHelpers } from "@acme/guides-core";

import { BASE_URL } from "../../config/site";
import type { AppLanguage } from "../../i18n.config";
import { GUIDE_COMPONENT_OVERRIDES,GUIDE_SLUG_FALLBACKS } from "./components";
import type { GuideKey } from "./keys";
import { GUIDE_KEYS_WITH_OVERRIDES } from "./keys";
import { guideNamespace } from "./namespaces";
import { GUIDE_SLUG_OVERRIDES } from "./overrides";
import { GUIDE_SLUGS } from "./slugs";
import { SUPPORTED_LANGS } from "./supported-langs";

function fallbackSlugFromKey(key: GuideKey): string {
  return key
    .replace(/([a-z\d])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

export function guideSlug(lang: AppLanguage, key: GuideKey): string {
  const dict = GUIDE_SLUGS[key];
  if (!dict) {
    const override = GUIDE_SLUG_OVERRIDES[key] as Partial<Record<AppLanguage, string>> | undefined;
    return (
      override?.[lang] ??
      override?.["en"] ??
      GUIDE_SLUG_FALLBACKS[key] ??
      fallbackSlugFromKey(key)
    );
  }
  return dict[lang] ?? dict["en"] ?? GUIDE_SLUG_FALLBACKS[key] ?? fallbackSlugFromKey(key);
}

const SLUGS_BY_KEY = Object.freeze(
  GUIDE_KEYS_WITH_OVERRIDES.reduce<Record<GuideKey, Record<AppLanguage, string>>>(
    (acc, key) => {
      const perLang = SUPPORTED_LANGS.reduce<Record<AppLanguage, string>>((langs, lang) => {
        langs[lang as AppLanguage] = guideSlug(lang as AppLanguage, key);
        return langs;
      }, {} as Record<AppLanguage, string>);
      acc[key] = Object.freeze(perLang);
      return acc;
    },
    {} as Record<GuideKey, Record<AppLanguage, string>>,
  ),
);

const guideUrlHelpers = createGuideUrlHelpers<AppLanguage, GuideKey>({
  baseUrl: BASE_URL,
  keys: GUIDE_KEYS_WITH_OVERRIDES,
  languages: SUPPORTED_LANGS as AppLanguage[],
  slugsByKey: SLUGS_BY_KEY,
  defaultLang: "en",
  basePathForKey: (lang, key) => {
    const base = guideNamespace(lang, key);
    return `/${lang}/${base.baseSlug}`;
  },
  fallbackSlugsByKey: GUIDE_SLUG_FALLBACKS,
  fallbackSlugFromKey,
});

export const { guidePath, guideHref, guideAbsoluteUrl, resolveGuideKeyFromSlug, slugLookupsByLang } =
  guideUrlHelpers;

export function guideComponentPath(key: GuideKey): string {
  const override = GUIDE_COMPONENT_OVERRIDES[key];
  if (override) return override;
  const slug = GUIDE_SLUGS[key]?.["en"] ?? GUIDE_SLUG_FALLBACKS[key] ?? fallbackSlugFromKey(key);
  return `routes/guides/${slug}.tsx`;
}

export const GUIDE_SLUG_LOOKUP_BY_LANG = slugLookupsByLang;
