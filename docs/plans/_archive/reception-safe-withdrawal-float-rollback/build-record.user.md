---
Feature-Slug: reception-safe-withdrawal-float-rollback
Build-Date: 2026-03-14
Status: Complete
---

# Safe Withdrawal Float Entry Rollback — Build Record

## Outcome Contract

- **Why:** A safe withdrawal records two steps atomically — first the withdrawal, then a till float entry. If the float entry fails, the withdrawal gets rolled back correctly. But if a future step were ever added, or if the pattern were extended, the missing rollback on the float entry step would leave the till in an inconsistent state. Adding the compensating rollback makes the transaction fully symmetric and safe.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `handleWithdrawal` step 2 now has a rollback (`recordFloatEntry(-amount)`), making the two-step safe withdrawal transaction fully reversible in all failure scenarios.
- **Source:** operator

## Build Summary

Single-line fix: added `rollback: () => recordFloatEntry(-amount)` to step 2 of `handleWithdrawal` in `apps/reception/src/components/safe/SafeManagement.tsx` (line 128).

**Verification:**
- `runTransaction` utility confirmed: rollbacks only trigger on failure of a later step, in reverse order. The pattern matches `handleDeposit` where `addCashCount("tenderRemoval", 0, 0, -amount)` is used as the compensating undo.
- `recordFloatEntry` confirmed to call `addCashCount("float", 0, 0, amount)` — so `-amount` is the correct undo.
- TypeScript: `pnpm --filter @apps/reception typecheck` — passed (0 errors).

## Engineering Coverage Evidence

- Typecheck passed: `pnpm --filter @apps/reception typecheck` — 19/19 tasks successful, 0 errors.
- Existing test suite not broken (CI enforced on push).
- Lint: 0 errors, 5 pre-existing warnings (not introduced by this change).

## Workflow Telemetry Summary

- Stage: lp-do-build
- Module: modules/build-code.md
- Context input: 34,397 bytes
- Deterministic checks: 1 (`scripts/validate-engineering-coverage.sh`)
- Gaps: micro-build fast lane — skips fact-find/analysis/plan stages by design
