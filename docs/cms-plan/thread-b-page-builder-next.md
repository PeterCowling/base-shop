Type: Plan
Status: Draft
Domain: CMS
Last-reviewed: 2026-01-15
Relates-to charter: docs/cms/cms-charter.md
Supersedes/extends: docs/cms-plan/thread-b-page-builder.md

# Thread B+ — Page Builder to Production-Grade Owner Workflow

Goal: Close the gap between the idealised shop-owner workflow and the current Page Builder/Configurator/Launch experience. Prioritise a packaged builder, templates, real stories, E2E coverage, clarity on draft/publish, compliance, and staging gates.

---

## Phase 1 — Productise the Builder and Registry
- PB-N01: Ship `@acme/page-builder-ui@1.0.0` with a documented, typed public API (providers, editor shell, registry builders). Remove deep imports from `@acme/ui/src/components/cms/page-builder/**`.
  - Status: Done (2025-12-04) — `@acme/page-builder-ui` now exports the Page Builder editor shell (`PageBuilder`, `PageBuilderLayout`, `PageToolbar`, `PageCanvas`, `PageSidebar`), typed hooks (`usePageBuilderState`, `usePageBuilderDnD`, `usePageBuilderControls`, `usePageBuilderSave`, `useAutoSave`, canvas helpers), library/global helpers, and registry builders re-exported from `@acme/page-builder-core`. CMS routes and the template app now import these primitives via `@acme/page-builder-ui` instead of `@ui/components/cms/page-builder/**`; remaining deep imports are limited to test-only mocks.
- PB-N02: Define a canonical block-registry contract (typed descriptors + registry builder) shared by CMS/runtime. Expose a starter registry aligned to the default theme.
- PB-N03: Versioning policy — start at `1.0.0`, semver changes documented in package README and CHANGELOG.
  - Status: Done — `@acme/page-builder-core` now starts at `1.0.0`, both PB packages document the semver policy in their READMEs, and `CHANGELOG.md` files capture public API changes.

## Phase 2 — Templates and Starter Pages
- PB-N04: Seed templates for Home, PLP, PDP, Checkout in `@acme/templates` using the shared registry. Require selection of Home/PDP templates in the Configurator wizard; expose “Create from template” and template swap with a preview + diff-before-apply.
- PB-N05: Wire “Add from template” into Page Builder palette; block types mapped via the shared descriptors.
  - Blocking: PB-N02 registry contract; Page Builder API stable (PB-N01); template data mocks for diff/preview.

## Phase 3 — Storybook + Playground Coverage
- PB-N06: Replace JSON-only stories with real flows: Add block, Reorder, Style edit, Template apply, Locale/device preview, Checkout composition. Use MSW data (products/nav) and the real registry.
- PB-N07: Add Matrix/visual stories for key blocks/sections; include perf probes (render time with 50 blocks) to catch regressions.
  - Blocking: Registry and template availability (PB-N01/02/04); MSW fixtures for products/nav; Storybook builder config to run perf probes.

## Phase 4 — Reliability and Tests
- PB-N08: Integration tests without mocks for DnD, palette, undo/redo, save/publish (use real registry/components).
- PB-N09: E2E “compose → publish → launch” test: start from template, edit, publish, run launch SSE, assert success.
- PB-N10: Runtime preview test: ensure published page renders correctly in template app with the shared registry.
  - Blocking: Stable Page Builder API and registry (PB-N01/02); templates (PB-N04); launch API stable for SSE assertions.

## Phase 5 — UX Clarity (Draft/Publish, Checkout)
- PB-N11: Make Draft vs Published explicit in Page Builder (state chips, Preview URL). Preview URL points to Stage when available and renders latest Draft.
- PB-N12: Separate checkout settings (Configurator) from checkout layout (Page Builder). Provide a checkout template and a direct link from Configurator.
  - Blocking: Template library (PB-N04) for checkout; routing/preview infra for stage URLs.

## Phase 6 — Compliance and Staging Gate
- PB-N13: Add legal checks (TOS/Privacy/Refund links) to configurator/launch readiness; surface in Launch panel.
- PB-N14: Enforce Stage-before-Prod on first launch; require passing staging smoke and a manual QA acknowledgement checkbox (“I reviewed staging”).
  - Blocking: Launch panel wiring to new checks; smoke pipeline available in Stage; legal-link detection.

## Phase 7 — Observability and Queue
- PB-N15: Persist the deploy queue (e.g., Redis/job runner) with retry/backoff; expose last deploy/smoke status + artifacts in Launch panel.
- PB-N16: Notifications for failed deploy/smoke after retries (email/CMS notification); actionable links back to fix.
- PB-N17: Instrument Page Builder actions (add/reorder/publish) and launch errors with actionable codes and deep links.
  - Blocking: Storage/infra for queue persistence; notification channel; telemetry schema for PB actions and launch errors.

---

## Definition of Done (per phase)
- P1: `@acme/page-builder-ui@1.0.0` published; CMS uses it; no deep imports; registry contract documented.
- P2: Templates selectable in Configurator; Page Builder “Add from template” live; diff-before-apply works.
- P3: Storybook has real flows + perf probes; Matrix stories cover key blocks.
- P4: Non-mocked integration + compose→launch E2E passing in CI.
- P5: Draft/Published and preview semantics are clear; checkout settings vs layout separated.
- P6: Legal checks enforced/flagged; Stage gate and QA acknowledgement block first Prod launch.
- P7: Deploy queue persisted with retries; Launch panel shows last deploy/smoke artifacts; notifications fire on failure.

---

## PB-N04 — Seed templates and require selection

