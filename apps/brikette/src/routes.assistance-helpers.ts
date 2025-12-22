// /src/routes.assistance-helpers.ts
import { ARTICLE_SLUGS } from "./article-slug-map";
import type { AppLanguage } from "./i18n.config";
// Namespace import keeps tests resilient to partial mocks
import * as slugify from "./utils/slugify";

/* -------------------------------------------------------------------------- *
 * Central list of Assistance article keys                                    *
 * -------------------------------------------------------------------------- */
export const ARTICLE_KEYS = Object.freeze([
  "ageAccessibility",
  "bookingBasics",
  "changingCancelling",
  "checkinCheckout",
  "defectsDamages",
  "depositsPayments",
  "rules",
  "security",
  "legal",
  "arrivingByFerry",
  "naplesAirportBus",
  "travelHelp",
] as const);

export type HelpArticleKey = (typeof ARTICLE_KEYS)[number];

export function articleSlug(lang: AppLanguage, key: HelpArticleKey): string {
  const dict = ARTICLE_SLUGS[key];
  const candidate = dict[lang] ?? dict.en;
  type SlugNs = Partial<typeof import("./utils/slugify")>;
  const fn = (slugify as SlugNs).slugifyWithFallback as
    | ((value: string, fallback: string) => string)
    | undefined;
  return fn ? fn(candidate, dict.en) : candidate || dict.en;
}
