---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-form-ux
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Product Form UX Plan

## Summary

Three form-level UX bugs in the xa-uploader product console create false or missing feedback for operators: (1) the autosave status indicator shows "saved" on every fresh product load before any data has been persisted; (2) the save button silently advances to the images step with no visible announcement beyond the button label change; (3) the delete button sits at the top of the form panel isolated from the save action area, creating friction and inconsistency with established form patterns. This plan delivers three focused fixes: correct autosave initialisation, an advance notification via the existing ActionFeedback channel, and delete button relocation to the action footer. All changes are UI-only with no API or schema impact.

## Active tasks
- [x] TASK-01: Fix autosave status initialisation — truthful "unsaved" state on fresh/new product load
- [x] TASK-02: Add visible feedback for save-and-advance step transition
- [x] TASK-03: Relocate delete button to action footer

## Goals
- Operators see a truthful autosave indicator on fresh/new product load (not a false "saved").
- Operators receive a visible inline message when the save-and-advance transition fires.
- The delete button is in the action footer and is clearly distinguished from the save action.

## Non-goals
- Redesigning the console layout or adding new panel structures.
- Changes to the autosave queue, conflict retry, or revision handling logic.
- Changes to sync, submission, or vendor-mode behaviour.
- Adding a toast library — the existing ActionFeedback channel is used throughout.

## Constraints & Assumptions
- Constraints:
  - All button classes must use constants from `apps/xa-uploader/src/components/catalog/catalogStyles.ts` (`BTN_DANGER_CLASS`, `BTN_PRIMARY_CLASS`, etc.).
  - i18n messages are defined inline in `apps/xa-uploader/src/lib/uploaderI18n.ts` — both `en` and `zh` sections must be updated for any new key.
  - Tests run in CI only — never locally. New tests follow the existing Jest + `@testing-library/react` pattern with `data-cy` test IDs (not `data-testid`).
  - Writer lock required for all commits; pre-commit hooks must not be skipped.
  - The app uses OpenNext Cloudflare Workers build — no new server-side dependencies.
- Assumptions:
  - `CatalogProductImagesFields` defines its own local `type AutosaveStatus = "saving" | "saved" | "unsaved"` at line 21 — confirmed by reading the file. No type changes needed there.
  - The `"unsaved"` value is already in the `AutosaveStatus` union so the initial/reset state change requires no new union member.
  - Delete button placement in the action footer (left-aligned, with existing `window.confirm` guard preserved) is the chosen approach. This is the lower-complexity option consistent with the fact-find default assumption.

## Inherited Outcome Contract