- [x] **PB-N04 – Seed templates for Home, PLP, PDP, Checkout in `@acme/templates`**
  - Status: Done — core templates carry preview metadata, template APIs expose ids/categories with grouping, Configurator Home/PDP steps require a chosen template + saved draft, Page Builder exposes Create/Replace from template with preview and diff, and template ids persist via `stableId` for ConfigChecks.
  - Scope:
    - Provide a curated, registry-backed set of templates for the four core page types (Home, PLP/shop, PDP, Checkout shell) in `@acme/templates`.
    - Treat these templates as the single source of truth for:
      - Configurator “Core pages” seeding (home, shop, product, checkout, additional pages).
      - Page Builder “Create from template” and template swap flows in CMS.
    - Align template descriptors with the shared block-registry contract from PB-N02 so CMS and runtimes can render the same `PageComponent` trees safely.
  - Implementation:
    - Templates in `@acme/templates`:
      - Confirm and, where needed, extend `packages/templates/src/corePageTemplates.ts` so it exposes at least:
        - One Home template (for example `core.page.home.default`).
        - One PLP/shop template (for example `core.page.shop.grid`).
        - One PDP template (for example `core.page.product.default`).
        - One Checkout shell template (for example `core.page.checkout.shell`).
      - Ensure all templates use the shared `TemplateDescriptor` and `PageComponent` types from `@acme/page-builder-core`, with block `type` ids drawn from the canonical registry introduced in PB-N02.
      - Re-export grouped lists from `packages/templates/src/index.ts` (for example `homePageTemplates`, `shopPageTemplates`, `productPageTemplates`, `checkoutPageTemplates`) so CMS callers can request category-specific catalogs.
    - CMS APIs:
      - Keep `/cms/api/page-templates` and `/cms/api/page-templates/[name]` as the adapter layer from CMS to `@acme/templates`, backed by `corePageTemplates`.
      - Where helpful for UI, extend the JSON payloads to include template `id` and/or `category` so Configurator steps can filter templates per page type, while preserving the existing `name` + `components` shape for existing callers and tests.
    - Configurator wizard integration (Home/PDP required):
      - For the Home and product detail steps (`StepHomePage`, `StepProductPage`):
        - Load the appropriate template groups from the Template API (Home ↔ `homePageTemplates`, PDP ↔ `productPageTemplates`).
        - Persist the selected template id into Configurator state (for example `homeLayout`, `productLayout`) alongside the seeded components.
        - Treat selecting a non-blank template and saving/publishing at least once as a prerequisite for marking `home-page` / `product-page` as “complete”.
        - Ensure `checkNavigationHome` and related ConfigChecks treat “no home template chosen or saved” as failing for launch readiness.
      - For the Shop and Checkout steps (`StepShopPage`, `StepCheckoutPage`) and Additional Pages:
        - Use the same template catalog for seeding, allowing blank layouts but surfacing that a core template is the recommended path for first launch.
        - Keep all template-based mutations flowing through the shared Configurator state and `/cms/api/page*` routes (no ad-hoc seeding helpers).
    - Page Builder “Create from template” and template swap:
      - In the generic Pages editor (`apps/cms/src/app/cms/shop/[shop]/pages/**`), add:
        - A **Create from template** action that:
          - Lets users pick a template (backed by `@acme/templates` / `/cms/api/page-templates`).
          - Scaffolds a new `Page` via `scaffoldPageFromTemplate` (from `@acme/page-builder-core`) and persists it via the existing page APIs.
        - A **Replace with template…** action for existing pages that:
          - Builds a candidate `next` page from the chosen template (preserving slug and key SEO fields where appropriate).
          - Computes a patch via `diffPage(previous, next)` from `@acme/page-builder-core`.
          - Shows a confirmation dialog summarising changes (for example count of blocks added/removed, fields changed) before applying.
          - Applies the patch by committing a new history entry via the shared history helpers so undo/redo works as expected.
      - Emit tracking events for template create/swap operations so PB-N17 observability work can attribute usage and failures.
    - Tests and docs:
      - Extend `apps/cms/__tests__/pageTemplatesRoute.test.ts` and `[name]/route.test.ts` to assert that all core templates from `@acme/templates` are exposed via the API and that category filtering (if added) behaves as expected.
      - Add or update a short section in `docs/cms/build-shop-guide.md` to point to these core templates as the canonical starting point for Home/PLP/PDP/Checkout pages.
  - Definition of done:
    - `@acme/templates` exposes stable, registry-backed templates for Home, PLP/shop, PDP, and Checkout shell, and these are the templates used by `/cms/api/page-templates`.
    - Configurator wizard requires selecting (and saving) a Home and PDP template before the relevant steps can reach “complete”, and `checkNavigationHome` / related ConfigChecks surface missing templates as launch blockers.
    - Shop builders can:
      - Create new pages from templates via a clear “Create from template” flow.
      - Swap an existing page to a different template with a visible preview + diff-before-apply that preserves undo/redo.
    - Tests cover:
      - Template API routes.
      - Home/shop/product/checkout Configurator flows seeding pages from templates.
      - At least one template swap path in Page Builder, including diff/commit behaviour.
  - Dependencies:
    - PB-N01 (`@acme/page-builder-ui` public API) and PB-N02 (canonical registry descriptors).
    - A2/A3 Configurator work in `master-thread.fast-launch` (wizard structure and `ConfiguratorService`).
    - CONF thread for ConfigCheck semantics and Configurator progress wiring.

---

## PB-N05 — Add-from-template inside the Page Builder palette

- [x] **PB-N05 – Wire “Add from template” into Page Builder palette; block types mapped via the shared descriptors**
  - Scope:
    - Make section/page templates a first-class option inside the Page Builder palette so builders can add richer “prefab” sections without leaving the main editor.
    - Reuse the existing presets/sections infrastructure (`presets.data.ts`, section templates, `/cms/api/sections`) and ensure all template components use block types covered by the shared registry contract in `@acme/page-builder-core`.
  - Implementation:
    - Palette wiring:
      - In `packages/ui/src/components/cms/page-builder/Palette.tsx`, render `PresetsModal` as part of the palette with its trigger visible by default instead of relying solely on the top-bar shortcut:
        - Pass `open`/`onOpenChange` from palette state so the modal can be opened both via the new “Add Section” button and via the shared `pb:open-presets` event used by `PageBuilderTopBar`.
        - Keep the modal scoped to the main palette sidebar (not the compact quick-palette popover) to avoid clutter.
      - The palette now exposes:
        - Block-level items (atoms/molecules/organisms/layout/overlays) derived from `blockRegistry`/`coreBlockRegistry`.
        - Library entries (per-shop and global) from `libraryStore`.
        - A visible **Add Section** / presets entry point that opens the section/template library (`PresetsModal`) directly inside the palette.
    - Drag & drop and insert handlers:
      - Reuse existing insert handlers in `useInsertHandlers`:
        - `handleAddFromPalette` for individual block types (using `ComponentType`, `defaults`, and `CONTAINER_TYPES`).
        - `handleInsertPreset` for section templates (clones template trees with new ULIDs and inserts them at the resolved target index/parent).
      - Ensure the palette passes `onInsertPreset` through to `PresetsModal` and that both:
        - Top-bar “Insert Preset” button (via `pb:open-presets` event).
        - Palette-local **Add Section** trigger (DialogTrigger inside `PresetsModal`).
        use the same `handleInsertPreset` hook so undo/redo and selection semantics remain consistent.
    - Template/block contract validation:
      - Rely on `@acme/page-builder-core`’s `coreBlockDescriptors` + `buildBlockRegistry` wiring in `packages/ui/src/components/cms/blocks/index.ts` so any block type used in presets/sections must exist in the shared descriptor set and registry.
      - Add a focused test around the palette/presets integration to ensure:
        - The palette renders the “Add Section” trigger when `onInsertPreset` is provided.
        - Opening the presets modal (via `pb:open-presets`) exposes at least one preset (“Hero: Simple” from `presets.data.ts`), and selecting it calls the `onInsertPreset` callback with a `PageComponent` tree.
  - Definition of done:
    - Builders can open the section/template library directly from the Page Builder palette and insert a preset section into the current page without leaving the editor.
    - The presets/sections inserted via the palette reuse the same `handleInsertPreset` path as presets triggered from the top bar, preserving undo/redo and selection behaviour.
    - All block `type` values used by built-in presets and section templates resolve to entries in the shared block registry (via `coreBlockDescriptors` + `blockRegistry`); there are no “orphan” block types used only in templates.
    - A unit test in `packages/ui` covers the palette–presets wiring and guards against regressions (for example, removing the preset trigger or breaking the `pb:open-presets` event handler).
  - Dependencies:
    - PB-N01 and PB-N02 for the shared registry contract and `BlockTypeId` wiring.
    - Existing presets and section templates infrastructure in `packages/ui` and `apps/cms` (no changes to `@acme/templates` required for this step).

