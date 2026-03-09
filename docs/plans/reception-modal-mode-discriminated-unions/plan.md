---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Sequenced: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-modal-mode-discriminated-unions
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Modal/Mode Discriminated Unions — Plan

## Summary

Four components in `apps/reception/src/` encode mutually exclusive state as independent boolean `useState` variables, requiring manual cross-zeroing on every transition. This plan replaces each boolean-flag group with a typed discriminated union so illegal state combinations are impossible by construction. The refactoring is pure — no behavior changes, no API changes, no routing changes. The blast radius is 9 source files and 7 test files, all within `apps/reception/src/`.

Tasks are ordered so that the riskiest cross-hook interface change (`TillReconciliationUIControls`) is done before its consumers, ensuring TypeScript surfaces any stale call sites at compile time. The checkin mode migration (TASK-01) and till cash form migration (TASK-02) can run in parallel since they touch completely separate files.

## Active tasks

- [x] TASK-01: Migrate `useCheckinsModes` to `CheckinMode` union
- [x] TASK-02: Migrate `useTillReconciliationUI` cash forms to `TillCashForm` union
- [x] TASK-03: Migrate `DraftReviewPanel` confirm dialogs to `DraftConfirmDialog` union
- [x] TASK-04: Migrate `Login` panel state to `LoginPanel` union
- [x] TASK-05: Typecheck, lint, and final verification

## Goals

- Replace 3 + 3 + 4 + 3 boolean flags with 4 typed union variables.
- Make illegal mode combinations impossible by construction.
- Reduce `CheckinsTableView` from 3 boolean mode props to 1 `checkinMode: CheckinMode` prop.
- Update the `TillReconciliationUIControls` interface and all its consumers.
- Pass all 7 affected test files updated with union-compatible assertions.

## Non-goals

- No behavior changes.
- No changes outside `apps/reception/src/`.
- No changes to Firebase data shapes, API contracts, or routing.
- No new test files (pre-existing gaps for `DraftReviewPanel` and `Login` are out of scope).

## Constraints & Assumptions

- Constraints:
  - `showArchiveModal` stays a separate `boolean` in `useCheckinsModes`.
  - `isDeleteMode` / `isEditMode` stay separate booleans in `useTillReconciliationUI`.
  - Callback names exported from `useCheckinsModes` (`toggleEditMode`, `toggleDeleteMode`, `toggleAddGuestMode`) must not change — callers rely on them.
  - `TillReconciliationUIControls` interface must be updated before the hook implementation to surface stale call sites via TypeScript errors.
- Assumptions:
  - `Live.tsx` only uses `isDeleteMode`/`isEditMode` from `useTillReconciliationUI` — cash form union is transparent to it (verified).
  - `BookingRow` receives `onRowClick` callback (not mode flags) — unaffected.

## Inherited Outcome Contract

