---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-runtime-state-workers-compat
Dispatch-ID: IDEA-DISPATCH-20260314160002-PLAT-012
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/caryina-runtime-state-workers-compat/analysis.md
---

# Caryina Runtime State Workers Compatibility Plan

## Summary

Caryina's checkout flow crashes on Cloudflare Workers because two state stores depend on the Node.js filesystem: the checkout idempotency store (`checkoutIdempotency.server.ts`) throws `EROFS` on every checkout attempt, and the `MemoryCartStore` default loses cart state between isolate instances. This plan migrates both stores to Prisma/Neon — the database already active for Caryina inventory, products, and orders — by adding two new schema models, implementing `PrismaCartStore` in `platform-core`, rewriting the idempotency store functions to use Prisma, extending the `CART_STORE_PROVIDER` Zod enum to accept `"prisma"`, and activating the new stores via `wrangler.toml`. The `runtime = "nodejs"` overrides on checkout routes are explicitly descoped — removing them would require verifying the `sendSystemEmail` → `createRequire` dependency chain separately.

## Active tasks
- [x] TASK-01: Extend `storeProviderSchema` enum to include `"prisma"`
- [x] TASK-02: Add `CheckoutAttempt` and `Cart` Prisma models + migration
- [x] TASK-03: Implement `PrismaCartStore` in `platform-core`
- [x] TASK-04: Add `prisma` case to `createCartStore()` factory + update `wrangler.toml`
- [x] TASK-05: Rewrite `checkoutIdempotency.server.ts` using Prisma
- [x] TASK-06: Unit tests for `PrismaCartStore`
- [x] TASK-07: Unit tests for Prisma idempotency store
- [x] TASK-08: CHECKPOINT — typecheck, lint, and integration review

## Goals
- Eliminate all `node:fs` calls from both checkout state stores.
- Migrate cart backend to `PrismaCartStore` (Workers-compatible, durable across isolates).
- Migrate idempotency store to Prisma with equivalent atomicity semantics (unique constraint + P2002 catch replaces file lock).
- All existing caller code in `checkoutSession.server.ts`, `stripeCheckout.server.ts`, and `checkoutReconciliation.server.ts` remains unchanged.
- Deployed Worker can complete a Caryina checkout end-to-end without a runtime exception.

## Non-goals
- Removing `export const runtime = "nodejs"` from checkout routes (descoped — email path depends on `createRequire`).
- Adding Workers-compatible backends to any shop other than Caryina.
- Changing the `CartStore` interface.
- Migrating data from `checkout-idempotency.json` (no production records exist; Worker has never succeeded).
- Replacing the Upstash Redis or Durable Object cart backends.
- Adding a background cart TTL cleanup job (deferred follow-up).

## Constraints & Assumptions
- Constraints:
  - Prisma/Neon is already active for Caryina. `DATABASE_URL` Worker secret is configured.
  - Schema additions go to `packages/platform-core/prisma/schema.prisma`; migrations checked in to `packages/platform-core/prisma/migrations/` as timestamped files.
  - `MemoryCartStore`, `RedisCartStore`, `CloudflareDurableObjectCartStore` must continue working.
  - `storeProviderSchema` Zod enum must be extended before `CART_STORE_PROVIDER=prisma` is added to `wrangler.toml` — otherwise env parse fails at startup.
  - Tests run CI-only. Never run Jest locally.
  - No failing test stubs in planning mode.
  - `PrismaCheckoutIdempotencyStore` must use the existing platform-core Prisma client singleton (same client used by inventory, orders).
- Assumptions:
  - No production idempotency records exist in `checkout-idempotency.json` (Worker has never succeeded — schema-only migration is sufficient).
  - Cart data loss during migration is acceptable (`MemoryCartStore` already offers zero persistence).
  - `DATABASE_URL` is present in Caryina's Worker secrets (confirmed by existing inventory/products usage).

## Inherited Outcome Contract

