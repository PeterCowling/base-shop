---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: inventory-app-uploader-unification
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-plan
Supporting-Skills: none
Related-Plan: docs/plans/inventory-app-uploader-unification/plan.md
Trigger-Why: Unify the repo's existing inventory capabilities into a coherent inventory app and define a better, all-product uploader direction without re-implementing inventory from scratch.
Trigger-Intended-Outcome: type: operational | statement: a planning-ready architecture brief and forward prompt that treats inventory as a first-class app, reuses CMS and platform-core where possible, and separates inventory operations from broader catalog/media workflows | source: operator
---

# Inventory App + Uploader Unification Fact-Find Brief

## Scope
### Summary
The repo already contains substantial inventory capability across `apps/cms`, `packages/platform-core`, and Caryina. The gap is not "missing inventory" so much as "missing coherence": inventory operations, product import, stock event handling, central-inventory primitives, and Caryina-specific admin/product editing exist, but they are spread across separate surfaces with uneven scope. The goal of this fact-find is to consolidate the real current state, incorporate the new requirement that the operator UI must match XA uploader exactly except for a shop selector, and define a prompt that takes an inventory-first path forward.

### Goals
- Map the existing inventory stack that already exists in CMS, platform-core, and Caryina.
- Identify which parts should be reused as the baseline for an inventory app.
- Determine the correct app shell given the new requirement that the UI must match XA uploader.
- Separate pure inventory operations from broader catalog, media, and publish concerns.
- Produce an explicit keep/move/drop recommendation for functionality currently split across CMS and `platform-core`.
- Determine what XA uploader patterns are worth borrowing and what should not be copied.
- Produce a repo-grounded prompt artifact for the next planning/build pass.

### Non-goals
- Implementing the inventory app in this fact-find.
- Designing a full standalone uploader UI.
- Migrating the stack to D1/R2/Workers-native persistence in this pass.
- Designing a bespoke XA-style media pipeline for inventory v1.

### Constraints & Assumptions
- Constraints:
  - Fact-find only; no product or inventory code changes.
  - The recommended direction must be grounded in current repository reality, not in a hypothetical greenfield architecture.
  - The user explicitly prefers splitting non-inventory concerns away and using CMS as the starting point.
  - The operator-facing UI must work and look exactly like XA uploader, except with a shop selector in place of XA's storefront scoping.
- Assumptions:
  - "Inventory app" means inventory authority, stock operations, stock visibility, and inventory-related import flows first; richer catalog/media publishing can remain a separate lane.
  - "Exactly like XA uploader" applies to the operator shell, navigation model, interaction structure, and console layout, not necessarily to XA's catalog deploy semantics.

## Outcome Contract
- **Why:** The repo already has enough inventory capability that a full rewrite would create avoidable duplication. The next step should consolidate and harden what exists into one coherent inventory product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a planning-ready brief and execution prompt that reuses CMS and shared inventory services, defines the gaps to close, and avoids folding unrelated catalog/media problems into the first inventory build.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `apps/cms/src/app/api/data/[shop]/inventory/import/route.ts` - CSV/JSON inventory import.
- `apps/cms/src/app/api/data/[shop]/inventory/export/route.ts` - CSV/JSON inventory export.
- `apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts` - stock correction API with history.
- `apps/cms/src/app/api/shop/[shop]/stock-inflows/route.ts` - stock receiving API with history.
- `apps/cms/src/app/api/shop/[shop]/product-import/route.ts` - bulk product import API with preview/idempotency.
- `packages/platform-core/src/repositories/inventory.server.ts` - shared inventory repository abstraction.
- `packages/platform-core/src/centralInventory/centralInventory.server.ts` - central inventory + routing + sync primitives.
- `packages/platform-core/src/repositories/media.server.ts` - shared media upload/list/update/delete contract with optional R2 backing.
- `packages/platform-core/src/repositories/media.r2.server.ts` - R2 object write/delete helpers and public URL construction.
- `packages/types/src/Product.ts` - current generalized product contract; important for assessing whether schema-driven category definitions already exist.
- `apps/caryina/src/lib/shop.ts` - Caryina storefront reads shared product/inventory repositories directly.
- `apps/caryina/src/lib/checkoutSession.server.ts` - hold commit path that turns successful payments into stock decrements.
- `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` - XA bulk catalog upsert reference.
- `apps/xa-uploader/src/app/api/catalog/images/route.ts` - XA image upload reference.
- `apps/xa-uploader/src/app/UploaderShell.client.tsx` - XA top-level operator shell reference.
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` - XA split-pane console reference.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` - XA scoped console-state and selector-change reference.

