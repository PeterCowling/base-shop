export type SlugsByKey<Lang extends string, Key extends string> = Readonly<
  Record<Key, Readonly<Partial<Record<Lang, string>>>>
>;

export {
  extractStringsFromContent,
  listJsonFiles,
  readJson,
} from "./fsContent";

export interface GuidesCoreConfig<Lang extends string, Key extends string> {
  baseUrl: string;
  keys: readonly Key[];
  languages: readonly Lang[];
  slugsByKey: SlugsByKey<Lang, Key>;
  basePathForKey: (lang: Lang, key: Key) => string;
  defaultLang?: Lang;
  fallbackSlugsByKey?: Partial<Record<Key, string>>;
  fallbackSlugFromKey?: (key: Key) => string;
}

export interface GuideUrlHelpers<Lang extends string, Key extends string> {
  guidePath: (lang: Lang, key: Key) => string;
  guideHref: (lang: Lang, key: Key) => string;
  guideAbsoluteUrl: (lang: Lang, key: Key) => string;
  resolveGuideKeyFromSlug: (slug: string, lang?: Lang) => Key | undefined;
  slugLookupsByLang: Readonly<Record<Lang, Readonly<Record<string, Key>>>>;
}

const normalizeSlug = (value: string): string => value.trim().toLowerCase();
const stripHyphens = (value: string): string => value.replace(/-/g, "");

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function normalizePathSegment(value: string): string {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

function joinPath(basePath: string, slug: string): string {
  const base = normalizePathSegment(basePath);
  const leaf = normalizePathSegment(slug);
  if (!base) return `/${leaf}`;
  return `/${base}/${leaf}`;
}

function matchLookup<Key extends string>(
  lookup: Readonly<Record<string, Key>>,
  normalized: string,
  compact: string,
): Key | undefined {
  const direct = lookup[normalized];
  if (direct) return direct;
  for (const [candidate, key] of Object.entries(lookup)) {
    if (stripHyphens(candidate) === compact) return key;
  }
  return undefined;
}

export function createGuideUrlHelpers<Lang extends string, Key extends string>(
  config: GuidesCoreConfig<Lang, Key>,
): GuideUrlHelpers<Lang, Key> {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  const fallbackCandidatesByKey = new Map<Key, string[]>();
  for (const key of config.keys) {
    const candidates: string[] = [];
    const directFallback = config.fallbackSlugsByKey?.[key];
    if (directFallback) candidates.push(directFallback);
    if (config.fallbackSlugFromKey) {
      const derived = config.fallbackSlugFromKey(key);
      if (derived && !candidates.includes(derived)) candidates.push(derived);
    }
    fallbackCandidatesByKey.set(key, candidates);
  }

  const slugLookupsByLang = Object.freeze(
    config.languages.reduce<Record<Lang, Readonly<Record<string, Key>>>>(
      (acc, lang) => {
        const map: Record<string, Key> = {};
        for (const key of config.keys) {
          const perLang = config.slugsByKey[key];
          const slug =
            perLang?.[lang] ??
            (config.defaultLang ? perLang?.[config.defaultLang] : undefined) ??
            config.fallbackSlugsByKey?.[key] ??
            config.fallbackSlugFromKey?.(key);
          if (slug) {
            map[normalizeSlug(slug)] = key;
          }
        }
        acc[lang] = Object.freeze(map);
        return acc;
      },
      {} as Record<Lang, Readonly<Record<string, Key>>>,
    ),
  );

  function guidePath(lang: Lang, key: Key): string {
    const perLang = config.slugsByKey[key];
    const slug =
      perLang?.[lang] ??
      (config.defaultLang ? perLang?.[config.defaultLang] : undefined) ??
      config.fallbackSlugsByKey?.[key] ??
      config.fallbackSlugFromKey?.(key);
    const basePath = config.basePathForKey(lang, key);
    if (!slug) return joinPath(basePath, normalizePathSegment(String(key)));
    return joinPath(basePath, slug);
  }

  function guideHref(lang: Lang, key: Key): string {
    return guidePath(lang, key);
  }

  function guideAbsoluteUrl(lang: Lang, key: Key): string {
    const path = guidePath(lang, key);
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function resolveGuideKeyFromSlug(slug: string, lang?: Lang): Key | undefined {
    const normalized = normalizeSlug(slug);
    if (!normalized) return undefined;
    const compact = stripHyphens(normalized);

    if (lang) {
      const lookup = slugLookupsByLang[lang];
      if (lookup) {
        const match = matchLookup(lookup, normalized, compact);
        if (match) return match;
      }
    }

    for (const key of config.keys) {
      const candidates = fallbackCandidatesByKey.get(key) ?? [];
      for (const fallback of candidates) {
        const fallbackNormalized = normalizeSlug(fallback);
        if (fallbackNormalized === normalized) return key;
        if (stripHyphens(fallbackNormalized) === compact) return key;
      }
    }

    for (const lookup of Object.values(slugLookupsByLang) as Readonly<Record<string, Key>>[]) {
      const match = matchLookup(lookup, normalized, compact);
      if (match) return match;
    }

    return undefined;
  }

  return {
    guidePath,
    guideHref,
    guideAbsoluteUrl,
    resolveGuideKeyFromSlug,
    slugLookupsByLang,
  };
}