- **Why:** xa-uploader UI review revealed three form-level UX issues that create operator confusion: autosave shows 'saved' on fresh product load before any data is persisted, the save button silently advances to the images step with no feedback, and the delete button sits isolated at the top with no confirmation guard.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators see a truthful autosave state on fresh/new product load, receive visible feedback when save-and-advance fires, and must confirm before delete executes via a properly placed action-footer control.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-form-ux/fact-find.md`
- Key findings used:
  - `autosaveStatus` is derived from `isAutosaveDirty` and `isAutosaveSaving`, both of which start as `false`, producing a false `"saved"` on initial render and after every `resetAutosaveState()` call.
  - `resetAutosaveState()` is the canonical reset called on new/select/storefront change — fixing it here propagates correctly to all navigation events.
  - The `ActionFeedback` channel (wired into `CatalogProductForm` via the `feedback` prop) is the correct injection point for the advance notification.
  - `CatalogProductImagesFields` has its own local `AutosaveStatus` type — no downstream type changes needed.
  - Delete button renders only when `selectedSlug` is truthy — this guard must be preserved on relocation.
  - i18n is in a single `uploaderI18n.ts` file with `en` and `zh` sections — new keys must be added to both.

## Proposed Approach

- **TASK-01 — Autosave init fix:** Change `isAutosaveDirty` initial value from `false` to `true` in `useCatalogConsoleState`, so the derived `autosaveStatus` correctly shows `"unsaved"` on first render. Also update `resetAutosaveState()` to reset `isAutosaveDirty` to `true` (not `false`) so that every time a user navigates to a new product or selects an existing product, the indicator starts at `"unsaved"`. For existing products, this is slightly conservative (the server state is saved) but accurately reflects that the local session has not yet persisted anything — consistent with the intent of the indicator. Immediately upon any successful save (manual or autosave), `isAutosaveDirty` is set to `false` by `applyAutosaveQueueSaveSuccess` and `handleSave`, which will correctly flip status to `"saved"`.
- **TASK-02 — Advance feedback:** Inject a new i18n key `saveAndAdvanceFeedback` ("Saved. Moving to images…") into the `ActionFeedback` channel when the 2-second advance timer fires. The injection point is inside `useSaveButtonTransition` in `CatalogProductForm.client.tsx`. Since `useSaveButtonTransition` does not currently have access to `onFeedback`, this requires passing an `onSavedFeedback` callback prop from `CatalogProductForm` into `useSaveButtonTransition`. The callback calls `updateActionFeedback` on the `draft` domain. The existing generic "Saved product details." success message (from `handleSaveImpl`) remains, and the advance message replaces it at timer fire time.
- **TASK-03 — Delete relocation:** Move the delete `<button>` from the isolated top-of-panel `<div>` to the save action footer `<div className="flex justify-end">` on the product step. Delete is placed left (using `mr-auto` or a separate flex row with `justify-between`), save stays right. The `selectedSlug` guard is preserved — delete only renders in edit mode. The `cancelPendingSaveAdvance` call in `handleDeleteClick` is preserved. `window.confirm` guard in `handleDeleteImpl` is preserved.

- **Chosen approach:** As described above — three independent, lowest-complexity fixes using existing patterns.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix autosave status initialisation | 85% | S | Complete (2026-03-06) | - | - |
| TASK-02 | IMPLEMENT | Add save-and-advance feedback | 85% | S | Complete (2026-03-06) | - | - |
| TASK-03 | IMPLEMENT | Relocate delete button to action footer | 85% | S | Complete (2026-03-06) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three are independent — can execute in parallel or in any order. Same commit is acceptable. |

## Tasks

---

### TASK-01: Fix autosave status initialisation — truthful "unsaved" state on fresh/new product load
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `useCatalogConsole.client.ts` (init and reset) + updated tests in `action-feedback.test.tsx` and `CatalogProductForm.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Root cause fully confirmed at line 131 (`isAutosaveDirty` initial `false`) and line 235 (`resetAutosaveState` resets to `false`). Fix is a one-line change at each site. High confidence.
  - Approach: 85% — Changing reset to `true` means existing products also start as `"unsaved"` until a save fires. This is slightly conservative but accurate for fresh sessions. The risk is that power users who select an existing product and immediately go to images will see a brief "unsaved" flash — acceptable given the alternative is a misleading "saved" that is actively incorrect for new products.
  - Impact: 85% — Fixes the false "saved" signal definitively. Test impact: the `renderForm()` helper in `CatalogProductForm.test.tsx` passes `autosaveStatus="saved"` as a prop (prop drilling, not hook) — this test does not test hook derivation, so passing `autosaveStatus="unsaved"` as the new prop default is the correct update. The hook integration test in `action-feedback.test.tsx` checks `data-cy="autosave-status"` on initial render and may need an assertion update.
