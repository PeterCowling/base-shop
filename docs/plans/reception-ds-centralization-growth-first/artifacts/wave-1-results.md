---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Task-ID: TASK-08
---

# TASK-08 Wave 1 Migration Results

## Scope delivered
- Added style-neutral, ref-safe compatibility wrappers to `@acme/ui/operations`:
  - `ReceptionButton`
  - `ReceptionInput`
  - `ReceptionTextarea`
  - `ReceptionTable` + table section/row/cell aliases
- Migrated Wave 1 production scope from native `input` / `textarea` / table-structure tags to centralized wrappers in:
  - `apps/reception/src/components/Login.tsx`
  - `apps/reception/src/components/checkins/**/*`
  - `apps/reception/src/components/till/**/*`
  - `apps/reception/src/components/safe/**/*`

## Validation evidence

### TC-08.01 parity suite
- Command:
  - `cd apps/reception && pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__`
- Result:
  - `5` suites passed, `10` tests passed, `5` snapshots passed.
  - No snapshot updates required (zero unexpected diffs).

### TC-08.02 native tag delta (Wave 1 scope)
Counting scope:
- `apps/reception/src/components/Login.tsx`
- `apps/reception/src/components/checkins`
- `apps/reception/src/components/checkout`
- `apps/reception/src/components/till`
- `apps/reception/src/components/safe`
- Excluding test artifacts: `__tests__`, `*.test.*`, `*.spec.*`, `*.snap`

Baseline observed before migration:
- `button`: `0`
- `input/select/textarea`: `56`
- `table|thead|tbody|tr|th|td`: `10`

Post-migration:
- `button`: `0`
- `input/select/textarea`: `5`
- `table|thead|tbody|tr|th|td`: `0`

Net reduction:
- Form-native tags reduced by `51`.
- Table-native tags reduced by `10`.

### TC-08.03 lint/type gate for touched files
- Typecheck:
  - `pnpm --filter @apps/reception typecheck` -> pass.
- Lint (touched Wave 1 files):
  - `cd apps/reception && pnpm exec eslint --fix <wave1-touched-files>` -> pass with warnings only, no errors.
- Note:
  - Full `pnpm --filter @apps/reception lint` is red due pre-existing unrelated errors in untouched files.
