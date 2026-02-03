// src/routing/routeInventory.ts
// Enumerates all valid App Router URLs without depending on src/compat/*
// This module is used by URL coverage tests and generateStaticParams
//
// IMPORTANT: Keep imports minimal to avoid env config dependencies in tests.
// Prefer direct JSON imports and simple data files over complex modules.

import { ASSISTANCE_GUIDES, GUIDES_INDEX } from "@/data/guides.index";
import { HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS } from "@/data/how-to-get-here/routeGuides";
import roomsData from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { guidePath, guideSlug } from "@/routes.guides-helpers";
import type { SlugKey } from "@/types/slugs";
import { getSlug } from "@/utils/slug";

/** Static sections with localized slugs (routes without additional dynamic segments) */
const STATIC_SECTIONS: SlugKey[] = [
  "about",
  "rooms",
  "deals",
  "careers",
  "breakfastMenu",
  "barMenu",
  "terms",
  "houseRules",
  "privacyPolicy",
  "cookiePolicy",
  "assistance",
  "experiences",
  "howToGetHere",
  "book",
  "apartment",
];

/**
 * Lists all valid App Router URLs for the brikette app.
 * This replaces the compat shim's `listLocalizedPaths()` for testing
 * and ensures URL coverage without depending on legacy code.
 */
export function listAppRouterUrls(): string[] {
  const langs = i18nConfig.supportedLngs as AppLanguage[];
  const urls: string[] = [];

  for (const lang of langs) {
    // Home page
    urls.push(`/${lang}`);

    // Static sections (with localized slugs)
    for (const key of STATIC_SECTIONS) {
      urls.push(`/${lang}/${getSlug(key, lang)}`);
    }

    // Draft dashboard (internal editorial route)
    urls.push(`/${lang}/draft`);

    // Dynamic: Rooms
    const roomsSlug = getSlug("rooms", lang);
    for (const room of roomsData) {
      urls.push(`/${lang}/${roomsSlug}/${room.id}`);
    }

    // Dynamic: Guides (namespace-aware)
    const experiencesSlug = getSlug("experiences", lang);
    const publishedGuides = GUIDES_INDEX.filter((g) => g.status === "published");
    for (const guide of publishedGuides) {
      urls.push(guidePath(lang, guide.key));
    }

    // Dynamic: Guide tags
    const allTags = new Set<string>();
    for (const guide of GUIDES_INDEX) {
      for (const tag of guide.tags) {
        allTags.add(tag);
      }
    }
    const tagsSlug = getSlug("guidesTags", lang);
    for (const tag of allTags) {
      urls.push(`/${lang}/${experiencesSlug}/${tagsSlug}/${encodeURIComponent(tag)}`);
    }

    // NOTE: How-to-get-here routes are now enumerated via GUIDES_INDEX (TASK-04/TASK-05).
    // They have section="help" but baseKey="howToGetHere", so guidePath() produces
    // the correct URL format: /{lang}/how-to-get-here/{slug}

    // Dynamic: Assistance guides (converted from legacy articles)
    const assistanceSlug = getSlug("assistance", lang);
    const publishedAssistanceGuides = ASSISTANCE_GUIDES.filter((g) => g.status === "published");
    for (const guide of publishedAssistanceGuides) {
      const slug = guideSlug(lang, guide.key);
      urls.push(`/${lang}/${assistanceSlug}/${slug}`);
    }
  }

  return urls;
}

/**
 * Get count of all App Router URLs by category
 */
export function getUrlCounts(): Record<string, number> {
  const langs = i18nConfig.supportedLngs as AppLanguage[];
  const langCount = langs.length;

  return {
    home: langCount,
    staticSections: langCount * STATIC_SECTIONS.length,
    draft: langCount,
    rooms: langCount * roomsData.length,
    // NOTE: guides count now includes how-to-get-here routes (via GUIDES_INDEX)
    guides: langCount * GUIDES_INDEX.filter((g) => g.status === "published").length,
    tags: langCount * new Set(GUIDES_INDEX.flatMap((g) => g.tags)).size,
    // howToGetHere now enumerated from guide key list (TASK-05)
    howToGetHere: langCount * HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.length,
    assistance: langCount * ASSISTANCE_GUIDES.filter((g) => g.status === "published").length,
    total: listAppRouterUrls().length,
  };
}

/**
 * Check if a URL is valid in the App Router
 */
export function isValidAppRouterUrl(url: string): boolean {
  const allUrls = new Set(listAppRouterUrls());
  return allUrls.has(url);
}