### Key Modules / Files
- `apps/cms/src/app/cms/shop/[shop]/data/inventory/page.tsx`
  - CMS already exposes a generalized inventory UI with quick stats and editable matrix for any shop.
- `apps/cms/src/app/cms/shop/[shop]/data/inventory/hooks/useInventoryEditor.ts`
  - Inventory editing logic already supports dynamic variant attributes, row creation/removal, and threshold/wear fields.
- `apps/cms/src/app/cms/shop/[shop]/uploads/stock-adjustments/stockAdjustments.client.tsx`
  - CMS already has an inventory-aware operational tool for corrections, including idempotency, dry-run, variant matching, and history.
- `apps/cms/src/app/cms/shop/[shop]/uploads/stock-inflows/stockInflows.client.tsx`
  - CMS already has a receiving workflow for incoming stock, again with idempotency and snapshot-assisted row filling.
- `apps/cms/src/app/cms/shop/[shop]/uploads/products/productImport.client.tsx`
  - CMS already has a reusable pattern for preview-first bulk import, commit gating, and recent import audit history.
- `packages/platform-core/src/repositories/inventory.prisma.server.ts`
  - Shared inventory persistence already supports read/write/update, low-stock alert triggering, and upsert semantics.
- `packages/platform-core/src/types/inventory.ts`
  - Canonical per-shop inventory contract already includes quantity, variants, thresholds, and wear/maintenance fields.
- `packages/platform-core/src/centralInventory/centralInventory.server.ts`
  - A separate central-inventory model already exists with routings, shop allocation calculation, shop sync, and bulk import.
- `packages/platform-core/src/inventoryValidation.ts`
  - Shared validation can validate against shop inventory or central inventory allocations, but the central path is not the default public API path today.
- `packages/platform-core/src/repositories/media.server.ts`
  - Shared media handling already supports upload, delete, metadata updates, per-shop namespacing, and optional R2-backed public URLs.
- `apps/cms/src/app/api/media/route.ts`
  - CMS already exposes authenticated media list/upload/delete/update endpoints backed by the shared media repository.
- `packages/types/src/Product.ts`
  - Current `ProductPublication` is still a fixed-shape product model; it does not provide a category-defined dynamic field system.
- `packages/platform-core/src/productTemplates.ts`
  - The repo already has product template cloning, but templates are prefilled blueprints, not category/schema definitions.
- `packages/lib/src/xa/catalogAdminSchema.ts`
  - XA uploader's product authoring model is explicitly schema-driven and category-aware, but the schema is hardcoded in code rather than operator-defined at runtime.
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
  - XA uses controlled selectors and registries for brand, collection, size, materials, colors, hardware colors, and interior colors, then derives fields from those selections.
- `apps/xa-uploader/src/lib/catalogBrandRegistry.ts`
  - XA maintains a structured option registry with collection defaults, allowed values, and popularity weights.
- `apps/caryina/src/app/admin/api/products/route.ts`
  - Caryina admin product create is MVP-only: English-driven, single-item CRUD, no preview/bulk/media pipeline.
- `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`
  - Caryina admin inventory updates are narrow but already upsert missing rows when the product exists.
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
  - XA uploader is built around catalog draft/publish/deploy concerns, not day-to-day inventory operations.
- `apps/xa-uploader/src/app/UploaderHome.client.tsx`
  - XA uploader home already composes shell + console cleanly, making it a strong frontend shell donor.
- `apps/xa-uploader/src/app/UploaderShell.client.tsx`
  - The header, page chrome, and header action slot are already isolated enough to reuse in a new operator app.
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - The left-selector/right-editor structure directly matches the desired inventory-app interaction model.
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - XA already has a scoped selector reset pattern (`handleStorefrontChangeImpl`) that can be adapted to a shop selector.

### Patterns & Conventions Observed
- **CMS is already the generalized admin baseline.**
  - Inventory, stock adjustments, stock inflows, and product imports are already shop-parameterized CMS surfaces rather than Caryina-only features.
- **Bulk import patterns already exist outside XA uploader.**
  - Product import in CMS already has preview, commit gating, idempotency, and immutable import logs.
- **Inventory operations are modeled separately from product publishing.**
  - Inventory snapshot import/export, stock adjustments, stock inflows, and product import are different concerns with different APIs and logs.
