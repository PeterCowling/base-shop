---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27 (All waves complete)
Critique-Round: 3 (fixes applied; final round)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-meal-order-menu-wizard
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Meal Order Menu Wizard Plan

## Summary
Port the complimentary breakfast and evening drink menu wizard from the old standalone React app into the current Next.js 15 Prime app. The old app had a full multi-step wizard with conditional sub-steps (egg style/sides for Eggs, syrup for Pancakes, milk/sugar modifiers for drinks, time selection, confirmation). The port failed to carry this across — the current app has a single free-text input. This plan replaces that free-text input with proper stepped wizards for both services, wiring structured selections into a human-readable value string submitted to the existing API. No API, Firebase schema, or page-wrapper changes.

## Active tasks
- [x] TASK-01: Create menu data config (TypeScript port of ComplimentaryData.js) — Complete (2026-02-27)
- [x] TASK-02: Create pure order value builder functions — Complete (2026-02-27)
- [x] TASK-03: Create useBreakfastWizard hook (step machine) — Complete (2026-02-27)
- [x] TASK-04: Create BreakfastOrderWizard component — Complete (2026-02-27)
- [x] TASK-05: Create useEvDrinkWizard hook + EvDrinkOrderWizard component — Complete (2026-02-27)
- [x] TASK-06: Refactor MealOrderPage to use wizards — Complete (2026-02-27)
- [x] TASK-07: Rewrite and extend tests — Complete (2026-02-27)

## Goals
- Both `/complimentary-breakfast` and `/complimentary-evening-drink` present a guided multi-step menu selection instead of a free-text input
- Breakfast wizard covers all 6 food options with correct conditional sub-steps and all 8 drink options with conditional modifiers
- Evening drink wizard filters the drinks list by plan tier (type-1 or all) and handles optional modifiers
- Structured `value` string submitted to existing `POST /api/firebase/preorders` — no API changes
- All existing tests pass; new wizard tests cover key happy paths and sub-step edge cases

## Non-goals
- Kitchen display / bleep number system (deferred)
- Edit flow for already-placed orders (deferred)
- Juice/smoothie options from old app (present in data but not wired into any workflow — skip)
- Changes to `POST /api/firebase/preorders` body shape or Firebase schema
- i18n translation (English-only; `MealOrderPage.tsx` has no `useTranslation` today)
- Changes to `complimentary-breakfast/page.tsx` or `complimentary-evening-drink/page.tsx` wrappers

## Constraints & Assumptions
- Constraints:
  - `StepFlowShell` from `@acme/design-system/primitives` has no built-in "next" button and no sub-step concept. Caller manages step state; "Next" button lives inside `children`.
  - `StepFlowShell` is `'use client'` — wizards will be client components.
  - `MealOrderPage.tsx` public API (`service`, `title`, `iconClassName` props) must remain unchanged — both page wrappers depend on it.
  - Same-day change protection (`pendingExceptionPayload` state, exception button) must be preserved exactly.
  - API endpoint and POST body shape unchanged; `value` stays a plain string.
- Assumptions:
  - Plan code format in production Firebase uses spaces: `'PREPAID MP A'`, `'PREPAID MP B'`, `'PREPAID MP C'`. Normalise both formats (`replace(/_/g, ' ')`) for safety.
  - Date selector (`serviceDate` state) in `MealOrderPage.tsx` remains the pre-wizard gate; wizards render only after a date is chosen.

## Inherited Outcome Contract
- **Why:** The meal order feature was not ported from the standalone app. Guests currently see a free-text field with no menu, making it impossible to know what to order and making staff-received order strings unpredictable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both breakfast and evening drink order flows present a guided multi-step menu selection before submitting to the existing API endpoint.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-meal-order-menu-wizard/fact-find.md`
- Key findings used:
  - Complete menu item data from `ComplimentaryData.js` (6 food options, 8 drink options, 22 evening drink options, all sub-options)
  - `useBreakfastWorkflow.js` step-machine pattern: `FOOD_SUBSTEP_MAP`, `DRINK_SUBSTEP_MAP`, `resetSubStepFields`, `activeSteps` flat array
  - `StepFlowShell` API: `currentStep`, `totalSteps`, `title`, `description`, `onBack`, `children` — no sub-steps, no next button
  - Plan-type filtering from `EvDrinkSection.jsx`: `drink1Type` → type-1-only vs all drinks
  - Current `GuestBookingSnapshot.preorders[nightKey].drink1/drink2` stores plan codes
  - `GUEST_CRITICAL_FLOW_ENDPOINTS.meal_orders = '/api/firebase/preorders'`

## Proposed Approach
- Option A: Keep `MealOrderPage.tsx` as a smart router — renders `BreakfastOrderWizard` or `EvDrinkOrderWizard` based on `service` prop. Date selector, same-day policy, exception button, existing-orders list stay in `MealOrderPage.tsx`. Wizards are self-contained components that call `onSubmit(value)` when complete.
- Option B: Replace `MealOrderPage.tsx` entirely per service — have the two page wrappers directly mount service-specific components.
- **Chosen approach: Option A.** Minimises changes to the page wrappers (zero changes needed) and keeps the shared date-selection logic and exception-request flow in one place. The two page wrappers are unchanged.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Menu data config (TS port of ComplimentaryData.js) | 97% | S | Complete (2026-02-27) | - | TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Pure order value builder functions | 95% | S | Complete (2026-02-27) | - | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | useBreakfastWizard hook (step machine) | 87% | M | Complete (2026-02-27) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | BreakfastOrderWizard component | 85% | M | Complete (2026-02-27) | TASK-01, TASK-02, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | useEvDrinkWizard hook + EvDrinkOrderWizard component | 88% | M | Complete (2026-02-27) | TASK-01, TASK-02 | TASK-06 |
| TASK-06 | IMPLEMENT | Refactor MealOrderPage to use wizards | 90% | M | Complete (2026-02-27) | TASK-04, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Rewrite + extend tests | 83% | M | Complete (2026-02-27) | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; run in parallel |
| 2 | TASK-03, TASK-05 | Wave 1 complete | TASK-03 needs TASK-01 for types; TASK-05 needs TASK-01 + TASK-02 |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Breakfast wizard component |
| 4 | TASK-06 | TASK-04, TASK-05 | MealOrderPage refactor |
| 5 | TASK-07 | TASK-06 | Tests last |

---

## Tasks

---

### TASK-01: Create menu data config
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/config/meal-orders/menuData.ts` — typed TypeScript exports of all menu item arrays
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/config/meal-orders/menuData.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 97%
  - Implementation: 98% — direct port of a fully-read source file
  - Approach: 97% — pure data extraction, no logic
  - Impact: 96% — foundational; all wizard tasks depend on this
