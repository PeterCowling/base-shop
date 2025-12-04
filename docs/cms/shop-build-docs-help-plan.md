Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03
File: docs/cms/shop-build-docs-help-plan.md
Primary code entrypoints:
- `docs/cms/build-shop-guide.md`
- `docs/cms/configurator-contract.md`
- `docs/cms/shop-build-plan.md`
- `docs/cms/shop-build-journey-map.md`
- `docs/cms/shop-build-gap-analysis.md`
- `apps/cms/src/app/cms/configurator`
- `apps/cms/src/app/cms/shop/[shop]/settings/components`
- `apps/cms/src/app/cms/pages`
- `apps/cms/src/app/cms/products`
- `apps/cms/src/app/cms/telemetry`
- `packages/platform-core/src/configurator.ts`

# Shop Build Docs & Inline Help Plan (CMS-BUILD-11 prep)

This document is the **implementation spec for CMS-BUILD-11** (docs + inline help + telemetry for the shop build flow).

- **Audience:** CMS developers, UX writers, and AI agents implementing or updating build-time docs, helpers, and metrics.
- **Authority:**
  - Behaviour and invariants are always defined by code and Contracts (for example `docs/cms/configurator-contract.md`).
  - This spec is authoritative for *what* CMS-BUILD-11 must implement in docs, UI helpers, and telemetry.
  - `docs/cms/build-shop-guide.md` and `docs/cms/configurator-contract.md` remain the canonical guides once updated; this file describes how they should evolve.

The spec assumes the core discovery work from CMS-BUILD-01/02/03/04/06/07/08/09 is in place; it choreographs how to translate that knowledge into:

1. **Canonical references** (`docs/cms/build-shop-guide.md`, `docs/cms/configurator-contract.md`) that now describe the new journey maps, starter kits, first-product flow, and build telemetry.
2. **In-app helpers** that point builders toward those docs when they hit a blocker (StatusBar, SettingsHero, Navigation summary, Page Builder screens).
3. **Telemetry/metrics events** that emit structured signals from Configurator steps and post-launch surfaces so we can prove the new flows are working.

Use this doc as the single source of truth for the “docs + help” work in CMS-BUILD-11. Each bullet below refers to files or components you can edit directly; update this note if the work shifts or a new doc link is required.

## 1. Documentation targets

- **`docs/cms/build-shop-guide.md`**
  - **Must** add a “Quick reference” section near the top that links to `docs/cms/shop-build-journey-map.md` and spells out the Configurator → Settings → Pages → Products path described in CMS-BUILD-01/06.
    - Use an H2 heading `## Quick reference` so the anchor is `#quick-reference`.
  - Expand the “Step 3 — Add mandatory content” section to include:
    - **Must** add an H2 `## Starter kits` so the anchor is `#starter-kits` and list the recommended combinations of `packages/templates/src/corePageTemplates.ts`, `packages/ui` organisms (hero, grid, PDP, checkout shell), and Page Builder presets for home/shop/checkout routes (CMS-BUILD-07 deliverable).
    - **Must** add an H2 `## First product` so the anchor is `#first-product`, referencing `apps/cms/src/app/cms/products`, `packages/platform-core/src/repositories/products.server.ts`, and the `productSchema`/`inventory` requirements; link this to the first-product wizard/modal defined in CMS-BUILD-10 once it exists.
  - **Must** document the new inline help surfaces (StatusBar/SettingsHero/ConfigurationOverview) and emphasise that the journey map is the authoritative route for understanding how to recover from failing ConfigChecks.
  - **Should** include a short “Telemetry signals to watch” callout referencing `docs/cms-plan/thread-e-observability.md` and the event names in this spec so readers can monitor the build flow in the CMS telemetry UI.

- **`docs/cms/configurator-contract.md`**
  - **Must** add a “Build helpers & doc links” section describing how Configurator statuses now embed doc pointers (StatusBar, guided CTA) and how the contract ties to the journey map, starter kits, and first-product wizard.
  - **Must** document the telemetry contract using the canonical event names defined below:
    - `build_flow_step_view`
    - `build_flow_step_complete`
    - `build_flow_step_error`
    - `build_flow_first_product_prompt_viewed`
    - `build_flow_first_product_created`
    - `build_flow_help_requested`
    - `build_flow_exit`
    and state that Configurator steps emit the `build_flow_step_*` events with the current `stepId` + `shopId`.
  - **Should** reference `track` calls (see `apps/cms/src/app/cms/shop/[shop]/wizard/new/page.tsx` for an existing example) so future developers know how to add instrumentation, and recommend the `build_flow_*` naming family for events scoped to the build journey.

