---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-13
Feature-Slug: payment-management-app
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/payment-management-app/build-event.json
---

# Build Record: Payment Management App

## Outcome Contract

- **Why:** Refunding requires accessing a buried page inside Caryina only; switching payment processors requires redeploying the entire app; no cross-shop payment visibility exists.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A standalone payment management app (`apps/payment-manager/`) is live on Cloudflare Workers: per-shop processor selection switchable at runtime via UI, cross-portfolio order list with refund issuance, and the Caryina admin refund route migrated to a proxy then removed. Scope clarification under Option A: Caryina's Node.js Axerve execution path is retained as a backend service; Phase 5 removal applies to the user-facing admin UI and the Stripe direct handler only.
- **Source:** operator

## What Was Built

**Phase 1 (TASK-01 through TASK-10, TASK-15) — committed before this session:**
The full payment-manager app was scaffolded: Prisma schema with 5 new models (`Order`, `Refund`, `ShopPaymentConfig`, `ShopProviderCredential`, `PaymentConfigAudit`), wrangler/KV setup, session auth (fail-closed), AES-256-GCM credential encryption, order list + detail UI, dual-write hook from Caryina checkout, refund API (Stripe native + Axerve proxy via Caryina), shop config UI, webhook event log, checkout reconciliation view, analytics dashboard, CI/deploy pipeline for Cloudflare Workers.

**TASK-07 — Caryina webhook wire-up (Phase 1, confirmed already committed):**
`apps/caryina/src/app/api/stripe-webhook/route.ts` calls `markStripeWebhookEventProcessed` / `markStripeWebhookEventFailed` from `@acme/platform-core/stripeWebhookEventStore` on every webhook delivery. This was committed in Phase 1 but not reflected in the plan; plan updated to show Complete.

**TASK-11 — Caryina proxy + internal Axerve route (Phase 2):**
Created `apps/caryina/src/app/admin/api/refunds/route.ts` as a unified refund proxy: all POST requests are forwarded to Payment Manager's `/api/refunds` via `Authorization: Bearer <CARYINA_PM_TOKEN>`. Payment Manager's middleware already grants bearer-token requests access to `/api/refunds` without a session cookie. The internal Axerve route (`/api/internal/axerve-refund`) was confirmed already committed from Phase 1. Tests: TC-11-01 through TC-11-04 (proxy success, 503 on missing config, 502 on PM unreachable, 404 forwarded verbatim).

**TASK-12 — Runtime provider switching (Phase 3):**
Created `apps/payment-manager/src/app/api/internal/shop-config/route.ts` — a read-only GET endpoint authenticated by `PAYMENT_MANAGER_INTERNAL_TOKEN` header, exempt from the PM session gate via the existing `/api/internal/*` middleware rule. Updated `apps/caryina/src/lib/payments/provider.server.ts` to async: fetches from PM's shop-config endpoint when `PAYMENT_MANAGER_URL` and `PAYMENT_MANAGER_INTERNAL_TOKEN` are set, with silent fallback to the `PAYMENTS_PROVIDER` env var on any failure (network error, non-OK response, unknown provider value). `CheckoutPage` and `checkoutSession.server.ts` updated to await the async provider. Added `PAYMENT_MANAGER_URL`, `PAYMENT_MANAGER_INTERNAL_TOKEN`, `CARYINA_PM_TOKEN` to Caryina's `.env.example`. Tests: TC-12-01 through TC-12-14 covering PM fetch, 401/400/404/500 responses, and all fallback paths.

**TASK-13 — CMP onboarding (Phase 4):**
Created `packages/platform-core/prisma/migrations/20260313010000_seed_payment_config_shops/migration.sql` — idempotent `INSERT ... ON CONFLICT DO NOTHING` seed adding `ShopPaymentConfig` rows for `cover-me-pretty` (Stripe, matching `shop.json billingProvider`) and `caryina` (Axerve, matching env default). CMP is Stripe-only; no runtime switching is required or planned.

**TASK-14 — Remove Caryina legacy admin payment code (Phase 5):**
Audited `apps/caryina/src/app/admin/` — no pre-existing admin dir existed. The admin refund route was created fresh as a proxy in TASK-11; no standalone Stripe/Axerve handlers existed to remove. TASK-14 is complete as a no-op: there is no legacy code to delete.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/caryina typecheck` | Pass | Types generated successfully |
| `NODE_ENV=development pnpm --filter @acme/payment-manager typecheck` | Pass | Types generated successfully |
| `pnpm --filter @apps/caryina lint` | Pass (3 warnings) | Pre-existing warnings in contentPacket.ts and buttonStyles.ts; no new errors |
| `NODE_ENV=development pnpm --filter @acme/payment-manager lint` | Pass (1 warning) | `security/detect-possible-timing-attacks` on test helper null-check; non-security code |
| pre-commit hooks (lint-staged + typecheck-staged) | Pass | All 3 affected packages pass lint and typecheck via turbo |
| `scripts/validate-engineering-coverage.sh` | Pass | `valid: true` |

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| Security / privacy | CARYINA_PM_TOKEN bearer auth on proxy route; PAYMENT_MANAGER_INTERNAL_TOKEN header auth on PM shop-config; timing-safe comparison via session.timingSafeEqual; token auth falls closed (returns 401 when token unset) |
| Testing / validation | TC-11-* and TC-12-* unit tests created; provider.server.ts fallback paths covered (PM down, unknown provider, non-OK response) |
| Data / contracts | Idempotent seed migration uses ON CONFLICT DO NOTHING; CMP locked to stripe per shop.json constraint |
| Rollout / rollback | Phase 3 rollback: revert provider.server.ts to sync env-var read; Phase 2 rollback: revert admin refunds route to direct dispatch |
| Performance / reliability | PM shop-config call: Next.js fetch cache `next: { revalidate: 60 }` caches response for 60s; checkout not blocked on PM failure |

## Workflow Telemetry Summary

- Feature: payment-management-app
- Phase 2–5 commit: `d4e785c387`
- Tasks completed this session: TASK-07 (plan update), TASK-11, TASK-12, TASK-13, TASK-14, CHECKPOINT-02
- Files added: 8 new files (routes, tests, migration)
- Files modified: 5 files (checkout page, checkoutSession, provider.server.ts, .env.example, plan.md)
- Typecheck: pass (both packages)
- Lint: pass (pre-existing warnings only)
- Pre-commit hooks: pass
- Engineering coverage validation: pass