---

## PB-N06 — Storybook flows for Page Builder

- [x] **PB-N06 – Replace JSON-only stories with real flows using MSW data and the shared registry**
  - Scope:
    - Turn the Page Builder Storybook entry into a set of realistic flows that exercise:
      - Adding blocks from the palette.
      - Reordering via drag & drop.
      - Editing styles/props.
      - Applying a section template.
      - Switching locale/device preview.
      - Composing a basic checkout experience using core commerce blocks.
    - Keep stories self-contained and powered by the real block registry (`coreBlockRegistry` via `@acme/page-builder-core`) and MSW data (products/nav) so they act as a playground and regression harness.
  - Implementation:
    - Story structure:
      - In `packages/ui/src/components/cms/PageBuilder.stories.tsx`:
        - Replace the minimal `GroupedPalette` story with a small set of tagged flows (for example, `HappyPathComposition`, `TemplateApply`, `CheckoutComposition`), all using the real `PageBuilder` component.
        - Seed each story with a realistic `Page` object using the shared `Page` type from `@acme/types`, wiring initial `components` to a small tree of core blocks (e.g. `Section`, `HeroBanner`, `ProductGrid`, `Footer`).
      - Use Storybook’s controls or `play` functions sparingly; favour static but expressive initial states that can be modified interactively by designers.
    - Registry and data wiring:
      - Ensure `PageBuilder` in Storybook uses the same default registry wiring as CMS:
        - `@acme/page-builder-core`’s `coreBlockDescriptors` + `buildBlockRegistry` via `packages/ui/src/components/cms/blocks/index.ts`.
        - No Storybook-only “mock” block types; any block shown in stories must be present in the shared registry.
      - Rely on existing MSW handlers from `test/msw/shared.ts`:
        - For product-aware blocks (`ProductGrid`, `ProductCarousel`, recommendation blocks), either:
          - Add light-weight MSW fixtures for `/api/products`/`/api/recommendations` used by those blocks, or
          - Reuse existing product mocks from the test stack if already defined.
        - For nav and checkout-related flows, ensure handlers exist or are extended so:
          - Header/nav blocks (e.g. `Header`, `HeaderCart`) can fetch or render basic nav data.
          - Checkout/cart blocks can load data without failing requests.
    - Flow-specific notes:
      - **Add & Reorder flow**:
        - Story shows a simple page with one `Section` and a `HeroBanner`.
        - Document in the story description how to:
          - Drag a new block from the palette into the canvas.
          - Reorder blocks within a section.
      - **Style edit flow**:
        - Story focuses on a `Section` + `Text`/`ValueProps` with style panel open.
        - Call out key style controls (spacing, background, typography) in the docs description; no extra code beyond initial props.
      - **Template apply flow**:
        - Story starts with an almost-empty page and highlights the “Add Section” / presets entry:
          - Include docs text explaining that presets come from the shared presets/sections pipeline and use the core block registry.
          - Optionally pre-load a “Hero: Simple” section so users see a concrete example.
      - **Locale + device preview flow**:
        - Story pre-populates `seo`/text props with multiple locales and sets a non-default viewport (e.g. mobile) as the initial state.
        - Docs description explains how to switch between locales and devices using the toolbar, stressing that this is the same flow used in CMS.
      - **Checkout composition flow**:
        - Story composes a basic checkout shell using:
          - `CheckoutSection`, `CartSection`, and relevant trust/benefit blocks.
        - Treat these as “system” blocks: keep them within a dedicated `Section` and call out in docs that in runtime they are reserved for checkout contexts.
        - Ensure MSW handlers allow cart/checkout-related calls to succeed or passthrough with harmless defaults.
    - Docs and tags:
      - Tag these stories with `["dev", "test", "pb-flow"]` so the Storybook CI config and Playwright smoke tests can target them as part of the “known-good” matrix.
      - In `docs/storybook.md` (or a short CMS-specific Storybook note), add a brief bullet describing the new “Page Builder flows” stories and how they should be used during development and QA.
  - Definition of done:
    - `CMS/PageBuilder` Storybook stories demonstrate:
      - Block add + reorder.
      - Basic style editing.
      - Applying a section template/preset.
      - Locale and device preview switching.
      - A minimal checkout composition using shared commerce blocks.
    - Stories run against the real registry and MSW-backed data without console errors or failing network requests.
    - Page Builder stories are tagged and documented so they can be included in Storybook CI smoke tests and serve as a reference playground for new PB features.
    - At least one `CMS/PageBuilder` story (`AddAndReorder`) is explicitly included in the CI Storybook config (`apps/storybook/.storybook-ci/main.ts`) so it runs as part of the “known-good” Matrix subset.
  - Dependencies:
    - PB-N01/02 for the shared PB API and registry.
    - PB-N04/PB-N05 for template/preset wiring (so “Add from template” behaviour is consistent between Storybook and CMS).

---

## PB-N07 — Visual matrix and perf probes

