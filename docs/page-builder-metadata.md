# Page Builder Metadata & CSS (Migration Note)

This note summarizes the new Page Builder metadata model, how it is persisted, and the runtime CSS additions used by the preview/runtime to apply visibility and typography rules.

## Editor Metadata (`state.editor`)

- Metadata for components lives in `state.editor` as a record keyed by component id.
- Schema: `packages/ui/src/components/cms/page-builder/state/history.schema.ts` extends the history state with an `editor` map containing optional flags per component:
  - `name?: string`
  - `locked?: boolean`
  - `zIndex?: number`
  - `hidden?: ("desktop" | "tablet" | "mobile")[]`
  - `stackStrategy?: "default" | "reverse" | "custom"`
  - `orderMobile?: number`
- The base history shape remains `{ past: [], present: [], future: [], gridCols: number }` with `editor` defaulting to `{}`.

## Persistence Flow

- Hook: `usePageBuilderState` writes the full `HistoryState` (including `editor`) to `localStorage` under key `page-builder-history-{page.id}` on every change.
- On load, the hook prefers the locally stored history; if absent/invalid, it falls back to the server-provided `page.history` (validated by `historyStateSchema`) or defaults.
- Saving drafts/publishing: `usePageBuilderSave` appends a `history` entry to the `FormData` payload. On publish, editor metadata is merged into components via `exportComponents(list, editor)` so the runtime can use flattened props where needed.

## Visibility at Runtime

- Preview/runtime applies per-viewport visibility using CSS helper classes added in `packages/ui/src/styles/builder.css`:
  - `pb-hide-desktop`, `pb-hide-tablet`, `pb-hide-mobile` toggle display at their respective breakpoints.
  - The builder injects these classes in preview mode based on `editor[id].hidden`.
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

