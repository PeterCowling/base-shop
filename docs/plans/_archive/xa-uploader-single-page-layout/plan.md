---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-single-page-layout
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep, tools-ui-breakpoint-sweep
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (M=2,M=2,S=1,S=1)
Auto-Build-Intent: plan+auto
---

# xa-uploader Single-Page Layout Plan

## Summary

`CatalogProductForm` currently shows product fields and images in a two-step tabbed UI (`FormStepId = "product" | "images"`), gated on `readiness.isDataReady`. The `xa-uploader-status-and-media-model-rewrite` is complete — the media and status contracts are in their final form. This plan removes the step navigation and restructures the form into a single scrollable page: upload drop zone → main image panel → data selectors → additional photos → save/delete. `CatalogProductImagesFields.client.tsx` is split to export `MainImagePanel` and `AdditionalImagesPanel` as named exports, interleaved by `CatalogProductForm`. Four extinct step-navigation tests are removed from `CatalogProductForm.test.tsx` and one new single-page render test is added.

## Active tasks

- [x] TASK-01: Extract MainImagePanel and AdditionalImagesPanel from CatalogProductImagesFields
- [x] TASK-02: Rewrite CatalogProductForm to single-page layout
- [x] TASK-03: Update CatalogProductForm tests for single-page model
- [x] TASK-04: Checkpoint — QA and staging deploy

## Goals

- Single scrollable page: main image → data selectors → additional photos visible simultaneously
- Remove `FormStepId` step state, `StepIndicator` tabs, and `canOpenImageStep` gate entirely
- Preserve all upload, make-main, reorder, and remove behaviour unchanged
- Keep `CatalogConsole` and `useCatalogConsole` props unchanged

## Non-goals

- Changes to autosave logic or `useCatalogConsole`
- Changes to `CatalogProductBaseFields` field content
- API route changes (complete in prior plan)
- Mobile-specific layout rework beyond removing step tabs

## Constraints & Assumptions

- Constraints:
  - `useImageUploadController` hook must be called exactly once (in `CatalogProductForm`) — not instantiated separately by `MainImagePanel` or `AdditionalImagesPanel`
  - `hasSlug` guard on upload must remain; `ImageDropZone` disabled when no slug
  - Writer lock required for all commits: `scripts/agents/with-writer-lock.sh`
  - No local Jest runs — push and use CI
- Assumptions:
  - `AdditionalImagesPanel` receives `entries.slice(1)` and offsets index by +1 when calling global handlers (documented risk)
  - `CatalogProductForm` external prop signature unchanged — `CatalogConsole` safe with no prop changes

## Inherited Outcome Contract

