// file path: src/locales/guides.api.ts
// -----------------------------------------------------------------------------
// Barrel for single‑purpose `guides` API modules. Keeps existing import paths
// stable while allowing each concern to live in its own file.
// -----------------------------------------------------------------------------

export { getGuidesBundle } from "./guides.get";
export { listGuidesLocales } from "./guides.list";
export { peekGuidesBundle } from "./guides.peek";
export { hasGuidesLocale,isSplitGuidesLocale } from "./guides.predicates";
export { __setGuidesModulesForTests } from "./guides.test-helpers";
