---
Type: Build-Record
Status: Complete
Feature-Slug: reception-date-selector-unification
Build-date: 2026-03-09
artifact: build-record
---

# Build Record — reception-date-selector-unification

## Summary

All 8 tasks completed. Extracted a single shared `DateSelector` component at `apps/reception/src/components/common/DateSelector.tsx` from 5 near-identical per-feature variants. All 5 originals deleted. All 5 callers migrated. All 7 affected test files updated. TypeScript and lint pass with zero errors.

## Tasks Completed

| Task | Status | Commit |
|---|---|---|
| TASK-01: Write shared DateSelector | Complete | `def00d4323` (wave 1) |
| TASK-02: Checkpoint | Complete | `def00d4323` (wave 1) |
| TASK-03: Migrate checkout caller | Complete | `c7f3c0997f` (wave 2) |
| TASK-04: Migrate checkins caller | Complete | `c7f3c0997f` (wave 2) |
| TASK-05: Migrate prepare caller | Complete | `c7f3c0997f` (wave 2) |
| TASK-06: Migrate loans caller | Complete | `c7f3c0997f` (wave 2) |
| TASK-07: Migrate man/Alloggiati caller | Complete | `c7f3c0997f` (wave 2) |
| TASK-08: Update tests and FilterToolbar JSDoc | Complete | `1c20c82573` (wave 3) |

## Validation Evidence

- `pnpm --filter @apps/reception typecheck` — 0 errors (2026-03-09)
- `pnpm --filter @apps/reception lint` — 0 errors, 13 warnings (pre-existing in unrelated files, 2026-03-09)
- `bash scripts/validate-changes.sh` — all checks passed (2026-03-09)
- CI: pending push to `origin/dev`

## Files Changed

**Created:**
- `apps/reception/src/components/common/DateSelector.tsx`

**Deleted:**
- `apps/reception/src/components/checkout/DaySelector.tsx`
- `apps/reception/src/components/checkins/DateSelector.tsx`
- `apps/reception/src/components/prepare/DateSelectorPP.tsx`
- `apps/reception/src/components/loans/DateSel.tsx`
- `apps/reception/src/components/man/DateSelectorAllo.tsx`

**Updated callers:**
- `apps/reception/src/components/checkout/Checkout.tsx`
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx`
- `apps/reception/src/components/prepare/PrepareDashboard.tsx`
- `apps/reception/src/components/loans/LoanFilters.tsx`
- `apps/reception/src/components/man/Alloggiati.tsx`

**Updated tests:**
- `apps/reception/src/components/checkins/__tests__/CheckinsUI.test.tsx`
- `apps/reception/src/parity/__tests__/checkin-route.parity.test.tsx`
- `apps/reception/src/components/prepare/__tests__/PrepareDashboard.test.tsx`
- `apps/reception/src/components/loans/__tests__/DateSel.test.tsx`
- `apps/reception/src/components/loans/__tests__/LoanFilters.test.tsx`
- `apps/reception/src/components/man/__tests__/DateSelectorAllo.test.tsx`
- `apps/reception/src/components/man/__tests__/Alloggiati.test.tsx`
- `apps/reception/src/components/common/FilterToolbar.tsx` (JSDoc only)

## Outcome Contract

- **Why:** 5 copies of the same component meant any date selector bug or UI change required 5 coordinated edits. Bugs had already diverged (inline vs popup calendar, inconsistent DayPicker color tokens).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A single shared `DateSelector` component in `common/` replaces all 5 variants. Access-level and quick-range differences are parameterised. All 5 callers are migrated. Existing tests pass.
- **Source:** auto
