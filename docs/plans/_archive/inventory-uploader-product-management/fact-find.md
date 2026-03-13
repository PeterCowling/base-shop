---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-product-management
Execution-Track: code
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/inventory-uploader-product-management/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313170000-0001
---

# Inventory Uploader — Product Management + Caryina DB Migration Fact-Find

## Scope

### Summary

Two interlinked gaps are addressed here as a single delivery:

1. **Platform gap (all shops):** The inventory-uploader has no product management — operators can adjust stock levels but cannot add, edit, or remove products. The `prismaProductsRepository` exists but is a stub: reads are Prisma-aware, but writes/updates/deletes/duplicates fall back to JSON unconditionally. There is no `Product` model in the Prisma schema.

2. **Caryina deployment gap:** Caryina's `wrangler.toml` has no `DATABASE_URL` and no `DB_MODE` setting. On Cloudflare Workers (where `fs.readFile` does not exist), the JSON product and inventory backends will fail at runtime. Caryina is currently broken in production for any code path that touches products or inventory.

### Goals

- Add a `Product` model to `packages/platform-core/prisma/schema.prisma` with appropriate fields and constraints.
- Complete `prismaProductsRepository` so that write/update/delete/duplicate use Prisma, not JSON fallbacks.
- Add product CRUD API routes to `apps/inventory-uploader`: `GET/POST /api/inventory/[shop]/products` and `GET/PATCH/DELETE /api/inventory/[shop]/products/[id]`.
- Add a Products tab to the `InventoryConsole` UI in inventory-uploader.
- Promote caryina's product/inventory Zod schemas (`adminSchemas.ts`) to a shared location (inventory-uploader lib or platform-core) for reuse.
- Wire `apps/caryina/wrangler.toml` to use `DATABASE_URL` + `DB_MODE=prisma`.
- Migrate caryina's 3 products and 4 inventory rows from JSON files to PostgreSQL.
- Delete the caryina admin panel and its supporting files once product management is covered by inventory-uploader.
- Resolve the refunds endpoint: move to inventory-uploader (the appropriate operator tool).

### Non-goals

- Multi-locale product editing in the UI (create/edit will default all locales to the same value, matching the existing caryina admin behaviour).
- Product image upload (media URLs are provided as strings, not uploaded via the UI).
- Role-based per-shop access control (inventory-uploader uses a single shared token).
- Migrating other shops from JSON to Prisma (caryina only in this delivery).

### Constraints & Assumptions

- Constraints:
  - Caryina runs on Cloudflare Workers with `nodejs_compat`; PostgreSQL must be reachable from Workers. The inventory-uploader already uses `DATABASE_URL` as a wrangler secret and `InventoryAuditEvent` writes to Prisma in prod — **this validates the PostgreSQL-from-Workers path**.
  - The Prisma schema uses PostgreSQL (`provider = "postgresql"`). No D1.
  - `INVENTORY_LOCAL_FS_DISABLED = "1"` is already set as a `[vars]` in inventory-uploader wrangler.toml — this signals filesystem is disabled in that deployment context.
  - `adminSchemas.ts` currently lives in `apps/caryina/src/lib/` — must be moved or the relevant parts promoted before the admin panel is deleted.

- Assumptions:
  - The same `DATABASE_URL` secret used by inventory-uploader covers the caryina shop's data (same PostgreSQL cluster, same database, different `shopId`). This is consistent with how all shops share the platform-core Prisma schema.
  - `DB_MODE=prisma` is safe to set for caryina because `InventoryItem` model exists and `InventoryAuditEvent` writes are already working in inventory-uploader.
  - The refunds endpoint is best homed in inventory-uploader (same auth model, same operator audience).

## Outcome Contract

- **Why:** Caryina product and stock data is saved in files that do not work on the Cloudflare Workers hosting platform — the shop is silently broken in production for any data write. No operator tool exists to add, edit, or remove products across any shop. Fixing this gives caryina reliable database storage and gives all shops a product management screen in the inventory tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inventory-uploader has a working Products tab for all shops. Caryina products and inventory are stored in PostgreSQL. The caryina admin panel is removed. Product data is no longer stored in flat files for any shop.
- **Source:** operator

