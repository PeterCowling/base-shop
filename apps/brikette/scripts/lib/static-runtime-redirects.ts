import fs from "node:fs";
import path from "node:path";

import {
  getPrivateRoomChildSlug,
  getPrivateRoomChildSlugAliases,
  PRIVATE_ROOM_CHILD_ROUTE_IDS,
} from "@acme/ui/config/privateRoomChildSlugs";
import { findRoomIdBySlug, getRoomSlug } from "@acme/ui/config/roomSlugs";

import { GUIDES_INDEX } from "../../src/data/guides.index";
import roomsData, { websiteVisibleRoomsData } from "../../src/data/roomsData";
import type { AppLanguage } from "../../src/i18n.config";
import { i18nConfig } from "../../src/i18n.config";
import {
  guideNamespace,
  guidePath,
  resolveGuideKeyFromSlug,
} from "../../src/routes.guides-helpers";
import { listLocalizedPublicUrls } from "../../src/routing/routeInventory";
import { INTERNAL_SEGMENT_BY_KEY } from "../../src/routing/sectionSegments";
import {
  buildLocalizedStaticRedirectRules,
  formatRedirectRule,
  resolveRedirectTarget,
  type StaticRedirectRule,
} from "../../src/routing/staticExportRedirects";
import { getSlug } from "../../src/utils/slug";

export type ExactLegacyRedirect = {
  from: string;
  to: string;
  status: 301;
};

export type PagesFunctionRouteConfig = {
  version: 1;
  include: string[];
  exclude: string[];
};

const EXCLUDED_URLS = new Set(["/404", "/app-router-test"]);
const LEGACY_FIXTURE_RELATIVE_PATH = "src/test/fixtures/legacy-urls.txt";
const PAGES_FUNCTION_ROUTE_LIMIT = 100;
const NON_DORM_ROOM_IDS = new Set(["double_room", "apartment"]);
const REQUIRED_FUNCTION_INCLUDE_PATTERNS = [
  "/api/availability*",
  "/api/health*",
  "/api/recovery/quote/send*",
] as const;
const SUPPORTED_LANGUAGES = new Set(i18nConfig.supportedLngs as AppLanguage[]);
const GUIDE_BASE_KEY_BY_SEGMENT_BY_LANG = new Map<AppLanguage, Map<string, keyof typeof INTERNAL_SEGMENT_BY_KEY>>(
  (i18nConfig.supportedLngs as AppLanguage[]).map((lang) => {
    const segments = new Map<string, keyof typeof INTERNAL_SEGMENT_BY_KEY>([
      ["help", "assistance"],
    ]);
    for (const guide of GUIDES_INDEX) {
      if (guide.status !== "live") continue;
      const namespace = guideNamespace(lang, guide.key);
      segments.set(namespace.baseSlug, namespace.baseKey);
      segments.set(INTERNAL_SEGMENT_BY_KEY[namespace.baseKey], namespace.baseKey);
    }
    return [lang, segments];
  }),
);
const ROOM_BASE_SEGMENTS_BY_LANG = new Map<AppLanguage, Set<string>>(
  (i18nConfig.supportedLngs as AppLanguage[]).map((lang) => [
    lang,
    new Set<string>([
      "rooms",
      INTERNAL_SEGMENT_BY_KEY.rooms,
      getSlug("rooms", lang),
      INTERNAL_SEGMENT_BY_KEY.apartment,
      getSlug("apartment", lang),
    ]),
  ]),
);

function withTrailingSlash(routePath: string): string {
  return routePath.endsWith("/") ? routePath : `${routePath}/`;
}

function addRule(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
  status: 200 | 301 | 302,
): void {
  const rule: StaticRedirectRule = { from, to, status };
  const key = formatRedirectRule(rule);
  if (seen.has(key)) return;
  seen.add(key);
  rules.push(rule);
}

function addDirectRedirect(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
  status: 301 | 302 = 301,
): void {
  addRule(rules, seen, from, to, status);
  addRule(rules, seen, withTrailingSlash(from), withTrailingSlash(to), status);
}

function addNestedRedirect(
  rules: StaticRedirectRule[],
  seen: Set<string>,
  from: string,
  to: string,
): void {
  addDirectRedirect(rules, seen, from, to);
  addRule(rules, seen, `${from}/:splat`, `${to}/:splat`, 301);
}

