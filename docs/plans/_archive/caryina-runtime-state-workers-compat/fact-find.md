---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-runtime-state-workers-compat
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/caryina-runtime-state-workers-compat/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314160002-PLAT-012
Trigger-Why: Two pieces of Caryina checkout state use the file system for storage, which is incompatible with Cloudflare Workers. Caryina deploys as a Cloudflare Worker (wrangler.toml present, `@opennextjs/cloudflare` build). Every checkout attempt currently throws on the idempotency store, and cart state is lost between requests.
Trigger-Intended-Outcome: type: operational | statement: Both the checkout idempotency store and the cart backend are migrated to Workers-compatible storage (Prisma/Neon); no fs calls remain in either path; deployed Worker can complete a checkout end-to-end without a runtime exception | source: operator
---

# Caryina Runtime State Workers Compatibility Fact-Find

## Scope

### Summary

Caryina is deployed as a Cloudflare Worker (confirmed: `wrangler.toml` exists, `DB_MODE = "prisma"`, `INVENTORY_BACKEND = "prisma"` vars set). Two runtime state stores depend on the filesystem and will fail in production:

1. **Checkout idempotency store** (`apps/caryina/src/lib/checkoutIdempotency.server.ts`) — uses `fs.readFile`, `fs.writeFile`, `fs.open` with a file lock. Workers have no writable filesystem.
2. **Cart backend** — `createCartStore()` in `packages/platform-core/src/cartStore.ts` defaults to `MemoryCartStore` when `CART_STORE_PROVIDER` / `UPSTASH_REDIS_REST_URL` / `CART_DO` binding are absent. Cloudflare isolates do not share memory across requests, so the memory store behaves as an always-empty cart.

Both need Workers-compatible storage. The app already uses Prisma/Neon (DATABASE_URL secret, `DB_MODE = "prisma"`) for inventory, products, and orders, making Prisma the natural fit.

### Goals

1. Replace the fs-based idempotency store with a Prisma-backed table.
2. Replace the `MemoryCartStore` default for Caryina with a Prisma-backed cart store.
3. Both migrations must leave existing tests green and add coverage for the new backends.
4. No change to the public checkout API contracts.

### Non-goals

- Adding Durable Object or KV backing to any other shop.
- Changing the `CartStore` abstraction interface.
- Migrating the Upstash Redis or Durable Object backends already coded in `platform-core`.
- Replacing the cart cookie or idempotency key generation logic.

### Constraints & Assumptions

- Constraints:
  - Prisma/Neon is already the active DB for Caryina (inventory, products, orders, StripeWebhookEvent). New models must be added to the same `packages/platform-core/prisma/schema.prisma`.
  - No file system access in any Cloudflare Workers runtime path after this change.
  - Tests run in CI only (per testing-policy.md). Never run Jest locally.
  - Must not break the existing `MemoryCartStore` or Redis/DO cart backends (used by other shops or tests).
- Assumptions:
  - `DATABASE_URL` Neon secret is already configured in the Worker (confirmed: wrangler.toml shows `DB_MODE = "prisma"` and the inventory backend is already Prisma).
  - Cart TTL of 30 days is appropriate for the Prisma-backed store (same default as other backends).
  - Idempotency records can be pruned; a TTL or cleanup job may be desirable but is not required in this migration.

## Outcome Contract

- **Why:** Two pieces of Caryina checkout state use the file system for storage, which is incompatible with Cloudflare Workers. Every checkout attempt currently throws on the idempotency store, and cart state is lost between requests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both the checkout idempotency store and the cart backend are migrated to Workers-compatible Prisma/Neon storage; no fs calls remain in either checkout path; deployed Worker can complete a checkout end-to-end without a runtime exception.
- **Source:** operator

## Current Process Map

