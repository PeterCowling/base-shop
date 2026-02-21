// file path: src/locales/guides.state.ts
// -----------------------------------------------------------------------------
// State building, caching and lifecycle management for guides bundles.
// -----------------------------------------------------------------------------

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] module loader patterns are not user-facing */
import type {
  GlobalGuidesState,
  GuidesNamespace,
  GuidesState,
  JsonModule,
  ModuleOverrides,
  ModuleRecord,
  PartialGuidesNamespace,
} from "./guides.types";
import { assignNestedValue, finaliseSplitBundle, normalisePathSegments, readModule } from "./guides.util";

// Typed accessor for globalThis storage keys (avoids repeated as unknown as casts)
const globalRecord = globalThis as unknown as Record<string, unknown>;

// eslint-disable-next-line complexity -- BRIK-2145 [ttl=2026-12-31] Existing bundle-normalisation logic is intentionally consolidated; refactor is out of scope for this Turbopack hardening patch.
function buildGuidesState(overrides?: ModuleOverrides): GuidesState {
  const hasLegacyOverride = overrides ? "legacy" in overrides : false;
  const hasSplitGlobalOverride = overrides ? "splitGlobal" in overrides : false;
  const hasSplitContentOverride = overrides ? "splitContent" in overrides : false;

  const legacyModules: ModuleRecord<GuidesNamespace> = hasLegacyOverride
    ? overrides?.legacy ?? ({} as ModuleRecord<GuidesNamespace>)
    : ({} as ModuleRecord<GuidesNamespace>);

  const splitGlobalModules: ModuleRecord = hasSplitGlobalOverride
    ? overrides?.splitGlobal ?? ({} as ModuleRecord)
    : ({} as ModuleRecord);

  const splitContentModules: ModuleRecord = hasSplitContentOverride
    ? overrides?.splitContent ?? ({} as ModuleRecord)
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
  globalRecord[GLOBAL_STATE_KEY] = state;
}

function getGlobalState(): GlobalGuidesState | undefined {
  const value = globalRecord[GLOBAL_STATE_KEY];
  if (!value || typeof value !== "object") return undefined;
  const state = value as Partial<GlobalGuidesState>;
  if (!(state.guidesBundles instanceof Map) || !(state.splitLocales instanceof Set)) {
    return undefined;
  }
  return state as GlobalGuidesState;
}

// Compute initial overrides only once per process.
// Avoid top-level await to keep the browser build target at "es2020".
const cached = globalRecord[GLOBAL_OVERRIDES_KEY] as ModuleOverrides | undefined;
if (cached) {
  initialModuleOverrides = cached;
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