- **Media handling is already shared and shop-scoped.**
  - The repo already has a reusable media repository with optional R2 storage and stable metadata, so the new app should reuse that rather than cloning XA's image route.
- **XA's data integrity comes from controlled registries, not from freeform generic forms.**
  - XA hardcodes category-specific schemas and then narrows operator input using brand/collection registries, selector-based options, and derived defaults.
- **XA also derives publishable fields from structured selections.**
  - Title, slug, description, popularity, and some taxonomy/detail defaults are auto-constructed from brand, collection, size, color, and material choices.
- **Caryina storefront already reads live shared repositories.**
  - Caryina does not depend on a static storefront export for stock reads; it reads through `platform-core` repository helpers.
- **XA uploader solves a different first-order problem.**
  - XA’s standout capabilities are catalog publish flow, media upload, auth/rate limits, cloud contract sync, and deploy orchestration. Those are not a natural v1 baseline for an inventory-first app.
- **XA uploader already has the correct frontend shell for the new requirement.**
  - The shell, split-pane console layout, session gate, and scoped-state reset logic are all reusable without inheriting XA’s catalog-publish backend model.
- **CMS is now the functional baseline, not the visual baseline.**
  - Given the new "look exactly like XA uploader" requirement, CMS should be treated as the feature and API baseline, while XA uploader should be treated as the frontend-shell baseline.

### Data & Contracts
- Types/schemas/events:
  - `InventoryItem` already supports `sku`, `productId`, `quantity`, `variantAttributes`, `lowStockThreshold`, `wearCount`, `wearAndTearLimit`, and `maintenanceCycle`.
  - `ProductPublication` already supports full translated `title`/`description`, `draft|review|scheduled|active|archived`, `media`, `materials`, `dimensions`, and `weight`.
  - CMS product import already accepts either translated maps or plain strings for `title` and `description`.
  - XA `catalogProductDraftSchema` hardcodes category-specific taxonomy/detail fields and validation rules, including category-gated requirements such as sizes for clothing and metal for jewelry.
- Persistence:
  - Per-shop inventory uses `inventory.server.ts` -> Prisma or JSON backend selection.
  - Central inventory has distinct Prisma models: `CentralInventoryItem` and `InventoryRouting`.
  - Shared media uses per-shop metadata plus either local `/uploads/<shop>/...` files or R2-backed public URLs.
  - Stock adjustments and stock inflows append immutable JSONL audit logs.
- API/contracts:
  - `POST /api/data/[shop]/inventory/import` writes a full inventory snapshot from CSV/JSON.
  - `GET /api/data/[shop]/inventory/export` returns JSON/CSV snapshot.
  - `POST /api/shop/[shop]/stock-adjustments` and `POST /api/shop/[shop]/stock-inflows` support idempotent operational events.
  - `POST /api/shop/[shop]/product-import` supports dry-run preview and commit.
  - `GET|POST|PATCH|DELETE /api/media?shop=<shop>` already provides authenticated media management over the shared repository.
  - Caryina `POST /admin/api/products` and `PATCH /admin/api/products/[id]` expose only narrow single-product CRUD.
- Authority caveats:
  - Per-shop inventory keying is based on `variantKey(sku, attrs) -> sku#key:value|...`.
  - Central inventory currently builds keys as `sku:key=value,...`.
  - Any plan that promotes central inventory into the primary authority must normalize or bridge that key format before claiming safe interoperability with existing shop-inventory update/read paths.
  - **Recommended canonical format: adopt the per-shop format (`sku#key:value|...`) as the single standard.** Rationale: it is already used in all live checkout paths (hold commit, stock decrement, inventory reads in Caryina) and in existing test coverage. The central inventory key format is used only in internal allocation logic with no direct storefront exposure, making it the safer side to migrate. The normalization should be implemented as an adapter in `platform-core/src/centralInventory/` that rewrites central keys on read/write rather than as a schema migration, so existing per-shop paths are untouched.
- Product-model caveats:
  - The current shared product contract is mostly fixed-shape. It can carry richer fields such as `materials`, `dimensions`, and `weight`, but it does not yet provide a generalized per-category attribute schema with typed selectable fields.
  - XA's current solution is not a generic runtime "category creator"; it is a hardcoded schema plus a registry of controlled values and derivation rules.
  - Supporting arbitrary product categories across shops will require a new shared definition layer rather than just copying XA components.
