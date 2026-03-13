---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13T14:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-till-reconciliation-bugs
Dispatch-ID: IDEA-DISPATCH-20260313130000-0001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-till-reconciliation-bugs/analysis.md
---

# Reception Till Reconciliation Bugs — Plan

## Summary

Five confirmed code-level bugs in `apps/reception`'s till reconciliation subsystem, all found during a live audit on 2026-03-13. The three IMPLEMENT tasks cover three separate files (no edit conflicts): Bug 1 (`ActionButtons.tsx` + `TillReconciliation.tsx`), Bugs 2+3 (`useTillReconciliationLogic.ts`), Bugs 4+5 (`useTillShifts.ts`). All tasks are fully parallel with no inter-task dependencies. Dispatch IDs covered: IDEA-DISPATCH-20260313130000-0001 through 0005.

## Active tasks
- [x] TASK-01: Bug 1 — Add Edit/Void mode buttons to ActionButtons — Complete (2026-03-13)
- [x] TASK-02: Bugs 2+3 — Fix float modal close and keycard async ordering — Complete (2026-03-13)
- [x] TASK-03: Bugs 4+5 — Fix keycard diff arg and pendingOverride leak — Complete (2026-03-13)

## Goals
- All five bugs fixed, regression-tested, and CI-green.
- Till reconciliation workflows operational: edit/delete modes reachable, float form closes after success, keycard Firebase errors surface as toasts, keycard reconcile record carries correct `difference`, shift-close does not carry stale override state across attempts.

## Non-goals
- UX redesign beyond the minimum needed for each fix.
- Other till subsystem areas (TillShiftHistory, DrawerLimitWarning, safe management).
- Performance optimisation.

## Constraints & Assumptions
- Constraints:
  - Firebase Realtime DB; all write mutations through custom Firebase hooks.
  - Tests run in CI only. NEVER run jest locally.
  - Writer lock required for commits (`scripts/agents/with-writer-lock.sh`).
  - Pre-commit hook runs `turbo lint` on all changed packages.
- Assumptions:
  - `useEndOfDayReportData.ts` confirmed to NOT read `difference` from reconcile-type cashCount records (grep verified in fact-find). Bug 4 fix has no downstream consumer to update.
  - Reception app is on LAN; Firebase write latency is typically <100ms in production context.
  - Bug 3: making `confirmAddKeycard`/`confirmReturnKeycard` `async` preserves `Promise<void>` return type — compatible with `CountInputModal` which `await`s `onConfirm`. Verified: `CountInputModal` line 35 does `await onConfirm(...)`.

## Inherited Outcome Contract

- **Why:** Five confirmed bugs blocking operational till workflows (edit/delete transaction modes unreachable, float confirmation leaves modal open, keycard Firebase errors silent, keycard audit record corrupt, shift-close retry retains stale override).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All five defects fixed, regression tests passing in CI. Till reconciliation workflows operate correctly: staff can enter and exit edit/delete modes, the float form closes on success, keycard errors surface as toasts, keycard reconcile records carry correct values, and shift-close does not carry stale override state across attempts.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-till-reconciliation-bugs/analysis.md`
- Selected approach inherited:
  - Bug 3: await-then-update (Option A) — remove optimistic state update; wrap async Firebase write in try/catch; show toast on error
  - Grouping: single plan, 3 tasks by file scope (Bug 1, Bugs 2+3, Bugs 4+5)
  - Bug 1 test: add TCs to existing `ActionDropdown.test.tsx` (confirmed tests ActionButtons directly without mocking it)
- Key reasoning used:
  - Option A for Bug 3 matches `SafeManagement.tsx` pattern; LAN latency is acceptable; rollback complexity not warranted.
  - Single plan is more efficient than 3 mini-plans for 5 bounded fixes.

## Selected Approach Summary
- What was chosen:
  - Three IMPLEMENT tasks aligned to three file scopes; all fully parallel.
  - Bug 3: `async (count: number) => { await recordKeycardTransfer; updateSafeKeycards; }` pattern with try/catch toast.
  - Bug 1 regression TCs added to `ActionDropdown.test.tsx` (not a new file — that file already tests `ActionButtons` directly).
- Why planning is not reopening option selection:
  - Analysis fully resolved both decision points (Bug 3 UX and grouping strategy).
  - No operator-only questions remain.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-till-reconciliation-bugs/fact-find.md`
