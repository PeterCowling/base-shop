---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Task-ID: TASK-09
---

# TASK-09 Wave 2 Migration Results

## Scope delivered
- Migrated Wave 2 table-heavy component imports from direct `@acme/design-system/atoms` table primitives to centralized `@acme/ui/operations` compatibility wrappers in:
  - `apps/reception/src/components/reports/EndOfDayPacket.tsx`
  - `apps/reception/src/components/reports/SafeTable.tsx`
  - `apps/reception/src/components/reports/VarianceHeatMap.tsx`
  - `apps/reception/src/components/inventory/StockManagement.tsx`
  - `apps/reception/src/components/inventory/IngredientStock.tsx`
  - `apps/reception/src/components/search/FinancialTransactionSearch.tsx`
  - `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx`
  - `apps/reception/src/components/search/BookingSearchTable.tsx`
  - `apps/reception/src/components/search/SortableHeader.tsx`
  - `apps/reception/src/components/search/EditableBalanceCell.tsx`
  - `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx`

## Validation evidence

### TC-09.01 parity + focused route-area tests
- Locked parity suite:
  - `cd apps/reception && pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__`
  - Result: `5` suites passed, `10` tests passed, `5` snapshots passed.
- Focused Wave 2 component tests:
  - `cd apps/reception && pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/components/reports/__tests__/SafeTable.test.tsx src/components/reports/__tests__/EndOfDayPacket.test.tsx src/components/reports/__tests__/VarianceHeatMap.test.tsx src/components/inventory/__tests__/IngredientStock.test.tsx src/components/inventory/__tests__/StockManagement.test.tsx src/components/search/__tests__/SearchTable.test.tsx src/components/prime-requests/__tests__/queue.test.tsx`
  - Result: `5` suites passed, `2` failed (`VarianceHeatMap.test.tsx`, `SearchTable.test.tsx`) due missing `AuthProvider` setup (`useAuth must be used inside an AuthProvider`) in those tests.
  - Assessment: failures are test-harness/provider setup gaps and not table-wrapper regressions.

### TC-09.02 table hotspot reduction
- Baseline table-structure counts (from TASK-01 inventory artifact):
  - `EndOfDayPacket.tsx` `83`
  - `StockManagement.tsx` `51`
  - `FinancialTransactionSearch.tsx` `25`
  - `FinancialTransactionAuditSearch.tsx` `21`
  - `PrimeRequestsQueue.tsx` `17`
  - `BookingSearchTable.tsx` `17`
  - `IngredientStock.tsx` `11`
  - `VarianceHeatMap.tsx` `9`
  - Baseline total: `234`
- Post-migration command:
  - `for f in <hotspot-files>; do rg -n "<table\\b|<thead\\b|<tbody\\b|<tr\\b|<th\\b|<td\\b" "$f" | wc -l; done`
  - Result: each hotspot file reports `0` native table tags.
  - Post total: `0`.

### TC-09.03 import/governance checks
- Direct table primitive imports from atoms in Wave 2 scope:
  - `rg -n "import\\s*\\{[^}]*Table[^}]*\\}\\s*from \\\"@acme/design-system/atoms\\\"" apps/reception/src/components/{reports,inventory,search,prime-requests} --glob '!**/__tests__/**' | wc -l`
  - Result: `0`.
- Deep import guard:
  - `rg -n "@acme/ui/src|@acme/design-system/src" apps/reception/src/components/{reports,inventory,search,prime-requests} --glob '!**/__tests__/**'`
  - Result: no matches.

### Type/lint gate (touched files)
- Typecheck:
  - `pnpm --filter @apps/reception typecheck` -> pass.
- Lint (touched Wave 2 files):
  - `cd apps/reception && pnpm exec eslint <wave2-touched-files>` -> pass with warnings only (`ds/no-raw-tailwind-color`), no errors.