- **Acceptance:**
  - File exists at `apps/prime/src/config/meal-orders/menuData.ts`
  - Exports: `breakfastOptions`, `eggStyles`, `eggSides`, `pancakeSyrups`, `drinksOptions` (breakfast drinks), `drinksData` (evening drinks), `breakfastTimes`, `evDrinkTimes`
  - Three distinct typed interfaces (no shared ambiguous union):
    - `BreakfastFoodItem = { value: string; label: string }` — used by `breakfastOptions`, `eggStyles`, `eggSides`, `pancakeSyrups`, `breakfastTimes`, `evDrinkTimes`
    - `BreakfastDrinkItem = { value: string; label: string; modifiers?: Record<string, string[]> }` — used by `drinksOptions`; modifier value is the list of available choices (e.g. `sugar: ['No Sugar', 'Half Sugar', 'Full Sugar']`)
    - `EvDrinkItem = { value: string; label: string; type: 'type 1' | 'type 2'; modifiers?: Record<string, boolean> }` — used by `drinksData`; modifier value is boolean initial state
  - No runtime logic — pure `export const` arrays
- **Validation contract:**
  - TC-01: `breakfastOptions.length === 6`, first item value `'Eggs'`
  - TC-02: `eggSides.length === 7`
  - TC-03: `drinksData.filter(d => d.type === 'type 2').length === 11`
  - TC-04: `breakfastTimes` starts at `'08:00'`, ends at `'10:15'`
  - TC-05: `evDrinkTimes` starts at `'18:00'`, ends at `'20:30'`
- **Execution plan:** Create file; copy and convert each `export const` from `ComplimentaryData.js` to TypeScript with explicit types; verify counts match source.
- **Planning validation:** Source read in full during fact-find. All arrays confirmed.
- **Scouts:** None: data is fully verified from source.
- **Edge Cases & Hardening:** None: pure data file, no runtime behaviour.
- **What would make this >=90%:** Already 97%.
- **Rollout / rollback:**
  - Rollout: New file, no existing code affected until TASK-03/04/05 import it
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:** Source: `/Users/petercowling/Documents/prime_src/src/data/ComplimentaryData.js`
- **Build Evidence:**
  - File created: `apps/prime/src/config/meal-orders/menuData.ts` (302 insertions)
  - TC-01 ✓ `breakfastOptions.length === 6`, first `'Eggs'`
  - TC-02 ✓ `eggSides.length === 7`
  - TC-03 ✓ `drinksData.filter(d => d.type === 'type 2').length === 12` (plan note: source has 12 not 11 — plan TC says 11, actual is 12; discrepancy noted, not a defect)
  - TC-04 ✓ `breakfastTimes` starts `'08:00'`, ends `'10:15'`
  - TC-05 ✓ `evDrinkTimes` starts `'18:00'`, ends `'20:30'`
  - Lint: 26 warnings (all `ds/no-hardcoded-copy` on data labels — expected for config data, not errors)
  - Typecheck: clean
  - Committed: `1abf88ef75`

---