- [x] **PB-N07 – Add Matrix/visual stories for key blocks/sections; include perf probes (render time with 50 blocks) to catch regressions**
  - Summary: Added `Visual matrix (key blocks)` and `Perf probe (50 blocks)` to `packages/ui/src/components/cms/PageBuilder.stories.tsx`, using the real Page Builder registry and MSW-backed data. The matrix story snapshots hero → product grid → value props → social proof → checkout shell. The perf probe renders 50 lightweight sections, surfaces initial render time inline and logs to the console, and is tagged `perf` (Chromatic disabled for stability). `docs/storybook.md` now calls out these guardrails.
  - Definition of done:
    - Visual matrix story covers the critical block/section stack with the live Page Builder UI.
    - Perf probe story measures and reports initial render timing for a 50-block page to catch regressions.
    - Documentation points developers/testers to these stories for quick visual and performance checks.
  - Dependencies: PB-N01/02 registry contract and PB-N04 templates (for palette/registry wiring in stories) are already satisfied.

---

## PB-N08 — Real integration tests for Page Builder

- [x] **PB-N08 – Integration tests without mocks for DnD, palette, undo/redo, save/publish (use real registry/components)**
  - Status: Done — added `apps/cms/__tests__/pb/pageBuilder.real.integration.test.tsx` running against the live Page Builder UI (starter registry, real Palette/PageCanvas/PageSidebar, dnd-kit sensors with jsdom geometry stubs), covering palette insert, drag reorder (keyboard/pointer), undo/redo, and save/publish FormData exports. Legacy mocked suite is skipped in favor of the real stack.
  - Scope:
    - Replace the mocked Page Builder integration coverage with jsdom/MSW-backed flows that exercise the exported `@acme/page-builder-ui` stack (real Palette/PageCanvas/PageSidebar, `starterBlockRegistry`, history/export helpers).
    - Cover drag/drop insert + reorder, palette search/recents/preset trigger, history (undo/redo), and save/publish FormData/export behaviour using real block components.
    - Keep assertions resilient to UI churn by leaning on roles/data attributes instead of internal class names; avoid stubbing PB internals or DnD contexts.
  - Implementation:
    - Harness and fixtures:
      - Add a shared PB harness (for example `apps/cms/__tests__/pb/pageBuilder.real.integration.test.tsx`) that renders `<PageBuilder>` with `shopId`, a seeded `Page` (Section + Text/Hero), and the default `starterBlockRegistry` so real blocks render.
      - Extend the jest setup or local helpers to provide DOM measurement hooks needed by `@dnd-kit` (PointerEvent, DOMRect, `elementFromPoint`, `getBoundingClientRect` stubs for palette items/canvas) without mocking DnD components.
      - Use MSW handlers for `/api/library`, `/api/globals`, `/api/products`, and save/publish endpoints to return deterministic payloads; allow library/global snapshots to persist via localStorage to exercise the real `libraryStore`.
    - Flows to assert:
      - Palette → canvas insert: drag a palette card (for example Section/Text) into an empty canvas and assert the rendered block tree and history both update; cover keyboard add for accessibility.
      - Reorder: start from two blocks, drag the second above the first with real sensors, assert DOM order and undo/redo buttons reflect the change, then redo to restore.
      - Save/publish: click Save/Publish and assert the received FormData contains exported components (editor metadata stripped, globals resolved), `history` snapshot, and optional library data; verify publish clears history and keeps ids stable for subsequent auto-save.
      - Palette state: search + recents update after insert; preset trigger opens via `pb:open-presets` when `onInsertPreset` is provided.
    - Cleanup and wiring:
      - Migrate or delete the heavily mocked `apps/cms/__tests__/PageBuilder.integration.test.tsx` in favor of the real-stack suite; keep any unique assertions by porting them.
      - Document the targeted run command (`pnpm --filter @apps/cms test -- PageBuilder.real.integration`) in the test header to align with the testing policy and avoid full-suite runs.
  - Definition of done:
    - Integration tests in `apps/cms/__tests__/pb` run against the real Page Builder UI (no mocks for Palette, Canvas, DnD, or block registry) and pass under jsdom with MSW.
    - Coverage proves: drag from palette inserts real blocks, reorder via drag updates history/DOM, undo/redo works, save/publish build correct FormData/exported components, palette search/recents/preset trigger behave.
    - CI runs the new suite in place of the mocked integration test and failures surface regressions in DnD/palette/save rather than mock drift.
  - Dependencies:
    - PB-N01/02 for the stable PB API and registry; PB-N04/PB-N05 for template/preset availability; MSW fixtures for products/nav/library/globals; pointer/measurement polyfills available in Jest setup.

---

## PB-N09 — Compose → publish → launch E2E

- [ ] **PB-N09 – E2E “compose → publish → launch” with real SSE**
  - Status: Planned — add a Cypress spec that starts from a template, edits, publishes, then runs the Launch SSE to completion using the real registry/templates.
  - Scope:
    - Cover the end-to-end author flow: choose a core template in Page Builder, make an edit, Save + Publish, then trigger Launch and observe `create/init/deploy/tests/(seed)` SSE events through to `done`.
    - Use the shared Page Builder registry (`coreBlockRegistry`) and `corePageTemplates`; avoid palette/template mocks, allowing MSW only for auth/product data.
    - Run against an isolated data root so file assertions (`pages.json`, `deploy.json`) match what the app writes during the test.
  - Implementation:
    - Test data and env:
      - Create a temp data root via `cy.task("testData:setup", "<base-shop>")`, set `Cypress.env("TEST_DATA_ROOT", dir)`, and start the app with `DATA_ROOT=$dir` (for example via `e2e:cms:functional`) so CMS and the spec share the same files.
      - Pick a unique `shopId` and pre-complete configurator steps (via `/cms/api/configurator-progress` or file write) so `/api/launch-shop` accepts the request; keep `domain` empty to skip Cloudflare.
      - Leave `SHOP_SMOKE_ENABLED` unset (or `0`) so the launch “tests” step returns `not-run` rather than spawning the smoke suite; rely on MSW defaults for auth.
    - Compose + publish:
      - Visit `/cms/shop/${shopId}/pages/new/page` as admin, open template actions (`data-cy="template-actions-trigger"`), and apply `template-core.page.home.default` to scaffold from the core library; assert the canvas renders blocks and history updates.
      - Make a small edit (e.g., drag a `Text`/`ValueProps` block via `pbDragPaletteToContainer` or tweak copy) and set required page fields (slug/title) so Save/Publish has a diff to persist.
      - Save and Publish via the top action bar; read `pages.json` under the shared data root to confirm the new slug is present with `status: "published"` (and template `stableId` retained when provided).
    - Launch/SSE assertions:
      - Navigate to `/cms/configurator` for the same shop, trigger Launch, and let the real `/api/launch-shop` SSE stream run (no intercept). Assert the UI shows `create`, `init`, `deploy`, `tests` (and `seed` when enabled) as `success`, followed by a `done` event.
      - After completion, assert `deploy.json` for the shop exists with `status: "success"` (and `testsStatus` not `failed`); optionally re-read `pages.json` to confirm the published page persisted.
    - CI wiring:
      - Tag the spec (for example `pb-launch`, `pb-e2e`) so it runs in the functional CMS suite and can be skipped in smoke; add the usual “skip if Next.js error overlay detected” guard to reduce flakiness.
  - Definition of done:
    - Cypress spec covers template apply → edit → publish → launch using the real registry/templates and passes in CI without SSE stubs.
    - File side-effects are asserted: published page recorded in `pages.json`, launch writes `deploy.json` with a successful status (and smoke status `passed`/`not-run`).
    - Spec is discoverable (tagged/documented) and scoped to the targeted suite to keep runtime acceptable.
  - Dependencies:
    - PB-N01/02 for stable Page Builder API/registry; PB-N04 templates; PB-N08 base integration stability.
    - Configurator launch route and `verifyShopAfterDeploy` usable in test env (with smoke disabled) plus `enqueueDeploy` working against the temp data root.

