// src/utils/slug.ts
import { SLUGS, type SlugMap } from "../slug-map";
import type { AppLanguage } from "@ui/i18n.config";
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