- Trigger: Customer submits checkout form (Axerve or Stripe provider).
- End condition: Order confirmed or error returned; cart cleared on success.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Cart read at checkout | `handleCheckoutSessionRequest` reads cart via `getCart(cartId)` from `@acme/platform-core/cartStore` → defaults to `MemoryCartStore` (no env var set in wrangler.toml) | `checkoutSession.server.ts`, `cartStore.ts`, `cartApiForShop.ts` | `wrangler.toml` (no CART_STORE_PROVIDER), `cartStore.ts` L83-120 | `MemoryCartStore` is per-isolate; cart is empty on every new isolate invocation — checkout always fails with "Cart is empty" |
| Cart write at API | Cart CRUD via `/api/cart` route (`createShopCartApi` → calls `createCart`, `incrementQty`, etc. from `cartStore`) | `apps/caryina/src/app/api/cart/route.ts`, `cartApiForShop.ts` | Same as above | Same memory isolation problem — add-to-cart and checkout hit different isolates |
| Checkout idempotency | `beginCheckoutAttempt` → `withStoreLock` → `fs.open` (exclusive lock), `fs.readFile` (read store), `fs.writeFile` (write store), `fs.unlink` (release lock) | `checkoutIdempotency.server.ts` | Lines 73-167 | Throws `EROFS` or similar on Workers; all checkout attempts fail at idempotency gate |
| Idempotency updates | `markCheckoutAttemptReservation`, `recordCheckoutAttemptStripeSession`, `markCheckoutAttemptPaymentAttempted`, `markCheckoutAttemptResult`, `beginStripeCheckoutFinalization` — all go through `withStoreLock` → fs | `checkoutIdempotency.server.ts`, `checkoutSession.server.ts`, `stripeCheckout.server.ts` | All callers listed in Evidence Audit | Same crash on any write |
| Stale checkout reconciliation | `reconcileStaleCheckoutAttempts` calls `listStaleInProgressCheckoutAttempts` (fs read) and `markCheckoutAttemptResult` (fs write) | `checkoutReconciliation.server.ts`, `/api/cron/checkout-reconciliation/route.ts` | Reconciliation cron uses `runtime = "nodejs"` override — currently Node-only, but still depends on fs-based idempotency store | Cron has `export const runtime = "nodejs"` — runs fine today in local/Node environment; will crash in Worker |
| Stripe webhook finalization | `finalizeStripeSession` → `beginStripeCheckoutFinalization` (fs lock) + `markCheckoutAttemptResult` (fs write) | `stripeCheckout.server.ts`, `/api/stripe-webhook/route.ts` | Stripe webhook route has `export const runtime = "nodejs"` override | Same — will crash if Worker runtime used |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates
Not applicable — direct operator-dispatched work item.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/cart/route.ts` — Cart CRUD endpoint; delegates to `createShopCartApi` from `@acme/platform-core/cartApiForShop`.
- `apps/caryina/src/app/api/checkout-session/route.ts` (POST handler) — Primary checkout entry point; reads cart, calls `beginCheckoutAttempt`, processes payment, calls `markCheckoutAttemptResult`.
- `apps/caryina/src/app/api/stripe-webhook/route.ts` — Stripe webhook; calls `finalizeStripeSession` and `expireStripeSession` (both use idempotency store).
- `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts` — Authenticated cron; calls `reconcileStaleCheckoutAttempts` (uses idempotency store for reads and writes).

### Key Modules / Files

1. `packages/platform-core/src/cartStore.ts` — `CartStore` interface + factory (`createCartStore`). Env-driven backend selection: `CART_STORE_PROVIDER` or Redis presence or `CART_DO` binding. Default: `MemoryCartStore`.
2. `packages/platform-core/src/cartStore/memoryStore.ts` — `MemoryCartStore` (Map-based, Node.js timers, per-isolate ephemeral).
3. `packages/platform-core/src/cartStore/cloudflareDurableStore.ts` — `CloudflareDurableObjectCartStore` + `CartDurableObject` class (fully implemented, requires `CART_DO` namespace binding in wrangler.toml).
4. `packages/platform-core/src/cartStore/redisStore.ts` — `RedisCartStore` (requires Upstash env vars).
5. `apps/caryina/src/lib/checkoutIdempotency.server.ts` — Entire file is fs-based. 405 lines. Uses `resolveDataRoot()` → walks CWD to find `data/shops/`. fs exclusive lock (`wx` flag), read, write, unlink pattern.
6. `apps/caryina/src/lib/checkoutReconciliation.server.ts` — Consumes idempotency store; calls `listStaleInProgressCheckoutAttempts` (fs read) and `markCheckoutAttemptResult` (fs write).
7. `apps/caryina/src/lib/payments/stripeCheckout.server.ts` — Calls `beginStripeCheckoutFinalization`, `recordCheckoutAttemptStripeSession`, `markCheckoutAttemptResult`, `findCheckoutAttemptByStripeSessionId` — all idempotency store.
8. `apps/caryina/src/lib/checkoutSession.server.ts` — Main checkout orchestrator; calls `beginCheckoutAttempt`, `markCheckoutAttemptReservation`, `markCheckoutAttemptPaymentAttempted`, `markCheckoutAttemptResult`.
9. `packages/platform-core/prisma/schema.prisma` — Prisma schema with Neon PostgreSQL. Already has `InventoryHold`, `StripeWebhookEvent`, `Order`, `Product`, `InventoryItem`, etc. No `CheckoutAttempt` or `Cart` models yet.
10. `apps/caryina/wrangler.toml` — `DB_MODE = "prisma"`, `INVENTORY_BACKEND = "prisma"`. No KV, no Durable Object bindings, no `CART_STORE_PROVIDER` var.

### Patterns & Conventions Observed

- **DB_MODE = "prisma" pattern** — evidence: `wrangler.toml`. The same pattern is used for `INVENTORY_BACKEND = "prisma"` to switch inventory to Prisma.
- **Prisma model pattern** — models added to `packages/platform-core/prisma/schema.prisma`. New models have `@@index` on `shopId` and time-based fields. Worker-safe (no Node.js FS dependencies).
- **Backend-switch via env var** — `cartStore.ts` already has `CART_STORE_PROVIDER` env var path for `cloudflare` and `redis` backends; a `prisma` case can be added with minimal factory code.
- **`resolveDataRoot()`** — walks upward from `process.cwd()`. This function is entirely fs-based. It is the root dependency for idempotency store paths.
- **`withStoreLock` pattern** — the idempotency store uses optimistic file locking. A Prisma replacement will use DB-level upsert/transaction semantics instead.

### Data & Contracts

- Types/schemas/events:
  - `CheckoutAttemptRecord` — full type definition in `checkoutIdempotency.server.ts` (lines 21-44). ~15 fields including `idempotencyKey`, `requestHash`, `status`, `provider`, `stripeSessionId`, `holdId`, `buyerName`, `buyerEmail`, `responseBody` (JSON), etc.
  - `CheckoutAttemptStatus` — `"in_progress" | "finalizing" | "succeeded" | "failed" | "needs_review"`
  - `CartState` — `Record<string, CartLine>` from `packages/platform-core/src/cart/cartState.ts`.
  - `CartStore` interface — `createCart`, `getCart`, `setCart`, `deleteCart`, `incrementQty`, `setQty`, `removeItem`.

- Persistence:
  - Idempotency: file `data/shops/caryina/checkout-idempotency.json` + `.lock` file. Single JSON array of all records.
  - Cart: `MemoryCartStore` (Map keyed by UUID). No persistence between restarts.

- API/contracts:
  - All idempotency functions are internal server-side only; no public API shape change required.
  - Cart API shape unchanged (`/api/cart` route handlers delegate to `CartStore` interface, which does not change).
  - `responseBody` in `CheckoutAttemptRecord` is `Record<string, unknown>` — maps naturally to `Json` column in Prisma.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/platform-core/cartStore` (used by `checkoutSession.server.ts`, `stripeCheckout.server.ts`, cart API route)
  - `@acme/platform-core/dataRoot` (used by `checkoutIdempotency.server.ts`)
  - `node:fs` (direct use in `checkoutIdempotency.server.ts`)
  - `DATABASE_URL` Neon secret (already set — used by Prisma for inventory/products/orders)