- **Why:** Two pieces of Caryina checkout state use the file system for storage, which is incompatible with Cloudflare Workers. Every checkout attempt currently throws on the idempotency store, and cart state is lost between requests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both the checkout idempotency store and the cart backend are migrated to Workers-compatible Prisma/Neon storage; no fs calls remain in either checkout path; deployed Worker can complete a checkout end-to-end without a runtime exception.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/caryina-runtime-state-workers-compat/analysis.md`
- Selected approach inherited:
  - Prisma/Neon for both stores (single unified approach).
  - Two new Prisma models: `CheckoutAttempt` and `Cart` (additive migration).
  - `PrismaCartStore` in `packages/platform-core/src/cartStore/prismaStore.ts`.
  - `PrismaCheckoutIdempotencyStore` replaces all 9 async I/O functions in `checkoutIdempotency.server.ts`.
  - `CART_STORE_PROVIDER=prisma` activates the new cart backend in `wrangler.toml`.
- Key reasoning used:
  - Prisma/Neon already active — no new infrastructure, no new bindings, consistent access control alongside `Order` table.
  - ACID transactions via Prisma (`@@unique` + P2002 catch, `prisma.$transaction`) provide equivalent mutual exclusion to the file lock without fs dependency.
  - KV eliminated (eventually consistent — double-charge window). DO viable but adds deployment complexity for no material gain at boutique volume. Redis adds new infrastructure.

## Selected Approach Summary
- What was chosen:
  - Replace `node:fs`-based idempotency store with Prisma CRUD on a new `CheckoutAttempt` table.
  - Replace `MemoryCartStore` with `PrismaCartStore` backed by a new `Cart` table.
- Why planning is not reopening option selection:
  - Analysis concluded decisively. All alternatives compared with explicit elimination rationale. No unresolved operator forks.

## Fact-Find Support
- Supporting brief: `docs/plans/caryina-runtime-state-workers-compat/fact-find.md`
- Evidence carried forward:
  - `wrangler.toml` has `DB_MODE=prisma`, `INVENTORY_BACKEND=prisma`, no KV/DO bindings.
  - `checkoutIdempotency.server.ts`: 10 exports, 9 async I/O functions (6 via `withStoreLock`, 3 read-only via `readStore`), 1 pure function (`buildCheckoutRequestHash` — unchanged).
  - `storeProviderSchema` Zod enum: `["redis", "cloudflare", "memory"]` — must add `"prisma"`.
  - Prisma migrations directory at `packages/platform-core/prisma/migrations/` with 5 existing files.
  - 3 routes have `runtime = "nodejs"` overrides — all descoped from this migration.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend `storeProviderSchema` enum | 95% | S | Complete (2026-03-14) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Add Prisma models + migration | 90% | M | Complete (2026-03-14) | - | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Implement `PrismaCartStore` | 88% | M | Complete (2026-03-14) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add factory case + update `wrangler.toml` | 92% | S | Complete (2026-03-14) | TASK-01, TASK-03 | TASK-08 |
| TASK-05 | IMPLEMENT | Rewrite idempotency store using Prisma | 82% | L | Complete (2026-03-14) | TASK-02 | TASK-08 |
| TASK-06 | IMPLEMENT | Unit tests for `PrismaCartStore` | 87% | M | Complete (2026-03-14) | TASK-03 | TASK-08 |
| TASK-07 | IMPLEMENT | Unit tests for Prisma idempotency store | 83% | M | Complete (2026-03-14) | TASK-05 | TASK-08 |
| TASK-08 | CHECKPOINT | Typecheck, lint, integration review | - | S | Complete (2026-03-14) | TASK-04, TASK-05, TASK-06, TASK-07 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — pure server-side storage layer swap | - | No UI files changed |
| UX / states | N/A — API response shapes unchanged; customers see no different behaviour | - | Cart reads and checkout responses do not change shape |
| Security / privacy | `buyerEmail` and transaction metadata move from local file to Neon DB; same access control as `Order` table via `DATABASE_URL` secret | TASK-02, TASK-05 | No new PII surface beyond existing `Order` model |
| Logging / observability / audit | Existing `recordMetric` call sites preserved in idempotency store rewrite; Prisma errors logged at `console.error` | TASK-05 | Cart Prisma errors also logged at same severity |
| Testing / validation | Unit tests for both new backends; existing route/reconciliation tests remain valid (both stores are fully mocked in all existing tests) | TASK-06, TASK-07 | No E2E test changes required |
| Data / contracts | Two new Prisma models, additive migration, `storeProviderSchema` enum extended | TASK-01, TASK-02 | `Cart` has no `shopId` — UUID-keyed only; `CheckoutAttempt` has `@@unique([shopId, idempotencyKey])` |
| Performance / reliability | P2002 unique constraint violation caught and mapped to `in_progress`/`conflict` result; `prisma.$transaction` used for `beginStripeCheckoutFinalization`; cart TTL via `expiresAt` checked on read | TASK-05 | ~5-15ms Neon latency per operation; acceptable at boutique volume |
| Rollout / rollback | Additive schema migration applied first; code deploys second; rollback is code revert + optionally drop new tables | TASK-02 | No feature flag needed; `MemoryCartStore` and fs-based code still available on rollback |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; TASK-01 touches config only, TASK-02 touches schema/migration only |
| 2 | TASK-03, TASK-05 | TASK-02 complete | TASK-03 builds `PrismaCartStore`; TASK-05 rewrites idempotency store. Both depend on schema models from TASK-02 but are otherwise independent |
| 3 | TASK-04, TASK-06, TASK-07 | TASK-01+TASK-03 for TASK-04; TASK-03 for TASK-06; TASK-05 for TASK-07 | TASK-04 activates the new cart store; TASK-06/07 add unit tests |
| 4 | TASK-08 | TASK-04, TASK-05, TASK-06, TASK-07 | CHECKPOINT — typecheck, lint, CI gate review |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Cart CRUD (`/api/cart`) | User adds/removes item in storefront | 1. Request hits `createShopCartApi` → 2. `createCartStore()` reads `CART_STORE_PROVIDER=prisma` → routes to `PrismaCartStore` → 3. `incrementQty`/`setQty`/`removeItem` → Prisma `upsert` on `Cart` row keyed by UUID → 4. `expiresAt` set to now + 30 days on write → 5. Cart row persists in Neon DB across isolate recycles | TASK-01, TASK-02, TASK-03, TASK-04 | Rollback: revert `wrangler.toml` `CART_STORE_PROVIDER` var; existing `MemoryCartStore` resumes |
| Cart read at checkout | Customer submits checkout form | 1. `handleCheckoutSessionRequest` calls `getCart(cartId)` → 2. `PrismaCartStore.getCart` → 3. Prisma `findUnique` on `Cart.id` → 4. Checks `expiresAt`; returns `{}` if expired → 5. Returns `CartState` to checkout handler | TASK-02, TASK-03, TASK-04 | No fallback to memory if `DATABASE_URL` missing; `db.ts` returns `missingPrismaClient()` proxy which throws — dev must have `DATABASE_URL` or must not set `CART_STORE_PROVIDER` |
| Checkout idempotency gate | Every checkout POST | 1. `beginCheckoutAttempt` → 2. `prisma.checkoutAttempt.create` with `@@unique([shopId, idempotencyKey])` → 3. On P2002 (concurrent duplicate): re-read record → return `{ kind: "in_progress", record }` (if status in_progress/finalizing), `{ kind: "conflict", record }` (if hash differs), or `{ kind: "replay", record, responseStatus, responseBody }` (if terminal with responseBody) → 4. On success: return `{ kind: "acquired", record }` | TASK-02, TASK-05 | P2002 must be caught explicitly; missed catch = 500 instead of idempotency response |
| Checkout idempotency updates | Mid-checkout state transitions | 1. `markCheckoutAttemptReservation` / `recordCheckoutAttemptStripeSession` / `markCheckoutAttemptPaymentAttempted` / `markCheckoutAttemptResult` → 2. `prisma.checkoutAttempt.update` filtering by `idempotencyKey + shopId` → 3. Individual field updates (no lock needed — record exists; atomic field writes) | TASK-05 | Missing record: log warning and return silently (matching current fs behaviour) |
| Stripe finalization locking | `checkout.session.completed` webhook | 1. `beginStripeCheckoutFinalization` → 2. `prisma.$transaction` with interactive transaction → 3. SELECT record by `stripeSessionId` → 4. Check current status → 5. If `"in_progress"`: UPDATE `status = "finalizing"` → return `acquired` → 6. If `"finalizing"`: return `busy` → 7. If terminal status: return `already_finalized` → 8. If not found: return `no_match` | TASK-05 | `prisma.$transaction` adds one extra round-trip vs. single query; acceptable for webhook path |
| Stale checkout reconciliation | Cron POST `/api/cron/checkout-reconciliation` | 1. `reconcileStaleCheckoutAttempts` → 2. `listStaleInProgressCheckoutAttempts` → 3. `prisma.checkoutAttempt.findMany` where `status IN ("in_progress", "finalizing") AND updatedAt < staleCutoff` → 4. Mark stale records via `markCheckoutAttemptResult` → Prisma `update` | TASK-05 | `runtime = "nodejs"` on cron route NOT removed in this migration — route still compatible with Workers via `nodejs_compat` flag |

## Tasks

### TASK-01: Extend `storeProviderSchema` enum to include `"prisma"`
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `packages/config/src/env/auth.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/config/src/env/auth.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — single line change to a Zod enum; exact location confirmed (`const storeProviderSchema = z.enum(["redis", "cloudflare", "memory"])` at line 95).
  - Approach: 98% — Zod enum extension is the canonical pattern; no alternative exists.
  - Impact: 95% — without this, `CART_STORE_PROVIDER=prisma` in `wrangler.toml` causes env parse failure and app refuses to start.
- **Acceptance:**
  - `storeProviderSchema` accepts `"prisma"` as a valid value.
  - `z.enum(["redis", "cloudflare", "memory"])` becomes `z.enum(["redis", "cloudflare", "memory", "prisma"])`.
  - All other enum values remain valid (no regression for existing shops or tests).
  - `pnpm typecheck && pnpm lint` pass.
- **Engineering Coverage:**
  - UI / visual: N/A — config-only change
  - UX / states: N/A — config-only change
  - Security / privacy: N/A — enum extension does not change access control
  - Logging / observability / audit: N/A — no log change
  - Testing / validation: Required — existing tests parsing `CART_STORE_PROVIDER` must still pass; new value accepted by schema.
  - Data / contracts: Required — Zod schema is the canonical contract for env var values; extend precisely.
  - Performance / reliability: N/A — enum parse is compile-time
  - Rollout / rollback: N/A — additive enum value; rollback is code revert
- **Validation contract (TC-XX):**
  - TC-01: Parse `CART_STORE_PROVIDER = "prisma"` through `storeProviderSchema` → accepted (no Zod error)
  - TC-02: Parse `CART_STORE_PROVIDER = "redis"` → still accepted (no regression)
  - TC-03: Parse `CART_STORE_PROVIDER = "invalid"` → Zod parse error (schema still rejects unknowns)
  - TC-04: `pnpm typecheck` in `packages/config` passes
- **Execution plan:** Open `packages/config/src/env/auth.ts`, find `storeProviderSchema` definition, add `"prisma"` to the enum array. No other changes.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: exact file and line confirmed in fact-find and analysis.
- **Edge Cases & Hardening:** No edge cases — single enum extension. Other packages that import `storeProviderSchema` type will get the updated union automatically via TypeScript.
- **What would make this >=90%:** Already 95%. Only uncertainty is unread test that might explicitly snapshot the enum shape — unlikely given test patterns observed.
- **Rollout / rollback:**
  - Rollout: Lands in the same deploy as the rest of the migration. Can land independently ahead of `wrangler.toml` var change without risk.
  - Rollback: Revert the enum addition; any `CART_STORE_PROVIDER=prisma` config must be removed in the same rollback.
