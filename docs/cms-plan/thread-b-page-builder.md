# Thread B – Page builder, blocks, and templates

This thread operationalises §2 of `docs/cms-research.md`.

It focuses on:

- Page and PageComponent models and diff history.
- Page Builder editor UX and metadata.
- Block registry and runtime `DynamicRenderer`.
- Extraction into `page-builder-core`, `page-builder-ui`, and `templates` packages.

---

## Context (from research)

- Pages are defined via `pageSchema` (in `@acme/types`) with status, SEO, components, and optional history.
- `packages/platform-core` repositories store pages with diff history in JSONL (`pages.history.jsonl`), with JSON/Prisma backends.
- Page Builder keeps rich `HistoryState` and editor metadata (names, locking, breakpoint visibility, layout hints) in memory and `localStorage`.
- Runtime rendering uses `DynamicRenderer` in `@acme/ui` and template apps to map `PageComponent.type` → React components, applying builder metadata (styles, breakpoints, tokens).
- The research sketches a separation:
  - `page-builder-core` – pure schemas, diff/history, transforms, validation.
  - `page-builder-ui` – editor canvas, inspector, toolbar, state management.
  - `@acme/templates` – reusable page templates and block presets.

---

## Decisions / direction (to keep aligned)

- Consolidate Page Builder data model and transforms into `page-builder-core`, independent of CMS/app frameworks.
- Consolidate editor UI primitives into `page-builder-ui`, reused by CMS and any other admin frontends.
- Treat `@acme/templates` as the place for declarative templates (home, shop, PDP, checkout, etc.) referenced by CMS and runtime apps.
- Keep a single authoritative block-registry contract between CMS and runtimes; avoid ad-hoc block implementations per app.

---

## Tasks

- [x] **PB-01 – Define public surfaces for PB packages**
  - Scope:
    - Make the intended layering between `page-builder-core`, `page-builder-ui`, and `@acme/templates` explicit.
  - Implementation:
    - Add/extend READMEs for `packages/page-builder-core`, `packages/page-builder-ui`, and `packages/templates` describing:
      - What each package owns.
      - Which exports are public vs internal.
      - How CMS and template apps should import from them.
    - Ensure `src/index.ts` (or equivalent) exposes a clean public API for each.
  - Definition of done:
    - Each package has a small, documented public surface.
    - No app or CMS code imports from `src/internal/**` or deep paths in these packages for the target surfaces.
  - Dependencies:
    - ARCH-01 (platform vs tenant/public surface conventions).

- [x] **PB-02 – Centralise Page schema and history in `page-builder-core`**
  - Scope:
    - Move Page/History-related schemas and pure transforms into `page-builder-core`.
  - Implementation:
    - Identify schemas and pure functions currently split between:
      - `packages/types/src/page/**`
      - `packages/platform-core/src/repositories/pages/**`
      - Page Builder state/hooks in `packages/ui` or `apps/cms`.
    - Extract into `packages/page-builder-core`:
      - Page and PageComponent schema (or at least re-export it).
      - History/diff/merge helpers (no IO).
      - Validation helpers (e.g. page-level invariants).
    - Update CMS and runtime imports to use the new package.
  - Definition of done:
    - Core Page/History schemas are owned (or re-exported) by `@acme/page-builder-core`.
    - Repositories/UI reference `page-builder-core` for shared logic rather than duplicating types.
  - Dependencies:
    - ARCH-02/ARCH-03 decisions for page persistence can remain as-is; this is a data/transform extraction.

- [x] **PB-03 – Normalise block registry and `DynamicRenderer` contract**
  - Scope:
    - Make the block-registry contract explicitly shared between CMS and runtime apps.
  - Implementation:
    - Identify the canonical `blockRegistry` (or equivalent) used by:
      - CMS Page Builder.
      - Template app `DynamicRenderer`.
    - Move type definitions and mapping metadata into `page-builder-core` or `@acme/templates`:
      - Block type IDs.
      - Expected props shape.
      - Feature flags (e.g. supports products, supports media).
    - Expose a helper used by both CMS and template apps to build their own registry from the shared descriptors.
  - Definition of done:
    - CMS and template app block registries are built on the same type-safe descriptor definitions.
    - Adding a new block type involves updating the shared descriptors plus app-specific component wiring, not scattered string literals.
  - Dependencies:
    - PB-01 for the package boundaries.

- [x] **PB-04 – Codify reusable templates for key page types**
  - Scope:
    - Implement the “templates” layer for common page types (home, shop, PDP, checkout, basics).
  - Implementation:
    - In `packages/templates`:
      - Define template descriptors for at least:
        - Home/landing page.
        - Shop/catalogue page.
        - Product detail page.
        - Checkout page shell (to be combined with cart/checkout thread work).
      - Each template references block descriptors from PB-03 and can be instantiated for a given shop/locale.
    - Wire CMS configurator and/or Page Builder “Add from template” actions to these descriptors.
  - Definition of done:
    - CMS can seed a new shop with one of the canonical templates via templates API.
    - Template descriptors live in `@acme/templates`, not ad-hoc JSON in CMS.
  - Dependencies:
    - PB-03 (shared block descriptors).
    - Thread E (Configurator) to hook templates into the “navigation/home” step.

- [ ] **PB-05 – Improve Page Builder metadata handling and export**
  - Scope:
    - Ensure editor-only metadata and runtime props are handled predictably.
  - Implementation:
    - Review `HistoryState` and `history.editor` schemas and confirm which fields:
      - Stay editor-only (never reach runtime).
      - Are flattened into runtime props (styles, visibility, stacking).
    - Implement helpers in `page-builder-core` for:
      - Exporting runtime-ready components from `HistoryState`.
      - Stripping editor-only props.
    - Replace ad-hoc metadata handling with these helpers in CMS actions and template runtime renderers.
  - Definition of done:
    - Single, shared export path from Page Builder state → runtime components via `page-builder-core`.
    - No duplicate logic for “strip editor props” in apps.
  - Dependencies:
    - PB-02 (shared schemas/transforms).

- - [x] **PB-06 – Add focused tests for PB data contracts**
  - Scope:
    - Add unit tests around Page schemas, diff history, and export helpers.
  - Implementation:
    - In `packages/page-builder-core`, add tests that:
      - Validate schema invariants for Page/PageComponent.
      - Exercise diff/history helpers on realistic examples.
      - Verify export helpers strip editor-only metadata and preserve runtime props.
  - Definition of done:
    - New tests in `page-builder-core` cover the central PB data flows.
  - Dependencies:
    - PB-02 and PB-05.

---

## Dependencies & validation

- Depends on:
  - ARCH-01 for public surface conventions.
  - ARCH-02/ARCH-03 for consistent page persistence semantics (but most tasks are data/UX-layer and can proceed in parallel).
- Validation:
  - PB packages expose stable public APIs used by CMS and template app.
  - Page Builder in CMS works as before (or better) after extraction.
  - Template app rendering behaves consistently after block registry/template changes, validated via targeted tests or manual preview checks.