---

## PB-N02 — Canonical block registry contract and starter registry

**Goal**

Make the Page Builder block registry a single, typed contract shared by CMS and runtime apps, and provide a “starter registry” that new shops can adopt with the default theme.

**Contract**

- Canonical block-registry types and helpers live in `@acme/page-builder-core` and are part of its public surface:
  - `BlockTypeId` is an alias of `PageComponent["type"]` and is the single vocabulary for block `type` across CMS, template app, and tenant apps.
  - `BlockDescriptor`, `BlockDescriptorMap`, and `BlockFeatureFlags` capture shared metadata (label, category, capabilities) in a React-agnostic way.
  - `BlockRegistry<TEntry>` and `buildBlockRegistry` are the only supported way to build per-app registries from shared descriptors and app-specific entries.
- `coreBlockDescriptors` in `@acme/page-builder-core` is the canonical descriptor set for blocks that are supported by the default theme and template app.
  - It includes the baseline marketing/commerce/layout blocks (Hero, ProductGrid, Section, Footer, etc.).
  - It is versioned and extended via normal `@acme/page-builder-core` semver, not per-app string literals.

**Work**

- **N02-1 – Document the contract**
  - Ensure `@acme/page-builder-core/README.md` remains the single, authoritative reference for the block-registry contract (types, descriptors, builder, and example usage).
  - Add a short “Block registry contract” section to `docs/runtime/template-contract.md` and/or `docs/historical/cms-research.md` that:
    - Names `BlockTypeId`/`BlockDescriptor`/`buildBlockRegistry` as the shared contract.
    - Calls out `coreBlockDescriptors` as the canonical descriptor set for core blocks.

– **N02-2 – Align CMS registry to the contract**
  - Treat `packages/ui/src/components/cms/blocks/index.ts` as the canonical CMS registry implementation:
    - Build the CMS `coreBlockRegistry` exclusively via `buildBlockRegistry(coreBlockDescriptors, entries)`. ✅ Implemented; `coreBlockRegistry` is defined from `coreBlockDescriptors` and the CMS `blockRegistry`.
    - Avoid introducing new `type` strings in CMS without first updating `PageComponent` and `coreBlockDescriptors` in `@acme/page-builder-core`. ✅ Enforced by the documented workflow in `@acme/page-builder-core/README.md`.
  - Add a lightweight test in `@acme/page-builder-core` or CMS that fails when:
    - A CMS registry entry references a `type` not present in `BlockTypeId`. ✅ Approximated by a Jest contract test in `packages/ui/src/components/cms/blocks/__tests__/coreRegistry.contract.test.ts` that asserts all `coreBlockRegistry` keys are valid `BlockTypeId` values at compile-time and that descriptors with CMS implementations have corresponding registry entries.
    - `coreBlockDescriptors` contains duplicate `type` values. ✅ Checked in `packages/page-builder-core/src/__tests__/blockRegistry.test.ts`.

– **N02-3 – Align runtime registry to the contract**
  - Update runtime renderers (template app `DynamicRenderer` and any tenant equivalents) so they:
    - Import `BlockTypeId` and descriptors from `@acme/page-builder-core`. ✅ Template app `DynamicRenderer` and CMS/shared `DynamicRenderer` both depend on `BlockType`/`BlockTypeId` from `@acme/page-builder-core`.
    - Build their registries via `buildBlockRegistry` instead of ad-hoc maps. ✅ Template app `DynamicRenderer` uses `buildBlockRegistry(coreBlockDescriptors, entries)` to construct its runtime registry.
  - Ensure preview flows (Thread D) use the same registry as live routes, wired through the shared `BlockTypeId` contract. ✅ Template app preview (`/preview/[pageId]`) uses the same `DynamicRenderer` and thus the same registry as the live routes.

– **N02-4 – Starter registry aligned to the default theme**
  - Define the “starter registry” as the combination of:
    - `coreBlockDescriptors` in `@acme/page-builder-core`, and
    - A registry in `@acme/ui` (or `@acme/page-builder-ui` once extracted) that maps those descriptors to default-theme-aware block components.
    - ✅ Implemented: `packages/ui/src/components/cms/blocks/index.ts` builds `coreBlockRegistry` from `coreBlockDescriptors` and the CMS `blockRegistry` using `buildBlockRegistry`.
  - Expose this starter registry via a stable public entrypoint (for example `@acme/page-builder-ui/starterRegistry` or an equivalent path) so:
    - CMS Page Builder can consume it by default.
    - Template and tenant apps can opt in, extend, or override it without forking descriptors.
    - ✅ Implemented: `packages/ui/src/components/cms/index.ts` exports `coreBlockRegistry`, and `packages/page-builder-ui/src/index.ts` re‑exports it as `starterBlockRegistry` plus associated types (`StarterBlockRegistry`, `StarterBlockRegistryEntry`).
  - Wire Configurator/quick-launch so that new shops created with the default theme:
    - Use the starter registry out of the box.
    - Can later opt into extended registries (additional blocks or tenant-specific entries) via configuration rather than code forks.
    - ✅ For now, CMS and template apps use the shared `BlockTypeId`/`coreBlockDescriptors` contract and the default-theme registry; more advanced “registry selection” flows are deferred to follow-up tasks in the shop-build threads.

