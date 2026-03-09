---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-guided-onboarding-step-config
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-guided-onboarding-step-config/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309140000-0003
Trigger-Why:
Trigger-Intended-Outcome:
---

# prime GuidedOnboardingFlow — Step Config and Radio Fieldset Deduplication Fact-Find

## Scope

### Summary

`GuidedOnboardingFlow.tsx` (816 lines) drives a 3-step guest onboarding funnel for the Prime app. Two well-isolated structural issues inflate the component and make adding a step 4 a multi-location edit:

1. **Step config if-chains** — `stepTitle` and `stepDescription` are computed via separate `useMemo` blocks each containing 3 `if (step === N)` branches. These should be driven by `getStepTitle` and `getStepDescription` helper functions that accept the step number alongside runtime values (`guestFirstName`, `experimentVariants`, `t`) — a plain static lookup object is not viable because step 1 content depends on runtime props and renders an `<ExperimentGate>` ReactNode.
2. **Duplicated radio fieldsets** — the two fieldsets (arrival method and arrival confidence) are written out in full twice: once inside the `showConfidenceBeforeMethod` branch and once in the `!showConfidenceBeforeMethod` branch. Only the render order differs. The handlers, `aria-checked` logic, `className` strings, and item arrays are byte-for-byte identical.

A third concern — the 6-ref + 6-effect lifecycle complexity — needs scoping. The investigation below assesses whether `useReducer` is warranted or whether surgical ref/effect elimination is safer.

### Goals

- Eliminate the `if (step === N)` repetition for title/description (step config lookup extraction).
- Collapse the two duplicated radio fieldset JSX trees to a single `<RadioFieldset>` component that appears once, with its two instances reordered based on `showConfidenceBeforeMethod`.
- Confirm that these two changes are safely independent and sequenceable.
- Assess the 6-ref lifecycle pattern and recommend the minimal intervention.

### Non-goals

- Replacing the 3-step flow with a different UX.
- Migrating the component to use `useReducer` unless the assessment shows clear, low-risk benefit.
- Any i18n key changes.
- Changes to analytics event payloads.

### Constraints & Assumptions

- Constraints:
  - All existing tests in `GuidedOnboardingFlow.test.tsx` (23 test cases) and `GuidedOnboardingFlow.ds-migration.test.tsx` (2 test cases) must remain green (25 total).
  - `GuidedOnboardingFlow.ds-migration.test.tsx` (DS token verification) must remain green.
  - The `StepFlowShell` component receives `title` and `description` as props — the extraction must preserve this interface.
  - `showConfidenceBeforeMethod` is a runtime computed value (from `experimentVariants.onboardingStepOrder`); the reordering logic must remain a runtime conditional.
- Assumptions:
  - No other file imports `stepTitle` or `stepDescription` from this component — they are computed locally.
  - A plain static `STEP_CONFIG` object is not sufficient: `stepTitle` depends on `guestFirstName` (runtime prop) and `t` (i18n hook), while `stepDescription` for step 1 additionally depends on `experimentVariants.onboardingCtaCopy` (runtime computed) and renders an `<ExperimentGate>` ReactNode. The correct extraction pattern is `getStepTitle(step, guestFirstName, t)` and `getStepDescription(step, experimentVariants, t)` helpers — functions that accept runtime values and return the appropriate value. These helpers eliminate the if-chains while keeping runtime inputs explicit. A static config object of i18n key strings would only work for the non-parameterised steps (2 and 3) and would not replace the step 1 logic.

## Outcome Contract

