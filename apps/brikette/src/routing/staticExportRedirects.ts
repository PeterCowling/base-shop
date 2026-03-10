import {
  getPrivateRoomChildSlug,
  getPrivateRoomChildSlugAliases,
  PRIVATE_ROOM_CHILD_ROUTE_IDS,
} from "@acme/ui/config/privateRoomChildSlugs";
import { getRoomSlug, getRoomSlugAliases } from "@acme/ui/config/roomSlugs";

import { GUIDES_INDEX } from "@/data/guides.index";
import { websiteVisibleRoomsData } from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { guideNamespace, guidePath, guideSlugAliases } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import { INTERNAL_SEGMENT_BY_KEY, STATIC_EXPORT_SECTION_KEYS } from "./sectionSegments";

export type StaticRedirectRule = {
  from: string;
  to: string;
  status: 200 | 301 | 302;
};

const LOCALIZED_ALIAS_REWRITE = 200 as const;
const INTERNAL_TO_LOCALIZED_REDIRECT = 301 as const;
const NON_DORM_ROOM_IDS = new Set(["double_room", "apartment"]);

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

function addDirectRedirectRules(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
): void {
  addRule(rules, seen, from, to, INTERNAL_TO_LOCALIZED_REDIRECT);
  addRule(rules, seen, withTrailingSlash(from), withTrailingSlash(to), INTERNAL_TO_LOCALIZED_REDIRECT);
}

function addDirectRewriteRules(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
): void {
  addRule(rules, seen, from, to, LOCALIZED_ALIAS_REWRITE);
  addRule(rules, seen, withTrailingSlash(from), withTrailingSlash(to), LOCALIZED_ALIAS_REWRITE);
}

function addLocalizedRoomAliasRules(
  lang: AppLanguage,
  rules: StaticRedirectRule[],
  seen: Set<string>,
): void {
  const localizedRooms = getSlug("rooms", lang);
  const internalRooms = INTERNAL_SEGMENT_BY_KEY.rooms;
  const legacyRooms = "rooms";

  for (const room of websiteVisibleRoomsData.filter((candidate) => !NON_DORM_ROOM_IDS.has(candidate.id))) {
    const canonicalRoomSlug = getRoomSlug(room.id, lang);
    const localizedTarget = `/${lang}/${localizedRooms}/${canonicalRoomSlug}`;
    for (const alias of getRoomSlugAliases(room.id, lang)) {
      addDirectRedirectRules(rules, seen, `/${lang}/${localizedRooms}/${alias}`, localizedTarget);
      addDirectRedirectRules(rules, seen, `/${lang}/${internalRooms}/${alias}`, localizedTarget);
      addDirectRedirectRules(rules, seen, `/${lang}/${legacyRooms}/${alias}`, localizedTarget);
    }
  }
}

function addLocalizedPrivateRoomChildRules(
  lang: AppLanguage,
  rules: StaticRedirectRule[],
  seen: Set<string>,
): void {
  const localizedPrivateRooms = getSlug("apartment", lang);
  const internalPrivateRooms = INTERNAL_SEGMENT_BY_KEY.apartment;

  for (const routeId of PRIVATE_ROOM_CHILD_ROUTE_IDS) {
    const canonicalChildSlug = getPrivateRoomChildSlug(routeId, lang);
    const localizedTarget = `/${lang}/${localizedPrivateRooms}/${canonicalChildSlug}`;
    const internalTarget = `/${lang}/${internalPrivateRooms}/${routeId}`;

    if (localizedTarget !== internalTarget) {
      addDirectRedirectRules(rules, seen, internalTarget, localizedTarget);
      addDirectRewriteRules(rules, seen, localizedTarget, internalTarget);
    }

    for (const alias of getPrivateRoomChildSlugAliases(routeId, lang)) {
      addDirectRedirectRules(rules, seen, `/${lang}/${localizedPrivateRooms}/${alias}`, localizedTarget);
      addDirectRedirectRules(rules, seen, `/${lang}/${internalPrivateRooms}/${alias}`, localizedTarget);
    }
  }
}

function addLocalizedGuideAliasRules(
  lang: AppLanguage,
  rules: StaticRedirectRule[],
  seen: Set<string>,
): void {
  const liveGuides = GUIDES_INDEX.filter((guide) => guide.status === "live");

  for (const guide of liveGuides) {
    const namespace = guideNamespace(lang, guide.key);
    const localizedBase = `/${lang}/${namespace.baseSlug}`;
    const internalBase = `/${lang}/${INTERNAL_SEGMENT_BY_KEY[namespace.baseKey]}`;
    const canonicalTarget = guidePath(lang, guide.key);

    for (const alias of guideSlugAliases(lang, guide.key)) {
      addDirectRedirectRules(rules, seen, `${localizedBase}/${alias}`, canonicalTarget);
      addDirectRedirectRules(rules, seen, `${internalBase}/${alias}`, canonicalTarget);
    }
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
  for (const lang of languages) {
    addLocalizedPrivateRoomChildRules(lang, rules, seen);
  }
  for (const lang of languages) {
    addLocalizedRoomAliasRules(lang, rules, seen);
  }
  for (const lang of languages) {
    addLocalizedGuideAliasRules(lang, rules, seen);
  }

  return rules;
}

export function formatRedirectRule(rule: StaticRedirectRule): string {
  return `${rule.from}  ${rule.to}  ${rule.status}`;
}

export function formatRedirectRules(rules: readonly StaticRedirectRule[]): string[] {
  return rules.map(formatRedirectRule);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type RedirectMatchResult = {
  matched: boolean;
  groups: Record<string, string>;
};

function matchRedirectSourcePattern(sourcePattern: string, pathname: string): RedirectMatchResult {
  let regexPattern = "";
  const groupKeys: string[] = [];

  for (let index = 0; index < sourcePattern.length; index += 1) {
    const char = sourcePattern[index];
    if (char === ":") {
      const match = sourcePattern.slice(index + 1).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) {
        regexPattern += ":";
        continue;
      }
      const groupKey = match[0];
      groupKeys.push(groupKey);
      regexPattern += "([^/]+)";
      index += groupKey.length;
      continue;
    }

    if (char === "*") {
      groupKeys.push("splat");
      regexPattern += "(.*)";
      continue;
    }

    regexPattern += escapeRegex(char);
  }

  // eslint-disable-next-line security/detect-non-literal-regexp -- BRIK-2145 route regex is assembled from escaped literals plus constrained param tokens only
  const match = pathname.match(new RegExp(`^${regexPattern}$`));
  if (!match) {
    return { matched: false, groups: {} };
  }

  const groups: Record<string, string> = {};
  for (let index = 0; index < groupKeys.length; index += 1) {
    groups[groupKeys[index]] = match[index + 1] ?? "";
  }

  return { matched: true, groups };
}

function applyRedirectTargetTemplate(targetPattern: string, groups: Record<string, string>): string {
  return targetPattern.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_match, groupKey: string) => {
    return groups[groupKey] ?? "";
  });
}

export function resolveRedirectTarget(
  pathname: string,
  rules: readonly StaticRedirectRule[],
): string | null {
  for (const rule of rules) {
    const result = matchRedirectSourcePattern(rule.from, pathname);
    if (!result.matched) continue;
    return applyRedirectTargetTemplate(rule.to, result.groups);
  }

  return null;
}
