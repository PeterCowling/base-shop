// file path: src/locales/guides.api.ts
// -----------------------------------------------------------------------------
// Barrel for single‑purpose `guides` API modules. Keeps existing import paths
// stable while allowing each concern to live in its own file.
// -----------------------------------------------------------------------------

export { __setGuidesModulesForTests } from "./guides.test-helpers";
export { getGuidesBundle } from "./guides.get";
export { peekGuidesBundle } from "./guides.peek";
export { listGuidesLocales } from "./guides.list";
export { isSplitGuidesLocale, hasGuidesLocale } from "./guides.predicates";
