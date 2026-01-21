// file path: src/locales/guides.ts
// -----------------------------------------------------------------------------
// Barrel re-export for the `guides` i18n namespace. The implementation has
// been split into single-purpose modules to improve maintainability.
// Existing import paths remain stable.
// -----------------------------------------------------------------------------

export {
  __setGuidesModulesForTests,
  getGuidesBundle,
  hasGuidesLocale,
  isSplitGuidesLocale,
  listGuidesLocales,
  peekGuidesBundle,
} from "./guides.api";
export type { GuidesNamespace } from "./guides.types";