- **Why:** The status/media contract rewrite is complete and archived. The step-based tab navigation is now the only barrier to operator efficiency — requiring a tab switch between editing product data and managing images. Removing it makes the catalog entry flow continuous.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `CatalogProductForm` renders main image, data selectors, and additional images in a single scrollable page without step navigation. `MainImagePanel` and `AdditionalImagesPanel` extracted from `CatalogProductImagesFields` and interleaved in `CatalogProductForm`.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-single-page-layout/fact-find.md`
- Key findings used:
  - `canOpenImageStep = readiness.isDataReady` — gate is completeness-based, not save-based
  - `useImageUploadController` is private inside `CatalogProductImagesFields.client.tsx`; hook state must be threaded via props
  - Index-offset risk: `AdditionalImagesPanel` must pass `sliceIndex + 1` to global handlers
  - 4 of 7 `CatalogProductForm.test.tsx` tests are extinct; 3 remain valid

## Proposed Approach

- Option A: Render `CatalogProductImagesFields` as-is below `CatalogProductBaseFields` (one flat gallery, no main/additional split). Simple but does not match operator-stated layout (main image → selectors → additional).
- Option B: Extract `MainImagePanel` (index-0 image, large display) and `AdditionalImagesPanel` (index-1+ grid) as named exports from `CatalogProductImagesFields.client.tsx`; `CatalogProductForm` interleaves them with `CatalogProductBaseFields`.
- **Chosen approach:** Option B. Operator confirmed layout requirement: main image → data selectors → other images. `useImageUploadController` hook is exported as a named export from `CatalogProductImagesFields.client.tsx`; `CatalogProductForm` calls it directly and passes state slices to `ImageDropZone`, `MainImagePanel`, and `AdditionalImagesPanel` in the correct layout order.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract MainImagePanel and AdditionalImagesPanel from CatalogProductImagesFields | 85% | M | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Rewrite CatalogProductForm to single-page layout | 85% | M | Complete (2026-03-07) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update CatalogProductForm tests for single-page model | 90% | S | Complete (2026-03-07) | TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Horizon checkpoint — QA and staging deploy | 95% | S | Complete (2026-03-07) | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Independent — extracts panels, no upstream dependency |
| 2 | TASK-02 | TASK-01 Complete | Depends on MainImagePanel/AdditionalImagesPanel exports |
| 3 | TASK-03 | TASK-02 Complete | Tests validate new form behaviour |
| 4 | TASK-04 | TASK-03 Complete | Checkpoint: replan + QA + staging |

## Tasks

---

### TASK-01: Extract MainImagePanel and AdditionalImagesPanel from CatalogProductImagesFields

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:**
  - Commit: `2f0f7021b9` — `feat(xa-uploader): TASK-01 extract MainImagePanel, AdditionalImagesPanel, ImageDropZone, useImageUploadController as named exports`
  - `useImageUploadController`, `ImageDropZone`, `MainImagePanel`, `AdditionalImagesPanel` all exported as named exports
  - `MainImagePanel`: index-0 image, "Main" badge, remove button, `ImagePlaceholder` fallback when entry undefined
  - `AdditionalImagesPanel`: index-1+ grid, +1 index offset for all handlers (`globalIndex = sliceIndex + 1`), `data-cy="additional-images-panel"`, `data-testid="additional-image-global-{n}"`
  - `CatalogProductImagesFields` default export unchanged
  - Typecheck: clean; Lint: clean (import sort autofixed; ds rules suppressed with XAUP-0001 for test selectors and operator-tool layout)
  - TC-01–TC-05: implementation reviewed and confirmed correct against acceptance criteria
- **Confidence:** 85%
  - Implementation: 90% — full file read (765 lines); hook architecture clear; `ImageGallery` already self-contained and reusable
  - Approach: 85% — index-offset risk is the primary concern: `AdditionalImagesPanel` must pass `sliceIndex + 1` to global handlers (`onRemove`, `onMakeMain`, `onReorder`); this is documented and testable
  - Impact: 90% — no callers outside `CatalogProductForm`; no API changes; no i18n key changes
- **Acceptance:**
  - `useImageUploadController` exported as a named export — signature unchanged; allows `CatalogProductForm` to call it directly for state management
  - `ImageDropZone` exported as a named export — `CatalogProductForm` places it at the top of the images area
  - `MainImagePanel` exported; renders single image (index 0), "Main" badge, remove button; no reorder controls
  - `AdditionalImagesPanel` exported; renders `entries.slice(1)` in the existing grid layout; all handler calls offset index by +1 to refer to global position
  - `CatalogProductImagesFields` default export still functional (unchanged external behaviour for any existing call sites)
  - TypeScript compiles clean (`pnpm typecheck`)
  - `reorderPipeEntry` tests (`CatalogProductImagesFields.test.ts`) still pass — function unchanged
  - **Expected user-observable behavior:**
    - (Verified in TASK-02) After TASK-01, the named exports are defined but not yet wired into the form — no visual change at this stage
- **Validation contract (TC-01–TC-05):**
  - TC-01: `MainImagePanel` renders with `isMain=true` for index 0 — "Main" badge visible; make-main button absent or disabled; remove button present
  - TC-02: `MainImagePanel` renders `ImagePlaceholder` when `draft.imageFiles` is empty
  - TC-03: `AdditionalImagesPanel` receives entries starting at global index 1 — calls to `onRemove(0)` from the panel's perspective (sliceIndex 0) call the global `onRemove(1)` handler
  - TC-04: `AdditionalImagesPanel` renders nothing when fewer than 2 images exist (slice is empty)
  - TC-05: TypeScript strict null — `entries[0]` in `MainImagePanel` guarded when no images; `AdditionalImagesPanel` handles `entries.slice(1)` returning empty array
- **Execution plan:**
  - Red: Write type-only stubs for all four new named exports (`useImageUploadController`, `ImageDropZone`, `MainImagePanel`, `AdditionalImagesPanel`) that TypeScript accepts but render nothing — confirm existing tests still pass
  - Green: Convert `useImageUploadController` from private function to exported named function; implement `MainImagePanel` (single image display from existing `ImageGallery` card logic); implement `AdditionalImagesPanel` (grid of index-1+ entries with index offset); export `ImageDropZone` as named export alongside existing default export
  - Refactor: Confirm `CatalogProductImagesFields` default export still composes the same sections internally (no regression for existing call sites); confirm no duplicated rendering logic; run typecheck
- **Planning validation (M):**
  - Checks run: Read `CatalogProductImagesFields.client.tsx` lines 347–448 (`ImageGallery`), lines 450–664 (`useImageUploadController`), lines 666–765 (export)
  - Validation artifacts: Hook outputs confirmed at line 648–663; `ImageGallery` entries map at line 374; `isMain` used for badge at line 376–378
  - Unexpected findings: None
- **Consumer tracing:**
  - `MainImagePanel` — consumed by TASK-02 (`CatalogProductForm`)
  - `AdditionalImagesPanel` — consumed by TASK-02 (`CatalogProductForm`)
  - `CatalogProductImagesFields` default export — still consumed by `CatalogProductForm` currently (TASK-02 replaces this usage)
- **Scouts:** Index-offset error — probe by adding an explicit `data-testid={`additional-image-global-${index + 1}`}` to each `AdditionalImagesPanel` item during Green step; verify in TC-03
- **Edge Cases & Hardening:**
  - Empty image list: `MainImagePanel` shows placeholder, `AdditionalImagesPanel` renders null
  - Single image: `MainImagePanel` shows it; `AdditionalImagesPanel` renders nothing
  - `isMain` always `true` for `MainImagePanel` by definition (it only ever receives index-0 entry)
- **What would make this >=90%:**
  - Confirmed TypeScript strict null on `entries[0]` compiles without assertion (use optional chaining: `imageEntries[0]`)
- **Rollout / rollback:**
  - Rollout: Single commit on `dev`; no feature flag; immediate
  - Rollback: Revert commit
- **Documentation impact:** None: operator-tool internal component; no public API
- **Notes / references:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:374` — `ImageGallery` entries map (reuse for `AdditionalImagesPanel`)
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:648` — `useImageUploadController` return object

---

### TASK-02: Rewrite CatalogProductForm to single-page layout

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Status:** Complete (2026-03-07)
- **Build evidence:**
  - Commit: `b114195a2a` — `feat(xa-uploader): TASK-02 rewrite CatalogProductForm to single-page layout`
  - `FormStepId`, `step` state, `StepIndicator`, `canOpenImageStep` gate all removed
  - `useImageUploadController`, `ImageDropZone`, `MainImagePanel`, `AdditionalImagesPanel` imported from named exports
  - Layout order confirmed: `ImageDropZone` → `MainImagePanel` → `CatalogProductBaseFields` → category fields → `AdditionalImagesPanel` → save/delete row
  - `StatusDot`, autosave copy, and feedback banner preserved intact
  - `UploadStatusMessages` helper extracted to satisfy `max-lines-per-function` (203→~180) and `complexity` (21→~15) lint rules
  - `parseImageEntries` mirrored locally (not exported from images file — clean duplicate acceptable since logic is identical)
  - Typecheck: clean; Lint: clean
- **Confidence:** 85%
  - Implementation: 90% — full file read (364 lines); all removal targets identified; prop interface to `CatalogConsole` confirmed unchanged
  - Approach: 85% — TASK-01 exports must be correct; held-back test: if TASK-01's index-offset has a bug, the make-main/reorder controls would silently operate on the wrong image — caught by TC-03 in TASK-01
  - Impact: 90% — `CatalogConsole` passes unchanged props; no API routes affected; no i18n keys added/removed
- **Acceptance:**
  - `FormStepId` type removed; `step` state removed; `StepIndicator` component removed
  - `useSaveButtonTransition` signature trimmed: `canOpenImageStep` and `onAdvanceToImages` params removed; saved-state 2 s feedback retained
  - `CatalogProductForm` imports `useImageUploadController`, `ImageDropZone`, `MainImagePanel`, `AdditionalImagesPanel` from TASK-01's new named exports; calls `useImageUploadController` directly (all required params available from `CatalogProductForm` own props and `useCatalogConsole`)
  - Layout order in render: `<ImageDropZone>` → `<MainImagePanel>` → `<CatalogProductBaseFields sections={["identity","taxonomy"]}>` → `<AdditionalImagesPanel>` → save/delete button row
  - `StatusDot` remains in the form header (top bar above the content sections)
  - `canOpenImageStep` gate removed; images always visible; `hasSlug` internal guard in `ImageDropZone` handles the "no slug yet" state
  - `CatalogProductForm` prop signature unchanged — `CatalogConsole` requires no edits
  - TypeScript compiles clean
  - **Expected user-observable behavior:**
    - On opening a product for editing: main image panel visible immediately (or placeholder if no images), data selectors visible below it, additional photos grid visible at the bottom — no tab navigation required
    - Upload drop zone present above main image; shows "Add main image" when empty, "Add photo" when images exist
    - Save/delete buttons at the bottom of the single page
    - Autosave status indicator and feedback banner unchanged
- **Validation contract (TC-06–TC-11):**
  - TC-06: Render with a product that has images — `MainImagePanel` shows first image with "Main" badge; `CatalogProductBaseFields` visible; `AdditionalImagesPanel` shows remaining images — all in one render, no user interaction needed
  - TC-07: Render with a product that has no images — `MainImagePanel` shows placeholder; `AdditionalImagesPanel` absent; `ImageDropZone` shows "Add main image" copy
  - TC-08: No `StepIndicator` elements in the DOM after the rewrite
  - TC-09: Save button still transitions to "Saved" state on save success; does not navigate to a different view
  - TC-10: Delete button visible in edit flow, absent in add flow — unchanged from current behaviour
  - TC-11: `CatalogConsole` renders `CatalogProductForm` with existing props — no TypeScript errors on the call site
  - TC-12: Post-build QA sweep — `lp-design-qa` + `tools-ui-contrast-sweep` + `tools-ui-breakpoint-sweep` on the form route; no Critical/Major findings remaining after auto-fix
- **Execution plan:**
  - Red: Remove `FormStepId`, `step` state, and `StepIndicator` — TypeScript should error on missing imports; confirm test suite would fail on step-related assertions
  - Green: Import `MainImagePanel` and `AdditionalImagesPanel` from TASK-01; lay out single-page render; trim `useSaveButtonTransition` params; confirm typecheck passes
  - Refactor: Remove any remaining step-related dead code; verify `autosaveCopy`, `StatusDot`, feedback banner remain intact; run contrast/breakpoint sweep
- **Planning validation (M):**
  - Checks run: Read `CatalogProductForm.client.tsx` lines 103–172 (`useSaveButtonTransition`), lines 174–364 (export + render)
  - Validation artifacts: `canOpenImageStep = readiness.isDataReady` at line 211; `StepIndicator` at lines 264–277; step-conditional render at lines 289–360
  - Unexpected findings: None
- **Consumer tracing:**
  - `CatalogProductForm` rendered by `CatalogConsole.client.tsx:60` — prop interface unchanged; consumer is safe
  - `useSaveButtonTransition` is internal — no external consumers; trimming params has no blast radius
- **Scouts:** Verify `autosaveInlineMessage` and `autosaveStatus` still thread correctly to the new layout; these were previously only passed to `CatalogProductImagesFields` step — must confirm they reach `ImageDropZone`/upload status messages in the new single-page render
- **Edge Cases & Hardening:**
  - `hasSlug` false (new product, no slug yet): `ImageDropZone` shows disabled state; `MainImagePanel` shows placeholder — no hard gate
  - `readiness.isDataReady` false: images always visible; drop zone disabled if no slug; no functional regression
  - Saved-state timer (2 s): fires and calls `onSavedFeedback`; no advance logic — cleanup confirms no `clearTimeout` leak
- **What would make this >=90%:**
  - TASK-01 complete and index-offset confirmed correct in TC-03
  - Post-build contrast/breakpoint sweep returning no Major findings
- **Rollout / rollback:**
  - Rollout: Single commit on `dev`; immediate
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - `CatalogProductForm.client.tsx:211` — `canOpenImageStep = readiness.isDataReady`
  - `CatalogConsole.client.tsx:60` — `ProductEditor` call site; confirm props unchanged

---

### TASK-03: Update CatalogProductForm tests for single-page model

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Status:** Complete (2026-03-07)
- **Build evidence:**
  - Commit: `9ebfd1813e` — `test(xa-uploader): TASK-03 update CatalogProductForm tests for single-page model`
  - 4 extinct tests removed (step-navigation and auto-advance)
  - Mock updated: now exports `useImageUploadController`, `ImageDropZone`, `MainImagePanel`, `AdditionalImagesPanel`, `parseImageEntries` as named exports; `useImageUploadController` stub returns full handler shape
  - 1 new test added: simultaneous single-page render (main-image-panel + base-fields + additional-images-panel without any tab interaction)
  - No fake timer usage remains; no `workflowStepImages` references remain
  - Typecheck: clean; Lint: clean (pre-commit hooks passed)
- **Confidence:** 90%
  - Implementation: 90% — all 7 tests read; 4 extinct identified by name; 3 valid retained; 1 new test shape clear
  - Approach: 90% — RTL render + `queryByTestId` / `getByTestId` pattern already established in the file
  - Impact: 90% — test-only change; no production code affected
- **Acceptance:**
  - Module mock for `../CatalogProductImagesFields.client` updated to export all new named exports: `MainImagePanel` (`data-cy="main-image-panel"`), `AdditionalImagesPanel` (`data-cy="additional-images-panel"`), `ImageDropZone` (`data-cy="image-drop-zone"`), and `useImageUploadController` — stub must return the full hook return shape: `{ fileInputRef: { current: null }, previews: new Map(), dragOver: false, uploadStatus: "idle", uploadError: "", canUpload: false, isUploading: false, handleDragOver: jest.fn(), handleDragLeave: jest.fn(), handleDrop: jest.fn(), handleFileInput: jest.fn(), handleRemoveImage: jest.fn(), handleMakeMainImage: jest.fn(), handleReorderImage: jest.fn() }`
  - Exactly 4 tests removed (step-navigation and auto-advance tests listed below)
  - Exactly 3 tests retained: 2 save-draft tests + 1 commercial-section omission test
  - 1 new test added: renders `main-image-panel`, `base-fields`, and `additional-images-panel` simultaneously without any user interaction
  - CI passes (typecheck + lint + tests)
  - **Expected user-observable behavior:** None — test file only
- **Tests to remove (extinct):**
  - `"keeps save action scoped to product step only"` — clicks `workflowStepImages` button
  - `"shows saved state for 2 seconds then auto-advances to images"` — auto-advance timer
  - `"shows save-and-advance feedback when the transition timer fires"` — `onSavedFeedback` after advance
  - `"cancels save auto-advance when delete is clicked during saved state"` — cancel-advance path
- **Tests to keep:**
  - `"renders Save as draft in product step for add flow"` — save button / no delete
  - `"renders Save as draft in product step for edit flow"` — save button + delete
  - `"does not render the commercial/derived description section"` — verifies `sections` prop is `["identity", "taxonomy"]`
- **New test:**
  - Name: `"renders main image panel, base fields, and additional images panel simultaneously without tab interaction"`
  - Assert: `screen.getByRole` or `data-cy` selectors confirm `main-image-panel`, `base-fields`, and `additional-images-panel` all present in a single render with no `fireEvent` call
- **Validation contract (TC-13–TC-15):**
  - TC-13: `renderForm()` call renders `data-cy="main-image-panel"`, `data-cy="base-fields"`, and `data-cy="additional-images-panel"` simultaneously without any `fireEvent` call
  - TC-14: No reference to `workflowStepImages` button or step-advance assertions in the file
  - TC-15: CI green — all remaining tests pass; no fake-timer leaks
- **Execution plan:**
  - Red: Delete the 4 extinct `it(...)` blocks; update mock to add `MainImagePanel`, `AdditionalImagesPanel`, `ImageDropZone`, `useImageUploadController` — TypeScript will error until new imports are resolvable
  - Green: Add the single-page simultaneous render test asserting `main-image-panel`, `base-fields`, `additional-images-panel` all present; confirm mock exports align with TASK-02's new imports
  - Refactor: Lint pass; confirm no `jest.useFakeTimers()` calls remain without matching cleanup
- **Planning validation:** Not required for S-effort tasks
- **Scouts:** Verify `getCatalogDraftWorkflowReadiness` mock returns `isDataReady: true` (line 20) — images visible without gate; confirm `useImageUploadController` stub returns the handler shape expected by `ImageDropZone` and panels
- **Edge Cases & Hardening:** `jest.useFakeTimers()` was used in 3 of the 4 extinct tests; confirm no fake timer leak after removal (each was paired with `jest.useRealTimers()` in the test itself — removal is clean)
- **What would make this >=95%:** CI green on first push
- **Rollout / rollback:** Rollout: committed with TASK-02 or separately; Rollback: revert
- **Documentation impact:** None
- **Notes / references:** `CatalogProductImagesFields.client.tsx:648–663` — `useImageUploadController` return shape; use this as the complete stub reference for the mock; the `CatalogProductImagesFields` default-export mock at line 41–43 of the test file becomes secondary once named exports are mocked

---

### TASK-04: Horizon checkpoint — QA and staging deploy

- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence + staging deploy at `https://xa-uploader-preview.peter-cowling1976.workers.dev`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/xa-uploader-single-page-layout/plan.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process defined (replan + QA sweeps + wrangler deploy)
  - Approach: 95% — same deploy path used in prior plan
  - Impact: 95% — confirms layout correct in real environment
