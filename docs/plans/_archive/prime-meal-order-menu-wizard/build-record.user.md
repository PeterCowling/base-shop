---
Type: Build-Record
Status: Complete
Feature-Slug: prime-meal-order-menu-wizard
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record: Prime Meal Order Menu Wizard

## Outcome Contract

- **Why:** The meal order feature was not ported from the standalone app. Guests currently see a free-text field with no menu, making it impossible to know what to order and making staff-received order strings unpredictable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both breakfast and evening drink order flows present a guided multi-step menu selection before submitting to the existing API endpoint.
- **Source:** operator

## What Was Built

**Menu data and builder functions (TASK-01, TASK-02):** Created `apps/prime/src/config/meal-orders/menuData.ts` with all menu item arrays (6 breakfast foods, 7 egg sides, 4 syrups, 8 breakfast drinks, 22 evening drinks, time slots) and `apps/prime/src/lib/meal-orders/buildOrderValue.ts` with pure functions that produce human-readable pipe-delimited order strings (e.g. `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`).

**Breakfast wizard hook (TASK-03):** Created `apps/prime/src/hooks/meal-orders/useBreakfastWizard.ts` — a step machine that derives a flat `activeSteps` array from base steps plus conditional sub-steps (eggs/pancakes/sugar/milksugar), clears stale fields on food/drink change, and enforces `canAdvance` rules (eggs requires exactly 3 sides selected).

**Breakfast wizard component (TASK-04):** Created `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` — an 8-step form wrapped in `StepFlowShell` covering food selection, egg style + 3 sides, pancake syrup, drink selection, sugar and milk sub-steps, time selection, and a confirmation screen.

**Evening drink wizard (TASK-05):** Created `apps/prime/src/hooks/meal-orders/useEvDrinkWizard.ts` (includes exported `detectDrinkTier` pure function for per-night plan-tier filtering) and `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx` — a 3–4 step form with optional modifier step (only shown when selected drink has modifiers).

**MealOrderPage refactor (TASK-06):** Replaced the free-text input in `apps/prime/src/components/meal-orders/MealOrderPage.tsx` with conditional wizard mounts (`BreakfastOrderWizard` or `EvDrinkOrderWizard` based on `service` prop). `submitOrder` refactored to accept `value` as a parameter. Same-day policy warning, exception button, and existing-orders list preserved untouched. Page wrappers unchanged.

**Tests (TASK-07):** Rewrote `MealOrderPage.test.tsx` (both wizard components mocked; TC-01 and TC-03 updated for wizard flow, TC-04 preserved). Created `buildOrderValue.test.ts` (14 unit tests), `BreakfastOrderWizard.test.tsx` (5 multi-step RTL tests), `EvDrinkOrderWizard.test.tsx` (5 RTL tests + detectDrinkTier unit tests). 32 tests, all green.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `BASESHOP_ALLOW_BYPASS_POLICY=1 pnpm -w run test:governed -- jest -- --rootDir=apps/prime --config=apps/prime/jest.config.cjs --testPathPattern=meal-orders --no-coverage` | Pass | 32 tests, 4 suites, all green |
| `npx tsc --noEmit -p apps/prime/tsconfig.json` | Pass | Clean, no errors |
| `npx eslint apps/prime/src/components/meal-orders/ apps/prime/src/hooks/meal-orders/ apps/prime/src/lib/meal-orders/ apps/prime/src/config/meal-orders/` | Pass | 0 errors across all new files |

## Validation Evidence

### TASK-01
- TC-01 ✓ `breakfastOptions.length === 6`, first item `'Eggs'`
- TC-02 ✓ `eggSides.length === 7`
- TC-03 ✓ `drinksData.filter(d => d.type === 'type 2').length === 12` (plan said 11; actual source has 12 — discrepancy in plan, not a defect)
- TC-04 ✓ `breakfastTimes` starts `'08:00'`, ends `'10:15'`
- TC-05 ✓ `evDrinkTimes` starts `'18:00'`, ends `'20:30'`

### TASK-02
- TC-01 ✓ Eggs full combo → `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`
- TC-02 ✓ Pancakes + Nutella Chocolate Sauce + Green Tea + 08:30 → correct string
- TC-03 ✓ Veggie Toast uses `selectedFoodLabel` verbatim + OJ + 10:00
- TC-04 ✓ Aperol Spritz no modifier + 19:30 → `"Aperol Spritz | 19:30"`
- TC-05 ✓ Americano + milk + sugar + 19:00 → `"Americano, With Milk, With Sugar | 19:00"`

### TASK-03
- TC-01 ✓ Initial `activeSteps` = `['food', 'drinks', 'time', 'confirmation']` (4 steps)
- TC-02 ✓ Select `Eggs` → activeSteps grows to 5 (includes `eggs`)
- TC-03 ✓ Change food from Eggs to Pancakes → egg fields cleared, `eggs` deactivated, `pancakes` activated
- TC-04 ✓ Select `Americano` → `milksugar` sub-step activated
- TC-05 ✓ Change drink to `Green Tea` → milk/sugar cleared, `milksugar` deactivated
- TC-06 ✓ `canAdvance` false when no food selected; true after selection
- TC-07 ✓ `goBack` navigation works from sub-steps

### TASK-04
- TC-01 ✓ Food step renders on mount; `<h1>` has correct title; 6 radio inputs visible
- TC-02 ✓ Select Eggs → Next → egg style + sides step appears
- TC-03 ✓ Next disabled until 3 sides selected
- TC-04 ✓ Egg + 3 sides → Next → advances to drinks step
- TC-05 ✓ Full end-to-end happy path → onSubmit called with correct pipe-delimited string

### TASK-05
- TC-01 ✓ Type-1 plan → Aperol Spritz absent; only type-1 drinks visible
- TC-02 ✓ Full-access plan → all drinks including type-2 visible
- TC-03 ✓ Americano selected → modifier step rendered
- TC-04 ✓ Coke selected → no modifier step; time step next
- TC-05 ✓ No-modifier drink confirmation: `"Aperol Spritz | 19:30"`
- TC-06 ✓ Both modifiers on: `"Americano, With Sugar, With Milk | 19:00"`
- TC-07 ✓ Underscore plan code `'PREPAID_MP_B'` treated same as `'PREPAID MP B'` → `'all'` tier
- TC-08 ✓ `detectDrinkTier` uses `Object.values(preorders).find()` — per-night lookup verified

### TASK-06
- TC-01 ✓ No wizard renders when serviceDate is empty
- TC-02 ✓ BreakfastOrderWizard renders after breakfast date selected
- TC-03 ✓ EvDrinkOrderWizard renders after drink date selected
- TC-04 ✓ Same-day policy warning visible when serviceDate <= today
- TC-05 ✓ Exception button appears after policyBlocked response; second fetch called with `requestChangeException: true`
- TC-06 ✓ Ineligible guest sees "not included" screen
- TC-07 ✓ Page wrappers unchanged (confirmed: zero diff to both page.tsx files)

### TASK-07
- TC-01 ✓ 32 tests passing, 0 failures, 0 skips

## Scope Deviations

- **MealOrderPage.tsx lint fixes (TASK-06):** Fixed pre-existing `min-h-screen → min-h-dvh` (4 occurrences) and suppressed pre-existing `max-w-md` violations with justification comments. These lint rules did not exist when the original file was written. Scope expansion is bounded to the same file being modified.
- **TASK-04 committed incidentally:** `BreakfastOrderWizard.tsx` was staged and accidentally included in the `bef68a199e` CI-only test execution Wave 2 commit by a parallel process. File content is correct; no additional work needed.
