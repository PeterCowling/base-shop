---
Type: Plan
Status: Complete
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-process-integrity-reaudit-opportunities
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Re-Audit Opportunities Plan

## Summary
Execute a focused hardening cycle for newly confirmed re-audit issues: fail-open activity result handling, async write sequencing risks, and missing behavior verification for non-throwing failures.

## Active tasks
- [x] TASK-01: Activity mutation fail-closed contract hardening + verification upgrades.
- [x] TASK-02: Keycard and loans async sequencing hardening for critical writes.
- [x] TASK-03: Loans cleanup async-race elimination + regression coverage.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Enforce fail-closed behavior for non-throwing activity/saveActivity failures and update tests | 86% | M | Complete (2026-03-05) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Await and gate critical writes in keycard + loans container flows | 82% | M | Complete (2026-03-05) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Fix `removeLoanTransactionsForItem` async race and add targeted tests | 80% | S | Complete (2026-03-05) | TASK-01,TASK-02 | - |

## Acceptance Criteria (current cycle)
- [x] `logActivity` cannot silently ignore `{ success: false }`.
- [x] Activity/saveActivity callers in covered reception flows treat non-throwing failure payloads as failures.
- [x] Key flows surface error feedback instead of unconditional success when side-effect writes fail.
- [x] Keycard/loans critical writes are awaited (no fire-and-forget).
- [x] Loan cleanup no longer uses non-awaited async removals.
- [x] Tests assert behavior on non-throwing mutation failures (not only call presence).

## Execution Evidence
- Dispatch:
  - `docs/plans/reception-process-integrity-reaudit-opportunities/dispatch.v2.json`
- Build cycle:
  - TASK-01 code updates:
    - `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`
    - `apps/reception/src/components/checkins/EmailBookingButton.tsx`
    - `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts`
    - `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
    - `apps/reception/src/components/checkins/cityTaxButton/CityTaxPaymentButton.tsx`
    - `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx`
    - `apps/reception/src/hooks/orchestrations/emailAutomation/useEmailProgressActions.ts`
  - TASK-01 verification updates:
    - `apps/reception/src/hooks/mutations/__tests__/useActivitiesMutations.test.ts`
    - `apps/reception/src/components/checkins/__tests__/EmailBookingButton.test.tsx`
    - `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts`
    - `apps/reception/src/components/man/modals/__tests__/ExtensionPayModal.test.tsx`
    - `apps/reception/src/components/checkins/cityTaxButton/__tests__/CityTaxPaymentButton.test.tsx`
    - `apps/reception/src/components/prepayments/__tests__/PrepaymentsContainer.test.tsx`
    - `apps/reception/src/hooks/orchestrations/emailAutomation/__tests__/useEmailProgressActions.test.ts`
  - TASK-02 code updates:
    - `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
    - `apps/reception/src/components/loans/LoansContainer.tsx`
  - TASK-02 verification updates:
    - `apps/reception/src/components/checkins/keycardButton/__tests__/KeycardDepositButton.test.tsx`
    - `apps/reception/src/components/loans/__tests__/LoansContainer.test.tsx`
  - TASK-03 code updates:
    - `apps/reception/src/hooks/mutations/useLoansMutations.ts`
  - TASK-03 verification updates:
    - `apps/reception/src/hooks/mutations/__tests__/useLoansMutations.test.ts`
  - Validation:
    - `pnpm --filter @apps/reception typecheck` (pass)
    - `pnpm --filter @apps/reception lint` (pass; pre-existing warnings in `StaffAccountsForm.tsx`)

## Next Build Step
- All planned tasks are complete for this cycle.
