// src/routing/routeInventory.ts
// Enumerates all valid App Router URLs without depending on src/compat/*
// This module is used by URL coverage tests and generateStaticParams
//
// IMPORTANT: Keep imports minimal to avoid env config dependencies in tests.
// Prefer direct JSON imports and simple data files over complex modules.

import { getRoomSlug } from "@acme/ui/config/roomSlugs";

import { ASSISTANCE_GUIDES, GUIDES_INDEX } from "@/data/guides.index";
import { HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS } from "@/data/how-to-get-here/routeGuides";
import { websiteVisibleRoomsData } from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { guideNamespace, guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { INTERNAL_SEGMENT_BY_KEY, STATIC_EXPORT_SECTION_KEYS } from "@/routing/sectionSegments";

const NON_DORM_ROOM_IDS = new Set(["double_room", "apartment"]);

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
    for (const key of STATIC_EXPORT_SECTION_KEYS) {
      urls.push(`/${lang}/${INTERNAL_SEGMENT_BY_KEY[key]}`);
    }

    // Draft dashboard (internal editorial route)
    urls.push(`/${lang}/draft`);
    urls.push(`/${lang}/book-private-accommodations`);

    // Dynamic: Rooms
    const roomsSlug = INTERNAL_SEGMENT_BY_KEY.rooms;
    for (const room of websiteVisibleRoomsData.filter((candidate) => !NON_DORM_ROOM_IDS.has(candidate.id))) {
      urls.push(`/${lang}/${roomsSlug}/${getRoomSlug(room.id, lang)}`);
    }

    // Dynamic: Guides (namespace-aware)
    const publishedGuides = GUIDES_INDEX.filter((g) => g.status === "live");
    for (const guide of publishedGuides) {
      const base = guideNamespace(lang, guide.key);
      const slug = guideSlug(lang, guide.key);
      // Keep only guide slugs that resolve back to the same key.
      // This avoids sitemap entries for non-roundtrip slugs that render notFound.
      if (resolveGuideKeyFromSlug(slug, lang) !== guide.key) continue;
      urls.push(`/${lang}/${INTERNAL_SEGMENT_BY_KEY[base.baseKey]}/${slug}`);
    }

    // Dynamic: Guide tags
    const allTags = new Set<string>();
    for (const guide of publishedGuides) {
      for (const tag of guide.tags) {
        allTags.add(tag);
      }
    }
    const experiencesSlug = INTERNAL_SEGMENT_BY_KEY.experiences;
    const tagsSlug = INTERNAL_SEGMENT_BY_KEY.guidesTags;
    for (const tag of allTags) {
      urls.push(`/${lang}/${experiencesSlug}/${tagsSlug}/${encodeURIComponent(tag)}`);
    }

    // NOTE: How-to-get-here routes are now enumerated via GUIDES_INDEX (TASK-04/TASK-05).
    // They have section="help" but baseKey="howToGetHere", so guidePath() produces
    // the correct URL format: /{lang}/how-to-get-here/{slug}
  }

  // Keep ordering stable while guaranteeing uniqueness (coverage tests depend on this).
  return Array.from(new Set(urls));
}

/**
 * Get count of all App Router URLs by category
 */
export function getUrlCounts(): Record<string, number> {
  const langs = i18nConfig.supportedLngs as AppLanguage[];
  const langCount = langs.length;
  const dormRoomCount = websiteVisibleRoomsData.filter((room) => !NON_DORM_ROOM_IDS.has(room.id)).length;

  return {
    home: langCount,
    staticSections: langCount * STATIC_EXPORT_SECTION_KEYS.length,
    draft: langCount,
    privateBook: langCount,
    rooms: langCount * dormRoomCount,
    // NOTE: guides count now includes how-to-get-here routes (via GUIDES_INDEX)
    guides: langCount * GUIDES_INDEX.filter((g) => g.status === "live").length,
    tags: langCount * new Set(GUIDES_INDEX.flatMap((g) => g.tags)).size,
    // howToGetHere now enumerated from guide key list (TASK-05)
    howToGetHere: langCount * HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.length,
    assistance: langCount * ASSISTANCE_GUIDES.filter((g) => g.status === "live").length,
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
