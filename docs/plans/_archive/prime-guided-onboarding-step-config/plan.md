---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-guided-onboarding-step-config
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# prime GuidedOnboardingFlow — Step Config and Radio Fieldset Deduplication Plan

## Summary

`GuidedOnboardingFlow.tsx` (816 lines) has two isolated structural issues that inflate line count and make adding a step 4 a multi-location edit: (1) `stepTitle` and `stepDescription` are each computed with a 3-branch `if (step === N)` chain that can be collapsed to `getStepTitle` / `getStepDescription` helper functions, and (2) the arrival-method and arrival-confidence radio fieldsets are written out in full twice — once per branch of the `showConfidenceBeforeMethod` A/B experiment flag — with identical handlers and classes, differing only in render order. A single IMPLEMENT task extracts both in one pass (~50–80 LOC net reduction). The 6-ref lifecycle pattern was assessed and is explicitly out of scope: none of the refs can be eliminated without equal replacement complexity.

## Active tasks

- [x] TASK-01: Extract step-title/description helpers and deduplicate radio fieldsets (Complete 2026-03-09)

## Goals

- Eliminate the `if (step === N)` repetition for step title and description.
- Collapse two identical radio fieldset JSX trees into two dedicated local components (`ArrivalMethodFieldset`, `ArrivalConfidenceFieldset`), each written once, with the two component call sites reordered based on `showConfidenceBeforeMethod`.
- Add a test covering the `eta-first` variant (confidence-before-method render order) — currently untested.
- Net line reduction: ≥50 LOC.

## Non-goals

- Changing the 3-step flow structure.
- Migrating state management to `useReducer`.
- Changes to i18n keys, analytics event payloads, or `StepFlowShell` props.
- Changes to the 6-ref + 6-effect lifecycle pattern.

## Constraints & Assumptions

- Constraints:
  - All 25 existing tests (23 in `GuidedOnboardingFlow.test.tsx` + 2 in `GuidedOnboardingFlow.ds-migration.test.tsx`) must remain green.
  - `StepFlowShell` `title`/`description` prop interface is unchanged.
  - `showConfidenceBeforeMethod` remains a runtime conditional — not a compile-time configuration.
  - DS linting `PLAT-ENG-0001` exemptions must be preserved wherever they exist in the extracted component.
- Assumptions:
  - `GuidedOnboardingFlow.tsx` is default-export only; no internal helpers are re-exported or consumed elsewhere.
  - `ArrivalMethodFieldset` and `ArrivalConfidenceFieldset` will be file-local function components, not split into a separate file.
  - `getStepTitle` and `getStepDescription` are file-local helper functions accepting runtime arguments (`step`, `guestFirstName`, `t`, `experimentVariants`) — a static config object is not viable because step 1 content depends on runtime props and renders an `<ExperimentGate>` ReactNode.

## Inherited Outcome Contract

