// src/utils/translate-path.ts
//
// Helper that returns the localized slug for a given key + language
// --------------------------------------------------------------------------
import type { AppLanguage } from "../i18n.config";
import type { SlugMap } from "../slug-map";

import { getSlug } from "./slug";

export function translatePath<K extends keyof SlugMap>(slugKey: K, lang: AppLanguage): string {
  return getSlug(slugKey, lang);
}
