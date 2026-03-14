---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: plat-payment-integration-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-IDs: IDEA-DISPATCH-20260314153000-PLAT-001,IDEA-DISPATCH-20260314153001-PLAT-002,IDEA-DISPATCH-20260314153002-PLAT-003,IDEA-DISPATCH-20260314153003-PLAT-004,IDEA-DISPATCH-20260314153004-PLAT-005,IDEA-DISPATCH-20260314153005-PLAT-006,IDEA-DISPATCH-20260314153006-PLAT-007,IDEA-DISPATCH-20260314153007-PLAT-008
Related-Plan: none
Business: PLAT
---

# Payment Integration Fixes — Micro-Build

8-task bundle fixing critical payment flow blockers (refund auth, order status), security
hardening (timing-safe comparison, fetch timeout), and operational reliability (allowlist
diagnostic, config auto-seed, dual-write logging). TASK-08 is a no-op confirmation.

## Scope
- Change: Fix PM refund bearer-token auth, write order "completed" status after payment
  success, timing-safe Axerve refund comparison, PM fetch timeout, IP allowlist diagnostic,
  ShopPaymentConfig auto-seed, dual-write failure logging with context.
- Non-goals: UI changes, Stripe webhook handling, schema migrations, Axerve live connection tests.

## Tasks

### TASK-01 (P1) — PM refund auth: accept bearer token
- Status: Complete (2026-03-14)
- Affects:
  - `apps/payment-manager/src/app/api/refunds/route.ts`
  - `apps/payment-manager/src/lib/auth/session.ts`
- Acceptance checks:
  - POST /api/refunds with valid `CARYINA_PM_TOKEN` Bearer token is accepted (not 401)
  - POST /api/refunds with valid session cookie is still accepted
  - POST /api/refunds with neither token nor cookie returns 401

### TASK-02 (P1) — Order status set to "completed" after payment success
- Status: Complete (2026-03-14)
- Affects:
  - `apps/caryina/src/lib/checkoutSession.server.ts`
  - `apps/caryina/src/lib/payments/stripeCheckout.server.ts`
- Acceptance checks:
  - `handleSuccessfulPayment()` fires a second pmOrderDualWrite with `status: "completed"`
  - `completeStripeFinalization()` fires a pmOrderDualWrite with `status: "completed"`
  - Both calls are fire-and-forget (never throw into caller's critical path)

### TASK-03 (P1) — Axerve refund timing-safe comparison
- Status: Complete (2026-03-14)
- Affects:
  - `apps/caryina/src/app/api/internal/axerve-refund/route.ts`
- Acceptance checks:
  - Token comparison uses `crypto.timingSafeEqual` (Node.js buffer comparison)
  - Plain `token !== expectedToken` is removed

### TASK-04 (P1) — Checkout fetch timeout
- Status: Complete (2026-03-14)
- Affects:
  - `apps/caryina/src/lib/payments/provider.server.ts`
- Acceptance checks:
  - PM fetch call includes `signal: AbortSignal.timeout(8000)`
  - AbortError falls through to env-var fallback (already handled by catch block)

### TASK-05 (P2) — IP allowlist diagnostic on missing config
- Status: Complete (2026-03-14)
- Affects:
  - `apps/payment-manager/src/lib/auth/accessControl.ts`
- Acceptance checks:
  - When `PAYMENT_MANAGER_ALLOWED_IPS` is unset/empty, a warn-level structured log is emitted once (not on every request)
  - Log includes `event: "ip_allowlist_unconfigured"` and a clear message

### TASK-06 (P2) — ShopPaymentConfig auto-seed on first access
- Status: Complete (2026-03-14)
- Affects:
  - `apps/payment-manager/src/app/api/internal/shop-config/route.ts`
- Acceptance checks:
  - GET /api/internal/shop-config?shopId=<new> creates a default row (`activeProvider: "axerve"`) and returns it
  - Subsequent calls return the same row (upsert idempotent)

### TASK-07 (P2) — Dual-write failure logging with context
- Status: Complete (2026-03-14)
- Affects:
  - `apps/caryina/src/lib/checkoutSession.server.ts`
  - `apps/caryina/src/lib/payments/stripeCheckout.server.ts` (TASK-02 adds dual-write here)
- Acceptance checks:
  - catch handlers for pmOrderDualWrite log orderId, shopId, and error message
  - No silent failures

### TASK-08 (P3) — Coherence warning persistence (no-op confirmation)
- Status: Complete (2026-03-14) — confirmed no-op. `pmLog("warn", ...)` in accessControl.ts emits JSON via console.warn, captured by `wrangler tail --format json` and retained 7 days in CF Logs. Already persisted.
- Affects: none (read-only investigation)
- Acceptance checks:
  - Confirm coherence warning already uses `pmLog("warn", ...)` which emits to CF Logs via wrangler tail
  - If already persisted: close as confirmed no-op

## Execution Contract
- Validation commands: `pnpm --filter @acme/payment-manager typecheck && pnpm --filter @acme/payment-manager lint && pnpm --filter caryina typecheck && pnpm --filter caryina lint`
- Rollback note: All changes are additive or narrow auth logic changes. Rollback = revert commits.

## Outcome Contract
- **Why:** Refunds are completely non-functional — blocked by both auth mismatch and order status never updating. Payment data is also at risk from a timing attack on the internal Axerve refund endpoint.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 8 blockers/risks identified in the portfolio audit are remediated. Refunds flow end-to-end for both Stripe and Axerve orders.
- **Source:** operator