- **Why:** Two separable improvements (step config extraction and radio fieldset extraction) can likely be executed independently. The useReducer question needs scoping — it may not be warranted if the lifecycle concerns can be addressed more surgically. Fact-find to separate and sequence the work correctly.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** GuidedOnboardingFlow step configuration driven by a lookup object rather than repeated if-chains, and duplicated radio fieldset JSX collapsed to a single reusable component.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` — the only file under investigation; self-contained client component with no downstream consumers of its internal helpers.

### Key Modules / Files

- `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` — 816-line client component (full investigation below).
- `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx` — 23 test cases covering step navigation, skip path, analytics, error toasts, skeleton loader, ARIA/focus management, and i18n key parity. Combined with the 2 DS migration tests: 25 total.
- `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.ds-migration.test.tsx` — DS token migration tests asserting no raw palette class names remain in rendered HTML.
- `apps/prime/src/lib/experiments/activationExperiments.ts` — defines `ActivationExperimentVariants` (including `onboardingStepOrder: 'standard' | 'eta-first'`); `assignActivationVariants` is called inside the component.
- `apps/prime/src/types/preArrival.ts` — defines `EtaMethod`, `ArrivalConfidence`, `ChecklistProgress`.
- `apps/prime/src/lib/preArrival.ts` — exports `getDefaultEtaWindow`, `getEtaWindowOptions`, `sortRoutesForPersonalization`, `getChecklistItemLabel`, `writeLastCompletedChecklistItem`.

### Full Component Structure — All State, Refs, Effects

**State (10 items):**

| State variable | Purpose |
|---|---|
| `step: Step (1\|2\|3)` | Active step index |
| `isSaving: boolean` | Disables save/continue buttons during async mutation |
| `celebration: string \| null` | Transient milestone message passed to `StepFlowShell` |
| `arrivalMethodPreference: EtaMethod \| null` | Step 1 transport mode selection |
| `arrivalConfidence: ArrivalConfidence \| null` | Step 1 confidence radio value |
| `selectedRouteSlug: string \| null` | Step 1 optional route pick |
| `etaWindow: string` | Step 2 arrival time window (select value) |
| `etaMethod: EtaMethod` | Step 2 arrival method (select value, defaults from step 1 selection) |
| `cashPrepared / rulesReviewed / locationSaved: boolean` | Step 3 checklist toggles (3 items) |
| `lastCompletedItem: keyof ChecklistProgress \| null` | Step 3 "last completed" contextual banner |
| `errorToast: { message, retry } \| null` | Error Toast visibility and retry callback |

**Refs (6 items):**

| Ref | Purpose |
|---|---|
| `didInitRef` | One-shot guard: prevents the data-hydration `useEffect` from re-running after initial data load. |
| `celebrationTimeoutRef` | Holds the `window.setTimeout` handle for the celebration auto-dismiss. Cleared on new celebrations and on unmount. |
| `flowCompletedRef` | Flag: set to `true` when the user completes or skips step 3. Read by the unmount effect to gate `guided_flow_abandoned` analytics. |
| `cardRef` | DOM ref to the outer card `<div>`. Used by the focus-management effect to query the `h1` heading after step transitions. |
| `stepRef` | Mirror of `step` state, kept current each render. Read by the unmount abandonment effect (closures over a stale `step` would fire with the wrong step number). |
| `prevStepRef` | Mirror of previous `step` value. Used by the focus-management effect to detect step transitions (only focus `h1` when step actually changed). |

**Effects (6 items):**

| Effect | Purpose |
|---|---|
| Data hydration (deps: `[effectiveData, isLoading]`) | On first successful data load, initialises all state from server data. Guarded by `didInitRef` so it only runs once. |
| `arrivalMethodPreference` → `etaMethod` sync (deps: `[arrivalMethodPreference]`) | When the user picks a transport method in step 1, pre-fills the `etaMethod` select in step 2. |
| `arrivalConfidence` → `etaWindow` validation (deps: `[arrivalConfidence, etaWindow]`) | When confidence changes, the set of valid ETA windows changes (confident guests get narrower windows). Resets `etaWindow` to `options[0]` if the current value is no longer in the new options list. |
| Celebration timeout cleanup (deps: `[]`) | Returns a cleanup function that clears `celebrationTimeoutRef` on unmount. Only cleans up; fires no side-effects. |
| Focus management (deps: `[step]`) | After each step change, finds the `h1` in `cardRef` and focuses it for screen readers. Uses `prevStepRef` to skip the initial mount (no step change on mount). |
| Abandonment analytics (deps: `[]`) | On unmount, fires `guided_flow_abandoned` event if `flowCompletedRef` is false. Reads `stepRef.current` for the last step. |

### Step Type and Values

```typescript
type Step = 1 | 2 | 3;
```

- **Step 1 ("Arrival style"):** Two radio fieldsets — arrival method (`ferry | bus | train | taxi`) and confidence (`confident | need-guidance`). Conditional route suggestions appear when `arrivalMethodPreference !== null`. CTA: "Save & Continue" (async, calls `setPersonalization` + optional `saveRoute`) + "Skip".
- **Step 2 ("Share ETA"):** Two `<select>` elements: arrival time window (options from `getEtaWindowOptions(arrivalConfidence)`) and travel method (all 6 `EtaMethod` values). CTA: "Save & Continue" (async, calls `setEta`) + "Skip".
- **Step 3 ("Final readiness checks"):** Three checkbox-style toggle buttons for `cashPrepared`, `rulesReviewed`, `locationSaved`. Contextual last-completed banner. CTA: "Finish" (async, calls `updateChecklistItem` for each checked item) + "Skip".

### Radio Fieldset Duplication — Exact Lines

The `showConfidenceBeforeMethod` branch exists at **lines 406–510** of `GuidedOnboardingFlow.tsx`:

- **Lines 408–433** (`showConfidenceBeforeMethod = true` branch): confidence fieldset first, then method fieldset.
- **Lines 459–509** (`showConfidenceBeforeMethod = false` branch): method fieldset first, then confidence fieldset.

The two fieldset blocks are byte-for-byte identical in terms of:
- `className` strings on `<fieldset>`, `<legend>`, the grid `<div>`, and each `<button>`
- `role="radio"`, `aria-checked` expressions
- `onClick` handlers (`setArrivalConfidence(value)` / `setArrivalMethodPreference(method)`)
- The item arrays (`['ferry', 'bus', 'train', 'taxi']` and the confidence options array)
- The `<Check>` icon conditional

The **only** difference between the two branches is the JSX render order: confidence fieldset precedes method fieldset in one branch, method precedes confidence in the other. This is a pure ordering swap — no conditional logic, no prop difference, no handler difference.

### Patterns & Conventions Observed

- Step-gated JSX rendered via `{step === N && (...)}` — no dynamic component resolution; each step body is fully inlined.
- `useMemo` used consistently for derived values (titles, descriptions, window options, route suggestions, session key, experiment variants).
- Async handlers are plain `async function` declarations (not arrow functions in `useCallback`) except for `handleOpenMaps` which uses `useCallback` because it is passed to an external DOM handler.
- i18n via `useTranslation('Onboarding')` — all string keys in the `guidedFlow.*` namespace.
- DS linting enforced: `ds/enforce-layout-primitives` and `ds/min-tap-size` each have targeted `// eslint-disable` comments with `PLAT-ENG-0001` ticket references where raw layout is intentional.
- No Redux, Zustand, or context — all state is local.

