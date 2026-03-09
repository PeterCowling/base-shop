---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-modal-mode-discriminated-unions
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-modal-mode-discriminated-unions/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309100000-0001
---

# Reception Modal/Mode Discriminated Unions — Fact-Find Brief

## Scope

### Summary
Four components in `apps/reception/src/` use independent boolean `useState` variables to model mutually exclusive modal/mode state. Each one manually zeros all other flags when setting one, creating 2^N theoretical states for an N-state reality. The fix replaces each boolean-flag group with a typed discriminated union state variable so that illegal state combinations are impossible by construction.

### Goals
- Replace the 3 mutually exclusive mode flags in `useCheckinsModes` with a union type `CheckinMode = "idle" | "edit" | "delete" | "addGuest"`.
- Replace the 3 mutually exclusive form flags in `useTillReconciliationUI` with a union type `TillCashForm = "none" | "float" | "exchange" | "tenderRemoval"`.
- Replace the 4 confirmation flags in `DraftReviewPanel` with a union type `DraftConfirmDialog = "none" | "regenerate" | "send" | "resolve" | "dismiss"`.
- Replace the 3 login panel flags in `Login` with a union type `LoginPanel = "credentials" | "forgotPassword" | "pinSetup" | "pinUnlock"`.
- Reduce the `CheckinsTableView` prop surface for mode state (currently 3 separate booleans passthrough from `CheckinsTable`).
- Update all call sites, tests, and the `TillReconciliationUIControls` interface consumed by `useTillReconciliationLogic`.

### Non-goals
- No behavior changes — pure refactoring.
- No changes outside `apps/reception/src/`.
- No changes to Firebase data shapes, API contracts, or routing.

### Constraints & Assumptions
- Constraints:
  - The `TillReconciliationUIControls` interface in `useTillReconciliationLogic.ts` exposes `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`, `setShowExchangeForm`, `setShowTenderRemovalForm`, and `closeCashForms` as individual named fields. The interface must be updated alongside the hook.
  - `useTillReconciliationLogic` references `ui.showFloatForm`, `ui.showExchangeForm`, `ui.showTenderRemovalForm` in a `useEffect` dependency array and calls `ui.setShowExchangeForm(false)` / `ui.setShowTenderRemovalForm(false)` directly from logic callbacks. These must be converted to union-compatible accessors or exposed as a single setter.
  - `FormsContainer` receives 3 separate setter props (`setShowFloatForm`, `setShowExchangeForm`, `setShowTenderRemovalForm`). If these are collapsed into one union-mode setter, `FormsContainer`'s props interface changes.
  - Tests for `useCheckinsModes` (`useCheckinsModes.test.ts`) and `useTillReconciliationUI` (`useTillReconciliationUI.test.ts`) will need updates to match the new return shapes.
  - The `TillReconciliation.test.tsx` mocks `useTillReconciliationUI` with a flat props object that includes all three boolean flags — this mock must also be updated.
  - The `CheckinsTable.test.tsx` mocks `useCheckinsModes` returning the flat boolean shape — must be updated.
- Assumptions:
  - `showArchiveModal` in `useCheckinsModes` is NOT part of the mutually exclusive group (it is a separate modal that can be opened from any mode, and its toggle clears all modes). It should remain a separate `boolean` state.
  - `isEditMode` / `isDeleteMode` in `useTillReconciliationUI` control transaction-row click targets, not cash forms. They are independent from `showFloatForm/showExchangeForm/showTenderRemovalForm`. They should remain separate booleans or be folded into a separate `TillRowMode` union.
  - `Login`'s `showForgotPassword` / `showPinSetup` / `showPinUnlock` are rendered as mutually exclusive branches (`if (showForgotPassword) return ... ; if (showPinSetup) return ...; if (showPinUnlock) return ...`). The initial panel is set by a `useEffect` on mount. The union initial value must replicate this logic.
  - `DraftReviewPanel` confirm dialogs are fully self-contained within the component (not in a hook), so refactoring is local.

## Outcome Contract