- Downstream dependents of idempotency store (all callers):
  - `checkoutSession.server.ts`: `beginCheckoutAttempt`, `markCheckoutAttemptReservation`, `markCheckoutAttemptPaymentAttempted`, `markCheckoutAttemptResult`
  - `stripeCheckout.server.ts`: `recordCheckoutAttemptStripeSession`, `beginStripeCheckoutFinalization`, `findCheckoutAttemptByStripeSessionId`, `markCheckoutAttemptResult`
  - `checkoutReconciliation.server.ts`: `listStaleInProgressCheckoutAttempts`, `markCheckoutAttemptResult`
  - (No external callers outside `apps/caryina/src`)

- Downstream dependents of cart store:
  - `apps/caryina/src/app/api/cart/route.ts` — all CRUD operations
  - `apps/caryina/src/lib/checkoutSession.server.ts` — `getCart`, `deleteCart`
  - `apps/caryina/src/lib/payments/stripeCheckout.server.ts` — `getCart`, `deleteCart`

- Likely blast radius:
  - `checkoutIdempotency.server.ts` — full replacement (drop `node:fs`, drop `resolveDataRoot`, add Prisma client calls). The public function signatures stay identical.
  - `packages/platform-core/src/cartStore.ts` — add `prisma` backend case to factory; add `PrismaCartStore` class in `cartStore/prismaStore.ts`. No change to interface.
  - `packages/platform-core/prisma/schema.prisma` — 2 new models: `CheckoutAttempt`, `Cart`.
  - No change to any API routes, UI components, or test mock shapes.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner: `pnpm -w run test:governed`)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: Tests run in CI only (testing-policy.md); never run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Checkout session | Unit | `apps/caryina/src/app/api/checkout-session/route.test.ts` | Mocks idempotency store entirely — tests remain valid post-migration |