- **Acceptance:**
  - `isAutosaveDirty` initial value in `useCatalogConsoleState` is `true`.
  - `resetAutosaveState()` sets `isAutosaveDirty(true)` not `isAutosaveDirty(false)`.
  - On initial render of the console (before any product is selected/created), `autosaveStatus` is `"unsaved"`.
  - On `handleNew`, after reset, `autosaveStatus` is `"unsaved"`.
  - On `handleSelect` (existing product), after reset, `autosaveStatus` is `"unsaved"` until a successful save fires.
  - After a successful manual save (`handleSave` → `result.status === "saved"`), `autosaveStatus` returns to `"saved"` (this path is unchanged — `handleSave` at line 581 sets `setIsAutosaveDirty(false)`).
  - After a successful autosave flush (`applyAutosaveQueueSaveSuccess`), `autosaveStatus` is `"saved"` (unchanged — line 384 sets `setIsAutosaveDirty(Boolean(state.pendingAutosaveDraftRef.current))`).
  - `CatalogProductForm.test.tsx` `renderForm()` passes `autosaveStatus="unsaved"` as the default (or any explicit value that matches expected new state).
  - All existing test assertions that depended on `autosaveStatus="saved"` as initial state are updated to reflect the correct new initial state.
  - **Expected user-observable behavior:**
    - [ ] Open xa-uploader, do not select any product → autosave indicator shows "Unsaved image changes. Use Save as draft to persist now."
    - [ ] Click "New Product" → autosave indicator shows "Unsaved image changes. Use Save as draft to persist now."
    - [ ] Select an existing product → autosave indicator shows "Unsaved image changes." until a save fires.
    - [ ] Save successfully → autosave indicator changes to "All image changes saved."
- **Validation contract (TC-XX):**
  - TC-01: Fresh render (no product selected) → `autosaveStatus` === `"unsaved"` — autosave copy shows the unsaved message.
  - TC-02: After `handleNew()` → `autosaveStatus` === `"unsaved"`.
  - TC-03: After `handleSelect(product)` → `autosaveStatus` === `"unsaved"` initially, then `"saved"` after successful save.
  - TC-04: After `handleSave()` succeeds → `autosaveStatus` === `"saved"`.
  - TC-05: During autosave queue flush (`isAutosaveSaving === true`) → `autosaveStatus` === `"saving"`.
- **Execution plan:**
  - Red: Write/update test in `action-feedback.test.tsx` asserting initial `autosave-status` is `"unsaved"` (currently this is not asserted; the harness can read `data-cy="autosave-status"` before any button click).
  - Green: Change `isAutosaveDirty` initial value from `false` to `true` at `useCatalogConsole.client.ts:131`. Change `resetAutosaveState` at line 235 to call `setIsAutosaveDirty(true)` instead of `setIsAutosaveDirty(false)`. Update `renderForm()` in `CatalogProductForm.test.tsx` to pass `autosaveStatus="unsaved"` as default.
  - Refactor: Verify no other consumers depend on `isAutosaveDirty` initial `false` in a way that breaks. Grep for `isAutosaveDirty` usages — all are inside the same hook or passed down as derived `autosaveStatus`.
- **Planning validation (required for M/L):** None: S effort task — full evidence from source reading.
- **Consumer tracing:** None: S effort task — all consumers identified in fact-find (CatalogProductForm via autosaveStatus prop, CatalogProductImagesFields via same prop). Both use the derived value; neither depends on `isAutosaveDirty` directly.
- **Scouts:** Verify `handleSave` at line 581 still resets `isAutosaveDirty` to `false` after success — confirmed: `state.setIsAutosaveDirty(false)` is called explicitly.
- **Edge Cases & Hardening:**
  - Autosave fires immediately after select (e.g., image upload in rapid succession): `isAutosaveSaving` becomes `true`, then `applyAutosaveQueueSaveSuccess` sets `setIsAutosaveDirty(Boolean(state.pendingAutosaveDraftRef.current))` — if no further pending draft, this correctly transitions to `"saved"`. No change needed.
  - `resetAutosaveState` is also called on logout — correctly resetting to `"unsaved"` on logout is safe (there is no product loaded post-logout).
- **What would make this >=90%:**
  - A CI run confirming no regressions in `action-feedback.test.tsx` autosave-status assertions (e.g., TC-02 in that file checks `autosave-dirty: yes` after `autosave-a` — unrelated to initial state, so likely passes).
- **Rollout / rollback:**
  - Rollout: Part of the combined commit for the three fixes.
  - Rollback: `git revert` of the commit.
