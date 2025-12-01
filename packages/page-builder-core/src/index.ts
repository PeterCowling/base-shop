// Public surface for page‑builder core logic.
// New shared schemas, history helpers, and registry APIs should be exported
// from this file (and optionally src/public/**) so apps never import from
// deep src/** paths.
export const version = "0.0.0-dev";

// Page and history types/schemas re-exported from @acme/types.
export {
  pageSchema,
  historyStateSchema,
  // Re-exporting the component schema keeps callers independent of
  // the underlying @acme/types layout.
  pageComponentSchema,
} from "@acme/types";
export type {
  Page,
  PageComponent,
  HistoryState,
  EditorFlags,
} from "@acme/types";

// Shared history reducers and helpers.
export { commit, undo, redo } from "./history";
export {
  diffPage,
  mergeDefined,
  parsePageDiffHistory,
} from "./pageHistory";
export type { PageDiffEntry } from "./pageHistory";

// Template descriptor contracts and scaffolding helpers.
export type {
  TemplateKind,
  TemplateOrigin,
  TemplateDescriptor,
  ScaffoldContext,
} from "./templates";
export {
  cloneTemplateComponents,
  scaffoldPageFromTemplate,
} from "./templates";

// Runtime export helpers for turning HistoryState into runtime components.
export type { ExportedComponent } from "./runtime/exportComponents";
export {
  exportComponents,
  exportComponentsFromHistory,
} from "./runtime/exportComponents";

// Shared block registry contracts used by CMS and runtime apps.
export * from "./blocks/registry";
export { coreBlockDescriptors } from "./blocks/core-blocks";
