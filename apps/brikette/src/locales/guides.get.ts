// file path: src/locales/guides.get.ts
// -----------------------------------------------------------------------------
// Retrieve a deep-cloned guides bundle for a locale, with a Vitest safety net.
// -----------------------------------------------------------------------------

import { isTestEnvironment } from "@/utils/env-helpers";

import { getGuidesBundlesMap, getOverridesActiveFlag } from "./guides.state";
import { guidesTestStubBundle } from "./guides.stub";
import type { GuidesNamespace } from "./guides.types";
import { cloneNamespace } from "./guides.util";

export function getGuidesBundle(locale: string): GuidesNamespace | undefined {
  const guidesBundles = getGuidesBundlesMap();
  const bundle = guidesBundles.get(locale);
  if (bundle) return cloneNamespace(bundle);

  // Vitest fallback when loaders haven't hydrated any bundles and no overrides are set.
  if (isTestEnvironment() && guidesBundles.size === 0 && !getOverridesActiveFlag()) {
    return cloneNamespace(guidesTestStubBundle);
  }

  return undefined;
}