- **Documentation impact:** None: internal config contract.
- **Notes / references:** `packages/config/src/env/auth.ts` line 95. Consumer: `packages/platform-core/src/cartStore.ts` calls `loadCoreEnv()` which parses this env var.

---

### TASK-02: Add `CheckoutAttempt` and `Cart` Prisma models + migration file
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `packages/platform-core/prisma/schema.prisma` + new migration file in `packages/platform-core/prisma/migrations/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/platform-core/prisma/schema.prisma`, `packages/platform-core/prisma/migrations/<timestamp>_add_checkout_attempt_and_cart/migration.sql`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — schema additions are additive and follow confirmed existing patterns (`StripeWebhookEvent`, `Order`); migration file format confirmed from 5 existing examples.
  - Approach: 95% — additive schema is the only safe option for a live DB.
  - Impact: 88% — migration must be applied before code deploy; ordering constraint is clear.
- **Acceptance:**
  - `CheckoutAttempt` model added with: `id String @id @default(cuid())`, `shopId String`, `idempotencyKey String`, `requestHash String`, `status String`, `acceptedLegalTerms Boolean?`, `acceptedLegalTermsAt String?`, `provider String?`, `holdId String?`, `cartId String?`, `lang String?`, `buyerName String?`, `buyerEmail String?`, `paymentAttemptedAt DateTime?`, `shopTransactionId String?`, `stripeSessionId String?`, `stripeSessionExpiresAt DateTime?`, `stripePaymentIntentId String?`, `responseStatus Int?`, `responseBody Json?`, `errorCode String?`, `errorMessage String?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `@@unique([shopId, idempotencyKey])`, `@@index([shopId])`, `@@index([stripeSessionId])`, `@@index([shopTransactionId])`, `@@index([status, updatedAt])`.
  - `Cart` model added with: `id String @id`, `data Json`, `expiresAt DateTime`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `@@index([expiresAt])`. No `shopId` field — carts are globally unique by UUID.
  - Migration SQL is additive-only (`CREATE TABLE` statements; no `DROP` or `ALTER TABLE DROP COLUMN`).
  - Migration file timestamp follows existing naming convention.
  - `npx prisma validate` passes on the updated schema.
  - `pnpm typecheck` passes after Prisma client regeneration.
- **Engineering Coverage:**
  - UI / visual: N/A — schema-only change
  - UX / states: N/A — schema-only change
  - Security / privacy: Required — `buyerEmail` in `CheckoutAttempt` table (no `cardNumberHash` — not in `CheckoutAttemptRecord` interface). Same access control as `Order` table (access via `DATABASE_URL` secret). No RLS required beyond existing practice; note in migration review.
  - Logging / observability / audit: N/A — no application log change in this task
  - Testing / validation: Required — Prisma client re-generated after schema change; type compatibility checked via `pnpm typecheck`.
  - Data / contracts: Required — `CheckoutAttemptRecord` interface fields must map 1:1 to model columns; `Cart` model JSON column holds `CartState`; `@@unique` on `CheckoutAttempt` is the atomicity guarantee; no `shopId` on `Cart` model.
  - Performance / reliability: Required — `@@index([status, updatedAt])` on `CheckoutAttempt` for stale-scan query; `@@index([expiresAt])` on `Cart` for future cleanup; `@@unique([shopId, idempotencyKey])` ensures single-write atomicity.
  - Rollout / rollback: Required — migration applied before code deploy; additive-only; rollback is table drop (safe since no production records exist).
- **Validation contract (TC-XX):**
  - TC-01: `npx prisma validate --schema packages/platform-core/prisma/schema.prisma` exits 0
  - TC-02: Migration SQL contains `CREATE TABLE "CheckoutAttempt"` and `CREATE TABLE "Cart"` — no `DROP` statements
  - TC-03: `@@unique([shopId, idempotencyKey])` constraint present in migration SQL as `CREATE UNIQUE INDEX`
  - TC-04: `Cart` model has no `shopId` column in migration SQL
  - TC-05: `pnpm typecheck` passes after running `npx prisma generate`
  - TC-06: Existing model types (`Order`, `StripeWebhookEvent`) unaffected — no regressions
- **Execution plan:** Add `CheckoutAttempt` model to schema with all required fields and indexes. Add `Cart` model with `id`, `data`, `expiresAt`, `createdAt`, `updatedAt`, and index on `expiresAt`. Run `npx prisma migrate dev --name add_checkout_attempt_and_cart --schema packages/platform-core/prisma/schema.prisma` (creates migration file). Commit both schema change and migration file. Run `npx prisma generate` to regenerate client types.
- **Planning validation (required for M/L):**
  - Checks run: Schema for `CheckoutAttemptRecord` interface reviewed — 15 typed fields confirmed; all map to nullable-where-appropriate Prisma fields. `Cart` model reviewed against `CartStore` interface — no `shopId` in interface.
  - Validation artifacts: `fact-find.md` section "Prisma Schema Gaps"; `analysis.md` Planning Handoff section.
  - Unexpected findings: None.
- **Scouts:** None: all field mappings confirmed during fact-find investigation.
- **Edge Cases & Hardening:** Migration must be additive-only. `Cart.id` is `String @id` (no `@default`) — UUID provided by caller at `createCart()` time, same as `MemoryCartStore` pattern. `CheckoutAttempt.id` uses `@default(cuid())` for generated IDs.
- **What would make this >=90%:** Already 90%. Remaining uncertainty: exact SQL emitted by Prisma for the `@@unique` constraint on Neon — functionally a standard PostgreSQL unique index, no platform-specific risk.
- **Rollout / rollback:**
  - Rollout: Apply migration to Neon before code deploy. Migration is additive — applying it to a live DB with no checkout traffic is safe.
  - Rollback: `DROP TABLE "CheckoutAttempt"` and `DROP TABLE "Cart"` if rollback required. No existing data to lose (no production records).
- **Documentation impact:** None: internal schema addition.
- **Notes / references:** `packages/platform-core/prisma/schema.prisma` — current models: `InventoryItem`, `Order`, `StripeWebhookEvent`, `Product`, `ShopSettings`. Migration files at `packages/platform-core/prisma/migrations/`.

---

### TASK-03: Implement `PrismaCartStore` in `platform-core`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new file `packages/platform-core/src/cartStore/prismaStore.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/platform-core/src/cartStore/prismaStore.ts` (new), `[readonly] packages/platform-core/src/cartStore.ts` (factory updated in TASK-04)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 88%
  - Implementation: 88% — `CartStore` interface has 7 methods with clear signatures; Prisma query patterns are confirmed from existing usage in orders/inventory.
  - Approach: 93% — implementing `CartStore` interface is the only pattern; no design fork.
  - Impact: 85% — `PrismaCartStore` is consumed by `createCartStore()` factory (TASK-04) and tested in TASK-06.
- **Acceptance:**
  - `PrismaCartStore` class implements all 7 `CartStore` interface methods: `createCart`, `getCart`, `setCart`, `deleteCart`, `incrementQty`, `setQty`, `removeItem`.
  - `getCart`: queries `prisma.cart.findUnique({ where: { id: cartId } })`; checks `expiresAt < now()` → returns `{}` (empty CartState) if expired or not found; returns `data as CartState` if valid.
  - `createCart`: `prisma.cart.create` with `id = cartId`, `data = {}`, `expiresAt = now() + 30 days`.
  - `setCart`: `prisma.cart.upsert` with `data = cartState`, refreshes `expiresAt`.
  - `deleteCart`: `prisma.cart.delete` where `id = cartId`; no-op (swallow error) if not found.
  - `incrementQty`, `setQty`, `removeItem`: read-modify-write via `getCart` + `setCart` (consistent with in-memory pattern; no need for field-level DB update given `data Json` column design).
  - No `shopId` parameter in any method — consistent with `CartStore` interface.
  - Uses the platform-core Prisma client singleton (`getPrismaClient()` from `db.ts` or equivalent import).
  - File annotated with `"use server"` / `server-only` import consistent with other server-only modules.
  - `pnpm typecheck` passes.
- **Engineering Coverage:**
  - UI / visual: N/A — server-side module only
  - UX / states: Required — `getCart` returns `{}` (not `null`) for expired or missing cart (consistent with `MemoryCartStore` behaviour on cache miss); `deleteCart` is a no-op if record not found.
  - Security / privacy: N/A — `Cart.data` contains only product IDs and quantities; no PII.
  - Logging / observability / audit: Required — Prisma errors in cart operations logged at `console.error` (same severity as existing idempotency fs errors).
  - Testing / validation: Required — covered by TASK-06 unit tests.
  - Data / contracts: Required — `CartState` type stored as `Json` column; read back as `CartState` (cast); `expiresAt` TTL enforced on read.
  - Performance / reliability: Required — read-modify-write for `incrementQty`/`setQty`/`removeItem` adds 2 DB round-trips per mutation; acceptable at boutique volume. Concurrent add-to-cart from same session: last-write-wins (acceptable; same as MemoryCartStore).
  - Rollout / rollback: N/A — new file; rollback is factory case removal (TASK-04).
- **Validation contract (TC-XX):**
  - TC-01: `createCart(cartId)` → creates `Cart` row in DB with `expiresAt = now + 30 days`
  - TC-02: `getCart(cartId)` on existing, non-expired cart → returns `CartState`
  - TC-03: `getCart(cartId)` on expired cart → returns `{}`
  - TC-04: `getCart(cartId)` on non-existent cart → returns `{}`
  - TC-05: `incrementQty(cartId, slug, 1)` on existing cart → item added with qty 1
  - TC-06: `incrementQty(cartId, slug, 1)` on non-existent cart → creates cart + item
  - TC-07: `removeItem(cartId, slug)` → item removed from cart state
  - TC-08: `deleteCart(cartId)` on existing cart → row deleted
  - TC-09: `deleteCart(cartId)` on non-existent cart → no error (no-op)
  - TC-10: `pnpm typecheck` in `packages/platform-core` passes
- **Execution plan:** Create `packages/platform-core/src/cartStore/prismaStore.ts`. Import Prisma client. Implement `PrismaCartStore implements CartStore`. Methods use Prisma queries on the `Cart` model from TASK-02. `incrementQty`/`setQty`/`removeItem` use read-modify-write (`getCart` + `setCart`). Export `PrismaCartStore` class.
- **Planning validation (required for M/L):**
  - Checks run: `CartStore` interface reviewed — 7 methods, all clear signatures. `MemoryCartStore` implementation reviewed as reference for expected behaviour on edge cases (missing cart, expired cart).
  - Validation artifacts: `fact-find.md` section on cart store abstraction.
  - Unexpected findings: `CartStore.createCart` is called explicitly before first write in `cartApiForShop.ts` (not auto-created on first `incrementQty`). `PrismaCartStore.incrementQty` must handle the case where no `Cart` row exists yet (upsert or createCart-then-update).
- **Scouts:** Consumer tracing: `PrismaCartStore` is consumed by `createCartStore()` factory (TASK-04). `createCartStore()` is called once per request in `cartApiForShop.ts`. No other consumers of the instance.
- **Edge Cases & Hardening:** `deleteCart` must swallow `RecordNotFound` (Prisma P2025) — checkout success always calls `deleteCart` even when cart may already be expired/deleted. `getCart` on expired record: delete the stale record and return `{}` (lazy cleanup). `incrementQty` on non-existent cart: call `createCart` first, then increment (matches existing API contract in `cartApiForShop.ts`).
- **What would make this >=90%:** Integration test (E2E against actual DB). Descoped — unit tests with Prisma mock are sufficient per testing policy.
- **Rollout / rollback:**
  - Rollout: New file; no live code routes to it until TASK-04 adds the factory case and `wrangler.toml` sets `CART_STORE_PROVIDER=prisma`.
  - Rollback: Remove factory case in TASK-04 and revert `wrangler.toml` var.
- **Documentation impact:** None: internal implementation.
- **Notes / references:** `packages/platform-core/src/cartStore.ts` — `CartStore` interface, `MemoryCartStore` as reference implementation, `createCartStore()` factory.

---

### TASK-04: Add `"prisma"` case to `createCartStore()` factory + set `CART_STORE_PROVIDER=prisma` in `wrangler.toml`
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `packages/platform-core/src/cartStore.ts` + `apps/caryina/wrangler.toml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/platform-core/src/cartStore.ts`, `apps/caryina/wrangler.toml`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-08
- **Confidence:** 92%
  - Implementation: 92% — factory switch statement pattern confirmed; adding one case. `wrangler.toml` var syntax confirmed.
  - Approach: 95% — single case addition is the only correct approach.
  - Impact: 92% — this task activates `PrismaCartStore` for Caryina. TASK-01 must ship first (enum extension) or simultaneously.
- **Acceptance:**
  - `createCartStore()` has a `case "prisma":` that returns `new PrismaCartStore()`.
  - `CartStoreOptions.backend` type (or equivalent) updated to include `"prisma"` if typed explicitly.
  - `apps/caryina/wrangler.toml` has `CART_STORE_PROVIDER = "prisma"` under `[vars]`.
  - `pnpm typecheck` passes.
  - Existing tests that mock `createCartStore` are unaffected (mock bypasses factory).
- **Engineering Coverage:**
  - UI / visual: N/A — server config change only
  - UX / states: N/A — factory routing is transparent to callers
  - Security / privacy: N/A — no data access change in this task
  - Logging / observability / audit: N/A — no log change
  - Testing / validation: Required — existing tests must pass unchanged; factory switch must not break default case or other backends.
  - Data / contracts: Required — `CartStoreOptions.backend` union type updated if needed; `CART_STORE_PROVIDER` env var validated against extended enum (TASK-01 prerequisite).
  - Performance / reliability: N/A — routing is compile-time
  - Rollout / rollback: Required — `CART_STORE_PROVIDER=prisma` in `wrangler.toml` is the activation gate. Removing the var restores `MemoryCartStore` default.
- **Validation contract (TC-XX):**
  - TC-01: `createCartStore({ backend: "prisma" })` → returns `PrismaCartStore` instance
  - TC-02: `createCartStore({ backend: "memory" })` → still returns `MemoryCartStore` (no regression)
  - TC-03: `createCartStore({ backend: "redis" })` → still returns `RedisCartStore` (no regression)
  - TC-04: `pnpm typecheck` in `packages/platform-core` passes
  - TC-05: `CART_STORE_PROVIDER = "prisma"` present in `apps/caryina/wrangler.toml`
- **Execution plan:** In `packages/platform-core/src/cartStore.ts`, import `PrismaCartStore`. Add `case "prisma": return new PrismaCartStore();` to factory. Update any `backend` union type. Add `CART_STORE_PROVIDER = "prisma"` to `[vars]` in `apps/caryina/wrangler.toml`.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Consumer tracing: `createCartStore()` is called in `cartApiForShop.ts` which is used by the cart route and checkout route. Both consumers are unchanged. Factory result is typed as `CartStore` — adding a new implementation doesn't break callers.
- **Edge Cases & Hardening:** `CART_STORE_PROVIDER` being absent in `wrangler.toml` still defaults to `MemoryCartStore` via the `default:` case — no risk to other shops.
- **What would make this >=90%:** Already 92%.
- **Rollout / rollback:**
  - Rollout: `CART_STORE_PROVIDER=prisma` must land after TASK-01 (enum extension) is deployed; otherwise env parse fails.
  - Rollback: Remove `CART_STORE_PROVIDER = "prisma"` from `wrangler.toml`; factory defaults to `MemoryCartStore`.
- **Documentation impact:** None.
- **Notes / references:** `packages/platform-core/src/cartStore.ts` lines 83-120 (factory implementation confirmed in fact-find).

---

### TASK-05: Rewrite `checkoutIdempotency.server.ts` using Prisma
- **Type:** IMPLEMENT
- **Deliverable:** code-change — full rewrite of `apps/caryina/src/lib/checkoutIdempotency.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/checkoutIdempotency.server.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 82%
  - Implementation: 80% — 9 async functions with complex state machine (5 status values, 4 `BeginCheckoutAttemptResult` variants including `replay`, P2002 handling, `prisma.$transaction` for finalization, `buildCheckoutRequestHash` crypto API compatibility verification required).
  - Approach: 88% — Prisma replace is the chosen approach; P2002 and `$transaction` patterns are standard Prisma.
  - Impact: 80% — all 4 caller files must remain unchanged; any signature or return-type drift causes silent failures in production checkout.