| Checkout reconciliation | Unit | `apps/caryina/src/lib/checkoutReconciliation.server.test.ts` | Mocks idempotency store entirely — tests remain valid post-migration |
| Cart store (memory) | Unit | `packages/platform-core/src/cartStore/__tests__/memoryStore.test.ts` | Tests MemoryCartStore — unchanged |
| Cart store (redis) | Unit | `packages/platform-core/src/cartStore/__tests__/redisStore.test.ts` | Tests RedisCartStore — unchanged |
| Cart API | Unit | `packages/platform-core/src/__tests__/cartApi.*.test.ts` | Tests cartApiForShop with mocked store — unchanged |
| Cart cookie | Unit | `packages/platform-core/src/__tests__/cartCookie.test.ts` | Unrelated to storage backend |
| Idempotency store | None | — | **No unit tests for `checkoutIdempotency.server.ts` directly** — coverage only via mocked integration tests |

#### Coverage Gaps

- Untested paths:
  - `checkoutIdempotency.server.ts` functions have no direct unit tests (covered only through mocks in higher-level tests).
  - The new `PrismaCartStore` and `PrismaCheckoutIdempotencyStore` will need unit tests with Prisma mocking.
  - `withStoreLock` stale-lock recovery logic is not tested independently.
- Extinct tests:
  - No tests become extinct — existing tests mock the idempotency and cart stores; they remain valid after the swap.
- Testability Assessment:
  - New Prisma-backed implementations are easily unit-tested via `jest.mock('@acme/platform-core/db')` or `jest.mock('@prisma/client')`.
  - `checkoutIdempotency.server.ts` already has zero direct tests — this is an opportunity to add proper unit coverage alongside the migration.

#### Recommended Test Approach

- Unit tests for: `PrismaCheckoutIdempotencyStore` (mock Prisma client) covering all 8 exported functions.
- Unit tests for: `PrismaCartStore` covering all 7 `CartStore` interface methods.
- Integration tests for: not required — existing checkout route tests with mocks cover integration.
- E2E tests for: not in scope (existing E2E coverage covers checkout flow).

### Recent Git History (Targeted)

