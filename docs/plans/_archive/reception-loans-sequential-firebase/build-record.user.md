# Build Record — reception-loans-sequential-firebase

**Date:** 2026-03-09
**Feature slug:** reception-loans-sequential-firebase
**Business:** BRIK

## What was done

Refactored `useLoansMutations.ts` to replace sequential Firebase `get()` + `remove()` chains with single multi-path atomic `update()` null-writes. Added optional parameters so `LoanDataContext` can pass already-known data (deposit amount, txn IDs, occupant emptiness) directly to the hook, eliminating all avoidable pre-reads in the hot path.

Three functions changed:
- `removeOccupantIfEmpty` — accepts optional `isEmpty?: boolean`; skips the `get()` check and issues a single null-write when `isEmpty === true`, returns immediately when `isEmpty === false`, falls back to the original read-then-remove path when not supplied.
- `removeLoanItem` — accepts optional `deposit?: number` and `isEmpty?: boolean`; skips the pre-read `get()` and uses a single multi-path `update()` to delete the txn (and optionally the occupant node) in one call when `deposit` is supplied, falls back to the original chain otherwise.
- `removeLoanTransactionsForItem` — accepts optional `matchingTxnIds?: string[]` and `isOccupantEmpty?: boolean`; builds a single multi-path null-write when IDs are supplied, falls back to `get()` + `Promise.all(remove())` otherwise.

`LoanDataContext.tsx` updated: all three removal wrappers (`removeLoanItemAndUpdate`, `removeLoanTransactionsForItemAndUpdate`, `removeOccupantIfEmptyAndUpdate`) now extract the required data from `loansState` before calling the hook, activating the fast path in normal operation.

Tests extended: `useLoansMutations.test.ts` parallel-removal test rewritten to assert single `update()` call with null-write path map; new happy-path tests added for all fast and fallback paths. `LoanDataContext.test.tsx` extended with 6 new tests verifying wrappers pass the correct optional params to the hook mocks.

## Evidence

- Commit: `d7e964b468` on `dev`
- TypeScript: 0 errors (`pnpm --filter @apps/reception typecheck` passes)
- Lint: 0 new errors (13 pre-existing warnings, none in changed files)
- CI push: `origin/dev` updated to `a6cdcea87b`

## Outcome Contract

- **Why:** Sequential Firebase round-trips add latency to checkout operations and increase the window for partial-failure states in bulk checkout flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Loan removal uses Firebase multi-path atomic updates where possible. Hook-level Firebase ops for bulk checkout (10 keycard loans) drop from ~40 to ~10 (75% reduction in ops this hook controls). Total end-to-end ops per item drop from ~8-9 to ~5-6 (35-40% overall reduction; remaining ops are in `addToAllTransactions` and `logActivity` which are out of scope).
- **Source:** operator
