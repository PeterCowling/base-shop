---
Type: Plan
Status: Complete
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-caryina-checkout-integrity-phase2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Checkout Integrity Phase 2 Plan

## Summary
This plan implements the remaining integrity controls for Caryina checkout in strict order: idempotency, hold/commit inventory lifecycle, stale-attempt reconciliation with alerts, and strengthened verification coverage. The route will require an idempotency key and persist deterministic attempt state so retries are safe. Inventory mutation will use platform hold primitives (`create -> commit/release`) to avoid payment/inventory divergence. A reconciliation path will process stale in-progress attempts and escalate ambiguous cases. Finally, tests and instrumentation are expanded to verify and observe these controls.

## Active tasks
- [x] TASK-01: Add durable checkout idempotency store and require idempotency key
- [x] TASK-02: Migrate checkout stock logic to hold/commit lifecycle
- [x] TASK-03: Add stale checkout reconciliation flow with alerting
- [x] TASK-04: Expand route/client verification for idempotency and hold lifecycle

## Goals
- Prevent duplicate charge/stock mutation from duplicate checkout submits.
- Guarantee inventory is decremented only via committed hold lifecycle.
- Reconcile stale in-progress attempts with safe auto-release and alert-on-ambiguity.
- Add deterministic validation and observability for these integrity paths.

## Non-goals
- Migrating all shops to same checkout architecture.
- Replacing Axerve integration.
- Building a full order-management backoffice.

## Constraints & Assumptions
- Constraints:
  - Keep existing success/decline API envelope semantics where feasible.
  - Follow no-local-Jest policy.
  - Keep change bounded to Caryina + necessary shared calls only.
- Assumptions:
  - Caryina runtime has writable data-root storage.

## Inherited Outcome Contract
- **Why:** Caryina checkout needs hard guarantees against duplicate charges, inventory drift, and unverified stale checkout attempts.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Caryina checkout becomes idempotent, hold-based, and self-reconciling with deterministic failure handling and operational alerts.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/hbag-caryina-checkout-integrity-phase2/fact-find.md`
- Key findings used:
  - Platform inventory hold lifecycle primitives exist and are reusable.
  - Caryina currently lacks persistent checkout idempotency.
  - Caryina lacks stale checkout reconciliation endpoint and tests for duplicate-submit behavior.

## Proposed Approach
- Option A: Keep route-local decrement/rollback and add only request lock.
  - Risk: continues compensating transaction drift risk.
- Option B: Require persistent idempotency + migrate to hold/commit + reconciliation.
  - Risk: larger implementation surface.
- Chosen approach: Option B, because it addresses duplicate-submit, stock integrity, and stale-flow verification as one coherent control set.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Durable idempotency store + required key in checkout API | 86% | M | Completed | - | TASK-02 |
| TASK-02 | IMPLEMENT | Hold/commit/release migration for checkout stock integrity | 89% | M | Completed | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Reconciliation service + cron route + alerting/metrics | 85% | M | Completed | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Expand route/client tests + metrics assertions for integrity paths | 92% | M | Completed | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Idempotency foundation |
| 2 | TASK-02 | TASK-01 | Hold lifecycle migration |
| 3 | TASK-03 | TASK-02 | Reconciliation + alerting |
| 4 | TASK-04 | TASK-03 | Verification hardening |

## Tasks

### TASK-01: Add durable checkout idempotency store and require idempotency key
- **Type:** IMPLEMENT
- **Deliverable:** New checkout idempotency module and API enforcement in Caryina checkout route/client
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/lib/checkoutIdempotency.server.ts`, `apps/caryina/src/app/api/checkout-session/route.ts`, `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 86%
- **Acceptance:**
  - Checkout returns 400 when idempotency key is missing.
  - Same key + same request payload replays stored result without new payment call.
  - Same key + different payload returns conflict.
  - Duplicate in-progress request returns conflict-in-progress.

### TASK-02: Migrate checkout stock logic to hold/commit lifecycle
- **Type:** IMPLEMENT
- **Deliverable:** Checkout route uses hold creation before payment, commit on success, release on non-success
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts`, `[readonly] packages/platform-core/src/inventoryHolds.ts`, `[readonly] packages/platform-core/src/cart/cartValidation.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 89%
- **Acceptance:**
  - Successful payment commits hold and does not release it.
  - Decline/service failure releases hold.
  - Insufficient stock yields 409 before payment attempt.

### TASK-03: Add stale checkout reconciliation flow with alerting
- **Type:** IMPLEMENT
- **Deliverable:** Reconciliation service + cron endpoint + alert/metric emissions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/lib/checkoutReconciliation.server.ts`, `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts`, `apps/caryina/src/app/api/checkout-session/route.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
- **Acceptance:**
  - Stale safe attempts are released and marked reconciled.
  - Ambiguous stale attempts are marked needs-review and alert emitted.
  - Cron route authenticated via `CRON_SECRET` and returns reconciliation summary.

### TASK-04: Expand route/client verification for idempotency and hold lifecycle
- **Type:** IMPLEMENT
- **Deliverable:** Updated route + checkout client tests for idempotency/hold/reconciliation behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.test.ts`, `apps/caryina/src/app/[lang]/checkout/CheckoutClient.test.tsx`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 92%
- **Acceptance:**
  - Tests cover replay, in-progress conflict, payload mismatch, hold commit/release paths, insufficient stock block.
  - Client test confirms idempotency key propagation to API payload.

