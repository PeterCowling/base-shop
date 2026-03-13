---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: inventory-uploader-product-management
Dispatch-ID: IDEA-DISPATCH-20260313170000-0001
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/inventory-uploader-product-management/analysis.md
---

# Inventory Uploader — Product Management + Caryina DB Migration Plan

## Summary

Caryina's product and inventory data lives in JSON files that don't work on Cloudflare Workers — the shop silently returns zero products in production. This plan adds a full `Product` Prisma model, completes the stub Prisma product repository, adds product CRUD routes and a Products view to inventory-uploader (benefiting all shops), migrates caryina's 3 products and 3 inventory rows to PostgreSQL, wires caryina to use Prisma via env vars, moves the refunds endpoint from the unprotected caryina admin panel to inventory-uploader, and deletes the caryina admin panel. Deployment ordering is critical: migration must run before the `DB_MODE=prisma` env var is deployed.

## Active tasks

- [x] TASK-01: Add Product model to schema.prisma + migration
- [x] TASK-02: Complete prismaProductsRepository (write/update/delete/duplicate)
- [x] TASK-03: Promote product/refund Zod schemas to inventory-uploader
- [x] TASK-04: Add product CRUD API routes to inventory-uploader
- [x] TASK-05: Add Products view to inventory-uploader UI
- [x] TASK-06: Move refunds endpoint to inventory-uploader
- [x] TASK-07: Write data migration script (3 products + 3 inventory rows)
- [ ] CHECKPOINT-01: Run staging migration + smoke test
- [ ] TASK-08: Wire caryina env vars (DATABASE_URL + DB_MODE + CARYINA_INVENTORY_BACKEND)
- [ ] TASK-09: Delete caryina admin panel and supporting files

## Goals

- Add `Product` Prisma model covering the full `ProductPublication` type.
- Complete `prismaProductsRepository` write/update/delete/duplicate using Prisma, not JSON fallbacks.
- Add product CRUD API routes to inventory-uploader for all shops.
- Add a Products view to the inventory-uploader console.
- Move the refunds endpoint from caryina admin to inventory-uploader.
- Migrate caryina's 3 products and 3 inventory rows to PostgreSQL.
- Wire caryina's wrangler.toml to use `DATABASE_URL` + `DB_MODE=prisma`.
- Delete the caryina admin panel entirely.

## Non-goals

- Multi-locale product editing UI (all locales default to the same value at create/edit time).
- Product image upload (media URLs provided as plain strings).
- Per-shop role-based access control in inventory-uploader.
- Migrating other shops from JSON to Prisma in this delivery.
- Full `InventoryAuditEvent`-style product audit trail (console.info logging only for this delivery).

## Constraints & Assumptions

- Constraints:
  - Cloudflare Workers with `nodejs_compat` — no filesystem access. PostgreSQL connectivity validated via inventory-uploader prod usage.
  - `adminSchemas.ts` must be promoted (TASK-03) before admin panel is deleted (TASK-09).
  - Deployment ordering: schema migration → `prisma generate` → data migration → env var cutover → admin panel deletion.
  - All three payment credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) must be in inventory-uploader wrangler secrets before TASK-09.

- Assumptions:
  - Same `DATABASE_URL` secret covers caryina (same PostgreSQL cluster, different `shopId`).
  - `prisma generate` runs in caryina's CI/deployment pipeline; plan includes a verification step.
  - Products tab in inventory-uploader UI is a separate top-level view switch, not a right-panel tab (the existing right panel is inventory-scoped; products management is a distinct concern).

## Inherited Outcome Contract