- Media/path caveats:
  - XA uploader's image route is XA-specific: it writes either to the XA media bucket or to `xa-b/public/images/...` in local mode.
  - The inventory app should not inherit that route shape. It should use the shared media repository and keep product `media[]` as stable URLs.

### Dependency & Impact Map
- Upstream dependencies:
  - `platform-core` inventory repository, central inventory module, product import services, and checkout hold lifecycle.
  - CMS auth/permissions for inventory and catalog operations.
  - Prisma-backed relational persistence for central inventory and shop inventory.
- Downstream dependents:
  - Caryina storefront stock display and add-to-cart availability.
  - CMS inventory screens and stock operation screens.
  - Rapid-launch CMS APIs that already read central-inventory allocations.
- Likely blast radius:
  - `apps/cms` for the operator-facing inventory app baseline.
  - `packages/platform-core` for authority, sync, and data-model hardening.
  - `apps/caryina` only where its narrow admin surface should be retired, reduced, or redirected.

### Test Landscape
#### Existing Test Coverage
- `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`
  - Confirms Caryina inventory route behavior, including current upsert path.
- `apps/cms/__tests__/inventoryImportCsvRoute.test.ts`
  - Exercises CMS inventory import path.
- `apps/cms/__tests__/inventoryImportJsonRoute.test.ts`
  - Exercises JSON inventory import path.
- `apps/cms/__tests__/inventoryExportRoute.test.ts`
  - Exercises CSV/JSON export path.
- `apps/cms/__tests__/inventoryFormVariants.integration.test.tsx`
  - Covers CMS inventory editor behavior around variants.
- `packages/platform-core/src/repositories/__tests__/inventory.prisma.server.test.ts`
  - Covers shared inventory persistence behavior.
- `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts`
  - Covers stock inflow repository logic.

#### Coverage Gaps
- No single operator-facing "inventory app" flow test that spans snapshot, adjustments, inflows, and stock visibility in one surface.
- No evidence of a CMS UI/API around `centralInventory` itself.
- No dedicated sales-event ledger surfaced to inventory operators; only hold commit and checkout-attempt state is recorded.
- No evidence that Caryina’s current public inventory validation API uses the central-inventory path in production.
- No dedicated test coverage yet for an inventory-uploader media flow that uploads to shared media storage and then attaches returned URLs to imported products.
- No shared test coverage yet for a generalized, multishop product-definition system with controlled option registries and derived publishable fields.

### Recent Git / Doc State Notes
- `docs/plans/caryina-inventory-addition-flow-hardening/fact-find.md` is now stale on a key point: Caryina inventory PATCH no longer hard-fails on missing rows; it now creates the row when the product SKU exists.

## External Research
- Finding: Cloudflare Workers Paid is currently a minimum of $5 USD/month and includes Workers, Pages Functions, KV, Hyperdrive, and Durable Objects usage, with configurable CPU limits per invocation.
  - Source: https://developers.cloudflare.com/workers/platform/pricing/
- Finding: OpenNext Cloudflare supports Next.js 16 on Cloudflare Workers using the Node.js runtime, and requires `nodejs_compat` with a compatibility date of `2024-09-23` or later.
  - Source: https://opennext.js.org/cloudflare and https://opennext.js.org/cloudflare/get-started
- Finding: OpenNext Cloudflare notes Worker size limits of 3 MiB compressed on Free and 10 MiB compressed on Paid, which matters for deciding how much XA shell code to carry over. XA uploader itself is a Worker app; reusing its shell wholesale without tree-shaking catalog-publish modules could contribute significant bundle weight. A sizing check (`pnpm build:worker --dry-run` or equivalent) should be run before phase 1 build is approved.
  - Source: https://opennext.js.org/cloudflare
- Finding: Next.js 16 is current LTS and its App Router uses the latest React 19.2 features, which aligns with the repo’s existing Next 16 / React 19.2 baseline.
  - Source: https://nextjs.org/blog/next-16 and https://nextjs.org/support-policy
- Finding: Cloudflare recommends serving public R2 assets through a custom domain rather than relying on the `r2.dev` endpoint for production delivery.
  - Source: https://developers.cloudflare.com/r2/buckets/public-buckets/ and https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/

## Questions
### Resolved
- Q: What is the best baseline for an inventory-first app?
  - A: Split the answer in two:
    - functional/domain baseline: `apps/cms` + `packages/platform-core`
    - frontend-shell baseline: `apps/xa-uploader`
  - Evidence: CMS already has generalized inventory matrix, snapshot import/export, stock adjustments, stock inflows, and product import surfaces; XA uploader already has the exact operator shell and split-pane console model now required.

