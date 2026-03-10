---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Build-completed: 2026-03-09
Feature-Slug: prime-radiostep-extraction
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309140000-0001
Related-Plan: none
---

# RadioStep Extraction Micro-Build

## Scope
- Change: Extract a shared `RadioStep` component from the 6 near-identical radio-group render functions in `BreakfastOrderWizard.tsx` and `EvDrinkOrderWizard.tsx`. Replace all inline radio-group blocks with the new component. Update tests to exercise the refactored structure.
- Non-goals: Changing wizard behaviour, step ordering, option data, i18n keys, or confirmation step UI.

## Execution Contract
- Affects:
  - `apps/prime/src/components/meal-orders/RadioStep.tsx` (create)
  - `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` (modify)
  - `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx` (modify)
  - `apps/prime/src/components/meal-orders/__tests__/BreakfastOrderWizard.test.tsx` (modify)
  - `apps/prime/src/components/meal-orders/__tests__/EvDrinkOrderWizard.test.tsx` (modify)
- Acceptance checks:
  - [ ] `RadioStep` component created at `apps/prime/src/components/meal-orders/RadioStep.tsx`
  - [ ] `RadioStep` accepts: `options: Array<{ value: string; label: string }>`, `selectedValue: string`, `onChange: (value: string) => void`, `onNext: () => void`, `disabled?: boolean`, `name: string` (for radio input name attribute)
  - [ ] All radio-group-only render functions in `BreakfastOrderWizard.tsx` replaced with `<RadioStep />` (`renderFoodStep`, `renderPancakesStep`, `renderDrinksStep`, `renderSugarStep`, and the two radio subgroups inside `renderMilkSugarStep`)
  - [ ] The `renderEggsStep` function retains its checkbox for sides but uses `<RadioStep />` for the egg style sub-group within it
  - [ ] The `drink` step in `EvDrinkOrderWizard.tsx` uses `<RadioStep />` (replacing inline radio fieldset)
  - [ ] All existing tests still pass (no behaviour change — CI validates)
  - [ ] `pnpm --filter @apps/prime typecheck` exits 0
  - [ ] `pnpm --filter @apps/prime lint` exits 0 (no new errors)
- Validation commands:
  - `pnpm --filter @apps/prime typecheck`
  - `pnpm --filter @apps/prime lint`
- Rollback note: Revert to original render functions in both wizard files; delete `RadioStep.tsx`.

## Outcome Contract
- **Why:** Two wizard files contain 6+ copy-paste radio group blocks with identical class names and structure. Extracting a single RadioStep component removes the duplication and makes future step additions a one-liner.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** BreakfastOrderWizard and EvDrinkOrderWizard radio-group step renderers replaced by a shared RadioStep component, reducing total wizard code by ~60% and making step additions a one-liner.
- **Source:** operator
