---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-safe-withdrawal-float-rollback
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0001
Related-Plan: none
---

# Safe Withdrawal Float Entry Rollback Micro-Build

## Scope
- Change: Add `rollback: () => recordFloatEntry(-amount)` to step 2 of `handleWithdrawal` in `SafeManagement.tsx`
- Non-goals: Changes to `runTransaction`, other safe handlers, or test coverage beyond existing suite

## Execution Contract
- Affects: `apps/reception/src/components/safe/SafeManagement.tsx` (line 128)
- Acceptance checks:
  - Step 2 of `handleWithdrawal` has a `rollback` that calls `recordFloatEntry(-amount)`
  - TypeScript passes with no new errors
  - Existing safe tests continue to pass in CI
- Validation commands:
  - `pnpm --filter reception typecheck`
- Rollback note: Revert the one-line change to `SafeManagement.tsx`

## Outcome Contract
- **Why:** If the float entry write fails after the safe withdrawal is recorded, the withdrawal is rolled back but no compensating undo exists for the float entry — leaving the till balance inconsistent.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe withdrawal steps are fully reversible; a failed float entry write will roll back the withdrawal record, keeping till and safe balances consistent.
- **Source:** operator