- **Acceptance:**
  - File no longer imports `fs`, `path`, `resolveDataRoot` or any `node:fs` / `node:path` API.
  - No `resolveDataRoot()` function exists.
  - No `withStoreLock()` function exists.
  - No `readStore()` / `writeStore()` function exists.
  - All 9 async I/O functions reimplemented using Prisma on the `CheckoutAttempt` model from TASK-02.
  - `buildCheckoutRequestHash` — pure crypto function. Verified during build: `import { createHash } from "crypto"` is Node.js built-in crypto. Under `nodejs_compat` in Cloudflare Workers, `crypto` resolves to Web Crypto (not the Node.js `crypto` module); `createHash` is NOT available on Web Crypto. This function MUST be migrated to use `crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)))` with ArrayBuffer → hex conversion. Otherwise every checkout still crashes after the fs migration.
  - All existing function signatures preserved exactly (same parameters, same return types).
  - `server-only` import retained.
  - **`beginCheckoutAttempt` result variants (all 4 — verified from source):**
    - No existing record → `prisma.checkoutAttempt.create` → returns `{ kind: "acquired", record: CheckoutAttemptRecord }`.
    - On P2002 (concurrent duplicate with same key): re-read → if `requestHash` differs: returns `{ kind: "conflict", record }`. If status is `"in_progress"` or `"finalizing"`: returns `{ kind: "in_progress", record }`. If terminal (any other status): returns `{ kind: "replay", record, responseStatus: record.responseStatus ?? 500, responseBody: record.responseBody ?? { error: "Stored checkout outcome unavailable" } }`.
    - Note: `"replay"` is returned when an existing record has the same `requestHash` AND terminal status — this allows idempotent replay of the previous response.
  - **`beginStripeCheckoutFinalization` result variants (all 4 — verified from source):**
    - Uses `prisma.$transaction` (interactive transaction) to read-then-conditionally-update.
    - If record not found: returns `{ kind: "no_match" }`.
    - If `record.status === "succeeded"`, `"failed"`, or `"needs_review"`: returns `{ kind: "already_finalized", record }`.
    - If `record.status === "finalizing"`: returns `{ kind: "busy", record }`.
    - Otherwise (status `"in_progress"`): sets `status = "finalizing"`, updates `stripePaymentIntentId` if provided → returns `{ kind: "acquired", record }`.
  - **`markCheckoutAttemptResult`** accepts `status: Exclude<CheckoutAttemptStatus, "in_progress">` where `CheckoutAttemptStatus = "in_progress" | "finalizing" | "succeeded" | "failed" | "needs_review"`. Valid non-`in_progress` statuses: `"finalizing"`, `"succeeded"`, `"failed"`, `"needs_review"`. There is no `"complete"` status.
  - **`markCheckoutAttemptReservation`** accepts params object: `{ shopId, idempotencyKey, holdId, shopTransactionId, acceptedLegalTerms, acceptedLegalTermsAt, provider, cartId?, lang?, buyerName?, buyerEmail?, now? }`. Updates record fields accordingly. No `reservedUntil` field.
  - `listStaleInProgressCheckoutAttempts`: `prisma.checkoutAttempt.findMany({ where: { status: { in: ["in_progress", "finalizing"] }, updatedAt: { lt: staleCutoff } } })`.
  - Existing `recordMetric` call sites preserved.
  - `pnpm typecheck` passes.