- **Documentation impact:** None: internal operator console.
- **Notes / references:**
  - `useCatalogConsole.client.ts:131` — `isAutosaveDirty` initial state.
  - `useCatalogConsole.client.ts:231-237` — `resetAutosaveState` callback.
  - `useCatalogConsole.client.ts:239-243` — `autosaveStatus` derivation.
  - `useCatalogConsole.client.ts:581-610` — `handleSave` success path (sets `isAutosaveDirty(false)`).
  - `useCatalogConsole.client.ts:378-386` — `applyAutosaveQueueSaveSuccess` (sets `isAutosaveDirty` conditionally).

---

### TASK-02: Add visible feedback for save-and-advance step transition
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `CatalogProductForm.client.tsx` (new `onSavedFeedback` prop on `useSaveButtonTransition`) + new i18n key in `uploaderI18n.ts` (both `en` and `zh`) + RTL test update in `CatalogProductForm.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — The injection point (`useSaveButtonTransition` at `CatalogProductForm.client.tsx:101`) and the `ActionFeedback` pipeline are fully understood. Adding an `onSavedFeedback` callback to the hook params is straightforward.
  - Approach: 85% — The chosen approach (callback from `CatalogProductForm` into `useSaveButtonTransition`) keeps state management clean. The feedback is emitted at timer fire time (after 2s), which is the correct moment — the operator is about to see the step change. Slightly conservative score because the feedback area is not dedicated to this message; it may be overwritten by a subsequent action. Acceptable for an internal tool.
  - Impact: 85% — Fixes the silent-advance problem definitively. The message will be visible in the `data-testid="catalog-draft-feedback"` element for the duration before the user takes their next action.
- **Acceptance:**
  - A new i18n key `saveAndAdvanceFeedback` is present in both `en` and `zh` sections of `uploaderI18n.ts`.
  - `en`: `"Saved. Moving to images…"`
  - `zh`: `"已保存。正在切换到图片步骤…"`
  - `useSaveButtonTransition` accepts a new optional param `onSavedFeedback?: () => void`.
  - When the 2-second advance timer fires and `canOpenImageStep` is true, `onSavedFeedback?.()` is called before `onAdvanceToImages()`.
  - `CatalogProductForm` passes `onSavedFeedback` to `useSaveButtonTransition`; the callback calls `updateActionFeedback` on the `draft` domain with `{ kind: "success", message: t("saveAndAdvanceFeedback") }`.
  - The existing `handleSave` success feedback (`"Saved product details."`) continues to appear immediately on save click success — it is replaced/overwritten by the advance feedback when the timer fires.
  - **Expected user-observable behavior:**
    - [ ] Click "Save as draft" on a valid product → feedback area shows "Saved product details." immediately.
    - [ ] After ~2 seconds → feedback area updates to "Saved. Moving to images…" and the step advances to Images.
    - [ ] If save fails → no advance, no advance feedback, error feedback shown as before.
- **Validation contract (TC-XX):**
  - TC-01: Save succeeds, timer fires, `canOpenImageStep` is true → `onSavedFeedback` called, feedback area shows `saveAndAdvanceFeedback` message.
  - TC-02: Save fails → `onSavedFeedback` not called, timer not started, no advance.
  - TC-03: Save succeeds but `canOpenImageStep` is false (readiness not met) → advance timer fires but `onAdvanceToImages` not called; feedback message still fires (the message is still accurate — "Saved").
  - TC-04: Delete click during 2-second window → `cancelPendingSaveAdvance` fires, `onSavedFeedback` not called (timer cleared).
- **Execution plan:**
  - Red: Add a test case to `CatalogProductForm.test.tsx` asserting that after save and timer advance, the element with `data-testid="catalog-draft-feedback"` contains the new i18n key (or its value, depending on the mock setup).
  - Green: Add `saveAndAdvanceFeedback` key to `en` and `zh` sections of `uploaderI18n.ts`. Add `onSavedFeedback?: () => void` to `useSaveButtonTransition` params. In the setTimeout callback, call `onSavedFeedback?.()` before `onAdvanceToImages()`. In `CatalogProductForm`, define the callback using `React.useCallback` and pass it to `useSaveButtonTransition`. The callback: `() => updateActionFeedback_or_equivalent(...)` — since `CatalogProductForm` doesn't directly access `setActionFeedback`, it will need to receive the callback or have a local way to trigger the feedback. Cleanest approach: `CatalogProductForm` receives a new optional `onSavedFeedback?: () => void` prop, and the caller (`CatalogConsole.client.tsx`) provides a closure that calls `updateActionFeedback`.
  - Refactor: Confirm `onSavedFeedback` prop is typed correctly in `CatalogProductForm` props interface.
- **Planning validation:** None: S effort.
- **Consumer tracing:**
  - New output: `onSavedFeedback` prop on `CatalogProductForm` — consumer is `CatalogConsole.client.tsx` (the caller that renders `CatalogProductForm`). Must be read to confirm the prop is passed. The caller must provide the closure. This is the one file not listed in `Affects` above — add it.
  - **Affects (addendum):** also `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` (readonly — must add `onSavedFeedback` prop pass-through using the `actionFeedback`/`setActionFeedback` from `useCatalogConsole`).
- **Scouts:** Read `CatalogConsole.client.tsx` to confirm where `CatalogProductForm` is rendered and that `setActionFeedback` / `updateActionFeedback` are accessible at that call site.
- **Edge Cases & Hardening:**
  - If user navigates away (selects different product) while 2-second timer is in flight: the `React.useEffect` cleanup in `useSaveButtonTransition` calls `clearSaveAdvanceTimer()` — `onSavedFeedback` will not fire. Correct — no stale feedback.
  - If `onSavedFeedback` is not provided (prop optional): `onSavedFeedback?.()` — no-op. Backward compatible.
- **What would make this >=90%:**
  - Confirmed by reading `CatalogConsole.client.tsx` that `updateActionFeedback` or `setActionFeedback` is accessible at the `CatalogProductForm` call site.
- **Rollout / rollback:**
  - Rollout: Part of the combined commit.
  - Rollback: `git revert`.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogProductForm.client.tsx:101-160` — `useSaveButtonTransition` (params, timer logic).
  - `CatalogProductForm.client.tsx:135-139` — setTimeout callback (injection point for `onSavedFeedback`).
  - `CatalogProductForm.client.tsx:240-251` — feedback render area (existing `data-testid="catalog-draft-feedback"`).
  - `uploaderI18n.ts:41-44` — existing autosave status keys (for placement reference).
  - `uploaderI18n.ts:491` — zh section start.

