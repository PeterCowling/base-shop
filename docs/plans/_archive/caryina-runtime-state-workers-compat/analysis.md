---
Type: Analysis
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-runtime-state-workers-compat
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/caryina-runtime-state-workers-compat/fact-find.md
Related-Plan: docs/plans/caryina-runtime-state-workers-compat/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Caryina Runtime State Workers Compatibility Analysis

## Decision Frame

### Summary

Caryina deploys to Cloudflare Workers (`wrangler.toml` confirmed, `DB_MODE=prisma`, `INVENTORY_BACKEND=prisma`). Two stores in the checkout flow are incompatible with the Workers runtime:

1. **Checkout idempotency store** (`checkoutIdempotency.server.ts`) — pure `fs` read/write/lock. Throws `EROFS` on every checkout attempt.
2. **Cart backend** — `MemoryCartStore` default. Per-isolate Map: cart state is nondurably tied to the isolate instance. Because Cloudflare spins multiple isolates and doesn't guarantee routing to the same one, add-to-cart and subsequent checkout requests will often hit different isolates with empty carts. State is lost across isolate recycles (cold starts, time-based expiry).

This analysis decides the replacement storage backend for each store. Both must be Workers-compatible. Prisma/Neon is already active for Caryina (inventory, products, orders, StripeWebhookEvent).

### Goals

- Replace fs-based idempotency store with a Workers-compatible backend.
- Replace per-isolate `MemoryCartStore` with a persistent, Workers-compatible backend for Caryina.
- Both replacements must preserve existing function signatures and not alter public API contracts.
- Preserve existing test mock shapes (no test breakage).

### Non-goals

- Changing the `CartStore` interface.
- Adding Workers-compatible backends to other shops.
- Migrating the Redis/DO cart backends already in `platform-core`.
- Changing the checkout API contracts or cart cookie scheme.

### Constraints & Assumptions

- Constraints:
  - Prisma/Neon is already active. `DATABASE_URL` Worker secret is configured.
  - Schema additions go to `packages/platform-core/prisma/schema.prisma`; migrations checked in to `packages/platform-core/prisma/migrations/`.
  - `MemoryCartStore`, `RedisCartStore`, `CloudflareDurableObjectCartStore` must continue working for other shops/tests.
  - `export const runtime = "nodejs"` on checkout routes does not itself block Workers deployment (OpenNext with `nodejs_compat` already supports it). These overrides were added because of the `node:fs` dependency, but `checkoutSession.server.ts` also calls `sendSystemEmail` via `notifications.server.ts`, which depends on `emailService.ts` → `createRequire` from `node:module`. This is an additional Node.js-only dependency. Removing the overrides after the `node:fs` migration is therefore **not guaranteed to be safe** without verifying whether the email path also needs `runtime = "nodejs"`. The override removal is **descoped from this migration** — it should be verified separately. The goal of this migration is to eliminate the `node:fs` blocker; the `runtime` declarations are a separate concern.
  - `CART_STORE_PROVIDER` is validated by Zod enum `["redis", "cloudflare", "memory"]` in `packages/config/src/env/auth.ts` (`storeProviderSchema`). Adding `"prisma"` to `wrangler.toml` without extending this enum will cause env parse failure. The enum extension is a required migration step.
  - Tests run CI-only; never run Jest locally.
- Assumptions:
  - No production checkout records exist in the JSON file (Worker has never succeeded — fs crashes on first attempt).
  - Cart loss during migration is acceptable (MemoryCartStore already offers zero persistence).
  - Caryina traffic volume does not require sub-5ms cart latency (hostel boutique, not high-volume SaaS).

## Inherited Outcome Contract

