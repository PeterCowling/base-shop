// src/utils/slug.ts
import type { AppLanguage } from "../i18n.config";
import { type SlugMap,SLUGS } from "../slug-map";

import { toAppLanguage } from "./lang";

/** Type-safe slug lookup. */
export function getSlug<K extends keyof SlugMap>(key: K, lang: AppLanguage): string {
  return SLUGS[key][lang];
}

/** Safe slug lookup from an arbitrary language candidate. */
export function safeSlug<K extends keyof SlugMap>(key: K, langCandidate: string | undefined): string {
  const lang = toAppLanguage(langCandidate);
  return SLUGS[key][lang];
}
