import type { ResolvedMatch } from "@/compat/route-runtime";
import { ARTICLE_KEYS } from "@/routes.assistance-helpers";
import { GUIDE_KEYS, guideComponentPath, guideNamespace } from "@/guides/slugs";
import { GUIDES_INDEX, EXPERIENCES_GUIDES, HELP_GUIDES, type GuideMeta } from "@/data/guides.index";
import { IS_PROD } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";

const BASE_NAMESPACES = [
  "_tokens",
  "translation",
  "header",
  "footer",
  "notificationBanner",
  "modals",
] as const;

const GUIDE_NAMESPACES = ["guides", "guidesFallback", "guides.tags"] as const;
const GUIDE_TAG_NAMESPACES = ["guides", "guides.tags"] as const;
const GUIDE_TAG_ROUTE_FILES = new Set([
  "tags.index.tsx", // i18n-exempt -- TECH-000 [ttl=2026-12-31] Route module filename.
  "tags.$tag.tsx", // i18n-exempt -- TECH-000 [ttl=2026-12-31] Route module filename.
]);

const ASSISTANCE_HUB_NAMESPACES = [
  "assistanceSection",
  "assistance",
  "assistanceCommon",
  "faq",
  "howToGetHere",
  "experiencesPage",
  "guides",
] as const;

const ASSISTANCE_ARTICLE_NAMESPACES = ["assistanceCommon", "guides"] as const;
const ASSISTANCE_HUB_EXTRA_GUIDE_KEYS = ["backpackerItineraries", "onlyHostel"] as const;
const ASSISTANCE_ARTICLE_DEFAULT_GUIDE_KEYS = ["backpackerItineraries", "onlyHostel"] as const;
const ASSISTANCE_ARTICLE_GUIDE_KEYS_BY_ARTICLE: Record<string, readonly string[]> = {
  arrivingByFerry: ["ferrySchedules", "reachBudget"],
  travelHelp: ["reachBudget", "ferrySchedules"],
  security: ["reachBudget", "ferrySchedules", "pathOfTheGods", "backpackerItineraries", "onlyHostel"],
  ageAccessibility: ["reachBudget", "ferrySchedules", "pathOfTheGods", "backpackerItineraries", "onlyHostel"],
};
const HOME_GUIDE_KEYS = [
  "onlyHostel",
  "reachBudget",
  "pathOfTheGods",
  "backpackerItineraries",
] as const;

const PAGE_NAMESPACE_BY_ROUTE: Record<string, readonly string[]> = {
  "routes/home.tsx": ["landingPage", "roomsPage", "ratingsBar", "guides", "testimonials", "faq"],
  "routes/about.tsx": ["aboutPage"],
  "routes/apartment.tsx": ["apartmentPage"],
  "routes/bar-menu.tsx": ["barMenuPage", "menus"],
  "routes/book.tsx": ["bookPage"],
  "routes/breakfast-menu.tsx": ["breakfastMenuPage", "menus"],
  "routes/careers.tsx": ["careersPage"],
  "routes/not-found.tsx": ["notFoundPage"],
  "routes/terms.tsx": ["termsPage"],
  "routes/house-rules.tsx": ["houseRulesPage"],
  "routes/experiences.tsx": ["experiencesPage", "guides", "guides.tags"],
  "routes/how-to-get-here.tsx": ["howToGetHere"],
  /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Route module filename. */
  "routes/how-to-get-here.$slug.tsx": ["howToGetHere", "header", "guides", "guidesFallback"],
  "routes/rooms.tsx": [
    "roomsPage",
    "ratingsBar",
    "modals",
    "guides",
    "assistanceCommon",
    "dealsPage",
  ],
  /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Route module filename. */
  "routes/rooms.$id.tsx": ["roomsPage", "rooms", "pages.rooms", "guides", "dealsPage", "modals"],
  "routes/deals.tsx": ["dealsPage", "modals"],
};

const SECTION_NAMESPACE_BY_KEY: Record<string, readonly string[]> = {
  experiences: ["experiencesPage", "guides", "guides.tags"],
  howToGetHere: ["howToGetHere"],
  rooms: ["roomsPage", "ratingsBar", "modals", "guides", "assistanceCommon", "dealsPage"],
  deals: ["dealsPage", "modals"],
};

