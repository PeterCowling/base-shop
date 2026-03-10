---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-till-blind-mode
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-till-blind-mode/plan.md
Trigger-Why: ""
Trigger-Intended-Outcome: ""
Dispatch-ID: IDEA-DISPATCH-20260301-0079
Trigger-Source: dispatch-routed
---

# Reception Till Blind Mode Fact-Find Brief

## Scope

### Summary

The CloseShiftForm 3-step wizard (Cash → Receipts → Keycards) currently shows the expected cash balance to all staff roles throughout the denomination-counting step. A global env-var toggle (`NEXT_PUBLIC_BLIND_CLOSE`) already exists, but it applies uniformly to all roles. The feature adds role-awareness: non-manager roles (`staff`) see the expected balance hidden during counting; manager/owner/admin/developer roles retain immediate visibility.

This is classified as a **minor gap** in the world-class scan (cash-reconciliation-ux domain). It is a best-practice differentiator to prevent junior staff from anchoring their count to the expected figure, not a minimum-threshold blocker.

### Goals

- Hide expected cash balance from `staff` role during the Cash denomination-counting step (step 0) of CloseShiftForm — staff counts blind and the balance is revealed after the first count entry.
- Hide expected keycard count from `staff` role on the Keycards step (step 2) using the same principle — hidden initially, revealed after the staff member enters their count (reveal-after-count). This is in scope.
- Manager / owner / admin / developer roles see the balance immediately at the start of each step (no behaviour change for these roles when `NEXT_PUBLIC_BLIND_CLOSE=false`).
- Preserve the existing blind-reveal behaviour (reveal after first count change) for users in roles where blind mode applies.
- Preserve backward compat: the `NEXT_PUBLIC_BLIND_CLOSE=true` global flag forces blind mode for **all** roles, including managers.

### Non-goals

- Modifying the OpenShiftForm or SafeReconcileForm (those already have their own blind controls).
- Adding a new env-var; the role decision is computed from the session user object already present in the component.
- Changing how `StepProgress` step-jumping works (that already has a `MANAGEMENT_ACCESS` gate).
- Backend / Firebase schema changes.

### Constraints & Assumptions

- Constraints:
  - `useAuth()` is already called in `CloseShiftForm`; `user` object with `roles` array is available at render time.
  - Role check must use the existing `canAccess(user, Permissions.MANAGEMENT_ACCESS)` pattern (same check as StepProgress step-override).
  - `KeycardCountForm` always renders `Expected: {expectedCount}` unconditionally — it has no `showExpected` prop. Blind mode for keycards requires either adding a prop or wrapping the display conditionally in the parent.
  - `CashCountingForm` already accepts a `showExpected` prop. Cash blind mode is a single-prop change once the role decision is computed.
- Assumptions:
  - The operator intent is: staff role = always blind (reveal after count); management roles = not blind (see expected immediately unless global flag overrides). This matches the `Permissions.MANAGEMENT_ACCESS` array (`owner`, `developer`, `admin`, `manager`).
  - `staff` is the only non-management role that performs till closes in practice; `viewer` role is read-only and would not reach CloseShiftForm.
  - The correct formula for `showExpected` initial value is: `isManager && !settings.blindClose`. When `blindClose=true`, managers are also blind (global override). When `blindClose=false`, managers see expected; staff do not.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Non-manager staff members count the till cash (and keycards) without seeing the expected balance first, preventing anchoring bias. Manager/owner/admin/developer roles retain immediate visibility when `NEXT_PUBLIC_BLIND_CLOSE=false`. The behaviour matches the existing `SafeReconcileForm` blind-close pattern.
- **Source:** auto

## Access Declarations

