import { BASE_URL } from "../../config/site";
import type { AppLanguage } from "../../i18n.config";
import { getSlug } from "../../utils/slug";

import { GUIDE_COMPONENT_OVERRIDES,GUIDE_SLUG_FALLBACKS } from "./components";
import type { GuideKey } from "./keys";
import { guideNamespace } from "./namespaces";
import { GUIDE_SLUG_OVERRIDES } from "./overrides";
import { GUIDE_SLUGS } from "./slugs";

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

export function guideComponentPath(key: GuideKey): string {
  const override = GUIDE_COMPONENT_OVERRIDES[key];
  if (override) return override;
  const slug = GUIDE_SLUGS[key]?.["en"] ?? GUIDE_SLUG_FALLBACKS[key] ?? fallbackSlugFromKey(key);
  return `routes/guides/${slug}.tsx`;
}

export function guideHref(
  lang: AppLanguage,
  key: GuideKey,
  options?: { forceGuidesBase?: boolean },
): string {
  // Allow callers (e.g., link-token rendering) to pin links under the public
  // guides base regardless of namespace routing. This keeps cross-guide links
  // stable and matches tests that expect the canonical /guides/ base.
  if (options?.forceGuidesBase) {
    return `/${lang}/guides/${guideSlug(lang, key)}`;
  }
  // Special-case: ensure porterServices lives under the public guides base
  if (key === ("porterServices" as GuideKey)) {
    return `/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, key)}`;
  }
  const base = guideNamespace(lang, key);
  return `/${lang}/${base.baseSlug}/${guideSlug(lang, key)}`;
}

export function guideAbsoluteUrl(lang: AppLanguage, key: GuideKey): string {
  return `${BASE_URL}${guideHref(lang, key)}`;
}