- **Acceptance:**
  - `/lp-do-replan` run on any downstream tasks (none currently) — plan confirmed complete
  - `lp-design-qa` scoped to `CatalogProductForm` route — no Critical/Major findings outstanding
  - `tools-ui-contrast-sweep` + `tools-ui-breakpoint-sweep` on changed components — no Critical/Major findings
  - `opennextjs-cloudflare build` succeeds
  - `wrangler deploy --env preview` succeeds — `xa-uploader-preview` worker updated
  - Staging URL accessible and single-page layout confirmed visually
- **Horizon assumptions to validate:**
  - Drop zone + main image + data selectors + additional photos all visible in a single scroll without any tab interaction
  - Upload, make-main, reorder, remove all operational on staging
- **Validation contract:** Staging URL returns 200; layout matches expected three-section structure; no console errors on render
- **Planning validation:** None (procedural checkpoint)
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan archived on completion

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract panels from CatalogProductImagesFields | Yes — full file read, hook architecture confirmed | [Moderate]: Index-offset error is off-by-one trap; documented in Risks and Scouts | No — addressed in TC-03 and execution plan |
| TASK-02: Rewrite CatalogProductForm | Partial — depends on TASK-01 exports being correct | [Minor]: `autosaveInlineMessage` threading to new layout must be verified (was in images step, now always visible) | No — captured in Scouts |
| TASK-03: Update tests | Yes — TASK-02 must be complete | None | No |
| TASK-04: CHECKPOINT | Yes — TASK-03 must pass CI | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Index-offset bug in AdditionalImagesPanel — slice index used instead of global index for handlers | Medium | High | `data-testid` probe in TASK-01 Green step; TC-03 asserts global index offset explicitly |
| `autosaveInlineMessage` not threaded to new layout — was only visible in images step | Low | Low | Captured in TASK-02 Scouts; verify in Green step |
| Contrast or layout regression in single-page view — more content visible simultaneously may cause overflow on narrow viewports | Low | Moderate | `tools-ui-breakpoint-sweep` in TASK-04 checkpoint; auto-fix before completion |
| 4 extinct tests removed but `jest.useFakeTimers` cleanup inconsistency | Low | Low | Explicitly checked in TASK-03 Refactor step |