## Current Process Map

- **Trigger:** Operator wants to add/edit/remove a caryina product, or update caryina stock.
- **End condition:** Product data updated and visible to storefront.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Product CRUD (caryina) | Operator opens `/admin/products` in the caryina app → authenticates with `CARYINA_ADMIN_KEY` cookie → creates/edits product via form → form POSTs to `/admin/api/products` → `writeRepo()` writes to `data/shops/caryina/products.json` | caryina app, JSON file | `apps/caryina/src/app/admin/products/`, `packages/platform-core/src/repositories/products.json.server.ts` | Auth guard (`proxy.ts`) is never invoked — no `middleware.ts` exists. Route is fully unprotected. Also: `fs.readFile` fails in Cloudflare Workers. |
| Inventory update (caryina) | Operator POSTs to `/admin/api/inventory/[sku]` → `updateInventoryItem()` → `inventory.json` via `.lock` file | caryina app, JSON file | `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`, `packages/platform-core/src/repositories/inventory.json.server.ts` | No middleware.ts → unprotected. Also: `fs` unavailable in Workers. |
| Storefront product reads | `readRepo("caryina")` → `repoResolver` → with `DATABASE_URL` absent → JSON fallback → `fs.readFile` on Workers → **silent empty array** | caryina Workers deployment | `packages/platform-core/src/repositories/repoResolver.ts:86-92`, `packages/platform-core/src/repositories/products.json.server.ts:26-34` | `readFile` throws on Workers; catch block silently returns `[]`. Storefront shows zero products. |
| Refunds | Operator POSTs to `/admin/api/refunds` with `shopTransactionId`/`amountCents` → resolves provider (Axerve or Stripe) → calls payment provider API | caryina app | `apps/caryina/src/app/admin/api/refunds/route.ts` | Also unprotected (same missing-middleware issue). Must be preserved and given a new home. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points

- `packages/platform-core/prisma/schema.prisma` — Prisma schema; `Product` model absent; `InventoryItem` model present (line 147) as implementation reference.
- `packages/platform-core/src/repositories/products.prisma.server.ts` — stub Prisma repo; `write/update/delete/duplicate` delegate to `jsonProductsRepository`.
- `packages/platform-core/src/repositories/products.json.server.ts` — full JSON CRUD reference implementation; all five methods complete.
- `packages/platform-core/src/repositories/products.server.ts` — public repo surface; uses `resolveRepo()` with `backendEnvVar: "PRODUCTS_BACKEND"`.
- `packages/platform-core/src/repositories/repoResolver.ts` — backend resolution logic; checks `PRODUCTS_BACKEND` then `DB_MODE`; falls back to JSON when `DATABASE_URL` absent or model delegate missing.
- `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` — root console; split-pane with left `InventoryMatrix`/`InventoryImport`, right tabs (editor, ledger, adjustments, inflows). **Products section absent entirely.**
- `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` — canonical API route pattern (`runtime = "nodejs"`, `apiError`, Zod validation, `{ params: Promise<{ shop: string }> }`).
- `apps/caryina/src/lib/adminSchemas.ts` — Zod schemas for product CRUD (`createProductSchema`, `updateProductSchema`, `updateInventorySchema`, `refundRequestSchema`). Must be promoted before admin panel is deleted.
- `apps/caryina/wrangler.toml` — bare config; 9 lines; no `DATABASE_URL` secret, no `DB_MODE` var.
- `apps/inventory-uploader/wrangler.toml` — has `DATABASE_URL` as documented wrangler secret; `INVENTORY_LOCAL_FS_DISABLED = "1"` in `[vars]`.

### Key Modules / Files

