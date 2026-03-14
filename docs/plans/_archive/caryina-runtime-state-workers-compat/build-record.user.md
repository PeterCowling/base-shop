# Build Record: caryina-runtime-state-workers-compat

**Date:** 2026-03-14
**Status:** Complete

## Outcome Contract

- **Why:** Two pieces of Caryina checkout state used the filesystem for storage, which is incompatible with Cloudflare Workers. Every checkout attempt threw on the idempotency store, and cart state was lost between Worker isolate instances.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both the checkout idempotency store and the cart backend are migrated to Workers-compatible Prisma/Neon storage; no fs calls remain in either checkout path; deployed Worker can complete a checkout end-to-end without a runtime exception.
- **Source:** operator

## What Was Built

All 8 tasks completed across 3 commit waves:

**Wave 1 (TASK-01 + TASK-02)** — commit `7c362d3d61`
- Extended `storeProviderSchema` Zod enum in `packages/config/src/env/auth.ts` to accept `"prisma"` alongside `"redis" | "cloudflare" | "memory"`
- Added `CheckoutAttempt` and `Cart` Prisma models to `packages/platform-core/prisma/schema.prisma`
- Checked in additive migration `20260314010000_add_checkout_attempt_and_cart/migration.sql`

**Wave 2 (TASK-03 + TASK-05)** — commit `927f53ac47`
- Implemented `PrismaCartStore` in `packages/platform-core/src/cartStore/prismaStore.ts` — all 7 `CartStore` interface methods, expiry-checked reads, P2025-tolerant delete, read-modify-write for qty mutations
- Rewrote `apps/caryina/src/lib/checkoutIdempotency.server.ts` — removed all `node:fs`, `withStoreLock`, `resolveDataRoot`; replaced with Prisma CRUD; `buildCheckoutRequestHash` retained using `crypto` (valid under `nodejs_compat`); optimistic create + P2002 catch for idempotency gate; `updateMany` for all state transitions; `findFirst`+`update(by id)` for `beginStripeCheckoutFinalization`

**Wave 3 (TASK-04 + TASK-06 + TASK-07)** — commit `8c20717f57`
- Added `PrismaCartStore` import and factory branch (`if (backend === "prisma")`) to `packages/platform-core/src/cartStore.ts`; updated `CartStoreOptions.backend` union
- Added `CART_STORE_PROVIDER = "prisma"` to `apps/caryina/wrangler.toml`
- Added unit test suite `apps/caryina/src/lib/checkoutIdempotency.test.ts` — mocks `@acme/platform-core/db` at module boundary; covers all 9 exported async functions

TASK-06 (`packages/platform-core/src/cartStore/__tests__/prismaStore.test.ts`) landed in an earlier commit (`e120e97f13`) that was already on the branch.

**TASK-08 CHECKPOINT** — verified clean:
- Typecheck: 0 errors across `@acme/config`, `@acme/platform-core`, `@apps/caryina`
- Lint: 0 errors (9 pre-existing warnings in unrelated files, none in scope)
- Prisma schema: valid (`prisma validate` passes)
- No `node:fs`, `withStoreLock`, or `resolveDataRoot` remain in `checkoutIdempotency.server.ts`
- `CART_STORE_PROVIDER = "prisma"` confirmed in `wrangler.toml`
- Both test files exist and are non-empty

## Engineering Coverage Evidence

| Coverage Area | Status | Evidence |
|---|---|---|
| UI / visual | N/A | Pure server-side storage layer swap; no UI files changed |
| UX / states | N/A | API response shapes unchanged; customers see no different behaviour |
| Security / privacy | Covered | `buyerEmail` and transaction metadata now in Neon DB under same access control as `Order` table; no new PII surface |
| Logging / observability / audit | Covered | Existing `recordMetric` call sites preserved; Prisma errors at `console.error` |
| Testing / validation | Covered | Unit tests for both new backends (TC-01–TC-13 in `checkoutIdempotency.test.ts`, TC-01–TC-09 in `prismaStore.test.ts`) |
| Data / contracts | Covered | Two new Prisma models, additive migration, enum extension |
| Performance / reliability | Covered | P2002 uniqueness enforcement; `updateMany` for silent no-ops; `findFirst+update` for finalization locking |
| Rollout / rollback | Covered | Additive migration; rollback is `wrangler.toml` revert + optional table drop |

## Workflow Telemetry Summary

Stages executed: `lp-do-fact-find` → `lp-do-analysis` → `lp-do-plan` → `lp-do-build`
Modules loaded: `outcome-a-code.md`, `analyze-code.md`, `plan-code.md`, `build-code.md`, `build-validate.md`
Deterministic checks passed: `validate-fact-find.sh`, `validate-engineering-coverage.sh`, `validate-analysis.sh`, `validate-plan.sh`
Commits: 3 wave commits + 1 checkpoint review
