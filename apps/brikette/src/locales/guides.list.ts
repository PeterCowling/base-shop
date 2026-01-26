// file path: src/locales/guides.list.ts
// -----------------------------------------------------------------------------
// Enumerate available guides locales with a stable Vitest fallback.
// -----------------------------------------------------------------------------

import { isTestEnvironment } from "@/utils/env-helpers";

import { i18nConfig } from "../i18n.config";

import { getGuidesBundlesMap, getOverridesActiveFlag } from "./guides.state";

export function listGuidesLocales(): string[] {
  const guidesBundles = getGuidesBundlesMap();
  // In Vitest, `import.meta.glob` may not eagerly hydrate JSON modules.
  if (guidesBundles.size === 0 && isTestEnvironment() && !getOverridesActiveFlag()) {
    return Array.from(i18nConfig.supportedLngs).sort();
  }
  return Array.from(guidesBundles.keys()).sort();
}
