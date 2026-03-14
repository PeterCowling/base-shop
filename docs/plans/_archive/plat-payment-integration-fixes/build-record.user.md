# Payment Integration Fixes — Build Record

**Date:** 2026-03-14
**Feature slug:** plat-payment-integration-fixes
**Business:** PLAT
**Commit:** ec37a312cb

## Outcome Contract
- **Why:** Refunds were completely blocked — bearer-token auth passed middleware but was re-blocked at the route level, and orders were never updated to "completed" so PM's refund guard rejected every request. A timing attack vulnerability existed in the Axerve internal endpoint.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 8 payment integration blockers remediated. Refunds now flow end-to-end for both Stripe and Axerve orders.
- **Source:** operator

## Tasks Completed

| Task | Priority | Description | Outcome |
|---|---|---|---|
| TASK-01 | P1 | PM refund auth: accept bearer token | `hasCaryinaPmBearerToken` added to session.ts; refunds route now accepts either cookie or bearer token |
| TASK-02 | P1 | Order status "completed" after payment | `pmOrderDualWrite(..., status:"completed")` added to `handleSuccessfulPayment` (Axerve) and `completeStripeFinalization` (Stripe) |
| TASK-03 | P1 | Axerve refund timing-safe comparison | `crypto.timingSafeEqual` replaces `!==` in axerve-refund route |
| TASK-04 | P1 | Checkout fetch timeout | `AbortSignal.timeout(8000)` added to PM provider fetch |
| TASK-05 | P2 | IP allowlist diagnostic | Once-per-process `pmLog("warn", "ip_allowlist_unconfigured")` added |
| TASK-06 | P2 | ShopPaymentConfig auto-seed | GET /api/internal/shop-config now upserts default row (`activeProvider: "axerve"`) on first access |
| TASK-07 | P2 | Dual-write failure logging | Catch handlers log `{orderId, shopId, error}` context |
| TASK-08 | P3 | Coherence warning persistence | Confirmed no-op — `pmLog("warn")` already emits to CF Logs via wrangler tail |

## Files Changed

**apps/payment-manager:**
- `src/lib/auth/session.ts` — added `hasCaryinaPmBearerToken()` export
- `src/app/api/refunds/route.ts` — accept bearer token || session cookie
- `src/lib/auth/accessControl.ts` — once-per-process allowlist-unconfigured warning
- `src/app/api/internal/shop-config/route.ts` — auto-seed on first access

**apps/caryina:**
- `src/lib/checkoutSession.server.ts` — "completed" dual-write after Axerve success; improved logging on initial pending write
- `src/lib/payments/stripeCheckout.server.ts` — "completed" dual-write after Stripe finalization
- `src/lib/payments/provider.server.ts` — AbortSignal.timeout(8000) on PM fetch
- `src/app/api/internal/axerve-refund/route.ts` — timing-safe token comparison

## Engineering Coverage Evidence

| Area | Status |
|---|---|
| TypeScript typecheck (payment-manager) | Passed — `tsc --noEmit` exits 0 |
| TypeScript typecheck (caryina) | Passed — `tsc --noEmit` exits 0 |
| ESLint (payment-manager) | Passed — 0 errors, 0 new warnings |
| ESLint (caryina) | Passed — 0 errors, all 3 warnings pre-existing |
| Pre-commit hooks (lint-staged + typecheck-staged) | Passed — turbo typecheck clean |

## Workflow Telemetry Summary

Workflow telemetry not available — this was a direct micro-build lane. No fact-find or plan stages.

| Stage | Status |
|---|---|
| lp-do-ideas dispatch | 8 packets enqueued (PLAT-001 through PLAT-008) |
| lp-do-build | Executed inline — all 8 tasks complete |