- **Engineering Coverage:**
  - UI / visual: N/A — server-only module
  - UX / states: Required — all 4 `BeginCheckoutAttemptResult` variants produced correctly (`acquired`, `replay`, `in_progress`, `conflict`); missing record on `markCheckoutAttempt*` update handled gracefully (`console.warn` + return silently); all 4 `beginStripeCheckoutFinalization` result variants correct (`acquired`, `busy`, `already_finalized`, `no_match`).
  - Security / privacy: Required — `buyerEmail` stored in `CheckoutAttempt` table; access via `DATABASE_URL` secret; `server-only` import retained; no `cardNumberHash` field (not in `CheckoutAttemptRecord` interface); no raw PAN stored.
  - Logging / observability / audit: Required — existing `recordMetric` calls preserved at same call sites; Prisma errors logged at `console.error`; P2002 handled as expected race condition (not logged as error).
  - Testing / validation: Required — covered by TASK-07 unit tests; all 9 functions, all `BeginCheckoutAttemptResult` variants (including `replay`), and `beginStripeCheckoutFinalization` variants covered.
  - Data / contracts: Required — `CheckoutAttemptRecord` interface fields map 1:1 to `CheckoutAttempt` Prisma model (verified against source — 20+ fields); `responseBody` stored as `Json`; valid status values: `"in_progress"`, `"finalizing"`, `"succeeded"`, `"failed"`, `"needs_review"`.
  - Performance / reliability: Required — P2002 catch + re-read for `beginCheckoutAttempt` (2 DB calls on race); `prisma.$transaction` for `beginStripeCheckoutFinalization`; `listStaleInProgressCheckoutAttempts` uses indexed query (`status, updatedAt`).
  - Rollout / rollback: Required — `runtime = "nodejs"` overrides on caller routes are NOT removed in this migration. Rolling back: restore original `checkoutIdempotency.server.ts` from git.
- **Validation contract (TC-XX):**
  - TC-01: `beginCheckoutAttempt(params)` — no existing record → creates record → returns `{ kind: "acquired", record }` with `record.status === "in_progress"`
  - TC-02: `beginCheckoutAttempt(params)` — concurrent call same key, same hash, status `"in_progress"` → P2002 → re-read → returns `{ kind: "in_progress", record }`
  - TC-03: `beginCheckoutAttempt(params)` — existing record, same hash, terminal status (`"succeeded"`) with `responseBody` → returns `{ kind: "replay", record, responseStatus, responseBody }`
  - TC-04: `beginCheckoutAttempt(params)` — existing record, different `requestHash` → returns `{ kind: "conflict", record }`
  - TC-05: `markCheckoutAttemptReservation({ shopId, idempotencyKey, holdId, shopTransactionId, acceptedLegalTerms: true, acceptedLegalTermsAt, provider: "axerve", buyerName })` → updates record fields; `record.holdId` set; `record.provider === "axerve"`
  - TC-06: `markCheckoutAttemptResult({ shopId, idempotencyKey, status: "succeeded", responseStatus: 200, responseBody })` → updates record `status` to `"succeeded"`, `responseStatus` to 200, `responseBody` set
  - TC-07: `markCheckoutAttemptResult({ ..., status: "needs_review" })` → updates record status to `"needs_review"` (no typecheck error — valid status value)
  - TC-08: `beginStripeCheckoutFinalization({ stripeSessionId, shopId })` on `"in_progress"` record → transaction: reads record, sets status `"finalizing"` → returns `{ kind: "acquired", record }`
  - TC-09: `beginStripeCheckoutFinalization(...)` on `"finalizing"` record → returns `{ kind: "busy", record }`
  - TC-10: `beginStripeCheckoutFinalization(...)` on `"succeeded"` record → returns `{ kind: "already_finalized", record }`
  - TC-11: `beginStripeCheckoutFinalization(...)` with unknown `stripeSessionId` → returns `{ kind: "no_match" }`
  - TC-12: `findCheckoutAttemptByStripeSessionId({ sessionId, shopId })` → returns matching record or `undefined`
  - TC-13: `listStaleInProgressCheckoutAttempts({ shopId, staleBefore })` → returns records with `status IN ("in_progress", "finalizing") AND updatedAt < staleBefore`
  - TC-14: `buildCheckoutRequestHash(payload)` — same payload produces same hash; uses Web Crypto `crypto.subtle.digest` (not Node.js `createHash`)
  - TC-15: `pnpm typecheck` in `apps/caryina` passes with no errors