- Evidence carried forward:
  - Bug 1: `ActionButtonsProps` (lines 14–30) confirmed missing `setIsEditMode`/`setIsDeleteMode`; both setters confirmed in `useTillReconciliationUI` return (lines 57–62); `props` spread in `TillReconciliation.tsx` line 34 already includes them.
  - Bug 2: `confirmFloat` success path confirmed missing `ui.setCashForm("none")`; `confirmExchange` (line 158) is the reference pattern.
  - Bug 3: optimistic update before `await` confirmed; `CountInputModal` `await`s `onConfirm` → `async` keyword preserves type compatibility.
  - Bug 4: `diff` computed at line 618; `addCashCount("reconcile", 0, 0, ...)` at line 622 — third arg hardcoded 0.
  - Bug 5: `confirmShiftClose` two early-return branches (lines 446–451, 455–461) confirmed missing `setPendingOverride(false)`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes
- Critique: 1 round, verdict credible (4.5/5.0)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bug 1 — Add Edit/Void mode buttons to ActionButtons and wire props | 85% | M | Pending | - | - |
| TASK-02 | IMPLEMENT | Bugs 2+3 — Fix float modal close and keycard async ordering | 85% | M | Pending | - | - |
| TASK-03 | IMPLEMENT | Bugs 4+5 — Fix keycard diff arg and pendingOverride leak | 90% | S | Pending | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Bug 1 adds Edit/Void menu items to Cash dropdown using existing DS `ActionDropdown` pattern | TASK-01 | Verify menu item labels match existing ActionDropdown options pattern |
| UX / states | Bug 2 closes float modal on success; Bug 3 keycard state updates after ~100ms Firebase write (acceptable on LAN); Bug 5 override state always clean on retry | TASK-02, TASK-03 | |
| Security / privacy | N/A — no auth/authz or data exposure change in any fix | - | Pure state-machine and error-handling corrections |
| Logging / observability / audit | Bug 3 Firebase error surfaced as toast (was silent); Bug 4 `difference` field corrected in audit record | TASK-02, TASK-03 | |
| Testing / validation | 5 regression TCs across 3 files; TASK-01 adds to `ActionDropdown.test.tsx`; TASK-02 creates `useTillReconciliationLogic.test.ts`; TASK-03 adds to `useTillShifts.test.ts` | TASK-01, TASK-02, TASK-03 | |
| Data / contracts | Bug 4 fix writes correct `difference` arg to `addCashCount`; no downstream consumers of this field exist (grep verified) | TASK-03 | |
| Performance / reliability | Bug 3 async reorder adds ~100ms perceived lag for keycard operations on LAN; Firebase error is now contained as toast | TASK-02 | LAN latency acceptable per analysis |
| Rollout / rollback | N/A — no schema migration, feature flag, or deployment step; rollback = revert commit | - | |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three tasks touch distinct files; fully parallel |

## Delivered Processes

None: no material process topology change — five pure React hook/component fixes. No CI/deploy/release lane, approval path, workflow lifecycle state, or operator runbook is affected.

## Tasks

---