None — investigation is codebase-only. No external services, APIs, or credentials required.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/till/CloseShiftForm.tsx` — Primary close-shift wizard. Already calls `useAuth()` and holds `user` object. `showExpected` state already computed from `settings.blindClose`. Role check for `canAccess(user, Permissions.MANAGEMENT_ACCESS)` is already imported (via `StepProgress`).

### Key Modules / Files

1. `apps/reception/src/components/till/CloseShiftForm.tsx` — 3-step wizard orchestrator. Passes `showExpected` state to `CashCountingForm`. Calls `useAuth()` at line 89. `showExpected` is initialised at line 185 as `!settings.blindClose`. Role-aware change needed: `showExpected` initial value should be `isManager && !settings.blindClose` — managers see expected immediately (unless global blind override is on); staff always start blind.
2. `apps/reception/src/components/till/KeycardCountForm.tsx` — Step 2 form. Always renders `Expected: {expectedCount}` at line 58–60 unconditionally. Has no `showExpected` prop. To apply blind mode here, a `showExpected?: boolean` prop must be added (or the expected line wrapped behind a condition in the parent using inline override).
3. `apps/reception/src/components/common/CashCountingForm.tsx` — Cash counting form. `showExpected` prop already exists (line 34/60). The prop is already correctly plumbed — no structural change needed, just the value passed from CloseShiftForm.
4. `apps/reception/src/components/till/DenominationInput.tsx` — Pure denomination UI. Renders count rows only. Does not display expected balance. No change required here (dispatch anchor's mention of DenominationInput as a change location is inaccurate — the expected balance lives in CashCountingForm).
5. `apps/reception/src/components/till/StepProgress.tsx` — Already uses `canAccess(user, Permissions.MANAGEMENT_ACCESS)` for step override. Pattern to replicate.
6. `apps/reception/src/lib/roles.ts` — `canAccess()`, `Permissions.MANAGEMENT_ACCESS` (`owner`, `developer`, `admin`, `manager`). The management access check is the correct gate.
7. `apps/reception/src/context/AuthContext.tsx` — `useAuth()` hook. Returns `{ user }` where `user.roles` is `UserRole[] | undefined`.
8. `apps/reception/src/types/domains/userDomain.ts` — `UserRole` enum: `admin | manager | staff | viewer | owner | developer`.
9. `apps/reception/src/constants/settings.ts` — `settings.blindClose` from `NEXT_PUBLIC_BLIND_CLOSE`. Global blind-close flag.
10. `apps/reception/src/components/safe/SafeReconcileForm.tsx` — Parallel implementation of blind-close already working correctly. This is the reference pattern for the till change.

### Patterns & Conventions Observed

- Blind-close pattern: initialise `showExpected = !settings.blindClose`, reveal after first count change when `settings.blindClose && !showExpected`. See `CloseShiftForm.tsx` line 185–208 and `SafeReconcileForm.tsx` line 33–50.
- Role check pattern: `canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS)` — used in StepProgress (line 18–21) and used throughout dashboard/report components.
- `useMemo` wrapper on role checks that depend on `user` — see `StepProgress` line 18–21.

### Data & Contracts

- Types/schemas/events:
  - `CloseShiftFormProps` in `apps/reception/src/types/component/Till.ts` — no changes needed; `user` comes from `useAuth()` not from props.
  - `KeycardCountFormProps` — needs two new optional props: `showExpected?: boolean` (default `true`) and `onChange?: (count: number) => void` (called when count input changes, used by parent to trigger reveal).
- Persistence: No Firebase schema change. No LocalStorage change (shift progress does not store blind-mode state).
- API/contracts: None. Purely client-side UI state.

### Dependency & Impact Map

- Upstream dependencies:
  - `useAuth()` → `AuthContext` → Firebase Auth. Already in component. No change needed.
  - `settings.blindClose` → `NEXT_PUBLIC_BLIND_CLOSE` env-var. Already read. Interaction: role-aware blind mode should be `settings.blindClose || !isManager`. When global flag is true, blind applies to everyone regardless of role. When false, only non-management roles get blind mode. This preserves the current behaviour of the global flag and adds role filtering on top.
- Downstream dependents:
  - `CashCountingForm` receives `showExpected` prop — no downstream change needed.
  - `KeycardCountForm` renders expected unconditionally — prop addition required.
  - Tests in `apps/reception/src/components/till/__tests__/CloseShiftForm.test.tsx` — existing blind-mode test mocks `useAuth()` with a non-manager user; role-aware test case(s) needed.
- Likely blast radius:
  - **Narrow.** Changes confined to `CloseShiftForm.tsx` (role-check logic, `showExpected` initial value, reveal condition, new `showKeycardExpected` state) and `KeycardCountForm.tsx` (new `showExpected` and `onChange` props). Tests in `CloseShiftForm.test.tsx` need new role-aware cases; `KeycardCountForm` tests need updating for new props. No Firebase, no API, no schema changes. Safe/open-shift forms are independent.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=CloseShiftForm`