- **Why:** Two separable improvements (step config extraction and radio fieldset extraction) can likely be executed independently. The useReducer question needs scoping — it may not be warranted if the lifecycle concerns can be addressed more surgically. Fact-find to separate and sequence the work correctly.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** GuidedOnboardingFlow step configuration driven by helper functions rather than repeated if-chains, and duplicated radio fieldset JSX collapsed to a single reusable component.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-guided-onboarding-step-config/fact-find.md`
- Key findings used:
  - Step config extraction: `getStepTitle(step, guestFirstName, t)` + `getStepDescription(step, experimentVariants, t)` helper functions (L196–224 in component). Static lookup not viable — step 1 uses `<ExperimentGate>` ReactNode.
  - Fieldset duplication at L406–510: two full JSX trees, byte-for-byte identical except render order. Only `showConfidenceBeforeMethod` controls which goes first.
  - 6 refs assessed — none eliminatable without equal replacement complexity. Lifecycle left untouched.
  - Coverage gap: `eta-first` variant (confidence-before-method) has zero test coverage. Add in this task.
  - Fact-find confidence: 0.85.

## Proposed Approach

- Option A: Single combined IMPLEMENT task — extract both helper functions and `ArrivalMethodFieldset`/`ArrivalConfidenceFieldset` components in one pass.
- Option B: Two separate tasks (helpers first, fieldsets second).
- **Chosen approach: Option A.** Combined scope is S-effort (~50–80 LOC net change). Splitting into two tasks adds coordination overhead with no risk reduction — the changes touch non-overlapping line ranges and do not interact.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract step helpers + deduplicate radio fieldsets | 85% | S | Complete (2026-03-09) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no parallelism needed |

## Tasks

---

### TASK-01: Extract step-title/description helpers and deduplicate radio fieldsets

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`; new test case in `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:**
  - Codex offload route used; exit code 0.
  - `GuidedOnboardingFlow.tsx`: 816 → 756 lines (−60 LOC). Committed in `51701c5516`.
  - `getStepTitle` and `getStepDescription` helpers extracted at L72–97.
  - `ArrivalMethodFieldset` (L110–131) and `ArrivalConfidenceFieldset` (L138–163) extracted.
  - `stepTitle` and `stepDescription` useMemos now single-line calls, no if-chains.
  - `showConfidenceBeforeMethod` ternary at L436 renders component call sites (no inlined JSX).
  - OB-07 TC-01 test added; `assignActivationVariants` mock changed to `jest.fn()`.
  - `pnpm --filter @apps/prime typecheck`: clean.
  - `pnpm --filter @apps/prime lint` (scoped to our files): clean. Pre-existing `useFetchBookingsData.client.ts` error is out-of-scope.
- **Affects:**
  - `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`
  - `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact lines identified (L196–224 for helpers, L406–510 for fieldsets), change is pure refactor with identical output, existing 25-test suite validates behaviour.
  - Approach: 85% — helper-function pattern is unambiguous; `<RadioFieldset>` extraction is a straightforward local component. The only mild uncertainty is the exact prop signature for the fieldset component (items shape, handler type). Held-back test: the only unknown that could push this below 80 is if `<RadioFieldset>` turns out to need a more complex type than `items: { value, label }[] | readonly string[]` — unlikely given the source is fully read. No single unknown would cause a failure here.
  - Impact: 85% — purely internal refactor; user-observable behaviour is unchanged. Risk of regression is low given full test coverage on all step interactions.
- **Acceptance:**
  - [ ] `getStepTitle(step, guestFirstName, t)` helper extracted; `stepTitle` useMemo calls it with no inlined if-chain.
  - [ ] `getStepDescription(step, experimentVariants, t)` helper extracted; `stepDescription` useMemo calls it with no inlined if-chain.
  - [ ] Arrival-method and arrival-confidence fieldsets have no duplicated fieldset markup — the JSX body of each fieldset (legend, grid, radio buttons) is written exactly once (inside the extracted component). Two JSX call sites remain (`<ArrivalMethodFieldset>` and `<ArrivalConfidenceFieldset>` appear in both branches of the ternary), but neither branch contains inlined fieldset markup.
  - [ ] `showConfidenceBeforeMethod` controls render order via a ternary over the two extracted component call sites — no inlined, duplicated JSX.
  - [ ] All 25 existing tests pass (green).
  - [ ] New test: `eta-first` variant renders confidence fieldset before method fieldset (verified by DOM order).
  - [ ] Net LOC reduction ≥ 50 lines in `GuidedOnboardingFlow.tsx`.
  - [ ] `pnpm --filter @apps/prime typecheck` passes.
  - [ ] `pnpm --filter @apps/prime lint` passes.
  - [ ] `bash scripts/validate-changes.sh` passes (repo-wide validation gate).
  - **Expected user-observable behavior:** None — this is a pure internal refactor. The onboarding flow renders identically to before in both `standard` and `eta-first` experiment variants.