## Risks & Mitigations
- Data-root lock contention under high checkout concurrency.
  - Mitigation: lock timeout + stale lock cleanup + deterministic conflict response.
- Ambiguous payment state during stale reconciliation.
  - Mitigation: classify as needs-review, alert immediately, avoid unsafe release.

## Observability
- Logging:
  - idempotency replay/conflict/in-progress, hold lifecycle, reconciliation outcomes.
- Metrics:
  - `caryina_checkout_idempotency_total`
  - `caryina_checkout_hold_lifecycle_total`
  - `caryina_checkout_reconciliation_total`
  - `caryina_checkout_stock_conflict_total`
- Alerts/Dashboards:
  - alert email for commit/release/reconciliation failures and needs-review states.

## Acceptance Criteria (overall)
- [x] API requires idempotency key and enforces replay/conflict semantics.
- [x] Inventory uses hold/commit/release lifecycle for checkout.
- [x] Reconciliation path handles stale attempts with safe auto-recovery and escalation.
- [x] Route/client tests cover key integrity scenarios.
- [x] Targeted typecheck and lint pass for `@apps/caryina`.

## Execution Evidence
- TASK-01 completed:
  - Added idempotency ledger/state machine: `apps/caryina/src/lib/checkoutIdempotency.server.ts`.
  - Checkout now requires and uses `idempotencyKey` in API payload and client submit.
- TASK-02 completed:
  - Replaced route-local decrement/rollback with hold lifecycle via `validateCart(createHold)`, `commitInventoryHold`, and `releaseInventoryHold`.
  - Encapsulated checkout flow in `apps/caryina/src/lib/checkoutSession.server.ts`; API route is a thin wrapper.
- TASK-03 completed:
  - Added stale reconciliation logic + needs-review escalation in `apps/caryina/src/lib/checkoutReconciliation.server.ts`.
  - Added authenticated cron endpoint: `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts`.
- TASK-04 completed:
  - Expanded API and client tests for idempotency, replay/conflict, hold commit/release, and reconciliation paths.
  - Added reconciliation and cron route tests.
- Validation:
  - `pnpm --filter @apps/caryina typecheck` (pass)
  - `pnpm --filter @apps/caryina lint` (pass)
- Post-completion operational hardening:
  - Added strict positive-integer validation for cron query params in `apps/caryina/src/app/api/cron/checkout-reconciliation/route.ts` and expanded route tests for invalid input rejection.
  - Added env docs for `CRON_SECRET` and `CARYINA_CHECKOUT_AUTO_RECONCILE` in `apps/caryina/.env.example` and `docs/.env.reference.md`.
  - Added scheduled reconciliation workflow: `.github/workflows/caryina-checkout-reconciliation.yml` (15-minute cadence + manual dispatch, secret/var preflight checks, authenticated endpoint call).

## Decision Log
- 2026-03-02: Selected file-backed idempotency ledger + platform hold primitives for Caryina to close remaining integrity risks in one cycle.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence = ((86*2) + (89*2) + (85*2) + (92*2)) / (2+2+2+2) = 88%

## Section Omission Rule
- None: all sections are relevant.