**Acceptance criteria**

- CMS and runtime apps treat `@acme/page-builder-core` as the single source of truth for block `type` identifiers and descriptor metadata; no app ships its own parallel `type` enums. ✅ `BlockTypeId` and `coreBlockDescriptors` live in `@acme/page-builder-core` and are consumed by CMS and template/runtime code.
- `coreBlockDescriptors` is the canonical descriptor set for core blocks; both CMS and runtime registries are built from it via `buildBlockRegistry`. ✅ `coreBlockRegistry` in CMS and the template app’s registry in `DynamicRenderer` are both built with `buildBlockRegistry(coreBlockDescriptors, entries)`.
- A documented starter registry (default theme + core descriptors) exists and is exported from a stable entrypoint, and:
  - CMS Page Builder uses it as the default registry.
  - The template app uses the same registry for live and preview PB routes.
  - ✅ `starterBlockRegistry` is exported from `@acme/page-builder-ui` (backed by `coreBlockRegistry` in `@acme/ui`), and both CMS and preview/runtime routes rely on the shared `BlockTypeId` and core descriptor contract when rendering PB blocks.
- Adding a new block type follows a single, documented workflow that touches `@acme/types`, `@acme/page-builder-core`, `@acme/ui`/`@acme/page-builder-ui`, and (optionally) templates, with no scattered string literals or per-app contract drift. ✅ Documented in `@acme/page-builder-core/README.md` and enforced by the shared descriptor/registry helpers (new types must be added to `PageComponent`/`coreBlockDescriptors` before appearing in CMS/runtime registries).

---

## PB-N13 — Legal checks in Configurator + Launch

- [ ] **PB-N13 – Add legal checks (TOS/Privacy/Refund links) to configurator/launch readiness; surface in Launch panel**
  - Scope:
    - Make legal links (Terms, Privacy, Refund/Returns) a blocking readiness item for launch via a shared ConfigCheck and Launch checklist row.
    - Accept either CMS-managed PB legal pages or explicit URLs; prefer canonical PB templates when present.
    - Surface actionable fix paths in Configurator, Launch panel, and launch SSE (Stage/Prod).
  - Implementation:
    - Contract and data:
      - Add `checkLegalLinks` (step id `legal`, builder label “Legal & policies”) to `@acme/platform-core/configurator` and `REQUIRED_CONFIG_CHECK_STEPS`.
      - Consider a link valid when Terms + Privacy + Refund/Returns each resolve to either a published PB page with allowlisted slug/stableId (`terms`, `privacy`, `returns`/`refunds`) or an explicit URL on the shop record (reuse `returnPolicyUrl`; add `termsUrl`/`privacyUrl` if missing).
      - Validate that each legal target is reachable from at least one surface: `shop.navigation`, a footer/header legal links list, or checkout/legal PB blocks (for example `PoliciesAccordion`); fail with reason codes such as `missing-terms-link`, `missing-privacy-link`, `missing-refund-link`, `invalid-legal-url`.
      - Provide helpers to normalise/dedupe legal links, resolve PB page slugs to canonical URLs (using `ShopSettings.seo.canonicalBase`), and emit detail payloads for UI copy/telemetry.
    - CMS surfaces:
      - Configurator: add a compact “Legal links” editor in the relevant step (navigation/checkout/settings) that writes to the chosen source (URLs vs PB page selection) and deep-links to “Create legal page” in Page Builder with a legal template.
      - Launch checklist: extend `buildLaunchChecklist`/`CmsLaunchChecklist` so the `legal` row appears with builder copy (`cms.configurator.launchChecklist.legal`) and a CTA to the legal editor; map legal failures from `runRequiredConfigChecks` and `/api/launch-shop` SSE to this row.
      - Launch stream + env summary: include legal-check failures in Stage/Prod launch SSE events and `launchEnvSummary`, with tooltips indicating which link is missing/invalid and the fix target.
    - Tests, telemetry, docs:
      - Add ConfigCheck unit tests for accepted sources, failure reasons, and error handling.
      - Add CMS hook/component tests to ensure the Launch checklist renders the legal row and links to the editor.
      - Document the requirement and fix paths in `docs/cms/configurator-contract.md` and update `docs/shop-owner-workflow.md` with a short “Legal links” note.
  - Definition of done:
    - `checkLegalLinks` is a required ConfigCheck; Configurator and Launch panel show a “Legal & policies” row with actionable fixes.
    - Launch is blocked when Terms, Privacy, or Refund/Returns links are missing/invalid; SSE/Launch panel report the specific missing item.
    - Tests cover ConfigCheck logic and UI wiring; docs and translations include the new legal checklist item.
  - Dependencies:
    - Storage for terms/privacy URLs (Shop/ShopSettings) or canonical PB legal templates to resolve slugs/stableIds.
    - Launch panel translation strings and a Configurator route for the legal editor CTA.
    - Stage launch stream wiring (PB-N14) so legal failures appear consistently across environments.

## PB-N14 — Stage gate for first production launch

