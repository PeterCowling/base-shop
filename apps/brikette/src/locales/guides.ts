// file path: src/locales/guides.ts
// -----------------------------------------------------------------------------
// Barrel re-export for the `guides` i18n namespace. The implementation has
// been split into single-purpose modules to improve maintainability.
// Existing import paths remain stable.
// -----------------------------------------------------------------------------

export type { GuidesNamespace } from "./guides.types";
export {
  __setGuidesModulesForTests,
  getGuidesBundle,
  peekGuidesBundle,
  listGuidesLocales,
  isSplitGuidesLocale,
  hasGuidesLocale,
} from "./guides.api";

