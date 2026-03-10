---
Type: Build-Record
Status: Complete
Feature-Slug: reception-format-euro-consolidation
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception FormatEuro Consolidation

## Outcome Contract

- **Why:** Currency formatting inconsistency is a maintenance hazard because changing euro display requires editing many duplicated helpers and literals.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All euro formatting in the reception app flows through `apps/reception/src/utils/format.ts` `formatEuro`; no local redefinitions or inline euro template literals remain.
- **Source:** operator

## What Was Built

Extended `apps/reception/src/utils/format.ts` so `formatEuro` now supports both the existing prefix style and a localized `it-IT` currency style via an option, keeping one canonical formatter. Removed local `formatEuro` helpers from `components/stats/Statistics.tsx` and `components/dashboard/DashboardMetrics.tsx`, routing those displays through the shared formatter while preserving their prior localized output. Replaced direct euro template literals in `DashboardMetrics.tsx` and `components/safe/SafeManagement.tsx` with `formatEuro(...)`. Added localized-mode coverage in `apps/reception/src/utils/__tests__/format.test.ts`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No type errors |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Existing unrelated warnings only; no errors |

## Validation Evidence

- No local `formatEuro` redefinitions remain in `Statistics.tsx` or `DashboardMetrics.tsx`
- Shared formatter now covers both prefix and localized euro rendering
- Direct euro `toFixed(2)` literals removed from `DashboardMetrics.tsx` and converted mechanical cases in `SafeManagement.tsx`
- Localized formatter coverage added in `utils/__tests__/format.test.ts`

## Scope Deviations

Did not replace every euro-bearing string in the reception app. Only mechanical direct replacements within the bounded micro-build scope were consolidated.