---

### TASK-03: Relocate delete button to action footer
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `CatalogProductForm.client.tsx` (JSX restructure) + test update in `CatalogProductForm.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Pure JSX restructure. Remove the top-of-panel delete `<div>` (lines 228-239). Add the delete `<button>` into the action footer `<div className="flex justify-end">` (currently lines 317-331), changing the flex container to `justify-between` and placing delete first (left), save second (right).
  - Approach: 85% — Action-footer placement is the established UX pattern (save and delete in the same row, visually differentiated). The `BTN_DANGER_CLASS` already provides clear visual distinction. Slightly conservative due to the unconfirmed operator preference (fact-find open question).
  - Impact: 85% — Fixes the placement issue definitively. The `cancelPendingSaveAdvance` call in `handleDeleteClick` is preserved. The `selectedSlug` guard (delete only shown in edit mode) is preserved. The `window.confirm` guard in `handleDeleteImpl` is preserved.
- **Acceptance:**
  - The top-of-panel `<div className="flex items-center justify-end">` containing the delete button is removed from `CatalogProductForm`.
  - The action footer `<div>` on the product step changes from `className="flex justify-end"` to `className="flex items-center justify-between"`.
  - When `selectedSlug` is truthy and `step === "product"`, the delete button renders left-aligned in the action footer, and the save button renders right-aligned.
  - When `selectedSlug` is null (add flow), only the save button renders in the footer (no delete button).
  - Delete button uses `BTN_DANGER_CLASS` (unchanged).
  - Delete button's `onClick` still calls `handleDeleteClick` (which calls `cancelPendingSaveAdvance` then `onDelete`).
  - Delete button's `disabled` prop is still `{busy}`.
  - `CatalogProductForm.test.tsx` — the existing test "cancels save auto-advance when delete is clicked during saved state" still passes (delete button is still rendered and clickable in edit mode, just in a different position).
  - **Expected user-observable behavior:**
    - [ ] Select an existing product → delete button is visible in the action footer row, left-aligned, styled with red border/text.
    - [ ] Add new product → delete button is not visible.
    - [ ] Click delete → `window.confirm` dialog appears (unchanged). On confirm, product is deleted.
    - [ ] No delete button at the top of the form panel.
- **Validation contract (TC-XX):**
  - TC-01: `selectedSlug !== null`, `step === "product"` → delete button in footer, save button in footer (justify-between layout).
  - TC-02: `selectedSlug === null` → delete button not rendered anywhere.
  - TC-03: `step === "images"` → delete button not rendered (it's scoped to product step footer only).
  - TC-04: Delete clicked during 2-second saved window → advance cancelled, `onDelete` called (existing test coverage, must still pass).
- **Execution plan:**
  - Red: Update existing `CatalogProductForm.test.tsx` test "cancels save auto-advance when delete is clicked" to assert by role `delete` — currently passes using `getByRole("button", { name: "delete" })` which will still work regardless of position.
  - Green: Remove the top-panel delete `<div>` block. Restructure the action footer `<div>` to `justify-between` and include the conditional delete button on the left.
  - Refactor: Confirm no other test queries the delete button by position (e.g., by being the first/last element in a container) — current test queries by role name, so safe.
- **Planning validation:** None: S effort.
- **Consumer tracing:** None: pure JSX restructure. No new props, no new state. `handleDeleteClick` is unchanged.
- **Scouts:** None: fully understood from source reading.
- **Edge Cases & Hardening:**
  - `step === "images"` view: the action footer containing the save button is not rendered in the images step (the `CatalogProductImagesFields` component renders its own controls). Confirm the delete button should only appear in the product step footer — correct, preserving the current edit-only-when-selected guard.
  - Busy state: `disabled={busy}` preserved on both save and delete buttons.
- **What would make this >=90%:**
  - Confirmed by a quick design QA pass that `BTN_DANGER_CLASS` provides sufficient visual separation from `BTN_PRIMARY_CLASS` in the footer row (red border vs accent bg).
- **Rollout / rollback:**
  - Rollout: Part of the combined commit.
  - Rollback: `git revert`.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogProductForm.client.tsx:226-239` — current top-panel delete block (to be removed).
  - `CatalogProductForm.client.tsx:317-331` — current action footer block (to be restructured).
  - `catalogStyles.ts:34-36` — `BTN_DANGER_CLASS`.
  - `catalogStyles.ts:23-24` — `BTN_PRIMARY_CLASS`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `CatalogProductImagesFields` has its own `AutosaveStatus` type that could drift | Low | Low | Confirmed at line 21 — local type uses same union values. TASK-01 does not change the union. |
