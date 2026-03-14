---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-13
Feature-Slug: inventory-uploader-product-management
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
---

# Build Record: Inventory Uploader — Product Management + Caryina DB Migration

## Outcome Contract

- **Why:** Caryina product and stock data is saved in files that do not work on the Cloudflare Workers hosting platform — the shop is silently broken in production for any data write. No operator tool exists to add, edit, or remove products across any shop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inventory-uploader has a working Products tab for all shops. Caryina products and inventory are stored in PostgreSQL. The caryina admin panel is removed. Product data is no longer stored in flat files for any shop.
- **Source:** operator

## What Was Built

**TASK-01 — Product database model:** Added a `Product` model to `packages/platform-core/prisma/schema.prisma` covering the full `ProductPublication` type, including optional rental and physical-attribute fields (`materials`, `dimensions`, `weight`) as `Json?` columns. Added `@@unique([shopId, sku])`, `@@unique([shopId, id])`, and `@@index([shopId])` constraints. Generated the corresponding Prisma migration file.

**TASK-02 — Repository write methods:** Completed the four stub methods in `packages/platform-core/src/repositories/products.prisma.server.ts`: `write` (creates via `prisma.product.create`), `update` (updates with `row_version: { increment: 1 }`), `delete` (deletes by `shopId_id` composite key), and `duplicate` (creates a copy with a new ULID, `-copy` SKU suffix, `status: "draft"`, `row_version: 1`). All JSON fallback delegates removed. `console.info` logging added to every mutation.

**TASK-03 — Zod schemas promoted:** Created `apps/inventory-uploader/src/lib/productSchemas.ts` with `createProductSchema`, `updateProductSchema`, and `refundRequestSchema` — extracted from `apps/caryina/src/lib/adminSchemas.ts`. `refundRequestSchema` extended with `stripePaymentIntentId: z.string().optional()` so callers supply the intent ID directly; `amountCents` bounded to positive integer ≤ 1,000,000.

**TASK-04 — Product CRUD API routes:** Added 5 route files under `apps/inventory-uploader/src/app/api/inventory/[shop]/products/`: `GET` + `POST` on the collection, and `GET` + `PATCH` + `DELETE` on `[id]`. All routes use `export const runtime = "nodejs"`, are auto-protected by existing middleware, validate inputs with the promoted Zod schemas, and log mutations via `console.info`.

**TASK-05 — Products view UI:** Added a top-level Products view to the inventory-uploader console. Includes a shop-scoped product list, create/edit form for all `ProductPublication` fields, delete confirmation, and empty-catalogue state. Uses existing `gate-*` design tokens and established component patterns. Separate from the right-panel inventory view.

**TASK-06 — Refunds endpoint moved:** Moved the refunds route from the caryina admin panel to `apps/inventory-uploader/src/app/api/inventory/[shop]/refunds/route.ts`. Route resolves provider (Axerve or Stripe) based on `shopId`; payment credentials sourced from inventory-uploader wrangler secrets.

**TASK-07 — Data migration script:** Created `scripts/migrate-caryina-data.ts` that reads the 3 existing caryina products and 3 inventory rows from JSON source files and upserts them into PostgreSQL using `prisma.product.upsert` and `prisma.inventoryItem.upsert`. Script supports `--dry-run` flag; dry-run assertion confirms no DB writes occur.

**TASK-08 — Caryina env var wiring:** Updated `inventoryBackend.ts` to be env-var driven: `CARYINA_INVENTORY_BACKEND` switches between `prisma` and `json` at runtime. Updated `apps/caryina/wrangler.toml` with `DATABASE_URL` binding and `DB_MODE=prisma` / `CARYINA_INVENTORY_BACKEND=prisma` vars (commented out by default — must be uncommented after CHECKPOINT-01).

**TASK-09 — Admin panel deleted:** Deleted all 23 files from `apps/caryina/src/app/admin/` and supporting auth, proxy, and test files. The `inventoryBackend` constant referencing the old panel removed from the caryina app.

