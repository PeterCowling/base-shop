# Execution Prompt: Inventory App Unification + All-Product Uploader

You are working in `/Users/petercowling/base-shop`.

Your job is to turn the repo's existing inventory capabilities into one coherent inventory app, then define the right path for a better uploader that works for all products, not just Caryina. Treat this as an inventory-first initiative, not as an XA uploader clone.

## Core Direction
- Use XA uploader as the baseline operator shell and interaction model.
- Reuse `apps/cms` and `packages/platform-core` for inventory and product-import behavior wherever possible.
- Split pure inventory operations away from broader catalog/media/publish workflow.
- Build a new standalone app if needed to satisfy the XA-uploader-shell requirement; do not force this UI into CMS.
- Do not assume D1/R2/Workers-native storage is already the active inventory baseline in this repo.
- Optimize for a lean Cloudflare Workers Paid deployment: one OpenNext app, minimal bindings, and no XA-specific cloud plumbing unless the inventory feature actually needs it.

## Repo Facts You Must Respect
- XA uploader already has the required operator shell shape:
  - `apps/xa-uploader/src/app/UploaderShell.client.tsx`
  - `apps/xa-uploader/src/app/UploaderHome.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- CMS already has inventory management, inventory import/export, stock adjustments, stock inflows, and bulk product import:
  - `apps/cms/src/app/cms/shop/[shop]/data/inventory/page.tsx`
  - `apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`
  - `apps/cms/src/app/api/data/[shop]/inventory/export/route.ts`
  - `apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts`
  - `apps/cms/src/app/api/shop/[shop]/stock-inflows/route.ts`
  - `apps/cms/src/app/api/shop/[shop]/product-import/route.ts`
- Shared inventory persistence already exists behind repo abstractions:
  - `packages/platform-core/src/repositories/inventory.server.ts`
  - `packages/platform-core/src/repositories/inventory.prisma.server.ts`
  - `packages/platform-core/src/types/inventory.ts`
- Central inventory already exists in `platform-core`, but it is only partially integrated today:
  - `packages/platform-core/src/centralInventory/centralInventory.server.ts`
  - `packages/platform-core/src/centralInventory/types.ts`
  - `packages/platform-core/src/inventoryValidation.ts`
- Caryina storefront already reads shared product/inventory repositories live:
  - `apps/caryina/src/lib/shop.ts`
  - `packages/platform-core/src/repositories/catalogSkus.server.ts`
- Caryina admin is too narrow to be the foundation:
  - `apps/caryina/src/app/admin/api/products/route.ts`
  - `apps/caryina/src/app/admin/api/products/[id]/route.ts`
  - `apps/caryina/src/components/admin/ProductForm.client.tsx`
  - `apps/caryina/src/components/admin/InventoryEditor.client.tsx`
- XA uploader is useful only as a source of patterns for auth, rate limiting, optimistic writes, image upload, and publish workflow:
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts`

## Important Architectural Reality Checks
- Do not describe the current system as if central inventory is already the authoritative production path everywhere. It exists, but storefront/admin validation still leans on per-shop inventory in the audited paths.
- Do not assume central inventory can become the authority without contract work. The audited code uses different `variantKey` formats for central inventory and per-shop inventory, so this needs explicit normalization or adaptation.
- Do not describe D1 as the active baseline. Current evidence points to Prisma/Postgres-backed models, and the audited Worker configs do not establish D1 bindings for this flow.
- Do not bundle media upload, publish-state workflow, and inventory operations into one first-phase build. Split them.
- Do not assume a dedicated sales ledger already exists for inventory operators. Checkout commits decrement stock, but there is no clear inventory-facing sales-event surface yet.
- Do not recommend CMS as the final UI shell. The user requirement is that the frontend should work and look exactly like XA uploader, except for a shop selector.

## What You Need To Produce
1. A clear architecture recommendation for the v1 inventory app, including the app shell choice.
2. A gap map showing:
   - what already exists and should be reused,
   - what exists but needs hardening,
   - what is genuinely missing.
3. An explicit keep/move/drop matrix for functionality currently split across CMS and `platform-core`.
4. A phased implementation plan that separates:
   - Phase 1: inventory app coherence
   - Phase 2: generalized uploader/import improvements
   - Phase 3: optional media/publish workflow
5. Acceptance criteria for each phase.
6. Explicit recommendations on whether Caryina-local admin screens and CMS duplicate screens should be retired, redirected, or kept temporarily.

## Required Planning Posture
- Prefer additive reuse over rewrites.
- Keep scope inventory-first.
- Make XA uploader the UI baseline.
- Make CMS/platform-core the behavior baseline.
- If you propose central inventory as the authority, explicitly include the hardening work needed to make that true.
- If you propose any standalone app, justify why CMS cannot reasonably host the inventory workflows first.
- Default to features that fit comfortably within a low-cost Workers deployment profile.

Given the operator requirement, the default assumption should be:
- new standalone app shell: yes
- shared domain logic rewrite: no

## Recommended Framing
Use three lanes:

### Lane A — Inventory Authority + Operations
- Inventory snapshot management
- Variant-level stock editing
- Stock inflows
- Stock adjustments
- Low-stock thresholds and alerts
- Inventory history / ledger visibility
- Decision: per-shop inventory authority first, or hardened central inventory authority
- Shop-scoped multishop frontend behavior

### Lane B — Product Metadata Uploader
- Bulk product import for all products
- Localized title/description support
- Status workflow support (`draft`, `review`, `scheduled`, `active`, `archived`)
- Structured product fields like materials, dimensions, weight
- Reuse CMS product import instead of inventing a separate uploader from scratch

### Lane C — Media / Publish Workflow (Only If Needed)
- R2 image upload
- Media slot management
- Publish/deploy workflow
- Any XA-uploader-style contract sync
- Treat this as optional follow-on scope, not a blocker for Lane A

## Deliverable Constraints
- Be specific about files, modules, APIs, and migration seams.
- Call out risks where current code is partial or inconsistent.
- Do not hide missing pieces behind vague language like "plug into D1 later" or "reuse XA uploader patterns" without saying exactly which patterns.
- If you discover stale docs or stale prior fact-finds, note that explicitly instead of inheriting them.

## Minimum Acceptance Criteria For Your Output
- It must recommend an XA-uploader-style shell, not a CMS-style shell.
- It must identify which functionality stays in `platform-core`, which moves into the new app, which stays temporarily in CMS, and which can be dropped after parity.
- It must separate inventory scope from non-inventory scope.
- It must identify the current authority model and the work required to change it.
- It must explain how Caryina storefront stock reads will continue to work through the transition.
- It must state whether the first generalized uploader behavior should extend CMS/shared import logic rather than inventing a second import engine.
- It must state how the proposed app stays lean enough for a low-cost Cloudflare Workers deployment.
