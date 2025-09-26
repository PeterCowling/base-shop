# @acme/page-builder-core — Agent Notes

Purpose: Pure page‑builder logic (state, reducers, algorithms, utilities). No React/DOM.

Guidelines
- Keep files focused and ≤350 lines; extract helpers when needed.
- No React, no browser globals. Keep the core platform‑agnostic.
- Add unit tests for reducers and utils; avoid integration concerns.

Migration
- Move logic from `packages/ui/src/components/cms/page-builder/state/**` and `.../utils/**` here.
- Keep React panels/editors in `@acme/page-builder-ui` or the CMS app.