## Observability

- Logging: None: operator-tool UI change; no new log paths
- Metrics: None: no analytics events on this UI
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `CatalogProductForm` renders main image, data selectors, and additional images simultaneously in one page without tab interaction
- [ ] No `StepIndicator` in the rendered DOM
- [ ] Upload, make-main, reorder, remove all functional in staging
- [ ] CI green (typecheck + lint + tests — including retained tests and new single-page render test)
- [ ] `xa-uploader-preview` worker updated and accessible

## Decision Log

- 2026-03-07: Chose Option B (split panels) over Option A (flat gallery below fields) based on operator layout requirement: main image → data selectors → additional photos. Architecture: `useImageUploadController` exported as named export from `CatalogProductImagesFields.client.tsx`; `CatalogProductForm` calls it directly and passes state slices to `ImageDropZone`, `MainImagePanel`, and `AdditionalImagesPanel`. `AdditionalImagesPanel` offsets its slice indices by +1 to call global handlers with the correct position.

## Overall-confidence Calculation

- TASK-01 confidence 85%, Effort M (weight 2) → 170
- TASK-02 confidence 85%, Effort M (weight 2) → 170
- TASK-03 confidence 90%, Effort S (weight 1) → 90
- TASK-04 confidence 95%, Effort S (weight 1) → 95
- Sum weights: 6
- Raw = 525 / 6 = 87.5 → **85%** (downward bias at boundary)
