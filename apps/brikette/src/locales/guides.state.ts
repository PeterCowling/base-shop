// file path: src/locales/guides.state.ts
// -----------------------------------------------------------------------------
// State building, caching and lifecycle management for guides bundles.
// -----------------------------------------------------------------------------

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] module loader patterns are not user-facing */
import type {
  GuidesNamespace,
  GuidesState,
  GlobalGuidesState,
  JsonModule,
  ModuleOverrides,
  ModuleRecord,
  PartialGuidesNamespace,
} from "./guides.types";

import { assignNestedValue, finaliseSplitBundle, normalisePathSegments, readModule } from "./guides.util";
import { loadGuidesModuleOverridesFromFs, loadGuidesModuleOverridesFromFsSync } from "./guides.fs";
import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "../utils/webpackGlob";

// Avoid the unsafe `Function` type; we only need to check presence
// of a callable webpack context at runtime.
export const supportsImportMetaGlob = supportsWebpackGlob;

function buildGuidesState(overrides?: ModuleOverrides): GuidesState {
  // Only use import.meta.glob when it's available in this runtime
  // and no explicit module overrides were provided.
  const shouldUseRealModules = overrides === undefined && supportsImportMetaGlob;
  const hasLegacyOverride = overrides ? "legacy" in overrides : false;
  const hasSplitGlobalOverride = overrides ? "splitGlobal" in overrides : false;
  const hasSplitContentOverride = overrides ? "splitContent" in overrides : false;

  const legacyModules: ModuleRecord<GuidesNamespace> = hasLegacyOverride
    ? overrides?.legacy ?? ({} as ModuleRecord<GuidesNamespace>)
    : (shouldUseRealModules
      ? (webpackContextToRecord<GuidesNamespace>(
          getWebpackContext("./", true, /guides\\.json$/)
        ) as ModuleRecord<GuidesNamespace>)
        : ({} as ModuleRecord<GuidesNamespace>));

  const splitGlobalModules: ModuleRecord = hasSplitGlobalOverride
    ? overrides?.splitGlobal ?? ({} as ModuleRecord)
    : shouldUseRealModules
      ? webpackContextToRecord(
          getWebpackContext("./", true, /guides\/.*\\.json$/)
        )
      : ({} as ModuleRecord);

  const splitContentModules: ModuleRecord = hasSplitContentOverride
    ? overrides?.splitContent ?? ({} as ModuleRecord)
    : shouldUseRealModules
      ? webpackContextToRecord(
          getWebpackContext("./", true, /guides\/content\/[^/]+\\.json$/)
        )
      : ({} as ModuleRecord);

  const legacyBundles = new Map<string, GuidesNamespace>();
  const splitBundles = new Map<string, PartialGuidesNamespace>();

  function getSplitBundle(locale: string): PartialGuidesNamespace {
    const existing = splitBundles.get(locale);
    if (existing) return existing;
    const created: PartialGuidesNamespace = {
      content: {},
    };
    splitBundles.set(locale, created);
    return created;
  }

  for (const [path, mod] of Object.entries(legacyModules)) {
    const segments = normalisePathSegments(path);
    if (segments.length < 2) continue;
    const locale = segments[0];
    if (!locale) continue;
    const data = readModule<GuidesNamespace>(mod as JsonModule<GuidesNamespace>);
    legacyBundles.set(locale, data);
  }

  for (const [path, mod] of Object.entries(splitGlobalModules)) {
    const segments = normalisePathSegments(path);
    if (segments.length < 3) continue;
    const locale = segments[0];
    if (!locale) continue;
    if (segments[1] !== "guides") continue;
    const relativeSegments = segments.slice(2);
    if (relativeSegments.length === 0) continue;
    if (relativeSegments[0] === "content") continue;
    if (relativeSegments[0] === "content.json") continue;
    const bundle = getSplitBundle(locale);
    assignNestedValue(bundle, relativeSegments, readModule(mod));
  }

  for (const [path, mod] of Object.entries(splitContentModules)) {
    const segments = normalisePathSegments(path);
    if (segments.length < 4) continue;
    const locale = segments[0];
    const fileName = segments[3];
    if (!locale || !fileName) continue;
    const slug = fileName.replace(/\.json$/u, "");
    if (!slug) continue;
    const bundle = getSplitBundle(locale);
    bundle.content[slug] = readModule(mod);
  }

  const splitLocales = new Set(splitBundles.keys());
  const guidesBundles = new Map<string, GuidesNamespace>();

  for (const [locale, data] of legacyBundles.entries()) {
    guidesBundles.set(locale, data);
  }

  for (const [locale, bundle] of splitBundles.entries()) {
    guidesBundles.set(locale, finaliseSplitBundle(bundle));
  }

  return { guidesBundles, splitLocales } satisfies GuidesState;
}