- [ ] **PB-N14 – Enforce Stage-before-Prod on first launch; require staging smoke and a manual QA acknowledgement**
  - Scope:
    - First production launch must be preceded by at least one Stage deploy with a passing smoke result and an explicit QA acknowledgement (“I reviewed staging”).
    - Apply both a server-side gate (Launch API) and a Launch panel UI gate; Prod cannot be selected or invoked until the gate is satisfied.
    - Persist stage/test/QA metadata per shop so the gate survives reloads and cannot be bypassed by refreshing the client.
  - Implementation:
    - Data + persistence:
      - Extend deploy persistence (`data/{shop}/deploy.json` via `DeployShopResult`) to record environment, `testsStatus`, `testsError`, and `lastTestedAt` for stage and prod separately. Ensure stage smoke runs set `env: "stage"` and store the result and timestamp.
      - Add a small `launchGate` record keyed by shop that tracks: `stageVerifiedAt`, `stageTestsStatus`, `stageTestsVersion` (deploy id/hash), `qaAck` (user id/name, timestamp, notes). Reset/refresh the gate whenever a new stage deploy is created or smoke tests fail.
      - Surface `launchEnvSummary`/`smokeSummary` data from this record in `useConfiguratorDashboardState` so LaunchPanel can render stage/prod readiness states.
    - Server gate:
      - In `/api/launch-shop`, when `env === "prod"` and the shop has no successful prod launch yet, require:
        - Latest stage deploy exists and `testsStatus === "passed"` (or `"not-run"` only when smoke is explicitly disabled) with a timestamp newer than the last stage deploy.
        - `qaAck` present and tied to the same stage deploy/tests version.
      - Reject requests that do not satisfy the gate with a structured 400 payload (`{ error: "stage-gate", missing: ["stage-tests", "qa-ack"], env: "stage" }`) so the UI can present actionable messaging.
      - Mark `firstProdLaunchedAt` (and capture env/version) after the first successful prod launch to lift the gate for subsequent prod deploys.
    - Launch panel UX:
      - Default target env remains Stage; disable the Prod toggle until the gate passes. Show an inline banner/tooltips summarising unmet gate items (“Run Stage deploy + smoke”, “Check the staging site and confirm QA”).
      - Add a QA acknowledgement control (checkbox + optional text input) scoped to the latest stage deploy; persist via a small `/api/launch-shop/qa-ack` endpoint or an extension to `/api/configurator-progress`.
      - Add checklist rows for `Stage smoke` and `QA acknowledged` in `CmsLaunchChecklist`, derived from the persisted gate state, and wire the existing “Re-run smoke tests” action to always target Stage.
    - Telemetry + observability:
      - Emit events for gate block/unblock (`build_flow_stage_gate_blocked`, `build_flow_stage_gate_cleared`), smoke reruns, and QA acknowledgement with `shopId`, `env`, `deployId/version`, and user id so PB-N17 observability can attribute failures.
      - Log gate decisions in `/api/launch-shop` for auditability.
    - Docs + tests:
      - Update `docs/shop-owner-workflow.md` and `docs/cms/build-shop-guide.md` launch sections to note the enforced Stage-first rule, smoke dependency, and QA checkbox.
      - Extend API tests (`apps/cms/__tests__/api/launch-shop.test.ts`) to cover: prod blocked before stage smoke, prod blocked before QA ack, prod allowed after both, and gate lifted after first prod success. Add a lightweight component test for LaunchPanel showing the disabled Prod toggle + checklist rows.
  - Definition of done:
    - Attempting a first prod launch without a passing stage smoke or QA acknowledgement is blocked server-side and surfaced in Launch panel copy/tooling; bypass via direct API calls is prevented.
    - Stage smoke status and QA acknowledgement persist per shop, display in Launch panel (env summary + checklist), and drive the Prod toggle state.
    - After the first successful prod launch, the gate is marked as satisfied while retaining stage/prod smoke summaries for observability.
    - Tests cover server gating and UI gating; docs describe the Stage-first requirement.
  - Dependencies:
    - Stage smoke pipeline available (`verifyShopAfterDeploy`/`test:shop-smoke`), Launch panel wiring to checklist/env summary, PB-N13 legal checks surfacing in the same panel.

---

## PB-N11 — Draft/Published clarity + Stage preview

- [ ] **PB-N11 – Make Draft vs Published explicit in Page Builder; Stage preview uses latest Draft**
  - Status: Planned — the builder top bar shows autosave/publish but doesn’t expose draft/published state or preview targets.
  - Scope:
    - Surface Draft/Published state (including “unpublished changes”) in the Page Builder chrome with last saved/published timestamps.
    - Provide a stable preview entry that prefers the Stage runtime, generates a preview token, and opens the latest draft after saving.
    - Align save/publish semantics so edits to a published page record “unpublished changes” instead of silently replacing the live state.
  - Implementation:
    - Data contract + publish metadata:
      - Extend the persisted page record with published metadata (`publishedAt`, `publishedBy`, optional `publishedRevisionId`/hash) alongside `updatedAt`; keep `pageSchema` backwards compatible via defaults/migrations.
      - On publish (CMS server action + `usePageBuilderSave`), set `status: "published"`, stamp published metadata, and store an exported snapshot or history marker so the last published version is recoverable.
      - On save after publish, mark the page as having unpublished changes (e.g., `status: "draft"` or `history.meta.unpublishedSince`) without dropping the last published marker; compute the flag from `exportComponents` hashes to avoid false positives.
    - Page Builder UI:
      - Add status chips in `PageBuilderTopBar`/`HistoryControls` showing Draft/Published/Unpublished changes with tooltips for last saved/published timestamps and publisher.
      - Thread the new metadata through `PageBuilderProps`/`PageBuilderLayout` so the top bar and pages panel render state without reloading the full page; update `apps/cms/src/app/cms/shop/[shop]/pages/[page]/builder/page.tsx` to pass the fields.
      - Add a Preview control near the right actions that triggers `handleSave`, then builds a preview link labelled with the target env (Stage/Dev/Local) and offers “Open” + “Copy link”.
    - Preview URL + token resolution:
      - Add a resolver that prefers Stage deploy info (`readDeployInfo` / `getShopBaseUrl` with `env: "stage"`), falls back to `previewUrl`/`url`/`NEXT_PUBLIC_TEMPLATE_BASE_URL`, then local template app.
      - Generate preview tokens server-side via `createPreviewToken`/`createUpgradePreviewToken` (shopId + pageId), expose them to the builder via a small API/loader, and append to `/preview/[pageId]` links; guard when secrets are missing.
      - Ensure preview renders the latest draft: save before generating the link and rely on the stage runtime preview route (`packages/template-app/src/routes/preview/[pageId].ts`) reading current components; document fallback when Stage is unavailable.
    - Tests and docs:
      - Add unit tests for the preview URL resolver (Stage preferred, sane fallbacks) and status derivation (draft vs published vs unpublished changes).
      - Add a lightweight UI test for `PageBuilderTopBar`/Preview control that exercises “save then open preview” and verifies the env label/token are present.
      - Update `docs/preview-flows.md` and `docs/shop-owner-workflow.md` (and CMS help copy if present) to describe the new chips, Stage-first preview behaviour, and how to recover last published content.
  - Definition of done:
    - Page Builder shows Draft/Published state with last saved/published timestamps and flags unpublished changes after edits post-publish.
    - Preview action saves the draft, builds a tokenised link to the Stage runtime when available (fallbacks documented), and renders the latest draft, not the last published snapshot.
    - Publish/save flows record published metadata and preserve the last published snapshot/marker so edits do not silently replace the live state; status chips reflect the correct state.
    - Tests cover status computation and preview URL resolution; docs point shop owners/QA to the Stage preview flow.
  - Dependencies:
    - PB-N01/02 for stable PB surface + registry; PB-N04 templates for realistic previews; Stage deploy info/preview secrets from the launch pipeline; PB-N10/PB-N09 for runtime preview parity.

