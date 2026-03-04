// src/utils/translate-path.ts
//
// Helper that returns the correct slug for a given key + language
// --------------------------------------------------------------------------
import type { AppLanguage } from "../i18n.config";
import { type SlugMap,SLUGS } from "../slug-map";

const CANONICAL_SEGMENT_BY_KEY: Readonly<Record<keyof SlugMap, string>> = {
  rooms: "dorms",
  deals: "deals",
  careers: "careers",
  about: "about",
  assistance: "assistance",
  experiences: "experiences",
  howToGetHere: "how-to-get-here",
  apartment: "private-rooms",
  book: "book",
  guides: "guides",
  guidesTags: "tags",
  terms: "terms",
  breakfastMenu: "breakfast-menu",
  barMenu: "bar-menu",
};

export function translatePath<K extends keyof SlugMap>(slugKey: K, lang: AppLanguage): string {
  const canonical = CANONICAL_SEGMENT_BY_KEY[slugKey];
  if (canonical) return canonical;
  return SLUGS[slugKey][lang];
}