- Q: Given the "exactly like XA uploader" frontend requirement, should the inventory app live inside CMS?
  - A: No. That requirement points toward a new standalone app that reuses XA uploader’s shell/components/state model, while pulling domain behavior from CMS/platform-core.
  - Evidence: `apps/xa-uploader/src/app/UploaderShell.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/cms/src/app/cms/shop/[shop]/data/inventory/page.tsx`.

- Q: How does the new standalone app consume CMS and platform-core — via HTTP API calls to CMS, or by importing platform-core packages directly?
  - A: Import `platform-core` packages directly. Do not call CMS over HTTP. CMS is the domain-logic and pattern reference, not a runtime dependency. The new app should import the same `platform-core` repository helpers (`inventory.server.ts`, `centralInventory.server.ts`, `media.server.ts`, `productImport.*`) that CMS itself uses, without CMS being in the critical path. This keeps the new Worker self-contained, avoids inter-Worker latency and auth overhead, and prevents the inventory app from failing if CMS is unavailable. CMS pages and APIs can remain running in parallel as a fallback during parity buildout.
  - Evidence: `apps/caryina/src/lib/shop.ts` already uses this exact model — Caryina imports from `platform-core` directly without going through CMS. `packages/platform-core/src/repositories/inventory.server.ts`, `packages/platform-core/src/centralInventory/centralInventory.server.ts`.

- Q: What should replace XA uploader’s storefront selector concept?
  - A: A shop selector using the same scoped-state reset pattern. XA already stores scoped selection in local storage and resets editor state on scope change; the inventory app should adapt that pattern from storefront to shop.
  - Evidence: `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `apps/cms/src/app/api/shops/route.ts`.

- Q: Should the first pass clone XA uploader?
  - A: No. XA uploader is useful as a source of patterns for auth, rate limits, image upload, and optimistic write flows, but it is centered on catalog publish/deploy workflow rather than inventory operations.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`.

- Q: Does XA uploader already implement the kind of category creator the new app needs?
  - A: Not exactly. XA has category-aware authoring, but it is implemented as a hardcoded schema and hardcoded React forms, with a structured registry supplying allowed values and defaults. It is not a runtime operator-defined category builder.
  - Evidence: `packages/lib/src/xa/catalogAdminSchema.ts`, `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`, `apps/xa-uploader/src/lib/catalogBrandRegistry.ts`.

- Q: Is the user's instinct about controlled selectable data entry correct?
  - A: Yes. XA demonstrates that controlled selectors and registry-backed checkboxes materially improve data integrity by constraining brand, collection, size, color, material, and related inputs to allowed values, while still allowing a bounded custom fallback when needed.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`, `apps/xa-uploader/src/components/catalog/RegistryCheckboxGrid.client.tsx`.

- Q: Does XA already construct publishable fields from those selections?
  - A: Yes. XA auto-derives title, slug, description, popularity, and some taxonomy/detail defaults from structured selections such as brand, collection, size, color, and material. This is a strong pattern worth carrying forward.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`, `packages/lib/src/xa/catalogWorkflow.ts`, `apps/xa-uploader/src/lib/catalogDraftToContract.ts`.

- Q: Can the current shared product model support a generalized multishop category-definition system without extension?
  - A: No. `ProductPublication` is still mostly fixed-shape, and existing templates are only prefilled blueprints. A true multishop category-definition system needs a new shared layer for product-type definitions, option registries, and derivation rules.
  - Evidence: `packages/types/src/Product.ts`, `packages/platform-core/src/productTemplates.ts`.

- Q: What should be built instead of freeform per-product forms?
  - A: A shared product-definition layer with three parts:
    1. product type / category definitions that specify which fields exist, field type, locale behavior, requiredness, and control type
    2. option registries that define allowed values for selectable fields
    3. derivation rules that construct publishable fields and defaults from operator selections
  - This should live in shared code and be consumed by the new uploader app, rather than being embedded as Caryina-only or XA-only UI logic.
  - Evidence: XA's registry and derivation patterns plus the lack of an equivalent shared product-definition contract today.

- Q: Should the first version be a fully unconstrained runtime "form builder"?
  - A: No. That would overshoot the evidence and create a large new surface area. The better direction is a constrained product-definition system with a fixed set of supported field types and derivation primitives, then an operator UI for managing those definitions once the shared contract exists.
  - Evidence: current fixed shared product contract, XA's successful constrained-registry model, and the absence of a safe generic schema engine in the repo today.