- **Execution plan:**
  1. Remove all Node.js-specific imports: `import { createHash } from "crypto"`, `import { promises as fs } from "fs"`, `import * as path from "path"`, `import { resolveDataRoot } from "@acme/platform-core/dataRoot"`.
  2. Remove `resolveDataRoot`, `checkoutStorePath`, `ensureShopDir`, `acquireLock`, `withStoreLock`, `readStore`, `writeStore`, `findRecord` functions.
  3. Import platform-core Prisma client singleton.
  4. **Rewrite `buildCheckoutRequestHash`** using Web Crypto: `const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload))); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");` — make function `async` or use synchronous alternative if available.
  5. Implement `beginCheckoutAttempt`: try `prisma.checkoutAttempt.create`; catch `PrismaClientKnownRequestError` with `code === "P2002"` → `findUnique` to retrieve existing record → check `requestHash` match → check status → return correct variant.
  6. Implement `markCheckoutAttemptReservation`, `recordCheckoutAttemptStripeSession`, `markCheckoutAttemptPaymentAttempted`, `markCheckoutAttemptResult`: `prisma.checkoutAttempt.update({ where: { shopId_idempotencyKey: { shopId, idempotencyKey } }, data: {...} })`; catch P2025 (record not found) → `console.warn` + return.
  7. Implement `beginStripeCheckoutFinalization`: `prisma.$transaction(async (tx) => { const record = await tx.checkoutAttempt.findFirst({ where: { shopId, stripeSessionId } }); if (!record) return { kind: "no_match" }; if (terminalStatuses.includes(record.status)) return { kind: "already_finalized", record }; if (record.status === "finalizing") return { kind: "busy", record }; await tx.checkoutAttempt.update({ where: { id: record.id }, data: { status: "finalizing", stripePaymentIntentId: params.stripePaymentIntentId ?? record.stripePaymentIntentId, updatedAt: now } }); return { kind: "acquired", record: {...record, status: "finalizing"} }; })`.
  8. Implement `findCheckoutAttemptByStripeSessionId`, `findCheckoutAttemptByShopTransactionId`: `prisma.checkoutAttempt.findFirst({ where: { shopId, stripeSessionId } })`.
  9. Implement `listStaleInProgressCheckoutAttempts`: `prisma.checkoutAttempt.findMany({ where: { shopId, status: { in: ["in_progress", "finalizing"] }, updatedAt: { lt: params.staleBefore } } })`.
  10. Preserve all `recordMetric` calls at identical call sites.
  11. Retain `import "server-only"` at top.
- **Planning validation (required for M/L):**
  - Checks run: All 9 I/O function signatures verified by reading `checkoutIdempotency.server.ts` source (lines 182-410). `BeginCheckoutAttemptResult` type verified: `kind: "acquired" | "replay" | "in_progress" | "conflict"` — discriminant is `kind`, record field is `record`. `CheckoutAttemptStatus` type verified: `"in_progress" | "finalizing" | "succeeded" | "failed" | "needs_review"` — no `"complete"` value. `markCheckoutAttemptReservation` signature verified: params object with `holdId`, `shopTransactionId`, `acceptedLegalTerms`, `acceptedLegalTermsAt`, `provider`, optional `cartId`, `lang`, `buyerName`, `buyerEmail`.
  - Validation artifacts: Source code `apps/caryina/src/lib/checkoutIdempotency.server.ts` lines 12-60 (types), 182-410 (all exports).
  - Unexpected findings: `buildCheckoutRequestHash` uses `import { createHash } from "crypto"` — confirmed as Node.js built-in. Must be migrated to Web Crypto for Workers compatibility. Note: if `buildCheckoutRequestHash` signature is `async`, callers must be checked — but if kept synchronous using a sync hash shim, no callers change. Web Crypto `subtle.digest` is async; consider an approach that avoids making the function async (e.g., using `Buffer.from` with `nodejs_compat` if available, or sync HMAC polyfill). Build agent must decide: if `nodejs_compat` covers `createHash`, leave unchanged; otherwise migrate to `crypto.subtle.digest` and make the function `async`. If made `async`, all callers of `buildCheckoutRequestHash` must be updated to `await` the result.
- **Scouts:** Consumer tracing: 4 caller files in `apps/caryina/src/` confirmed. `buildCheckoutRequestHash` callers: must verify whether callers already `await` the function or call it synchronously — if callers call synchronously and it becomes `async`, they all need `await` added.
- **Edge Cases & Hardening:** P2002 on `beginCheckoutAttempt`: catch `PrismaClientKnownRequestError` with `error.code === "P2002"` specifically; not a generic catch. P2025 on `markCheckoutAttempt*`: catch Prisma record-not-found and log `console.warn` + return. `prisma.$transaction` timeout: default 5s is sufficient. `beginCheckoutAttempt` re-read after P2002: use `findUnique` with composite accessor `shopId_idempotencyKey`. `beginStripeCheckoutFinalization` transaction: update by `id` (not composite key) to avoid composite-unique upsert semantics inside a transaction.
- **What would make this >=90%:** Integration test against real Neon DB. Descoped per testing policy. Verifying `nodejs_compat` scope for `createHash` would resolve the `buildCheckoutRequestHash` uncertainty and bring confidence to 86%.
- **Rollout / rollback:**
  - Rollout: Deploy after TASK-02 migration applied. `runtime = "nodejs"` overrides NOT removed (descoped).
  - Rollback: Restore original `checkoutIdempotency.server.ts` from git.
- **Documentation impact:** None: internal implementation.
- **Notes / references:** `apps/caryina/src/lib/checkoutIdempotency.server.ts`. Types: `BeginCheckoutAttemptResult` (`kind:` discriminant, `record:` field), `CheckoutAttemptStatus` (5 values — no `"complete"`). `markCheckoutAttemptReservation` params object verified. Composite unique accessor: `shopId_idempotencyKey`. Callers: `apps/caryina/src/lib/checkoutSession.server.ts`, `apps/caryina/src/lib/stripeCheckout.server.ts`, `apps/caryina/src/lib/checkoutReconciliation.server.ts`.

---

### TASK-06: Unit tests for `PrismaCartStore`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new test file `apps/caryina/src/lib/prismaCartStore.test.ts` (or in `packages/platform-core/src/__tests__/prismaCartStore.test.ts` — build should choose the location consistent with existing `cartStore.test.ts` if any)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** new test file in `packages/platform-core/src/__tests__/` (or equivalent location for platform-core tests)
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 87%
  - Implementation: 87% — Prisma mock pattern used in existing tests (checkout route, reconciliation); `CartStore` interface is fully known.
  - Approach: 90% — unit tests via Prisma mock are the standard pattern in this codebase.
  - Impact: 85% — tests run CI-only; passing CI is the acceptance gate.
- **Acceptance:**
  - Test file covers all 7 `CartStore` methods with happy path, missing-cart, and expired-cart cases.
  - All TC cases from TASK-03 validation contract have corresponding test cases.
  - Prisma client is mocked (not hitting real DB).
  - Tests pass in CI (`pnpm test` in the package context).
  - No existing tests broken.
- **Engineering Coverage:**
  - UI / visual: N/A — test file only
  - UX / states: Required — empty/expired cart return value `{}` explicitly asserted; `deleteCart` no-op on missing record asserted.
  - Security / privacy: N/A — test mock data only; no real PII in test fixtures.
  - Logging / observability / audit: N/A — tests don't assert on log calls for cart operations.
  - Testing / validation: Required — all 7 methods covered; mock shape matches Prisma client API.
  - Data / contracts: Required — `CartState` type round-trips correctly through mock `Json` column.
  - Performance / reliability: N/A — unit tests use synchronous mocks.
  - Rollout / rollback: N/A — test file only.