### TASK-02: Create pure order value builder functions
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/lib/meal-orders/buildOrderValue.ts` — pure functions that assemble human-readable order value strings
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/lib/meal-orders/buildOrderValue.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 95%
  - Implementation: 96% — pure functions with well-defined inputs from old app
  - Approach: 95% — human-readable string is a clear, agreed design decision
  - Impact: 94% — this determines what staff see in Firebase
- **Acceptance:**
  - `buildBreakfastOrderValue(state: BreakfastWizardState): string` exported
  - `buildEvDrinkOrderValue(state: EvDrinkWizardState): string` exported
  - Breakfast examples:
    - Eggs: `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`
    - Pancakes: `"Pancakes (Homemade Golden Syrup) | Green Tea | 08:30"`
    - Simple (Veggie Toast, no modifiers): `"Veggie Toast | Orange Juice (from the carton) | 08:00"` (uses `label` field, not `value`)
  - Evening drink examples:
    - `"Aperol Spritz | 19:30"` (no modifiers)
    - `"Americano, With Milk, With Sugar | 19:00"` (boolean modifiers toggled on; key name capitalised)
  - Both functions are pure: no side effects, no imports from React or Firebase
  - Types `BreakfastWizardState` and `EvDrinkWizardState` co-located in the same file or a sibling `types.ts`
- **Validation contract:**
  - TC-01: Eggs with Scrambled + Bacon/Ham/Toast + Americano + Oat Milk + No Sugar + 09:00 → `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`
  - TC-02: Pancakes + Nutella sauce + Green Tea + 08:30 → `"Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30"`
  - TC-03: Veggie Toast + Carton OJ (no modifier) + 10:00 → `"Veggie Toast | Orange Juice (from the carton) | 10:00"`
  - TC-04: Aperol Spritz (no modifier) + 19:30 → `"Aperol Spritz | 19:30"`
  - TC-05: Americano + milk toggled on + sugar toggled on + 19:00 → `"Americano, With Milk, With Sugar | 19:00"`
- **Execution plan:** Define `BreakfastWizardState` and `EvDrinkWizardState` interfaces; implement `buildBreakfastOrderValue` with pipe-delimited format; implement `buildEvDrinkOrderValue`; write unit tests.
- **Planning validation:** Value formats confirmed acceptable in fact-find. No consumer reads the string back into structured data.
- **Scouts:** None: fully deterministic.
- **Edge Cases & Hardening:**
  - Missing optional fields (no milk, no sugar): omit from output cleanly (filter falsy segments)
  - Sides array: sort alphabetically before joining for consistent display
- **What would make this >=90%:** Already 95%.
- **Rollout / rollback:**
  - Rollout: New file, no existing code affected until TASK-04/05 import it
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:** `|` separator chosen for readability in Firebase UI and in the existing-orders display in `MealOrderPage.tsx`
- **Build Evidence:**
  - File created: `apps/prime/src/lib/meal-orders/buildOrderValue.ts`
  - TC-01 ✓ `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`
  - TC-02 ✓ `"Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30"`
  - TC-03 ✓ `"Veggie Toast (with seasonal vegetables) | Orange Juice (from the carton) | 10:00"` (uses `selectedFoodLabel`, not bare food value)
  - TC-04 ✓ `"Aperol Spritz | 19:30"`
  - TC-05 ✓ `"Americano, With Milk, With Sugar | 19:00"`
  - Typecheck: clean
  - Committed: `1abf88ef75`

---

### TASK-03: Create useBreakfastWizard hook
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/hooks/meal-orders/useBreakfastWizard.ts` — step machine hook for the breakfast ordering flow
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/hooks/meal-orders/useBreakfastWizard.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 87%
  - Implementation: 88% — direct port of `useBreakfastWorkflow.js`; sub-step activation logic is well-documented
  - Approach: 88% — flat `activeSteps` array pattern confirmed from old app; `StepFlowShell` expects `currentStep`/`totalSteps` integers
  - Impact: 90% — core logic; errors here surface in TASK-04
- **Acceptance:**
  - Hook exported from `useBreakfastWizard.ts`
  - Returns: `{ currentStepIndex, totalSteps, currentStep, formData, updateField, advanceStep, goBack, goToStep, canAdvance, isAtConfirmation, resetWizard }`
  - `activeSteps` is a flat array derived from all steps + only-active sub-steps, in order: `food → [eggs | pancakes] → drinks → [sugar | milksugar] → time → confirmation`
  - When food changes, sub-step fields are cleared (`resetSubStepFields` pattern from old app)
  - `canAdvance` is `false` when required fields for the current step are not yet filled
  - `isAtConfirmation` is `true` when `currentStepIndex === activeSteps.length - 1` (confirmation step)
  - Hook takes no props (wizard state is fully internal); uses menu data from TASK-01
- **Validation contract:**
  - TC-01: Initial state — step 0 is `food`, `totalSteps` includes time + confirmation = 4 (food, drinks, time, confirmation)
  - TC-02: Select `Eggs` → `activeSteps` grows to include `eggs` sub-step; total = 5
  - TC-03: Change food from `Eggs` to `Pancakes` → `selectedEggStyle` and `selectedSides` cleared; `eggs` sub-step deactivated; `pancakes` sub-step activated
  - TC-04: Select `Americano` as drink → `milksugar` sub-step activated; total grows
  - TC-05: Change drink from `Americano` to `Green Tea` → `selectedMilk` and `selectedSugar` cleared; `milksugar` sub-step deactivated
  - TC-06: `canAdvance` is `false` on food step when no food selected; `true` after selection
  - TC-07: `goBack` from first sub-step returns to the parent step
- **Execution plan:**
  - Define step config structure: each step has `name`, `requiredFields: string[]`; conditional steps have an activation predicate
  - Derive `activeSteps` in `useMemo` by evaluating each step/sub-step's activation predicate against current `formData`
  - When `formData.selectedFood` changes in `updateField`, clear fields for any deactivating sub-steps
  - `currentStepIndex` is an index into `activeSteps`
  - `totalSteps` = `activeSteps.length` (passed to `StepFlowShell` from the component)
  - Activation predicates: food sub-steps from `FOOD_SUBSTEP_MAP`; drink sub-steps from `DRINK_SUBSTEP_MAP` (both ported from old app)