- **`docs/cms/shop-build-plan.md`**
  - **Must** link to this spec (`docs/cms/shop-build-docs-help-plan.md`) from the plan introduction so implementers know where to look for doc/help/telemetry details.
  - **Must** promote `docs/cms/shop-build-gap-analysis.md` and `docs/cms/shop-build-journey-map.md` as supporting artifacts for the tasks, ensuring the plan’s Definitions of Done mention the doc updates explicitly (e.g., CMS-BUILD-04 now references the new “Starter kits” subsection, CMS-BUILD-11 is responsible for the documentation updates and inline help).

### 1.1 Minimal first-product fields (canonical list)

All first-product UX, docs, and telemetry must treat this list as the single source of truth for the minimal fields required to satisfy `checkProductsInventory`:

- **Required**
  - Product title in the primary locale (`ShopSettings.languages[0]`).
  - Base price (numeric, ≥ 0).
  - At least one inventory item:
    - Location identifier (e.g. “main”).
    - Quantity (number > 0).
  - Publish flag or equivalent state that marks the product “active” (or scheduled) so it is visible to the runtime and ConfigCheck.
- **Optional**
  - A single placeholder image (using existing media upload/browse flows).

All CTAs, modals, and wizards should link back to this list when describing “what’s required to launch” to avoid drift.

### 1.2 Relationship to CMS-BUILD-10

- **CMS-BUILD-10** is responsible for designing and implementing the first-product wizard/modal (including routing, form layout, and server behaviour).
- **CMS-BUILD-11** is responsible for:
  - Updating docs to describe the wizard and minimal fields.
  - Wiring inline help and telemetry events for the wizard and related CTAs.
- If CMS-BUILD-10 ships after CMS-BUILD-11:
  - Docs should describe the intended wizard and clearly mark it as “coming soon”.
  - Inline help links should temporarily direct users to the standard “New Product” flow until the wizard route is available, and telemetry should still emit `build_flow_first_product_prompt_viewed` / `build_flow_first_product_created` when possible.

## 2. Inline help surfaces

Implement the following inline helpers, each pointing to the relevant doc(s):

- **`ConfiguratorStatusBar` (`apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx`)**
  - **Must** add a `Help` icon/button next to the tour link that opens `docs/cms/build-shop-guide.md` (or the journey map) in a new tab using a CMS-relative URL (e.g. `/docs/cms/build-shop-guide.md`) with `target="_blank"` and `rel="noreferrer"`.
  - **Must** include an accessible label such as `aria-label="Open the shop build guide"` and ensure the button is keyboard-focusable and ordered immediately after the primary CTAs.
  - **Must** derive `shopId` and `currentStep` from `ConfiguratorContext` and emit `track("build_flow_help_requested", { shopId, stepId: currentStep, surface: "statusBar" })` when the button is clicked.

- **`SettingsHero` (`apps/cms/src/app/cms/shop/[shop]/settings/components/SettingsHero.tsx`)**
  - **Must** replace the existing link to `docs/shop-editor-refactor.md` with `docs/cms/build-shop-guide.md`, keeping `target="_blank"` and adding `aria-label="Open the shop build guide"`.
  - **Should** add a second button that opens `docs/cms/shop-build-journey-map.md` so users can jump straight to the map, with `aria-label="Open the shop build journey map"`.
  - **Should** add a small “Need a starter kit?” badge near the snapshot card linking to `docs/cms/build-shop-guide.md#starter-kits`.
  - **Must** emit `track("build_flow_help_requested", { shopId, stepId: "settings", surface: "settingsHero" })` when either help button is clicked.

- **`ConfigurationOverview` (`apps/cms/src/app/cms/shop/[shop]/settings/components/ConfigurationOverview.tsx`)**
  - **Must** add a “Learn why languages matter” link under the “Language coverage” card that opens `docs/cms/build-shop-guide.md#first-product` or the language section, with a consistent accessible label.
  - **Should** keep the existing theming link but annotate it with text such as “Starter kit tokens” to signal the connection to the new plan items.
  - **Should** emit `track("build_flow_help_requested", { shopId, stepId: "settings", surface: "configurationOverview" })` when the language help link is clicked.