// Persist expensive FS-derived data across Vitest module resets by caching on globalThis.
// This avoids re-walking the entire locales tree for every test case that calls
// vi.resetModules(), which otherwise causes significant overhead and timeouts.
const GLOBAL_STATE_KEY = "__app_guides_state_v1__";
const GLOBAL_OVERRIDES_KEY = "__app_guides_overrides_v1__";

let overridesActive = false;
let initialModuleOverrides: ModuleOverrides | undefined;
let guidesBundles: Map<string, GuidesNamespace>;
let splitLocales: Set<string>;

function setGlobalState(state: GlobalGuidesState): void {
  (globalThis as unknown as Record<string, unknown>)[GLOBAL_STATE_KEY] = state as unknown;
}

function getGlobalState(): GlobalGuidesState | undefined {
  const value = (globalThis as unknown as Record<string, unknown>)[GLOBAL_STATE_KEY];
  if (!value || typeof value !== "object") return undefined;
  const state = value as Partial<GlobalGuidesState>;
  if (!(state.guidesBundles instanceof Map) || !(state.splitLocales instanceof Set)) {
    return undefined;
  }
  return state as GlobalGuidesState;
}

// Compute initial overrides only once per process when import.meta.glob is unavailable.
// Avoid top-level await to keep the browser build target at "es2020".
if (!supportsImportMetaGlob) {
  const globalRecord = globalThis as unknown as Record<string, unknown>;
  const cached = globalRecord[GLOBAL_OVERRIDES_KEY] as ModuleOverrides | undefined;
  if (cached) {
    initialModuleOverrides = cached;
  } else {
    // Prefer a synchronous scan in Node/Vitest to avoid races where tests
    // access getGuidesBundle() before the async warmup completes.
    const syncOverrides = loadGuidesModuleOverridesFromFsSync();
    if (syncOverrides) {
      initialModuleOverrides = syncOverrides;
      globalRecord[GLOBAL_OVERRIDES_KEY] = syncOverrides as unknown;
    } else {
      // Warm the global cache asynchronously for non-Vite Node contexts (tests/scripts).
      // This does not block module initialisation in the browser bundle.
      void loadGuidesModuleOverridesFromFs().then((overrides) => {
        globalRecord[GLOBAL_OVERRIDES_KEY] = overrides as unknown;
        if (initialModuleOverrides === undefined) {
          initialModuleOverrides = overrides;
        }
      });
    }
  }
}

export function resetGuidesState(overrides?: ModuleOverrides): void {
  const base = overrides ?? initialModuleOverrides;
  const existing = !overrides ? getGlobalState() : undefined;
  if (existing) {
    guidesBundles = existing.guidesBundles;
    splitLocales = existing.splitLocales;
    overridesActive = Boolean(overrides);
    return;
  }
  const state = buildGuidesState(base);
  guidesBundles = state.guidesBundles;
  splitLocales = state.splitLocales;
  overridesActive = Boolean(overrides);
  setGlobalState({ guidesBundles, splitLocales });
}

// Initialise the state on module load.
resetGuidesState(initialModuleOverrides);

// Accessors used by the public API
export function getGuidesBundlesMap(): Map<string, GuidesNamespace> {
  return guidesBundles;
}

export function getSplitLocalesSet(): Set<string> {
  return splitLocales;
}

export function getOverridesActiveFlag(): boolean {
  return overridesActive;
}