function readLegacyUrls(rootDir: string): string[] {
  const fixturePath = path.join(rootDir, LEGACY_FIXTURE_RELATIVE_PATH);
  return fs
    .readFileSync(fixturePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildStructuralRedirectRules(): StaticRedirectRule[] {
  const englishPrivateBooking = `/en/${getSlug("privateBooking", "en")}`;
  const rules: StaticRedirectRule[] = [];
  const seen = new Set<string>();

  addDirectRedirect(rules, seen, "/", "/en");
  addDirectRedirect(rules, seen, "/book-dorm-bed", "/en/book-dorm-bed");
  addDirectRedirect(rules, seen, "/book-private-accommodations", englishPrivateBooking);
  addDirectRedirect(rules, seen, "/book-private-accomodations", englishPrivateBooking);
  addDirectRedirect(rules, seen, "/en/book-private-accomodations", englishPrivateBooking);
  addDirectRedirect(rules, seen, "/cookie-policy", "/en/cookie-policy");
  addDirectRedirect(rules, seen, "/privacy-policy", "/en/privacy-policy");
  addRule(rules, seen, "/directions/:slug", "/en/how-to-get-here/:slug", 301);

  addRule(rules, seen, "https://stepfreepositano.com", "/en/private-rooms/", 301);
  addRule(rules, seen, "https://stepfreepositano.com/", "/en/private-rooms/", 301);
  addRule(rules, seen, "https://stepfreepositano.com/*", "/en/private-rooms/:splat", 301);
  addRule(rules, seen, "https://www.stepfreepositano.com", "/en/private-rooms/", 301);
  addRule(rules, seen, "https://www.stepfreepositano.com/", "/en/private-rooms/", 301);
  addRule(rules, seen, "https://www.stepfreepositano.com/*", "/en/private-rooms/:splat", 301);

  addNestedRedirect(rules, seen, "/en/rooms", "/en/dorms");
  addDirectRedirect(rules, seen, "/en/book", "/en/book-dorm-bed");
  addDirectRedirect(rules, seen, "/en/dorms", "/en/book-dorm-bed");
  addDirectRedirect(rules, seen, "/en/private-rooms/book", englishPrivateBooking);
  addDirectRedirect(rules, seen, "/en/apartment/book", englishPrivateBooking);
  addNestedRedirect(rules, seen, "/en/apartment", "/en/private-rooms");
  addDirectRedirect(rules, seen, "/en/dorms/double_room", "/en/private-rooms/double-room");

  for (const [from, to] of [
    ["/de/wohnungen", "/de/privatzimmer"],
    ["/es/apartamentos", "/es/habitaciones-privadas"],
    ["/fr/appartements", "/fr/chambres-privees"],
    ["/it/appartamenti", "/it/camere-private"],
    ["/ja/apaato", "/ja/kojin-heya"],
    ["/ko/apateu", "/ko/gaein-sil"],
    ["/pt/apartamentos", "/pt/quartos-privados"],
    ["/ru/kvartiry", "/ru/chastnye-nomera"],
    ["/zh/gongyu", "/zh/siren-kefang"],
    ["/ar/shuqaq", "/ar/ghuraf-khassa"],
    ["/hi/awas", "/hi/niji-kamre"],
    ["/vi/can-ho", "/vi/phong-rieng"],
    ["/pl/apartamenty", "/pl/pokoje-prywatne"],
    ["/sv/lagenheter", "/sv/privata-rum"],
    ["/no/leiligheter", "/no/private-rom"],
    ["/da/lejligheder", "/da/private-vaerelser"],
    ["/hu/apartmanok", "/hu/privat-szobak"],
  ] as const) {
    addNestedRedirect(rules, seen, from, to);
  }

  return rules;
}

function normalizeLegacyUrls(urls: readonly string[]): string[] {
  return Array.from(
    new Set(
      urls
        .map((url) => url.trim())
        .filter(Boolean)
        .filter((url) => !EXCLUDED_URLS.has(url)),
    ),
  ).sort();
}

function parseLocalizedPath(pathname: string): {
  lang: AppLanguage;
  segments: string[];
} | null {
  const segments = pathname.split("/").filter(Boolean);
  const [lang] = segments;
  if (!lang || !SUPPORTED_LANGUAGES.has(lang as AppLanguage)) return null;

  return {
    lang: lang as AppLanguage,
    segments,
  };
}

function resolveGuideLegacyTarget(
  pathname: string,
  canonicalUrlSet: ReadonlySet<string>,
): string | null {
  const parsed = parseLocalizedPath(pathname);
  if (!parsed || parsed.segments.length < 3) return null;

  const baseSegment = parsed.segments[1];
  const guideBaseKey = GUIDE_BASE_KEY_BY_SEGMENT_BY_LANG.get(parsed.lang)?.get(baseSegment);
  if (!guideBaseKey) return null;

  const legacySlug = parsed.segments.at(-1);
  if (!legacySlug) return null;

  const guideKey =
    resolveGuideKeyFromSlug(legacySlug, parsed.lang) ?? resolveGuideKeyFromSlug(legacySlug, "en");
  if (guideKey) {
    const canonicalGuidePath = guidePath(parsed.lang, guideKey);
    if (canonicalUrlSet.has(canonicalGuidePath)) {
      return canonicalGuidePath;
    }
  }

  return `/${parsed.lang}/${getSlug(guideBaseKey, parsed.lang)}`;
}

function resolveRoomLegacyTarget(pathname: string): string | null {
  const parsed = parseLocalizedPath(pathname);
  if (!parsed || parsed.segments.length !== 3) return null;

  const roomBaseSegments = ROOM_BASE_SEGMENTS_BY_LANG.get(parsed.lang);
  if (!roomBaseSegments?.has(parsed.segments[1])) return null;

  const roomSlug = parsed.segments[2];
  if (roomSlug === "double-room") {
    return `/${parsed.lang}/${getSlug("apartment", parsed.lang)}/${getPrivateRoomChildSlug("double-room", parsed.lang)}`;
  }
  const roomId =
    findRoomIdBySlug(roomSlug, parsed.lang) ??
    (roomsData.some((room) => room.id === roomSlug) ? roomSlug : undefined);
  if (!roomId) return null;
  if (roomId === "double_room") {
    return `/${parsed.lang}/${getSlug("apartment", parsed.lang)}/${getPrivateRoomChildSlug("double-room", parsed.lang)}`;
  }
  if (!websiteVisibleRoomsData.some((room) => room.id === roomId)) {
    return `/${parsed.lang}/${getSlug("rooms", parsed.lang)}`;
  }
  if (NON_DORM_ROOM_IDS.has(roomId)) return null;

  return `/${parsed.lang}/${getSlug("rooms", parsed.lang)}/${getRoomSlug(roomId, parsed.lang)}`;
}

function resolveCanonicalLegacyTarget(
  pathname: string,
  canonicalUrlSet: ReadonlySet<string>,
  redirectTemplateRules: readonly StaticRedirectRule[],
  rewriteTemplateRules: readonly StaticRedirectRule[],
  visited: Set<string> = new Set(),
): string | null {
  if (canonicalUrlSet.has(pathname)) return pathname;
  if (visited.has(pathname)) return null;
  visited.add(pathname);

  const guideTarget = resolveGuideLegacyTarget(pathname, canonicalUrlSet);
  if (guideTarget && guideTarget !== pathname && canonicalUrlSet.has(guideTarget)) return guideTarget;

  const roomTarget = resolveRoomLegacyTarget(pathname);
  if (roomTarget && roomTarget !== pathname && canonicalUrlSet.has(roomTarget)) return roomTarget;

  const redirectTarget =
    resolveRedirectTarget(pathname, redirectTemplateRules) ??
    resolveRedirectTarget(pathname, rewriteTemplateRules);

  if (!redirectTarget || redirectTarget === pathname) return null;
  if (canonicalUrlSet.has(redirectTarget)) return redirectTarget;

  return resolveCanonicalLegacyTarget(
    redirectTarget,
    canonicalUrlSet,
    redirectTemplateRules,
    rewriteTemplateRules,
    visited,
  );
}

function resolveLegacyRedirectEntries(
  legacyUrls: readonly string[],
  canonicalUrls: readonly string[],
): ExactLegacyRedirect[] {
  const canonicalUrlSet = new Set(canonicalUrls);
  const structuralRules = buildStructuralRedirectRules();
  const templateRules = buildLocalizedStaticRedirectRules();
  const redirectTemplateRules = templateRules.filter((rule) => rule.status === 301);
  const rewriteTemplateRules = templateRules.filter((rule) => rule.status === 200);
  const redirects: ExactLegacyRedirect[] = [];
  const seen = new Set<string>();

  for (const legacyUrl of normalizeLegacyUrls(legacyUrls)) {
    if (canonicalUrlSet.has(legacyUrl)) continue;
    if (resolveRedirectTarget(legacyUrl, structuralRules)) continue;

    const target = resolveCanonicalLegacyTarget(
      legacyUrl,
      canonicalUrlSet,
      redirectTemplateRules,
      rewriteTemplateRules,
    );
    if (!target) continue;

    const redirect: ExactLegacyRedirect = {
      from: legacyUrl,
      to: target,
      status: 301,
    };
    const key = formatRedirectRule(redirect);
    if (seen.has(key)) continue;
    seen.add(key);
    redirects.push(redirect);
  }

  return redirects;
}

function buildSupportedPrivateRoomChildAliasRedirects(): ExactLegacyRedirect[] {
  const redirects: ExactLegacyRedirect[] = [];
  const seen = new Set<string>();

  for (const lang of i18nConfig.supportedLngs as AppLanguage[]) {
    const localizedPrivateRoomsBase = `/${lang}/${getSlug("apartment", lang)}`;
    const internalPrivateRoomsBase = `/${lang}/${INTERNAL_SEGMENT_BY_KEY.apartment}`;

    for (const routeId of PRIVATE_ROOM_CHILD_ROUTE_IDS) {
      const canonicalTarget = `${localizedPrivateRoomsBase}/${getPrivateRoomChildSlug(routeId, lang)}`;

      for (const alias of getPrivateRoomChildSlugAliases(routeId, lang)) {
        for (const from of [
          `${localizedPrivateRoomsBase}/${alias}`,
          `${internalPrivateRoomsBase}/${alias}`,
        ]) {
          if (from === canonicalTarget) continue;
          const key = formatRedirectRule({ from, to: canonicalTarget, status: 301 });
          if (seen.has(key)) continue;
          seen.add(key);
          redirects.push({ from, to: canonicalTarget, status: 301 });
        }
      }
    }
  }

  return redirects;
}

export function buildLegacyFunctionRouteConfig(
  redirects: readonly ExactLegacyRedirect[],
): PagesFunctionRouteConfig {
  const include = Array.from(
    new Set(
      [
        ...REQUIRED_FUNCTION_INCLUDE_PATTERNS,
        ...redirects.map(({ from }) => {
          const parts = from.split("/").filter(Boolean);
          if (parts.length === 0) return "/*";
          if (parts.length === 1) return `/${parts[0]}*`;
          return `/*/${parts[1]}*`;
        }),
      ],
    ),
  ).sort();

  const routeCount = include.length;
  if (routeCount > PAGES_FUNCTION_ROUTE_LIMIT) {
    throw new Error(
      `Generated ${routeCount} Pages Function include rules; limit is ${PAGES_FUNCTION_ROUTE_LIMIT}.`,
    );
  }

  return {
    version: 1,
    include,
    exclude: [],
  };
}

export function buildStaticRuntimeArtifacts(rootDir: string = process.cwd()): {
  structuralRules: StaticRedirectRule[];
  exactLegacyRedirects: ExactLegacyRedirect[];
  routeConfig: PagesFunctionRouteConfig;
  legacyUrls: string[];
  canonicalUrls: string[];
} {
  const legacyUrls = readLegacyUrls(rootDir);
  const canonicalUrls = listLocalizedPublicUrls();
  const structuralRules = buildStructuralRedirectRules();
  const exactLegacyRedirects = [
    ...resolveLegacyRedirectEntries(legacyUrls, canonicalUrls),
    ...buildSupportedPrivateRoomChildAliasRedirects(),
  ].sort((a, b) => a.from.localeCompare(b.from));
  const routeConfig = buildLegacyFunctionRouteConfig(exactLegacyRedirects);

  return {
    structuralRules,
    exactLegacyRedirects,
    routeConfig,
    legacyUrls,
    canonicalUrls,
  };
}