| Existing tests that hardcode `autosaveStatus="saved"` fail after TASK-01 | Medium | Low | `CatalogProductForm.test.tsx:84` prop drills `autosaveStatus` — update default to `"unsaved"`. Explicit override tests (`autosaveStatus="saved"`) remain valid as prop overrides. |
| `onSavedFeedback` prop not passed in `CatalogConsole.client.tsx` — advance feedback silently never fires | Medium | Low | TASK-02 scouts step requires reading `CatalogConsole.client.tsx` to confirm the prop pass-through before implementing. Prop is optional (`?`) so missing it is a no-op, not a crash. |
| Delete in footer near save causes accidental destructive action | Low | Medium | `BTN_DANGER_CLASS` (red border/text) vs `BTN_PRIMARY_CLASS` (accent bg). `justify-between` layout creates spatial separation. `window.confirm` guard preserved. |

## Observability
- Logging: None: internal operator console.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] Opening xa-uploader (any product state) shows `"unsaved"` autosave status, not `"saved"`.
- [ ] Save-and-advance fires the "Saved. Moving to images…" feedback message in the inline feedback area.
- [ ] Delete button is in the action footer (product step only, edit mode only), not at the top of the panel.
- [ ] All existing xa-uploader test suite tests pass in CI.
- [ ] New tests cover: autosave init state, advance feedback message, delete footer position (TC per task).
- [ ] No new server-side dependencies introduced.
- [ ] All i18n changes include both `en` and `zh` entries.