const toArticleFileBase = (key: string): string =>
  key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const ARTICLE_NAMESPACE_BY_FILE = new Map<string, string>(
  (ARTICLE_KEYS as readonly string[]).map((key) => [toArticleFileBase(key), key]),
);

const addNamespaces = (target: Set<string>, items: readonly string[]) => {
  for (const item of items) {
    target.add(item);
  }
};

const GUIDE_KEY_BY_ROUTE_FILE = new Map<string, string>(
  GUIDE_KEYS.map((key) => [guideComponentPath(key), key]),
);

const GUIDE_ORDER = new Map(GUIDES_INDEX.map((guide, index) => [guide.key, index]));
const shouldIncludeGuide = (guide: GuideMeta): boolean =>
  !IS_PROD || (guide.status !== "draft" && guide.status !== "review");

const EXPERIENCE_GUIDE_SUMMARY_KEYS = (() => {
  const base = EXPERIENCES_GUIDES.filter(shouldIncludeGuide);
  const experienceKeys = new Set(base.map((guide) => guide.key));
  const beachesHelpGuides = HELP_GUIDES.filter((guide) =>
    guide.tags.some((tag) => tag.toLowerCase() === "beaches"),
  ).filter(shouldIncludeGuide);
  const extras = beachesHelpGuides.filter((guide) => !experienceKeys.has(guide.key));
  const combined = [...base, ...extras];
  combined.sort((a, b) => {
    const aIndex = GUIDE_ORDER.get(a.key) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = GUIDE_ORDER.get(b.key) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
  return combined.map((guide) => guide.key);
})();

const buildHelpGuideSummaryKeys = (lang: AppLanguage): string[] =>
  HELP_GUIDES.filter(shouldIncludeGuide)
    .filter((guide) => guideNamespace(lang, guide.key).baseKey !== "howToGetHere")
    .map((guide) => guide.key);

const buildAssistanceHubGuideLabelKeys = (lang: AppLanguage): string[] => {
  const keys = new Set(buildHelpGuideSummaryKeys(lang));
  for (const key of ASSISTANCE_HUB_EXTRA_GUIDE_KEYS) {
    keys.add(key);
  }
  return Array.from(keys);
};

const buildAssistanceArticleGuideLabelKeys = (articleKey: string): string[] => {
  const keys = new Set<string>(ASSISTANCE_ARTICLE_DEFAULT_GUIDE_KEYS);
  const extras = ASSISTANCE_ARTICLE_GUIDE_KEYS_BY_ARTICLE[articleKey] ?? [];
  for (const key of extras) {
    keys.add(key);
  }
  return Array.from(keys);
};

export const resolveNamespacesForMatches = (matches: ResolvedMatch[]): string[] => {
  const namespaces = new Set<string>(BASE_NAMESPACES);
  const matchFiles = matches.map((match) => match.file).filter(Boolean);
  const leafFile = matchFiles[matchFiles.length - 1] ?? "";

  const directNamespaces = PAGE_NAMESPACE_BY_ROUTE[leafFile];
  if (directNamespaces) {
    addNamespaces(namespaces, directNamespaces);
  }

  // How-to guides (built on GuideSeoTemplate) live under `routes/how-to-get-here/*`.
  // These routes aren't part of the `routes/guides/*` tree, but they still need
  // guide namespaces (and assistanceCommon) for SSR payload hydration.
  if (leafFile.startsWith("routes/how-to-get-here/")) {
    addNamespaces(namespaces, GUIDE_NAMESPACES);
    namespaces.add("assistanceCommon");
  }

  if (matchFiles.includes("routes/assistance/layout.tsx")) {
    namespaces.add("assistanceCommon");
  }

  if (leafFile === "routes/assistance.tsx") {
    addNamespaces(namespaces, ASSISTANCE_HUB_NAMESPACES);
  }

  if (leafFile.startsWith("routes/assistance/") && leafFile !== "routes/assistance/layout.tsx") {
    addNamespaces(namespaces, ASSISTANCE_ARTICLE_NAMESPACES);
    const fileName = leafFile.split("/").pop() ?? "";
    const base = fileName.replace(/\.tsx$/u, "");
    const articleNamespace = ARTICLE_NAMESPACE_BY_FILE.get(base);
    if (articleNamespace) {
      namespaces.add(articleNamespace);
    }
  }

  if (leafFile.startsWith("routes/guides/")) {
    const fileName = leafFile.split("/").pop() ?? "";
    if (fileName === "legacy-redirect.tsx") {
      // Redirect-only route; no guide namespaces required.
    } else if (fileName === "draft.index.tsx") {
      // Editorial dashboard is hardcoded in English; no guide namespaces required.
    } else if (GUIDE_TAG_ROUTE_FILES.has(fileName)) {
      addNamespaces(namespaces, GUIDE_TAG_NAMESPACES);
    } else {
      addNamespaces(namespaces, GUIDE_NAMESPACES);
    }
  }

  return Array.from(namespaces);
};

export const resolveNamespacesForRouteFile = (file: string): string[] =>
  resolveNamespacesForMatches([{ file } as ResolvedMatch]);

export const resolveNamespacesForSectionKey = (sectionKey: string): string[] => {
  const namespaces = new Set<string>(BASE_NAMESPACES);
  const extras = SECTION_NAMESPACE_BY_KEY[sectionKey];
  if (extras) {
    addNamespaces(namespaces, extras);
  }
  return Array.from(namespaces);
};

export const resolveGuideContentKeysForMatches = (matches: ResolvedMatch[]): string[] => {
  const keys = new Set<string>();

  for (const match of matches) {
    const fileKey = match.file ? GUIDE_KEY_BY_ROUTE_FILE.get(match.file) : undefined;
    if (fileKey) {
      keys.add(fileKey);
    }

    const data = match.data as { guide?: unknown; showChiesaNuovaDetails?: unknown } | undefined;
    if (data && typeof data.guide === "string") {
      keys.add(data.guide);
    }
    if (data?.showChiesaNuovaDetails === true) {
      keys.add("chiesaNuovaArrivals");
    }
  }

  return Array.from(keys);
};

export const resolveGuideSummaryKeysForMatches = (
  matches: ResolvedMatch[],
  lang: AppLanguage,
): string[] => {
  const matchFiles = matches.map((match) => match.file).filter(Boolean);
  const leafFile = matchFiles[matchFiles.length - 1] ?? "";

  if (leafFile === "routes/experiences.tsx") {
    return [...EXPERIENCE_GUIDE_SUMMARY_KEYS];
  }

  if (leafFile === "routes/home.tsx") {
    return [...HOME_GUIDE_KEYS];
  }

  if (leafFile === "routes/assistance.tsx") {
    return buildHelpGuideSummaryKeys(lang);
  }

  return [];
};

export const resolveGuideSummaryKeysForRouteFile = (
  file: string,
  lang: AppLanguage,
): string[] =>
  resolveGuideSummaryKeysForMatches([{ file } as ResolvedMatch], lang);

export const resolveGuideLabelKeysForMatches = (
  matches: ResolvedMatch[],
  lang: AppLanguage,
): string[] | undefined => {
  const matchFiles = matches.map((match) => match.file).filter(Boolean);
  const leafFile = matchFiles[matchFiles.length - 1] ?? "";

  if (leafFile === "routes/assistance.tsx") {
    return buildAssistanceHubGuideLabelKeys(lang);
  }

  if (leafFile === "routes/home.tsx") {
    return [...HOME_GUIDE_KEYS];
  }

  if (leafFile.startsWith("routes/assistance/") && leafFile !== "routes/assistance/layout.tsx") {
    const fileName = leafFile.split("/").pop() ?? "";
    const base = fileName.replace(/\.tsx$/u, "");
    const articleKey = ARTICLE_NAMESPACE_BY_FILE.get(base);
    if (articleKey) {
      return buildAssistanceArticleGuideLabelKeys(articleKey);
    }
  }

  // i18n-exempt -- ABC-123 [ttl=2026-01-31] route filename
  if (leafFile === "routes/how-to-get-here.$slug.tsx") {
    return [];
  }

  return undefined;
};

export const resolveGuideLabelKeysForRouteFile = (
  file: string,
  lang: AppLanguage,
): string[] | undefined =>
  resolveGuideLabelKeysForMatches([{ file } as ResolvedMatch], lang);
