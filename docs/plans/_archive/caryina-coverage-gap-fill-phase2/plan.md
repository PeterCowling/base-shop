---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-coverage-gap-fill-phase2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Coverage Gap Fill (Phase 2) Plan

## Summary
This plan executes a focused second-wave hardening for Caryina test quality: coverage-threshold ratchet, unhappy-path e2e smoke contracts, and route-level resilience assertions for reconciliation and checkout auto-reconcile behavior.

## Active tasks
- [x] TASK-01: Ratchet Caryina Jest coverage threshold to a stricter phase-2 baseline.
- [x] TASK-02: Add unhappy-path Playwright smoke tests for checkout decline/stock conflict and admin auth expiry redirect.
- [x] TASK-03: Expand reconciliation + checkout route resilience test branches (`committed`, exception, auto-reconcile trigger/catch).

## Inherited Outcome Contract
- **Why:** The first Caryina hardening wave closed major gaps, but remaining weak spots still leave CI confidence below desired production safety for checkout/admin flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Raise Caryina threshold baseline, add targeted unhappy-path smoke tests, and broaden reconciliation/transition resilience assertions while keeping CI stable.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/caryina-coverage-gap-fill-phase2/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Coverage threshold ratchet | 86% | S | Complete | - | release confidence |
| TASK-02 | IMPLEMENT | Unhappy-path smoke e2e contracts | 85% | M | Complete | TASK-01 | release confidence |
| TASK-03 | IMPLEMENT | Reconciliation/checkout resilience tests | 88% | M | Complete | TASK-01 | release confidence |

## Build Evidence
### TASK-01
- Ratcheted Caryina phase-2 coverage threshold from `10/5/10/10` to `12/8/12/12` in `apps/caryina/jest.config.cjs`.

### TASK-02
- Expanded `apps/caryina/e2e/checkout.smoke.spec.ts` with:
  - checkout decline assertion (402 + inline error),
  - inventory conflict assertion (409 + inline recovery error),
  - success transition assertion (`/en/success`) and cancelled-page route/link contract checks.
- Expanded `apps/caryina/e2e/admin-product-edit.smoke.spec.ts` with unauthenticated/expired session redirect coverage for `/admin/products -> /admin/login?redirect=...`.

### TASK-03
- Added reconciliation branch coverage in `apps/caryina/src/lib/checkoutReconciliation.server.test.ts` for:
  - `releaseInventoryHold` returning `{ ok: false, reason: "committed" }`,
  - exception path that increments `summary.errors`.
- Added checkout auto-reconcile path assertions in `apps/caryina/src/app/api/checkout-session/route.test.ts` for:
  - `CARYINA_CHECKOUT_AUTO_RECONCILE=1` trigger call,
  - rejection catch path logging without breaking successful checkout response.

## Validation Evidence
- `pnpm --filter @apps/caryina typecheck` (pass)
- `pnpm --filter @apps/caryina lint` (pass)

## Risks & Mitigations
- Playwright false positives from network timing.
  - Mitigation: route interception and explicit response assertions.
- Threshold ratchet might expose existing low-signal areas.
  - Mitigation: conservative increment in this wave; further ratchets follow CI observation.

## Acceptance Criteria (overall)
- [x] Caryina threshold raised above `10/5/10/10` and committed.
- [x] Smoke e2e includes decline/stock-conflict and admin redirect guard behavior.
- [x] Reconciliation branches `committed` + `error` covered with assertions.
- [x] Checkout route tests cover `CARYINA_CHECKOUT_AUTO_RECONCILE=1` trigger and catch behavior.
- [x] `pnpm --filter @apps/caryina typecheck` passes.
- [x] `pnpm --filter @apps/caryina lint` passes.