- **Why:** Caryina product and stock data is saved in files that do not work on the Cloudflare Workers hosting platform — the shop is silently broken in production for any data write. No operator tool exists to add, edit, or remove products across any shop. Fixing this gives caryina reliable database storage and gives all shops a product management screen in the inventory tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inventory-uploader has a working Products tab for all shops. Caryina products and inventory are stored in PostgreSQL. The caryina admin panel is removed. Product data is no longer stored in flat files for any shop.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/inventory-uploader-product-management/analysis.md`
- Selected approach inherited: Option A — Full Prisma path
- Key reasoning used:
  - Option B (static bundle) doesn't solve write-path failures or product management goal.
  - Option C (D1) is massive scope expansion with experimental Prisma adapter.
  - Option D (fix admin panel) preserves security debt and doesn't help other shops.
  - Option A uses existing proven infrastructure; schema change is additive; data migration is tiny.

## Selected Approach Summary

- What was chosen: Full Prisma path — add `Product` model, complete prismaProductsRepository, add inventory-uploader product CRUD routes and UI, migrate data, wire caryina env vars, move refunds, delete admin panel.
- Why planning is not reopening option selection: Operator chose Option A at ideas stage; analysis confirms it is the only viable approach; all implementation patterns are established.

## Fact-Find Support

- Supporting brief: `docs/plans/inventory-uploader-product-management/fact-find.md`
- Evidence carried forward:
  - `products.json.server.ts:26-34` — catch block returns `[]` on Workers (confirmed).
  - `products.prisma.server.ts` — write/update/delete/duplicate all delegate to JSON (confirmed stubs).
  - `adjustments/route.ts` — canonical route pattern for new product routes.
  - `InventoryItem` model at `schema.prisma:148` — exact reference shape for new `Product` model.
  - `products.json` — 3 products with full `ProductPublication` field set including `materials`, `dimensions`, `weight` (confirmed present; `ProductCore` in `Product.ts` includes these as optional fields).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add Product model + schema migration | 90% | S | Complete (2026-03-13) | - | TASK-02, TASK-07 |
| TASK-02 | IMPLEMENT | Complete prismaProductsRepository writes | 85% | M | Complete (2026-03-13) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Promote Zod schemas to inventory-uploader | 95% | S | Complete (2026-03-13) | - | TASK-04, TASK-06 |
| TASK-04 | IMPLEMENT | Add product CRUD API routes | 85% | M | Complete (2026-03-13) | TASK-02, TASK-03 | TASK-05, TASK-09 |
| TASK-05 | IMPLEMENT | Add Products view to inventory-uploader UI | 80% | M | Complete (2026-03-13) | TASK-04 | - |
| TASK-06 | IMPLEMENT | Move refunds endpoint to inventory-uploader | 85% | S | Complete (2026-03-13) | TASK-03 | TASK-09 |
| TASK-07 | IMPLEMENT | Write data migration script | 85% | S | Complete (2026-03-13) | TASK-01 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Staging migration + smoke test | — | — | Pending | TASK-07 | TASK-08 |
| TASK-08 | IMPLEMENT | Wire caryina env vars (DB_MODE + CARYINA_INVENTORY_BACKEND) | 90% | S | Pending | CHECKPOINT-01 | TASK-09 |
| TASK-09 | IMPLEMENT | Delete caryina admin panel | 85% | S | Pending | TASK-04, TASK-06, TASK-08 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Products view added to inventory-uploader console using existing `gate-*` tokens and established component patterns | TASK-05 | View-level switch (not a right-panel tab); list + create/edit form |
| UX / states | Empty-catalogue state, create/edit form, delete confirmation, success/error feedback | TASK-05 | Non-goal: multi-locale editing; single-value field writes same value to all locales |
| Security / privacy | New product routes auto-protected by existing inventory-uploader middleware; refunds route carries over `refundRequestSchema` Zod validation; payment credentials in wrangler secrets | TASK-04, TASK-06 | No new auth code needed for product routes |
| Logging / observability / audit | `console.info` on product write/update/delete routes (`shopId`, `productId`, action); full AuditEvent trail deferred as future work | TASK-04 | Consistent with inventory routes' existing pattern |
| Testing / validation | Unit tests for 4 new prismaProductsRepository methods; unit tests for 5 product routes + 1 refunds route; dry-run assertion for migration script; caryina admin test files deleted | TASK-02, TASK-04, TASK-06, TASK-07 | Per docs/testing-policy.md — CI only |
| Data / contracts | Additive `Product` model covering full `ProductPublication` type; `@@unique([shopId, sku])` + `@@unique([shopId, id])`; `@@index([shopId])`; 3 products + 3 inventory rows migrated | TASK-01, TASK-07 | No existing models changed; migration is additive only |
| Performance / reliability | N/A — catalogue max ~100 products; Prisma singleton connection pooling handles Workers concurrency | — | N/A |
| Rollout / rollback | Migration (TASK-07) must be verified before env var deployment (TASK-08); CHECKPOINT-01 enforces this gate; rollback: remove `DB_MODE` + `CARYINA_INVENTORY_BACKEND` vars → JSON fallback restores | TASK-07, CHECKPOINT-01, TASK-08 | Staging migration runs before production |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | — | Independent; can run in parallel |
| 2 | TASK-02, TASK-06, TASK-07 | TASK-01 (for 02+07), TASK-03 (for 06) | 02 and 07 both need Product model; 06 only needs schemas |
| 3 | TASK-04, CHECKPOINT-01 | TASK-02+03 (for 04), TASK-07 (for checkpoint) | 04 and checkpoint gate are independent of each other |
| 4 | TASK-05, TASK-08 | TASK-04 (for 05), CHECKPOINT-01 (for 08) | 05 and 08 are independent of each other |
| 5 | TASK-09 | TASK-04, TASK-06, TASK-08 | Admin panel deletion: all three preconditions must complete |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Product CRUD (all shops) | Operator logs into inventory-uploader → opens Products view | (1) Select shop in ShopSelector → (2) Products view loads product list via GET `/api/inventory/[shop]/products` → `prismaProductsRepository.read()` → PostgreSQL. (3) Operator creates product: fills form → POST → `prismaProductsRepository.write()`. (4) Operator edits: selects product → PATCH → `.update()`. (5) Operator deletes: confirm modal → DELETE → `.delete()`. | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | Empty-catalogue state for new shops required |
| Storefront product reads (caryina) | HTTP request to `/shop` or `/product/[slug]` | `readRepo("caryina")` → `repoResolver` sees `DB_MODE=prisma` + `DATABASE_URL` → `prismaProductsRepository.read({ shopId: "caryina" })` → `prisma.product.findMany()` → 3 products returned → storefront renders correctly | TASK-01, TASK-07, TASK-08 | `DB_MODE=prisma` must not deploy before data migration is verified (CHECKPOINT-01 gates this) |
| Refunds | Operator POSTs to inventory-uploader refunds route | POST `/api/inventory/[shop]/refunds` → Zod validates `shopTransactionId`/`bankTransactionId`/`amountCents` → `resolveRefundProvider()` → Axerve (`callRefund`) or Stripe (`refundStripePayment`) → 200/402/502 response | TASK-03, TASK-06 | All 3 payment credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) must be in inventory-uploader wrangler secrets before TASK-09 |
| Caryina admin panel (deletion) | After TASK-04+06+08 confirmed working | All admin routes, UI pages, auth files, and proxy.ts deleted from `apps/caryina`. Related tests deleted. `inventoryBackend.ts` constant removed. | TASK-09 | Depends on: product routes live in inventory-uploader (TASK-04), refunds working in inventory-uploader (TASK-06), caryina DB_MODE switch confirmed (TASK-08) |

## Tasks

---

### TASK-01: Add Product model to schema.prisma + migration

- **Type:** IMPLEMENT
- **Deliverable:** New `Product` model in `packages/platform-core/prisma/schema.prisma` + Prisma migration file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/platform-core/prisma/schema.prisma`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-07
- **Confidence:** 90%
  - Implementation: 90% — `InventoryItem` model is the exact structural reference; full `ProductPublication` type confirmed from `packages/types/src/Product.ts`; all field names, types, and Json column decisions are known.
  - Approach: 95% — Standard additive Prisma migration; no existing models touched.
  - Impact: 95% — TASK-02 and TASK-07 both depend on this model existing.
- **Acceptance:**
  - [ ] `model Product` added to `packages/platform-core/prisma/schema.prisma` with all `ProductPublication` fields.
  - [ ] `@@unique([shopId, sku])`, `@@unique([shopId, id])`, `@@index([shopId])` present.
  - [ ] Migration file generated: `pnpm --filter @acme/platform-core prisma migrate dev --name add_product_model` produces a valid SQL file.
  - [ ] `pnpm --filter @acme/platform-core prisma validate` passes.
  - [ ] `pnpm typecheck` for `@acme/platform-core` passes after `prisma generate`.
- **Engineering Coverage:**
  - UI / visual: N/A — schema change only
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — migration file is the artifact; validated by `prisma validate`
  - Data / contracts: Required — Product model must cover full `ProductPublication` type including all optional fields
  - Performance / reliability: N/A
  - Rollout / rollback: Required — additive migration only; rollback: `prisma migrate down 1` drops the `Product` table
- **Validation contract (TC-01):**
  - TC-01: `prisma validate` after adding model → passes with no errors
  - TC-02: `prisma generate` after model added → `prismaClient.product` delegate available (no TypeScript error on `db.product.findMany`)
  - TC-03: Generated SQL is `CREATE TABLE "Product" ...` with no `ALTER TABLE` on existing tables
- **Execution plan:** Red → Green → Refactor
  - Red: `prisma generate` fails or `db.product` is undefined (current state — model absent).
  - Green: Add model definition to schema.prisma. Run `prisma migrate dev --name add_product_model`. Run `prisma generate`. Verify `db.product` delegate exists in generated client.
  - Refactor: Confirm field coverage against `ProductPublication` interface — no missing required fields.
- **Planning validation:**
  - Checks run: Read `packages/platform-core/prisma/schema.prisma` (InventoryItem shape confirmed at line 148); read `packages/types/src/Product.ts` (full ProductPublication confirmed).
  - Validation artifacts: `InventoryItem` model as reference; `ProductPublication` interface as field spec.
  - Unexpected findings: Products.json includes `materials`, `dimensions`, `weight` as optional extended fields — these are already in `ProductCore` as optional; model must include them as `Json?` columns.
- **Scouts:** None: all field types confirmed from existing type definitions.
- **Edge Cases & Hardening:**
  - `id` field: `@id` on ULID string (no `@default` — ULIDs generated by application layer, not DB).
  - `shopId` field: bare `String` column; no `@relation` to a Shop model (shops are app-level only).
  - `createdAt`: `DateTime @default(now())` — set by DB on insert; migration script will pass explicit values from existing JSON `created_at` fields.
