---
Type: Plan
Status: Complete
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-process-integrity-silent-failure-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Process Integrity Silent-Failure Hardening Plan

## Summary
Execute the next hardening slice from reception process audit findings by removing silent-failure behavior in critical operator workflows and improving direct failure-path verification.

## Active tasks
- [x] TASK-01: Remove duplicate prepayment success activity emission.
- [x] TASK-02: Fail-closed status-toggle mutation handling for non-throwing failures.
- [x] TASK-03: Add checkout split-write compensation behavior.
- [x] TASK-04: Harden booking/recipient fetch contract to avoid false deferred outcomes.
- [x] TASK-05: Replace placeholder status-toggle test with real behavior assertions.
- [x] TASK-06: Residual hardening for Alloggiati result-cardinality checks.
- [x] TASK-07: Residual hardening for YOY API upstream-fetch failure contract.
- [x] TASK-08: Residual hardening for auth-profile cache fallback UID consistency.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Remove duplicate code-8 logging in prepayment paid flow | 90% | S | Complete (2026-03-05) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Convert check-in status toggle to fail on `{ success: false }` mutation outcomes | 88% | S | Complete (2026-03-05) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Add compensation rollback for checkout completion/reversal split writes | 84% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-04 | IMPLEMENT | Distinguish recipient-fetch failures from no-recipient deferral state | 86% | S | Complete (2026-03-05) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Add behavior tests for status failure rollback + checkout compensation + recipient-fetch failure | 85% | M | Complete (2026-03-05) | TASK-01,TASK-02,TASK-03,TASK-04 | TASK-06,TASK-07,TASK-08 |
| TASK-06 | IMPLEMENT | Add Alloggiati result cardinality/order guard before result persistence | 80% | M | Complete (2026-03-05) | TASK-05 | - |
| TASK-07 | IMPLEMENT | Update YOY route contract to fail closed when upstream data fetch fails | 82% | S | Complete (2026-03-05) | TASK-05 | - |
| TASK-08 | IMPLEMENT | Prevent cached profile fallback from crossing UID boundary | 80% | S | Complete (2026-03-05) | TASK-05 | - |

## Acceptance Criteria (current cycle)
- [x] Mark-as-paid path no longer emits duplicate code `8` activity entries for one payment.
- [x] Status toggle reverts optimistic UI when mutation returns `success: false`.
- [x] Checkout flow applies compensation when second write fails after first succeeds.
- [x] Recipient-fetch failures surface as errors (not deferred no-recipient).
- [x] Verification coverage now contains behavior assertions for status rollback and checkout compensation.
- [x] Alloggiati result persistence validates submission-result cardinality alignment.
- [x] YOY route returns explicit failure when upstream financial-node fetch fails.
- [x] Auth profile cache fallback validates cache UID against live Firebase UID.

## Execution Evidence
- Code updates:
  - `apps/reception/src/components/prepayments/MarkAsPaidButton.tsx`
  - `apps/reception/src/components/prepayments/BookingPaymentsLists.tsx`
  - `apps/reception/src/components/prepayments/DisplayDialogue.tsx`
  - `apps/reception/src/components/checkins/StatusButton.tsx`
  - `apps/reception/src/components/checkout/Checkout.tsx`
  - `apps/reception/src/services/useBookingEmail.ts`
  - `apps/reception/src/components/man/Alloggiati.tsx`
  - `apps/reception/src/app/api/statistics/yoy/route.ts`
  - `apps/reception/src/services/firebaseAuth.ts`
- Verification updates:
  - `apps/reception/src/components/checkins/__tests__/StatusButton.test.tsx`
  - `apps/reception/src/components/checkout/__tests__/Checkout.test.tsx`
  - `apps/reception/src/components/prepayments/__tests__/BookingPaymentsLists.test.tsx`
  - `apps/reception/src/services/__tests__/useBookingEmail.test.ts`
  - `apps/reception/src/services/__tests__/useEmailGuest.test.tsx`
  - `apps/reception/src/components/man/__tests__/Alloggiati.test.tsx`
  - `apps/reception/src/app/api/statistics/yoy/__tests__/route.test.ts`
  - `apps/reception/src/services/__tests__/firebaseAuth.test.ts`
- Validation:
  - `pnpm --filter @apps/reception typecheck` (pass)
  - `pnpm --filter @apps/reception lint` (pass with pre-existing warnings in `StaffAccountsForm.tsx`)

## Pending Audit Work
- None for this hardening slice.

## Next Build Step
- Completed for this cycle; dispatch has been marked `completed` in queue-state.
