---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: payment-manager-post-build-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-IDs: IDEA-DISPATCH-20260314120000-0001,IDEA-DISPATCH-20260314120001-0002,IDEA-DISPATCH-20260314120002-0003,IDEA-DISPATCH-20260314120003-0004,IDEA-DISPATCH-20260314120004-0005,IDEA-DISPATCH-20260314120005-0006,IDEA-DISPATCH-20260314120006-0007,IDEA-DISPATCH-20260314120007-0008,IDEA-DISPATCH-20260314120008-0009
Related-Plan: docs/plans/_archive/payment-management-app/plan.md
Business: PLAT
---

# Payment Manager Post-Build Fixes

Nine issues identified in a post-build audit of apps/payment-manager/ and its Caryina
integration. Bundled into a single build cycle.

## Scope

### Tasks

| # | Priority | Status | Summary |
|---|---|---|---|
| TASK-01 | P1 | Pending | Fix refund currency: remove non-existent `currency` field from Refund select; pass `order.currency` to each refund in API response |
| TASK-02 | P1 | Pending | Fix env var mismatch: `PAYMENT_MANAGER_SERVICE_URL` → `PAYMENT_MANAGER_URL` in pmOrderDualWrite.server.ts |
| TASK-03 | P2 | Pending | Add `(dashboard)/layout.tsx` with server-side session guard + nav |
| TASK-04 | P2 | Pending | Document Refund.shopId invariant in Prisma schema |
| TASK-05 | P3 | Pending | Wire `createOrUpdateOrder` lib into internal orders route; delete inline duplicate |
| TASK-06 | P3 | N/A | stripeRefund.server.ts does not exist — no-op (audit false positive) |
| TASK-07 | P3 | Pending | Axerve credential test: change silent ok: true to explicit liveTestSkipped response |
| TASK-08 | P3 | Pending | Rate limiter: add per-isolate scope comment |
| TASK-09 | P3 | N/A | Schema typo: line 412 already uses `///` (valid Prisma doc comment) — no-op |

### Non-goals
- Schema migrations (no new columns added)
- Axerve live SOAP test (blocked by CF Workers runtime)
- Any UI redesign beyond the nav shell

## Execution Contract

- Affects (primary):
  - `apps/payment-manager/src/app/api/orders/[orderId]/route.ts`
  - `apps/caryina/src/lib/pmOrderDualWrite.server.ts`
  - `apps/payment-manager/src/app/(dashboard)/layout.tsx` (new)
  - `packages/platform-core/prisma/schema.prisma`
  - `apps/payment-manager/src/app/api/internal/orders/route.ts`
  - `apps/payment-manager/src/app/api/shops/[shopId]/credentials/[provider]/test/route.ts`
  - `apps/payment-manager/src/lib/auth/rateLimit.ts`
- Affects (readonly):
  - `apps/payment-manager/src/app/(dashboard)/orders/[orderId]/page.tsx`
  - `apps/payment-manager/src/lib/orders/createOrUpdateOrder.ts`
  - `apps/payment-manager/src/lib/auth/session.ts`
- Acceptance checks:
  - Refund history in order detail renders with correct currency
  - PM dual-write fires on Caryina checkout (reads PAYMENT_MANAGER_URL)
  - Dashboard pages redirect to /login when unauthenticated (server-side)
  - Sidebar nav visible on all dashboard pages
  - Refund.shopId invariant documented in schema
  - createOrUpdateOrder is wired as canonical upsert; inline duplicate removed
  - Axerve credential test returns explicit liveTestSkipped: true
  - rateLimit.ts has per-isolate scope comment
- Validation commands:
  - `pnpm --filter @acme/payment-manager typecheck`
  - `pnpm --filter @apps/caryina typecheck`
  - `pnpm --filter @acme/platform-core typecheck`
- Rollback note: All changes are additive or narrowly scoped; revert individual commits if needed.

## Outcome Contract

- **Why:** Post-build audit identified 2 critical bugs (refunds broken, orders never recorded) plus security gaps, dead code, and UX gaps in the newly deployed Payment Manager. These fixes make the tool reliable and usable for day-to-day refund operations.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Payment Manager correctly records orders from Caryina checkouts, displays refund amounts with accurate currency, has a navigable dashboard with server-side auth on every page, and has no misleading dead code paths.
- **Source:** operator