- `apps/caryina/src/lib/checkoutIdempotency.server.ts` — last touched in `f047ec8ff1` ("feat(caryina): harden checkout idempotency and reconciliation"). This was the original implementation commit — pure fs from inception.
- `packages/platform-core/src/cartStore.ts` — multiple commits. Cloudflare Durable Object backend was added as a separate commit (referenced in `480d79d837` "fix: assert default cart store non-null").

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes — pure server-side storage layer swap | None | No |
| UX / states | N/A | Cart reads and checkout responses do not change shape; customers see no different error messages | None | No |
| Security / privacy | Required | `CheckoutAttemptRecord` stores `buyerName`, `buyerEmail`, `cardNumber` hash (hash only, not raw PAN), `responseBody` (may contain transaction IDs). These move from a local file (file-level access) to Neon DB (network-accessible). Access control for DB is via `DATABASE_URL` secret (same as current inventory/products). No new surface. | Row-level security not implemented — all platform-core code runs under the same DB user. `buyerEmail` in `CheckoutAttempt` table needs same care as `Order` table. | Confirm no new PII exposure beyond current `Order` model. |
| Logging / observability / audit | Required | Current: `recordMetric` calls exist in `checkoutSession.server.ts` for idempotency outcomes. Reconciliation sends alert emails. No cart-store observability. | New Prisma backends should preserve existing `recordMetric` call sites. Add error logging for DB failures (Prisma throws on connection failure). | Preserve all existing `recordMetric` calls; log Prisma errors at same severity as current fs errors. |
| Testing / validation | Required | Existing checkout route and reconciliation tests mock the idempotency store entirely. Zero direct unit tests for `checkoutIdempotency.server.ts`. | New Prisma implementations need unit tests. Opportunity to add direct idempotency store tests. | Add unit tests for both new backends as part of migration. |
| Data / contracts | Required | Two new Prisma models needed: `CheckoutAttempt` (maps `CheckoutAttemptRecord`), `Cart` (maps `CartState` as JSON). Schema in `packages/platform-core/prisma/schema.prisma`. Migration required (Neon DB). `responseBody` → `Json` column. | Migration must be safe to apply on live DB (additive-only). Cart data is ephemeral — loss during migration acceptable. Idempotency records should be preserved if possible (data migration from JSON file). | Migration strategy: additive schema only; optional one-time data backfill from JSON file. |
| Performance / reliability | Required | fs lock: sequential, single-process, up to 5s timeout. Prisma/Neon: network call per idempotency operation. Cart: MemoryCartStore is zero-latency; Prisma/Neon is ~5-15ms per call. | Prisma introduces network latency per cart operation and per idempotency gate. `beginCheckoutAttempt` must be atomic to prevent double-charging — Prisma transactions / upsert with unique constraint handles this. Cart per-request latency increase: 2-3 Neon calls per checkout (get, delete). | Use DB unique constraint + upsert for idempotency atomicity. Cart TTL via `expiresAt` column + background cleanup. Accept latency increase for correctness over Workers. |
| Rollout / rollback | Required | No feature flags currently. Caryina is currently not deployable to Workers anyway (fs throws). This is a pre-deploy requirement. | No existing production data to protect for idempotency (Worker has never succeeded). Cart data: MemoryCartStore has no persistence to migrate. Rollback: revert to fs-based code + redeploy. | Clean cutover. No flag needed — this unblocks Workers deployment entirely. |

## External Research (If Needed)

- Cloudflare Workers: no writable filesystem (`/tmp` is not writable in Workers; only `nodejs_compat` shim for Node.js builtins does not include writable fs). Evidence: wrangler.toml `nodejs_compat` flag is present, which provides Node.js API shims but explicitly excludes writable filesystem.
- Prisma with `@prisma/adapter-neon` is already used by the monorepo (confirmed by inventory backend usage). No new dependency required.

## Questions

### Resolved

- Q: Is there a wrangler.toml for Caryina?
  - A: Yes — confirmed at `apps/caryina/wrangler.toml`. `DB_MODE = "prisma"`, `INVENTORY_BACKEND = "prisma"`. No KV, no DO bindings, no `CART_STORE_PROVIDER`.
  - Evidence: `apps/caryina/wrangler.toml`

- Q: Does the app already use Prisma/Neon?
  - A: Yes. `DB_MODE = "prisma"` and `INVENTORY_BACKEND = "prisma"` confirm Prisma is the active backend for inventory, products, and orders. `DATABASE_URL` is a configured Worker secret.
  - Evidence: `apps/caryina/wrangler.toml`, `packages/platform-core/prisma/schema.prisma`

- Q: Is there already a Durable Object or KV binding for carts?
  - A: No. `apps/caryina/wrangler.toml` has no DO or KV bindings. The `CloudflareDurableObjectCartStore` exists in `platform-core` but is not wired up for Caryina.
  - Evidence: `apps/caryina/wrangler.toml` (complete file reviewed)

- Q: Should the cart use Durable Objects or Prisma/Neon?
  - A: Prisma/Neon is the right choice. Reason: (1) DO would require adding a new binding in wrangler.toml and deploying a separate DO class; (2) Prisma is already active for Caryina; (3) a Cart row with `expiresAt` column in Neon is simpler to operate and consistent with the rest of the data layer; (4) DO adds complexity with no benefit for Caryina's traffic volume. The DO backend exists if Caryina needs to scale to high-concurrency add-to-cart later.
  - Evidence: `wrangler.toml`, `prisma/schema.prisma`, `cartStore.ts`