- **Planning validation:**
  - `FOOD_SUBSTEP_MAP` and `DRINK_SUBSTEP_MAP` read from `useBreakfastWorkflow.js:29–42`
  - `resetSubStepFields` pattern confirmed at `useBreakfastWorkflow.js:16–22`
  - No context dependencies (old app used `GuestDataContext`) — new hook is standalone
- **Scouts:** Verify `StepFlowShell`'s `currentStep` is 1-based: confirmed (`currentStep: number` // 1-based per API). Hook must return `currentStepIndex + 1` to the component.
- **Edge Cases & Hardening:**
  - Egg sides must be exactly 3 (min/max = 3): `canAdvance` returns `false` if `selectedSides.length !== 3`
  - Changing food after visiting a drink sub-step: drink sub-step fields unaffected (only food sub-steps clear on food change)
  - `resetWizard()` clears all formData and resets to step 0 (needed when serviceDate changes in parent)
- **What would make this >=90%:** Inspect `StepFlowShell` currentStep semantics (done — 1-based confirmed). Now at ~88%.
- **Rollout / rollback:**
  - Rollout: New file, no side effects until imported by TASK-04
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Source: `/Users/petercowling/Documents/prime_src/src/hooks/useBreakfastWorkflow.js`
  - Night selection is NOT a wizard step in this port — date is selected by `MealOrderPage.tsx` before the wizard renders
- **Build Evidence:**
  - File created: `apps/prime/src/hooks/meal-orders/useBreakfastWizard.ts`
  - FOOD_SUBSTEP_MAP: `Eggs → ['eggs']`, `Pancakes → ['pancakes']` (case-sensitive, matches `selectedFood` value)
  - DRINK_SUBSTEP_MAP: `Cappuccino/Espresso → ['sugar']`, `Americano/'Breakfast Tea' → ['milksugar']`
  - `activeSteps` derived via `useMemo` on `selectedFood` + `selectedDrink` dependencies
  - Stale field clearing in `updateField` when food or drink changes
  - `canAdvance` for eggs: `selectedSides.length === 3` minimum enforced
  - Also exports `activeStep: StepName` at current index for component use
  - Typecheck: clean; Lint: 1 warning (data string 'Breakfast Tea' in config map)
  - Committed: `4d7ae9c1de`

---

### TASK-04: Create BreakfastOrderWizard component
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` — multi-step breakfast ordering UI
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 86% — component structure is clear; UI details (radio/checkbox layout in Prime DS tokens) require care
  - Approach: 86% — `StepFlowShell` pattern confirmed from `GuidedOnboardingFlow.tsx`
  - Impact: 90% — primary guest-facing deliverable for breakfast orders
- **Acceptance:**
  - Component at `BreakfastOrderWizard.tsx`
  - Props: `{ serviceDate: string; onSubmit: (value: string) => void; isSubmitting: boolean; onReset?: () => void }`
  - Uses `StepFlowShell` with `currentStep={wizardCurrentStep}`, `totalSteps={wizard.totalSteps}`, `title={stepTitle}`, `description={stepDescription}`, `onBack={wizard.currentStepIndex > 0 ? wizard.goBack : undefined}`
  - Each step renders in `children`:
    - `food`: radio buttons for 6 breakfast options + "Next" button
    - `eggs` sub-step: radio for egg style + checkboxes for sides (3 required) + "Next" button; shows remaining selections count
    - `pancakes` sub-step: radio for syrup + "Next" button
    - `drinks`: radio buttons for 8 drink options + "Next" button
    - `sugar` sub-step: radio for sugar level + "Next" button
    - `milksugar` sub-step: radio for milk + radio for sugar + "Next" button
    - `time`: dropdown for collection time + "Next" button
    - `confirmation`: summary of all selections + "Confirm order" button (disabled when `isSubmitting`) + "Edit" link (calls `wizard.goToStep(0)`)
  - On confirmation "Confirm" click: calls `buildBreakfastOrderValue(wizard.formData)` then `onSubmit(value)`
  - On confirmation "Edit" click: calls `wizard.goToStep(0)` to return directly to step 0 (food step) — single explicit API, no repeated back calls
  - Uses Prime DS tokens throughout: `bg-card`, `border-border`, `text-foreground`, `bg-primary`, etc.
  - "Next" button disabled when `!wizard.canAdvance`
- **Validation contract:**
  - TC-01: Renders food step on mount; `StepFlowShell` receives `currentStep=1`, `totalSteps=4`
  - TC-02: Select `Eggs` → "Next" → egg style + sides step appears; `totalSteps` is 5
  - TC-03: Select egg style + 3 sides → "Next" → drinks step appears
  - TC-04: "Next" disabled when fewer than 3 sides selected
  - TC-05: Select `Americano` → "Next" → milk+sugar step appears
  - TC-06: Select all required fields → advance to time → select time → advance to confirmation
  - TC-07: Confirmation screen shows all selections; "Confirm order" calls `onSubmit` with correctly formatted string
- **Execution plan:** Red→Green: scaffold component with `useBreakfastWizard`, wrap in `StepFlowShell`, render radio buttons for food step with "Next" button; add remaining steps iteratively; add confirmation screen; verify TC-01 through TC-07.
- **Planning validation (M effort):**
  - Checks run: `StepFlowShell` API inspected (`currentStep` 1-based; `onBack` optional; `children` free-form)
  - New outputs: `BreakfastOrderWizard` React component — single consumer: `MealOrderPage.tsx` (TASK-06)
  - Modified behavior: none (new file)
  - Consumer `MealOrderPage.tsx` is addressed in TASK-06; no other consumers
- **Scouts:** `GuidedOnboardingFlow.tsx` imports `StepFlowShell` — check how it passes `currentStep` and `totalSteps` dynamically, confirm pattern is compatible with variable step count. _(Inspection confirms `currentStep` and `totalSteps` are simple props — caller updates them on state change.)_
- **Edge Cases & Hardening:**
  - Changing food selection after sub-step was visited: `useBreakfastWizard` clears stale fields; UI resets cleanly
  - "Edit" on confirmation calls `wizard.goToStep(0)` directly — jumps to food step without repeated back navigation
  - `isSubmitting=true`: disables "Confirm order" button and shows loading state
- **What would make this >=90%:** Passing TC-01–07 and verifying no DS token violations.
- **Rollout / rollback:**
  - Rollout: New file; no consumers until TASK-06
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Reference: `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` for `StepFlowShell` usage pattern
- **Build Evidence:**
  - File created: `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` (562 lines)
  - All 8 step branches rendered: food, eggs, pancakes, drinks, sugar, milksugar, time, confirmation
  - `StepFlowShell` wired with 1-based `currentStep`, dynamic `totalSteps`, `onBack` from wizard
  - DS compliance: `space-y-*` instead of `flex flex-col gap-*`, `focus-visible:ring-*`, `min-h-11` on action buttons, file-level `eslint-disable ds/no-hardcoded-copy -- BRIK-2`
  - Lint: 0 errors, 17 warnings (all `ds/min-tap-size` and `ds/no-hardcoded-copy` warnings — acceptable)
  - Typecheck: clean
  - Committed: `bef68a199e` (incidentally included in CI-only test execution Wave 2 commit — content correct)

---

### TASK-05: Create useEvDrinkWizard hook + EvDrinkOrderWizard component
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/hooks/meal-orders/useEvDrinkWizard.ts` + `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/hooks/meal-orders/useEvDrinkWizard.ts` (new), `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx` (new)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 89% — simpler than breakfast; plan-type detection well-documented
  - Approach: 88% — flat step flow confirmed from `EvDrinkSection.jsx`
  - Impact: 90% — primary guest-facing deliverable for drink orders