### TASK-01: Bug 1 — Add Edit/Void mode buttons to ActionButtons and wire props
- **Type:** IMPLEMENT
- **Deliverable:** Code change — `ActionButtons.tsx` (interface + menu items), `TillReconciliation.tsx` (prop forwarding), `ActionDropdown.test.tsx` (2 new TCs)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/reception/src/components/till/ActionButtons.tsx`, `apps/reception/src/components/till/TillReconciliation.tsx`, `apps/reception/src/components/till/__tests__/ActionDropdown.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — all three file locations confirmed with line-level evidence; prop wiring is a minimal change (props spread already includes setIsEditMode/setIsDeleteMode); DS ActionDropdown pattern confirmed in existing menu items; test file mock setup already proven (ActionDropdown.test.tsx renders ActionButtons without DS mocking issues)
  - Approach: 90% — single correct approach; no alternative; DS ActionDropdown is the established pattern for all existing menu items
  - Impact: 85% — edit/delete modes were completely unreachable; after fix they are reachable via Cash dropdown items; TC directly validates the setter calls
- **Acceptance:**
  - [ ] `ActionButtonsProps` interface includes `setIsEditMode: (val: boolean) => void` and `setIsDeleteMode: (val: boolean) => void`
  - [ ] "Edit Transactions" and "Void Transactions" appear as menu items in the Cash ActionDropdown
  - [ ] Both items are disabled when `shiftOpenTime === null`
  - [ ] Clicking "Edit Transactions" calls `setIsEditMode(true)`; clicking "Void Transactions" calls `setIsDeleteMode(true)`
  - [ ] `TillReconciliation.tsx` passes `setIsEditMode={props.setIsEditMode}` and `setIsDeleteMode={props.setIsDeleteMode}` to `<ActionButtons />`
  - [ ] TC-01 and TC-02 pass in CI
  - **Expected user-observable behavior:**
    - [ ] Staff opens Cash dropdown → sees "Edit Transactions" and "Void Transactions" items
    - [ ] Clicking "Edit Transactions" activates edit mode (info banner appears: "Click a row to edit the transaction")
    - [ ] Clicking "Void Transactions" activates delete mode (warning banner appears: "Click a row to void the transaction")
    - [ ] Both items are disabled (aria-disabled) when no shift is open
- **Engineering Coverage:**
  - UI / visual: Required — two new menu items added to Cash ActionDropdown using existing DS pattern; verify label text and disabled state visually consistent with existing items
  - UX / states: Required — items disabled when `shiftOpenTime === null`; enabled when shift is open; activation triggers corresponding banner in TillReconciliation
  - Security / privacy: N/A — no auth/authz change; edit/delete modes are already guarded by `canManageCash` conditional wrapping the Cash dropdown
  - Logging / observability / audit: N/A — no new logging; mode activation is already visually indicated by existing banners in TillReconciliation
  - Testing / validation: Required — TC-01 (Edit button calls setIsEditMode(true)), TC-02 (Void button calls setIsDeleteMode(true))
  - Data / contracts: Required — `ActionButtonsProps` interface extended; consumer (`TillReconciliation.tsx`) updated in same task
  - Performance / reliability: N/A — UI-only prop additions; no hot path impact
  - Rollout / rollback: N/A — pure UI prop change; rollback = revert commit
- **Validation contract:**
  - TC-01: Click Cash dropdown, click "Edit Transactions" → `setIsEditMode` mock called with `true`
  - TC-02: Click Cash dropdown, click "Void Transactions" → `setIsDeleteMode` mock called with `true`