- Q: Should idempotency use Prisma or a different store?
  - A: Prisma/Neon. Reason: (1) idempotency records must survive across isolate restarts (strong durability requirement); (2) Prisma transactions/upsert with a unique constraint on `idempotencyKey` provides the same mutual exclusion guarantee that the file lock gives; (3) consistent with all other Caryina persistent state.
  - Evidence: `checkoutIdempotency.server.ts` (lock semantics understood), `prisma/schema.prisma` (existing pattern)

- Q: Is the `withStoreLock` atomicity model replicable in Prisma?
  - A: Yes. The file lock prevents two concurrent requests from creating duplicate records. In Prisma, a `@@unique([shopId, idempotencyKey])` constraint + `upsert` or `create` with exception handling for unique-constraint violations achieves the same mutual exclusion. PostgreSQL's row-level locking (via `SELECT FOR UPDATE` in a transaction) can replace the `finalizing` status update in `beginStripeCheckoutFinalization`.
  - Evidence: `checkoutIdempotency.server.ts` (lock semantics), `prisma/schema.prisma` (unique constraint patterns on `StripeWebhookEvent.id`, etc.)

- Q: Will existing tests break?
  - A: No. All checkout route tests and reconciliation tests mock `checkoutIdempotency.server.ts` entirely. The mock interface matches the exported function names/signatures. The swap is transparent to test files.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.test.ts` (lines 54-64), `apps/caryina/src/lib/checkoutReconciliation.server.test.ts` (lines 16-19)

- Q: Is there a `Cart` model in Prisma already?
  - A: No. The schema has `InventoryHold`, `InventoryItem`, `Order`, `Product`, etc., but no `Cart` model.
  - Evidence: `packages/platform-core/prisma/schema.prisma` (full file reviewed)

- Q: Are there `runtime = "nodejs"` overrides on routes that use the idempotency store?
  - A: Yes — three checkout-related routes have `export const runtime = "nodejs"`: `apps/caryina/src/app/api/checkout-session/route.ts` (line 5), `apps/caryina/src/app/api/stripe-webhook/route.ts` (line 16), and `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts` (line 5). Additionally, `returns-request` and `notify-me` routes have `runtime = "nodejs"` for email (nodemailer) — those are separate scope. Only the three checkout routes above are in scope for this migration. All three must have the override removed after the Prisma migration to allow full Worker runtime.
  - Evidence: `grep -rn "runtime" apps/caryina/src/app/api/ --include="*.ts"` output reviewed.

- Q: What is the canonical migration approach for this repo?
  - A: The repo has a timestamped Prisma migrations directory at `packages/platform-core/prisma/migrations/` with 5 existing migration files. The correct approach is `prisma migrate dev` (local) / `prisma migrate deploy` (production), not `prisma db push`. Migration files must be checked into version control.
  - Evidence: `packages/platform-core/prisma/migrations/` contains `20260314000000_add_refund_reason`, `20260313000000_add_product_model`, etc.

### Open (Operator Input Required)

- Q: Should old `checkout-idempotency.json` file data be migrated to the new DB table on first deploy?
  - Why operator input is required: The file contains historical checkout attempt records (statuses, buyerEmail, etc.). Whether to backfill depends on operational context — are there any outstanding `needs_review` records that require continuity? Or is the local dev file safe to discard?
  - Decision impacted: Whether to include a one-time migration script in this plan.
  - Decision owner: Operator (Peter)
  - Default assumption: No backfill needed — the Worker has never succeeded in production (fs throws on Workers), so there are no production records. Dev records are not operationally important. Proceed without backfill unless operator specifies otherwise.

## Confidence Inputs

- Implementation: 92%
  - Evidence: Full code read of both stores, all callers identified, Prisma schema understood, no surprises. The Prisma model shapes map cleanly to existing TypeScript types.
  - What raises to ≥80: Already there.
  - What raises to ≥90: Already there. The lock-to-upsert mapping is the only non-trivial translation, and the Prisma unique constraint + transaction pattern is well-understood.

- Approach: 90%
  - Evidence: Prisma/Neon is already the Caryina DB backend. Two new models needed. No competing viable approach (DO would require new binding setup; KV lacks ACID properties needed for idempotency). Decision is clear.
  - What raises to ≥90: Already there.

- Impact: 95%
  - Evidence: These two stores are the only fs-dependent paths in the checkout flow. Migrating them enables the Worker to complete checkout end-to-end. The blast radius is contained to `checkoutIdempotency.server.ts` and `cartStore.ts` factory.
  - What raises to ≥90: Already there.

- Delivery-Readiness: 85%
  - Evidence: Schema additions are additive. All callers identified. No external dependencies to acquire. One open question (file migration) has a safe default (no backfill).
  - What raises to ≥90: Operator confirmation that no backfill is needed (resolves the only open question).

- Testability: 88%
  - Evidence: New Prisma stores can be unit-tested via Prisma mock (`jest.mock`). Existing route tests are unaffected. No E2E test changes required.
  - What raises to ≥90: Add unit tests for both new stores in the plan — already recommended.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Prisma connection latency adds >50ms to checkout path | Low | Moderate | Neon serverless connection pool is already used for inventory; observed latency is ~5-15ms per query. Checkout path is not latency-sensitive at ms scale. |
| Unique constraint race: two concurrent requests with same `idempotencyKey` both attempt `create` | Low | Moderate | DB-level unique constraint + catch `P2002` (Prisma unique violation) → return `in_progress` result. Same semantics as file lock. |
| `runtime = "nodejs"` overrides on stripe-webhook and cron routes left in place after migration | Medium | Low | Must remove these overrides as part of the plan. Flag as explicit task. |
| Cart loss during `expiresAt` expiry if cleanup job not implemented | Low | Low | Cart data is already ephemeral (MemoryCartStore). Loss acceptable. A simple `expiresAt` column check on read is sufficient; no background job required. |
| Prisma schema migration fails on live Neon DB | Low | High | Schema additions are purely additive (new tables, new indexes). No existing table is altered. Migration is safe to run against live DB. |
| Operator has outstanding `needs_review` checkout records in the JSON file | Low | Low | Worker has never succeeded in production (fs throws). No production records exist. Only local dev records, which are non-operational. |

## Planning Constraints & Notes

- Must-follow patterns:
  - All new Prisma models go to `packages/platform-core/prisma/schema.prisma` (single schema file for the monorepo).
  - `PrismaCartStore` goes in `packages/platform-core/src/cartStore/prismaStore.ts` (consistent with `memoryStore.ts`, `redisStore.ts`, `cloudflareDurableStore.ts`).
  - `PrismaCheckoutIdempotencyStore` replaces the fs implementation in `apps/caryina/src/lib/checkoutIdempotency.server.ts` — public function signatures unchanged.
  - Add `CART_STORE_PROVIDER=prisma` to `apps/caryina/wrangler.toml` `[vars]` block to activate the Prisma cart backend.
  - Remove `export const runtime = "nodejs"` from `apps/caryina/src/app/api/checkout-session/route.ts`, `apps/caryina/src/app/api/stripe-webhook/route.ts`, and `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts` after migration.
  - Must not add `import "server-only"` to any module that will run in the Cloudflare Worker runtime edge context.
- Rollout/rollback expectations:
  - Additive DB migration first, then code deploy. Rollback: revert code, delete new tables (safe — purely additive).
  - No feature flag needed — this unblocks Workers deployment; the current deployed state is already broken.
- Observability expectations:
  - Preserve all existing `recordMetric` call sites in `checkoutSession.server.ts` and `checkoutReconciliation.server.ts`.
  - Log Prisma errors at `console.error` level (matching existing pattern for fs errors).

## Suggested Task Seeds (Non-binding)

1. Add `CheckoutAttempt` model to `packages/platform-core/prisma/schema.prisma`.
2. Add `Cart` model to `packages/platform-core/prisma/schema.prisma`.
3. Run Prisma migration against Neon DB.
4. Implement `PrismaCartStore` in `packages/platform-core/src/cartStore/prismaStore.ts` (implementing `CartStore` interface).
5. Add `prisma` case to `createCartStore()` factory in `packages/platform-core/src/cartStore.ts`.
6. Add `CART_STORE_PROVIDER=prisma` to `apps/caryina/wrangler.toml`.
7. Rewrite `apps/caryina/src/lib/checkoutIdempotency.server.ts` — remove `node:fs`, `resolveDataRoot`; implement all 8 exported functions via Prisma.
8. Remove `export const runtime = "nodejs"` from `apps/caryina/src/app/api/checkout-session/route.ts`, `apps/caryina/src/app/api/stripe-webhook/route.ts`, and `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts`.
9. Add Prisma migration file (via `prisma migrate dev` locally, check in migration file).
10. Add unit tests for `PrismaCartStore`.
11. Add unit tests for the new Prisma idempotency store.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/caryina/wrangler.toml` updated with `CART_STORE_PROVIDER=prisma`
  - `packages/platform-core/prisma/schema.prisma` has `CheckoutAttempt` and `Cart` models
  - `apps/caryina/src/lib/checkoutIdempotency.server.ts` has no `node:fs` or `resolveDataRoot` imports
  - `apps/caryina/src/app/api/stripe-webhook/route.ts` has no `export const runtime = "nodejs"`
  - `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts` has no `export const runtime = "nodejs"`
  - Unit tests for `PrismaCartStore` pass in CI
  - Unit tests for Prisma idempotency store pass in CI
  - `pnpm typecheck && pnpm lint` pass