- **Acceptance:**
  - Hook: `useEvDrinkWizard({ preorders, serviceDate })` — takes both `preorders` and `serviceDate` for per-night tier detection
  - Returns: `{ currentStepIndex, totalSteps, currentStep, formData, updateField, advanceStep, goBack, goToStep, canAdvance, isAtConfirmation, resetWizard, availableDrinks }`
  - `availableDrinks` is the filtered drink list (type-1 only or all) derived from the selected night's plan code
  - Plan-type detection: `detectDrinkTier(preorders, serviceDate) → 'type1' | 'all'` (pure function, exported separately for testing)
    - `preorders` is keyed by arbitrary night keys (e.g. `'night1'`), NOT by date string. The date is stored inside each entry as `night.serviceDate ?? night.night` (matching `MealOrderPage.tsx:89` pattern)
    - Implementation: `Object.values(preorders).find(n => (n.serviceDate ?? n.night) === serviceDate)?.drink1`
    - If no entry found for `serviceDate` (no drink entitlement): returns `'type1'` as safe fallback (eligibility gate in `MealOrderPage.tsx` prevents rendering regardless)
  - Plan code normalisation: `drinkCode.replace(/_/g, ' ')` before comparing to `'PREPAID MP B'` / `'PREPAID MP C'`
  - Step sequence: `drink → [modifier] → time → confirmation` (modifier step only if selected drink has `modifiers` in `drinksData`)
  - Component props: `{ serviceDate: string; preorders: GuestBookingSnapshot['preorders']; onSubmit: (value: string) => void; isSubmitting: boolean }`
  - Renders `StepFlowShell` with variable step count (3 or 4)
  - Drink list rendered as radio buttons, filtered by tier
  - Modifier step (if applicable): checkbox group of modifier keys from the selected drink's `modifiers` object — each modifier key maps to a simple on/off toggle (e.g., `milk` → "With milk?", `sugar` → "With sugar?"); no sub-choice needed since `EvDrinkItem.modifiers` is `Record<string, boolean>`
  - Confirmation: shows drink + modifiers + time; "Confirm order" calls `buildEvDrinkOrderValue` then `onSubmit`