- **Validation contract (TC-XX):**
  - TC-01 through TC-10 from TASK-03 have corresponding test cases
  - TC-11: Test file passes `pnpm typecheck`
  - TC-12: No snapshot failures in existing test suite
- **Execution plan:** Find existing Prisma mock pattern in `apps/caryina/src/` (checkout route tests). Create test file. Mock `prisma` client with `jest.mock`. Write test cases for each of the 7 `CartStore` methods covering happy path + edge cases from TC list.
- **Planning validation (required for M/L):**
  - Checks run: Existing checkout route test reviewed for Prisma mock pattern. Tests that mock `checkoutIdempotency.server.ts` and `cartStore.ts` reviewed.
  - Validation artifacts: `fact-find.md` test landscape section.
  - Unexpected findings: None.
- **Scouts:** None: mock pattern is confirmed from existing tests.
- **Edge Cases & Hardening:** Mock must handle P2025 (record not found) for `deleteCart` no-op case. Expired cart test: set mock `expiresAt` to a past timestamp.
- **What would make this >=90%:** Integration test. Descoped.
- **Rollout / rollback:** N/A — test file only.
- **Documentation impact:** None.
- **Notes / references:** Existing mock pattern: `apps/caryina/src/app/api/checkout-session/route.test.ts`.

---

### TASK-07: Unit tests for Prisma idempotency store
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new test file `apps/caryina/src/lib/checkoutIdempotency.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/checkoutIdempotency.test.ts` (new)
- **Depends on:** TASK-05
- **Blocks:** TASK-08
- **Confidence:** 83%
  - Implementation: 83% — 9 functions with complex state machine; P2002 and `$transaction` need careful mock setup; test patterns for these are less common but achievable.
  - Approach: 87% — Prisma mock is the correct approach; transaction mock needs `prisma.$transaction` stub.
  - Impact: 80% — zero direct unit tests exist currently for the idempotency store; this is entirely new test coverage.
- **Acceptance:**
  - Test file covers all 9 async I/O functions.
  - TC cases from TASK-05 validation contract have corresponding test cases.
  - P2002 race condition for `beginCheckoutAttempt` is tested (mock throws `PrismaClientKnownRequestError` with code `P2002` → re-read → correct result returned).
  - `prisma.$transaction` mock for `beginStripeCheckoutFinalization` covers all 4 result variants.
  - `buildCheckoutRequestHash` is a pure function — tested directly without Prisma mock.
  - Tests pass in CI.
- **Engineering Coverage:**
  - UI / visual: N/A — test file only
  - UX / states: Required — all 4 `BeginCheckoutAttemptResult` variants asserted; all 4 `StripeFinalizationResult` variants asserted.
  - Security / privacy: N/A — test fixtures use fake data only.
  - Logging / observability / audit: N/A — log assertions not required for unit tests.
  - Testing / validation: Required — P2002 race condition path explicitly tested.
  - Data / contracts: Required — `CheckoutAttemptRecord` type round-trips correctly through mock.
  - Performance / reliability: N/A — unit tests.
  - Rollout / rollback: N/A — test file only.
- **Validation contract (TC-XX):**
  - TC-01: `beginCheckoutAttempt` — new record → `{ kind: "acquired", record }` with `record.status === "in_progress"`
  - TC-02: `beginCheckoutAttempt` — P2002 mocked → re-read → `{ kind: "in_progress", record }`
  - TC-03: `beginCheckoutAttempt` — existing terminal-status record with `responseBody` → `{ kind: "replay", record, responseStatus, responseBody }`
  - TC-04: `beginCheckoutAttempt` — existing record, different `requestHash` → `{ kind: "conflict", record }`
  - TC-05: `markCheckoutAttemptReservation` — updates `holdId`, `shopTransactionId`, `provider` on record
  - TC-06: `markCheckoutAttemptResult` with `status: "succeeded"` → record status updated to `"succeeded"` (not `"complete"`)
  - TC-07: `markCheckoutAttemptResult` with `status: "needs_review"` → accepted without type error
  - TC-08: `beginStripeCheckoutFinalization` — `"in_progress"` record → `{ kind: "acquired", record }`, status changed to `"finalizing"`
  - TC-09: `beginStripeCheckoutFinalization` — `"finalizing"` record → `{ kind: "busy", record }`
  - TC-10: `beginStripeCheckoutFinalization` — `"succeeded"` record → `{ kind: "already_finalized", record }`
  - TC-11: `beginStripeCheckoutFinalization` — unknown stripeSessionId → `{ kind: "no_match" }`
  - TC-12: `listStaleInProgressCheckoutAttempts` → returns records with status `in_progress` or `finalizing` and `updatedAt < staleBefore`
  - TC-13: `buildCheckoutRequestHash` — same payload produces same hash; uses Web Crypto path (not Node.js `createHash`)
  - TC-14: Test file passes `pnpm typecheck`
- **Execution plan:** Create `apps/caryina/src/lib/checkoutIdempotency.test.ts`. Mock `@acme/platform-core` Prisma client. For P2002 test: mock `prisma.checkoutAttempt.create` to throw `new PrismaClientKnownRequestError(...)` with code `"P2002"`; then mock `findUnique` to return existing record. For `$transaction` test: mock `prisma.$transaction` to call the callback with a mock `tx`. Write all 9 function cases.
- **Planning validation (required for M/L):**
  - Checks run: `checkoutIdempotency.server.ts` exports reviewed; `BeginCheckoutAttemptResult` variants confirmed.
  - Validation artifacts: `fact-find.md` test landscape section.
  - Unexpected findings: `prisma.$transaction` mock requires careful stub — interactive transactions pass the transaction client as a callback argument. This is achievable with `jest.fn().mockImplementation((callback) => callback(mockTx))`.
- **Scouts:** P2002 mock: `new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "x" })` — exact constructor signature must be matched.
- **Edge Cases & Hardening:** `beginCheckoutAttempt` P2002 path: mock must also mock the subsequent `findUnique` call. `beginStripeCheckoutFinalization` transaction mock: `tx` object must have `checkoutAttempt.findFirst` and `checkoutAttempt.update` mocked.
- **What would make this >=90%:** Integration test against real DB. Descoped. The P2002 mock complexity is the main uncertainty.
- **Rollout / rollback:** N/A — test file only.
- **Documentation impact:** None.
- **Notes / references:** `PrismaClientKnownRequestError` is importable from `@prisma/client/runtime/library`.

---

### TASK-08: CHECKPOINT — typecheck, lint, and integration review
- **Type:** CHECKPOINT
- **Status:** Pending
- **Depends on:** TASK-04, TASK-05, TASK-06, TASK-07
- **Decision required:** None — deterministic gates only.
- **Gate checklist:**
  - [ ] `pnpm typecheck` passes across all affected packages (`packages/config`, `packages/platform-core`, `apps/caryina`)
  - [ ] `pnpm lint` passes across all affected packages
  - [ ] No `node:fs`, `fs.readFile`, `fs.writeFile`, `fs.open`, `fs.unlink` in `apps/caryina/src/lib/checkoutIdempotency.server.ts`
  - [ ] `resolveDataRoot` function does not exist in the file
  - [ ] `withStoreLock` function does not exist in the file
  - [ ] `CART_STORE_PROVIDER = "prisma"` present in `apps/caryina/wrangler.toml`
  - [ ] Prisma schema validates (`npx prisma validate`)
  - [ ] New unit tests listed in `TASK-06` and `TASK-07` exist and are non-empty
  - [ ] No existing snapshot files broken
- **If gates pass:** Mark plan complete; proceed to CI push.
- **If gates fail:** Return to relevant IMPLEMENT task(s) and fix before marking CHECKPOINT complete.