- **Why:** Arrays of independent boolean flags for mutually exclusive state create 2^N theoretical states for an N-state reality, require manual enforcement of mutual exclusivity, and inflate component prop interfaces. The pattern is present in 4 components and already cascades into 27-prop `CheckinsTableView`.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each modal/mode state in reception uses a single discriminated union state variable. Illegal state combinations are impossible by construction. `CheckinsTableView` prop count is reduced via a grouped mode-state prop (from 3 separate boolean props to 1 union-typed prop).
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-modal-mode-discriminated-unions/fact-find.md`
- Key findings used:
  - `useCheckinsModes` returns 13 values; 3 are the mutually exclusive mode flags. `showArchiveModal` is separate.
  - `useTillReconciliationUI` returns 22 values; 3 (`showFloatForm/showExchangeForm/showTenderRemovalForm`) are the mutually exclusive cash form flags.
  - `useTillReconciliationLogic` holds the critical cross-hook dependency: it calls `ui.setShowExchangeForm(false)` and `ui.setShowTenderRemovalForm(false)` in async callbacks, and reads all three flags in a `useEffect` dependency array.
  - 7 test files need updating (confirmed by grep + file read).
  - `Live.tsx` uses only `isDeleteMode`/`isEditMode` — unaffected by cash form union (verified).

## Proposed Approach

- Option A: Replace boolean flags with discriminated union + single `useState` per group. Export union type from the hook/component for consumers. Update interface before implementation.
- Option B: Introduce a `useModalState` generic utility hook. Wrap each boolean group.
- Chosen approach: **Option A**. It is simpler, requires no new abstractions, and keeps each site self-contained. The type is already naturally discriminated by string literal values. Option B would introduce a shared abstraction that adds complexity without meaningful reuse benefit at this scale (4 small independent sites).

## Plan Gates

- Foundation Gate: Pass
  - Deliverable-Type: code-change ✓
  - Execution-Track: code ✓
  - Primary-Execution-Skill: lp-do-build ✓
  - Startup-Deliverable-Alias: none ✓
  - Delivery-readiness confidence: 92% ✓
  - Test landscape: present and enumerated ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Migrate `useCheckinsModes` to `CheckinMode` union | 90% | M | Complete | - | TASK-05 |
| TASK-02 | IMPLEMENT | Migrate `useTillReconciliationUI` cash forms to `TillCashForm` union | 88% | M | Complete | - | TASK-05 |
| TASK-03 | IMPLEMENT | Migrate `DraftReviewPanel` confirm dialogs to `DraftConfirmDialog` union | 92% | S | Complete | - | TASK-05 |
| TASK-04 | IMPLEMENT | Migrate `Login` panel state to `LoginPanel` union | 88% | S | Complete | - | TASK-05 |
| TASK-05 | IMPLEMENT | Typecheck, lint, and final verification | 90% | S | Complete | TASK-01, TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All four migrations are independent; can run in parallel |
| 2 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Final typecheck + lint gate after all migrations complete |

## Tasks

---

### TASK-01: Migrate `useCheckinsModes` to `CheckinMode` union

- **Type:** IMPLEMENT
- **Deliverable:** Updated hook, controller, view, and test files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/utilities/useCheckinsModes.ts`
  - `apps/reception/src/components/checkins/CheckinsTable.tsx`
  - `apps/reception/src/components/checkins/view/CheckinsTable.tsx`
  - `apps/reception/src/hooks/utilities/__tests__/useCheckinsModes.test.ts`
  - `apps/reception/src/components/checkins/__tests__/CheckinsTable.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — All 3 source files and 2 test files read in full. Pattern is mechanical. `showArchiveModal` confirmed to remain a separate `boolean`.
  - Approach: 95% — Discriminated union is idiomatic React. No architectural blockers. Callback names are preserved.
  - Impact: 90% — Confined to 3 source files + 2 test files. `BookingRow` receives `onRowClick` (not mode flags) so it is unaffected. TypeScript enforces completeness at compile time.
- **Acceptance:**
  - `CheckinMode = "idle" | "edit" | "delete" | "addGuest"` type exported from `useCheckinsModes.ts`.
  - Hook uses `const [checkinMode, setCheckinMode] = useState<CheckinMode>("idle")`.
  - `toggleEditMode` sets `checkinMode` to `"edit"` if currently not `"edit"`, else `"idle"`.
  - `toggleDeleteMode` sets `checkinMode` to `"delete"` if currently not `"delete"`, else `"idle"`.
  - `toggleAddGuestMode` sets `checkinMode` to `"addGuest"` if currently not `"addGuest"`, else `"idle"`.
  - `openArchiveModal` sets `showArchiveModal(true)` AND sets `checkinMode("idle")`.
  - Hook return shape: `{ checkinMode, showArchiveModal, selectedBooking, bookingToDelete, setSelectedBooking, setBookingToDelete, toggleAddGuestMode, toggleEditMode, toggleDeleteMode, openArchiveModal, closeArchiveModal }`.
  - `CheckinsTable.tsx` controller destructures `checkinMode` and passes it to `CheckinsTableView` as a single prop.
  - `CheckinsTableView` Props interface: `isEditMode: boolean`, `isDeleteMode: boolean`, `isAddGuestMode: boolean` replaced by `checkinMode: CheckinMode`. All 3 banner conditions and `onRowClick` gate use `checkinMode === "edit"` etc.
  - `CheckinsTable.tsx` `handleRowClick` uses `checkinMode` directly (not 3 booleans).
  - `useCheckinsModes.test.ts` updated: `expect(result.current.checkinMode).toBe("idle")` etc.
  - `CheckinsTable.test.tsx` `defaultModes()` returns `{ checkinMode: "idle" as CheckinMode, ... }`. All mode-routing tests use `checkinMode: "edit"` etc.
  - TypeScript compiles without errors on affected files.
  - No behavior change observable — same mode banner text, same row-click routing.
- **Consumer tracing (Phase 5.5):**
  - `checkinMode` prop new output: consumed by `CheckinsTableView` mode banners (lines 108–131) and `onRowClick` gate (line 208). Both updated in this task.
  - `CheckinsTable.tsx` `handleRowClick` reads `checkinMode` from the hook return — updated in this task.
  - `BookingRow` receives `onRowClick | undefined` — not the mode flag — no change needed.
  - Consumer `CheckinsTable.test.tsx` mock: updated to return `checkinMode` string value.
- **Validation contract:**
  - TC-01: `renderHook(() => useCheckinsModes())` — initial `checkinMode` is `"idle"`.
  - TC-02: Call `toggleEditMode()` — `checkinMode` becomes `"edit"`. Call again — returns to `"idle"`.
  - TC-03: Call `toggleAddGuestMode()` then `toggleEditMode()` — `checkinMode` is `"edit"` (add-guest not in double-active state).
  - TC-04: Call `openArchiveModal()` — `showArchiveModal` is true AND `checkinMode` is `"idle"`.
  - TC-05: `CheckinsTable` with `checkinMode="edit"` — row click calls `setSelectedBooking`.
  - TC-06: `CheckinsTable` with `checkinMode="delete"` — row click calls `setBookingToDelete`.
  - TC-07: `CheckinsTable` with `checkinMode="addGuest"` — row click calls `addReplicatedGuestToBooking`.
  - TC-08: `CheckinsTable` with `checkinMode="idle"` — row click does nothing (no mode active).
- **Execution plan:** Red: update `useCheckinsModes.ts` to union state (tests will fail on old boolean shape) → Green: update `CheckinsTable.tsx` and `CheckinsTableView` Props + render to use `checkinMode` → update both test files → Refactor: verify no stale `isEditMode`/`isDeleteMode`/`isAddGuestMode` boolean references remain.
- **Planning validation:**
  - Checks run: Read `useCheckinsModes.ts`, `CheckinsTable.tsx`, `view/CheckinsTable.tsx`, both test files in full.
  - Validation artifacts: All file contents confirmed. Toggle pattern confirmed mechanical. `showArchiveModal` separate boolean confirmed.
  - Unexpected findings: None.
- **Scouts:** None: all call sites confirmed.
- **Edge Cases & Hardening:**
  - Toggle-to-idle: each toggle must check `checkinMode === thisMode` before setting to `"idle"`, to preserve the current "second click deactivates" behavior.
  - `openArchiveModal` must set `checkinMode` to `"idle"` — verified same as current behavior of zeroing all flags.
- **What would make this >=90%:** Already at 90%. Reaches ≥95% after TypeScript confirms zero errors on these files.
- **Rollout / rollback:**
  - Rollout: No feature flags. Pure type refactoring — deploy with next release.
  - Rollback: Revert commit. No data migration needed.
- **Documentation impact:** None: no external docs reference these internals.

---

### TASK-02: Migrate `useTillReconciliationUI` cash forms to `TillCashForm` union

- **Type:** IMPLEMENT
- **Deliverable:** Updated hook, interface, logic hook, container, reconciliation component, and test files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/client/till/useTillReconciliationUI.ts`
  - `apps/reception/src/hooks/useTillReconciliationLogic.ts`
  - `apps/reception/src/components/till/TillReconciliation.tsx`
  - `apps/reception/src/components/till/FormsContainer.tsx`
  - `apps/reception/src/hooks/client/till/__tests__/useTillReconciliationUI.test.ts`
  - `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx`
  - `apps/reception/src/components/till/__tests__/FormsContainer.test.tsx`
  - `apps/reception/src/components/till/__tests__/DrawerLimitWarning.test.tsx`
  - `apps/reception/src/parity/__tests__/till-route.parity.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 90% — All source files read. The cross-hook interface (`TillReconciliationUIControls`) is the highest-risk change; both hooks read in full, all call sites mapped. Interface-first ordering eliminates missed call sites.
  - Approach: 90% — Union + single setter is the right pattern. Interface-first ensures TypeScript surfaces stale callers at compile time before hook implementation runs.
  - Impact: 85% — 5 source files + 4 test files. `Live.tsx` verified unaffected. Spread-all pattern in `TillReconciliation` means the union getter/setter appear automatically in `props`; render guards must be updated manually.
- **Acceptance:**
  - `TillCashForm = "none" | "float" | "exchange" | "tenderRemoval"` type exported from `useTillReconciliationUI.ts`.
  - Hook uses `const [cashForm, setCashForm] = useState<TillCashForm>("none")`.
  - `closeCashForms()` is replaced by `setCashForm("none")` directly (or kept as a thin wrapper: `const closeCashForms = useCallback(() => setCashForm("none"), [])`).
  - `handleAddChangeClick` calls `setCashForm("float")` (after first calling the shift-form close via logic — see execution plan ordering).
  - `handleExchangeClick` calls `setCashForm("exchange")`.
  - `handleLiftClick` calls `setCashForm("tenderRemoval")`.
  - `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm` (and their raw setters) are removed from hook return.
  - Hook returns: `cashForm`, `setCashForm`, `closeCashForms` (wrapper), plus all existing non-form fields.
  - `TillReconciliationUIControls` interface in `useTillReconciliationLogic.ts` updated: removes `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`, `setShowExchangeForm`, `setShowTenderRemovalForm`; adds `cashForm: TillCashForm`, `setCashForm: (v: TillCashForm) => void`.
  - `useTillReconciliationLogic.ts` updated: `useEffect` dependency array uses `ui.cashForm`; `confirmExchange` calls `ui.setCashForm("none")`; `handleTenderRemoval` calls `ui.setCashForm("none")`.
  - `FormsContainer` Props interface: `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm` + 3 setters replaced by `cashForm: TillCashForm` + `setCashForm: (v: TillCashForm) => void`. Render conditions become `cashForm === "float"` etc. `onClose`/`onCancel` callbacks call `setCashForm("none")`.
  - `TillReconciliation.tsx` render guards: `props.showFloatForm` → `props.cashForm === "float"` etc. `props.setShowFloatForm`/`setShowExchangeForm`/`setShowTenderRemovalForm` calls replaced.
  - 4 test files updated: mock shapes replace the 3 booleans + 3 setters with `cashForm: "none"` + `setCashForm: jest.fn()`.
  - TypeScript compiles without errors on all 5 affected source files.
  - `isDeleteMode` / `isEditMode` unchanged — remain separate booleans.
- **Consumer tracing (Phase 5.5):**
  - `cashForm` new output: consumed by `TillReconciliation.tsx` (render guards), `FormsContainer` (conditional rendering), `useTillReconciliationLogic` (useEffect dep). All updated in this task.
  - `setCashForm` new output: consumed by `TillReconciliation.tsx` (via props spread), `FormsContainer` (onClose callbacks), `useTillReconciliationLogic` (`confirmExchange`, `handleTenderRemoval`). All updated in this task.
  - `Live.tsx`: uses `{ ...ui, ...logic }` spread — `cashForm` appears in props but `SummaryAndTransactions` does not receive it (Live only passes `isDeleteMode`, `isEditMode`, `handleRowClickForDelete`, `handleRowClickForEdit`). No change needed.
  - `DrawerLimitWarning.test.tsx` and `till-route.parity.test.tsx` mock `useTillReconciliationUI` with flat boolean shape — both must be updated.
- **Validation contract:**
  - TC-01: `handleAddChangeClick()` — `cashForm` becomes `"float"`. `handleExchangeClick()` — `cashForm` becomes `"exchange"`. `handleLiftClick()` — `cashForm` becomes `"tenderRemoval"`.
  - TC-02: After `handleExchangeClick()`, call `handleAddChangeClick()` — `cashForm` is `"float"` (not both active).
  - TC-03: `closeCashForms()` — `cashForm` resets to `"none"`.
  - TC-04: `FormsContainer` with `cashForm="float"` and `shiftOpenTime` set — `FloatEntryModal` rendered.
  - TC-05: `FormsContainer` with `cashForm="exchange"` — `ExchangeNotesForm` rendered.
  - TC-06: `TillReconciliation` integration: edit mode banner, delete mode banner, auth guard — unchanged (these use `isEditMode`/`isDeleteMode` which are untouched).
  - TC-07: TypeScript compilation error if `ui.setShowExchangeForm` still referenced after interface update.
- **Execution plan:** Red: update `TillReconciliationUIControls` interface in `useTillReconciliationLogic.ts` — TypeScript errors will appear at all stale call sites → Green (step by step): update `useTillReconciliationUI.ts` to union state → update `useTillReconciliationLogic.ts` call sites (`useEffect`, `confirmExchange`, `handleTenderRemoval`) → update `FormsContainer.tsx` Props + render → update `TillReconciliation.tsx` render guards → update 4 test files → Refactor: verify no stale `showFloatForm`/`showExchangeForm`/`showTenderRemovalForm` references remain.
- **Planning validation:**
  - Checks run: Read `useTillReconciliationUI.ts`, `useTillReconciliationLogic.ts`, `TillReconciliation.tsx`, `FormsContainer.tsx`, all 4 test files in full. `Live.tsx` read and verified.
  - Validation artifacts: All `ui.setShowExchangeForm(false)` and `ui.setShowTenderRemovalForm(false)` call sites in `useTillReconciliationLogic.ts` confirmed (lines 160, 197). `useEffect` dep array confirmed (line 61–64).
  - Unexpected findings: None.
- **Scouts:** Interface-first ordering acts as a scout — TypeScript will fail on first compile after interface update, surfacing any missed callers.
- **Edge Cases & Hardening:**
  - `closeCashForms` wrapper: keep as exported name for any external callers (e.g., `useTillReconciliationLogic`'s `closeAllForms`). Internally calls `setCashForm("none")`.
  - Snapshot tests in `till-route.parity.test.tsx`: if the snapshot includes rendered output tied to the old boolean shape, it must be regenerated.
- **What would make this >=90%:** Reaches 90% after TypeScript confirms zero errors on all 5 source files post-migration.
- **Rollout / rollback:**
  - Rollout: No feature flags. Pure type refactoring.
  - Rollback: Revert commit.
- **Documentation impact:** None.

---

### TASK-03: Migrate `DraftReviewPanel` confirm dialogs to `DraftConfirmDialog` union

- **Type:** IMPLEMENT
- **Deliverable:** Updated component file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 92%
  - Implementation: 92% — Full file read. 4 booleans are purely local to the component. Pattern is straightforward. No hook extraction needed.
  - Approach: 95% — Single `useState<DraftConfirmDialog>` replacing 4 booleans. Each button sets the value; confirm handlers reset to `"none"` on success.
  - Impact: 95% — 1 file only. No props change. No test file to update (pre-existing gap). TypeScript enforces completeness.
- **Acceptance:**
  - `DraftConfirmDialog = "none" | "regenerate" | "send" | "resolve" | "dismiss"` type defined locally in `DraftReviewPanel.tsx`.
  - Component uses `const [confirmDialog, setConfirmDialog] = useState<DraftConfirmDialog>("none")`.
  - Regenerate button: `onClick={() => setConfirmDialog("regenerate")}`.
  - Send button: `onClick={() => setConfirmDialog("send")}`.
  - Resolve button: `onClick={() => setConfirmDialog("resolve")}`.
  - Dismiss button: `onClick={() => setConfirmDialog("dismiss")}`.
  - `handleConfirmSend` resets with `setConfirmDialog("none")` on success (was `setShowSendConfirm(false)`).
  - `handleConfirmRegenerate` resets with `setConfirmDialog("none")` on success.
  - `handleConfirmResolve` resets with `setConfirmDialog("none")` on success.
  - `handleConfirmDismiss` resets with `setConfirmDialog("none")` on success.
  - Cancel callbacks on each `ConfirmModal` call `setConfirmDialog("none")`.
  - All 4 `ConfirmModal` `isOpen` props use `confirmDialog === "regenerate"` etc.
  - TypeScript compiles without errors.
  - Behavior identical: at most one confirm dialog open at a time.
- **Consumer tracing (Phase 5.5):**
  - All state is local — no external consumers. No prop changes. No test updates needed.
- **Validation contract:**
  - TC-01: Click "Regenerate" button — `confirmDialog` is `"regenerate"`. `ConfirmModal` with `isOpen={confirmDialog === "regenerate"}` is shown.
  - TC-02: Click "Send" button — `confirmDialog` is `"send"`. Regenerate modal not shown.
  - TC-03: Confirm regenerate succeeds — `confirmDialog` resets to `"none"`.
  - TC-04: Cancel on any confirm modal — `setConfirmDialog("none")` called.
- **Execution plan:** Red: replace 4 `useState<boolean>` with 1 `useState<DraftConfirmDialog>` (tests fail if any exist) → Green: update all button handlers and `ConfirmModal` props → Refactor: remove unused `setShowRegenerateConfirm`, `setShowSendConfirm` etc. references.
- **Planning validation:**
  - Checks run: Read `DraftReviewPanel.tsx` in full (447 lines). All 4 confirm booleans and their usages mapped.
  - Unexpected findings: None.
- **Scouts:** None: fully self-contained.
- **Edge Cases & Hardening:**
  - Confirm handlers use `try/catch` and keep modal open on error — this behavior is preserved; the only change is the reset mechanism.
- **What would make this >=90%:** Already at 92%. No remaining unknowns.
- **Rollout / rollback:**
  - Rollout: No feature flags.
  - Rollback: Revert commit.
- **Documentation impact:** None.

---

### TASK-04: Migrate `Login` panel state to `LoginPanel` union

- **Type:** IMPLEMENT
- **Deliverable:** Updated component file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/Login.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 88% — Full file read (568 lines). 3 panel booleans confirmed. Mount `useEffect` and focus `useEffect` both reference the flags. All early-return render guards identified.
  - Approach: 90% — Union is a natural fit for the early-return panel pattern. Initial value `"credentials"` (default) with mount effect setting `"pinUnlock"` if stored PIN found is functionally identical.
  - Impact: 90% — 1 file only. No test file to update. No props change (`Login` receives only `onLoginSuccess?`).
- **Acceptance:**
  - `LoginPanel = "credentials" | "forgotPassword" | "pinSetup" | "pinUnlock"` type defined locally in `Login.tsx`.
  - Component uses `const [loginPanel, setLoginPanel] = useState<LoginPanel>("credentials")`.
  - Mount `useEffect`: if `readJson<DevicePin>(DEVICE_PIN_KEY)` returns a stored PIN, calls `setDevicePin(stored)` and `setLoginPanel("pinUnlock")`.
  - Focus `useEffect` dependencies updated: `if (loginPanel === "forgotPassword")` etc.
  - `handleShowForgotPassword` calls `setLoginPanel("forgotPassword")`.
  - `handleBackToLogin` calls `setLoginPanel("credentials")`.
  - After successful email login with no PIN: `setLoginPanel("pinSetup")`.
  - `handleSkipPinSetup` and `handlePinSetup` call `setLoginPanel("credentials")` then `onLoginSuccess?.()` (or directly `onLoginSuccess?.()`).
  - `handleClearDevicePin` calls `setLoginPanel("credentials")`.
  - Early-return render guards: `if (loginPanel === "forgotPassword") return ...` etc.
  - `handlePinInputChange`: condition `if (loginPanel === "pinSetup")` replaces `if (showPinSetup)`.
  - TypeScript compiles without errors.
  - Behavior identical: same panel shown under same conditions.
- **Consumer tracing (Phase 5.5):**
  - All state is local. No external consumers. No prop changes.
- **Validation contract:**
  - TC-01: Mount with no stored PIN — `loginPanel` is `"credentials"`.
  - TC-02: Mount with stored PIN — `loginPanel` is `"pinUnlock"`.
  - TC-03: Click "Forgot password?" — `loginPanel` becomes `"forgotPassword"`.
  - TC-04: Click "Back to sign in" — `loginPanel` returns to `"credentials"`.
  - TC-05: Successful email login with no PIN — `loginPanel` becomes `"pinSetup"`.
  - TC-06: `handlePinInputChange` with 6 digits when `loginPanel === "pinSetup"` — calls `handlePinSetup`.
  - TC-07: `handleClearDevicePin` — `loginPanel` becomes `"credentials"`.
- **Execution plan:** Red: replace 3 `useState<boolean>` with 1 `useState<LoginPanel>` (structural change) → Green: update mount `useEffect`, focus `useEffect`, all transition handlers, all early-return guards, `handlePinInputChange` condition → Refactor: remove unused `showForgotPassword`, `showPinSetup`, `showPinUnlock` references.
- **Planning validation:**
  - Checks run: Read `Login.tsx` in full (568 lines). Mount effect (lines 119–126), focus effect (lines 129–137), all handler names and panel guard conditions identified.
  - Unexpected findings: `handlePinInputChange` (line 250) checks `if (showPinSetup)` — must become `if (loginPanel === "pinSetup")`. Also, after `handleEmailLogin` success with no `devicePin`, the code calls `setShowPinSetup(true)` — must become `setLoginPanel("pinSetup")`.
- **Scouts:** None: fully self-contained.
- **Edge Cases & Hardening:**
  - `showPinUnlock && devicePin` guard in the render: the union plus a `devicePin !== null` check preserves this — `if (loginPanel === "pinUnlock" && devicePin)`.
  - After `handlePinSetup` completes, `setShowPinSetup(false)` becomes `setLoginPanel("credentials")` — and then `onLoginSuccess?.()` is called. Order preserved.
- **What would make this >=90%:** No single remaining unknown would drop below 80; rating at 88 due to more logic branches compared to the simpler components. Reaches 90+ after TypeScript confirms zero errors.
- **Rollout / rollback:**
  - Rollout: No feature flags.
  - Rollback: Revert commit.
- **Documentation impact:** None.

---

### TASK-05: Typecheck, lint, and final verification

- **Type:** IMPLEMENT
- **Deliverable:** Clean `pnpm typecheck` and `pnpm lint` output for `apps/reception`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `[readonly] apps/reception/src/` — verification only; fix any residual type/lint errors
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Standard verification task. All source files explicitly enumerated. No unknown file count.
  - Approach: 95% — Run `pnpm typecheck && pnpm lint` scoped to reception. Fix any residual errors found.
  - Impact: 90% — No new source changes expected. Any errors surfaced are residual stale references from prior tasks.
- **Acceptance:**
  - `pnpm --filter reception typecheck` exits 0.
  - `pnpm --filter reception lint` exits 0.
  - No remaining references to `isEditMode`/`isDeleteMode`/`isAddGuestMode` in the context of `useCheckinsModes` hook return (grep check).
  - No remaining references to `showFloatForm`/`showExchangeForm`/`showTenderRemovalForm`/`setShowFloatForm`/`setShowExchangeForm`/`setShowTenderRemovalForm`/`closeCashForms` as individual boolean flags in `useTillReconciliationUI` return (grep check).
  - No remaining `showForgotPassword`/`showPinSetup`/`showPinUnlock` references in `Login.tsx`.
  - No remaining `showRegenerateConfirm`/`showSendConfirm`/`showResolveConfirm`/`showDismissConfirm` references in `DraftReviewPanel.tsx`.
- **Consumer tracing:** Not applicable — verification-only task.
- **Validation contract:**
  - TC-01: `pnpm --filter reception typecheck` → exit code 0.
  - TC-02: `pnpm --filter reception lint` → exit code 0 (or only pre-existing suppressions).
  - TC-03: `grep -r "showFloatForm\|showExchangeForm\|showTenderRemovalForm" apps/reception/src` — no hits outside test mock objects (which use the new union shape).
- **Execution plan:** Run typecheck → fix any residual errors → run lint → fix any residual warnings → verify grep checks pass.
- **Planning validation:**
  - Checks run: Review of all source files confirms only the 9 named files need changes. TypeScript is strict mode — will surface all stale usages.
  - Unexpected findings: None anticipated; TypeScript coverage is the safety net.
- **Scouts:** None: TypeScript acts as the scout for this task.
- **Edge Cases & Hardening:**
  - Snapshot updates: if `till-route.parity.test.tsx` has a snapshot tied to the old boolean shape, the snapshot file must be regenerated (`jest --updateSnapshot`). This is a test artifact, not a behavior change.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:** Not applicable — verification task.
- **Documentation impact:** None.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Migrate `useCheckinsModes` | Yes — all 3 source files and 2 test files read; no unknown dependencies | None | No |
| TASK-02: Migrate `useTillReconciliationUI` cash forms | Yes — all 5 source files and 4 test files read; `TillReconciliationUIControls` interface mapped; `Live.tsx` verified | None | No |
| TASK-03: Migrate `DraftReviewPanel` | Yes — file read in full; fully self-contained; no external consumers | None | No |
| TASK-04: Migrate `Login` | Yes — file read in full; fully self-contained; mount effect and all guards mapped | None | No |
| TASK-05: Typecheck + lint | Partial — depends on TASK-01–04 completing without introducing new type errors | [Minor]: residual snapshot update in `till-route.parity.test.tsx` if snapshot tied to old shape | No |

No Critical findings. TASK-05 minor advisory finding (snapshot regeneration) is handled within TASK-05 acceptance.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `useTillReconciliationLogic` stale call sites missed | Low | High | Interface-first ordering in TASK-02 — TypeScript errors surface all stale callers before hook implementation runs |
| Snapshot mismatch in `till-route.parity.test.tsx` | Low | Low | Handled in TASK-05 acceptance: regenerate snapshot with `--updateSnapshot` if needed |
| `Login` PIN setup `showPinSetup && devicePin` render guard combination regressed | Low | Medium | `if (loginPanel === "pinUnlock" && devicePin)` — functionally identical; TASK-04 acceptance explicitly calls this out |
| Toggle-to-idle second-click behavior broken in `useCheckinsModes` | Low | Medium | TASK-01 acceptance explicitly requires toggle check: set to `"idle"` if currently active, else set to mode |

## Observability

- Logging: None: no metrics or logs are tied to modal state.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] All 4 boolean-flag groups replaced with typed discriminated union state.
- [ ] `CheckinsTableView` receives `checkinMode: CheckinMode` instead of 3 separate booleans.
- [ ] `TillReconciliationUIControls` interface updated and all callers in `useTillReconciliationLogic` migrated.
- [ ] All 7 test files updated with union-compatible assertions.
- [ ] `pnpm --filter reception typecheck` exits 0.
- [ ] `pnpm --filter reception lint` exits 0.
- [ ] CI passes (tests run in CI only per testing policy).
- [ ] No stale boolean flag references remain in any of the 9 source files.

## Decision Log

- 2026-03-09: Chosen approach: Option A (simple union per site, no shared abstraction) over Option B (generic `useModalState` hook). Rationale: 4 independent sites with different union shapes; shared abstraction adds complexity without meaningful reuse benefit at this scale.
- 2026-03-09: `showArchiveModal` kept as separate boolean — it is a modal overlay, not a row-interaction mode. Evidence: `openArchiveModal` sets it AND clears mode flags; the two concepts are orthogonal.
- 2026-03-09: `isDeleteMode`/`isEditMode` in `useTillReconciliationUI` kept as separate booleans — they control transaction row clicks, not cash forms, and have no cross-zeroing behavior warranting a union in this refactoring.
- 2026-03-09: Callback names from `useCheckinsModes` (`toggleEditMode`, etc.) kept unchanged to minimize diff and caller churn.

## Overall-confidence Calculation

- TASK-01: 90% × M(2) = 180
- TASK-02: 88% × M(2) = 176
- TASK-03: 92% × S(1) = 92
- TASK-04: 88% × S(1) = 88
- TASK-05: 90% × S(1) = 90
- Sum of weights: 2+2+1+1+1 = 7
- Overall-confidence = (180+176+92+88+90)/7 = 626/7 ≈ **89%** → rounded to **88%** (downward bias rule)