| File | Role |
|---|---|
| `packages/platform-core/prisma/schema.prisma` | Source of truth for all Prisma models. `Product` model must be added here. |
| `packages/platform-core/src/repositories/products.prisma.server.ts` | Prisma implementation — read/getById are wired; write/update/delete/duplicate must be implemented. |
| `packages/platform-core/src/repositories/products.json.server.ts` | JSON reference; provides exact field semantics and `row_version` bump logic to port to Prisma. |
| `packages/types/src/Product.ts` | `ProductPublication` type definition — drives the shape of the Prisma model. Has `title: Translated`, `description: Translated` (JSON), `media: MediaItem[]` (JSON), plus flat scalar fields. |
| `apps/caryina/src/lib/adminSchemas.ts` | Zod validation for product create/update — to be promoted to inventory-uploader lib. |
| `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` | Root UI; `RightPanelTab` union type and `TAB_LABELS` must be extended with `"products"`. |
| `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` | Canonical route pattern for new product routes to follow. |
| `apps/inventory-uploader/src/lib/api-helpers.ts` | `apiError()` helper used by all routes. |
| `packages/platform-core/src/repositories/repoResolver.ts` | Backend resolution; `DB_MODE=prisma` env var triggers Prisma path without per-repo variable. |
| `apps/caryina/src/app/admin/api/refunds/route.ts` | Refunds endpoint — must be preserved and moved to inventory-uploader. |

### Patterns & Conventions Observed

- **API routes:** `export const runtime = "nodejs"`, `{ params: Promise<{ shop: string }> }`, Zod parse → error 400, `apiError(err)` → 500. Evidence: `adjustments/route.ts`.
- **Auth:** Middleware cookie fast-path in `apps/inventory-uploader/src/middleware.ts`; full HMAC verify deferred to SSR. Product routes will be auto-protected by same middleware matcher `/((?!login|api/inventory/login|...).*)`.
- **Repository write pattern (JSON):** read → merge/apply → atomic write via `tmpfile + fs.rename`. Prisma equivalent: `upsert` or `update` within a transaction.
- **Prisma model shape:** Use `@id` for ULID string ID; JSON columns for `Translated` fields; `@@unique([shopId, sku])` for uniqueness; `@@index([shopId])` for performance. Reference: `InventoryItem` model (lines 147–165 of schema.prisma).
- **`row_version`:** JSON implementation increments on every `update` call. Prisma must replicate: `row_version: { increment: 1 }` in `prisma.product.update`.
- **Composite findUnique:** existing `products.prisma.server.ts:36` calls `db.product.findUnique({ where: { shopId_id: { shopId, id } } })`, requiring `@@unique([shopId, id])` constraint in the model — despite `id` being the primary key.

### Data & Contracts

- Types/schemas/events:
  - `ProductPublication` (`packages/types/src/Product.ts:143`) — canonical product type; JSON fields: `title: Record<Locale, string>`, `description: Record<Locale, string>`, `media: MediaItem[]`.
  - `createProductSchema` and `updateProductSchema` (`apps/caryina/src/lib/adminSchemas.ts`) — to be promoted to `apps/inventory-uploader/src/lib/productSchemas.ts`.
  - `ProductsRepository` interface (`packages/platform-core/src/repositories/products.types.ts`) — 6 methods: `read`, `write`, `getById`, `update`, `delete`, `duplicate`.

- Persistence:
  - Current (caryina): `data/shops/caryina/products.json` (3 products), `data/shops/caryina/inventory.json` (4 rows).
  - Target: PostgreSQL via Prisma. `InventoryItem` already supports caryina's 4 rows. `Product` model must be added to support the 3 products.
  - `CARYINA_INVENTORY_BACKEND = "json"` constant in `apps/caryina/src/lib/inventoryBackend.ts` is documentation only — does not affect `repoResolver`. Can be deleted.