- **Why:** Arrays of independent boolean flags for mutually exclusive state create 2^N theoretical states for an N-state reality, require manual enforcement of mutual exclusivity, and inflate component prop interfaces. The pattern is present in 4 components and already cascades into 27-prop `CheckinsTableView`.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each modal/mode state in reception uses a single discriminated union state variable. Illegal state combinations are impossible by construction. `CheckinsTableView` prop count is reduced via a grouped mode-state prop (from 3 separate boolean props to 1 union-typed prop).
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/checkins/CheckinsTable.tsx` — controller component; calls `useCheckinsModes()`, destructures 11 values, passes 3 boolean mode flags + 2 selection state + 6 callbacks down to `CheckinsTableView`.
- `apps/reception/src/components/till/TillReconciliation.tsx` — controller; calls `useTillReconciliationUI()`, spreads all props (including `showFloatForm/showExchangeForm/showTenderRemovalForm` and their setters) into `FormsContainer`. Also shows `isEditMode` / `isDeleteMode` banners directly.
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — self-contained; holds 4 confirm-dialog booleans locally, opens one at a time.
- `apps/reception/src/components/Login.tsx` — self-contained; holds 3 panel booleans, renders one panel at a time via early returns.

### Key Modules / Files

- `apps/reception/src/hooks/utilities/useCheckinsModes.ts` — 3 mutually exclusive mode flags (`isEditMode`, `isDeleteMode`, `isAddGuestMode`) + `showArchiveModal` (separate). Togglers manually zero other flags. Returns 13 values: `isEditMode`, `isDeleteMode`, `isAddGuestMode`, `showArchiveModal`, `selectedBooking`, `bookingToDelete`, `setSelectedBooking`, `setBookingToDelete`, `toggleAddGuestMode`, `toggleEditMode`, `toggleDeleteMode`, `openArchiveModal`, `closeArchiveModal`.
- `apps/reception/src/hooks/client/till/useTillReconciliationUI.ts` — 3 mutually exclusive cash form flags (`showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`) + independent `isDeleteMode` / `isEditMode`. `closeCashForms()` sets all three to false. Returns 22 values: `showFloatForm`, `setShowFloatForm`, `showExchangeForm`, `setShowExchangeForm`, `showTenderRemovalForm`, `setShowTenderRemovalForm`, `drawerLimitInput`, `setDrawerLimitInput`, `isDeleteMode`, `setIsDeleteMode`, `txnToDelete`, `setTxnToDelete`, `isEditMode`, `setIsEditMode`, `txnToEdit`, `setTxnToEdit`, `closeCashForms`, `handleAddChangeClick`, `handleExchangeClick`, `handleLiftClick`, `handleRowClickForDelete`, `handleRowClickForEdit`.
- `apps/reception/src/hooks/useTillReconciliationLogic.ts` — consumes `TillReconciliationUIControls` interface. References `ui.showFloatForm`, `ui.showExchangeForm`, `ui.showTenderRemovalForm` in a `useEffect`, and calls `ui.setShowExchangeForm(false)` / `ui.setShowTenderRemovalForm(false)` after async operations complete.
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` (`CheckinsTableView`) — receives `isEditMode: boolean`, `isDeleteMode: boolean`, `isAddGuestMode: boolean` as separate props. Uses them for mode banners and for gating `onRowClick` propagation to `BookingRow`.
- `apps/reception/src/components/till/FormsContainer.tsx` — receives `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm` as booleans, plus 3 separate setter props. Renders each form conditionally.
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — 4 local `useState<boolean>` for confirm dialogs. Each button sets one flag; handlers reset to false on success.
- `apps/reception/src/components/Login.tsx` — 3 local `useState<boolean>` for panel selection. `useEffect` on mount sets `showPinUnlock` if device PIN exists.
- `apps/reception/src/hooks/utilities/__tests__/useCheckinsModes.test.ts` — tests toggle mutual exclusivity via boolean checks.
- `apps/reception/src/hooks/client/till/__tests__/useTillReconciliationUI.test.ts` — tests form open/close behaviour via boolean checks.
- `apps/reception/src/components/checkins/__tests__/CheckinsTable.test.tsx` — mocks `useCheckinsModes` returning `{isEditMode, isDeleteMode, isAddGuestMode, ...}` booleans.