- **Execution plan:**
  - **Red**: Extend `ActionButtonsProps` in `ActionButtons.tsx` to add `setIsEditMode` and `setIsDeleteMode` as required props. **Also update `renderButtons()` helper in `ActionDropdown.test.tsx` to pass `setIsEditMode={jest.fn()}` and `setIsDeleteMode={jest.fn()}`** — required in the same step to prevent TypeScript compilation failure in existing tests. Add TCs to `ActionDropdown.test.tsx` referencing the new buttons — TCs fail (buttons don't exist yet). Pass new props through in `TillReconciliation.tsx`.
  - **Green**: Add "Edit Transactions" and "Void Transactions" to the Cash `ActionDropdown` options, calling `setIsEditMode(true)` and `setIsDeleteMode(true)` respectively. Both disabled when `!shiftOpenTime`. TCs now pass.
  - **Refactor**: Verify disabled logic is consistent with existing Cash items (`disabled: !shiftOpenTime`). Confirm menu item labels are grammatically consistent with existing items ("Edit Transactions", "Void Transactions").
- **Planning validation (required for M/L):**
  - Checks run: Read `ActionButtons.tsx` lines 1–193; read `TillReconciliation.tsx` lines 1–165; read `ActionDropdown.test.tsx` lines 1–114; grep for `setIsEditMode`/`setIsDeleteMode` callers across reception app (zero callers found); grep `canManageCash` gating in `ActionButtons.tsx` (confirmed: Cash dropdown is wrapped in `{canManageCash && ...}` — edit/delete items will also be gated correctly without extra work)
  - Validation artifacts: `ActionButtons.tsx:14–30` (interface), `TillReconciliation.tsx:34` (props spread), `TillReconciliation.tsx:58–74` (ActionButtons props), `useTillReconciliationUI.ts:57–62` (setIsEditMode/setIsDeleteMode returned)
  - Unexpected findings: `ActionDropdown.test.tsx` tests `ActionButtons` directly (not `ActionDropdown` — the file is misnamed). No new test file needed; add TCs to existing file. The `renderButtons()` helper (line 15–46) will need `setIsEditMode` and `setIsDeleteMode` props added.
- **Consumer tracing:**
  - New props: `setIsEditMode`, `setIsDeleteMode` added to `ActionButtonsProps`
  - Consumer 1 (`TillReconciliation.tsx`): will be updated in this task to pass `setIsEditMode={props.setIsEditMode}` and `setIsDeleteMode={props.setIsDeleteMode}`. The props spread `const props = { ...logic, ...ui }` (line 34) already includes them from `useTillReconciliationUI`. No other consumers of `ActionButtonsProps` exist.
  - No dead-end field risk: both props are immediately consumed as onClick callbacks.
- **Scouts:** `TillReconciliation.test.tsx` fully mocks `ActionButtons` — changes here do not affect existing TillReconciliation tests. Confirmed: `jest.mock("../ActionButtons", ...)` at line ~15 of that test file.
- **Edge Cases & Hardening:**
  - Disabled state: both new menu items must be `disabled: !shiftOpenTime` to match existing Cash items
  - No shift open: buttons are aria-disabled; no callback fires
  - The `canManageCash` guard wrapping the Cash dropdown already ensures these items are hidden for unauthorized users
- **What would make this >=90%:**
  - Running TCs in CI to confirm DS ActionDropdown's `aria-disabled` attribute behavior matches expected test assertion (existing tests at line 110–113 use `toHaveAttribute("aria-disabled", "true")`)
- **Rollout / rollback:**
  - Rollout: deploy via normal PR → CI → merge
  - Rollback: revert commit
- **Documentation impact:** None: internal component prop addition
- **Notes / references:**
  - `useTillReconciliationUI.ts` lines 57–62 confirm `setIsEditMode` and `setIsDeleteMode` are exported
  - `TillReconciliation.tsx` line 34: `const props = { ...logic, ...ui }` already spreads `setIsEditMode` and `setIsDeleteMode` into `props`
  - `TillReconciliation.tsx` lines 93–108: edit/delete mode banners already rendered when `props.isEditMode`/`props.isDeleteMode` are true

---

### TASK-02: Bugs 2+3 — Fix float modal close and keycard async ordering
- **Type:** IMPLEMENT
- **Deliverable:** Code change — `useTillReconciliationLogic.ts` (Bug 2: `confirmFloat` success path; Bug 3: `confirmAddKeycard`/`confirmReturnKeycard` async reorder), new `useTillReconciliationLogic.test.ts` (3 TCs)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/reception/src/hooks/useTillReconciliationLogic.ts`, `apps/reception/src/hooks/__tests__/useTillReconciliationLogic.test.ts` (new file)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Bug 2 fix is a single line insert at confirmed location; Bug 3 fix is async rewrite at confirmed locations; type compatibility confirmed (async returns `Promise<void>`, satisfying `CountInputModal` which `await`s `onConfirm`); no test file exists for this hook, requires new file following `useTillShifts.test.ts` pattern
  - Approach: 85% — Bug 2 single insert confirmed correct (pattern from `confirmExchange` at line 158); Bug 3 await-then-update confirmed correct (matches `SafeManagement.tsx` pattern)
  - Impact: 85% — float modal closed on success (Bug 2); keycard Firebase errors now surfaced as toasts (Bug 3); state no longer diverges from Firebase on error (Bug 3)
- **Acceptance:**
  - [ ] `confirmFloat` calls `ui.setCashForm("none")` on success (after `runTransaction` resolves without throwing)
  - [ ] `confirmAddKeycard` is `async`; awaits `recordKeycardTransfer` before calling `updateSafeKeycards`/`setShowAddKeycardModal`
  - [ ] `confirmReturnKeycard` is `async`; awaits `recordKeycardTransfer` before calling `updateSafeKeycards`/`setShowReturnKeycardModal`
  - [ ] Both keycard functions show `showToast("...", "error")` on Firebase rejection and do NOT update state
  - [ ] TC-03, TC-04, TC-05 pass in CI
  - **Expected user-observable behavior:**
    - [ ] After a successful float entry, the float form closes automatically
    - [ ] If a keycard Firebase write fails, staff see a toast error; the keycard count in the UI is not changed
    - [ ] If a keycard Firebase write succeeds, the count updates (after the ~100ms write round-trip)
- **Engineering Coverage:**
  - UI / visual: N/A — hook-only changes; no JSX modified
  - UX / states: Required — float modal closes on success (Bug 2); keycard count updated only after Firebase confirm (Bug 3); toast shown on keycard error; modal closed only after Firebase confirm
  - Security / privacy: N/A — no auth/authz change
  - Logging / observability / audit: Required — Bug 3 Firebase errors now surfaced as `showToast("...", "error")` instead of silently swallowed
  - Testing / validation: Required — new `useTillReconciliationLogic.test.ts` with TC-03 (float modal close), TC-04 (keycard error → toast, no state update), TC-05 (keycard success → state updated)
  - Data / contracts: Required — `confirmAddKeycard`/`confirmReturnKeycard` change from plain function returning `Promise<void>` (via return statement) to `async` function returning `Promise<void>` (via `async` keyword). Return type is identical; consumers unaffected. No interface changes needed.
  - Performance / reliability: Required — Bug 3 adds ~100ms UI lag for keycard add/return operations (Firebase round-trip before state update). Acceptable on LAN per analysis. Firebase error is now contained; no silent failure.
  - Rollout / rollback: N/A — no schema migration; rollback = revert commit
- **Validation contract:**
  - TC-03: `confirmFloat` called with valid amount; `runTransaction` mock resolves → `ui.setCashForm("none")` called with `"none"`
  - TC-04: `confirmAddKeycard` called; `useKeycardTransfer` mock rejects → `showToast` called with error message; `updateSafeKeycards` NOT called
  - TC-05: `confirmAddKeycard` called; `useKeycardTransfer` mock resolves → `updateSafeKeycards` called AND `setShowAddKeycardModal(false)` called
- **Execution plan:**
  - **Red**: Create `useTillReconciliationLogic.test.ts` with TC-03 (expects `setCashForm("none")` — fails because `confirmFloat` doesn't call it yet), TC-04 (expects toast on rejection — fails because no try/catch), TC-05 (expects state update after resolve — fails because state updates before await).
  - **Green**:
    - Bug 2: In `confirmFloat`, after the `try { await runTransaction(...) }` block succeeds (no catch triggered), add `ui.setCashForm("none")`. Pattern from `confirmExchange` line 158.
    - Bug 3: Rewrite `confirmAddKeycard` as `async (count: number) => { if (count > safeKeycards) { showToast(...); return; } try { await recordKeycardTransfer(count, "fromSafe"); tillLogic.addKeycardsFromSafe(count); updateSafeKeycards(safeKeycards - count); setShowAddKeycardModal(false); } catch { showToast("Failed to add keycards.", "error"); } }`. Same pattern for `confirmReturnKeycard`.
    - Remove `return` statements from both functions (was returning the Promise; now void-returning async function).
    - All three TCs pass.
  - **Refactor**: Verify `useCallback` dependency arrays updated for the rewritten functions (no new deps introduced for Bug 2; Bug 3 deps unchanged). Confirm error message strings are consistent with other toast messages in the file.
- **Planning validation (required for M/L):**
  - Checks run: Read `useTillReconciliationLogic.ts` lines 74–124 (confirmAddKeycard, confirmReturnKeycard, confirmFloat); grep for all consumers of `confirmAddKeycard`/`confirmReturnKeycard`; read `CountInputModal.tsx` line 35 (`await onConfirm(...)` — confirms `async` return type compatible); read `AddKeycardsModal.tsx` (onConfirm typed as `Promise<void>` — compatible); check return type on `confirmExchange` as reference pattern for `setCashForm("none")` (line 158)
  - Validation artifacts: `useTillReconciliationLogic.ts:74–103`, `CountInputModal.tsx:35`, `AddKeycardsModal.tsx:6` (onConfirm type), `ReturnKeycardsModal.tsx:4` (onConfirm type)
  - Unexpected findings: `CountInputModal` `await`s the `onConfirm` callback — making the functions `async` preserves `Promise<void>` return type (identical to before). Previously the functions returned `Promise.resolve()` or the `recordKeycardTransfer` promise explicitly; with `async` the return is implicit. Analysis risk "return type changes to void" is a non-issue.
- **Consumer tracing:**
  - `confirmAddKeycard`: consumers are `AddKeycardsModal.tsx` (via `TillReconciliation.tsx` line 142) and test mocks. Prop type `(count: number) => Promise<void>` is unchanged — `async` function satisfies this. No consumer update needed.
  - `confirmReturnKeycard`: same analysis. Prop type unchanged. No consumer update needed.
  - `confirmFloat`: consumers are `FloatAndTenderForms.tsx` via `FormsContainer` via `TillReconciliation.tsx` `props` spread. The added `setCashForm("none")` call is a side effect; no return type change. No consumer update needed.
- **Scouts:** No existing test file for `useTillReconciliationLogic.ts`. New test file must mock `useTillShiftLogic`, `useKeycardTransfer`, `useSafeKeycardData`, and `runTransaction`. Follow pattern from `useTillShifts.test.ts`.
- **Edge Cases & Hardening:**
  - Bug 2: `setCashForm("none")` only called in the success path (after try block, not in catch). The catch path shows an error toast and leaves modal open — intentional behavior.
  - Bug 3: If `count > safeKeycards` (early return), no Firebase call and no state update — correct behavior unchanged.
  - Bug 3: On Firebase rejection, state is NOT updated (correct). On Firebase resolution, state is updated — consistent with the "await-then-update" approach.
  - Bug 3: `setShowAddKeycardModal(false)` called only on success — correct; prevents modal flicker.
- **What would make this >=90%:**
  - Existing test infrastructure for the mocks (`runTransaction`, `useKeycardTransfer`) confirmed available without additional setup
- **Rollout / rollback:**
  - Rollout: deploy via normal PR → CI → merge
  - Rollback: revert commit
- **Documentation impact:** None: internal hook fix
- **Notes / references:**
  - `confirmExchange` (line 158) is the reference pattern for `ui.setCashForm("none")` on success
  - `SafeManagement.tsx` line ~304 is the reference pattern for await-then-update with `recordKeycardTransfer`

---

### TASK-03: Bugs 4+5 — Fix keycard diff arg and pendingOverride leak
- **Type:** IMPLEMENT
- **Deliverable:** Code change — `useTillShifts.ts` (Bug 4: `diff` arg at line 622; Bug 5: `setPendingOverride(false)` at lines 446–461), `useTillShifts.test.ts` (2 new TCs)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/reception/src/hooks/client/till/useTillShifts.ts`, `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — both fix locations are exact single-line changes at confirmed line numbers; `diff` variable confirmed at line 618; `setPendingOverride` confirmed used in success path at lines 446–451 and 455–461; existing `useTillShifts.test.ts` provides full mock setup
  - Approach: 90% — no alternatives; both are single correct insertions; no downstream consumers of `difference` field (grep confirmed); `setPendingOverride(false)` matches success-path usage
  - Impact: 90% — keycard reconcile audit record now carries correct difference value; shift-close override state is always clean on retry
  - Held-back test (90): "What single unresolved unknown would push this below 90?" — None identified. Both line numbers confirmed. No downstream consumers of `difference` found. `setPendingOverride` type is `(val: boolean) => void` (standard React setter).
- **Acceptance:**
  - [ ] `addCashCount("reconcile", 0, diff, ...)` at line 622 — `diff` (= `counted - expectedKeycardsAtClose`) passed as third argument
  - [ ] `confirmShiftClose` resets `setPendingOverride(false)` before returning early in both early-return branches (lines 446–451 and 455–461)
  - [ ] TC-06 and TC-07 pass in CI
  - **Expected user-observable behavior:**
    - [ ] Keycard reconcile audit record shows the correct counted-vs-expected difference (observable in EOD report)
    - [ ] After a failed shift close attempt, the override state is cleared; subsequent close attempt does not inherit the previous failed override
- **Engineering Coverage:**
  - UI / visual: N/A — hook-only changes; no JSX modified
  - UX / states: Required — Bug 5: override state reset on early return means retry shows correct state; no stale override persistence
  - Security / privacy: N/A — no auth/authz change
  - Logging / observability / audit: Required — Bug 4: `difference` field in keycard reconcile audit record corrected from always-0 to actual `diff` value
  - Testing / validation: Required — TC-06 (reconcile writes correct diff), TC-07 (early-return resets pendingOverride)
  - Data / contracts: Required — Bug 4: `addCashCount` signature `(type, count, difference, amount, denomBreakdown, keycardCount)` — third arg changes from hardcoded `0` to `diff`. No schema migration; no downstream consumers.
  - Performance / reliability: N/A — single-line changes in non-hot-path code
  - Rollout / rollback: N/A — no migration; rollback = revert commit
- **Validation contract:**
  - TC-06: Mock `addCashCount`; call `confirmKeycardReconcile` with `counted=5` when `expectedKeycardsAtClose=3`; assert `addCashCount` called with third arg `2` (= 5 - 3)
  - TC-07: Call `confirmShiftClose` with no open shift → early return path → assert `setPendingOverride` called with `false`
- **Execution plan:**
  - **Red**: Add TC-06 and TC-07 to `useTillShifts.test.ts`. TC-06 fails (third arg is 0 not diff). TC-07 fails (setPendingOverride not called in early return).
  - **Green**:
    - Bug 4: In `useTillShifts.ts` line 622, change `addCashCount("reconcile", 0, 0, undefined, undefined, counted)` to `addCashCount("reconcile", 0, diff, undefined, undefined, counted)`.
    - Bug 5: Before each early-return in `confirmShiftClose`, add `setPendingOverride(false)`. Two locations: no-open-shift branch (~line 446) and wrong-user-without-override branch (~line 455).
    - Both TCs pass.
  - **Refactor**: Verify `diff` is in scope at line 622 (computed at line 618 — same block). Confirm `setPendingOverride` setter is in scope in `confirmShiftClose` closure.
- **Planning validation (required for M/L):**
  - Not required for S effort.
- **Consumer tracing:** N/A — S effort task.
- **Scouts:** `useTillShifts.test.ts` already mocks `useCashCountsMutations` (provides `addCashCount`), `TillDataContext`, and `AuthContext`. TC-06 and TC-07 slot naturally into existing test infrastructure.
- **Edge Cases & Hardening:**
  - Bug 4: `diff` may be negative (if counted < expected) — this is correct and should be stored in the audit record as-is.
  - Bug 5: Only the two early-return branches need `setPendingOverride(false)`; the success path already resets it.
- **What would make this >=90%:** Already at 90%. CI run is confirmation.
- **Rollout / rollback:**
  - Rollout: deploy via normal PR → CI → merge
  - Rollback: revert commit
- **Documentation impact:** None: internal hook fix
- **Notes / references:**
  - `useTillShifts.ts` line 618: `const diff = counted - expectedKeycardsAtClose`
  - `useTillShifts.ts` line 622: `addCashCount("reconcile", 0, 0, undefined, undefined, counted)` — fix to `diff`
  - `useTillShifts.ts` lines 446–451 and 455–461: the two early-return branches in `confirmShiftClose`

---

## Risks & Mitigations
- **Bug 1 ActionDropdown.test.tsx renderButtons helper**: helper needs `setIsEditMode` and `setIsDeleteMode` props added to remain TypeScript-valid after ActionButtonsProps is extended. Required: update `renderButtons()` in `ActionDropdown.test.tsx` to pass `setIsEditMode={jest.fn()}` and `setIsDeleteMode={jest.fn()}` (otherwise existing tests break due to missing required props). Mitigation: add as part of TASK-01.
- **Bug 3 type compatibility**: analysis risk of "return type changes to void" is resolved — `async` keyword preserves `Promise<void>` return type; `CountInputModal` `await`s `onConfirm` successfully. No action required.
- **Bug 4 semantic reuse of `difference` field**: confirmed no downstream consumers (grep of `useEndOfDayReportData.ts` verified). Carry as FYI only.

## Observability
- Logging: None: no new logging introduced
- Metrics: None: no new metrics
- Alerts/Dashboards: None: no dashboard changes; Bug 3 Firebase errors now visible as toasts to staff

## Acceptance Criteria (overall)
- [ ] All 5 bugs fixed in their respective source files
- [ ] 7 regression TCs pass in CI (TC-01 through TC-07 — TC-01, TC-02 in TASK-01; TC-03 through TC-05 in TASK-02; TC-06, TC-07 in TASK-03)
- [ ] No TypeScript errors in changed packages
- [ ] No lint errors in changed packages
- [ ] `TillReconciliation.test.tsx` existing tests remain passing (ActionButtons mock is unchanged)

## Decision Log
- 2026-03-13: Bug 3 → Option A (await-then-update, remove optimistic). `async` keyword preserves `Promise<void>` return type — CountInputModal compatibility confirmed.
- 2026-03-13: Grouping → single plan, 3 tasks by file scope. All tasks parallel.
- 2026-03-13: Bug 1 test → add TCs to existing `ActionDropdown.test.tsx` (not a new file). Discovery: that file tests ActionButtons directly without DS mocking issues.
- 2026-03-13: TASK-01 must also update `renderButtons()` helper to pass `setIsEditMode`/`setIsDeleteMode` — required to prevent breaking existing ActionDropdown tests once the prop is required.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Bug 1 — Add Edit/Void mode buttons | Yes | [Minor] `renderButtons()` helper in `ActionDropdown.test.tsx` must be updated to pass new required props to avoid breaking existing tests | No — absorbed into TASK-01 execution plan |
| TASK-02: Bugs 2+3 — Float modal close + keycard async | Yes | None | No |
| TASK-03: Bugs 4+5 — Keycard diff arg + pendingOverride | Yes | None | No |

## Overall-confidence Calculation
- TASK-01: M=2, 85%
- TASK-02: M=2, 85%
- TASK-03: S=1, 90%
- Overall = (2×85 + 2×85 + 1×90) / (2+2+1) = (170 + 170 + 90) / 5 = 430 / 5 = 86% → 85% (downward bias, nearest 5)