- **What would make this >=90%:** Already at 90%. To reach 95%: confirm `prisma migrate deploy` runs on caryina CI/CD pipeline (verify `.github/workflows/brikette.yml` or equivalent).
- **Rollout / rollback:**
  - Rollout: `pnpm --filter @acme/platform-core prisma migrate deploy` in production (additive only).
  - Rollback: `prisma migrate down 1` drops `Product` table (safe; no existing data).
- **Documentation impact:** None: schema.prisma is self-documenting.
- **Notes / references:**
  - `InventoryItem` model at `packages/platform-core/prisma/schema.prisma:148` — reference shape.
  - Model definition to add:
    ```prisma
    model Product {
      id               String    @id
      shopId           String
      sku              String
      title            Json
      description      Json
      media            Json
      price            Int
      currency         String
      status           String
      row_version      Int       @default(1)
      forSale          Boolean   @default(true)
      forRental        Boolean   @default(false)
      deposit          Int       @default(0)
      rentalTerms      String?
      dailyRate        Int?
      weeklyRate       Int?
      monthlyRate      Int?
      wearAndTearLimit Int?
      maintenanceCycle Int?
      availability     Json?
      materials        Json?
      dimensions       Json?
      weight           Json?
      publishShops     Json?
      createdAt        DateTime  @default(now())
      updatedAt        DateTime  @updatedAt

      @@unique([shopId, sku])
      @@unique([shopId, id])
      @@index([shopId])
    }
    ```

---

### TASK-02: Complete prismaProductsRepository (write/update/delete/duplicate)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/platform-core/src/repositories/products.prisma.server.ts` — all 4 stub methods replaced with Prisma implementations
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/platform-core/src/repositories/products.prisma.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — JSON implementation is the direct port reference; `row_version: { increment: 1 }` pattern is standard Prisma; `duplicate` needs ULID generation (import from `ulid` package already used elsewhere in platform-core).
  - Approach: 90% — Direct mechanical port from `products.json.server.ts`.
  - Impact: 90% — Product CRUD API routes depend on this.
- **Acceptance:**
  - [ ] `write`: `prisma.product.create()` with all `ProductPublication` fields mapped; returns created product; logs `[products] write` at `console.info`.
  - [ ] `update`: `prisma.product.update()` where `{ shopId_id: { shopId, id } }`; `row_version: { increment: 1 }`; returns updated product.
  - [ ] `delete`: `prisma.product.delete()` where `{ shopId_id: { shopId, id } }`.
  - [ ] `duplicate`: `prisma.product.create()` with new ULID `id`, SKU suffixed `-copy`, `status: "draft"`, `row_version: 1`; returns duplicated product.
  - [ ] No method delegates to `jsonProductsRepository` anymore.
  - [ ] Unit tests pass for all 4 methods with mocked Prisma client.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A — repository layer; validation happens at route layer
  - Logging / observability / audit: Required — `console.info` with `shopId`, `id`/`sku`, action on each mutation
  - Testing / validation: Required — unit tests with mocked `prisma.product` for all 4 methods
  - Data / contracts: Required — field mapping must cover all `ProductPublication` fields including Json columns
  - Performance / reliability: N/A — small catalogues
  - Rollout / rollback: N/A — repository code; no deployment artifact
- **Validation contract (TC-02):**
  - TC-01: `prismaProductsRepository.write({ shopId: "test", product: mockProduct })` → `prisma.product.create` called with correct shape
  - TC-02: `prismaProductsRepository.update({ shopId: "test", id: "...", delta: { price: 3000 } })` → `prisma.product.update` called with `row_version: { increment: 1 }`
  - TC-03: `prismaProductsRepository.delete({ shopId: "test", id: "..." })` → `prisma.product.delete` called with `shopId_id` composite key
  - TC-04: `prismaProductsRepository.duplicate({ shopId: "test", id: "..." })` → new product created with `-copy` SKU suffix, `status: "draft"`, `row_version: 1`
  - TC-05: None of the 4 methods call `jsonProductsRepository` in any code path
- **Execution plan:** Red → Green → Refactor
  - Red: All 4 stub methods delegate to JSON repo — failing unit tests would catch this.
  - Green: Port each method from `products.json.server.ts` to Prisma equivalents. `write` → `prisma.product.create`. `update` → `prisma.product.update` with `row_version: { increment: 1 }`. `delete` → `prisma.product.delete`. `duplicate` → read source + create new with modified fields.
  - Refactor: Remove `jsonProductsRepository` imports from this file once all 4 methods are ported.
- **Planning validation:**
  - Checks run: Confirmed `products.json.server.ts` has all 5 methods; confirmed `products.prisma.server.ts` stubs at lines ~10-35.
  - Validation artifacts: `products.json.server.ts` as port reference.
  - Unexpected findings: None.
- **Consumer tracing:**
  - `write`: called by product CRUD POST route (TASK-04).
  - `update`: called by product CRUD PATCH route (TASK-04).
  - `delete`: called by product CRUD DELETE route (TASK-04).
  - `duplicate`: called by product CRUD duplicate route (TASK-04 extension).
  - All consumers are in TASK-04.
- **Scouts:** Check `ulid` package is importable in platform-core (used by `duplicate` to generate new ID).
- **Edge Cases & Hardening:**
  - `update` with empty delta: guard against sending empty `data` to Prisma (would be a no-op but still increments `row_version`).
  - `duplicate` source not found: `getById` returns null → throw descriptive error.
- **What would make this >=90%:** Confirm `ulid` package is available in `packages/platform-core/package.json` before build; add it if missing.
- **Rollout / rollback:** N/A — library code; rollback = revert the file.
- **Documentation impact:** None.
- **Notes / references:**
  - `products.json.server.ts` — port reference for all 4 methods.
  - `products.prisma.server.ts:36` — `shopId_id` composite key pattern already present in `getById`.

---

### TASK-03: Promote product/refund Zod schemas to inventory-uploader

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/inventory-uploader/src/lib/productSchemas.ts` with `createProductSchema`, `updateProductSchema`, `refundRequestSchema` extracted from `apps/caryina/src/lib/adminSchemas.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/lib/productSchemas.ts` (new), `[readonly] apps/caryina/src/lib/adminSchemas.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 95%
  - Implementation: 95% — schemas are self-contained Zod definitions; no caryina-specific imports verified.
  - Approach: 95% — direct copy and re-export.
  - Impact: 95% — prerequisite for TASK-04 and TASK-06.
- **Acceptance:**
  - [ ] `apps/inventory-uploader/src/lib/productSchemas.ts` created with `createProductSchema`, `updateProductSchema`, `refundRequestSchema` exported.
  - [ ] No imports from `apps/caryina` in the new file.
  - [ ] `pnpm typecheck` for inventory-uploader passes.
  - [ ] `apps/caryina/src/lib/adminSchemas.ts` still exists and is unchanged (do not delete yet — needed until TASK-09).
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — ensure `refundRequestSchema` validates `amountCents` as positive integer with a reasonable upper bound (>0, <=1000000 cents = €10,000 max)
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — schemas validated by route handler tests in TASK-04 and TASK-06
  - Data / contracts: Required — schemas define the API contract surface for product and refund routes
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-03):**
  - TC-01: `createProductSchema.parse({ sku: "test-sku", price: 2900, ... })` → succeeds
  - TC-02: `refundRequestSchema.parse({ amountCents: -1 })` → throws (negative amount rejected)
  - TC-03: `refundRequestSchema.parse({ amountCents: 0 })` → throws (zero amount rejected)
