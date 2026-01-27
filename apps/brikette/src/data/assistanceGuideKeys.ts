// src/data/assistanceGuideKeys.ts
// Canonical list of guide keys that belong to the assistance/help-centre area.
// Derived from ASSISTANCE_TAGS to maintain a single source of truth.

import type { GuideKey } from "@/guides/slugs";

import { ASSISTANCE_TAGS } from "./assistance.tags";

// Extract keys from ASSISTANCE_TAGS and validate they are GuideKeys.
// This ensures the list stays in sync with the tag mapping.
const ASSISTANCE_KEYS_RAW = Object.keys(ASSISTANCE_TAGS) as string[];

// Build the typed, frozen array. The cast is safe because ASSISTANCE_TAGS
// keys must be valid GuideKeys (enforced by the HelpArticleKey → GuideKey migration).
export const ASSISTANCE_GUIDE_KEYS: readonly GuideKey[] = Object.freeze(
  ASSISTANCE_KEYS_RAW as GuideKey[],
);

// Set for O(1) lookups
const ASSISTANCE_GUIDE_KEY_SET = new Set<string>(ASSISTANCE_GUIDE_KEYS);

/**
 * Type guard to check if a string is a valid assistance guide key.
 */
export function isAssistanceGuideKey(value: string): value is GuideKey {
  return ASSISTANCE_GUIDE_KEY_SET.has(value);
}