### Data & Contracts

- `StepFlowShell` props: `currentStep, totalSteps, title, description, trustCue, milestoneMessage, onBack` — no changes to this contract are proposed.
- `ExperimentGate` receives the `prime-onboarding-cta-copy` flag and wraps only the step 1 description — this usage is preserved as-is.
- `recordActivationFunnelEvent` call sites: 8 (step skips ×3, step completes ×3, abandon ×1, utility link click ×1) — none are affected by the proposed extraction.

## Ref and Effect Lifecycle Assessment

### Can Any Refs Be Eliminated?

Assessing each ref against the surgical elimination criterion (i.e., without introducing useReducer):

| Ref | Eliminatable? | Notes |
|---|---|---|
| `didInitRef` | No | Required to prevent double-init on React strict-mode double-invocation and re-renders while data is still loading. |
| `celebrationTimeoutRef` | No | Required to clear the previous timeout when a new celebration fires. Storing in state would cause an extra render cycle; a module-level variable would be unsafe in concurrent rendering. |
| `flowCompletedRef` | No | Required to read current completion status inside the unmount cleanup function without closing over stale `step` state. |
| `cardRef` | No | DOM ref; needed to query the `h1` for focus management. |
| `stepRef` | No | Needed specifically because the abandonment cleanup closes over the initial value of `step` — reading `stepRef.current` is the standard pattern. |
| `prevStepRef` | Potentially eliminatable | The current implementation initialises `prevStepRef` to `step` and mutates it inside the effect body (before the focus logic). This creates an ordering dependency. Alternative: use a `useEffect` with `step` in deps that compares against a separate `isInitialMount` flag (e.g. `didInitRef` reuse). However this is a minor complexity gain of ~1 line vs ~2 lines — not a meaningful simplification. Leave in place. |