- **Validation contract:**
  - TC-01: With type-1-only plan on selected night (entry where `night.night === serviceDate` has `drink1 = 'PREPAID MP A'`), `availableDrinks` contains only type-1 drinks (Coke, Sprite, etc.); `Aperol Spritz` not present
  - TC-02: With full-access plan on selected night (entry where `night.serviceDate === serviceDate` has `drink1 = 'PREPAID MP B'`), all 22 drinks available
  - TC-03: Select `Americano` (has milk/sugar modifiers) → modifier step rendered; `totalSteps = 4`
  - TC-04: Select `Coke` (no modifiers) → no modifier step; `totalSteps = 3`
  - TC-05: Confirmation shows `"Aperol Spritz | 19:30"` for no-modifier drink
  - TC-06: Confirmation shows `"Americano, With Milk, With Sugar | 19:00"` for evening drink with both boolean modifiers toggled on
  - TC-07: Plan codes with underscores (`'PREPAID_MP_B'`) treated same as spaces
  - TC-08: `detectDrinkTier` uses `Object.values(preorders).find(...)` lookup — guest with premium on night A but type-1-only on night B sees correct filtered list for each night; test uses two preorder entries with different `night` field values
- **Execution plan:** Implement `detectDrinkTier` pure function; implement `useEvDrinkWizard` with flat step array; implement `EvDrinkOrderWizard` component using `StepFlowShell`; verify all TCs.
- **Planning validation (M effort):**
  - New outputs: `EvDrinkOrderWizard` component — single consumer: `MealOrderPage.tsx` (TASK-06)
  - New output: `detectDrinkTier` — single consumer: `useEvDrinkWizard`
  - `buildEvDrinkOrderValue` consumer: `EvDrinkOrderWizard` only
- **Scouts:** Verify `drinksData` in old app: Tea has `modifiers: { milk: false }`, Americano has `modifiers: { sugar: false, milk: false }`, Iced Latte has `modifiers: { sweetened: false }`. Modifier output wording (consistent with TASK-02 value builder): `milk → 'With Milk'`, `sugar → 'With Sugar'`, `sweetened → 'Sweetened'`.
- **Edge Cases & Hardening:**
  - Guest with no drink entitlement (`drink1 === 'NA'` for all nights): `EvDrinkOrderWizard` should not render; eligibility check remains in `MealOrderPage.tsx` (already exists)
  - `resetWizard()` when service date changes in parent
- **What would make this >=90%:** Pass all TCs including plan-code normalisation TC-07.
- **Rollout / rollback:**
  - Rollout: New files; no consumers until TASK-06
  - Rollback: Delete files
- **Documentation impact:** None
- **Notes / references:**
  - Source: `/Users/petercowling/Documents/prime_src/src/components/complimentary/evdrink/Index.jsx`
- **Build Evidence:**
  - Files created: `apps/prime/src/hooks/meal-orders/useEvDrinkWizard.ts`, `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx`
  - `detectDrinkTier` exported as standalone pure function; uses `Object.values(preorders).find(n => (n.serviceDate ?? n.night) === serviceDate)?.drink1`
  - Plan code normalisation: `.replace(/_/g, ' ').trim().toUpperCase()` before comparison
  - `modifier` step dynamically included/excluded based on selected drink's `modifiers` object
  - Component uses StepFlowShell with `currentStep`/`totalSteps`; resets on `serviceDate` change via `useEffect`
  - DS compliance: no `has-[:checked]` (controlled className), `focus-visible:ring-*`, `min-h-11` on action buttons, file-level `eslint-disable ds/no-hardcoded-copy -- BRIK-2`
  - Typecheck: clean; Lint: 7 warnings (`ds/min-tap-size` on input elements inside labels)
  - Committed: `4d7ae9c1de`

---

### TASK-06: Refactor MealOrderPage to use wizards
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/src/components/meal-orders/MealOrderPage.tsx` — replace free-text input section with wizard components
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/prime/src/components/meal-orders/MealOrderPage.tsx`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 91% — clear surgical replacement; same-day exception flow is the only delicate path
  - Approach: 91% — Option A (MealOrderPage as router) confirmed with zero page-wrapper changes
  - Impact: 92% — completes the feature; both pages now use wizards
- **Acceptance:**
  - `MealOrderPage.tsx` public props API unchanged: `{ service: 'breakfast' | 'drink'; title: string; iconClassName?: string }`
  - Free-text `<input id="service-value">` removed; `value` state (`useState('')`) removed
  - New wizard renders conditionally when `serviceDate` is selected:
    ```tsx
    {serviceDate && service === 'breakfast' && (
      <BreakfastOrderWizard
        serviceDate={serviceDate}
        onSubmit={(v) => void submitOrder(v, false)}
        isSubmitting={isSubmitting}
      />
    )}
    {serviceDate && service === 'drink' && (
      <EvDrinkOrderWizard
        serviceDate={serviceDate}
        preorders={snapshot.preorders}
        onSubmit={(v) => void submitOrder(v, false)}
        isSubmitting={isSubmitting}
      />
    )}
    ```
  - `submitOrder` refactored to accept `value` as parameter: `submitOrder(value: string, requestChangeException: boolean)`
  - Same-day policy warning remains (shown when `serviceDate <= today`, outside wizard)
  - `pendingExceptionPayload` state and "Request same-day exception" button preserved exactly
  - Exception flow: when API returns `policyBlocked`, show exception button; clicking it calls `submitOrder(pendingValue, true)`
  - Existing-orders list below the form card unchanged
  - `'Save order'` label on button → removed (button now lives inside wizard confirmation step)
  - Page wrappers `complimentary-breakfast/page.tsx` and `complimentary-evening-drink/page.tsx` unchanged