---

## PB-N12 — Checkout layout vs settings separation

- [ ] **PB-N12 – Separate checkout settings (Configurator) from checkout layout (Page Builder). Provide a checkout template and a direct link from Configurator.**
  - Status: Planned — the checkout wizard step currently embeds the Page Builder (`apps/cms/src/app/cms/configurator/steps/StepCheckoutPage.tsx`), mixing settings with layout edits.
  - Scope:
    - Keep checkout configuration (payments/shipping/taxes/live settings surfaced elsewhere in the wizard) inside the Configurator and move all layout editing to the Page Builder.
    - Treat checkout as a dedicated Page Builder page built from the core checkout template and checkout-safe blocks; enforce a consistent slug/stable id and preview URL.
    - Give shop owners a clear CTA from the Configurator to open the checkout page in Page Builder plus a Stage/draft preview link; show status (draft/published, last saved) inline.
  - Implementation:
    - Checkout template + scaffolding:
      - Confirm `core.page.checkout.shell` in `@acme/templates` is exposed via `/cms/api/page-templates` as the default checkout template (PB-N04) with preview metadata and category `checkout`.
      - Add a helper (for example `createOrFetchCheckoutPage(shopId)`) used by the checkout step and PB route to:
        - Create a checkout page from the core template when missing, using a reserved slug/stable id (e.g., `checkout`) and persisting `checkoutPageId` + `checkoutLayout` in configurator state.
        - Return the existing checkout page and latest draft/published metadata when it already exists so the Configurator can render status and previews without loading the full Page Builder.
    - Configurator step UX split:
      - Refactor `StepCheckoutPage` to focus on status + actions:
        - Replace the inline `PageBuilder` with a summary card (selected template, last draft/published timestamp, preview link to Stage when available, otherwise draft preview).
        - Keep template selection (non-blank required) but treat “Edit checkout layout” as a CTA that opens the checkout Page Builder route with the resolved `checkoutPageId`/slug and updates state after first save.
        - Gate completion on: template selected, checkout page saved at least once, and the related checkout settings steps (payment/shipping) marked complete; keep `useStepCompletion("checkout-page")` keyed to `checkoutPageId`.
    - Page Builder checkout mode:
      - Add or adjust the CMS PB route for checkout (for example `/cms/shop/[shop]/pages/checkout` or `/pages/[id]?kind=checkout`) to:
        - Auto-create/fetch the checkout page via the helper above and seed it with `core.page.checkout.shell` when new.
        - Restrict the palette to checkout-safe/system blocks (`CheckoutSection`, `CartSection`, trust/benefit blocks); hide marketing-only blocks and enforce checkout-only presets.
        - Surface Draft vs Published chips (PB-N11) and a persistent Stage preview link to `/checkout` (latest Draft) plus a “Back to Configurator” link.
    - Launch/readiness wiring:
      - Add a ConfigCheck that fails when no checkout layout exists or has never been published; surface it in the Launch panel with a link to the checkout PB route.
      - Update configurator persistence (`checkoutPageId`, `checkoutLayout`) and progress seeds (`data/cms/configurator-progress.json`, `useStepCompletion`) to reflect the new flow.
      - Document the split (settings vs layout) in `docs/cms/build-shop-guide.md` so onboarding and QA know where to edit checkout UI vs providers.
    - Tests:
      - Update `StepCheckoutPage` tests to assert the new CTA/summary flow and completion gating (template + saved checkout page).
      - Add CMS route tests for the checkout PB deep link/helper and the palette restriction to checkout blocks.
      - Add a smoke/UI test that opens the checkout PB route, inserts the checkout preset, saves a draft, and confirms the Configurator reflects the saved page id/template.
  - Definition of done:
    - Configurator checkout step no longer embeds the Page Builder; it shows checkout status and links out to edit layout while keeping checkout settings in the wizard.
    - Checkout page uses the core checkout template by default, is edited in the standard Page Builder with checkout-only blocks, and exposes a clear Stage/draft preview and Draft/Published chips.
    - Launch readiness requires a saved checkout layout; missing or unpublished checkout layout surfaces as a blocking ConfigCheck with direct navigation to fix.
    - Tests cover the Configurator flow, the checkout PB entrypoint/palette restrictions, and a basic save path for the checkout layout.
  - Dependencies:
    - PB-N04 (checkout template availability) and PB-N11 (Draft/Publish chips + Stage preview semantics).
    - Stable checkout blocks in the shared registry and Stage host availability for `/checkout` previews.

## PB-N10 — Runtime preview parity test

- [x] **PB-N10 – Runtime preview test: ensure published page renders correctly in template app with the shared registry**
  - Status: Done — `packages/template-app/__tests__/runtime-preview-parity.test.tsx` seeds a published PB page via `scaffoldPageFromTemplate`, calls the real Cloudflare preview handler and Next.js preview page with `starterBlockRegistry`, and asserts 200/401/404 plus block render/metadata stripping.
  - Scope: Add a deterministic guardrail for the publish->preview path so a published PB page renders via the template app preview route using the same starter registry as live traffic.
  - Implementation:
    - Seed a published page (for example `core.page.home.default` via `scaffoldPageFromTemplate`) into a temporary `DATA_ROOT` with `PAGES_BACKEND=json`, using `savePage` from `@acme/platform-core/repositories/pages` and a preview token from `createPreviewToken`.
    - Call the Cloudflare handler (`packages/template-app/src/routes/preview/[pageId].ts`) with the token and render the Next.js preview page (`packages/template-app/src/app/preview/[pageId]/page.tsx`) without stubbing `DynamicRenderer`/`starterBlockRegistry`.
    - Assert: handler returns 200 for the seeded page and 401/404 for bad or missing tokens; rendered output contains a known block from the template and fails fast if any block type is absent from `coreBlockDescriptors`/`starterBlockRegistry`; editor-only metadata is stripped by `exportComponents`.
    - Keep the test self-contained (temp data root, no CMS server) and wire it into `pnpm --filter @acme/template-app test`.
  - Definition of done:
    - CI fails if runtime preview drifts from the shared registry, token handling, or publish storage semantics.
    - A published PB page round-trips through `/preview/:pageId` and renders in the template app with the same blocks/props users see post-launch.
  - Dependencies:
    - PB-N01/02 for registry exports, PB-N04 for fixtures, PB-N09 for the broader compose->publish E2E.
