// src/utils/translate-path.ts
//
// Helper that returns the correct slug for a given key + language
// --------------------------------------------------------------------------
import type { AppLanguage } from "../i18n.config";
import { SLUGS, type SlugMap } from "../slug-map";

export function translatePath<K extends keyof SlugMap>(slugKey: K, lang: AppLanguage): string {
  return SLUGS[slugKey][lang];
}