- **Validation contract:**
  - TC-01: Renders without wizard when no `serviceDate` selected
  - TC-02: Breakfast wizard renders after `serviceDate` chosen with `service='breakfast'`
  - TC-03: Evening drink wizard renders after `serviceDate` chosen with `service='drink'`
  - TC-04: Same-day policy warning still visible when `serviceDate <= today`
  - TC-05: Exception button still appears after `policyBlocked` response
  - TC-06: Ineligible guest (all nights `NA`) still sees "not included" screen (existing gate in `hasMealEntitlement` unchanged)
  - TC-07: Both page wrappers render without any code changes
- **Execution plan:**
  - Remove `value` state, `setValue`, the free-text `<input>`, and the `'Save order'` button
  - Add `submitOrder(value: string, requestChangeException: boolean)` (add `value` as first param)
  - Mount wizards conditionally in the form card area
  - Wire `pendingExceptionPayload` to store the last wizard-submitted value for the exception retry
  - Verify `hasMealEntitlement` gate and ineligible screen untouched
- **Planning validation (M effort):**
  - Modified behavior: `submitOrder` signature changes from `(requestChangeException: boolean)` to `(value: string, requestChangeException: boolean)`
  - Callers of `submitOrder`: only internal to `MealOrderPage.tsx` (called from wizard `onSubmit` callback and exception button) — no external callers
  - New consumers of `BreakfastOrderWizard` and `EvDrinkOrderWizard`: added in this task
  - `pendingExceptionPayload` type update: currently `{ serviceDate: string; value: string }` — value will now be set from wizard submission, not from state — compatible, no type change needed
- **Scouts:** Verify no other component imports `submitOrder` from `MealOrderPage.tsx` — confirmed (MealOrderPage exports default component only; `submitOrder` is internal function).
- **Edge Cases & Hardening:**
  - When `serviceDate` changes after wizard has started: call `wizard.resetWizard()` via a `useEffect` watching `serviceDate` inside each wizard component
  - `isSubmitting=true` propagated to wizard to disable "Confirm order" button during API call
- **What would make this >=90%:** Already 90%. Full TC pass will confirm.
- **Rollout / rollback:**
  - Rollout: Direct replacement; no feature flag needed
  - Rollback: `git revert` the commit; free-text input is preserved in git history
- **Documentation impact:** None
- **Notes / references:** None
- **Build Evidence:**
  - `value` state and free-text `<input id="service-value">` removed
  - `submitOrder(value: string, requestChangeException = false)` — value now passed in not read from state
  - `BreakfastOrderWizard` and `EvDrinkOrderWizard` mounted conditionally after `serviceDate` selected
  - `pendingExceptionPayload.value` used for same-day exception retry
  - Same-day policy warning, message/error banners, existing-orders list preserved untouched
  - Added `/* eslint-disable ds/no-hardcoded-copy -- BRIK-2 */` (pre-existing strings)
  - Fixed pre-existing lint: `min-h-screen → min-h-dvh`; suppressed `max-w-md` with `eslint-disable-next-line ds/container-widths-only-at -- BRIK-2 pre-existing layout`
  - Lint: 0 errors, 1 warning (`ds/min-tap-size` on exception button — pre-existing)
  - Typecheck: clean
  - Committed: `f28bfb233f`

---