- Q: How should image upload and image serving work in the proposed system?
  - A: Use the shared media repository in `platform-core`, exposed through thin app routes in the new inventory uploader. In production, uploads should land in R2 under shop-prefixed keys and return stable public URLs; storefronts should render those URLs directly from product `media[]`. Do not route storefront image delivery through the inventory app worker.
  - Evidence: `packages/platform-core/src/repositories/media.server.ts`, `packages/platform-core/src/repositories/media.r2.server.ts`, `packages/platform-core/src/repositories/media.metadata.server.ts`, `apps/cms/src/app/api/media/route.ts`, `apps/caryina/src/lib/launchMerchandising.ts`.

- Q: Should the inventory app reuse XA uploader's image-upload route?
  - A: No. Reuse XA's UI/UX patterns only. XA's image route is coupled to XA-specific bucket bindings and local writes into `xa-b/public/images`, which is the wrong contract for a generalized multishop inventory app.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/lib/r2Media.ts`, `packages/platform-core/src/repositories/media.server.ts`.

- Q: What is the right production serving path for images?
  - A: Public media should be served directly from an R2 custom domain with Cloudflare caching. Product records should keep the returned public URL in `media[]`, and Caryina or any other shop should consume that URL directly.
  - Evidence: `packages/platform-core/src/repositories/media.r2.server.ts`, `packages/platform-core/src/repositories/productImport.normalize.ts`, `apps/caryina/src/lib/launchMerchandising.ts`, Cloudflare R2 public-bucket guidance.

- Q: Does media upload need to be part of inventory v1?
  - A: No. Inventory v1 can stay inventory-first and continue accepting media URLs in product import. When the all-product uploader lands, its media library/upload flow should be added in the new app on top of the shared media repository rather than as a prerequisite for the first inventory release.
  - Evidence: `packages/platform-core/src/repositories/productImport.normalize.ts`, `packages/platform-core/src/repositories/productImport.apply.ts`, `apps/cms/src/app/api/media/route.ts`.

- Q: Does the repo already have a notion of centralized inventory?
  - A: Yes. `platform-core` already defines central inventory items, routing rules, allocation calculation, shop sync, and bulk import.
  - Evidence: `packages/platform-core/src/centralInventory/centralInventory.server.ts`, `packages/platform-core/prisma/schema.prisma`.

- Q: Is central inventory already the authoritative path for Caryina?
  - A: Not yet. Caryina storefront reads per-shop inventory via `readInventory`/`catalogSkus`, while central inventory is only partially integrated through allocation readers and optional validation helpers.
  - Evidence: `apps/caryina/src/lib/shop.ts`, `packages/platform-core/src/repositories/catalogSkus.server.ts`, `packages/platform-core/src/inventoryValidation.ts`, `apps/cms/src/app/api/inventory/validate/route.ts`.

- Q: Can central inventory be promoted to authority without any contract cleanup?
  - A: No. The audited code shows a key-format mismatch between central inventory and per-shop inventory variant keys, so authority promotion needs explicit normalization/adapter work.
  - Evidence: `packages/platform-core/src/types/inventory.ts`, `packages/platform-core/src/centralInventory/centralInventory.server.ts`.

- Q: Is D1 already wired for this inventory stack?
  - A: No evidence supports that for this feature path today. The active Prisma datasource is PostgreSQL, and Caryina/xa-uploader Worker configs shown here do not declare D1 bindings.
  - Evidence: `packages/platform-core/prisma/schema.prisma`, `apps/caryina/wrangler.toml`, `apps/xa-uploader/wrangler.toml`.

- Q: Can Caryina already reflect completed sales back into inventory?
  - A: Yes for stock decrement. Successful checkout commits the inventory hold, which finalizes stock deduction.
  - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`, `packages/platform-core/src/inventoryHolds.ts`.

