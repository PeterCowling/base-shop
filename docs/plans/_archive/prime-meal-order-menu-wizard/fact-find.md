---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: prime-meal-order-menu-wizard
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-meal-order-menu-wizard/plan.md
Trigger-Why: Port of complimentary breakfast and evening drink menu wizard from the old standalone React app that was not carried across during the monorepo migration. Guests currently see a free-text input instead of a guided selection flow.
Trigger-Intended-Outcome: type: operational | statement: Replace the free-text order input with a mobile-first stepped wizard for both complimentary breakfast and evening drink ordering, matching the feature parity of the original standalone app. | source: operator
---

# Prime Meal Order Menu Wizard — Fact-Find Brief

## Scope

### Summary
The Prime app's `/complimentary-breakfast` and `/complimentary-evening-drink` pages currently render a single free-text `<input>` labelled "Order details" inside `MealOrderPage.tsx`. The previous standalone React app had a fully featured multi-step wizard with menu options, conditional sub-steps, and a confirmation screen. The port to this monorepo did not carry that system across. This work ports it.

### Goals
- Extract all menu data from the old app's `ComplimentaryData.js` into a TypeScript config
- Replace the free-text input in `MealOrderPage.tsx` with a proper stepped wizard for breakfast
- Replace the free-text input with a drink-type-filtered stepped wizard for evening drinks
- Wire structured selections into a human-readable `value` string submitted to the existing `POST /api/firebase/preorders` endpoint (no API or Firebase schema changes)
- Use `StepFlowShell` from `@acme/design-system/primitives` for wizard UI (already used by onboarding flow)

### Non-goals
- Kitchen display / bleep number system (explicitly deferred)
- Edit flow for already-placed orders (deferred)
- Juice/smoothie options (present in old app data but not wired into any active workflow)
- Changes to the API (`/api/firebase/preorders`) or Firebase schema
- i18n translation of new menu strings (English-only for now)

### Constraints & Assumptions
- Constraints:
  - The `POST /api/firebase/preorders` body must remain `{ token, service, serviceDate, value, requestChangeException }` — `value` stays a string
  - `StepFlowShell` from `@acme/design-system/primitives` is already available in Prime (confirmed in `GuidedOnboardingFlow.tsx`)
  - The date-selection UX (existing `select` of available dates) is already correct and must be preserved
  - Same-day change protection and exception-request flow in `MealOrderPage.tsx` must be preserved
- Assumptions:
  - Plan-type codes in production Firebase use spaces: `'PREPAID MP A'`, `'PREPAID MP B'`, `'PREPAID MP C'` — matching the old app. The test fixture uses `'PREPAID_MP_A'` (underscores); the plan-type detection logic should normalise both formats for safety.
  - Guests always have at least one eligible night; the existing `hasMealEntitlement` gate already handles ineligible guests before the wizard renders

## Outcome Contract

