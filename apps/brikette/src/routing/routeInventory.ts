// src/routing/routeInventory.ts
// Enumerates all valid App Router URLs without depending on src/compat/*
// This module is used by URL coverage tests and generateStaticParams

import { GUIDES_INDEX } from "@/data/guides.index";
import roomsData from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { listHowToSlugs } from "@/lib/how-to-get-here/definitions";
import { ARTICLE_KEYS, articleSlug } from "@/routes.assistance-helpers";
import { guideSlug } from "@/routes.guides-helpers";
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

    // Dynamic: Guides (experiences)
    const experiencesSlug = getSlug("experiences", lang);
    const publishedGuides = GUIDES_INDEX.filter((g) => g.status === "published");
    for (const guide of publishedGuides) {
      const slug = guideSlug(lang, guide.key);
      urls.push(`/${lang}/${experiencesSlug}/${slug}`);
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

    // Dynamic: How to get here routes
    const howToSlug = getSlug("howToGetHere", lang);
    for (const slug of listHowToSlugs()) {
      urls.push(`/${lang}/${howToSlug}/${slug}`);
    }

    // Dynamic: Assistance articles
    const assistanceSlug = getSlug("assistance", lang);
    for (const key of ARTICLE_KEYS) {
      const slug = articleSlug(lang, key);
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
    guides: langCount * GUIDES_INDEX.filter((g) => g.status === "published").length,
    tags: langCount * new Set(GUIDES_INDEX.flatMap((g) => g.tags)).size,
    howToGetHere: langCount * listHowToSlugs().length,
    assistance: langCount * ARTICLE_KEYS.length,
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