- **Execution plan:**
  - Read `apps/caryina/src/lib/adminSchemas.ts`. Copy `createProductSchema`, `updateProductSchema`, `refundRequestSchema` to `apps/inventory-uploader/src/lib/productSchemas.ts`. Add `amountCents` positive integer validation if not already present. Add `stripePaymentIntentId: z.string().optional()` to `refundRequestSchema` (required by TASK-06's portability resolution — inventory-uploader cannot look up the Stripe payment intent from a caryina-local DB, so callers must provide it directly).
- **Scouts:** None: schema self-containment confirmed from fact-find.
- **Edge Cases & Hardening:** Add `amountCents: z.number().int().positive().max(1000000)` bound if not already in `refundRequestSchema`.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** N/A.
- **Documentation impact:** None.
- **Notes / references:** `apps/caryina/src/lib/adminSchemas.ts` is the source.

---

### TASK-04: Add product CRUD API routes to inventory-uploader

- **Type:** IMPLEMENT
- **Deliverable:** 5 new route files in `apps/inventory-uploader/src/app/api/inventory/[shop]/products/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/products/route.ts` (new)
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/products/[id]/route.ts` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05, TASK-09
- **Confidence:** 85%
  - Implementation: 85% — route pattern is established 5+ times; Zod validation, `apiError()`, `runtime="nodejs"` all known; product repo is available after TASK-02.
  - Approach: 90% — direct application of established pattern.
  - Impact: 90% — required for Products UI (TASK-05) and admin panel deletion gate (TASK-09).
- **Acceptance:**
  - [ ] `GET /api/inventory/[shop]/products` → `prismaProductsRepository.read({ shopId })` → `200 { products: ProductPublication[] }`
  - [ ] `POST /api/inventory/[shop]/products` → Zod validate body against `createProductSchema` → `write()` → `201 { product }`
  - [ ] `GET /api/inventory/[shop]/products/[id]` → `getById()` → `200 { product }` or `404`
  - [ ] `PATCH /api/inventory/[shop]/products/[id]` → Zod validate body against `updateProductSchema` → `update()` → `200 { product }`
  - [ ] `DELETE /api/inventory/[shop]/products/[id]` → `delete()` → `204`
  - [ ] All routes: `export const runtime = "nodejs"`, auto-protected by middleware (no manual auth).
  - [ ] All routes: `console.info` logging with `shopId`, `productId`/`sku`, action.
  - [ ] Unit tests pass for all 5 routes (mock `prismaProductsRepository`).
  - [ ] `pnpm typecheck` for inventory-uploader passes.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — Zod validation on all inputs; middleware auto-protects; no additional auth code needed; `shopId` from URL params (not user-controlled in request body)
  - Logging / observability / audit: Required — `console.info` on mutations (POST/PATCH/DELETE)
  - Testing / validation: Required — unit tests for all 5 routes with mocked repo
  - Data / contracts: Required — request body validated by `createProductSchema`/`updateProductSchema`; `params: Promise<{ shop: string; id?: string }>` pattern
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new routes; removing them is the rollback
- **Validation contract (TC-04):**
  - TC-01: `GET /api/inventory/caryina/products` with valid session → 200 with products array
  - TC-02: `POST /api/inventory/caryina/products` with invalid body → 400 validation error
  - TC-03: `DELETE /api/inventory/caryina/products/nonexistent-id` → 404
  - TC-04: `PATCH /api/inventory/caryina/products/[id]` with valid body → 200 with updated product and incremented `row_version`
  - TC-05: Unauthenticated request to any product route → 401 (middleware intercepts)
- **Execution plan:** Red → Green → Refactor
  - Red: Routes don't exist; any request to `/api/inventory/[shop]/products` returns 404.
  - Green: Create route files following `adjustments/route.ts` pattern. Import `getProductsRepository` from `products.server.ts`. Add Zod validation using schemas from TASK-03. Add `console.info` logging.
  - Refactor: Extract shared `shopParam` helper if code duplication appears across routes.
- **Consumer tracing:**
  - New endpoints consumed by: TASK-05 (Products UI).
  - `prismaProductsRepository` methods called by these routes (TASK-02).
  - No existing consumers — new surface.
- **Scouts:** Check `apps/inventory-uploader/src/lib/api-helpers.ts` exports `apiError` — needed by all routes.
- **Edge Cases & Hardening:**
  - `POST` without `sku`: `createProductSchema` must require `sku` — verify Zod schema.
  - `DELETE` on active product: no guard needed (operator tool; operators can delete active products).
  - `PATCH` with no fields: `updateProductSchema` should allow partial updates; `row_version` increments regardless.
- **What would make this >=90%:** Add integration test against real Prisma client (not just unit test with mock).
- **Rollout / rollback:** New routes only; rollback = remove route files.
- **Documentation impact:** None.
- **Notes / references:**
  - Pattern file: `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts`
  - Repo import: `import { getProductsRepository } from "@acme/platform-core/repositories/products.server"`
- **Build completion evidence (2026-03-13):**
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/products/route.ts` — GET (readRepo) + POST (createProductInRepo via createProductSchema) created.
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/products/[id]/route.ts` — GET (getProductById) + PATCH (updateProductInRepo via updateProductSchema) + DELETE (deleteProductFromRepo) + POST duplicate (duplicateProductInRepo) created.
  - `packages/platform-core/src/repositories/products.server.ts` — `createProductInRepo` + `generateProductId` added and re-exported.
  - `pnpm --filter @acme/inventory-uploader exec tsc --noEmit` passes (no errors).
  - All routes follow established pattern: `runtime="nodejs"`, `apiError()`, Zod validation, `console.info` logging on mutations.

---

### TASK-05: Add Products view to inventory-uploader UI

- **Type:** IMPLEMENT
- **Deliverable:** Products view accessible from inventory-uploader console; list + create/edit form
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx`
  - `apps/inventory-uploader/src/components/products/ProductsView.client.tsx` (new)
  - `apps/inventory-uploader/src/components/products/ProductForm.client.tsx` (new)
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — tab/panel component pattern established; `ProductPublication` type is rich (many optional fields); form layout for translated strings requires care; empty-catalogue state needed.
  - Approach: 85% — view-level switch added above the existing inventory split-pane layout.
  - Impact: 90% — operator-facing product management capability.
  - Held-back test (Implementation 80): "What single unknown would drop below 80?" Non-goals state "default all locales to same value" — simplifies the form. All component patterns are established. No single unknown would drop below 80. Confirmation recorded.
- **Acceptance:**
  - [ ] View selector (e.g., "Inventory" / "Products" tabs or toggle) added to the console header.
  - [ ] Products view shows a list of all products for the selected shop, loaded from `GET /api/inventory/[shop]/products`.
  - [ ] "New product" button opens create form.
  - [ ] Create form: `sku` (required), `price` (required, in minor units), `currency`, `status` dropdown, `forSale` checkbox, `forRental` checkbox, title/description text fields (defaults same value to all locales), `media` as JSON textarea (advanced).
  - [ ] Edit: clicking a product in the list opens the same form pre-populated; save triggers PATCH.
  - [ ] Delete: confirmation modal before DELETE.
  - [ ] Empty-catalogue state: displayed when no products exist for the selected shop.
  - [ ] Success/error feedback inline after each mutation.
  - [ ] `pnpm typecheck` for inventory-uploader passes.
  - **Expected user-observable behavior:**
    - [ ] Operator sees "Products" view option in the console navigation.
    - [ ] Opening Products view shows product list or empty-catalogue message.
    - [ ] "New product" button opens a form; submitted form adds product to the list.
    - [ ] Clicking a product opens the edit form pre-filled with its data.
    - [ ] Delete confirmation modal appears before removing a product.
    - [ ] Success toast or inline confirmation shows after create/edit/delete.
- **Engineering Coverage:**
  - UI / visual: Required — use `gate-*` tokens, `rounded-xl`, `border-gate-border`, `bg-gate-surface` consistent with existing inventory console panels. Match existing tab/panel styling.
  - UX / states: Required — empty-catalogue state (no products), loading state (fetching list), error state (fetch failed), form validation errors, delete confirmation modal.
  - Security / privacy: N/A — routes are protected by middleware; UI doesn't handle auth.
  - Logging / observability / audit: N/A — API routes handle logging.
  - Testing / validation: Required — component unit tests for `ProductsView` (empty state, list render) and `ProductForm` (validation errors).
  - Data / contracts: Required — form must submit body matching `createProductSchema`; all locale fields (title, description) default same value to all supported locales.
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — UI component; rollback = remove component files.
- **Validation contract (TC-05):**
  - TC-01: `ProductsView` with empty products list → renders empty-catalogue state with "New product" button
  - TC-02: `ProductsView` with 3 products → renders 3 product rows with edit buttons
  - TC-03: `ProductForm` with missing `sku` → shows validation error before submit
  - TC-04: `ProductForm` submitted successfully → POST called with correct body; list refreshes
- **Execution plan:** Red → Green → Refactor
  - Red: No Products view exists; clicking imaginary "Products" nav shows nothing.
  - Green: Add view selector to `InventoryConsole`. Create `ProductsView.client.tsx` with product list + fetch. Create `ProductForm.client.tsx` for create/edit. Wire DELETE confirm modal.
  - Refactor: Extract reusable confirmation modal if delete confirm is repeated elsewhere.
- **Post-build QA:** After implementation, run:
  - `lp-design-qa` scoped to `apps/inventory-uploader` Products view — fix all Critical/Major findings.
  - `tools-ui-contrast-sweep` on Products view — fix all contrast failures.
  - Minor findings may be deferred with explicit rationale.
- **Consumer tracing:**
  - New: `ProductsView` → `GET /api/inventory/[shop]/products` (TASK-04).
  - New: `ProductForm` → `POST`, `PATCH` routes (TASK-04).
  - Delete: `DELETE` route (TASK-04).
  - No existing consumers modified.
- **Scouts:** Check whether InventoryConsole already has a top-level view switch pattern (vs. right-panel only). If not, add a simple state toggle above the existing split-pane.
- **Edge Cases & Hardening:**
  - Locale handling: title/description fields — single input writes `{ en: value, de: value, it: value }` etc. across all `CONTENT_LOCALES`.
  - Media field: JSON textarea for `MediaItem[]` is an advanced field; render as a collapsible optional section.
- **What would make this >=90%:** Add integration test (Cypress/Playwright) covering the create → list → delete flow.
- **Rollout / rollback:** New component files; rollback = remove. Console state-selector addition = revert the single line change to `InventoryConsole`.
- **Documentation impact:** None.
- **Notes / references:**
  - `InventoryConsole.client.tsx` — existing split-pane layout and token usage reference.
  - `CONTENT_LOCALES` from `packages/types/src/constants` — use for locale-defaulting logic.
- **Build completion evidence (2026-03-13):**
  - `ProductsView.client.tsx` — list view with status badge, edit/delete per row, "+ New Product" button; fetches `GET /api/inventory/[shop]/products` via AbortController pattern.
  - `ProductForm.client.tsx` — create/edit form with sku (create-only), title, description, price (decimal→minor units), currency, status select, forSale checkbox; calls POST (create) or PATCH (edit).
  - `InventoryConsole.client.tsx` — top-level view switch ("Inventory" | "Products") added above existing split-pane; `activeView` state controls which view renders.
  - `pnpm --filter @acme/inventory-uploader exec tsc --noEmit` passes. Lint passes (`--max-warnings=0`).
  - Token: `text-gate-on-accent` used for accent-background buttons (consistent with `InventoryImport.client.tsx`).

---

### TASK-06: Move refunds endpoint to inventory-uploader

- **Type:** IMPLEMENT
- **Deliverable:** New route `apps/inventory-uploader/src/app/api/inventory/[shop]/refunds/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/refunds/route.ts` (new)
- **Depends on:** TASK-03
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — existing `refunds/route.ts` in caryina is the direct template; shop param needs to be added to the URL; `resolveRefundProvider` logic unchanged.
  - Approach: 90% — port + shop-scope the existing route.
  - Impact: 90% — admin panel deletion (TASK-09) is gated on this.
- **Acceptance:**
  - [ ] `POST /api/inventory/[shop]/refunds` → validates `shopTransactionId`/`bankTransactionId`/`amountCents` using `refundRequestSchema` from TASK-03.
  - [ ] Provider resolution logic (`resolveRefundProvider`) ported identically.
  - [ ] Axerve path: reads `AXERVE_SHOP_LOGIN`/`AXERVE_API_KEY` from `process.env`.
  - [ ] Stripe path: calls `refundStripePayment({ shopTransactionId, amountCents })`.
  - [ ] All existing response codes preserved: 200, 400, 402, 404, 502, 503.
  - [ ] Route protected by existing inventory-uploader middleware.
  - [ ] Unit test for new refunds route covering: valid Stripe refund → 200, Axerve declined → 402, missing env vars → 503.
  - [ ] `pnpm typecheck` for inventory-uploader passes.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — `refundRequestSchema` Zod validation required; `amountCents` positive integer with upper bound; route protected by middleware; no hardcoded fallback credentials
  - Logging / observability / audit: Required — preserve `console.info` on success, `console.error` on failure (same as existing route)
  - Testing / validation: Required — unit tests for refund route handler
  - Data / contracts: Required — `resolveRefundProvider` uses `checkoutIdempotency.server` to look up provider from DB; this import must work from inventory-uploader
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new route; caryina route stays until TASK-09
- **Validation contract (TC-06):**
  - TC-01: `POST /api/inventory/caryina/refunds` with valid `shopTransactionId` + `amountCents` and `STRIPE_SECRET_KEY` in env → 200
  - TC-02: `POST` with missing `amountCents` → 400
  - TC-03: `POST` with `AXERVE_SHOP_LOGIN` absent → 503
  - TC-04: Route without session cookie → 401 (middleware)
- **Execution plan:**
  - **Dependency resolution (required before copying the route):**
    - `findCheckoutAttemptByShopTransactionId` from `@/lib/checkoutIdempotency.server` — **CARYINA-LOCAL + fs.promises-backed. Cannot be imported by inventory-uploader.** Resolution: update `refundRequestSchema` (TASK-03) to accept optional `stripePaymentIntentId: z.string().optional()` in the body. In the ported route, use `stripePaymentIntentId` from the request body directly — bypass the DB lookup entirely. Stripe callers must supply this value (they have it from the order confirmation).
    - `refundStripePayment` from `@/lib/payments/stripeRefund.server` — **CARYINA-LOCAL.** Resolution: do not port this helper. Inline the Stripe refund logic in the new route: `import { stripe } from "@acme/stripe"` → `stripe.refunds.create({ payment_intent: stripePaymentIntentId, amount: amountCents })` directly.
    - `resolveCaryinaPaymentProvider` from `@/lib/payments/provider.server` — **CARYINA-LOCAL but trivially portable.** Resolution: replace with `(process.env.PAYMENTS_PROVIDER ?? "axerve") as "axerve" | "stripe"` inline, or import `paymentsEnv` from `@acme/config/env/payments` if that package is accessible from inventory-uploader.
  - Once dependencies are resolved: create route file. Import `refundRequestSchema` from TASK-03. Use `[shop]` param from URL. Use inline provider resolution and inline Stripe refund call. Run typecheck.
- **Consumer tracing:**
  - New: operator calls `POST /api/inventory/[shop]/refunds` from inventory-uploader UI (future work — no UI required in this delivery).
  - No consumers of `checkoutIdempotency.server` in the new route (dependency removed — see Execution plan above).
- **Scouts:** Check that `@acme/axerve` and `@acme/stripe` packages are in inventory-uploader's `package.json`. Check whether `@acme/config/env/payments` is importable from inventory-uploader (for `PAYMENTS_PROVIDER` env var). Add packages if missing.
- **Edge Cases & Hardening:**
  - Stripe path without `stripePaymentIntentId`: return 400 "Stripe refunds require stripePaymentIntentId" — callers must supply it.
  - `PAYMENTS_PROVIDER` env var absent: fall back to `"axerve"` (same behaviour as original `resolveCaryinaPaymentProvider`).
- **What would make this >=90%:** Confirm `@acme/stripe` and `@acme/axerve` are in inventory-uploader's package.json before TASK-06 executes.
- **Rollout / rollback:** New route; caryina route preserved until TASK-09 confirms new route is working.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `apps/caryina/src/app/admin/api/refunds/route.ts`.
  - Payment credentials must be in inventory-uploader wrangler secrets before TASK-09.

---

### TASK-07: Write data migration script (3 products + 3 inventory rows)

- **Type:** IMPLEMENT
- **Deliverable:** One-time migration script that reads `data/shops/caryina/products.json` and `data/shops/caryina/inventory.json` and inserts rows into PostgreSQL via Prisma
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/migrate-caryina-data.ts` (new one-time script)
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-01
- **Confidence:** 85%
  - Implementation: 85% — source data confirmed (3 products fully read; inventory.json confirmed 3 rows with known InventoryItem schema); Prisma insert pattern is standard.
  - Approach: 85% — one-time idempotent migration script; standard pattern.
  - Impact: 95% — CHECKPOINT-01 and TASK-08 depend on successful migration.
- **Acceptance:**
  - [ ] Script reads `data/shops/caryina/products.json` and `data/shops/caryina/inventory.json`.
  - [ ] For each product: `prisma.product.upsert({ where: { shopId_sku: { shopId: "caryina", sku } }, create: {...}, update: {} })` — idempotent (safe to run twice).
  - [ ] For each inventory row: `prisma.inventoryItem.upsert({ where: { shopId_sku_variantKey: {...} }, create: {...}, update: {} })` — idempotent.
  - [ ] Script logs row counts: products inserted/skipped, inventory rows inserted/skipped.
  - [ ] Script exits with non-zero if any insert fails.
  - [ ] Script verifies final DB count matches source JSON count (assert products.length === DB count).
  - [ ] Dry-run mode: `--dry-run` flag logs what would be inserted without writing.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A — script runs locally/in CI with direct DB credentials; no user-facing surface
  - Logging / observability / audit: Required — emit row counts and verification assertion result; fail loudly on count mismatch
  - Testing / validation: Required — dry-run assertion test (run script with `--dry-run` against a test DB and verify output)
  - Data / contracts: Required — `ProductPublication` fields mapped to Prisma `Product` model; `InventoryItem` fields mapped to existing model
  - Performance / reliability: N/A — 7 rows total
  - Rollout / rollback: Required — idempotent upsert means re-running is safe; rollback = delete the 3 product rows from DB (does not restore JSON files, which remain as backup)
- **Validation contract (TC-07):**
  - TC-01: `pnpm tsx scripts/migrate-caryina-data.ts --dry-run` → logs "Found 3 product(s) and 3 inventory row(s)", exits 0
  - TC-02: `pnpm tsx scripts/migrate-caryina-data.ts` (real run against test DB) → `prisma.product.count({ where: { shopId: "caryina" } })` returns 3
  - TC-03: Run script twice → second run reports 0 new inserts (upsert idempotency)
- **Execution plan:**
  - Read source JSON files. Build upsert operations. Connect to DB via `@acme/platform-core/prisma` singleton. Run upserts. Assert counts. Log result.
- **Scouts:** Read `data/shops/caryina/inventory.json` to confirm field names match `InventoryItem` schema.
- **Edge Cases & Hardening:**
  - `created_at`/`updated_at` in products.json are ISO strings; Prisma `createdAt` is `DateTime`. Parse and pass as `new Date(...)`.
  - `shop` field in products.json = `"caryina"` → map to `shopId: "caryina"`.
- **What would make this >=90%:** Read inventory.json before execution to confirm field mapping (scout step).
- **Rollout / rollback:**
  - Rollout: Run on staging DB, verify counts, then run on production.
  - Rollback: `prisma.product.deleteMany({ where: { shopId: "caryina" } })` — nuclear but safe (JSON files are the backup).
- **Documentation impact:** None.
- **Notes / references:**
  - Source data: `data/shops/caryina/products.json` (3 products, fully confirmed), `data/shops/caryina/inventory.json`.
  - `InventoryItem` model: `packages/platform-core/prisma/schema.prisma:148`.

---

### CHECKPOINT-01: Staging migration + smoke test

- **Type:** CHECKPOINT
- **Status:** Pending
- **Depends on:** TASK-07
- **Blocks:** TASK-08

**Gate criteria (all must pass before TASK-08 executes):**
1. `pnpm --filter @acme/platform-core prisma migrate deploy` runs successfully on staging database.
2. Migration script (`scripts/migrate-caryina-data.ts`) runs against staging DB: 3 products inserted, 3 inventory rows inserted, count assertions pass.
3. `prisma.product.findMany({ where: { shopId: "caryina" } })` returns exactly 3 rows in staging DB.
4. Staging caryina storefront (if available) renders product listing with > 0 products after temporary `DB_MODE=prisma` + staging `DATABASE_URL` are set.

**If gate fails:** Do not proceed to TASK-08. Diagnose migration or schema issue. Replan if necessary.

---

### TASK-08: Wire caryina env vars (DATABASE_URL + DB_MODE + CARYINA_INVENTORY_BACKEND)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/lib/inventoryBackend.ts` (reads env var instead of hardcoded constant) + updated `apps/caryina/wrangler.toml` + verification that `prisma generate` runs in caryina's deployment pipeline
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/inventoryBackend.ts`, `apps/caryina/wrangler.toml`, possibly `.github/workflows/brikette.yml`
- **Depends on:** CHECKPOINT-01
- **Blocks:** TASK-09
- **Confidence:** 90%
  - Implementation: 90% — adding wrangler vars is a 5-line change; inventoryBackend.ts change is a 1-line env read; pattern exists in rest of codebase.
  - Approach: 90% — clear and unambiguous. CARYINA_INVENTORY_BACKEND is currently hardcoded `"json" as const` — must be changed to read from env before wrangler.toml var can take effect.
  - Impact: 90% — storefront will start reading inventory from PostgreSQL after this; without the inventoryBackend.ts fix, inventory reads would remain on JSON even after DB_MODE=prisma is set.
- **Acceptance:**
  - [ ] `apps/caryina/src/lib/inventoryBackend.ts` reads from `process.env.CARYINA_INVENTORY_BACKEND` with fallback to `"json"` (type-safe: `as "json" | "prisma"`).
  - [ ] `apps/caryina/wrangler.toml` has `DATABASE_URL` listed under `[secrets]` or as a wrangler secret (not hardcoded).
  - [ ] `apps/caryina/wrangler.toml` has `DB_MODE = "prisma"` in `[vars]`.
  - [ ] `apps/caryina/wrangler.toml` has `CARYINA_INVENTORY_BACKEND = "prisma"` in `[vars]`.
  - [ ] Verified: `prisma generate` runs as part of caryina's CI/build pipeline (check `.github/workflows/brikette.yml`); if not present, add it.
  - [ ] After deployment: caryina storefront `/shop` page returns > 0 products (smoke test confirms).
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — `DATABASE_URL` must be a wrangler secret (never in plaintext in wrangler.toml)
  - Logging / observability / audit: N/A
  - Testing / validation: Required — smoke test after deployment; product count > 0
  - Data / contracts: Required — `DB_MODE=prisma` activates `repoResolver` Prisma path; `CARYINA_INVENTORY_BACKEND=prisma` activates Prisma inventory path in `shop.ts`; data must be migrated before this deploys (gate enforced by CHECKPOINT-01)
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback: remove `DB_MODE` + `CARYINA_INVENTORY_BACKEND` vars from wrangler.toml → JSON fallback restores (silent failure, but acceptable short-term)
- **Validation contract (TC-08):**
  - TC-01: `repoResolver` resolves to `prismaProductsRepository` when `DB_MODE=prisma` + `DATABASE_URL` set → products returned from DB (not empty)
  - TC-02: Caryina storefront `/shop` page shows 3 products after deployment
  - TC-03: `wrangler secret list --name caryina` confirms `DATABASE_URL` is a registered secret (not plaintext)
  - TC-04: `inventoryBackend.ts` no longer exports `"json" as const`; reads `process.env.CARYINA_INVENTORY_BACKEND ?? "json"` with appropriate type cast
- **Execution plan:**
  - Change `apps/caryina/src/lib/inventoryBackend.ts` to `export const CARYINA_INVENTORY_BACKEND = (process.env.CARYINA_INVENTORY_BACKEND ?? "json") as "json" | "prisma";`. Add `DB_MODE = "prisma"` and `CARYINA_INVENTORY_BACKEND = "prisma"` to `[vars]` in `apps/caryina/wrangler.toml`. Run `wrangler secret put DATABASE_URL --name caryina` (or confirm it's already set). Check `.github/workflows/brikette.yml` for `prisma generate` step; add if missing. Deploy. Smoke test.
- **Consumer tracing:**
  - `repoResolver.ts` reads `DB_MODE` → switches all product repos to Prisma.
  - `apps/caryina/src/lib/shop.ts` reads `CARYINA_INVENTORY_BACKEND` → switches inventory reads to Prisma.
  - All caryina storefront pages calling `readRepo("caryina")` and `readInventory("caryina", ...)` become Prisma-backed.
- **Scouts:** Check `apps/caryina/wrangler.toml` for any existing secret declarations (confirm DATABASE_URL is not already there).
- **Edge Cases & Hardening:**
  - If `DATABASE_URL` points to a different cluster than inventory-uploader: will fail silently. Verify the value matches before deployment.
  - `INVENTORY_LOCAL_FS_DISABLED` is not needed in caryina (it's an inventory-uploader-specific var).
- **What would make this >=90%:** Confirm `DATABASE_URL` is the same value used by inventory-uploader before deploying.
- **Rollout / rollback:**
  - Rollout: Deploy caryina with new wrangler.toml.
  - Rollback: Remove `DB_MODE` and `CARYINA_INVENTORY_BACKEND` vars; redeploy → JSON path restores (silent failure, same as current broken state).
- **Documentation impact:** None.
- **Notes / references:**
  - `apps/inventory-uploader/wrangler.toml` — pattern reference for `DATABASE_URL` as wrangler secret.
  - `apps/caryina/src/lib/inventoryBackend.ts` — currently `"json" as const`; must become env-var-driven (codemoot CRITICAL finding 2026-03-13).

---

### TASK-09: Delete caryina admin panel and supporting files

- **Type:** IMPLEMENT
- **Deliverable:** Deleted files in `apps/caryina`; no admin routes or auth files remain
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/caryina/src/app/admin/` (delete entire directory)
  - `apps/caryina/src/proxy.ts` (delete)
  - `apps/caryina/src/lib/adminAuth.ts` (delete)
  - `apps/caryina/src/lib/adminSchemas.ts` (delete after confirming TASK-03 promoted all needed schemas)
  - `apps/caryina/src/lib/inventoryBackend.ts` (delete — constant was documentation only)
  - All associated test files listed in fact-find Coverage Gaps section
- **Depends on:** TASK-04, TASK-06, TASK-08
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — file list fully enumerated; no ambiguity.
  - Approach: 90% — deletion after all preconditions confirmed.
  - Impact: 85% — security debt resolved; slight risk of discovering an unlisted admin file.
- **Acceptance:**
  - [ ] `apps/caryina/src/app/admin/` directory does not exist.
  - [ ] `apps/caryina/src/proxy.ts` does not exist.
  - [ ] `apps/caryina/src/lib/adminAuth.ts` does not exist.
  - [ ] `apps/caryina/src/lib/adminSchemas.ts` does not exist.
  - [ ] `apps/caryina/src/lib/inventoryBackend.ts` does not exist.
  - [ ] All admin test files deleted.
  - [ ] `pnpm typecheck` for caryina passes (no broken imports).
  - [ ] No test failures from deleted test files (test runner skips non-existent files).
  - [ ] No route at `/admin/*` is accessible in caryina after deletion.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — verify no remaining `/admin/*` routes in caryina; verify no `adminAuth.ts` or `proxy.ts` imports anywhere in caryina
  - Logging / observability / audit: N/A
  - Testing / validation: Required — `pnpm typecheck` for caryina must pass; deleted test files must not cause test runner failures
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — cannot undo deletion easily; git history preserves files; preconditions (TASK-04, TASK-06, TASK-08) must all be confirmed before running this task
- **Validation contract (TC-09):**
  - TC-01: `find apps/caryina/src/app/admin -name "*.ts" 2>/dev/null | wc -l` → 0
  - TC-02: `grep -r "adminAuth\|adminSchemas\|proxy" apps/caryina/src --include="*.ts" | grep -v "^Binary"` → no results (no remaining imports)
  - TC-03: `pnpm typecheck` for caryina → passes
- **Execution plan:**
  - Confirm all preconditions (TASK-04 routes live + smoke tested, TASK-06 refunds route smoke tested, TASK-08 DB_MODE switch confirmed working).
  - Delete `src/app/admin/` directory and all contents.
  - Delete `src/proxy.ts`, `src/lib/adminAuth.ts`, `src/lib/adminSchemas.ts`, `src/lib/inventoryBackend.ts`.
  - Run typecheck. Fix any broken imports. Run import search to confirm no orphan references.
- **Scouts:** Run `grep -r "from.*adminAuth\|from.*proxy\|from.*adminSchemas" apps/caryina/src` before deletion to find any remaining consumers.
- **Edge Cases & Hardening:**
  - `adminSchemas.ts` may still be imported by remaining caryina files (e.g., route handlers outside admin). Run grep before deletion; update any remaining imports to use `productSchemas.ts` from inventory-uploader or remove if the handler is also being deleted.
- **What would make this >=90%:** Run `grep` sweep before executing deletion.
- **Rollout / rollback:**
  - Rollout: Delete files, deploy caryina.
  - Rollback: `git restore apps/caryina/src/app/admin/ apps/caryina/src/proxy.ts ...` — files recoverable from git.
- **Documentation impact:** None.
- **Notes / references:**
  - Precondition checklist: (1) `GET /api/inventory/caryina/products` returns products, (2) `POST /api/inventory/caryina/refunds` accepts valid request, (3) caryina storefront shows > 0 products.

---

## Risks & Mitigations

- **Data migration before DB_MODE deployment (critical):** CHECKPOINT-01 enforces this gate. TASK-08 cannot run until CHECKPOINT-01 passes.
- **Payment credentials in inventory-uploader:** All three (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) must be wrangler secrets in inventory-uploader before TASK-09. Plan TASK-06 acceptance criteria include smoke-testing the refunds route before TASK-09 is unblocked.
- **TASK-06 payment helper portability (Major):** `checkoutIdempotency.server`, `stripeRefund.server`, and `provider.server` are all caryina-local (`apps/caryina/src/lib/`) and cannot be imported by inventory-uploader. Additionally, `checkoutIdempotency.server` uses `fs.promises` and would fail on Workers. Resolution documented in TASK-06 execution plan: inline the Stripe refund call using `@acme/stripe` directly; accept `stripePaymentIntentId` in the request body; resolve provider via env var inline. See TASK-06 execution plan for the full dependency resolution approach.
- **`prisma generate` not in caryina CI/CD:** TASK-08 explicitly includes a verification step for this.
- **Same DATABASE_URL assumption:** TASK-08 includes a pre-deployment verification step.

## Observability

- Logging:
  - Product routes: `console.info("[products] write/update/delete", { shopId, id/sku, action })` on each mutation.
  - Refunds route: preserve existing `console.info` and `console.error` patterns from caryina route.
  - Migration script: emit source row counts and DB row counts; fail on mismatch.
- Metrics: None added — product catalogue is not a hot-path metric concern.
- Alerts/Dashboards: None — operational tool; no monitoring required in this delivery.

## Acceptance Criteria (overall)

- [ ] `GET /api/inventory/caryina/products` returns 3 products after migration
- [ ] Caryina storefront `/shop` page renders > 0 products (not empty)
- [ ] Inventory-uploader Products view loads product list, creates, edits, and deletes products
- [ ] `POST /api/inventory/caryina/refunds` with valid payload returns 200 or 402 (not 404)
- [ ] `apps/caryina/src/app/admin/` directory does not exist
- [ ] `pnpm typecheck` passes for both `apps/caryina` and `apps/inventory-uploader`
- [ ] All new unit tests pass in CI

## Decision Log

- 2026-03-13: Operator chose Option A (Full Prisma path) at ideas stage. Analysis confirmed no viable alternatives.
- 2026-03-13: Default assumption applied for refunds delivery timing: same delivery (not deferred). Refunds endpoint moved to inventory-uploader in TASK-06 before admin panel deletion in TASK-09.
- 2026-03-13: Products view implemented as a top-level view switch in InventoryConsole (not a right-panel tab), because product management is conceptually distinct from inventory variant editing. [Adjacent: delivery-rehearsal]

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add Product model | Yes — schema.prisma confirmed writable; full ProductPublication type confirmed | None | No |
| TASK-02: Complete Prisma repo | Partial — depends on TASK-01 completing first (model must exist before `prisma.product` is available) | [Missing precondition, Minor]: `prisma generate` must run between TASK-01 and TASK-02; plan uses `--name` flag during dev, then generate in CI for deployment | No (noted in TASK-01 acceptance) |
| TASK-03: Promote Zod schemas | Yes — adminSchemas.ts confirmed self-contained | None | No |
| TASK-04: Add product CRUD routes | Partial — depends on TASK-02+03 | [Import resolution, Minor]: `checkoutIdempotency.server` used by refunds route (TASK-06) — verify importable from inventory-uploader in TASK-06 scout | No (noted in TASK-06 scouts) |
| TASK-05: Products UI | Partial — depends on TASK-04 | [Scope assumption, Minor]: View-switch pattern (top-level vs right-panel tab) resolved in Decision Log | No |
| TASK-06: Move refunds endpoint | Partial — depends on TASK-03; all three payment helpers are caryina-local | [Import portability, Major]: `checkoutIdempotency.server`, `stripeRefund.server`, and `provider.server` are caryina-local and use `fs.promises` — cannot be ported as-is. Resolution documented in TASK-06 execution plan: inline Stripe call via `@acme/stripe`, accept `stripePaymentIntentId` in request body, inline provider env-var resolution. | No (resolved in TASK-06 execution plan) |
| TASK-07: Data migration script | Partial — depends on TASK-01 (Product model) | [Missing precondition, Minor]: inventory.json not yet read; scout step in TASK-07 must verify field mapping | No (noted in TASK-07 scouts) |
| CHECKPOINT-01: Staging gate | Partial — depends on TASK-07 completing | [Ordering inversion, Moderate]: If TASK-08 runs before CHECKPOINT-01, storefront returns empty. CHECKPOINT enforces gate. | No (CHECKPOINT-01 blocks TASK-08) |
| TASK-08: Wire wrangler.toml | Partial — depends on CHECKPOINT-01 | None | No |
| TASK-09: Delete admin panel | Partial — depends on TASK-04+06+08 | [Missing precondition, Moderate]: Payment credentials must be in inventory-uploader wrangler secrets. Listed in TASK-09 precondition checklist. | No (noted in TASK-09 acceptance) |

## Overall-confidence Calculation

- TASK-01: 90%, S=1 → 90
- TASK-02: 85%, M=2 → 170
- TASK-03: 95%, S=1 → 95
- TASK-04: 85%, M=2 → 170
- TASK-05: 80%, M=2 → 160
- TASK-06: 85%, S=1 → 85
- TASK-07: 85%, S=1 → 85
- TASK-08: 90%, S=1 → 90
- TASK-09: 85%, S=1 → 85
- Sum weights: 12 | Sum weighted: 1030
- Overall-confidence: 1030 / 12 = 85.8% → **85%**
