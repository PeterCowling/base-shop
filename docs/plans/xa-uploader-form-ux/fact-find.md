---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-form-ux
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-form-ux/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306150000-0001
Trigger-Source: dispatch
Trigger-Why: xa-uploader UI review revealed three form-level UX issues that create operator confusion: autosave shows 'saved' on fresh product load before any data is persisted, the save button silently advances to the images step with no feedback, and the delete button sits isolated at the top with no confirmation guard.
Trigger-Intended-Outcome: type: operational | statement: Operators see a truthful autosave state on fresh/new product load, receive visible feedback when save-and-advance fires, and must confirm before delete executes via a properly placed action-footer control. | source: operator
---

# XA Uploader Product Form UX Fact-Find Brief

## Scope

### Summary
Three concrete UX issues in the xa-uploader product form create false or missing feedback for operators: (1) autosave status initialises to "saved" on every fresh product load even before any data has been persisted; (2) after the save button fires successfully, the transition to the images step is silent with no visible announcement; (3) the delete button sits at the top of the form panel without a confirmation guard, isolated from the action footer. This fact-find investigates the exact code paths responsible for each issue and defines the minimal change set needed to fix them.

### Goals
- Determine the exact initialisation path that produces the false "saved" autosave status on fresh/new product load.
- Identify the auto-advance mechanism and clarify what visible feedback is feasible to add without disrupting the existing save-and-advance timer logic.
- Evaluate delete button placement and confirmation strategy (inline modal vs action-footer relocation vs `window.confirm` guard).
- Produce evidence sufficient for planning and tasking the three targeted fixes.

### Non-goals
- Redesigning the overall console layout or adding new panel structures.
- Changes to the autosave queue flush logic, conflict retry, or revision handling.
- Changes to sync, submission, or vendor-mode behaviour.
- Adding a toast infrastructure library (only if one already exists or can be composed cheaply from existing `ActionFeedback` patterns).

### Constraints & Assumptions
- Constraints:
  - All UI tokens must use the `gate-*` design token prefix; `catalogStyles.ts` is the single source of truth for button/panel class constants.
  - The app uses OpenNext Cloudflare Workers build. No new server-side dependencies can be added.
  - Tests run in CI only — never locally. Any new tests must follow the existing Jest + `@testing-library/react` pattern with `data-cy` test IDs.
  - Writer lock must be used for all commits; pre-commit hooks must not be skipped.
- Assumptions:
  - The fix for autosave status is isolated to `useCatalogConsoleState` — no schema or API changes needed.
  - Adding visible feedback for the save-and-advance transition is achievable within the existing `ActionFeedback` / `feedback` prop pipeline already wired into `CatalogProductForm`.
  - Delete relocation to the action footer with a confirmation step does not require a modal library — an inline confirmation state or the existing `window.confirm` pattern suffices.

## Outcome Contract

- **Why:** xa-uploader UI review revealed three form-level UX issues that create operator confusion: autosave shows 'saved' on fresh product load before any data is persisted, the save button silently advances to the images step with no feedback, and the delete button sits isolated at the top with no confirmation guard.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators see a truthful autosave state on fresh/new product load, receive visible feedback when save-and-advance fires, and must confirm before delete executes via a properly placed action-footer control.
- **Source:** operator

## Access Declarations

None. All investigation is pure codebase analysis; no external APIs, databases, or credentials are required.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:108` — `useCatalogConsoleState()`: root hook that owns all state fields including `isAutosaveDirty`, `isAutosaveSaving`, `lastAutosaveSavedAt`, and the derived `autosaveStatus`.
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:162` — `CatalogProductForm`: renders the autosave copy, step indicators, save button, delete button, and feedback area.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:424` — `useCatalogDraftHandlers`: provides `handleNew`, `handleSelect`, `handleSave`, `handleSaveWithDraft`, `handleDelete`.

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:239` — `autosaveStatus` derivation:
  ```
  const autosaveStatus: AutosaveStatus = isAutosaveSaving
    ? "saving"
    : isAutosaveDirty
      ? "unsaved"
      : "saved";
  ```
  This means on initial render, when both `isAutosaveSaving` (false) and `isAutosaveDirty` (false) are at their initial values, `autosaveStatus` is always `"saved"` — even for a brand-new empty product that has never been persisted.

- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:231` — `resetAutosaveState()`: called on `handleNew` and `handleSelect` via `resetAutosaveAndBaseline`. Resets `isAutosaveDirty(false)`, `isAutosaveSaving(false)`, `lastAutosaveSavedAt(null)`, `autosaveInlineMessage(null)`. The reset correctly zeroes the dirty flag but the derived status therefore snaps back to `"saved"` rather than a neutral/unsaved state. This is the root cause.

- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:119-137` — Initial state declaration: `isAutosaveDirty` starts as `false` and `isAutosaveSaving` starts as `false` → `autosaveStatus` is `"saved"` on first render. There is no third state like `"idle"` or `"unsaved"` in the type for the unvisited case.

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:101-160` — `useSaveButtonTransition`: manages `saveButtonState` ("idle" | "saving" | "saved"). After a successful save: sets `saveButtonState("saved")`, waits 2000 ms via `window.setTimeout`, then calls `setSaveButtonState("idle")` and `onAdvanceToImages()`. The label change from `saveAsDraft` → `saveButtonSaved` is the only visible feedback; the step transition itself fires silently 2 seconds later with no toast, inline message, or aria announcement.

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:226-239` — Delete button rendering: rendered at the top of the panel in a `<div className="flex items-center justify-end">` only when `selectedSlug` is truthy. No confirmation guard beyond what is wired downstream. The `handleDeleteClick` calls `cancelPendingSaveAdvance()` then `onDelete()`. The actual `window.confirm` lives inside `handleDeleteImpl` in `catalogConsoleActions.ts:428` — so there IS a native browser confirm dialog, but it is not visible in the form component itself and gives no in-app feedback.

- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:405-455` — `handleDeleteImpl`: calls `confirm(getUploaderConfirmDelete(locale, targetSlug))` — a native browser dialog. The confirmation is functional but: (a) it uses `window.confirm` which is visually inconsistent with the gate-* design system, (b) the button sits isolated at top with no proximity to the destructive consequence, and (c) there is no in-panel confirmation step.

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:240-251` — `feedback` prop rendering: the `ActionFeedback` area is already wired and renders a `<div role="alert|status">` from the `feedback` prop. This is the natural injection point for a save-and-advance notice. Currently `CatalogProductForm` receives `feedback` but never receives a specific advance-notification message — it only sees the generic "Saved product details." success message (which comes from `handleSaveImpl` via `updateActionFeedback` when `suppressSuccessFeedback=false`).

- `apps/xa-uploader/src/components/catalog/catalogStyles.ts:34-36` — `BTN_DANGER_CLASS`: styled with `border-danger`, `text-danger-fg`, `hover:bg-danger-soft`. This is the canonical class for destructive buttons. Re-use required wherever delete is placed.

### Patterns & Conventions Observed

- **Derived status from booleans:** `autosaveStatus` is always computed from two booleans (`isAutosaveDirty`, `isAutosaveSaving`). There is no third explicit state (e.g., `isAutosaveClean` vs `isAutosaveNeverSaved`). Fixing the false "saved" requires either a third boolean (`isProductPersisted` or `isAutosaveNeverSaved`) or changing `autosaveStatus` initial/reset value logic so that the "not yet saved at all" state maps to `"unsaved"` rather than `"saved"`.
- **`resetAutosaveState` as the canonical reset:** All navigation events (new, select, storefront change, logout) call `resetAutosaveAndBaseline → resetAutosaveState`. Any fix to the "fresh load" false-saved issue must propagate through this function.
- **gate-* token prefix:** All button and panel classes use gate-* semantic tokens via `catalogStyles.ts` constants. No raw colour or size values are permitted in component files.
- **`window.confirm` for destructive confirmation:** `handleDeleteImpl` and unpublish confirmation in `handleSaveImpl` both use native `window.confirm`. This is the established pattern; an in-panel confirmation step would be a departure from it and requires justification.
- **`ActionFeedback` as feedback channel:** All operator-visible messages (save success, delete success, errors) flow through `updateActionFeedback → setActionFeedback → actionFeedback` prop → `feedback` in `CatalogProductForm`. The feedback area already handles `role="status"` for success and `role="alert"` for error.
- **2-second saved-state before advance:** `useSaveButtonTransition` hard-codes a 2000 ms timer. The button label changes to `saveButtonSaved` for this window — this is the only current signal of the pending advance.

### Data & Contracts