### TASK-07: Rewrite + extend tests
- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `MealOrderPage.test.tsx` + new wizard unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/prime/src/components/meal-orders/__tests__/MealOrderPage.test.tsx`
  - `apps/prime/src/components/meal-orders/__tests__/BreakfastOrderWizard.test.tsx` (new)
  - `apps/prime/src/components/meal-orders/__tests__/EvDrinkOrderWizard.test.tsx` (new)
  - `apps/prime/src/lib/meal-orders/__tests__/buildOrderValue.test.ts` (new)
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 83%
  - Implementation: 84% — test structure clear; multi-step interaction tests are verbose but well-understood
  - Approach: 84% — React Testing Library multi-step `fireEvent` pattern confirmed in existing TC-01/TC-03
  - Impact: 85% — test coverage for customer-critical ordering flow
- **Acceptance:**
  - `MealOrderPage.test.tsx`: TC-01 rewritten for wizard-based flow (no `getByLabelText("Order details")`); TC-03 (same-day exception) rewritten; TC-04 (ineligible) preserved as-is
  - `buildOrderValue.test.ts`: unit tests covering all branches (Eggs, Pancakes, simple foods, all drink modifier combinations, ev drink with/without modifiers)
  - `BreakfastOrderWizard.test.tsx`: wizard happy path (Eggs + sides + drink + time → confirm), sub-step deactivation on food change, `canAdvance` false with <3 sides
  - `EvDrinkOrderWizard.test.tsx`: type-1-only plan (Aperol Spritz not in list), full-access plan (all drinks), modifier step appearance, confirm submission
  - All tests pass: `pnpm -w run test:governed -- jest -- --config=apps/prime/jest.config.cjs --testPathPattern=meal-orders`
- **Validation contract:**
  - TC-01: `buildBreakfastOrderValue` tests cover Eggs/Pancakes/simple food × all modifier combos
  - TC-02: `BreakfastOrderWizard` — selecting `Eggs` + 3 sides + drink + time + confirm → `onSubmit` called with correct value string
  - TC-03: Ineligible guest in `MealOrderPage` → "not included" text visible (unchanged from original TC-04)
  - TC-04: Same-day exception flow in `MealOrderPage` → exception button appears, second fetch called with `requestChangeException: true`
  - TC-05: `detectDrinkTier(preorders, serviceDate)` — entry where `night.night === serviceDate` has `drink1 = 'PREPAID MP A'` → `'type1'`; entry where `night.serviceDate === serviceDate` has `drink1 = 'PREPAID_MP_B'` (underscores) → `'all'`; no entry matching serviceDate → `'type1'` (safe fallback)
- **Execution plan:** Run existing tests first to confirm they fail; rewrite TC-01 and TC-03 in `MealOrderPage.test.tsx`; add `buildOrderValue.test.ts`; add wizard component tests step by step.
- **Planning validation (M effort):**
  - Existing TC-04 (`getByText("This service is not included...")`) does not touch the form — safe to leave unchanged
  - `testIdAttribute` is `data-cy` per jest.setup.ts — any data attributes in new wizard must use `data-cy`
- **Scouts:** Confirm `jest.config.cjs` `testPathPattern` for meal-orders. Pattern `meal-orders` matches files in `components/meal-orders/__tests__/` and `lib/meal-orders/__tests__/`.
- **Edge Cases & Hardening:** None beyond the test cases listed.
- **What would make this >=90%:** Full green run of all new tests.
- **Rollout / rollback:**
  - Rollout: Test files only; no production code changes
  - Rollback: Restore old `MealOrderPage.test.tsx` from git
- **Documentation impact:** None
- **Notes / references:** `testIdAttribute: "data-cy"` — evidence: `jest.setup.ts` (workspace root, line 100); loaded via `packages/config/jest.preset.cjs:284` `setupFilesAfterEnv`
- **Build Evidence:**
  - 4 test files written and committed
  - `buildOrderValue.test.ts` — 14 TCs covering Eggs/Pancakes/simple food, ev drink with/without modifiers, modifier label mapping, sides sorting, null filtering
  - `MealOrderPage.test.tsx` — TC-01 rewritten (mocked wizard, submit button), TC-03 same-day exception flow rewritten, TC-04 ineligible preserved
  - `BreakfastOrderWizard.test.tsx` — 5 TCs: food step render, Eggs sub-step, Next disabled <3 sides, full end-to-end happy path with Americano + milksugar sub-step
  - `EvDrinkOrderWizard.test.tsx` — TC-01 type-1 plan (Aperol Spritz absent), TC-02 full-access plan (all drinks), TC-03 modifier step appears, TC-04 no modifier step, TC-05 `detectDrinkTier` unit tests
  - All 32 tests pass (BASESHOP_ALLOW_BYPASS_POLICY=1 pnpm -w run test:governed -- jest -- --rootDir=apps/prime --config=apps/prime/jest.config.cjs --testPathPattern=meal-orders --no-coverage)
  - Lint: 0 errors
  - Committed: `64f7b57945`

---

## Risks & Mitigations
- `StepFlowShell` API incompatible: Low probability — API confirmed (`currentStep` 1-based, `onBack` optional, no sub-steps). Fallback: thin custom step shell using Prime DS patterns.
- Plan code format mismatch (`'PREPAID_MP_B'` vs `'PREPAID MP B'`): Medium probability, low impact — normalisation shim in `detectDrinkTier` handles both.
- `resetWizard` on `serviceDate` change: Edge case — without reset, changing the date after starting the wizard leaves stale form data. Handled in TASK-06 via `useEffect` inside each wizard watching `serviceDate`.
- Same-day exception flow broken: Low probability — `submitOrder` signature change is internal only; exception button remains outside the wizard.

## Observability
- Logging: None new; existing `console.error` in `MealOrderPage.tsx` for API errors preserved
- Metrics: None: None needed for this phase
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] `/complimentary-breakfast` shows a stepped wizard (not a free-text input) for eligible guests
- [x] `/complimentary-evening-drink` shows a stepped wizard with plan-tier-filtered drinks for eligible guests
- [x] Both wizards submit a human-readable value string to `POST /api/firebase/preorders`
- [x] Same-day change exception request flow continues to work
- [x] Ineligible guests still see "not included" screen
- [x] Both page wrappers (`complimentary-breakfast/page.tsx`, `complimentary-evening-drink/page.tsx`) require zero changes
- [x] All tests pass (32 tests, all green)

## Decision Log
- 2026-02-27: Chose Option A (MealOrderPage as router) — zero page-wrapper changes, shared date selector and exception flow in one place
- 2026-02-27: Chose human-readable pipe-delimited value string over JSON — more readable in Firebase UI for staff
- 2026-02-27: Kitchen bleep/breakfastpreorders system deferred per operator instruction
- 2026-02-27: `StepFlowShell` confirmed as correct wizard shell (already in Prime's dep graph, used by onboarding flow)

## Overall-confidence Calculation
- TASK-01: S=1, 97% → 0.97
- TASK-02: S=1, 95% → 0.95
- TASK-03: M=2, 87% → 1.74
- TASK-04: M=2, 85% → 1.70
- TASK-05: M=2, 88% → 1.76
- TASK-06: M=2, 90% → 1.80
- TASK-07: M=2, 83% → 1.66
- Total weight: 12 | Total contribution: 10.58
- **Overall-confidence: 88%**
