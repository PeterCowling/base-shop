// @acme/cms-ui
//
// CMS-specific UI package. It owns:
// - Blocks (`@acme/cms-ui/blocks/*`)
// - Page builder UI (`@acme/cms-ui/page-builder/*`)
// - CMS editing primitives and helpers (re-exported from `@acme/ui/components/cms`)
//
// Note: we intentionally keep "CMS editing primitives" as re-exports for now to
// avoid breaking existing `apps/cms` and `packages/template-app` imports while
// consolidation work is ongoing.

export * from "@acme/ui/components/cms";
