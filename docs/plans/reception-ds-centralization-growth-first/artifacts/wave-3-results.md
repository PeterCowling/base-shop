---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Task-ID: TASK-10
---

# TASK-10 Wave 3 Migration Results

## Scope delivered
- Expanded the shared compatibility surface with `ReceptionSelect` in:
  - `packages/ui/src/components/organisms/operations/ReceptionCompatibility.tsx`
- Migrated Wave 3 form/modal-heavy scope (`prepayments`, `loans`, `man`, `common`, `checkins/docInsert`) to shared `@acme/ui/operations` wrappers:
  - `ReceptionButton` (replacing direct atoms `Button` imports in scoped production files)
  - `ReceptionInput` (replacing native `<input>` tags in scoped production files)
  - `ReceptionSelect` (replacing native `<select>` tags in scoped production files)
  - Existing Wave 3 table usages in-scope now also route through reception compatibility table wrappers.

## Validation evidence

### TC-10.01 parity suite
- Command:
  - `cd apps/reception && pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__`
- Result:
  - `5` suites passed, `10` tests passed, `5` snapshots passed.

### TC-10.02 focused Wave 3 component tests
- Command:
  - `cd apps/reception && pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/components/man/__tests__/Alloggiati.test.tsx src/components/man/__tests__/DateSelectorAllo.test.tsx src/components/man/__tests__/Extension.test.tsx src/components/man/__tests__/Stock.test.tsx src/components/man/modals/__tests__/ExtensionPayModal.test.tsx src/components/loans/__tests__/GuestRow.test.tsx src/components/loans/__tests__/KeycardsModal.test.tsx src/components/loans/__tests__/LoanFilters.test.tsx src/components/loans/__tests__/LoanModal.test.tsx src/components/loans/__tests__/LoanableItemSelector.test.tsx src/components/loans/__tests__/LoansTable.test.tsx src/components/prepayments/__tests__/EntryDialog.test.tsx src/components/prepayments/__tests__/PaymentsView.test.tsx src/components/common/__tests__/PinInput.test.tsx src/components/checkins/docInsert/__tests__/AutoComplete.test.tsx`
- Result:
  - `13` suites passed, `2` failed, `40` tests passed, `2` failed.
- Failing suites and assessment:
  - `src/components/prepayments/__tests__/EntryDialog.test.tsx`: uses `vi.spyOn(...)` under Jest (`ReferenceError: vi is not defined`).
  - `src/components/prepayments/__tests__/PaymentsView.test.tsx`: selector config mismatch (`Unable to find [data-cy="code21-count"]` while rendered node uses `data-testid`).
  - Both are test-harness/spec issues and not runtime wrapper regressions.

### TC-10.03 native primitive and import reduction
- Baseline (pre-migration, Wave 3 scope):
  - native `<button>`: `0`
  - native `<input|select|textarea>`: `27`
- Post-migration:
  - native `<button>`: `0`
  - native `<input|select|textarea>`: `0`
- Command:
  - `git grep -n "<button\\b" -- <wave3-scope> | wc -l`
  - `git grep -n "<input\\b\\|<select\\b\\|<textarea\\b" -- <wave3-scope> | wc -l`
- Governance checks:
  - Direct atoms `Button` imports in Wave 3 scope reduced to `0`.
  - No deep imports from `@acme/ui/src` or `@acme/design-system/src`.

### Type/lint/build gate
- `pnpm --filter @acme/ui build` -> pass.
- `pnpm --filter @apps/reception typecheck` -> pass.
- Scoped eslint over touched Wave 3 files -> warnings only (`ds/no-raw-tailwind-color`), no errors.