- **Why:** Two pieces of Caryina checkout state use the file system for storage, which is incompatible with Cloudflare Workers. Every checkout attempt currently throws on the idempotency store, and cart state is lost between requests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both the checkout idempotency store and the cart backend are migrated to Workers-compatible Prisma/Neon storage; no fs calls remain in either checkout path; deployed Worker can complete a checkout end-to-end without a runtime exception.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/caryina-runtime-state-workers-compat/fact-find.md`
- Key findings used:
  - `wrangler.toml` has no KV or Durable Object bindings; has `DB_MODE=prisma` and `INVENTORY_BACKEND=prisma`.
  - `CloudflareDurableObjectCartStore` exists in `platform-core` but is not bound for Caryina.
  - `checkoutIdempotency.server.ts` exports 10 symbols: 1 interface, 1 type, 1 pure function (`buildCheckoutRequestHash`), and 9 async I/O functions. Of the 9 async functions, 6 use `withStoreLock` (begin/mark/record functions) and 3 use `readStore` directly without a lock (`findCheckoutAttemptByStripeSessionId`, `findCheckoutAttemptByShopTransactionId`, `listStaleInProgressCheckoutAttempts` — read-only paths).
  - All idempotency callers are confined to `apps/caryina/src/` — no external consumers.
  - `packages/platform-core/prisma/schema.prisma` has no `Cart` or `CheckoutAttempt` models.
  - Migration directory exists at `packages/platform-core/prisma/migrations/` with 5 timestamped files.
  - 3 checkout routes have `export const runtime = "nodejs"`: `checkout-session/route.ts`, `stripe-webhook/route.ts`, `cron/checkout-reconciliation/route.ts`.
  - `CheckoutAttemptRecord` maps cleanly to a Prisma model — 15 typed fields, `responseBody` as `Json`.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Workers runtime compatibility | Non-negotiable — must work in Cloudflare Workers with `nodejs_compat` flag | Must-have |
| Consistency with existing Caryina data layer | Adding a new binding or service means new secrets/config/ops overhead; Prisma is already there | High |
| Idempotency atomicity | Double-charge prevention requires mutual exclusion — weak atomicity is unacceptable | High |
| Implementation effort | Team size is small; prefer smallest safe delta | Medium |
| Cart data durability | Cart survives isolate recycles; 30-day TTL acceptable | High |
| Test seam quality | Existing tests must remain valid; new implementations need unit coverage | Medium |
| Rollback simplicity | Caryina is not yet in production on Workers; rollback is code revert | Low |

## Options Considered

### Idempotency Store Options

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Prisma/Neon | Replace `withStoreLock`+fs with Prisma `create`/`upsert` + unique constraint on `(shopId, idempotencyKey)`. Use `prisma.$transaction` for `beginStripeCheckoutFinalization` finalizing state. | Uses existing DB; no new infrastructure; ACID transactions; full query capability (stale scan, status lookup by sessionId). | Adds ~5-15ms latency per idempotency operation vs. fs (fs was sequential and slow anyway at 50ms retry loops). | Prisma connection pool exhaustion under burst load; unique constraint collision handling must cover P2002. | Yes — **recommended** |
| B — Cloudflare KV | Store each attempt as a KV entry keyed by `{shopId}:{idempotencyKey}`. Use `ifMatch` conditional put for optimistic locking. | Native Workers primitive; very low latency reads. | KV is eventually consistent (up to 60s propagation delay across regions). "acquired" status written in one isolate may not be visible to another for up to 60s — double-charge window exists. No atomic read-modify-write. | Eventual consistency is a fatal flaw for payment idempotency. | No — eliminated |
| C — Cloudflare Durable Objects | Per-key or per-shop DO handles the lock and store. | Strongly consistent per DO; zero cross-isolate state issues. | Requires declaring a DO class and binding in `wrangler.toml`. DO class must be deployed as part of the Worker. Adds significant infra complexity. Overkill when Neon is already available and strongly consistent. | New DO binding = new deployment surface; DO storage is not queryable (no `listStaleInProgress` scan equivalent without extra design). | No — eliminated |
| D — Upstash Redis | Use Redis with `SET NX` for lock + Redis hash for record. | Strongly consistent; fast. | Requires new `UPSTASH_REDIS_REST_URL`/`TOKEN` secrets; new infrastructure to provision and pay for. Zero existing Redis configuration in Caryina. | Adding new infrastructure when Neon is already available and sufficient. | No — eliminated |

### Cart Store Options

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Prisma/Neon | Add a `Cart` model to the schema. `PrismaCartStore` implements `CartStore` interface. Activated via `CART_STORE_PROVIDER=prisma` env var in `wrangler.toml`. | Consistent with all other Caryina data; no new bindings; cart data queryable; TTL via `expiresAt` column checked on read. | ~5-15ms per cart operation (already paid for checkout context). Cart CRUD is called per user interaction (add-to-cart, view cart) — latency is perceptible but within acceptable range for boutique volume. | N+1 risk on cart page if multiple reads occur per render — mitigated by single `getCart` call pattern. | Yes — **recommended** |
| B — Cloudflare Durable Objects | Use `CloudflareDurableObjectCartStore` (already implemented in `platform-core`). Bind `CART_DO` namespace in `wrangler.toml`. Deploy `CartDurableObject` class. | Zero latency vs. network DB; per-cart DO isolation; TTL handled in DO storage. | Requires new DO binding in `wrangler.toml` + deploying `CartDurableObject` class. DO storage has per-key limits; not queryable. `CartDurableObject` class must be exported from Worker bundle. More complex deployment. Already implemented but not battle-tested for Caryina. | Two-class Worker deployment (Worker + DO); new billing surface; cannot query "all carts for a shop". | No — viable but not recommended. Prisma is simpler and already present; DO adds operational overhead for no material gain at Caryina's scale. |
| C — Upstash Redis | Use `RedisCartStore` (already implemented in `platform-core`). Add `UPSTASH_REDIS_REST_URL`/`TOKEN` env vars. | Good latency; TTL built-in via Redis `EXPIRE`. | Requires new infrastructure, new secrets. `.env.example` has no Redis vars for Caryina. Zero existing Redis config. | New service dependency for a shop that already has Neon; ongoing Redis subscription cost; more secrets to manage. | No — eliminated |
| D — Remain on MemoryCartStore | Status quo — accept that cart is per-isolate. | No change required. | Cart is lost between most requests. "Add to cart" and "checkout" hit different isolates. Checkout always fails with "Cart is empty". | This is the bug. Not viable. | No — eliminated |

## Engineering Coverage Comparison

| Coverage Area | Option A (Prisma/Neon — both stores) | Option B (DO for cart / KV or Redis for idempotency) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — no UI change | N/A — no UI change | N/A |
| UX / states | N/A — API response shapes unchanged | N/A — API response shapes unchanged | N/A |
| Security / privacy | `buyerEmail` and transaction metadata move to Neon DB — same access control as `Order` table (DATABASE_URL secret). No new PII exposure surface. | DO/KV: data scattered across bindings; no unified audit trail alongside orders. Redis: new external service in the PII data path. | Prisma centralises PII alongside existing order data, consistent access control. |
| Logging / observability / audit | Existing `recordMetric` calls preserved. Prisma errors logged at `console.error`. Cart errors loggable at same level. | DO/KV/Redis errors require different error handling patterns. | Prisma error handling follows existing codebase pattern. |
| Testing / validation | New `PrismaCartStore` and `PrismaCheckoutIdempotencyStore` unit-tested via Prisma mock. Existing route tests unchanged (mock shapes identical). | DO/KV: unit testing requires Miniflare or DO mock harness — more complex. | Prisma mock is simpler and consistent with existing test patterns. |
| Data / contracts | Two new Prisma models, additive migration. `CheckoutAttemptRecord` fields map 1:1. Cart stored as JSON column. Migration is additive-only. `storeProviderSchema` enum in `packages/config/src/env/auth.ts` must be extended to include `"prisma"`. | DO: no DB migration needed but state is opaque. KV: no schema. | Prisma gives a typed, queryable, auditable schema. Stale attempt scan (`listStaleInProgressCheckoutAttempts`) maps directly to a DB query. Enum extension is a required code change in `packages/config`. |
| Performance / reliability | ~5-15ms Neon latency per operation. Idempotency: 2-4 DB calls per checkout (begin, mark reservation, mark payment, mark result). Cart: 1-2 DB calls per cart interaction. Prisma connection pool handles concurrency. P2002 (unique violation) caught and mapped to `in_progress` / `conflict` response. | DO: sub-ms for cart reads; suitable for high-frequency add-to-cart. Idempotency KV: eventually consistent — unacceptable. | Prisma latency is acceptable for Caryina's boutique volume. Atomicity is correct. |
| Rollout / rollback | Additive schema migration → code deploy → remove `nodejs` runtime overrides. Rollback: revert code + optionally drop new tables (additive-only). No feature flag needed. | More complex — DO binding requires `wrangler.toml` change + new class export; rollback involves removing DO binding while potentially losing in-flight cart state. | Prisma rollout is simpler and safer. |

## Chosen Approach

- **Recommendation:** Option A — Prisma/Neon for both stores (single unified approach).
- **Why this wins:**
  - Prisma/Neon is already the Caryina data layer. `DATABASE_URL` is configured. No new infrastructure, no new secrets, no new bindings.
  - ACID transactions via Prisma handle idempotency atomicity correctly (`@@unique` constraint + `P2002` catch = same mutual exclusion as the file lock, without the fs dependency).
  - `listStaleInProgressCheckoutAttempts` maps directly to a DB query — cannot be reproduced with KV or DO without significant extra design.
  - Test seams: Prisma mock is standard in this codebase; DO/KV would require Miniflare mock harness.
  - Single deployment model: one DB, one connection, consistent error handling.
- **What it depends on:**
  - `DATABASE_URL` correctly configured in the Worker (confirmed by existing inventory/products Prisma usage).
  - Prisma connection pool suitable for Workers concurrency (Neon serverless driver with HTTP transport — already the pattern used by `INVENTORY_BACKEND=prisma`).
  - Additive migration applied to Neon DB before code deploy.

### Rejected Approaches

- **KV for idempotency** — eliminated: KV is eventually consistent. A double-write window exists where two concurrent checkout attempts with the same `idempotencyKey` could both be told "acquired," leading to double-charging. Fatal for a payment idempotency gate.
- **Durable Objects for cart** — viable but not recommended: `CloudflareDurableObjectCartStore` is already implemented and would work. However, it requires a new `CART_DO` binding in `wrangler.toml`, deploying a `CartDurableObject` class alongside the Worker, and adds ongoing operational complexity. The DO approach buys sub-ms cart reads at the cost of deployment complexity — an unnecessary trade for Caryina's boutique traffic volume where Neon latency is acceptable.
- **Upstash Redis** — eliminated for both stores: requires new infrastructure, new secrets (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), and a new external service dependency. No existing Redis configuration exists for Caryina. Adding it when Neon is already present and sufficient adds cost and operational overhead.
- **MemoryCartStore (status quo)** — eliminated: this is the bug. Cart state is lost between requests in Workers.

### Open Questions (Operator Input Required)

- Q: Should `checkout-idempotency.json` data be migrated to the new `CheckoutAttempt` table on first deploy?
  - Why operator input required: This depends on whether any outstanding `needs_review` records in the local JSON file require continuity. The agent's default is no backfill (the Worker has never succeeded in production, so there are no production records).
  - Planning impact: If operator confirms no backfill needed, no data migration script is required. Plan proceeds with schema-only migration.
  - **Default assumption (safe to proceed with):** No backfill required. Planning will proceed with schema-only migration unless operator specifies otherwise before build begins.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Cart CRUD (`/api/cart`) | `MemoryCartStore` — per-isolate Map, lost between requests | User adds/removes item | `PrismaCartStore.incrementQty` → Prisma `upsert` on `Cart` row (keyed by cart UUID) with `expiresAt` TTL check. Cart persists across isolate recycles for 30 days. | Cart cookie scheme, cart UUID generation, `CartStore` interface, all other shops | Prisma connection latency (~5-15ms) is new per cart CRUD call; acceptable at boutique volume |
| Cart read at checkout | `getCart(cartId)` → `MemoryCartStore.getCart` → empty `{}` (usually — nondeterministic per-isolate) | Customer submits checkout | `getCart(cartId)` → `PrismaCartStore.getCart` → DB read → returns populated `CartState` | No change to `cartId` cookie or cart parsing logic | If `DATABASE_URL` not set and `CART_STORE_PROVIDER=prisma`, `db.ts` returns `missingPrismaClient()` proxy which throws on first DB call — no automatic fallback to memory. Dev `.env.local` must include `DATABASE_URL` or `CART_STORE_PROVIDER` must not be set in dev. |
| Cart delete on success | `deleteCart(cartId)` → no-op (MemoryCartStore already empty) | Payment succeeds | `deleteCart(cartId)` → `PrismaCartStore.deleteCart` → DB delete of Cart row | No change to checkout success response | None — additive improvement |
| Checkout idempotency gate | `beginCheckoutAttempt` → `withStoreLock` → `fs.open` → crash (`EROFS` on Workers) | Every checkout POST | `beginCheckoutAttempt` → Prisma `create` with `@@unique([shopId, idempotencyKey])` → on `P2002` violation, read existing record and return `in_progress` or `conflict` result. Semantics identical to file lock. | Public function signatures unchanged; all 4 caller files unchanged | Must catch `P2002` (Prisma unique constraint error) in `beginCheckoutAttempt` and map to correct `BeginCheckoutAttemptResult` variant |
| Checkout idempotency updates | All `markCheckoutAttempt*` / `recordCheckoutAttempt*` functions → `withStoreLock` → fs → crash | Mid-checkout state transitions | Prisma `update` on `CheckoutAttempt` row filtered by `idempotencyKey` and `shopId`. No locking needed for updates (record already exists; individual field updates are atomic enough). | All callers in `checkoutSession.server.ts`, `stripeCheckout.server.ts`, `checkoutReconciliation.server.ts` unchanged | Missing record (record not found) must be handled gracefully — same as current fs behaviour where missing record returns silently |
| Stripe finalization locking | `beginStripeCheckoutFinalization` → `withStoreLock` → sets `status = "finalizing"` atomically | `checkout.session.completed` webhook | `prisma.$transaction` to SELECT + UPDATE `status` = `"finalizing"` atomically on the row matching `stripeSessionId`. Returns `acquired`/`busy`/`already_finalized`/`no_match` variants. | `stripeCheckout.server.ts` caller unchanged; same 4-variant result type | `prisma.$transaction` adds one more round-trip; acceptable for webhook path |
| Stale checkout reconciliation | `listStaleInProgressCheckoutAttempts` → fs read → scan array | Cron POST `/api/cron/checkout-reconciliation` | `prisma.checkoutAttempt.findMany` where `status IN ("in_progress", "finalizing") AND updatedAt < staleCutoff` — direct DB query. | `checkoutReconciliation.server.ts` caller unchanged | `runtime = "nodejs"` on cron route must be removed as part of this migration |
| Route runtime overrides | 3 routes have `export const runtime = "nodejs"` (checkout-session, stripe-webhook, cron) | These routes currently declare Node.js runtime (works with OpenNext + `nodejs_compat`; not itself a Workers blocker) | After fs dependency removed, `node:fs` is no longer a reason for the override. However, `checkout-session` also depends on `sendSystemEmail` → `emailService.ts` → `createRequire` (Node.js-only). Removing overrides from checkout routes is **out of scope** for this migration. Cron (`checkout-reconciliation`) and stripe-webhook routes do not use email in their main paths and may be safe to update, but this should be verified separately. | Public behaviour unchanged; overrides are not the root cause of checkout breakage | Override removal is descoped; plan should not include it as a task unless email path is independently verified. |
| Config schema | `CART_STORE_PROVIDER` Zod enum is `["redis", "cloudflare", "memory"]` | `wrangler.toml` sets `CART_STORE_PROVIDER=prisma` | Enum extended to `["redis", "cloudflare", "memory", "prisma"]` in `packages/config/src/env/auth.ts`. Factory reads the value and routes to `PrismaCartStore`. | Other shops not affected (they do not use `prisma` value) | Must ship enum extension before or with the `wrangler.toml` var change — sequencing constraint |

## Planning Handoff

- Planning focus:
  - Two new Prisma models: `CheckoutAttempt` and `Cart`. Key design notes:
    - `CheckoutAttempt`: fields map 1:1 to `CheckoutAttemptRecord`. `@@unique([shopId, idempotencyKey])`, `@@index([shopId])`, `@@index([stripeSessionId])`, `@@index([shopTransactionId])`, `@@index([status, updatedAt])`. `responseBody` as `Json`.
    - `Cart`: keyed by UUID (`id String @id`). **No `shopId` field** — the `CartStore` interface carries no shop context; carts are globally unique by UUID. Fields: `id`, `data Json` (CartState), `expiresAt DateTime`. `@@index([expiresAt])` for future cleanup queries.
  - `PrismaCheckoutIdempotencyStore`: drop-in replacement for all 9 I/O async functions in `checkoutIdempotency.server.ts` (`beginCheckoutAttempt`, `markCheckoutAttemptReservation`, `recordCheckoutAttemptStripeSession`, `markCheckoutAttemptPaymentAttempted`, `markCheckoutAttemptResult`, `beginStripeCheckoutFinalization`, `findCheckoutAttemptByStripeSessionId`, `findCheckoutAttemptByShopTransactionId`, `listStaleInProgressCheckoutAttempts`). The 10th export `buildCheckoutRequestHash` is a pure crypto function with no I/O — it stays as-is. Must preserve all existing function signatures exactly.
  - `PrismaCartStore` in `packages/platform-core/src/cartStore/prismaStore.ts`: implements `CartStore` interface (7 methods). Add `prisma` case to `createCartStore()` factory.
  - Extend `storeProviderSchema` in `packages/config/src/env/auth.ts` to `z.enum(["redis", "cloudflare", "memory", "prisma"])`. This is required before `CART_STORE_PROVIDER=prisma` in `wrangler.toml` can be parsed without an env validation error.
  - `CART_STORE_PROVIDER=prisma` var in `apps/caryina/wrangler.toml` — only add **after** the enum extension is deployed.
  - Prisma migration file — additive only; timestamp format must match existing files (e.g. `20260314NNNNNN_add_checkout_attempt_and_cart`).
  - Remove `export const runtime = "nodejs"` from 3 routes — **only after** fs dependency is removed.
  - Unit tests for both new backends.
- Validation implications:
  - `pnpm typecheck && pnpm lint` must pass (CI gate).
  - CI Jest tests must pass (existing checkout route and reconciliation tests remain valid — they mock both stores entirely).
  - New unit tests for `PrismaCheckoutIdempotencyStore` and `PrismaCartStore` added in this migration.
  - No E2E test changes required.
- Sequencing constraints:
  - Schema migration → code deploy. `runtime = "nodejs"` override removal is **descoped from this migration** (checkout-session still depends on `sendSystemEmail` → `emailService.ts` → `createRequire`, a Node.js-only API). Do not include override removal as a plan task.
  - `PrismaCartStore` must be in `packages/platform-core` (not `apps/caryina`) to follow the existing `cartStore/` pattern. `CART_STORE_PROVIDER=prisma` activates it.
  - The Prisma client import in `PrismaCheckoutIdempotencyStore` must use the existing platform-core Prisma client singleton (same client used by inventory, orders — avoids connection pool exhaustion).
- Risks to carry into planning:
  - `P2002` catch: `beginCheckoutAttempt` must handle Prisma unique constraint violations as a race condition, not an error. Plan must specify this explicitly.
  - `beginStripeCheckoutFinalization` requires atomic `SELECT + UPDATE` — plan must use `prisma.$transaction` with `SELECT FOR UPDATE` semantics (Prisma interactive transactions or optimistic locking pattern).
  - Cart TTL: `expiresAt` column checked on read (no background cleanup job required for MVP; expired carts simply return empty state on next read). Plan must note cleanup is deferred.
  - Existing `server-only` import in `checkoutIdempotency.server.ts` — retain it. `PrismaCheckoutIdempotencyStore` is server-only.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `P2002` race condition in `beginCheckoutAttempt` (two concurrent POSTs with same key) | Low | High (double-charge) | Requires code-level implementation (catch + re-read logic) | Plan must specify explicit P2002 catch → re-read → return `in_progress` result |
| `beginStripeCheckoutFinalization` non-atomic update window | Low | High (duplicate finalization) | Requires code-level implementation (transaction) | Plan must mandate `prisma.$transaction` for this function |
| `runtime = "nodejs"` overrides not removed in this migration | Low | Low | Override removal descoped: `checkout-session` still depends on `sendSystemEmail` → `emailService.ts` → Node.js `createRequire`. Removing the override before verifying the full email path would risk Workers incompatibility. | Plan must not include override removal as a task; document as a follow-up. |
| Config enum not extended before `CART_STORE_PROVIDER=prisma` set in wrangler.toml | Medium | High (env parse failure — app refuses to start) | Requires code change to `packages/config/src/env/auth.ts` | Plan must include enum extension as a prerequisite task before the `wrangler.toml` var is added |
| Prisma connection pool exhaustion under burst | Very low | Medium | Neon serverless HTTP driver is connection-pooled at the platform level; Caryina is boutique volume | Monitor after deploy; no pre-emptive action needed |
| Cart TTL cleanup accumulation | Very low | Low | Expired Cart rows accumulate in Neon DB without a cleanup job | Deferred — add note to plan that a periodic delete is a follow-up item, not a blocker |

## Planning Readiness

- Status: Go
- Rationale: Chosen approach is decisive (Prisma/Neon for both stores). All options compared with explicit elimination rationale. Engineering coverage comparison complete. No unresolved blockers — the open operator question (JSON backfill) has a safe default (no backfill) that allows planning to proceed. End-state operating model documented area by area. All three planning gates pass.
