---
Feature-Slug: reception-workbench-date-filter
Build-Date: 2026-03-14
Status: Complete
---

# Workbench Date Filter + Validation Fix — Build Record

## Outcome Contract

- **Why:** The workbench was accumulating all-time PMS postings and terminal batches (not just today's), and the Zod `nonnegative()` guard caused false parse errors on refund-heavy shifts with negative POS totals.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workbench shows only today's PMS postings, terminal batches, and cash drawer count; refund-heavy shifts no longer trigger invalid reconciliation warnings.
- **Source:** operator

## Build Summary

Two fixes in `ReconciliationWorkbench.tsx`:

**0002 — Date filtering:**
- Added `getLocalToday()` import from `dateUtils`
- `todayStr` computed once per render via `useMemo`
- `lastCashCount`: now from `cashCounts.filter(c => c.timestamp.slice(0,10) === todayStr)`
- `todayPostings`: PMS postings filtered by `createdAt` (entries without `createdAt` included as today — safe fallback)
- `todayBatches`: Terminal batches filtered by `createdAt` (same fallback)
- `hasPmsData` / `hasBatchData` warnings now check today-filtered arrays

**0003 — Validation fix:**
- `z.number().nonnegative()` → `z.number().finite()` — allows negative totals (refunds), rejects only NaN/Infinity

## Engineering Coverage Evidence

- TypeScript: `pnpm --filter @apps/reception typecheck` — 0 errors, 19/19 tasks successful
- Import sort lint enforced (fixed before commit)
