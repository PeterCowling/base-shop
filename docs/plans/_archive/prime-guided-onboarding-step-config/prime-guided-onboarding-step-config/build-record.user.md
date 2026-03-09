---
Type: Build-Record
Feature-Slug: prime-guided-onboarding-step-config
Build-date: 2026-03-09
Status: Complete
artifact: build-record
---

# Build Record — prime GuidedOnboardingFlow Step Config and Radio Fieldset Deduplication

## Outcome Contract

- **Why:** Two separable improvements (step config extraction and radio fieldset extraction) were confirmed independently executable. The useReducer question was assessed and found unwarranted, keeping the lifecycle pattern intact.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** GuidedOnboardingFlow step configuration driven by helper functions rather than repeated if-chains, and duplicated radio fieldset JSX collapsed to a single reusable component.
- **Source:** operator

## What Was Delivered

TASK-01 (S-effort, single commit `51701c5516`) delivered:

1. **Step config helper functions** — `getStepTitle(step, guestFirstName, t)` and `getStepDescription(step, experimentVariants, t)` extracted as file-local functions. The `stepTitle` and `stepDescription` `useMemo` blocks now contain a single call each, with no inline `if (step === N)` branching.

2. **Radio fieldset component extraction** — `ArrivalMethodFieldset` and `ArrivalConfidenceFieldset` extracted as file-local function components. The previous 104-line duplicated JSX block (L406–510) collapsed to a 24-line ternary of component call sites. Each fieldset body (legend, grid, radio buttons, `eslint-disable` comment) is written exactly once.

3. **New test** — OB-07 TC-01 added: asserts that the `eta-first` experiment variant renders the confidence fieldset before the method fieldset in the DOM (previously untested path). The `assignActivationVariants` mock was upgraded from a plain arrow function to `jest.fn()` to enable per-test overrides.

## Metrics

- `GuidedOnboardingFlow.tsx`: 816 → 756 lines (−60 LOC, target was ≥−50)
- Tests: 25 existing + 1 new = 26 total
- Typecheck: clean
- Lint (scoped to changed files): clean

## Files Changed

- `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` — modified (−60 LOC)
- `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx` — modified (+22 lines: mock upgrade + new describe/test)

## Build Route

- Codex offload (`CODEX_OK=1`), exit code 0
- Post-execution import-sort fix applied via `eslint --fix` (simple-import-sort ordering)

## Rollback

Revert commit `51701c5516` (GuidedOnboardingFlow changes were part of this commit's scope). No downstream consumers to unwind.