- **Validation contract:**
  - TC-01: Step 1 renders with method fieldset first (standard variant) → `arrivalMethodPreference` radio buttons appear before `arrivalConfidence` radio buttons in DOM.
  - TC-02: Step 1 renders with confidence fieldset first (`eta-first` variant) → `arrivalConfidence` radio buttons appear before `arrivalMethodPreference` radio buttons in DOM. (New test — currently untested.) **Note:** The existing top-level `jest.mock('../../../lib/experiments/activationExperiments', ...)` returns a hardcoded `onboardingStepOrder: 'standard'`. The new test must override this per-test using `(assignActivationVariants as jest.Mock).mockReturnValueOnce({ onboardingStepOrder: 'eta-first', onboardingCtaCopy: 'control' })` — which requires changing the top-level mock to use `jest.fn()` rather than a plain arrow function so it is mockable. The execution plan must include this mock-strategy change.
  - TC-03: `setPersonalization` called with correct args after step 1 save → existing TC-02 in test suite remains green.
  - TC-04: Skip path completes flow without checklist updates → existing TC-03 remains green.
  - TC-05: Analytics events fire on skip/save per step → existing OB-01 suite remains green.
  - TC-06: Error toast on API failure, flow advances → existing OB-03 suite remains green.
  - TC-07: Focus management on step transitions → existing OB-06 suite remains green.
  - TC-08: DS migration test — no raw palette classes in rendered HTML → existing ds-migration test remains green.
- **Execution plan:**
  - **Setup (before Red/Green):**
    1. Change the `jest.mock('../../../lib/experiments/activationExperiments', ...)` in `GuidedOnboardingFlow.test.tsx` from a plain arrow function (`() => ({ onboardingStepOrder: 'standard', ... })`) to `jest.fn().mockReturnValue({ onboardingStepOrder: 'standard', onboardingCtaCopy: 'control' })` so individual tests can call `mockReturnValueOnce` to override.
    2. Add the new TC-02 test (`eta-first` variant renders confidence before method): use `mockReturnValueOnce({ onboardingStepOrder: 'eta-first', onboardingCtaCopy: 'control' })`, render, and assert that the `confidenceLabel` legend appears before the `arrivalMethodLabel` legend in the DOM. **This test will pass immediately against the current implementation** — the behavior already exists (L406–510 already handles `showConfidenceBeforeMethod = true`). This is a coverage test, not a bug-fix test. It must remain green throughout the refactor.
  - **Red:** (none required — this is a pure refactor of existing correct behavior, not a bug fix. The new TC-02 test provides the regression guard.)
  - **Green:**
    1. Extract `getStepTitle(step: Step, guestFirstName: string | null | undefined, t: TFunction): string` — returns the correct i18n string for each step, with name interpolation for step 1.
    2. Extract `getStepDescription(step: Step, experimentVariants: ActivationExperimentVariants, t: TFunction): ReactNode` — returns step 1's `<ExperimentGate>` node or a plain string for steps 2/3.
    3. Simplify `stepTitle` useMemo to `getStepTitle(step, guestFirstName, t)` and `stepDescription` useMemo to `getStepDescription(step, experimentVariants, t)`.
    4. Extract a file-local `ArrivalMethodFieldset` component taking `(arrivalMethodPreference, setArrivalMethodPreference, t)` props — wraps the `<fieldset>` with legend, grid, and 4 radio buttons.
    5. Extract a file-local `ArrivalConfidenceFieldset` component taking `(arrivalConfidence, setArrivalConfidence, t)` props — wraps the `<fieldset>` with legend, grid, and 2 radio buttons.
    6. Replace lines 406–510 with: `showConfidenceBeforeMethod ? (<><ArrivalConfidenceFieldset .../><ArrivalMethodFieldset .../></>) : (<><ArrivalMethodFieldset .../><ArrivalConfidenceFieldset .../></>)`.
    7. Preserve all `// eslint-disable ds/enforce-layout-primitives -- PLAT-ENG-0001 ...` comments inside the extracted components.
  - **Refactor:** Verify imports are clean (no unused), helper functions are above the component declaration, extracted components are above the main `GuidedOnboardingFlow` function.
- **Planning validation (required for M/L):**
  - None: S-effort task; planning validation not required per protocol.
- **Consumer tracing:**
  - None: S-effort task; consumer tracing not required per protocol. Both helper functions and fieldset components are file-local with no exports. The `stepTitle` and `stepDescription` values continue to be passed as `title` and `description` props to `StepFlowShell` — interface unchanged.
- **Scouts:**
  - Verify `TFunction` type is importable from `react-i18next` (or the `t` parameter can be typed as `ReturnType<typeof useTranslation>['t']`) without adding a new import — check existing imports in the file. (`react-i18next` is already imported for `useTranslation`.)
  - Verify the `ActivationExperimentVariants` type is importable for the `getStepDescription` signature — it is defined in `apps/prime/src/lib/experiments/activationExperiments.ts` and currently only used as a local inferred type. May need an explicit import.
