---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-keycard-return-error
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0005
Related-Plan: none
---

# Keycard Return Error Visibility Micro-Build

## Scope
- Change: Fix `handleReturn` catch block so "return failed" errors also show a user-visible toast
- Non-goals: Changes to `returnKeycardsToSafe` logic or the transaction steps

## Execution Contract
- Affects: `apps/reception/src/components/safe/SafeManagement.tsx`
- Acceptance checks:
  - When `returnKeycardsToSafe` returns false, staff see a toast error message
  - TypeScript passes with no new errors
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert catch block simplification in handleReturn

## Outcome Contract
- **Why:** When a keycard return fails at the validation step, the error was silently swallowed — staff saw nothing and didn't know the operation failed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All keycard return failures show a toast so staff know the operation did not complete.
- **Source:** operator