- API/contracts:
  - New routes (inventory-uploader): `GET /api/inventory/[shop]/products`, `POST /api/inventory/[shop]/products`, `GET /api/inventory/[shop]/products/[id]`, `PATCH /api/inventory/[shop]/products/[id]`, `DELETE /api/inventory/[shop]/products/[id]`.
  - Refunds route: `POST /api/inventory/[shop]/refunds` (moved from caryina `/admin/api/refunds`).
  - Env vars added to caryina: `DATABASE_URL` (secret), `DB_MODE=prisma` (var).

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/platform-core/prisma/schema.prisma` → must be updated before any Prisma product operations work.
  - `packages/types/src/Product.ts` → `ProductPublication` drives Prisma model shape.
  - `apps/inventory-uploader/wrangler.toml` → `DATABASE_URL` already present; no change needed.
  - `apps/caryina/wrangler.toml` → `DATABASE_URL` + `DB_MODE=prisma` must be added.

- Downstream dependents:
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — reads products via `readRepo("caryina")`; will start reading from Prisma automatically once `DB_MODE=prisma` and `DATABASE_URL` are set.
  - `apps/caryina/src/app/[lang]/shop/page.tsx` — same.
  - Any other caryina page that calls `readRepo` or `getProductById`.

- Likely blast radius:
  - **Schema migration:** Additive (new `Product` model only). No existing models changed. Standard Prisma migration; no destructive SQL.
  - **caryina storefront reads:** Seamless cutover once `DB_MODE=prisma` + `DATABASE_URL` are set and data is migrated. If data migration is incomplete, storefront will return empty products — visible regression.
  - **Other shops:** Setting `DB_MODE=prisma` is per-deployment (env var). Other shops without `Product` rows will read empty arrays (safe; existing JSON files remain).
  - **JSON files:** Can be kept as backup reference after migration; removing them is out of scope.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (monorepo-wide), configured per app.
- Commands: `pnpm --filter @acme/platform-core test` (repository unit tests), `pnpm --filter inventory-uploader test` (app tests).
- CI integration: Tests run in CI (`docs/testing-policy.md`). Do not run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| inventory-uploader API routes | None found | — | No `__tests__` dirs under `apps/inventory-uploader`. Needs unit tests for new product routes. |
| platform-core repositories | Unknown | — | Not investigated; likely tested via integration tests. Product Prisma repo has no tests to update/remove. |
| caryina admin | Unit | `apps/caryina/src/app/admin/api/*/route.test.ts`, `apps/caryina/src/app/admin/products/*.test.tsx` | Existing tests must be deleted with the admin panel. |
| caryina adminSchemas | None explicit | — | Schemas are simple Zod — no dedicated tests; validated by route handler tests. |

#### Coverage Gaps

- Untested paths:
  - All new `prismaProductsRepository` write/update/delete/duplicate methods — need unit tests with Prisma mock.
  - New inventory-uploader product CRUD routes — need route handler tests.
  - Data migration script — needs a dry-run assertion test.
- Extinct tests (to remove):
  - `apps/caryina/src/app/admin/api/auth/route.test.ts`
  - `apps/caryina/src/app/admin/api/products/route.test.ts`
  - `apps/caryina/src/app/admin/api/products/[id]/route.test.ts`
  - `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`
  - `apps/caryina/src/app/admin/api/refunds/route.test.ts`
  - `apps/caryina/src/app/admin/products/page.test.tsx`
  - `apps/caryina/src/app/admin/products/new/page.test.tsx`
  - `apps/caryina/src/app/admin/products/[id]/page.test.tsx`
  - `apps/caryina/src/app/admin/login/page.test.tsx`
- Untested paths (new, to add):
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/refunds/route.test.ts` — new refunds endpoint must have test coverage before caryina admin panel is deleted.

#### Recommended Test Approach

- Unit tests for: `prismaProductsRepository.write`, `.update`, `.delete`, `.duplicate` (mock Prisma client).
- Unit tests for: new inventory-uploader product routes (mock repo functions).
- Integration test for: data migration script against test database.
- Manual smoke test: caryina storefront product listing after DB_MODE switch.

### Recent Git History (Targeted)

- `apps/inventory-uploader/src/` — last 10 commits are all refactoring rounds (simplification, CSV fixes, abort handling). No product management work. Active codebase, high confidence patterns are stable.
- `packages/platform-core/prisma/schema.prisma` — not directly in git log above; assumed stable (Prisma schema changes are rare and tracked separately).

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Inventory console has established Tailwind hand-built components; split-pane + tabs pattern documented in `InventoryConsole.client.tsx` | No Products tab exists; new tab and list/form components needed | Design against existing tab/panel tokens (`gate-*`) |
| UX / states | Required | Existing inventory editor shows `sku`-selected empty state, loading state, error state | Product CRUD has create/edit/delete flows with no existing model; empty catalogue state needed | Define empty-catalogue state, delete-confirmation UX, success/error feedback |
| Security / privacy | Required | Inventory-uploader middleware protects all routes except `/login` and `/api/inventory/login`; HMAC session verified at SSR | New product routes automatically protected by existing middleware matcher — no additional auth needed. Refunds endpoint brings sensitive payment data; must validate all input via Zod before touching payment APIs | Confirm refunds route Zod validation matches current caryina implementation; check `amountCents` bounds |
| Logging / observability / audit | Required | `adjustments/route.ts` uses `applyStockAdjustment` which writes `InventoryAuditEvent` rows for full audit trail | Product CRUD has no audit trail today (JSON file mutations are silent). Should log create/update/delete at `console.info` level at minimum; full audit model is out of scope for this delivery | Add `console.info` logging to product write routes; note full product audit trail as future work |
| Testing / validation | Required | No existing tests in inventory-uploader; caryina admin has tests that will be deleted | New routes and new Prisma methods need test coverage; migration script needs dry-run assertion | Unit tests for prismaProductsRepository methods; unit tests for new API routes |
| Data / contracts | Required | `ProductPublication` type drives schema shape; `InventoryItem` is reference model; `repoResolver` controls backend; env vars `PRODUCTS_BACKEND` / `DB_MODE` | `Product` Prisma model absent; `@@unique([shopId, id])` constraint required by existing code; caryina wrangler.toml missing `DATABASE_URL` + `DB_MODE` | Schema migration is additive; data migration is 3 products + 4 inventory rows; env vars must be set before storefront reads switch |
| Performance / reliability | N/A | Product catalogues are small (3–100 products); no hot-path concern. Prisma connection pooling handled by platform-core `prisma` singleton. | — | — |
| Rollout / rollback | Required | Caryina storefront reads will switch from JSON (empty silently on Workers) to Prisma (real data) once `DB_MODE=prisma` is set | If data migration is incomplete at the time of env var deployment, storefront returns empty products (regresses from current silent-failure state). Rollback: remove `DB_MODE` var → falls back to JSON (silent failure returns, which is the current state). | Migration script must run and be verified before `DB_MODE=prisma` is deployed; cutover ordering is critical |

## External Research

Not investigated: all required evidence is present in the repository.

## Questions

### Resolved

- **Q: Can PostgreSQL be reached from Cloudflare Workers via `nodejs_compat`?**
  - A: Yes. Inventory-uploader deploys to Workers with `nodejs_compat`, has `DATABASE_URL` as a wrangler secret, and `InventoryAuditEvent` Prisma writes are confirmed working in production. The connectivity path is validated.
  - Evidence: `apps/inventory-uploader/wrangler.toml:14-16`, audit findings confirming inventory-uploader uses Prisma in prod.

- **Q: Should the Product Prisma model use Json columns for title/description/media, or normalized tables?**
  - A: Json columns. `ProductPublication.title` and `.description` are `Record<Locale, string>` — a flexible locale map that changes as locales are added. `media` is `MediaItem[]` with extensible fields. Normalizing these would require joining every product read. The existing `Page.data`, `SectionTemplate.data`, and `InventoryItem.variantAttributes` all use `Json` for similar shapes. Consistent with platform convention.
  - Evidence: `packages/platform-core/prisma/schema.prisma:18-38` (Page, SectionTemplate use Json).

- **Q: Where should the refunds endpoint live once the caryina admin panel is deleted?**
  - A: `apps/inventory-uploader`, under `/api/inventory/[shop]/refunds`. Same auth model (operator tool, single shared token), same audience (operator), same deployment context. Shop-scoped URL matches the existing pattern. Axerve/Stripe credentials remain in caryina's wrangler.toml (or can be moved to inventory-uploader if both apps share the same worker environment).
  - Evidence: inventory-uploader middleware pattern; operator tool audience alignment.

- **Q: Does `@@unique([shopId, id])` make sense given `id` is `@id`?**
  - A: Yes — required by existing code. `products.prisma.server.ts:36` calls `db.product.findUnique({ where: { shopId_id: { shopId, id } } })`. Prisma generates `shopId_id` as the composite unique name when `@@unique([shopId, id])` is declared. The constraint also enforces the invariant that a ULID id cannot be reused across shops (defensive).
  - Evidence: `packages/platform-core/src/repositories/products.prisma.server.ts:36-39`.

- **Q: Is `@@unique([shopId, sku])` required by existing code, or conventional?**
  - A: Conventional only, not code-required. No `ProductsRepository` method uses a `shopId_sku` composite key lookup today. The constraint is good defensive practice (prevents duplicate SKUs per shop) and is consistent with `InventoryItem`'s `@@unique([shopId, sku, variantKey])`, but it is not driven by an existing `findUnique` call. Include it for correctness; note it is not required by current code.
  - Evidence: `packages/platform-core/src/repositories/products.prisma.server.ts` (only `shopId_id` composite used); `packages/platform-core/prisma/schema.prisma:147-165` (InventoryItem reference).

- **Q: Where should Axerve and Stripe credentials live once the refunds endpoint moves to inventory-uploader?**
  - A: Credentials must live in whichever app serves the endpoint — this is derivable. Once refunds move to inventory-uploader, both `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, and `STRIPE_SECRET_KEY` must be present as wrangler secrets in inventory-uploader. During the transition, keep all credentials in caryina until the inventory-uploader refunds route is deployed and verified. The caryina admin panel must not be deleted before the new refunds route is smoke-tested.
  - Evidence: `apps/caryina/src/app/admin/api/refunds/route.ts:108-116` (Axerve credentials check); `apps/caryina/src/lib/payments/stripeRefund.server.ts` (Stripe path); `apps/inventory-uploader/wrangler.toml` (DATABASE_URL pattern for wrangler secrets).

- **Q: What should happen to the `CARYINA_INVENTORY_BACKEND = "json"` constant?**
  - A: Delete it. The constant is documentation only — it has no runtime effect on `repoResolver`. Once `DB_MODE=prisma` is set in caryina's deployment, the resolver uses Prisma regardless of this constant.
  - Evidence: `apps/caryina/src/lib/inventoryBackend.ts:1`; `repoResolver.ts` does not import it.

### Open (Operator Input Required)

- **Q: Should the refunds endpoint transition to inventory-uploader happen in the same delivery as the admin panel deletion, or as a separate subsequent delivery?**
  - Why operator input is required: Both approaches are technically valid. The in-same-delivery option ships everything at once but increases task scope and requires testing the refunds route before the admin panel can be removed. The separate-delivery option removes the admin panel first (keeping a minimal refunds-only caryina endpoint) and ports refunds as a follow-up.
  - Decision impacted: Task 9 sequencing and whether the admin panel deletion is blocked on a working refunds endpoint in inventory-uploader.
  - Decision owner: operator
  - Default assumption: Refunds endpoint is ported in the same delivery (task 5) before the admin panel is deleted (task 9). Credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) are added to inventory-uploader wrangler secrets before task 9 runs. Caryina retains its credentials until the new endpoint is smoke-tested.

## Confidence Inputs

- **Implementation:** 88%
  - Evidence: Prisma model shape is fully derivable from `ProductPublication` type + `InventoryItem` reference. API route pattern is established and repeated 5+ times in inventory-uploader. JSON→Prisma port is mechanical. Data migration has 3 products and 4 rows.
  - To reach 90%: Confirm that `prisma.product` delegate availability is testable in the existing integration test setup.

- **Approach:** 92%
  - Evidence: Option A is already chosen by operator. Connectivity confirmed via inventory-uploader prod usage. Schema is additive. Rollback path is clear (remove `DB_MODE` env var).
  - To reach 95%: Run `pnpm typecheck` for inventory-uploader to confirm no latent type errors before adding routes.

- **Impact:** 95%
  - Evidence: Caryina storefront product reads are silently returning `[]` on Workers today (fs catch block). Fixing this is a hard requirement for the shop to function. All shops gain product management capability.
  - To reach 98%: Verify with a live caryina storefront request that products are indeed empty today.

- **Delivery-Readiness:** 85%
  - Evidence: All code patterns are established. One open question (refunds transition timing) does not block the technical build — only the cleanup order for the admin panel deletion.
  - To reach 90%: Operator confirms whether refunds porting is in-scope for this delivery (default: yes, same delivery) and confirms all three payment credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) are available for inventory-uploader before task 9 runs.

- **Testability:** 80%
  - Evidence: Prisma can be mocked in unit tests; route handlers are simple request/response. Data migration is a script with verifiable output.
  - To reach 90%: Confirm Jest config for platform-core supports Prisma client mocking (check `jest.setup.ts`).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Data migration runs after `DB_MODE=prisma` is deployed — storefront temporarily returns empty products | Medium | High | Enforce migration-first ordering in plan: migration script runs and is verified before caryina env vars are changed |
| `Product` model schema migration fails on production DB | Low | High | Schema change is additive only (new table). Run `prisma migrate deploy` against staging first. |
| `@@unique([shopId, id])` constraint rejected if ULID ids happen to repeat across shops | Very low | Medium | ULIDs are globally unique by construction; risk is theoretical |
| Refunds endpoint broken during transition if Axerve or Stripe credentials aren't added to inventory-uploader before caryina admin is deleted | Medium | High | Keep refunds in caryina until fully ported and tested; add `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, and `STRIPE_SECRET_KEY` to inventory-uploader wrangler secrets before task 9 runs |
| `prisma.product` delegate missing check (`if (!db.product)`) silently falls back to JSON if model not generated | Medium | Medium | After migration, run `prisma generate` before deploying to ensure client is up to date |
| caryina storefront pages import `readRepo` — if `DB_MODE=prisma` set before migration, pages return empty | Medium | High | Migration-first ordering in deployment runbook |

## Planning Constraints & Notes

- Must-follow patterns:
  - All new inventory-uploader routes: `export const runtime = "nodejs"`, Zod validation, `apiError()` on catch, `{ params: Promise<{ shop: string }> }`.
  - Product Prisma model: Json columns for `title`, `description`, `media`; `@id` for ULID `id`; `@@unique([shopId, sku])` (conventional — prevents duplicate SKUs per shop, consistent with `InventoryItem` shape) and `@@unique([shopId, id])` (code-required — `products.prisma.server.ts:36` uses `shopId_id` composite); `@@index([shopId])`.
  - `row_version`: increment by 1 on every `update` — match JSON implementation semantics.
  - `duplicate`: generate new ULID for the copy, suffix `-copy` on SKU, reset `status: "draft"`, reset `row_version: 1`.

- Rollout/rollback expectations:
  - **Order is critical:** (1) Schema migration, (2) `prisma generate`, (3) data migration script, (4) deploy caryina with `DB_MODE=prisma` + `DATABASE_URL`, (5) delete admin panel.
  - Rollback: remove `DB_MODE` from caryina vars → reverts to JSON path (silent failures return, same as current state — acceptable short-term).

- Observability expectations:
  - Product create/update/delete routes: `console.info` with `shopId`, `productId/sku`, action type.
  - Data migration script: emit row counts before and after; fail loudly if count mismatch.

## Suggested Task Seeds (Non-binding)

1. `IMPLEMENT` — Add `Product` model to `schema.prisma` + Prisma migration
2. `IMPLEMENT` — Complete `prismaProductsRepository`: `write`, `update`, `delete`, `duplicate`
3. `IMPLEMENT` — Add product CRUD API routes to inventory-uploader
4. `IMPLEMENT` — Add Products tab UI to `InventoryConsole`
5. `IMPLEMENT` — Move refunds endpoint to inventory-uploader (`/api/inventory/[shop]/refunds`)
6. `IMPLEMENT` — Promote product Zod schemas to `apps/inventory-uploader/src/lib/productSchemas.ts`
7. `IMPLEMENT` — Wire caryina wrangler.toml: `DATABASE_URL` secret + `DB_MODE=prisma`
8. `IMPLEMENT` — Data migration script: 3 products + 4 inventory rows → PostgreSQL
9. `IMPLEMENT` — Delete caryina admin panel, proxy.ts, adminAuth.ts, inventoryBackend.ts constant

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (via `lp-do-plan` → `lp-do-build` chain)
- Supporting skills: none
- Deliverable acceptance package:
  - caryina storefront product page loads at least 1 product from PostgreSQL (not empty array)
  - inventory-uploader Products tab creates and edits a product successfully
  - All caryina admin panel files deleted
  - `pnpm typecheck` passes for caryina and inventory-uploader
- Post-delivery measurement plan:
  - Verify caryina storefront product count > 0 after migration
  - Confirm refunds route accessible in inventory-uploader with valid admin session

## Evidence Gap Review

### Gaps Addressed

- **Prisma Workers connectivity:** Confirmed via inventory-uploader prod usage of `DATABASE_URL` and Prisma audit events.
- **Auth for new product routes:** Confirmed auto-protected by existing middleware matcher — no new auth code needed.
- **`@@unique([shopId, id])` requirement:** Confirmed from existing `products.prisma.server.ts:36` which pre-empts the model shape.
- **Refunds endpoint home:** Resolved — inventory-uploader is the right destination.

### Confidence Adjustments

- Implementation confidence raised from initial estimate (~75%) to 88% after confirming the full JSON implementation as a direct port target and the established route pattern.
- Rollout/rollback confidence is moderate (85%) due to the migration-ordering risk — mitigated by the explicit ordered task sequence in the plan.

### Remaining Assumptions

- PostgreSQL `DATABASE_URL` for caryina will use the same value as inventory-uploader (same cluster). Unverified but strongly implied by platform architecture.
- `prisma generate` is run as part of the CI/deployment pipeline for caryina — currently not confirmed, but is standard for Prisma-using apps.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Prisma Product model design | Yes | None | No |
| prismaProductsRepository write/update/delete/duplicate | Yes | [Missing precondition, Minor]: `prisma generate` must be run after model is added before Prisma client recognizes the model — not a build blocker, but deployment runbook must include it | No (noted in planning constraints) |
| Inventory-uploader API routes | Yes | None — route pattern fully established | No |
| Inventory-uploader Products UI | Yes | None — tab pattern directly portable | No |
| Zod schema promotion (adminSchemas.ts) | Yes | None — schemas are self-contained, no caryina-specific imports | No |
| caryina wrangler.toml env vars | Yes | [Ordering inversion, Moderate]: if `DB_MODE=prisma` is deployed before data migration runs, storefront returns empty products. Explicit ordering in plan mitigates. | No (explicitly sequenced in task seeds) |
| Data migration (3 products + 4 inventory rows) | Yes | None — InventoryItem model already supports caryina rows; Product model addition covers products | No |
| Refunds endpoint relocation | Partial | [Missing precondition, Moderate]: Axerve AND Stripe credentials must be available in inventory-uploader before caryina admin is deleted. Both providers are used by the refunds endpoint. Open question raised. | No (operator to confirm delivery scoping — noted as Open) |
| Admin panel deletion | Yes | None — full file list established; tests identified for deletion | No |

## Scope Signal

**Signal:** right-sized

**Rationale:** The scope covers exactly what is needed: schema, repository, API, UI, config, migration, and cleanup. Each step has a concrete implementation path from established patterns. The one open question (Axerve secrets location) does not block the technical build — only the final cleanup step. No unbounded research is required.

## Analysis Readiness

- **Status:** Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis inventory-uploader-product-management`