## Decision Log
- 2026-03-06: Delete placement — chose action-footer relocation (not inline confirmation step). Rationale: lower complexity, consistent with existing `window.confirm` pattern for destructive actions. The fact-find open question defaulted to this option.
- 2026-03-06: Autosave initial state fix — chose `isAutosaveDirty: true` initial value (not a new union member like `"idle"`). Rationale: reuses existing `"unsaved"` value, no downstream type changes needed in `CatalogProductImagesFields` or props.
- 2026-03-06: Advance feedback channel — chose `ActionFeedback` (existing pattern, no toast library needed). Injection via new `onSavedFeedback` optional callback prop on `CatalogProductForm`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix autosave init — change `isAutosaveDirty` initial to `true` | Yes | None | No |
| TASK-01: Update `resetAutosaveState` to set `isAutosaveDirty(true)` | Yes | None | No |
| TASK-01: Update tests (renderForm prop default, hook assertion) | Yes | [Minor] `action-feedback.test.tsx` TC checks `autosave-dirty: yes` after user action — initial state assertion not currently present; new assertion is additive. No breakage expected. | No |
| TASK-02: Add i18n key to `uploaderI18n.ts` (en + zh) | Yes | None | No |
| TASK-02: Add `onSavedFeedback` param to `useSaveButtonTransition` | Yes | None | No |
| TASK-02: Add `onSavedFeedback` prop to `CatalogProductForm` | Yes | [Moderate] `CatalogConsole.client.tsx` not yet read — consumer tracing requires confirming `setActionFeedback` is accessible at that call site. TASK-02 scouts step covers this. | No (scouts cover it) |
| TASK-02: Wire `onSavedFeedback` in `CatalogConsole.client.tsx` call site | Partial | [Moderate] Consumer file not yet read. Scouts step in TASK-02 required before implementing. | No (scout resolves) |
| TASK-03: Remove top-panel delete block | Yes | None | No |
| TASK-03: Restructure action footer to `justify-between` + conditional delete | Yes | None | No |
| TASK-03: Confirm existing delete tests still pass (by-role query is position-agnostic) | Yes | None | No |

## Delivery Rehearsal

**Data lens:** No database or file dependencies. All changes are in-memory React state and JSX. Pass.

**Process/UX lens:**
- TASK-01: Entry — any product state. Happy path — autosave indicator shows "unsaved". No empty/error state introduced.
- TASK-02: Entry — clicking save on a valid product form. Happy path — feedback area shows advance message at timer fire. Error state — save fails, no advance, existing error feedback shown (unchanged).
- TASK-03: Entry — selecting existing product on product step. Happy path — delete in footer, save in footer, `window.confirm` on click. Empty state (add flow) — no delete button rendered. All states specified. Pass.

**Security lens:** No auth boundary changes. No new data access. Pass.

**UI lens:**
- TASK-01: Rendering path — `autosaveStatus` prop → `autosaveCopy` → `<p>` in `CatalogProductForm`. Fully specified.
- TASK-02: Rendering path — `feedback` prop → `<div role="status">` in `CatalogProductForm` at line 241. Fully specified. `CatalogConsole.client.tsx` call site requires the `onSavedFeedback` prop wire-up (noted in scouts).
- TASK-03: Rendering path — action footer `<div>` in product step section of `CatalogProductForm`. Fully specified. Pass.

**Adjacent ideas routed away:**
- [Adjacent: delivery-rehearsal] Replace `window.confirm` with an in-panel confirmation step for delete. Out of scope — would add a TASK-04 with new state and tests. Fact-find open question was resolved to preserve `window.confirm` for now. Route to post-build reflection.

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- Sum weights: 3
- Overall-confidence = (85 + 85 + 85) / 3 = **85%**
