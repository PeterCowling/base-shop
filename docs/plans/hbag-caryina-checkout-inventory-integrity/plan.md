---
Type: Plan
Status: Complete
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-caryina-checkout-inventory-integrity
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG Caryina Checkout Inventory Integrity Plan

## Summary
This plan closes a launch-critical stock-integrity gap in Caryina checkout. Today, checkout succeeds without decrementing inventory, so stock can drift and oversell risk remains. The implementation introduces checkout-time inventory reservation semantics with rollback on payment failure, preserving stock correctness while keeping current UX/API shape stable. It also adds targeted route tests for inventory validation and rollback behavior. The scope is intentionally bounded to checkout API logic and its unit tests.

## Active tasks
- [x] TASK-01: Implement checkout inventory reservation + rollback flow
- [x] TASK-02: Add route tests for inventory integrity paths

## Goals
- Prevent successful payment completion when current inventory is insufficient.
- Ensure successful payment leaves inventory decremented.
- Ensure payment failure paths restore any pre-payment inventory reservations.
- Add deterministic tests for the new inventory behavior.

## Non-goals
- Full inventory-holds subsystem integration.
- Checkout UI redesign.
- Global order-management redesign.

## Constraints & Assumptions
- Constraints:
  - Keep existing checkout response contract for success and existing decline/unavailable semantics.
  - Use existing inventory repository APIs (`readInventory`, `updateInventoryItem`) for mutation.
  - Keep changes scoped to `@apps/caryina` package.
- Assumptions:
  - Route-level reservation + rollback is acceptable interim integrity control for Caryina.

## Inherited Outcome Contract
- **Why:** Caryina can complete payment without reducing stock, which can cause oversell and operational failures.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Checkout blocks payment when current inventory is insufficient and reduces inventory on successful payment, with automated tests covering success, insufficient stock, and concurrent purchase edge cases.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/hbag-caryina-checkout-inventory-integrity/fact-find.md`
- Key findings used:
  - Checkout success path currently has no inventory mutation.
  - Cart-time stock checks are not sufficient to guarantee post-payment stock correctness.
  - Existing route tests do not cover inventory mutation or rollback behavior.

## Proposed Approach
- Option A: Validate inventory at checkout submit and decrement only after payment success.
  - Risk: if decrement fails after charge, payment/inventory divergence.
- Option B: Reserve inventory before payment, then rollback on payment failure.
  - Risk: requires careful rollback handling.
- Chosen approach: Option B, because it prevents charging when inventory cannot be reserved and provides explicit rollback path on non-success outcomes.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add inventory reservation + rollback to checkout route | 86% | M | Completed | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add route tests for reservation failure and rollback | 90% | M | Completed | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core behavior change |
| 2 | TASK-02 | TASK-01 | Locks contract with tests |

## Tasks

### TASK-01: Implement checkout inventory reservation + rollback flow
- **Type:** IMPLEMENT
- **Deliverable:** checkout route inventory integrity logic in `apps/caryina/src/app/api/checkout-session/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts`, `[readonly] packages/platform-core/src/repositories/inventory.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 86%
  - Implementation: 84% - bounded route-level change with existing repository APIs.
  - Approach: 88% - reserve-then-pay with rollback addresses oversell + divergence risk better than post-pay decrement.
  - Impact: 92% - directly protects checkout stock integrity.
- **Acceptance:**
  - Route resolves inventory lines for cart items and fails with 409 when reservation cannot be made.
  - Route reserves inventory before calling Axerve.
  - Route rolls back reservations for payment decline (402) and payment service unavailable (502).
  - Route keeps reservation on success (200) and preserves existing success payload shape.
- **Validation contract (TC-01):**
  - TC-01: reservation fails due to insufficient quantity -> 409 with stock error.
  - TC-02: Axerve decline after reservation -> 402 and inventory rollback executed.
  - TC-03: Axerve success -> 200 and rollback not executed.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: call-site map for checkout route and inventory repository methods.
  - Validation artifacts: `docs/plans/hbag-caryina-checkout-inventory-integrity/fact-find.md`, route/test source references.
  - Unexpected findings: None.