**Verdict:** None of the 6 refs can be cleanly eliminated without introducing new complexity equal to or greater than what they replace. `useReducer` would reduce the state count from 10 to a single reducer action surface but would not eliminate any refs (refs serve lifecycle/DOM concerns that reducers don't address). The net benefit of `useReducer` here is marginal — the component already has a clear single-responsibility flow and the 10 state items are independently managed. **Recommend leaving the lifecycle pattern as-is.** The two extractable improvements (step config lookup + radio fieldset component) are sufficient scope for one build task without the lifecycle refactor.

## Separability Assessment

The two proposed changes are fully independent:

| Change | Touches | Risk |
|---|---|---|
| (A) Extract step helper functions | `stepTitle` useMemo block (L196–206), `stepDescription` useMemo block (L208–224) only. Produces two helper functions (`getStepTitle`, `getStepDescription`) that accept runtime arguments and return the appropriate value/ReactNode. Replaces the if-chains with single helper calls. | Low — pure refactor, same output, same memoization. |
| (B) Extract `<RadioFieldset>` component | Lines 406–510 (step 1 fieldset block). Produces a new local function component `RadioFieldset` and replaces the duplicated JSX with two sequential `<RadioFieldset>` renders inside a `<>` fragment, reordered by `showConfidenceBeforeMethod`. | Low — pure JSX extraction, same rendered DOM, same event handlers. |

The changes can be done in either order or as a combined single task. Since the overall scope is small (~30–50 lines changed), combining them into one task is preferred to avoid over-sequencing.

## Existing Test Coverage

The test suite in `GuidedOnboardingFlow.test.tsx` covers:

- **TC-02** (outer): step navigation preserves state across transitions; validates `setPersonalization` call args and `etaMethod` propagation.
- **TC-03** (outer): skip path through all 3 steps; validates no checklist updates are fired.
- **OB-01 TC-01–TC-05**: skip analytics per step, abandonment analytics on unmount, no abandon event after completion.
- **OB-03 TC-01–TC-05**: error toast per step, retry action, no toast on success.
- **OB-04 TC-01–TC-03**: help link presence, analytics, step persistence.
- **OB-05 TC-01–TC-03**: skeleton loader, tip text, non-loading state.
- **OB-06 TC-02–TC-04**: focus management on step transitions (forward and back).
- **OB-02 TC-06–TC-07**: i18n key parity EN/IT.

All test mocks set `onboardingStepOrder: 'standard'` (main test file) or `onboardingStepOrder: 'method-first'` (DS migration test file — note: this is not a valid production variant; valid values are `'standard' | 'eta-first'`). Neither test file exercises the real `eta-first` / `showConfidenceBeforeMethod = true` variant — the fieldset ordering switch is not covered by any test. This is a gap but does not block the refactor; the extraction preserves the conditional and the rendered DOM is unchanged.

**Coverage gap identified:** There is no test that asserts the `showConfidenceBeforeMethod = true` branch renders confidence before method. Recommend adding a test in the build task as part of the `<RadioFieldset>` extraction.

## Access Declarations

None — this fact-find is purely a static code investigation with no external data sources, APIs, services, or databases required.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Component structure — all state, refs, effects | Yes | None | No |
| Step type/values and step 1–3 render content | Yes | None | No |
| Radio fieldset duplication — exact lines | Yes | None | No |
| Independent separability of changes A and B | Yes | None | No |
| Ref lifecycle assessment — useReducer need | Yes | None | No |
| Test coverage landscape | Yes | Minor: `eta-first` variant fieldset ordering not covered by any test | No (advisory — add test in build task) |
| Integration boundaries (StepFlowShell, ExperimentGate, analytics) | Yes | None | No |

No critical findings. Minor advisory gap: add a test for `showConfidenceBeforeMethod = true` ordering during the `<RadioFieldset>` extraction.

## Scope Signal

Signal: **right-sized**

Rationale: The two extractable improvements are independently verifiable, touch a bounded set of lines (~30–50 LOC changed), have existing test coverage for the critical paths, and require no external dependencies or API contract changes. The lifecycle refactor (useReducer) was assessed and is not warranted — keeping it out of scope is the correct call. The combined change is a single low-risk build task.

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All claims about line numbers, ref purposes, and effect logic were verified against the full 816-line source.
2. **Boundary coverage**: `StepFlowShell` and `ExperimentGate` integration boundaries inspected; no contract changes required.
3. **Test coverage**: Existing tests verified (file read, not just listed). Coverage gap for `eta-first` variant identified.
4. **Error/fallback paths**: All three async handlers have `catch` blocks. Steps 1 and 2 fire error toasts and advance to the next step. Step 3 fires an error toast and calls `onComplete()` directly (completing the flow rather than advancing). All catch-path behaviors are preserved by the proposed extraction.
5. **Security boundaries**: No auth/authz surface; component is client-only, all mutations go through `usePreArrivalMutator`.

### Confidence Adjustments

- Starting confidence from dispatch: 0.81.
- No downward adjustments — evidence fully confirms the duplication pattern, the exact lines, and the separability.
- Minor upward confirmation: `useReducer` was explicitly assessed and found unwarranted, aligning with dispatch's "may not be warranted" hedge.
- Final confidence: **0.85** — the only remaining gap is the missing `eta-first` variant test, which is an advisory add-during-build, not a blocker.

### Remaining Assumptions

- No other file in `apps/prime` imports helpers from `GuidedOnboardingFlow.tsx` (confirmed by scope: no named exports; default export only).
- The new `<RadioFieldset>` local component will be co-located in the same file (no separate file needed given it's component-local).
- Adding the `eta-first` variant test in the build task does not require new mock infrastructure — the existing `assignActivationVariants` mock is already parameterisable.

## Open Questions

All questions were self-resolved during investigation.

1. **Q: Can `prevStepRef` be eliminated?** Resolved: Minor complexity trade-off; not worth removing. Leave in place.
2. **Q: Should the step config be a file-level constant or helper functions?** Resolved: Helper functions (`getStepTitle`, `getStepDescription`) co-located in the same file — a static lookup object is insufficient because step 1 title/description depend on runtime arguments (`guestFirstName`, `experimentVariants.onboardingCtaCopy`, `t`). No module export needed; helpers can be file-local.
3. **Q: Do both changes (A + B) need separate tasks?** Resolved: No — combined scope is ~30–50 LOC; a single build task is correct.

## Recommended Plan Shape

**Single task** combining:

- Extract `getStepTitle(step, guestFirstName, t)` and `getStepDescription(step, experimentVariants, t)` helper functions to eliminate the `if (step === N)` repetition in the `stepTitle` and `stepDescription` useMemos. (A plain static object is not sufficient because step 1 title and description depend on runtime props and experiment variant values.)
- Extract `<ArrivalMethodFieldset>` and `<ArrivalConfidenceFieldset>` as local function components (or a single `<RadioFieldset>` parameterised by items/handler/checked/legend), replacing lines 406–510.
- Add one new test asserting that `showConfidenceBeforeMethod = true` renders the confidence fieldset before the method fieldset.
- **Do not touch**: ref/effect lifecycle, analytics payloads, i18n keys, `StepFlowShell` props, DS token classes.

**Estimated LOC delta**: −50 to −80 lines (net reduction from deduplication + more compact config expressions).
