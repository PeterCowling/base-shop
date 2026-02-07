import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import { INTERNAL_SEGMENT_BY_KEY, STATIC_EXPORT_SECTION_KEYS } from "./sectionSegments";

export type StaticRedirectRule = {
  from: string;
  to: string;
  status: 301;
};

const PERMANENT_REDIRECT = 301 as const;

function withTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

function addRule(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
): void {
  const rule: StaticRedirectRule = { from, to, status: PERMANENT_REDIRECT };
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
): void {
  addRule(rules, seen, sourceBase, targetBase);
  addRule(rules, seen, withTrailingSlash(sourceBase), withTrailingSlash(targetBase));
  addRule(rules, seen, `${sourceBase}/*`, `${targetBase}/:splat`);
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

  const sourceBase = `/${lang}/${localizedExperiences}/${localizedGuidesTags}`;
  const targetBase = `/${lang}/${internalExperiences}/${internalGuidesTags}`;

  if (sourceBase === targetBase) return;
  addBaseAndNestedRules(rules, seen, sourceBase, targetBase);
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

    const sourceBase = `/${lang}/${localizedSection}`;
    const targetBase = `/${lang}/${internalSection}`;
    addBaseAndNestedRules(rules, seen, sourceBase, targetBase);
  }
}

export function buildLocalizedStaticRedirectRules(
  languages: readonly AppLanguage[] = i18nConfig.supportedLngs as AppLanguage[],
): StaticRedirectRule[] {
  const rules: StaticRedirectRule[] = [];
  const seen = new Set<string>();

  // Place tags redirects before section wildcards to avoid unnecessary redirect hops.
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
