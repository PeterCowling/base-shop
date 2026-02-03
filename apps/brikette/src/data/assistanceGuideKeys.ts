import type { GuideKey } from "@/guides/slugs";

import { ASSISTANCE_GUIDES } from "./guides.index";

/**
 * Canonical list of guide keys that live under the "assistance" namespace.
 *
 * This intentionally derives from `ASSISTANCE_GUIDES` to keep a single source of truth.
 */
export const ASSISTANCE_GUIDE_KEYS = Object.freeze(
  ASSISTANCE_GUIDES.map((guide) => guide.key),
) as ReadonlyArray<GuideKey>;