- CI integration: governed test runner; tests run in CI only (not locally per policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CloseShiftForm | Unit | `apps/reception/src/components/till/__tests__/CloseShiftForm.test.tsx` | Multiple cases including blind-close reveal, discrepancy/recount, reconcile, manager signoff, dark mode, auto-save progress |
| StepProgress | Unit | `apps/reception/src/components/till/__tests__/StepProgress.test.tsx` | 3 cases: back navigation, forward block for staff, forward allow for manager |
| DenominationInput | Unit | `apps/reception/src/components/till/__tests__/DenominationInput.test.tsx` | Renders inputs, handles change |
| FormsContainer | Unit | `apps/reception/src/components/till/__tests__/FormsContainer.test.tsx` | Mocks CloseShiftForm; tests confirm/cancel plumbing |
| settings | Unit | `apps/reception/src/constants/__tests__/settings.test.ts` | Parses bool flags and numeric env vars |

#### Coverage Gaps

- Untested paths:
  - No test for role-aware blind mode: a manager user sees expected immediately when `settings.blindClose = false`.
  - No test for staff user with `settings.blindClose = false` — expected should be hidden initially and revealed after first count entry (new behaviour, not yet in tests).
  - No test for keycard step blind mode (KeycardCountForm's `showExpected` prop does not yet exist).

#### Testability Assessment

- Easy to test:
  - Role-aware `showExpected` initial value in CloseShiftForm: mock `useAuth()` to return manager role vs staff role; assert presence/absence of "Expected cash:" text.
  - Follows identical pattern to existing "reveals expected cash when blind close is enabled" test (line 162–179 in CloseShiftForm.test.tsx).
- Hard to test: None identified. All relevant state is synchronous UI state.
- Test seams needed: Mock `useAuth()` with different role values — already done in existing test (line 63–65) but currently only one user shape.

### Recent Git History (Targeted)

- `1e920aab23` `feat(reception): build OpeningFloatModal, wire EOD checklist, add till nudge` — recent till changes; CloseShiftForm was not the primary file changed but confirms area is active.
- `d7f0551b94` `feat(reception): RBAC wave 1 — migrate remaining username checks to role-based access` — confirms `canAccess`/`Permissions` pattern is the established approach for role checks.
- `52d5988cc4` `feat(reception): add openingFloat mutation, settings, and EOD float section` — settings module is active and tested.

## Questions

### Resolved

- Q: Should blind mode apply to keycard step as well as cash step?
  - A: Yes, by the same logic. The same principle (prevent anchoring to expected count) applies. `KeycardCountForm` needs a `showExpected` prop addition. Implementation is straightforward.
  - Evidence: `apps/reception/src/components/till/KeycardCountForm.tsx` line 58–60 — unconditional render of expected count.

- Q: Should the role-aware blind check interact with the global `settings.blindClose` flag, or replace it?
  - A: Interact, not replace. Correct formula: `showExpected = isManager && !settings.blindClose`. Truth table: (a) `blindClose=true, isManager=true` → `false` (manager sees blind — global override wins); (b) `blindClose=true, isManager=false` → `false` (staff blind — global); (c) `blindClose=false, isManager=true` → `true` (manager sees expected immediately — new role-aware behaviour); (d) `blindClose=false, isManager=false` → `false` (staff starts blind — new role-aware behaviour). The reveal-after-count path in `handleCountsChange` should trigger for staff regardless of flag: the condition should be `if (!showExpected)`.
  - Evidence: `apps/reception/src/constants/settings.ts` + `CloseShiftForm.tsx` line 185 current logic.

- Q: Which roles are "manager" for this purpose?
  - A: `Permissions.MANAGEMENT_ACCESS` = `["owner", "developer", "admin", "manager"]`. This is the identical gate already used by StepProgress for step override. The `staff` role is the only role that would see blind mode.
  - Evidence: `apps/reception/src/lib/roles.ts` line 53–54; `StepProgress.tsx` line 18–20.

- Q: Does DenominationInput need to change?
  - A: No. The expected cash display lives in `CashCountingForm` (the `showExpected && expectedCash !== undefined` block), not inside `DenominationInput`. DenominationInput only renders denomination count rows. The dispatch anchor listing DenominationInput is inaccurate — confirmed by reading both files.
  - Evidence: `apps/reception/src/components/till/DenominationInput.tsx` — no expected balance display; `apps/reception/src/components/common/CashCountingForm.tsx` line 138–159.

- Q: Is there a reveal-after-count behaviour to preserve?
  - A: Yes. The current reveal condition is `else if (settings.blindClose && !showExpected)` (line 201). Under the new role-aware logic this must be broadened: reveal whenever `!showExpected` is true — that covers both the global-flag case and the role-aware case. The simpler condition `if (!showExpected)` triggers for staff in all blind scenarios.
  - Evidence: `CloseShiftForm.tsx` line 196–207 (`else if (settings.blindClose && !showExpected)` block).

### Open (Operator Input Required)

None — all decisions are resolvable from code evidence and business constraints.

## Confidence Inputs

- Implementation: 92%
  - Evidence basis: Entry points fully read. `showExpected` prop already exists on `CashCountingForm`. Role check pattern (`canAccess(user, Permissions.MANAGEMENT_ACCESS)`) already established in adjacent component (`StepProgress`). `useAuth()` already in `CloseShiftForm`. Two source files change (`CloseShiftForm.tsx` and `KeycardCountForm.tsx`) plus test updates in `CloseShiftForm.test.tsx` and `KeycardCountForm` tests.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Already above 90. A quick build confirms no side-effects.

- Approach: 90%
  - Evidence basis: The exact approach is already proven in `SafeReconcileForm` (identical pattern). The role gate is proven in `StepProgress`. Combining them is mechanical.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Already above 90.

- Impact: 70%
  - Evidence basis: Operational improvement confirmed (world-class scan classifies as minor-gap differentiator). Reduction in anchoring bias is a well-documented cash-management principle but cannot be quantified without real-world data.
  - What raises to >=80: Operator confirms this is the priority over other cash-reconciliation-ux gaps (drawer lock etc.) and commits to enabling blind mode in production.
  - What raises to >=90: Post-deployment observation of variance reduction.

- Delivery-Readiness: 92%
  - Evidence basis: Full evidence gathered. No blockers. Two files to touch. Test seams already in place.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Already above 90.

- Testability: 90%
  - Evidence basis: Existing test already mocks `useAuth()` and `settings`. New test cases follow the exact same pattern as the existing "reveals expected cash when blind close is enabled" case.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Already above 90.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Manager accidentally uses a staff account at close time and sees blind mode unexpectedly | Low | Low | Blind mode for non-managers is the intended behaviour. The role is set at login. No mitigation needed beyond correct role assignment in Firebase. |
| `settings.blindClose = true` in production causes blind mode for managers too | Low | Low | The formula `!settings.blindClose && isManager` ensures managers always see expected when the global flag is false. When the flag is true, everyone is blind — existing intended behaviour. |
| `KeycardCountForm` prop addition breaks `FormsContainer.test.tsx` | Low | Low | FormsContainer mocks CloseShiftForm entirely, not KeycardCountForm. No break expected. The new prop has a default value of `true` (show expected by default — safe default for backward compat). |
| Reveal-after-count not applied to role-aware blind case | Medium | Low | Must ensure the `handleCountsChange` reveal logic mirrors both conditions: `settings.blindClose` and the role-aware blind case. Resolution: extend the condition in `handleCountsChange`. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS)` — not a raw role string check.
  - Wrap the `isManager` computation in `useMemo` with `[user]` dep array — consistent with StepProgress.
  - `KeycardCountForm` new props (`showExpected`, `onChange`) must default to `true` / `undefined` respectively for backward compat with all other callers.
  - Reveal condition in `handleCountsChange` must be broadened from `else if (settings.blindClose && !showExpected)` to `else if (!showExpected)` so it fires for both the global-flag case and the role-aware case. Note: this is intentionally broader than the safe-reconcile pattern, which only checks `settings.blindClose`. The safe-reconcile pattern is the reference for the overall blind-reveal concept, not the exact condition string.
- Rollout/rollback expectations:
  - No feature flag needed; behaviour is gated by role which is always present.
  - Rollback: revert the two component files — no data migration required.
- Observability expectations:
  - No logging needed. The change is UI-only.

## Suggested Task Seeds (Non-binding)

- TASK-01 IMPLEMENT: Add role-aware `isManager` flag to `CloseShiftForm` using `canAccess(user, Permissions.MANAGEMENT_ACCESS)` wrapped in `useMemo`. Update `showExpected` initial value from `!settings.blindClose` to `isManager && !settings.blindClose`. Update reveal condition in `handleCountsChange` from `else if (settings.blindClose && !showExpected)` to `else if (!showExpected)` so the reveal fires for staff in both the global-flag case and the role-aware case.
- TASK-02 IMPLEMENT: Add two new optional props to `KeycardCountForm`: `showExpected?: boolean` (default `true`) and `onChange?: (count: number) => void`. Wrap the `Expected: {expectedCount}` line behind `showExpected`. In `CloseShiftForm`, add `showKeycardExpected` state initialised to `isManager && !settings.blindClose`. Pass `showExpected={showKeycardExpected}` and `onChange={(count) => { if (!showKeycardExpected) setShowKeycardExpected(true); }}` to `KeycardCountForm` at step 2. This mirrors the cash reveal pattern.
- TASK-03 TEST: Add unit tests to `CloseShiftForm.test.tsx` — (a) manager user sees expected cash immediately with `blindClose=false`; (b) staff user sees expected cash hidden with `blindClose=false` until after first count entry; (c) `blindClose=true` hides expected for manager too (existing test passes).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `CloseShiftForm` renders expected cash balance immediately for management roles when `settings.blindClose=false`.
  - `CloseShiftForm` hides expected cash balance for `staff` role at step 0 until first count entry, then reveals it.
  - `CloseShiftForm` hides expected keycard count for `staff` role at step 2, then reveals it after first keycard count entry (KeycardCountForm `showExpected` prop + parent reveal state).
  - `settings.blindClose=true` forces blind mode for all roles including managers (existing behaviour preserved).
  - Existing CloseShiftForm tests pass. New role-aware test cases (manager visible, staff blind-then-reveal) pass.
- Post-delivery measurement plan:
  - Operator manually verifies blind mode in staging by logging in as a staff-role account and running through CloseShiftForm step 0.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CloseShiftForm entry point and `showExpected` state | Yes | None | No |
| `CashCountingForm` `showExpected` prop | Yes | None | No |
| `KeycardCountForm` — unconditional expected display | Yes | [Scope gap] Minor: dispatch anchor listed `DenominationInput` as change target; investigation shows `DenominationInput` does not display expected balance. Real change location is `KeycardCountForm`. Plan must target `KeycardCountForm`, not `DenominationInput`. | No (advisory, already resolved in task seeds) |
| Role/auth system boundary | Yes | None | No |
| `settings.blindClose` global flag interaction | Yes | None | No |
| Test landscape | Yes | None | No |
| `SafeReconcileForm` as reference implementation | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed

1. **DenominationInput scope correction** — dispatch anchor listed `DenominationInput` as a change file; investigation confirmed no expected balance is rendered there. Corrected to `KeycardCountForm`.
2. **Role boundary** — confirmed `MANAGEMENT_ACCESS` permission set is the correct gate (`owner`, `developer`, `admin`, `manager`). No ambiguity about which roles get blind mode.
3. **Global flag interaction** — formula derived and confirmed: `!settings.blindClose && isManager` produces correct behaviour in all four combinations of flag × role.
4. **Reveal-after-count behaviour** — confirmed the `handleCountsChange` reveal path must be extended to cover both conditions.
5. **Test seams** — verified existing CloseShiftForm test already mocks `useAuth()` and `settings`, making new test cases straightforward.

### Confidence Adjustments

- Implementation confidence raised from initial estimate of ~80% to 92% after confirming `CashCountingForm.showExpected` prop and `useAuth()` are already in `CloseShiftForm`.
- Impact confidence held at 70% — operational improvement is clear but unmeasurable without production data.

### Remaining Assumptions

- `staff` is the only non-management role reaching `CloseShiftForm` in practice. (`viewer` is read-only and would never reach the close flow.)
- The reveal-after-count behaviour should apply to role-aware blind mode (blindClose=false, staff role) for UX consistency — not confirmed by operator, but consistent with the blind-close design intent.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-till-blind-mode --auto`