- Types/schemas/events:
  - `AutosaveStatus = "saving" | "saved" | "unsaved"` — defined at `useCatalogConsole.client.ts:58`. Adding an `"idle"` or `"unsaved"` initial state requires extending this union and updating all consumers.
  - `CatalogProductForm` prop `autosaveStatus: "saving" | "saved" | "unsaved"` — must stay in sync with the hook's type.
  - `ActionFeedback = { kind: "error" | "success"; message: string }` — the feedback channel type.
  - `SaveButtonState = "idle" | "saving" | "saved"` — local to `CatalogProductForm.client.tsx`, no external contract.
- Persistence:
  - `lastAutosaveSavedAt: number | null` — already null on fresh load; this correctly signals "never saved" to any consumer that reads it, but is not currently used for autosave status derivation.
- API/contracts:
  - No API contract changes required. All three fixes are purely UI state.

### Dependency & Impact Map

- Upstream dependencies:
  - `useCatalogConsoleState` → produces `autosaveStatus`, `resetAutosaveState`
  - `useCatalogDraftHandlers` → calls `resetAutosaveAndBaseline` on new/select/storefront change
  - `handleDeleteImpl` in `catalogConsoleActions.ts` → owns the actual delete call and `window.confirm`
- Downstream dependents:
  - `CatalogProductForm` — consumes `autosaveStatus`, `feedback`, `onDelete`, `busy`
  - `CatalogProductImagesFields` — also receives `autosaveStatus` and `autosaveInlineMessage` (any type extension must propagate here too)
  - `CatalogProductForm.test.tsx` — has an existing test `autosaveStatus="saved"` hard-coded in `renderForm()`. This must be updated if a new initial state value is introduced.
  - `action-feedback.test.tsx` — tests `data-cy="autosave-status"` reading `state.autosaveStatus`. If the derived value changes on initial render, this test will need review.
- Likely blast radius:
  - Small. All three changes are localised to: (1) `useCatalogConsoleState` / `resetAutosaveState` for issue 1; (2) `useSaveButtonTransition` or the `handleSave` path for issue 2 (adding an ActionFeedback message); (3) `CatalogProductForm` JSX and optionally `handleDeleteImpl` for issue 3.
  - `CatalogProductImagesFields` receives `autosaveStatus` — must confirm the type union is compatible.

### Test Landscape

