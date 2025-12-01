# Page Builder Metadata & CSS (Migration Note)

This note summarizes the new Page Builder metadata model, how it is persisted, and the runtime CSS additions used by the preview/runtime to apply visibility and typography rules.

## Editor Metadata (`state.editor`)

- Metadata for components lives in `state.editor` as a record keyed by component id.
- Schema: `HistoryState["editor"]` (defined in `@acme/types` and re‑exported from `@acme/page-builder-core`) describes the flags per component:
  - Editor‑only flags (never sent to runtime):
    - `name?: string`
    - `locked?: boolean`
    - `zIndex?: number`
    - `stackDesktop?: "default" | "reverse" | "custom"`
    - `stackTablet?: "default" | "reverse" | "custom"`
    - `stackMobile?: "default" | "reverse" | "custom"`
    - `orderDesktop?: number`
    - `orderTablet?: number`
    - `global?.pinned?: boolean`
    - `global?.editingSize?: Partial<Record<"desktop" | "tablet" | "mobile", number | null>>`
  - Flags that are flattened into runtime props:
    - `hidden?: ("desktop" | "tablet" | "mobile")[]`
      - Becomes `hiddenBreakpoints?: ("desktop" | "tablet" | "mobile")[]` on exported components.
    - `hiddenDeviceIds?: string[]`
      - Becomes `hiddenDeviceIds?: string[]` on exported components (used for page‑defined breakpoints).
    - `stackStrategy?: "default" | "reverse" | "custom"`
      - When set to `"default"` or `"reverse"`, becomes `stackStrategy?: "default" | "reverse"` on exported components.
      - `"custom"` remains editor‑only and is interpreted via per‑node `order*` values.
    - `orderMobile?: number`
      - Becomes `orderMobile?: number` on exported components.
    - `global?: { id: string; overrides?: unknown }`
      - `id` is used to resolve a global template; `overrides` are shallow‑merged into the exported component.
- The base history shape remains `{ past: [], present: [], future: [], gridCols: number, editor?: Record<string, EditorFlags> }`, with `editor` defaulting to `{}`.

## Persistence & export flow

- Hook: `usePageBuilderState` writes the full `HistoryState` (including `editor`) to `localStorage` under key `page-builder-history-{page.id}` on every change.
- On load, the hook prefers the locally stored history; if absent/invalid, it falls back to the server-provided `page.history` (validated by `historyStateSchema` from `@acme/page-builder-core`) or defaults.
- Saving drafts/publishing:
  - `usePageBuilderSave` appends a `history` entry to the `FormData` payload.
  - On publish, editor metadata is merged into components via the shared core helper:
    - `exportComponents(list, editor)` from `@acme/page-builder-core`.
    - This produces an `ExportedComponent[]` where runtime‑relevant flags (`hiddenBreakpoints`, `hiddenDeviceIds`, `stackStrategy`, `orderMobile`, and resolved globals) are stamped onto the nodes, and editor‑only flags remain in `history.editor` (never sent to the storefront runtime).
  - Helper `exportComponentsFromHistory(history, globals?)` provides a single “export from `HistoryState`” entrypoint for preview or other flows that work directly with `HistoryState`.

## Visibility at Runtime

- Preview/runtime applies per-viewport visibility using CSS helper classes added in `packages/ui/src/styles/builder.css`:
  - `pb-hide-desktop`, `pb-hide-tablet`, `pb-hide-mobile` toggle display at their respective breakpoints.
  - The builder injects these classes in preview mode based on `editor[id].hidden` and, for exported payloads, based on `hiddenBreakpoints` stamped by `exportComponents`.
- Typography remapping: elements rendered within a `.pb-scope` container use media queries to remap `--font-size[-vp]` and `--line-height[-vp]` vars onto the base `--font-size` / `--line-height` for the active viewport. This keeps authored values consistent across preview and runtime.

## What to Update

- When migrating existing pages:
  - Preserve `history.editor` data. If older histories lack `editor`, the schema defaults to `{}` and the UI will continue to work.
  - Ensure `apps/*/src/app/globals.css` imports `packages/ui/src/styles/builder.css`. Example:
    ```css
    @import "../../../../packages/ui/src/styles/builder.css";
    ```
- If you relied on ad‑hoc classes for per-viewport hiding, replace them with the standardized `pb-hide-*` classes driven by editor metadata.

## Notes

- Multi-select actions (align/distribute) only apply to unlocked, absolutely positioned items. Locking is tracked in `editor[id].locked` and honored by the canvas overlay and sidebar actions.
- Z-order shortcuts update `editor[id].zIndex` and are persisted with history like other editor flags.