- **`Products` zero state / listing (`apps/cms/src/app/cms/products/page.tsx` + any card components)**
  - **Must** show a “Need a product to launch?” CTA when no products exist; clicking it opens a modal describing the minimal fields required for `checkProductsInventory` (use the canonical list above) and linking to `docs/cms/build-shop-guide.md#first-product`.
  - **Must** connect the CTA or modal to the first-product wizard route defined by CMS-BUILD-10 once it exists; until then, send users to the standard “New Product” page.
  - **Must** track `build_flow_first_product_prompt_viewed` when the modal is shown and `build_flow_first_product_created` when the minimal product is successfully created, using `track("build_flow_first_product_prompt_viewed", { shopId })` and `track("build_flow_first_product_created", { shopId, productId })`.

- **Page Builder / Additional Pages editors (`apps/cms/src/app/cms/pages/edit/component/page.tsx` and config step `StepAdditionalPages`)**
  - **Should** add help banners linking to `docs/cms/build-shop-guide.md#starter-kits` and the journey map, emphasising that the Page Builder components listed there (hero, value props, grids) are the ones expected in starter kits.
  - **Should** emit `track("build_flow_help_requested", { shopId, stepId: "additional-pages", surface: "pageBuilder" })` when the banner links are clicked.
- **Theme Editor (`apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`)**
  - **Should** surface a tooltip or inline link that points to `docs/theming-charter.md` (existing) plus `docs/cms/build-shop-guide.md#starter-kits` for the specific tokens used in build starter kits, with a consistent accessible label.
  - **Should** emit `track("build_flow_help_requested", { shopId, stepId: "theme", surface: "themeEditor" })` when help links are clicked.

## 3. Telemetry / metrics links

Align the telemetry plan below with `docs/cms-plan/thread-e-observability.md` so build-specific metrics feed into the CMS observability table (`apps/cms/src/app/cms/telemetry`). For each event, import `track` from `@acme/telemetry` (see the wizard examples) and include a `name` that begins with the `build_flow_` prefix so `TelemetryFiltersPanel` presets can filter on this family.

### 3.1 Canonical event names and payloads

| Event | Trigger location | Payload |
| --- | --- | --- |
| `build_flow_step_view` | Each Configurator step component (e.g., `StepShopDetails`, `StepPaymentProvider`, `StepShipping`, `StepInventory`, `StepHomePage`, `StepCheckoutPage`) when mounted/viewed. | `{ shopId, stepId }` |
| `build_flow_step_complete` | When `useStepCompletion` marks a step complete (`markComplete(true)`). | `{ shopId, stepId }` |
| `build_flow_step_error` | When a step fails validation (e.g., inside `useConfiguratorStep` or after `markComplete` if errors exist). | `{ shopId, stepId, reason }` |
| `build_flow_first_product_prompt_viewed` | The newly added first-product modal or CTA on the Products page. | `{ shopId }` |
| `build_flow_first_product_created` | When the wizard saves the minimal product needed for `checkProductsInventory`. | `{ shopId, productId }` |
| `build_flow_help_requested` | Any inline help button or link described above (StatusBar, SettingsHero, ConfigurationOverview, Products zero state, Page Builder, Theme Editor). | `{ shopId, stepId, surface: "statusBar" \| "settingsHero" \| "configurationOverview" \| "products" \| "pageBuilder" \| "themeEditor" }` |
| `build_flow_exit` | Configurator exit points (StatusBar link back to `/cms/shop/{shop}` or when the user jumps to Settings/Pages/Products via CTA). | `{ shopId, reason: "settings" \| "pages" \| "products" \| "tour", surface: "statusBar" \| "dashboard" }` |

All “First-product events” (prompt viewed/created) and “help/exit events” must use these names and payload shapes; other docs should reference this list rather than redefining it.

### 3.2 Telemetry UI expectations

- **Must** ensure the telemetry page (`apps/cms/src/app/cms/telemetry/page.tsx`) can surface these names by updating `getPresets` in `TelemetryFiltersPanel` (`apps/cms/src/app/cms/telemetry/telemetryUtils.ts`) to include a `build-flow` preset:
  - Example preset:
    - `id: "build-flow"`
    - `apply: () => ({ name: "build_flow_" })`
  - This allows users to quickly filter to the build-flow event family.
- **Should** update help copy and translations to reference “Build flow” explicitly (e.g., `cms.telemetry.presets.buildFlow.*` keys) so operators know how to use the preset.

## 4. Next steps

1. Update the docs named above and mark CMS-BUILD-11’s Definition of Done to mention the new doc sections, inline help links, and telemetry events.
2. Wire each inline help component to the targeted docs and add the `track` calls so CMS telemetry can validate the new flows.
3. Once the doc/work updates are in, rerun `pnpm docs:lint` and ensure the registry lists the new doc (this file) so agents can find it via `docs/registry.json`.