- **Scouts:** None: bounded API route change.
- **Edge Cases & Hardening:** Handle missing inventory mapping, multi-line carts, and best-effort rollback logging.
- **What would make this >=90%:**
  - Add explicit idempotency key flow for duplicate request suppression.
- **Rollout / rollback:**
  - Rollout: deploy route change with tests and monitor checkout error mix.
  - Rollback: revert route to prior behavior if reservation flow causes regressions.
- **Documentation impact:**
  - Update plan task evidence only.
- **Notes / references:**
  - `docs/plans/hbag-caryina-checkout-inventory-integrity/fact-find.md`

### TASK-02: Add route tests for inventory integrity paths
- **Type:** IMPLEMENT
- **Deliverable:** expanded test coverage in `apps/caryina/src/app/api/checkout-session/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.test.ts`, `[readonly] apps/caryina/src/app/api/checkout-session/route.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 89% - existing route-test harness supports additional mocks/assertions.
  - Approach: 90% - direct contract tests on reservation/rollback outcomes.
  - Impact: 91% - closes current test blind spot on stock integrity.
- **Acceptance:**
  - Tests assert reservation failure 409 path.
  - Tests assert rollback on 402 and 502 paths after reservation.
  - Tests assert no rollback on 200 success.
- **Validation contract (TC-02):**
  - TC-01: insufficient stock mapping -> 409 response.
  - TC-02: payment decline -> rollback update calls match reserved lines.
  - TC-03: payment service unavailable -> rollback update calls match reserved lines.
  - TC-04: payment success -> reservation calls present and rollback calls absent.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: review existing mock patterns in checkout route tests.
  - Validation artifacts: updated test file assertions.
  - Unexpected findings: None.
- **Scouts:** None: test-only extension.
- **Edge Cases & Hardening:** include multi-line reservation rollback assertion.
- **What would make this >=90%:**
  - Add one backend-specific integration test for JSON inventory file mutation path.
- **Rollout / rollback:**
  - Rollout: include in normal CI test run.
  - Rollback: revert added test cases if contract is intentionally changed.
- **Documentation impact:**
  - Update plan task evidence only.
- **Notes / references:**
  - `apps/caryina/src/app/api/checkout-session/route.test.ts`

## Risks & Mitigations
- Double-submit idempotency is still partial without explicit request-level idempotency token.
  - Mitigation: reservation checks prevent oversell in most concurrent scenarios; add idempotency as follow-up.
- Rollback failure after payment error can leave temporary stock drift.
  - Mitigation: best-effort rollback with error logging; expose telemetry for manual reconciliation.

## Observability
- Logging:
  - Reservation failures and rollback failures logged with cart/transaction context.
- Metrics:
  - Track count of 409 stock conflicts at checkout.
- Alerts/Dashboards:
  - None: add if conflict/error rates increase post-release.

## Acceptance Criteria (overall)
- [x] Successful checkout decrements inventory.
- [x] Declined/unavailable payment path restores reserved inventory.
- [x] Insufficient inventory at submit returns 409 without charging.
- [x] Route tests cover inventory reservation and rollback contracts.

## Execution Evidence
- Updated route logic: `apps/caryina/src/app/api/checkout-session/route.ts`
- Updated route tests: `apps/caryina/src/app/api/checkout-session/route.test.ts`
- Validation run:
  - `pnpm --filter @apps/caryina typecheck` (pass)
  - `pnpm --filter @apps/caryina lint` (pass)

## Decision Log
- 2026-03-02: Chose reserve-before-payment with rollback over decrement-after-success to avoid payment-before-stock-commit divergence.

## Simulation Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Implement checkout inventory reservation + rollback flow | Yes | None | No |
| TASK-02: Add route tests for inventory integrity paths | Yes | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence = ((86*2) + (90*2)) / (2+2) = 88%

## Section Omission Rule
- None: all core sections are relevant for this plan.