- **Edge Cases & Hardening:**
  - `guestFirstName` is `string | null | undefined` — `getStepTitle` must guard for both `null` and `undefined` (same as current ternary: `guestFirstName ? titleWithName : title`).
  - `experimentVariants.onboardingCtaCopy` is `'control' | 'value-led'` — `getStepDescription` must preserve the `<ExperimentGate>` for step 1 and return plain `t(key)` strings for steps 2/3.
  - The `// eslint-disable ds/enforce-layout-primitives -- PLAT-ENG-0001 2-col radio button grid` comment must appear inside each extracted fieldset component's `<div>` — not just once at the call site.
  - Both extracted fieldset components must forward the `aria-checked`, `role="radio"`, and `onClick` props correctly — the ARIA pattern is functional, not just decorative.
- **What would make this >=90%:**
  - Running the test suite locally (currently out of bounds per testing policy). The 90% cap is purely a CI-gate gap — the implementation approach has no unresolved unknowns.
- **Rollout / rollback:**
  - Rollout: Standard PR + CI merge. No feature flags, no deploy steps.
  - Rollback: Revert the PR. Component is self-contained; no downstream consumers to unwind.
- **Documentation impact:**
  - None: Internal refactor with no public API or user-facing documentation.
- **Notes / references:**
  - Source lines: helpers at L196–224; fieldset duplication at L406–510.
  - Fact-find: `docs/plans/prime-guided-onboarding-step-config/fact-find.md`
  - Existing test file: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx` (23 tests, `onboardingStepOrder: 'standard'` mock — add `eta-first` test in a new `describe('OB-07: fieldset render order')` block or inline in OB-06).

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract helpers + fieldsets | Yes — full source read, all types and imports identified, test file read | Minor: `ActivationExperimentVariants` may need an explicit import if it's not already in scope (currently only inferred). Scout task covers this. | No (scout handles it) |

No Critical or Major rehearsal findings. The `ActivationExperimentVariants` import scout is the only advisory item.

## Risks & Mitigations

- **Risk:** `eslint-disable` comments lost during extraction → DS linting fails.
  - **Mitigation:** Explicitly documented in Edge Cases: each extracted component must carry its own `eslint-disable` comment on the inner `<div>`.
- **Risk:** `eta-first` variant renders incorrectly after extraction.
  - **Mitigation:** New TC-02 test explicitly asserts confidence-before-method DOM order under `eta-first` mock.
- **Risk:** TypeScript type error on `TFunction` or `ActivationExperimentVariants` in extracted helper signatures.
  - **Mitigation:** Scout tasks for both types; use inline inference if explicit import adds complexity.

## Observability

- None: Internal refactor; no logging, metrics, or alerting surfaces are affected.

## Acceptance Criteria (overall)

- [ ] `GuidedOnboardingFlow.tsx` line count reduced by ≥ 50 lines.
- [ ] No `if (step === N)` chains in `stepTitle` or `stepDescription` useMemo blocks.
- [ ] No duplicated fieldset markup — each fieldset body (legend, grid, buttons) written once inside extracted components.
- [ ] All 25 existing tests pass.
- [ ] New `eta-first` render-order test passes.
- [ ] `pnpm --filter @apps/prime typecheck` clean.
- [ ] `pnpm --filter @apps/prime lint` clean.
- [ ] `bash scripts/validate-changes.sh` passes.

## Decision Log

- 2026-03-09: Chose single combined task (Option A) over two sequential tasks (Option B). Scope is S-effort; splitting adds coordination overhead with no risk reduction.
- 2026-03-09: `useReducer` migration explicitly out of scope. Assessed in fact-find: none of the 6 refs are eliminatable without equal replacement complexity; lifecycle pattern is correct as-is.
- 2026-03-09: `<RadioFieldset>` extracted as two separate named components (`ArrivalMethodFieldset`, `ArrivalConfidenceFieldset`) rather than a single polymorphic `<RadioFieldset>` component. Two dedicated components have cleaner prop types and avoid a union/overload on the items shape.

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort S (weight 1)
- Overall-confidence = (85 × 1) / 1 = **85%**