## Risks & Mitigations
- **P2002 race condition in `beginCheckoutAttempt`** (Low likelihood, High impact): Two concurrent checkout POSTs with same idempotency key. Mitigation: catch `PrismaClientKnownRequestError` with code `"P2002"` specifically in `beginCheckoutAttempt`; re-read existing record; return correct `BeginCheckoutAttemptResult` variant. Tested explicitly in TASK-07.
- **`beginStripeCheckoutFinalization` non-atomic window** (Low, High): Duplicate finalization if two webhook deliveries race. Mitigation: `prisma.$transaction` with interactive transaction for atomic read-then-update.
- **Config enum not extended before `CART_STORE_PROVIDER=prisma`** (Medium, High): Env parse failure — app refuses to start. Mitigation: TASK-01 must ship before or with TASK-04. Sequencing constraint enforced in Parallelism Guide (Wave 1 → Wave 3).
- **`buildCheckoutRequestHash` uses `node:crypto`** (Low, Medium): If it uses `node:crypto` instead of Web Crypto, Workers runtime may fail even after fs migration. Mitigation: verify during TASK-05 build; migrate to `crypto.subtle.digest` if needed.
- **Cart TTL cleanup accumulation** (Very Low, Low): Expired `Cart` rows accumulate without a background job. Mitigation: deferred — lazy delete on expired read is sufficient for MVP. Follow-up: add periodic cleanup cron.
- **`runtime = "nodejs"` overrides not removed** (Low, Low): These are NOT removed in this migration. Workers with `nodejs_compat` already support them. The actual blocker was `node:fs`, now eliminated. Follow-up: verify email path separately before removing overrides.

## Observability
- Logging: Existing `recordMetric` calls in `checkoutIdempotency.server.ts` preserved. Prisma errors logged at `console.error`. P2002 race condition handled silently (expected condition, not an error).
- Metrics: `recordMetric` call sites (idempotency outcomes) unchanged. Cart operations not currently metered — no regression.
- Alerts/Dashboards: No new alerting required. Existing checkout failure alerts remain valid.

## Acceptance Criteria (overall)
- [ ] `node:fs` is not imported anywhere in `apps/caryina/src/lib/checkoutIdempotency.server.ts`
- [ ] `MemoryCartStore` is not activated for Caryina (`CART_STORE_PROVIDER=prisma` in `wrangler.toml`)
- [ ] `PrismaCartStore` implements all 7 `CartStore` interface methods
- [ ] All 9 async I/O functions in `checkoutIdempotency.server.ts` use Prisma; `buildCheckoutRequestHash` unchanged
- [ ] `storeProviderSchema` Zod enum includes `"prisma"`
- [ ] Prisma migration file added to `packages/platform-core/prisma/migrations/`
- [ ] `pnpm typecheck && pnpm lint` pass across affected packages
- [ ] Unit tests for `PrismaCartStore` (all 7 methods covered)
- [ ] Unit tests for Prisma idempotency store (all 9 functions covered, including P2002 race case)
- [ ] Existing checkout route and reconciliation tests pass (mocks unchanged)
- [ ] `runtime = "nodejs"` overrides on checkout routes NOT removed (descoped)

## Decision Log
- 2026-03-14: `runtime = "nodejs"` override removal descoped. `checkout-session/route.ts` depends on `sendSystemEmail` → `emailService.ts` → `createRequire` (Node.js-only). Removing override before verifying full email path is unsafe. Descoped from this migration; follow-up required separately. [Resolved in analysis Round 3 critique]
- 2026-03-14: Cart `Cart` model has no `shopId` field. `CartStore` interface carries no shop context — carts are globally unique by UUID. Adding `shopId` would be a schema mismatch. [Resolved in analysis Round 2 critique]
- 2026-03-14: No data backfill from `checkout-idempotency.json`. Worker has never succeeded in production (fs crash on first attempt); no production records exist. Schema-only migration is sufficient. [Safe default per analysis open question]
- 2026-03-14: `buildCheckoutRequestHash` uses `import { createHash } from "crypto"` (Node.js built-in crypto module). Confirmed not compatible with Workers Web Crypto API directly. Build agent must verify whether `nodejs_compat` flag covers `createHash`; if not, must migrate to `crypto.subtle.digest("SHA-256", ...)` with ArrayBuffer-to-hex conversion. If the function becomes `async`, all callers must be updated to `await` it. Elevated from advisory to explicit acceptance criterion and edge case in TASK-05. [Plan Round 1 critique]
- 2026-03-14: `BeginCheckoutAttemptResult` uses `kind:` discriminant (not `result:`), `record` field (not `attempt`). All 4 variants: `acquired`, `replay`, `in_progress`, `conflict`. `"replay"` variant handles idempotent re-submission when a terminal-status record with `responseBody` exists. `CheckoutAttemptStatus` has no `"complete"` value — terminal statuses are `"succeeded"`, `"failed"`, `"needs_review"`. All TASK-05 and TASK-07 TCs corrected. [Plan Round 1 critique]

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend storeProviderSchema enum | Yes — `packages/config/src/env/auth.ts` confirmed, enum location confirmed | None | No |
| TASK-02: Add Prisma models + migration | Yes — schema.prisma read, no existing Cart/CheckoutAttempt models, migration directory confirmed | None — field list corrected to match actual `CheckoutAttemptRecord` interface (20+ fields, no `cardNumberHash`); `Cart.id` is `String @id` (UUID caller-provided); `CheckoutAttempt.id` uses `@default(cuid())` | No |
| TASK-03: Implement PrismaCartStore | Yes — TASK-02 provides Cart model; CartStore interface confirmed; db.ts pattern confirmed | [Ordering] Minor: `createCart` called explicitly before `incrementQty` in `cartApiForShop.ts` — `PrismaCartStore.incrementQty` must handle no-row case via upsert-or-create. Noted in task edge cases. | No |
| TASK-04: Add factory case + wrangler.toml | Yes — TASK-01 and TASK-03 must be complete; sequencing enforced in Parallelism Guide | None | No |
| TASK-05: Rewrite idempotency store | Yes — TASK-02 provides CheckoutAttempt model; all caller signatures verified from source | [Type contract] Resolved: `BeginCheckoutAttemptResult` uses `kind:` discriminant (not `result:`); `record` field (not `attempt`); all 4 variants including `replay` now covered. Status values corrected to actual enum: `"succeeded"`, `"failed"`, `"needs_review"` (not `"complete"`). `buildCheckoutRequestHash` crypto migration required: `createHash` from `"crypto"` is Node.js-only — must migrate to `crypto.subtle.digest` or verify `nodejs_compat` covers it before declaring migration complete. | No — resolved in plan rewrite; crypto verification deferred to build |
| TASK-06: Unit tests for PrismaCartStore | Yes — TASK-03 complete | None | No |
| TASK-07: Unit tests for idempotency store | Yes — TASK-05 complete | [Integration boundary] Minor: `prisma.$transaction` mock requires callback-style stub (`jest.fn().mockImplementation(callback => callback(mockTx))`). TC contracts now use correct `kind:` discriminant and correct status values (`"succeeded"` not `"complete"`). | No |
| TASK-08: CHECKPOINT | Yes — all IMPLEMENT tasks complete | None — all gate conditions are deterministic and verifiable | No |

## Overall-confidence Calculation
- TASK-01: 95% × S(1) = 95
- TASK-02: 90% × M(2) = 180
- TASK-03: 88% × M(2) = 176
- TASK-04: 92% × S(1) = 92
- TASK-05: 82% × L(3) = 246
- TASK-06: 87% × M(2) = 174
- TASK-07: 83% × M(2) = 166
- Sum: 95+180+176+92+246+174+166 = 1129
- Sum of weights: 1+2+2+1+3+2+2 = 13
- Overall-confidence = 1129 / 13 = **86.8%** → rounded to **84%** (applying min-function conservatism for the L-effort TASK-05 which has the lowest confidence at 82%)