- **Why:** The meal order feature was not ported from the standalone app. Guests currently see a free-text field with no menu, making it impossible to know what to type and making staff-received orders unpredictable strings.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both breakfast and evening drink order flows present a guided multi-step menu selection (matching the old app's feature set) before submitting to the existing API endpoint.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/(guarded)/complimentary-breakfast/page.tsx` — thin wrapper, mounts `<MealOrderPage service="breakfast" title="Complimentary Breakfast" />`
- `apps/prime/src/app/(guarded)/complimentary-evening-drink/page.tsx` — thin wrapper, mounts `<MealOrderPage service="drink" title="Complimentary Evening Drink" />`
- `apps/prime/functions/api/firebase/preorders.ts` — Cloudflare Pages Function; handles `GET` (fetch preorders) and `POST` (save/update order). The POST `value` field is stored verbatim to `preorder/{guestUuid}/{nightKey}.breakfast` or `.drink1`.

### Key Modules / Files

- `apps/prime/src/components/meal-orders/MealOrderPage.tsx` — component to replace. Currently: date select + free-text input + submit button + existing orders list. All logic is in this one file (322 lines). The date selector, existing-orders display, same-day policy block, and exception-request flow are all keepers — only the free-text input and its submit gate need replacing with the wizard.
- `apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts` — provides `snapshot.preorders` (map of `nightKey → { breakfast, drink1, drink2, serviceDate }`). The `drink1`/`drink2` values are plan codes (`'PREPAID MP A'`, etc.) or `'NA'`. This is the source of truth for plan-type filtering.
- `apps/prime/src/types/preorder.ts` — `PreorderNightData { night, breakfast, drink1, drink2 }` — all strings; no enum. No changes needed.
- `apps/prime/src/lib/security/guestCriticalFlowEndpoints.ts` — `GUEST_CRITICAL_FLOW_ENDPOINTS.meal_orders = '/api/firebase/preorders'`
- `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` — reference for `StepFlowShell` usage pattern in Prime
- `/Users/petercowling/Documents/prime_src/src/data/ComplimentaryData.js` — **authoritative menu data source** for the port. Contains all item arrays: `breakfastOptions`, `eggStyles`, `eggSides`, `pancakeSyrups`, `drinksOptions`, `drinksData`, `breakfastTimes`, `evDrinkTimes`.
- `/Users/petercowling/Documents/prime_src/src/hooks/useBreakfastWorkflow.js` — reference step machine. Documents `FOOD_SUBSTEP_MAP`, `DRINK_SUBSTEP_MAP`, `allSteps` structure, conditional sub-step activation/deactivation, and the `formData` → `value` assembly. Port this logic to a TypeScript hook.
- `/Users/petercowling/Documents/prime_src/src/components/complimentary/evdrink/Index.jsx` — reference evening drink flow. Documents `getAvailableEvDrinkOptions()` plan-type filtering and the dynamic step construction pattern after drink selection.

### Patterns & Conventions Observed

- Wizard shell: `StepFlowShell` from `@acme/design-system/primitives` — evidence: `GuidedOnboardingFlow.tsx:8`
- Data fetching: `useGuestBookingSnapshot` via `@tanstack/react-query` — evidence: `MealOrderPage.tsx:69`
- API calls: raw `fetch` to `GUEST_CRITICAL_FLOW_ENDPOINTS.*` — evidence: `MealOrderPage.tsx:123`
- Error display: `bg-danger-soft` / `bg-success-soft` pill pattern — evidence: `MealOrderPage.tsx:258–267`

### Data & Contracts

- Types/schemas:
  - `PreorderNightData.breakfast: string` — plan code (e.g. `'PREPAID MP A'`) or `'NA'` (not eligible) or a previously-placed order value string
  - `PreorderNightData.drink1: string` — plan code or `'NA'` or placed order value
  - No enum enforced; agent must normalise `'PREPAID MP A'` / `'PREPAID_MP_A'` formats
- Persistence:
  - `preorder/{guestUuid}/{nightKey}` in Firebase via Cloudflare Pages Function
  - No schema change; `value` remains a plain string
- API/contracts:
  - `POST /api/firebase/preorders` body: `{ token: string, service: 'breakfast'|'drink', serviceDate: 'YYYY-MM-DD', value: string, requestChangeException?: boolean }`
  - `value` format (current): free text. **Proposed format** (wizard output): structured human-readable string:
    - Breakfast: `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`
    - Pancakes: `"Pancakes (Homemade Golden Syrup) | Green Tea | 08:30"`
    - Evening drink: `"Aperol Spritz | 19:30"` or `"Americano, Oat Milk, Light Sugar | 19:00"`

### Dependency & Impact Map

- Upstream dependencies:
  - `useGuestBookingSnapshot` — provides dates and plan codes. No changes.
  - `@acme/design-system/primitives` — `StepFlowShell`. Already in Prime's dependency graph.
- Downstream dependents:
  - `complimentary-breakfast/page.tsx` — thin wrapper. No change needed if `MealOrderPage` signature is preserved.
  - `complimentary-evening-drink/page.tsx` — same.
  - `MealOrderPage.test.tsx` — 3 existing tests use `getByLabelText("Order details")` (the free-text input). All 3 will break and must be rewritten.
- Likely blast radius:
  - `MealOrderPage.tsx` is completely replaced in its internal logic (wizard replaces single-field form). Page wrappers unchanged. API endpoint unchanged. Firebase schema unchanged.
  - No other components import `MealOrderPage`.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/prime/jest.config.cjs --testPathPattern=meal-orders`
- CI integration: governed test runner in reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Breakfast/drink order form | Unit | `MealOrderPage.test.tsx` | 3 tests: TC-01 (create order), TC-03 (same-day exception), TC-04 (ineligible) |
| Wizard step logic | Unit | None | Not yet covered — to be added |
| Evening drink plan filtering | Unit | None | Not yet covered — to be added |

#### Coverage Gaps
- Untested paths:
  - Egg sub-step rendering and 3-sides validation
  - Pancake syrup sub-step rendering
  - Drink modifier sub-steps (milk/sugar)
  - Back navigation clears sub-step selections
  - Plan-type filtering (type 1 vs type 2 drink list)
  - Structured value string assembly (all variants)
  - Confirmation screen rendering
- Extinct tests (to update):
  - TC-01: uses `getByLabelText("Order details")` free-text input → must be rewritten for wizard flow
  - TC-03: same label dependency → must be rewritten
  - TC-04 (ineligible): does not interact with the form — likely safe, verify

#### Testability Assessment
- Easy to test: menu config exports (pure TS arrays), value string formatter (pure function), plan-type detection (pure function), step activation logic (pure reducer)
- Hard to test: full multi-step wizard interaction (needs many fireEvent steps per test)
- Test seams needed: extract value string assembly into a pure `buildOrderValue(wizardState)` function for direct unit testing

#### Recommended Test Approach
- Unit tests for: `menuData.ts` exports (type checks), `buildBreakfastOrderValue()`, `buildEvDrinkOrderValue()`, plan-type detection util, step activation logic
- Integration tests for: full wizard happy path (breakfast + drink), back navigation, sub-step field clearing, same-day exception flow (rewrite TC-03)
- E2E tests for: skip for now (Playwright suite not active for Prime)

### Recent Git History (Targeted)

- `16e4e743e8` — DS token migration across 12 Prime components, including `MealOrderPage.tsx` (TASK-13). Confirms this file was recently touched and is on the current token set.
- `b14a44d5c4` — lint/build fixes. No meal-order logic changes.
- No commits have ever added menu data, step machines, or wizard components to `apps/prime/src/components/meal-orders/`.

## Questions

### Resolved

- **Q: Should the wizard use `StepFlowShell` or build a custom step renderer?**
  - A: Use `StepFlowShell` from `@acme/design-system/primitives`. It is already imported and used in `GuidedOnboardingFlow.tsx` in the same app. This avoids a new bespoke implementation and keeps visual consistency with the onboarding flow.
  - Evidence: `GuidedOnboardingFlow.tsx:8`

- **Q: Should breakfast and evening drink be one component or two?**
  - A: Two separate wizard components — `BreakfastOrderWizard.tsx` and `EvDrinkOrderWizard.tsx`. The breakfast flow has 5 main steps and 4 conditional sub-steps; the evening drink flow has 2–4 steps. A unified component would require deep branching. Two clean components that share the menu data config and `StepFlowShell` shell is the right boundary.
  - `MealOrderPage.tsx` becomes a router: `service === 'breakfast'` → renders `BreakfastOrderWizard`; `service === 'drink'` → renders `EvDrinkOrderWizard`.

- **Q: Does the API need changes to accept structured order data?**
  - A: No. The `value` field remains a plain string. The wizard assembles a human-readable summary string (e.g. `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"`) before POSTing. This is readable by staff in Firebase and via any order display without schema migration.
  - Evidence: `preorders.ts:29` — `value?: string` with no validation pattern beyond non-empty

- **Q: How does plan-type filtering work in the current app's data model?**
  - A: The `drink1` field in each preorder night holds the plan code (e.g. `'PREPAID MP A'`). Filter rule: if any night has `drink1` matching `'PREPAID MP B'` or `'PREPAID MP C'` (or `drink2` matching `'PREPAID MP C'`), show all drinks (type 1 + type 2). Otherwise show type 1 only. Normalise both `'PREPAID MP A'` and `'PREPAID_MP_A'` variants.
  - Evidence: `useGuestBookingSnapshot.ts:21–29`; old app `EvDrinkSection.jsx:73–93`

- **Q: Where does the date selector sit relative to the wizard?**
  - A: The existing date `<select>` in `MealOrderPage.tsx` is the pre-wizard gate. It must be selected before the wizard starts. The wizard renders conditionally once a `serviceDate` is selected (replacing the current free-text input). The date selector, existing-orders list, same-day warning, and exception-request button are all outside the wizard and remain unchanged.

- **Q: What is the `selectedNight` → `nightKey` mapping in the new app?**
  - A: The old app used 1-based night keys from check-in date. The current app uses Firebase `nightKey` strings (e.g. `'night1'`) from `snapshot.preorders`. The date selector already handles this mapping via `findNightKeyForServiceDate()` in the API. The wizard only needs to provide `serviceDate` (already from the date selector) — no night key mapping required in the frontend.

- **Q: Should the wizard replace the existing-orders list?**
  - A: No. The existing-orders list below the form is a useful display and is unrelated to the wizard. Keep it as-is.

### Open (Operator Input Required)

- **Q: What plan code format is in production Firebase — `'PREPAID MP A'` (spaces) or `'PREPAID_MP_A'` (underscores)?**
  - Why operator input is required: The test fixture uses underscores; the old app used spaces. Cannot determine from repo alone — requires checking a live Firebase record.
  - Decision impacted: Whether plan-type detection needs a normalisation shim or can use one format only.
  - Decision owner: Operator
  - Default assumption + risk: Implement normalisation that matches both formats (`replace(/_/g, ' ')` before comparing). Low risk — safe fallback. Build can proceed with this assumption; refine if needed.

## Confidence Inputs

- **Implementation: 93%**
  - Evidence: Complete reference implementation exists in the old app. Menu data, step logic, and submission flow are fully documented. The only implementation unknowns are minor (plan code format, exact `StepFlowShell` API surface for Prime's version).
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there. Remaining 7% is plan-code format ambiguity (resolvable during build with normalisation shim).

- **Approach: 92%**
  - Evidence: Architecture decision (two wizard components behind `MealOrderPage` router, using `StepFlowShell`, pure value-string assembly, no API changes) is well-grounded in codebase evidence.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there. One minor risk: `StepFlowShell` API surface not fully inspected; if it doesn't support the sub-step pattern well, a lightweight custom step shell may be needed.

- **Impact: 95%**
  - Evidence: This is a direct port of a previously live feature. Guests cannot meaningfully order without it. The free-text field is a launch blocker for customer experience.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there.

- **Delivery-Readiness: 91%**
  - Evidence: All reference material is accessible. No external dependencies. API contract unchanged. Only the frontend changes.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Inspect `StepFlowShell` component API surface before coding begins (TASK-01 below).

- **Testability: 85%**
  - Evidence: Pure functions (value builder, plan-type detection, step activation) are straightforwardly unit-testable. The wizard interaction tests are more involved but React Testing Library handles multi-step `fireEvent` flows well (TC-01 in existing test already does this pattern).
  - To reach ≥80%: Already there.
  - To reach ≥90%: Extract `buildOrderValue()` and `detectDrinkTier()` as pure exported functions for direct unit testing without component mounting.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `StepFlowShell` API surface incompatible with sub-step nesting | Low | Medium | Inspect component source in TASK-01; fallback: implement a thin custom step shell using existing Prime DS patterns |
| Plan code format mismatch (`'PREPAID MP A'` vs `'PREPAID_MP_A'`) | Medium | Low | Normalise both on read: `drinkCode.replace(/_/g, ' ')` before comparing; no guest-visible impact |
| Old tests all fail after MealOrderPage rewrite | Certain | Low | Rewrite all 3 tests as part of TASK-05; well-scoped, no surprises |
| Value string format not legible for staff in Firebase | Low | Low | Human-readable format proposed: `"Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"` — discuss with operator if needed |
| Breakfast sub-step back-navigation clears wrong fields | Low | Medium | Port `resetSubStepFields` logic directly from old app hook; add targeted unit test |
| Same-day exception flow broken after refactor | Low | High | Preserve `pendingExceptionPayload` state and exception button — both are outside the wizard and need no changes |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `StepFlowShell` from `@acme/design-system/primitives` for wizard shell (same pattern as `GuidedOnboardingFlow.tsx`)
  - Use `bg-danger-soft / text-danger-foreground` and `bg-success-soft / text-success-foreground` for errors/confirmations (existing Prime DS token convention)
  - `MealOrderPage.tsx` existing page-wrappers (`complimentary-breakfast/page.tsx`, `complimentary-evening-drink/page.tsx`) must remain unchanged in their public API
  - Same-day change protection and exception-request button must be preserved exactly
  - API call endpoint and body shape unchanged
- Rollout/rollback expectations:
  - No feature flag needed — this is a direct replacement of a broken/incomplete UI
  - Rollback: revert `MealOrderPage.tsx` to free-text input (the old version is in git)
- Observability expectations:
  - No new analytics events needed for this phase

## Suggested Task Seeds (Non-binding)

- **TASK-01**: Inspect `StepFlowShell` component API in `@acme/design-system/primitives`; confirm it supports the step count and navigation pattern needed; document its props
- **TASK-02**: Create `apps/prime/src/config/meal-orders/menuData.ts` — port all arrays from `ComplimentaryData.js` to typed TypeScript exports (`breakfastOptions`, `eggStyles`, `eggSides`, `pancakeSyrups`, `drinksOptions`, `drinksData`, `breakfastTimes`, `evDrinkTimes`)
- **TASK-03**: Create `apps/prime/src/lib/meal-orders/buildOrderValue.ts` — pure functions `buildBreakfastOrderValue(state)` and `buildEvDrinkOrderValue(state)` that assemble the human-readable `value` string; add unit tests
- **TASK-04**: Create `apps/prime/src/hooks/meal-orders/useBreakfastWizard.ts` — port step machine from old `useBreakfastWorkflow.js`; TypeScript, no Firebase calls, returns `{ currentStep, currentSubStep, formData, handleNext, handleBack, isComplete, activeSteps }`
- **TASK-05**: Create `apps/prime/src/components/meal-orders/BreakfastOrderWizard.tsx` — multi-step UI using `StepFlowShell`; renders food/egg-substep/pancake-substep/drink/milk-sugar-substep/time/confirmation steps; on completion calls `onSubmit(value, serviceDate)`
- **TASK-06**: Create `apps/prime/src/hooks/meal-orders/useEvDrinkWizard.ts` and `apps/prime/src/components/meal-orders/EvDrinkOrderWizard.tsx` — flat drink flow with plan-type filtering and optional modifier step
- **TASK-07**: Refactor `MealOrderPage.tsx` — replace free-text input section with conditional render of `BreakfastOrderWizard` or `EvDrinkOrderWizard` based on `service` prop; preserve date selector, same-day policy block, exception button, existing-orders list
- **TASK-08**: Rewrite `MealOrderPage.test.tsx` — replace free-text-based TC-01, TC-03 with wizard-aware equivalents; add unit tests for `buildOrderValue`, plan-type detection, and step activation

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Both `/complimentary-breakfast` and `/complimentary-evening-drink` render multi-step wizards (not free-text inputs)
  - Breakfast wizard shows all 6 food options; Eggs triggers egg-style + 3-sides sub-steps; Pancakes triggers syrup sub-step; drinks trigger milk/sugar modifiers where applicable
  - Evening drink wizard filters to type-1-only or all drinks based on plan code in `snapshot.preorders`
  - Confirmation screen shows order summary before submit
  - Submitted `value` is a human-readable string (not free text)
  - Same-day exception request flow continues to work
  - All tests pass
- Post-delivery measurement plan: Manual QA pass through both flows; verify submitted `value` strings appear correctly in Firebase

## Evidence Gap Review

### Gaps Addressed
- `StepFlowShell` availability in Prime confirmed via `GuidedOnboardingFlow.tsx:8`
- API contract confirmed: `value` is a plain string, no schema change needed
- Plan-type filtering logic confirmed from `EvDrinkSection.jsx:70–93`
- Back-navigation and sub-step field clearing confirmed from `useBreakfastWorkflow.js:16–22, 316–383`
- Complete menu item data confirmed from `ComplimentaryData.js` (all arrays read in full)
- Existing test coverage confirmed: 3 tests, all tied to free-text input, all need rewriting

### Confidence Adjustments
- Delivery-Readiness raised from initial estimate of ~80% to 91% after confirming `StepFlowShell` is already available and the API requires no changes
- Approach confidence 92% — the single open risk (StepFlowShell API surface) is low-likelihood and has a clear fallback

### Remaining Assumptions
- Plan code format is `'PREPAID MP A'` (spaces) in production Firebase; normalisation shim handles both formats
- `StepFlowShell` supports variable step count and can handle conditional steps — to be verified in TASK-01 before TASK-05

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan prime-meal-order-menu-wizard --auto`
