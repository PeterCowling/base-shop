import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import { INTERNAL_SEGMENT_BY_KEY, STATIC_EXPORT_SECTION_KEYS } from "./sectionSegments";

export type StaticRedirectRule = {
  from: string;
  to: string;
  status: 200 | 301;
};

const LOCALIZED_ALIAS_REWRITE = 200 as const;
const INTERNAL_TO_LOCALIZED_REDIRECT = 301 as const;

function withTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

function addRule(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
  status: 200 | 301,
): void {
  const rule: StaticRedirectRule = { from, to, status };
  const key = formatRedirectRule(rule);
  if (seen.has(key)) return;
  seen.add(key);
  rules.push(rule);
}

function addBaseAndNestedRules(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  sourceBase: string,
  targetBase: string,
  status: 200 | 301,
): void {
  addRule(rules, seen, sourceBase, targetBase, status);
  addRule(rules, seen, withTrailingSlash(sourceBase), withTrailingSlash(targetBase), status);
  addRule(rules, seen, `${sourceBase}/*`, `${targetBase}/:splat`, status);
}

function addLocalizedTagsRules(
  lang: AppLanguage,
  rules: StaticRedirectRule[],
  seen: Set<string>,
): void {
  const localizedExperiences = getSlug("experiences", lang);
  const localizedGuidesTags = getSlug("guidesTags", lang);
  const internalExperiences = INTERNAL_SEGMENT_BY_KEY.experiences;
  const internalGuidesTags = INTERNAL_SEGMENT_BY_KEY.guidesTags;

  const localizedBase = `/${lang}/${localizedExperiences}/${localizedGuidesTags}`;
  const internalBase = `/${lang}/${internalExperiences}/${internalGuidesTags}`;

  if (localizedBase === internalBase) return;

  // Canonical contract: internal paths permanently redirect to localized URLs.
  addBaseAndNestedRules(rules, seen, internalBase, localizedBase, INTERNAL_TO_LOCALIZED_REDIRECT);
  // Rendering contract: localized paths still resolve the internal App Router tree.
  addBaseAndNestedRules(rules, seen, localizedBase, internalBase, LOCALIZED_ALIAS_REWRITE);
}

function addLocalizedSectionRules(
  lang: AppLanguage,
  rules: StaticRedirectRule[],
  seen: Set<string>,
): void {
  for (const key of STATIC_EXPORT_SECTION_KEYS) {
    const localizedSection = getSlug(key, lang);
    const internalSection = INTERNAL_SEGMENT_BY_KEY[key];
    if (localizedSection === internalSection) continue;

    const localizedBase = `/${lang}/${localizedSection}`;
    const internalBase = `/${lang}/${internalSection}`;

    addBaseAndNestedRules(rules, seen, internalBase, localizedBase, INTERNAL_TO_LOCALIZED_REDIRECT);

    // /en/book-dorm-bed is an explicit route; avoid rewriting it back to /en/book.
    if (key === "book" && lang === "en") continue;
    addBaseAndNestedRules(rules, seen, localizedBase, internalBase, LOCALIZED_ALIAS_REWRITE);
  }
}

export function buildLocalizedStaticRedirectRules(
  languages: readonly AppLanguage[] = i18nConfig.supportedLngs as AppLanguage[],
): StaticRedirectRule[] {
  const rules: StaticRedirectRule[] = [];
  const seen = new Set<string>();

  // Keep tags rules before generic section wildcards to avoid extra hops.
  for (const lang of languages) {
    addLocalizedTagsRules(lang, rules, seen);
  }
  for (const lang of languages) {
    addLocalizedSectionRules(lang, rules, seen);
  }

  return rules;
}

export function formatRedirectRule(rule: StaticRedirectRule): string {
  return `${rule.from}  ${rule.to}  ${rule.status}`;
}

export function formatRedirectRules(rules: readonly StaticRedirectRule[]): string[] {
  return rules.map(formatRedirectRule);
}