#### Test Infrastructure
- Framework: Jest + `@testing-library/react` + `@jest/globals`
- Test environment: `jsdom` (declared per-file via `/** @jest-environment jsdom */`)
- Commands: CI only — `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- Test IDs: `data-cy` attribute (not `data-testid`) per `jest.setup.ts`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `CatalogProductForm` save/advance flow | Component (Jest+RTL) | `__tests__/CatalogProductForm.test.tsx` | Covers save click, 2s advance to images, delete cancel-advance, step lock. Hard-codes `autosaveStatus="saved"`. |
| `useCatalogConsole` action feedback | Hook integration (Jest+RTL) | `__tests__/action-feedback.test.tsx` | Covers login, save, delete, sync feedback domains, busy lock, autosave queue, conflict retry. Tests `autosave-status` via `data-cy`. |
| `useCatalogConsole` domain isolation | Hook integration | `__tests__/useCatalogConsole-domains.test.tsx` | Covers feedback domain isolation. |
| Sync feedback | Component | `__tests__/sync-feedback.test.tsx` | Sync panel feedback. |
| Error localisation | Component | `__tests__/error-localization.test.tsx` | API error message keys. |

#### Coverage Gaps
- No test covers the false "saved" autosave status on fresh product load — the `renderForm()` helper explicitly passes `autosaveStatus="saved"` as a prop, bypassing the hook derivation.
- No test covers what operator sees during the 2-second saved window and then after the auto-advance fires with respect to any announced feedback message.
- No test covers the delete button's position in the form layout (top vs footer).
- No test covers a cancel path in an in-panel confirmation step (if one is introduced).

#### Testability Assessment
- Easy to test:
  - Autosave status initial value: unit test against `useCatalogConsoleState` or integration test reading `data-cy="autosave-status"` before any user action.
  - Save-and-advance feedback message: RTL test asserting the `data-testid="catalog-draft-feedback"` element has expected content after save, before the 2s timer fires.
- Hard to test:
  - In-panel delete confirmation rendering (if using an inline state toggle) — requires simulating a two-step button interaction, but fully doable with RTL.
  - `window.confirm` override — already handled in existing tests via `jest.spyOn(window, "confirm").mockReturnValue(true)`.

### Recent Git History (Targeted)

- `db688badcd feat(xa-uploader): TASK-01 truthful status semantics + publish blockers` — The most recent commit touching `CatalogProductForm` explicitly targeted "truthful status semantics." However, the false autosave `"saved"` initial state was not addressed in this commit — it targets publish blockers, not the autosave init path.
- `0d23d6f064 feat(xa-uploader): autosave queue flush + conflict retry + sync gating (TASK-01/02/03/04)` — Established the current autosave queue architecture including `isAutosaveDirty`, `isAutosaveSaving`, and `flushAutosaveQueue`.
- `65572cf6a3 fix(xa-uploader): preserve save auto-advance on add flow` — Introduced or fixed the `canOpenImageStep && onAdvanceToImages()` call in the 2s timer. Confirms the advance behaviour is intentional.
- `d5900d1dcf feat(xa-uploader): unified catalog screen — remove tabs, always-visible sidebar+editor` — Major layout refactor. Delete button was placed at top of form panel in this context.

## Questions

### Resolved

- Q: Does the false "saved" autosave status occur for both new and existing product load?
  - A: Yes. The derived `autosaveStatus` is always `"saved"` on initial render because both `isAutosaveDirty` and `isAutosaveSaving` start as `false`. On `handleNew`, `resetAutosaveState` resets both to `false` again, producing the same false `"saved"` state. On `handleSelect` (existing product), the same reset fires, so the operator sees "saved" immediately on selecting a product they haven't touched yet — technically correct for existing products (the server state is saved) but misleading for new products.
  - Evidence: `useCatalogConsole.client.ts:239`, `useCatalogConsole.client.ts:231`

- Q: Is there an existing feedback/toast mechanism the save-and-advance message could use, or must one be built from scratch?
  - A: The `ActionFeedback` channel already exists and is wired into `CatalogProductForm` via the `feedback` prop. The `handleSave` path already calls `updateActionFeedback(state.setActionFeedback, "draft", { kind: "success", message: t("saveSucceeded") })` when `suppressSuccessFeedback=false`. The advance notification could be an additional message in the same area, or the existing success message could be enhanced. No new toast library is needed.
  - Evidence: `CatalogProductForm.client.tsx:240-251`, `useCatalogConsole.client.ts:606-611`, `catalogConsoleActions.ts:379-384`

- Q: Is the `window.confirm` for delete intentional and consistent with the rest of the codebase?
  - A: Yes, `window.confirm` is used for two destructive actions in this codebase: delete (in `handleDeleteImpl`) and unpublish confirmation (in `handleSaveImpl`). However, the dispatch identifies the isolated top-panel placement as the primary UX problem — a confirmation guard already exists. The fix can either: (a) move the button to the action footer to give it proper context, or (b) replace `window.confirm` with an in-panel inline confirmation step. Option (a) is lower-risk; option (b) improves design system consistency but requires an inline state toggle.
  - Evidence: `catalogConsoleActions.ts:428`, `catalogConsoleActions.ts:364`

- Q: Does `CatalogProductImagesFields` use `autosaveStatus` in a way that would be broken if a new status value is introduced?
  - A: Needs targeted confirmation, but based on reading `CatalogProductForm.client.tsx:334-350`, `CatalogProductImagesFields` receives `autosaveStatus` as a prop typed as `"saving" | "saved" | "unsaved"`. If a new value (e.g. `"idle"`) were introduced, it would require updating that component's prop type and any conditional rendering on that prop. The safer fix is to map `"not yet saved"` to `"unsaved"` rather than introducing a new union member — then no downstream type changes are needed.
  - Evidence: `CatalogProductForm.client.tsx:337-341`

- Q: Is the delete button currently reachable from the add (new product) flow?
  - A: No. The delete button only renders when `selectedSlug` is truthy (`CatalogProductForm.client.tsx:228`). New product flow has `selectedSlug = null`, so delete is not shown. This constraint must be preserved in any relocation.
  - Evidence: `CatalogProductForm.client.tsx:228-239`

### Open (Operator Input Required)

- Q: Should the delete button move to the action footer (next to the save button), or should it stay at the top with an in-panel inline confirmation step?
  - Why operator input is required: Both options satisfy the dispatch's requirement. The action-footer relocation groups save and delete together (standard pattern), but places a destructive action near the primary action. An in-panel confirmation (click once to reveal confirm/cancel) avoids proximity to save but adds UI complexity. This is a product preference.
  - Decision impacted: TASK-03 implementation approach and test structure.
  - Decision owner: Operator.
  - Default assumption + risk: Default to action-footer relocation with the existing `window.confirm` guard preserved. This is the lower-complexity option. Risk: operator may prefer inline confirmation if native dialogs feel jarring.

## Confidence Inputs

- Implementation: 92%
  - Evidence basis: All three code paths are fully understood from reading source. Root causes are localised. No external dependencies.
  - What raises to >=95: Confirm `CatalogProductImagesFields` handling of `autosaveStatus` prop (Glob/Read needed — not done in this fact-find but low-risk inference from prop drilling).
- Approach: 88%
  - Evidence basis: Mapping `"not yet saved"` to `"unsaved"` is safe (no new union member, no downstream type changes). ActionFeedback channel available for advance notice. Delete relocation is purely JSX restructuring.
  - What raises to >=95: Operator confirms delete placement preference (Open question above).
- Impact: 85%
  - Evidence basis: Changes are purely UI — no API, no schema, no server-side code. Blast radius is small (3 files primary, 2 test files secondary).
  - What raises to >=95: CI test run confirms no regressions across the full `xa-uploader` test suite.
- Delivery-Readiness: 90%
  - Evidence basis: All entry points identified, constraints clear, test patterns established.
  - What raises to >=95: Resolve open question on delete placement.
- Testability: 88%
  - Evidence basis: Existing Jest+RTL patterns cover all three change areas. Coverage gaps identified and concrete test additions defined.
  - What raises to >=95: Confirm test harness patterns for in-panel confirmation state (if chosen).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `CatalogProductImagesFields` prop type mismatch if `autosaveStatus` union is extended | Low | Medium | Fix maps to existing `"unsaved"` value — no new union member needed. Verify prop type in that component before committing. |
| Existing tests hard-code `autosaveStatus="saved"` and break if initial state changes | Medium | Low | `CatalogProductForm.test.tsx:84` passes `autosaveStatus="saved"` as a prop directly — this is a prop drill, not the hook. Hook integration tests in `action-feedback.test.tsx` read the derived value and must be reviewed. |
| Save-and-advance feedback message appears simultaneously with the `saveButtonSaved` state and could feel redundant | Low | Low | The ActionFeedback area is below the stepper; the button label change is in the footer. Both can coexist and address different user attention levels. If redundant, the `saveAsDraft` success toast can be suppressed and replaced by the advance notice. |
| In-panel delete confirmation state (if chosen) conflicts with the `cancelPendingSaveAdvance` timer interaction | Low | Medium | The existing `cancelPendingSaveAdvance` is already called on `handleDeleteClick`. A two-step UI that reveals confirm/cancel does not call `onDelete` until the second click — timer cancellation timing must be verified. |
| Relocation of delete to action footer puts a destructive button visually near the primary save button | Low | Medium | Standard mitigation: `BTN_DANGER_CLASS` provides clear visual differentiation (red border/text). Spatial separation (left-aligned delete, right-aligned save) reinforces the distinction. |

## Planning Constraints & Notes

- Must-follow patterns:
  - All button classes must use constants from `catalogStyles.ts` (`BTN_DANGER_CLASS`, `BTN_PRIMARY_CLASS`, etc.). No inline Tailwind classes for buttons.
  - Any new i18n key must be added to `apps/xa-uploader/public/locales/en/` and `it/` translation files.
  - New test IDs must use `data-cy` attribute.
  - Writer lock required for all commits; pre-commit hooks must not be skipped.
- Rollout/rollback expectations:
  - No feature flag needed — these are pure UX fixes affecting an internal operator tool.
  - Rollback is a git revert of the commit(s) if any regression is found.
- Observability expectations:
  - No analytics instrumentation needed. These are operator console fixes, not user-facing funnel steps.

## Suggested Task Seeds (Non-binding)

- TASK-01: Fix autosave status initialisation — map "not yet persisted" state to `"unsaved"` in `resetAutosaveState` and `useCatalogConsoleState` initial values. Update `CatalogProductForm.test.tsx` render helper to reflect correct initial state. Add integration test asserting `autosave-status` shows `"unsaved"` before any user action.
- TASK-02: Add visible feedback for save-and-advance transition — inject a `"Saved — moving to images…"` (or equivalent i18n key) action feedback message when the 2s advance timer fires, using the existing `ActionFeedback`/`feedback` prop pipeline. Add RTL test asserting the feedback area shows this message.
- TASK-03: Relocate delete button to action footer with confirmation — move the delete `<button>` from the top-of-panel `<div>` to the action footer row (where the save button lives), left-aligned. Preserve `selectedSlug` guard. Preserve `cancelPendingSaveAdvance` call. Keep `window.confirm` guard (or replace with inline confirmation step per operator preference). Update `CatalogProductForm.test.tsx` to reflect new location and confirm delete click still fires in the edit flow test.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `useCatalogConsole.client.ts` initialises `autosaveStatus` to `"unsaved"` (or equivalent) on fresh/new product load.
  - `CatalogProductForm` displays a visible feedback message when save-and-advance fires.
  - Delete button appears in the action footer (or with inline confirmation) only in edit mode; no change to add flow.
  - All existing tests pass; new tests cover the three changed behaviours.
- Post-delivery measurement plan:
  - Smoke test: open xa-uploader, select "New Product", verify autosave indicator shows "unsaved" not "saved".
  - Smoke test: fill required fields, click save, verify feedback message appears before step changes to images.
  - Smoke test: select existing product, verify delete button appears in the action footer (not at the top).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Autosave status derivation in `useCatalogConsoleState` | Yes | None | No |
| `resetAutosaveState` and new/select/storefront-change call chain | Yes | None | No |
| `CatalogProductImagesFields` prop type for `autosaveStatus` | Partial | [Scope gap] [Minor]: Prop type in `CatalogProductImagesFields` not directly read — inferred from prop drilling in `CatalogProductForm`. Low risk as fix maps to existing union value. | No |
| `useSaveButtonTransition` advance timer and feedback pipeline | Yes | None | No |
| `ActionFeedback` channel wiring into `CatalogProductForm` | Yes | None | No |
| Delete button position, guard, and `window.confirm` path | Yes | None | No |
| Test coverage for autosave init, advance notice, delete relocation | Yes | [Coverage gap] [Minor]: `CatalogProductForm.test.tsx` passes `autosaveStatus` as prop — does not test hook derivation. No test for advance feedback or delete footer position. These are coverage gaps, not rehearsal blockers. | No |
| Open question: delete placement preference | Partial | [Missing domain coverage] [Minor]: Operator preference not yet confirmed. Default assumption (footer relocation) is safe. | No |

## Evidence Gap Review

### Gaps Addressed
- Citation integrity: All root-cause claims are supported with file:line references to the actual source code. The `autosaveStatus` derivation, `resetAutosaveState` call chain, `useSaveButtonTransition` timer, `handleDeleteImpl` `window.confirm`, and `ActionFeedback` wiring are all directly confirmed by reading the source.
- Boundary coverage: API boundary confirmed unchanged (no API changes needed). Auth/session boundary not touched. Error/fallback paths (autosave failure, delete failure) are unchanged.
- Testing coverage: Existing tests verified by reading file contents. Gaps explicitly identified: autosave init state, advance feedback, delete footer position.
- Business validation: Not applicable — this is an internal operator tool with no hypothesis validation burden.

### Confidence Adjustments
- Implementation confidence reduced from potential 95% to 92% due to not directly reading `CatalogProductImagesFields` prop type definition. Impact is low — the fix uses the existing `"unsaved"` value.
- Approach confidence set at 88% due to open question on delete placement. Default assumption stated and justified.

### Remaining Assumptions
- `CatalogProductImagesFields` accepts `autosaveStatus: "saving" | "saved" | "unsaved"` with no additional constraint on the `"unsaved"` value — confirmed by inference from the prop drilling in `CatalogProductForm.client.tsx:337-341`.
- A new i18n key for the advance notification message is straightforward to add following the existing `apps/xa-uploader/public/locales/en/*.json` pattern.
- The action-footer row (where the save button lives) is the correct home for the delete button in a two-button layout, with delete left-aligned and save right-aligned.

## Scope Signal

- Signal: right-sized
- Rationale: The three issues have tightly bounded blast radii, all code paths are fully understood, the fixes are UI-only, no schema or API changes are needed, and the test landscape is small and concrete. Evidence depth is sufficient for direct planning and build without further investigation.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None (open question on delete placement is advisory; default assumption is stated and safe)
- Recommended next step: `/lp-do-plan xa-uploader-form-ux --auto`
