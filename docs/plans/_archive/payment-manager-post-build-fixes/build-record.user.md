---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-14
Feature-Slug: payment-manager-post-build-fixes
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/payment-manager-post-build-fixes/build-event.json
---

# Build Record: Payment Manager Post-Build Fixes

## Outcome Contract

- **Why:** The Payment Manager app had several correctness gaps introduced at initial build time — a broken refund currency field, a silent order sync failure due to an env var name mismatch, a missing auth guard on dashboard pages, and several code quality issues. Left unfixed, refund amounts would always display with no currency, every Caryina checkout would silently skip the PM order write, and the dashboard would be accessible without a valid session if middleware were bypassed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All identified correctness and security gaps in the Payment Manager initial build are resolved and verified against typecheck + lint before deploy.
- **Source:** operator

## What Was Built

**TASK-01 — Refund currency (critical fix):** Removed `currency: true` from the `refunds` Prisma select in `/api/orders/[orderId]/route.ts` — the `Refund` model has no `currency` column. Currency is now inherited from the parent `Order` record in the API response mapping.

**TASK-02 — Env var mismatch (critical fix):** Changed `PAYMENT_MANAGER_SERVICE_URL` to `PAYMENT_MANAGER_URL` in `apps/caryina/src/lib/pmOrderDualWrite.server.ts`. The PM secret is registered as `PAYMENT_MANAGER_URL`; the wrong name caused every Caryina checkout to silently skip the PM order write, leaving the order list perpetually empty.

**TASK-03 — Dashboard layout + auth guard:** Created `apps/payment-manager/src/app/(dashboard)/layout.tsx` with a server-side `hasPmSessionFromCookieHeader` guard (redirects to `/login` on failure) and a persistent sidebar nav linking to /orders, /shops, /analytics, /reconciliation, /webhooks. Uses existing `gate-*` CSS tokens with no new dependencies.

**TASK-04 — Schema invariant documentation:** Added a three-line `///` doc comment above `model Refund` in `packages/platform-core/prisma/schema.prisma` documenting the shopId invariant (must equal parent Order's shopId; enforced at application layer only).

**TASK-05 — Consolidate upsert path:** Removed the inline `upsertOrder` function from `/api/internal/orders/route.ts` and replaced it with a call to the existing `createOrUpdateOrder` helper. Also removed the now-unused `prisma` import from that file. One canonical upsert path remains.

**TASK-07 — Axerve credential test response:** Changed `testAxerveCredentials` in the credential test route to return `{ ok: true, liveTestSkipped: true, reason: "axerve_live_test_not_supported", message: "..." }` instead of a bare `{ ok: true }`. This gives the UI clear context that format checks passed but no live Axerve call was made.

**TASK-08 — Rate limiter scope comment:** Added an 8-line comment block in `rateLimit.ts` above `MAX_ENTRIES` explaining the per-isolate scope limitation and the available KV-backed upgrade path.

**TASK-06/09 — N/A:** `stripeRefund.server.ts` does not exist in Caryina (false positive from initial audit). The `lineItemsJson` comment in `schema.prisma` already uses valid triple-slash `///` Prisma doc syntax (no fix needed).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p tsconfig.json --noEmit` (payment-manager) | Pass | Pre-existing PAYMENT_MANAGER_SESSION_SECRET warning from next.config.mjs is non-blocking |
| `pnpm exec tsc -p tsconfig.json --noEmit` (caryina) | Pass | Clean |
| `eslint --ext .ts,.tsx` (payment-manager staged files) | Pass | |
| lint-staged (turbo, all affected packages) | Pass | Pre-existing warnings in caryina (non-blocking) |
| typecheck-staged (turbo, 3 packages) | Pass | |

## Workflow Telemetry Summary

Single `lp-do-build` stage record. Direct-dispatch micro-build lane — no upstream fact-find/analysis/plan stages. Context input: 36,983 bytes. Modules loaded: `build-code.md`. Deterministic checks: 1 (`validate-engineering-coverage.sh`). Token measurement: not captured (session-log capture unavailable for this run).

## Validation Evidence

### TASK-01
- Removed `currency: true` from Prisma select — confirmed `Refund` model has no `currency` field in `schema.prisma`
- API response now maps `currency: order.currency as string` with explanatory comment
- Typecheck passes — `order.currency` is `string` on `Order` model

### TASK-02
- `pmOrderDualWrite.server.ts` now reads `process.env.PAYMENT_MANAGER_URL` matching the Caryina secret name
- Caryina typecheck clean

### TASK-03
- `(dashboard)/layout.tsx` created with `hasPmSessionFromCookieHeader` import and redirect
- `eslint --fix` applied (import sort), lint clean
- Typecheck passes

### TASK-04
- Triple-slash doc comment present above `model Refund` in schema.prisma
- Platform-core typecheck/lint clean

### TASK-05
- Inline `upsertOrder` function removed; `prisma` import removed
- `createOrUpdateOrder` called with all required fields including `null`-safe optional conversions
- Import sorted (`lib/auth/*` before `lib/orders/*`) — lint clean

### TASK-07
- `testAxerveCredentials` returns `liveTestSkipped: true` with `reason` and `message` fields
- Lint clean

### TASK-08
- Scope comment block present above `MAX_ENTRIES` — references `PAYMENT_MANAGER_KV` as upgrade path

### TASK-06/09
- Verified via `ls apps/caryina/src/lib/payments/`: no `stripeRefund.server.ts` exists
- Verified via grep: `schema.prisma` line 412 already `/// JSON array...` (triple-slash valid)

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No UI components changed; layout.tsx uses existing gate tokens |
| UX / states | Partial | Dashboard sidebar nav added; session redirect added |
| Security / privacy | Required | TASK-03 adds defence-in-depth auth guard; TASK-02 fixes silent data loss |
| Logging / observability / audit | N/A | No logging changes |
| Testing / validation | N/A | Micro-build correctness fixes; typecheck + lint are the validation gate per micro-build plan |
| Data / contracts | Required | TASK-01 fixes invalid Prisma select; TASK-04 documents invariant; TASK-05 consolidates upsert |
| Performance / reliability | N/A | No perf-sensitive paths changed |
| Rollout / rollback | N/A | No migrations; all changes are backward-compatible |

## Scope Deviations

- **TASK-06 N/A**: `apps/caryina/src/lib/payments/stripeRefund.server.ts` does not exist — initial audit was a false positive from an Explore subagent. No action taken.
- **TASK-09 N/A**: `///` triple-slash on the `lineItemsJson` comment in `schema.prisma` is valid Prisma doc-comment syntax — not a typo. No change needed.
