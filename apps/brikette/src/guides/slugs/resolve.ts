import type { AppLanguage } from "../../i18n.config";
import type { GuideKey } from "./keys";
import { GUIDE_KEYS_WITH_OVERRIDES } from "./keys";
import { GUIDE_SLUG_LOOKUP_BY_LANG } from "./lookups";
import { GUIDE_SLUG_FALLBACKS } from "./components";

const normalizeSlug = (value: string): string => value.trim().toLowerCase();
const stripHyphens = (value: string): string => value.replace(/-/g, "");

const fallbackSlugFromKey = (key: GuideKey): string =>
  key
    .replace(/([a-z\d])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();

const matchLookup = (
  lookup: Readonly<Record<string, GuideKey>>,
  normalized: string,
  compact: string,
): GuideKey | undefined => {
  const direct = lookup[normalized];
  if (direct) return direct;
  for (const [candidate, key] of Object.entries(lookup)) {
    if (stripHyphens(candidate) === compact) return key;
  }
  return undefined;
};

export function resolveGuideKeyFromSlug(
  slug: string,
  lang?: AppLanguage,
): GuideKey | undefined {
  const normalized = normalizeSlug(slug);
  if (!normalized) return undefined;
  const compact = stripHyphens(normalized);

  if (lang) {
    const lookup = GUIDE_SLUG_LOOKUP_BY_LANG[lang];
    if (lookup) {
      const match = matchLookup(lookup, normalized, compact);
      if (match) return match;
    }
  }

  for (const key of GUIDE_KEYS_WITH_OVERRIDES) {
    const candidates = [GUIDE_SLUG_FALLBACKS[key], fallbackSlugFromKey(key)].filter(
      (value): value is string => Boolean(value),
    );
    for (const fallback of candidates) {
      const fallbackNormalized = normalizeSlug(fallback);
      if (fallbackNormalized === normalized) return key;
      if (stripHyphens(fallbackNormalized) === compact) return key;
    }
  }

  for (const lookup of Object.values(GUIDE_SLUG_LOOKUP_BY_LANG)) {
    const match = matchLookup(lookup, normalized, compact);
    if (match) return match;
  }

  return undefined;
}