**CHECKPOINT-01** (operator gate) remains pending: the staging migration run and smoke test must be executed by the operator before the `DB_MODE=prisma` env var is enabled in production.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` (platform-core) | Pass | After `prisma generate`; `prismaClient.product` delegate confirmed |
| `pnpm typecheck` (inventory-uploader) | Pass | After TASK-03 schemas and TASK-04 routes |
| `pnpm typecheck` (caryina) | Pass | After TASK-08 wiring and TASK-09 deletion |
| Unit tests — `prismaProductsRepository` | Pass (CI) | All 4 new methods covered with mocked Prisma client |
| Unit tests — product CRUD routes | Pass (CI) | All 5 routes covered; `prismaProductsRepository` mocked |
| Unit tests — refunds route | Pass (CI) | `refundRequestSchema` validation + provider resolution covered |
| Unit tests — migration script dry-run | Pass (CI) | Dry-run assertion: no `prisma.product.upsert` calls reach the DB |
| `prisma validate` | Pass | Schema validates with no errors post-model addition |

## Workflow Telemetry Summary

None: workflow telemetry was not captured for this build.

## Validation Evidence

### TASK-01
- TC-01: `prisma validate` after adding `Product` model — passes with no errors.
- TC-02: `prisma generate` completed; `prismaClient.product` delegate available; no TypeScript error on `db.product.findMany`.
- TC-03: Generated migration SQL is `CREATE TABLE "Product" ...` with no `ALTER TABLE` on existing tables (additive only).

### TASK-02
- TC-01: `prismaProductsRepository.write(...)` → `prisma.product.create` called with correct shape.
- TC-02: `prismaProductsRepository.update(...)` → `prisma.product.update` called with `row_version: { increment: 1 }`.
- TC-03: `prismaProductsRepository.delete(...)` → `prisma.product.delete` called with `shopId_id` composite key.
- TC-04: `prismaProductsRepository.duplicate(...)` → new product created with `-copy` SKU suffix, `status: "draft"`, `row_version: 1`.
- TC-05: No method delegates to `jsonProductsRepository` in any code path.

### TASK-03
- TC-01: `createProductSchema.parse({ sku: "test-sku", price: 2900, ... })` → succeeds.
- TC-02: `refundRequestSchema.parse({ amountCents: -1 })` → throws (negative amount rejected).
- TC-03: `refundRequestSchema.parse({ amountCents: 0 })` → throws (zero amount rejected).

### TASK-04
- GET `/api/inventory/[shop]/products` → `200 { products: ProductPublication[] }`.
- POST with valid body → `201 { product }`.
- GET `/api/inventory/[shop]/products/[id]` → `200 { product }` or `404`.
- PATCH with valid delta → `200 { product }`.
- DELETE → `204`.
- All routes: `export const runtime = "nodejs"`, auto-protected by middleware.

### TASK-05
- Products view renders product list, create/edit form, delete confirmation, and empty-catalogue state.
- Top-level view switch (not nested in inventory right panel).

### TASK-06
- POST `/api/inventory/[shop]/refunds` → validates `shopTransactionId`, `bankTransactionId`, `amountCents`; resolves to Axerve or Stripe provider; returns `200/402/502`.

### TASK-07
- `--dry-run` mode: script logs planned upserts; no DB writes performed.
- All 3 products and 3 inventory rows confirmed present in JSON source files prior to migration.

### TASK-08
- `CARYINA_INVENTORY_BACKEND` env var read by `inventoryBackend.ts`; switches to Prisma when set to `prisma`.
- `apps/caryina/wrangler.toml` updated with `DATABASE_URL`, `DB_MODE`, and `CARYINA_INVENTORY_BACKEND` bindings.

### TASK-09
- 23 admin panel files deleted from `apps/caryina`.
- `pnpm typecheck` for caryina passes after deletion (no dangling references).

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Products view added to inventory-uploader using existing `gate-*` tokens and component patterns | List + create/edit form; empty-catalogue state handled |
| UX / states | Empty catalogue, create form, edit form, delete confirmation, success/error feedback | Multi-locale editing deferred (all locales write same value) |
| Security / privacy | New product routes auto-protected by existing middleware; refunds route carries `refundRequestSchema` Zod validation; payment credentials in wrangler secrets | No new auth code needed; `shopId` from URL params only |
| Logging / observability / audit | `console.info` on all product write/update/delete routes with `shopId`, `productId`, and action | Full audit-event trail deferred as future work |
| Testing / validation | Unit tests for 4 new repository methods, 5 product routes, 1 refunds route, migration script dry-run | Per testing-policy — CI only |
| Data / contracts | Additive `Product` model covering full `ProductPublication` type; `@@unique([shopId, sku])`, `@@unique([shopId, id])`, `@@index([shopId])`; 3 products + 3 inventory rows migration script ready | No existing models changed |
| Performance / reliability | N/A — catalogue max ~100 products; Prisma singleton connection pooling handles Workers concurrency | N/A |
| Rollout / rollback | Migration must run before `DB_MODE=prisma` env var is deployed; CHECKPOINT-01 enforces this gate; rollback: remove `DB_MODE` + `CARYINA_INVENTORY_BACKEND` vars → JSON fallback restores | Staging migration (CHECKPOINT-01) remains a required operator step before production |

## Scope Deviations

None: all tasks delivered as specified in plan. CHECKPOINT-01 remains a pending operator gate (not a scope deviation — it was always an operator step, not a code task).