- Q: Is there already an operator-facing sales ledger for inventory visibility?
  - A: No. Stock changes from checkout are reflected in quantities, but there is no dedicated inventory-facing sales event stream or recent-sales UI surfaced in the audited paths.
  - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`, absence of matching inventory sales UI/routes in `apps/cms` and `apps/caryina`.

- Q: Should media upload and publish workflow be part of the first inventory prompt?
  - A: No. Product/media/publish concerns should be explicitly split out. The first prompt should treat them as a second lane that can reuse CMS product import and XA uploader patterns later.
  - Evidence: CMS already separates inventory tools from product import, and Caryina storefront already consumes product metadata without requiring an XA-style publish pipeline.

### Open (Operator Input Required)
None. The major architecture choices for this fact-find can be resolved from repository evidence and the user’s instruction to bias toward CMS and inventory-first separation.

## Scope Signal
- **Signal: right-sized with one conditional caveat**
- **Rationale:** The research supports a clear direction: start with platform-core + shared inventory services, split product/media concerns into separate follow-on work, and harden central inventory only where it is already present. The scope is concrete enough for planning without needing a broader exploratory sweep. **Caveat:** if planning includes central inventory authority promotion in phase 1, the variant-key normalization work and the new shared product-definition layer (type definitions, option registries, derivation rules) both add material scope that is not reflected in a plain "right-sized" signal. Planning should explicitly decide whether these are phase 1 or phase 2, and resize the signal accordingly.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CMS inventory baseline | Yes | None | No |
| Shared inventory repository | Yes | None | No |
| Central inventory path | Partial | [Architecture] [Major]: central inventory exists but is not yet the default authoritative path for public validation/storefront reads | Yes |
| Caryina storefront/admin usage | Yes | [Scope] [Major]: storefront reads shared inventory, but admin is too narrow to be a reusable baseline | Yes |
| XA uploader reuse boundary | Yes | None | No |
| Sales/event visibility | Partial | [Capability gap] [Major]: no inventory-facing sales ledger surfaced | Yes |
| Persistence/runtime posture | Yes | [Architecture] [Major]: D1 is a desired future state, not a current repo-ready baseline | Yes |

## Confidence Inputs
- **Implementation: 90%**
  - Evidence: current building blocks are real and localized in platform-core; integration model is resolved (new standalone app importing platform-core directly, not calling CMS over HTTP). Remaining gap is whether phase 1 includes central inventory authority or defers it to phase 2.
  - To reach >=95: confirm in planning which inventory authority scope applies to phase 1.

- **Approach: 93%**
  - Evidence: CMS baseline + inventory-first split is strongly supported by current code and by the user’s steer.
  - To reach >=95: settle whether central inventory hardening is phase 1 or phase 2.

- **Impact: 91%**
  - Evidence: consolidating inventory reduces duplicated admin work and prevents an avoidable XA-style rewrite.
  - To reach >=95: quantify current operator pain across Caryina admin vs CMS usage.

- **Delivery-Readiness: 84%**
  - Evidence: enough exists to plan immediately, but central inventory authority semantics are not fully hardened.
  - To reach >=90: define whether phase 1 operates on per-shop inventory only, or includes central inventory as source of truth.

- **Testability: 86%**
  - Evidence: the underlying inventory and import seams already have route/repository coverage.
  - To reach >=90: define end-to-end acceptance tests for inventory app flows and central-authority behavior.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Forcing the UI into CMS despite the explicit XA-uploader shell requirement will create a compromised hybrid rather than the required operator experience | High | High | Use a new standalone app for the shell and reuse CMS/platform-core behavior behind it |
| Rebuilding inventory from XA uploader patterns instead of reusing CMS duplicates existing capability | High | High | Make CMS the explicit baseline in planning and reject a standalone rewrite in phase 1 |
| Carrying too much XA-specific cloud plumbing into the new app will increase Worker size and operational cost without helping inventory v1 | Medium | High | Reuse shell/UI patterns only; keep KV/R2/deploy-drain behavior out unless a specific inventory feature needs them |
| Folding media upload, publish workflow, and inventory into one project inflates scope and delays delivery | High | High | Split inventory ops from catalog/media lanes in the prompt and plan |
| Treating central inventory as already authoritative overstates current integration maturity | Medium | High | Budget central-inventory hardening explicitly; do not assume it is production-complete today |
| Central inventory and per-shop inventory use different variant-key formats, which can break naive sync/lookup assumptions | Medium | High | Normalize on one canonical variant-key contract or add an adapter layer before promoting central inventory |
| D1-first architecture could force premature persistence migration against current Prisma/Postgres reality | Medium | High | Keep persistence abstraction-compatible; defer D1 migration to a dedicated phase |
| Missing sales/event ledger leaves inventory operators without visibility into why stock changed | High | Medium | Add explicit inventory ledger/event stream scope as a later task seed |

## Planning Constraints & Notes
- Must-follow patterns:
  - Treat XA uploader as the baseline operator shell for phase 1 UI.
  - Treat CMS and `platform-core` as the functional/domain baseline for phase 1 behavior.
  - Optimize for a lean OpenNext Cloudflare deployment: one worker app, Node runtime, minimal bindings, direct shared-service calls, and no XA-specific deploy infrastructure by default.
  - Reuse `platform-core` repository and import services before inventing new persistence or schemas.
  - Keep inventory ops separate from media upload/publish workflow.
- Rollout/rollback expectations:
  - Prefer additive rollout in a new standalone inventory app before removing CMS or Caryina duplicate surfaces.
  - CMS inventory/product-upload pages can remain temporarily as fallback during parity buildout.
  - Decommission Caryina-local admin only after equivalent CMS-backed workflows exist.
- Observability expectations:
  - Inventory app should expose current stock state, stock event history, and eventually checkout-driven stock movement visibility.

## Suggested Task Seeds (Non-binding)
- TASK-01: Create a placement decision matrix for keep/move/drop across XA uploader, new inventory app, CMS, Caryina, and `platform-core`.
- TASK-02: Define the v1 inventory app shell as a new standalone app reusing XA uploader layout/components with a shop selector. Validate bundle size against the 10 MiB compressed Worker limit before committing to the full shell import surface.
- TASK-03: Define the v1 inventory behavior boundary around CMS inventory matrix, snapshot import/export, stock adjustments, stock inflows, and inventory history.
- TASK-04: Decide whether v1 inventory authority remains per-shop inventory or hardens `centralInventory` into the real source of truth. If central authority is chosen, implement the variant-key normalization adapter in `platform-core/src/centralInventory/` first (per-shop format as canonical) before any other central-inventory work.
- TASK-05: Build a generalized all-product uploader/importer by extending CMS product import and splitting inventory fields from product metadata/media fields.
- TASK-06: Add an explicit inventory event ledger view that includes manual operations and checkout-driven stock movements, sourcing checkout events from the hold-commit path in `platform-core/src/inventoryHolds.ts`.
- TASK-07: Reduce or retire Caryina-local admin product/inventory editing once parity exists.
- TASK-08: Remove or redirect duplicate CMS inventory/product-upload UI once the standalone inventory app reaches parity.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - A planning-ready architecture direction for the inventory app.
  - A forward prompt artifact that future planning/build turns can use directly.
  - Clear separation between inventory ops scope and non-inventory catalog/media scope.
- Post-delivery measurement plan:
  - Track operator workflows consolidated into CMS/shared inventory surfaces.
  - Track stock-operation success/error rates across import, adjustment, inflow, and checkout-driven changes.

## Evidence Gap Review
### Gaps Addressed
- Verified that CMS already contains the strongest reusable inventory and bulk-import baseline.
- Verified that central inventory already exists in `platform-core`, but is not yet the default authoritative public path.
- Verified that Caryina storefront already consumes shared inventory live and that checkout commits already reduce stock.
- Verified that XA uploader is a pattern source, not the right first baseline for inventory.

### Confidence Adjustments
- Raised approach confidence because the user’s steer matches the strongest existing architecture seam in the repo.
- Lowered delivery-readiness slightly because central inventory authority is only partially integrated today.

### Remaining Assumptions
- Phase 1 should prioritize coherence and reuse, but the app shell must still satisfy the XA-uploader UI requirement.
- Media upload and publish workflow can remain a follow-on lane without blocking the inventory app definition.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - **Conditional blocker:** if phase 1 includes central inventory authority promotion, the variant-key normalization (`sku#key:value|...` vs `sku:key=value,...`) must be resolved before any build work that touches central inventory sync or validation. This is not a blocker for planning the shell or per-shop inventory surfaces, but it is a hard prerequisite before any central-inventory write path goes into production. The recommended adapter approach (rewrite central keys in `platform-core/src/centralInventory/` on read/write) should be the first task in any central-inventory sub-track.
  - **Worker bundle size:** carrying the full XA uploader shell into a new Worker has not been sized against the 10 MiB compressed paid-plan limit. Planning should include a sizing checkpoint before committing to wholesale shell reuse.
- Recommended next step:
  - Review [app-placement-matrix.md](/Users/petercowling/base-shop/docs/plans/inventory-app-uploader-unification/artifacts/app-placement-matrix.md) and [build-prompt.md](/Users/petercowling/base-shop/docs/plans/inventory-app-uploader-unification/artifacts/build-prompt.md), then run `/lp-do-plan inventory-app-uploader-unification --auto`.
