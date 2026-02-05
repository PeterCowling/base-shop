// src/locales/guides.backend.ts
// ---------------------------------------------------------------------------
// Guides namespace backend resolver.
//
// Import this module dynamically from i18n backends / loadI18nNs so the heavy
// guides module discovery (webpack contexts for guides/**) is not reachable
// from the always-on layout bundle.
// ---------------------------------------------------------------------------

import { getGuidesBundle, type GuidesNamespace } from "./guides";
import { loadGuidesNamespaceFromImports } from "./guides.imports";

type GuidesBackendOptions = {
  canUseNodeFs: boolean;
};

export async function loadGuidesNamespace(
  lng: string,
  options: GuidesBackendOptions,
): Promise<GuidesNamespace | undefined> {
  const { canUseNodeFs } = options;

  // Prefer the Node FS loader when running under Node (tests/scripts) to avoid
  // races where module discovery hasn't hydrated yet.
  if (canUseNodeFs) {
    try {
      const { loadGuidesNamespaceFromFs } = await import("@/locales/_guides/node-loader");
      const fromFs = loadGuidesNamespaceFromFs(lng);
      if (fromFs) return fromFs;
    } catch {
      // Fall through to other strategies below.
    }
  }

  const bundle = getGuidesBundle(lng);
  if (bundle) return bundle;

  try {
    const imported = await loadGuidesNamespaceFromImports(lng);
    if (imported) return imported;
  } catch {
    // ignore and return undefined
  }

  return undefined;
}