### Patterns & Conventions Observed

- **Boolean manual-zeroing pattern:** every toggle in `useCheckinsModes` calls `setOtherFlag(false)` for all other flags explicitly. Evidence: `useCheckinsModes.ts` lines 18–40.
- **Spread-all props pattern:** `TillReconciliation` merges `ui` and `logic` with `{ ...logic, ...ui }` and passes all to sub-components. This means changing `useTillReconciliationUI`'s return shape propagates automatically to `TillReconciliation` render but also affects `TillReconciliationLogic`'s dependency on the `ui` object shape.
- **Early-return panel pattern:** `Login` renders panel-specific JSX via early `if (showX) return <LoginContainer>...` guards — natural fit for a union type.
- **Local confirm-dialog pattern:** `DraftReviewPanel` holds all confirm state locally with no hook extraction.

### Data & Contracts

- Types/schemas/events:
  - `TillReconciliationUIControls` interface (`useTillReconciliationLogic.ts` lines 14–22): exposes `closeCashForms`, `setShowExchangeForm`, `setShowTenderRemovalForm`, `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`. **This interface must be updated** to remove the three individual booleans and replace them with the union accessor.
  - `CheckinsTableView` Props interface (`view/CheckinsTable.tsx` lines 20–51): `isEditMode: boolean`, `isDeleteMode: boolean`, `isAddGuestMode: boolean` as separate props. After refactoring these can be replaced by `checkinMode: CheckinMode`.
  - `FormsContainer`'s `FormsContainerProps` interface includes `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`, and three setter functions. If the union is adopted here, prop interface narrows.
  - `DevicePin` type used in `Login` is unrelated to modal state and unaffected.
- Persistence: none — all state is component-local React state, not persisted.
- API/contracts: none — no API calls are triggered by mode state.

### Dependency & Impact Map

- Upstream dependencies:
  - `useCheckinsModes` → consumed only by `CheckinsTable.tsx` (1 call site confirmed).
  - `useTillReconciliationUI` → consumed by `TillReconciliation.tsx` and by the `useTillReconciliationLogic` hook (via `TillReconciliationUIControls` interface). Also referenced in `Live.tsx` (import confirmed via grep).
  - `DraftReviewPanel` state → entirely local, no upstream.
  - `Login` state → entirely local, no upstream.
- Downstream dependents:
  - `CheckinsTableView` (view/CheckinsTable.tsx) receives 3 boolean mode props from `CheckinsTable`. After refactoring, receives 1 `CheckinMode` prop.
  - `FormsContainer` receives 3 boolean + 3 setter props from the spread. After refactoring, receives 1 union prop + 1 union setter (or equivalent).
  - `TillReconciliation.tsx` render: uses `props.showFloatForm`, `props.showExchangeForm`, `props.showTenderRemovalForm` via the spread. These become `props.tillCashForm === 'float'` etc.
  - `useTillReconciliationLogic`: reads `ui.showFloatForm` etc. in `useEffect`; calls `ui.setShowExchangeForm(false)` after `confirmExchange` and `ui.setShowTenderRemovalForm(false)` after `handleTenderRemoval`.
- Likely blast radius:
  - 9 source files changed (hooks and components):
    1. `hooks/utilities/useCheckinsModes.ts`
    2. `hooks/client/till/useTillReconciliationUI.ts`
    3. `hooks/useTillReconciliationLogic.ts` (interface + call sites)
    4. `components/checkins/CheckinsTable.tsx` (controller)
    5. `components/checkins/view/CheckinsTable.tsx` (Props interface + render)
    6. `components/till/TillReconciliation.tsx` (render guards)
    7. `components/till/FormsContainer.tsx` (Props interface + render)
    8. `components/inbox/DraftReviewPanel.tsx` (local state)
    9. `components/Login.tsx` (local state)
  - 7 test files updated:
    1. `hooks/utilities/__tests__/useCheckinsModes.test.ts`
    2. `hooks/client/till/__tests__/useTillReconciliationUI.test.ts`
    3. `components/checkins/__tests__/CheckinsTable.test.tsx`
    4. `components/till/__tests__/TillReconciliation.test.tsx`
    5. `components/till/__tests__/FormsContainer.test.tsx`
    6. `components/till/__tests__/DrawerLimitWarning.test.tsx`
    7. `parity/__tests__/till-route.parity.test.tsx`
  - `Live.tsx` — verified; uses only `isDeleteMode`/`isEditMode` (unaffected by cash form union).

