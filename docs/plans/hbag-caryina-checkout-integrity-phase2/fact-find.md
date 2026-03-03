---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: hbag-caryina-checkout-integrity-phase2
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-caryina-checkout-integrity-phase2/plan.md
Trigger-Why: Caryina checkout needs hard guarantees against duplicate charges, inventory drift, and unverified stale checkout attempts.
Trigger-Intended-Outcome: type: measurable | statement: Caryina checkout becomes idempotent, hold-based, and self-reconciling with deterministic failure handling and operational alerts. | source: operator
---

# Caryina Checkout Integrity Phase 2 Fact-Find Brief

## Scope
### Summary
This brief scopes the remaining integrity work after phase 1 route-level reservation rollback. The target is end-to-end checkout correctness under retries, duplicate submits, and stale in-flight flows. The implementation must use durable idempotency state, move to hold/commit inventory semantics, add reconciliation for stale attempts, and expand verification coverage.

### Goals
- Require and enforce idempotency key semantics in Caryina checkout.
- Use inventory holds with commit/release lifecycle instead of direct decrement+compensate flow.
- Add reconciliation path for stale/ambiguous attempts with alerting.
- Add deterministic validation for duplicate-submit and hold lifecycle behavior.

### Non-goals
- Replacing Axerve provider.
- Full cross-shop checkout abstraction redesign.
- Retrofitting all storefronts in this cycle.

### Constraints & Assumptions
- Constraints:
  - Keep `POST /api/checkout-session` contract stable for success/decline envelopes.
  - Follow repo policy: no local Jest/e2e execution.
  - Keep scope primarily within `@apps/caryina`.
- Assumptions:
  - Data-root backed idempotency persistence is acceptable for Caryina runtime.

## Outcome Contract
- **Why:** Caryina checkout needs hard guarantees against duplicate charges, inventory drift, and unverified stale checkout attempts.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Caryina checkout becomes idempotent, hold-based, and self-reconciling with deterministic failure handling and operational alerts.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/src/app/api/checkout-session/route.ts` - checkout payment + stock flow.
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` - client submit payload.

### Key Modules / Files
- `apps/caryina/src/app/api/checkout-session/route.ts` - currently route-level reserve/rollback using `updateInventoryItem`.
- `packages/platform-core/src/inventoryHolds.ts` - canonical hold create/commit/release primitives.
- `packages/platform-core/src/cart/cartValidation.ts` - hold-based checkout validation API.
- `apps/cms/src/app/api/cron/release-expired-holds/route.ts` - cron auth pattern.

### Patterns & Conventions Observed
- Hold commit/release is webhook-driven in Stripe flows via metadata `inventory_reservation_id`.
- Idempotent operational writes use lock + append/read pattern in repositories (`stockInflows.server.ts`, `stockAdjustments.server.ts`).
- Metrics emitted via `recordMetric("...", labels)`.

### Test Landscape
- Existing checkout route tests cover payment result matrix and reservation rollback.
- Missing tests for idempotency key enforcement, replay behavior, and stale reconciliation triggers.

## Questions
### Resolved
- Q: Is there an existing hold lifecycle implementation to reuse?
  - A: Yes. `createInventoryHold`, `commitInventoryHold`, and `releaseInventoryHold` are available in platform-core.
  - Evidence: `packages/platform-core/src/inventoryHolds.ts`.
- Q: Is there an existing style for durable idempotent ledgers?
  - A: Yes. File lock + append/read idempotency key checks are established in stock inflow/adjustment repositories.
  - Evidence: `packages/platform-core/src/repositories/stockInflows.server.ts`, `packages/platform-core/src/repositories/stockAdjustments.server.ts`.

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 86%
- Approach: 90%
- Impact: 92%
- Delivery-Readiness: 88%
- Testability: 85%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Idempotency store corruption or lock contention | Low | High | Use lock-file with stale cleanup + atomic write/rename pattern. |
| Ambiguous stale attempt after payment request sent | Medium | High | Mark `needs_review`, emit metric, send alert, and avoid unsafe auto-release. |
| Hold backend unavailable | Medium | Medium | Return 503 with deterministic failure payload + metrics/alerts. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Reuse platform hold primitives.
  - Durable idempotency storage with lock discipline.
- Rollout/rollback expectations:
  - Backward-compatible success payload and explicit conflict/error codes.
- Observability expectations:
  - Metric counters for key integrity paths and reconciliation outcomes.

## Suggested Task Seeds (Non-binding)
- TASK-01 IMPLEMENT: Idempotency store + required key enforcement.
- TASK-02 IMPLEMENT: Hold/commit route migration.
- TASK-03 IMPLEMENT: Reconciliation service + cron trigger + alerting.
- TASK-04 IMPLEMENT: Route/client test expansion for duplicate-submit + hold lifecycle.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Updated route, idempotency/reconciliation modules, tests, plan evidence.
- Post-delivery measurement plan:
  - Track checkout idempotency conflict/replay/reconciliation metrics.

## Evidence Gap Review
### Gaps Addressed
- Reuse points for holds/idempotency established with code evidence.

### Confidence Adjustments
- Approach confidence increased by selecting existing platform primitives.

### Remaining Assumptions
- Caryina runtime has writable data root for idempotency ledger.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Checkout API behavior | Yes | None | No |
| Hold lifecycle reuse | Yes | None | No |
| Idempotency persistence | Partial | Needs Caryina-specific store implementation | Yes |
| Reconciliation path | Partial | No existing Caryina cron route | Yes |
| Verification coverage | Partial | Missing duplicate-submit tests | Yes |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-build` on a focused execution plan