- Post-delivery measurement plan:
  - Deploy to Workers and verify `/api/cart` returns non-empty cart across requests.
  - Verify `/api/checkout-session` completes without runtime exception.
  - Monitor Neon DB connection metrics for unexpected latency.

## Evidence Gap Review

### Gaps Addressed

- Cart store abstraction fully mapped: 3 backends (memory, redis, cloudflare DO), factory, env vars, fallback chain.
- All idempotency store callers identified and confirmed (4 caller files, 8+ function call sites).
- Prisma schema reviewed in full — confirmed no `Cart` or `CheckoutAttempt` models exist.
- `wrangler.toml` reviewed in full — confirmed no DO/KV bindings, no `CART_STORE_PROVIDER`.
- `runtime = "nodejs"` overrides located and flagged.
- Existing test coverage mapped — all tests mock idempotency and cart stores, so migration is transparent.

### Confidence Adjustments

- No downward adjustments. The evidence is complete for both stores.
- Minor upward adjustment on testability: existing tests already mock the exact function signatures, confirming no test breakage from the migration.

### Remaining Assumptions

- `DATABASE_URL` Worker secret correctly points to the Neon DB that already has inventory/products data. Not independently verified (would require live deployment probe), but strongly implied by the confirmed Prisma inventory backend.
- Cart loss from MemoryCartStore during Worker isolate reuse does not affect current production users (Caryina is not yet live on Workers).
- No outstanding production `needs_review` idempotency records exist (Worker has never successfully processed checkout).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Cart store abstraction (factory + backends) | Yes | None | No |
| Idempotency store — all exported functions | Yes | None | No |
| All callers of idempotency store | Yes | None — all 4 caller files read, all call sites identified | No |
| Prisma schema — existing models, gaps | Yes | None — no Cart or CheckoutAttempt model; schema pattern clear | No |
| wrangler.toml — existing bindings and vars | Yes | None — no DO/KV; confirms `prisma` is the right addition | No |
| runtime = "nodejs" overrides | Yes | Minor: 3 checkout routes have `runtime = "nodejs"` (checkout-session, stripe-webhook, cron) — not 2 as initially noted; must all be removed as plan task | No |
| Test landscape — mock shapes and breakage risk | Yes | None — both stores are fully mocked in all tests | No |
| Data/contracts — lock semantics to DB translation | Yes | Minor: upsert + unique constraint vs file lock is conceptually different but functionally equivalent for this use case | No |
| PII / security surface | Yes | Minor: `buyerEmail` moves from local file to Neon DB — no new access control surface beyond existing `Order` table | No |
| Missing Prisma migrations path | Yes | None — `prisma db push` or migration file both viable; additive-only schema | No |

## Scope Signal

Signal: right-sized

Rationale: The change touches exactly two storage modules (`checkoutIdempotency.server.ts` and `cartStore.ts` factory + one new backend). Both use Prisma/Neon which is already active. The blast radius is fully contained. No UI, no API contract changes. Two new Prisma models. The scope is the minimum required to unblock Workers deployment for the checkout flow.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis caryina-runtime-state-workers-compat`
