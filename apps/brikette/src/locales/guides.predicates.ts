// file path: src/locales/guides.predicates.ts
// -----------------------------------------------------------------------------
// Predicate helpers for guides locale presence and split detection.
// -----------------------------------------------------------------------------

import { getGuidesBundlesMap, getSplitLocalesSet } from "./guides.state";

export function isSplitGuidesLocale(locale: string): boolean {
  return getSplitLocalesSet().has(locale);
}

export function hasGuidesLocale(locale: string): boolean {
  return getGuidesBundlesMap().has(locale);
}