**Critical dependency:** `useTillReconciliationLogic` directly calls `ui.setShowExchangeForm(false)` and `ui.setShowTenderRemovalForm(false)` inside async callbacks. After migration, these calls must become `ui.setCashForm("none")` or equivalent. The `TillReconciliationUIControls` interface is the single contract point between the two hooks — getting this right is the highest-risk change in the batch.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern>`. Tests run in CI only.
- CI integration: GitHub Actions via `reusable-app.yml`.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useCheckinsModes` | Unit (renderHook) | `hooks/utilities/__tests__/useCheckinsModes.test.ts` | Tests toggle mutual exclusivity, archive modal, defaults — needs update |
| `useTillReconciliationUI` | Unit (renderHook) | `hooks/client/till/__tests__/useTillReconciliationUI.test.ts` | Tests form open behaviour, txn store for edit/delete — needs update |
| `CheckinsTable` (controller) | Component | `components/checkins/__tests__/CheckinsTable.test.tsx` | Mocks `useCheckinsModes`; tests mode-routing on row click — needs update |
| `TillReconciliation` | Component | `components/till/__tests__/TillReconciliation.test.tsx` | Mocks both hooks with flat boolean props — needs update |
| `FormsContainer` | Component | `components/till/__tests__/FormsContainer.test.tsx` | Tests form rendering via individual boolean props — needs update |
| `DrawerLimitWarning` | Component | `components/till/__tests__/DrawerLimitWarning.test.tsx` | References `isEditMode`/`isDeleteMode` in till props — needs update |
| `till-route parity` | Parity | `parity/__tests__/till-route.parity.test.tsx` | References boolean till UI flags — needs update |
| `DraftReviewPanel` | Not found | (none observed) | No dedicated test file identified (pre-existing gap) |
| `Login` | Not found | (none observed) | No dedicated test file identified (pre-existing gap) |

#### Coverage Gaps
- Untested paths:
  - `DraftReviewPanel` confirm dialogs (no test file found — pre-existing gap).
  - `Login` panel transitions (no test file found — pre-existing gap).
- Extinct tests / tests requiring update (7 files):
  - `useCheckinsModes.test.ts` assertions on `isEditMode`, `isDeleteMode`, `isAddGuestMode` as booleans must be updated to test `checkinMode` value.
  - `useTillReconciliationUI.test.ts` assertions on `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm` as booleans must be updated.
  - `CheckinsTable.test.tsx` `defaultModes()` helper and all `createModes(overrides)` usage must be updated to use union values.
  - `TillReconciliation.test.tsx` `baseProps` flat object includes `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`, `setShowFloatForm`, `setShowExchangeForm`, `setShowTenderRemovalForm` — all must be updated.
  - `FormsContainer.test.tsx` `baseProps` uses same three booleans + setters — must be updated.
  - `DrawerLimitWarning.test.tsx` references boolean till UI flags (`isEditMode`/`isDeleteMode`) — must be updated.
  - `parity/__tests__/till-route.parity.test.tsx` references boolean till UI flags — must be updated.

#### Testability Assessment
- Easy to test: Hook behavior via `renderHook`. Union value assertions are simpler than multi-boolean assertions.
- Hard to test: `Login` PIN unlock state on mount depends on `readJson(DEVICE_PIN_KEY)` from `offline/storage` — would need mocking. No existing test coverage here.
- Test seams needed: No new seams required — all state is already return-value injectable via mocked hooks.

### Recent Git History (Targeted)

- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` — last changed in `801d53f` (TASK-04 + TASK-05 migration). Structure stable.
- `apps/reception/src/components/till/TillReconciliation.tsx` — last changed in `1e920aab23` (OpeningFloatModal, till nudge). Spread-all pattern established.
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — last changed in `70693e0` (redesign conversation and draft reply panels). 4 confirm dialog booleans added.
- `apps/reception/src/components/Login.tsx` — changed in multiple checkins; PIN setup pattern stable.
- No recent changes to `useCheckinsModes` or `useTillReconciliationUI` themselves — they are stable targets.

## Questions

### Resolved

- Q: Does `useTillReconciliationUI` serve any consumers other than `TillReconciliation.tsx`?
  - A: Yes — `Live.tsx` also imports it and calls both `useTillReconciliationUI()` and `useTillReconciliationLogic(ui)`. It uses `isDeleteMode` and `isEditMode` (passed to `SummaryAndTransactions`) but does NOT reference `showFloatForm`, `showExchangeForm`, or `showTenderRemovalForm`. The cash form union migration is therefore transparent to `Live.tsx`; only the `TillReconciliationUIControls` interface update (which `Live.tsx` consumes via `useTillReconciliationLogic`) needs to be verified at build time.
  - Evidence: `apps/reception/src/components/live/Live.tsx` lines 14–58 — spread via `{ ...ui, ...logic }`, props to `SummaryAndTransactions` include only `isDeleteMode`, `isEditMode`, `handleRowClickForDelete`, `handleRowClickForEdit`.

- Q: Is `showArchiveModal` mutually exclusive with the 3 mode flags in `useCheckinsModes`?
  - A: No — `openArchiveModal` sets archive modal true AND clears all 3 mode flags, but `showArchiveModal` is a different kind of state (it's a modal overlay, not a row-interaction mode). It should remain a separate `boolean` and not be folded into `CheckinMode`.
  - Evidence: `useCheckinsModes.ts` lines 35–40: `openArchiveModal` calls `setShowArchiveModal(true)` and explicitly zeroes mode flags.

- Q: Does `DraftReviewPanel` need any test coverage added?
  - A: No new tests are required by this refactoring. Since `DraftReviewPanel` has no existing tests, the refactoring only needs to ensure the component remains functionally identical. Adding tests is a net positive but not in scope for this refactoring.
  - Evidence: No test file found in `apps/reception/src/components/inbox/__tests__/` or adjacent.

- Q: Do `isDeleteMode` / `isEditMode` in `useTillReconciliationUI` need to be part of a union?
  - A: No. They control which action happens on a transaction row click. They are not the same logical group as the cash form flags and are not mutually exclusive with anything — `isDeleteMode` and `isEditMode` can be set independently (the hook has no cross-zeroing between them). They should remain separate booleans in this refactoring. (If they need their own union, that's a separate dispatch.)
  - Evidence: `useTillReconciliationUI.ts` lines 49–55: `handleRowClickForEdit` sets `isEditMode(false)`, `handleRowClickForDelete` sets `isDeleteMode(false)` — but no cross-zeroing between them and the cash form flags.

- Q: How does `Login` determine its initial panel?
  - A: A `useEffect` on mount reads `readJson<DevicePin>(DEVICE_PIN_KEY)` from localStorage. If a stored PIN exists, it calls `setShowPinUnlock(true)`. After migration, the initial union value must be `"credentials"` by default, and the `useEffect` must call `setLoginPanel("pinUnlock")` if a PIN is found.
  - Evidence: `Login.tsx` lines 119–126.

### Open (Operator Input Required)

_(none — all open questions were resolved from available evidence)_

## Confidence Inputs

- **Implementation: 92%**
  Evidence: All 4 target files read in full. All call sites identified. Interface dependencies mapped. The pattern is mechanical and well-understood. The only residual risk is `useTillReconciliationLogic`'s coupling to the UI interface — verified and documented.
  Raises to >=80: already above. Raises to >=90: already above (understanding of cross-hook interface dependency confirmed).

- **Approach: 90%**
  Evidence: Discriminated union + single state variable is idiomatic React for mutually exclusive state. No architectural constraints prevent this approach. `CheckinsTableView` prop reduction follows naturally. `TillReconciliationUIControls` update is the single complexity point, verified.
  Raises to >=80: already above. Raises to >=90: already above.

- **Impact: 95%**
  Evidence: Pure refactoring within `apps/reception/src/`. No API changes, no persistence changes, no routing changes. Blast radius is bounded to 9 source files + 7 test files. All consumers verified; `Live.tsx` confirmed to not use cash form flags.
  Raises to >=80: already above. Raises to >=90: already above.

- **Delivery-Readiness: 92%**
  Evidence: All files read. Entry points and call sites confirmed. 9 source files and 7 test files fully identified. `Live.tsx` verified — only `isDeleteMode`/`isEditMode` used (cash form union is transparent). No external blockers.
  Raises to >=80: already above. Raises to >=90: already above.

- **Testability: 88%**
  Evidence: All existing tests are hook-return-value-level and component-level via mocks. Union assertions (`expect(result.current.checkinMode).toBe("edit")`) are simpler than multi-boolean assertions. The absence of `DraftReviewPanel` and `Login` tests is a pre-existing gap, not introduced by this refactoring.
  Raises to >=80: already above. Raises to >=90: add tests for `DraftReviewPanel` confirm dialog union (optional, out of scope here).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `useTillReconciliationLogic` callers of `ui.setShowExchangeForm(false)` / `ui.setShowTenderRemovalForm(false)` missed during migration | Low | High | Explicit in plan task: update `TillReconciliationUIControls` interface first, then build will fail on all stale call sites — TypeScript enforces completeness |
| `Live.tsx` directly destructures cash form boolean flags from `useTillReconciliationUI` | Resolved | — | Verified: `Live.tsx` uses only `isDeleteMode`/`isEditMode` — cash form union is transparent to it |
| `CheckinsTableView` consumers of `isEditMode`/`isDeleteMode`/`isAddGuestMode` booleans (e.g. `BookingRow`) need updates | Low | Low | `BookingRow` receives `onRowClick` callback (not mode flags directly), so it is not affected |
| Test mock shapes diverge after refactoring — CI fails | Low | Medium | Plan task explicitly includes test updates for all 7 affected test files |
| `Login` initial panel logic on mount regressed | Low | Medium | `useEffect` pattern is simple; converted to `setLoginPanel("pinUnlock")` — functionally identical |

## Planning Constraints & Notes

- Must-follow patterns:
  - Keep `showArchiveModal` as a separate `boolean` in `useCheckinsModes` — it is not part of the `CheckinMode` union.
  - Keep `isDeleteMode` / `isEditMode` as separate booleans in `useTillReconciliationUI` — they are not cash-form state.
  - Update `TillReconciliationUIControls` interface first (before updating the hook implementation), so TypeScript surfaces all stale call sites in `useTillReconciliationLogic`.
  - Do not change the names of the toggle callbacks exported from `useCheckinsModes` (`toggleEditMode`, `toggleDeleteMode`, `toggleAddGuestMode`) — callers rely on these names and changing them increases diff unnecessarily. Internally they set the union value; externally the API is unchanged.
  - `CheckinsTableView` prop interface change: prefer replacing the 3 boolean props with a single `checkinMode: CheckinMode` prop. The controller `CheckinsTable` passes `modes.checkinMode` rather than the 3 booleans.
- Rollout/rollback expectations: No feature flags needed — pure refactoring, no user-visible behavior change.
- Observability expectations: None — no metrics or logs are tied to modal state.

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Migrate `useCheckinsModes`** — Define `CheckinMode` union type; replace 3 booleans with `checkinMode: CheckinMode`; update toggle callbacks to set union value; update `openArchiveModal` to return mode to `"idle"`; update hook return shape; update `CheckinsTable.tsx` controller to pass `checkinMode`; update `CheckinsTableView` Props to accept `checkinMode: CheckinMode`; update tests.
2. **TASK-02: Migrate `useTillReconciliationUI` cash forms** — Define `TillCashForm` union; replace `showFloatForm/showExchangeForm/showTenderRemovalForm` + their setters + `closeCashForms` with `cashForm: TillCashForm` + `setCashForm`; update `TillReconciliationUIControls` interface in `useTillReconciliationLogic.ts`; update all call sites in `useTillReconciliationLogic` (`useEffect`, `confirmExchange`, `handleTenderRemoval`); update `FormsContainer` Props; update `TillReconciliation.tsx` render; update tests.
3. **TASK-03: Migrate `DraftReviewPanel` confirm dialogs** — Define `DraftConfirmDialog` union; replace 4 booleans with `confirmDialog: DraftConfirmDialog`; update all `setShow*Confirm` → `setConfirmDialog`; update confirm handlers to reset to `"none"`.
4. **TASK-04: Migrate `Login` panel state** — Define `LoginPanel` union; replace 3 booleans with `loginPanel: LoginPanel`; update `useEffect` on mount; update panel render guards; update focus `useEffect`; update all transition handlers.
5. **TASK-05: Verify remaining call sites** — Grep all remaining consumers of `useTillReconciliationUI`. `Live.tsx` confirmed as using only `isDeleteMode`/`isEditMode` (unaffected by cash form union). TypeScript will surface any stale flag references at compile time; resolve any that arise.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: TypeScript compiles without errors (`pnpm typecheck`); lint passes (`pnpm lint`); CI passes.
- Post-delivery measurement plan: None required — pure refactoring.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `useCheckinsModes` hook — full read + return shape | Yes | None | No |
| `CheckinsTable.tsx` — full read, all mode prop usages | Yes | None | No |
| `CheckinsTableView` Props interface — full read | Yes | None | No |
| `useTillReconciliationUI` hook — full read + return shape | Yes | None | No |
| `TillReconciliationUIControls` interface — full read | Yes | None | No |
| `useTillReconciliationLogic` — full read, cross-hook dependencies | Yes | None | No |
| `FormsContainer` — interface + render | Yes | None | No |
| `TillReconciliation.tsx` — spread pattern, render guards | Yes | None | No |
| `DraftReviewPanel.tsx` — all 4 confirm dialog flags | Yes | None | No |
| `Login.tsx` — all 3 panel flags, mount effect | Yes | None | No |
| Test landscape — all 7 affected test files | Yes | None | No |
| `Live.tsx` — import confirmed, destructuring verified | Yes | None | No |

## Scope Signal

- Signal: right-sized
- Rationale: Scope covers exactly 4 components + their test files + the one cross-hook interface (`TillReconciliationUIControls`). Blast radius is bounded to `apps/reception/src/`. No external dependencies. All changes are mechanical type-system enforced. `Live.tsx` verified to use only `isDeleteMode`/`isEditMode` — cash form union migration is transparent to it.

## Evidence Gap Review

### Gaps Addressed
1. Citation integrity: every claim has a file path and line-range reference. Interface dependencies traced to import sites.
2. Boundary coverage: no API boundaries, no security boundaries. All state is client-local React state.
3. Testing coverage: all 7 affected test files identified (including `DrawerLimitWarning.test.tsx` and `till-route.parity.test.tsx`). Coverage gaps documented (DraftReviewPanel, Login have no tests — pre-existing).
4. Cross-hook interface dependency (`TillReconciliationUIControls`): fully traced — direct callers of `ui.setShowExchangeForm(false)` / `ui.setShowTenderRemovalForm(false)` in `useTillReconciliationLogic` identified and documented.
5. Source file blast radius corrected: 9 source files (not 4). All files explicitly named in the Dependency section.

### Confidence Adjustments
- No downward adjustments needed — all material concerns were resolvable from code.
- `Live.tsx` exact usage: acknowledged as minor gap; does not affect confidence in approach since any usage will be surfaced by TypeScript at compile time.

### Remaining Assumptions
- None. `Live.tsx` cash form flag usage confirmed to be absent (verified in Round 1 critique cycle). All material assumptions have been verified from source files.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-modal-mode-discriminated-unions --auto`
