---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-dual-upload-zones
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Dual Upload Zones (xa-uploader) Plan

## Summary

`CatalogProductForm` currently renders a single `ImageDropZone` above `MainImagePanel`. Once a
main image is set, the operator must scroll back to the top of the form to add additional photos —
the additional-images grid has no upload affordance nearby. This plan adds a second
`ImageDropZone` immediately above `AdditionalImagesPanel`, visible only when at least one image
exists. Both zones share the same `handleUpload` logic and data model; they have independent file
input refs and drag state. Inline upload feedback is also rendered near zone 2. Changes touch two
component files and one test file; no API, data model, or i18n changes are required.

## Active tasks

- [x] TASK-01: Extend hook and `ImageDropZone` for second-zone support
- [x] TASK-02: Render zone 2 in `CatalogProductForm`
- [x] TASK-03: Update tests for zone 2

## Goals

- Add a contextual upload zone immediately above the additional-images grid.
- Keep zone 1 (above main image panel) exactly as-is.
- Show upload status/error feedback inline near zone 2.
- No data model, API, or i18n changes.

## Non-goals

- Distinguishing uploads by zone in stored data.
- Modifying the standalone `CatalogProductImagesFields` component.
- Any change to the upload API, delete logic, or blob URL management.

## Constraints & Assumptions

- Constraints:
  - Zone 2 renders only when `imageEntries.length > 0`.
  - Both zones are disabled together when `canUpload=false` (one in-flight upload at a time).
  - Each zone has its own independent `fileInputRef` and drag state.
  - `eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id` required on new hardcoded
    test ID strings.
- Assumptions:
  - Upload status (`uploadStatus`, `uploadError`) is shared; both zones reflect the same state.
  - Zone 2 shows upload/persisting/error messages only — not the slug-gate, pending-preview hint,
    `autosaveInlineMessage`, or `fieldErrors`.
  - The parent-level drag container (`<div onDragOver={...} onDrop={...}>` wrapping the images
    section) remains unchanged; drags directly over zone 2's button call `stopPropagation()` and
    drive zone 2's state only.

## Inherited Outcome Contract

- **Why:** The single upload zone is at the top of the image section. Once a main image exists and
  the operator scrolls to the additional-images grid, there is no upload affordance nearby —
  requiring a scroll back up. A second zone at point of use reduces friction.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `CatalogProductForm` renders two `ImageDropZone` instances: the
  original above `MainImagePanel`, and a second above `AdditionalImagesPanel` (visible only when
  `imageEntries.length > 0`). Both share the same upload logic but have independent file inputs and
  drag state. Zone-2-specific upload status feedback is shown inline near zone 2.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-dual-upload-zones/fact-find.md`
- Key findings used:
  - `useDropZoneDragHandlers` is private to `CatalogProductImagesFields.client.tsx` — second drag
    state added inside `useImageUploadController` hook (not exported separately).
  - `ImageDropZone` hardcodes `data-testid="image-drop-zone"` — needs one new optional `testId`
    prop (default `"image-drop-zone"`).
  - `UploadStatusMessages` is a local presentational component in `CatalogProductForm.client.tsx`
    (lines 325–368) — safe to render twice with different prop values.
  - `parseImageEntries` is a local non-exported function in `CatalogProductForm.client.tsx` — zone
    2 visibility is driven directly by the `imageEntries.length` computed from the `draft.imageFiles`
    prop; no mock needed for this in tests.
  - Two active callers of `useImageUploadController`: `CatalogProductForm.client.tsx:461` and
    `CatalogProductImagesFields.client.tsx:970` (standalone, not wired into active UI).

## Proposed Approach

Only one viable option emerged from the fact-find — no architectural fork.

- **Chosen approach:** Extend `useImageUploadController` to own the second-zone drag state
  (adding `fileInputRef2`, `dragOver2`, and four matching handlers). Add optional `testId` prop
  to `ImageDropZone` (default `"image-drop-zone"`). Conditionally render zone 2 + a
  `UploadStatusMessages` instance above `AdditionalImagesPanel` in `CatalogProductForm`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend hook + `ImageDropZone` `testId` prop | 90% | S | Complete (2026-03-08) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Render zone 2 in `CatalogProductForm` | 90% | S | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update `CatalogProductForm.test.tsx` | 85% | S | Complete (2026-03-08) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Hook extension + `ImageDropZone` prop. Unblocks all downstream work. |
| 2 | TASK-02 | TASK-01 complete | Form render. Requires new hook fields from TASK-01. |
| 3 | TASK-03 | TASK-01, TASK-02 complete | Tests require knowledge of new hook return shape + zone 2 selector. |

## Tasks

---

### TASK-01: Extend hook and `ImageDropZone` for second-zone support

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` (consumer — read to verify return shape is compatible)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — all touch points confirmed with line numbers; hook internals fully traced;
    `useDropZoneDragHandlers` pattern confirmed private + called once; the second call follows the
    same pattern exactly.
  - Approach: 90% — second drag state in hook is consistent with existing pattern; `testId` prop
    addition is the minimal change needed.
  - Impact: 90% — purely additive to hook return; optional prop with safe default; no change to
    existing zone 1 behavior; standalone `CatalogProductImagesFields` caller unaffected (doesn't
    destructure new fields).
- **Acceptance:**
  - `ImageDropZone` accepts optional `testId?: string` prop defaulting to `"image-drop-zone"`;
    renders it as `data-testid` on the button element.
  - `useImageUploadController` returns six new fields: `fileInputRef2`, `dragOver2`,
    `handleDragOver2`, `handleDragLeave2`, `handleDrop2`, `handleFileInput2`.
  - `handleDrop2` and `handleFileInput2` call the same internal `handleUpload` closure.
  - `handleDragOver2` / `handleDragLeave2` toggle `dragOver2` (not `dragOver`); they call
    `stopPropagation()` to prevent the parent container's zone-1 handlers from receiving the event.
  - `fileInputRef2` is independent of `fileInputRef`; clicking zone 1 does not open zone 2's
    picker and vice versa.
  - Existing zone 1 behavior (all fields returned previously) is unchanged.
  - TypeScript compiles without errors.
  - `eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id` comment used on the new
    hardcoded `data-testid` default if required by the linter.
  - **Expected user-observable behavior:**
    - Zone 1: no change. Clicking/dragging over zone 1 opens zone 1's file picker as before.
    - (Zone 2 rendering is in TASK-02 — no user-visible change from TASK-01 alone.)
- **Validation contract:**
  - TC-01: `ImageDropZone` rendered without `testId` prop → `data-testid="image-drop-zone"` present.
  - TC-02: `ImageDropZone` rendered with `testId="image-drop-zone-additional"` → `data-testid="image-drop-zone-additional"` present.
  - TC-03: Hook returns an object containing `fileInputRef2`, `dragOver2`, `handleDragOver2`,
    `handleDragLeave2`, `handleDrop2`, `handleFileInput2`.
  - TC-04: Calling `handleDrop2` with a drag event containing a file triggers `handleUpload` (same
    as `handleDrop`), setting `uploadStatus` to `"uploading"`.
  - TC-05: `fileInputRef` and `fileInputRef2` are distinct `useRef` instances (separate `.current`
    objects).
- **Execution plan:**
  - Red → in `CatalogProductImagesFields.client.tsx`:
    - Add `testId?: string` to `ImageDropZone` props interface; add `data-testid={testId ??
      "image-drop-zone"}` to the `<button>` element (replacing the hardcoded string; keep eslint
      suppress comment).
    - Add `const fileInputRef2 = useRef<HTMLInputElement>(null);` inside
      `useImageUploadController`.
    - Add `const [dragOver2, setDragOver2] = useState(false);` inside `useImageUploadController`.
    - Add `const { handleDragOver: handleDragOver2, handleDragLeave: handleDragLeave2 } =
      useDropZoneDragHandlers(setDragOver2);` inside `useImageUploadController`.
    - Add `handleDrop2` callback (same body as `handleDrop` but calls `setDragOver2(false)` and
      reads from `event.dataTransfer.files[0]` → calls `void handleUpload(file)`).
    - Add `handleFileInput2` callback (same body as `handleFileInput`).
    - Add all six new fields to the hook's return object.
  - Green → TypeScript compiles; existing tests pass; new TC-01–TC-05 pass (new tests added in
    TASK-03).
  - Refactor → None: this is a minimal additive change; no cleanup needed.
- **Planning validation:**
  - Checks run: read `CatalogProductImagesFields.client.tsx` lines 265–280
    (`useDropZoneDragHandlers`), 680–926 (`useImageUploadController`); confirmed `useState`,
    `useRef`, `useCallback` are already imported.
  - Validation artifacts: fact-find lines 104–107, 131–134.
  - Unexpected findings: none.
- **Consumer tracing:**
  - `fileInputRef2` → consumed by TASK-02: zone 2 `ImageDropZone fileInputRef={fileInputRef2}`.
  - `dragOver2` → consumed by TASK-02: zone 2 `ImageDropZone dragOver={dragOver2}`.
  - `handleDragOver2`, `handleDragLeave2`, `handleDrop2`, `handleFileInput2` → consumed by TASK-02
    as zone 2 event handlers.
  - `testId` prop → consumed by TASK-02: `testId="image-drop-zone-additional"` on zone 2; zone 1
    omits prop (default `"image-drop-zone"` applies, unchanged behavior).
  - All consumers addressed in TASK-02.
- **Scouts:** None: all implementation paths confirmed in fact-find with exact line numbers.
- **Edge Cases & Hardening:**
  - Rapid alternating drops on zone 1 and zone 2: `canUpload=false` during upload prevents
    `handleUpload` from starting when another is in flight — both zones blocked simultaneously.
  - `handleUpload` internal closure captures `draft`, `hasSlug`, `onChange`, `onImageUploaded`,
    `storefront`, `t` from the hook's own scope — zone 2's `handleDrop2` and `handleFileInput2`
    call the same closure, so capture is consistent.
- **What would make this >=90%:** Already at 90%. Would reach 95% once CI confirms TypeScript
  compiles without error (static analysis of the new optional prop and hook return addition).
- **Rollout / rollback:**
  - Rollout: shipped in the same PR as TASK-02 and TASK-03.
  - Rollback: revert the PR; no data or API changes to undo.
- **Documentation impact:** None: operator-facing tool; no public API or SDK docs.
- **Notes / references:**
  - Fact-find §Patterns & Conventions: `useDropZoneDragHandlers` private, safe to call twice.
  - Fact-find §Parent-Level Drag Container: zone 2 handlers call `stopPropagation()`; parent
    handler remains zone 1 fallback — no change needed to parent.

---

### TASK-02: Render zone 2 in `CatalogProductForm`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
    (source of hook return type)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — render site confirmed (lines 476–603); insertion point immediately
    before `<AdditionalImagesPanel>` (line 576) is unambiguous; `UploadStatusMessages` component
    contract confirmed.
  - Approach: 90% — conditional render with existing component reuse; no new abstractions; parent
    drag container behavior documented and resolved.
  - Impact: 90% — purely additive render; zone 1 and all existing form controls unchanged; zone 2
    only appears when main image already exists.
- **Acceptance:**
  - `<ImageDropZone>` with `testId="image-drop-zone-additional"` rendered immediately before
    `<AdditionalImagesPanel>` when `imageEntries.length > 0`.
  - Zone 2 absent from DOM when `imageEntries.length === 0`.
  - Zone 2 `ImageDropZone` receives: `canUpload={canUpload}`, `isUploading={isUploading}`,
    `dragOver={dragOver2}`, `hasImages={true}`, `fileInputRef={fileInputRef2}`,
    `onDragOver={handleDragOver2}`, `onDragLeave={handleDragLeave2}`, `onDrop={handleDrop2}`,
    `onFileInput={handleFileInput2}`, `testId="image-drop-zone-additional"`, `t={t}`.
  - `<UploadStatusMessages>` rendered after zone 2's `ImageDropZone` with: `hasSlug={true}`,
    `pendingPreviewUrl={null}`, `uploadStatus={uploadStatus}`, `uploadError={uploadError}`,
    `autosaveInlineMessage={null}`, `autosaveStatus={autosaveStatus}`, `fieldErrors={{}}`, `t={t}`.
  - Zone 1 `<ImageDropZone>` (above `MainImagePanel`) is unchanged.
  - TypeScript compiles without errors.
  - **Expected user-observable behavior:**
    - When product has at least one image (including main-image-only state): a second drag-and-drop
      zone labelled "Add another photo" / "继续添加图片" appears in the position immediately above
      where the additional-images grid renders. When only a main image exists (no additional
      images), `AdditionalImagesPanel` returns null; zone 2 still appears at that DOM position as a
      standalone call-to-action inviting the operator to add their first supplementary photo.
    - When two or more images exist, zone 2 appears directly above the populated additional-images
      grid, giving a contextual upload affordance at the point of management.
    - The zone shows "Uploading..." while any upload is in progress (upload status is shared
      between zones; zone 2's messages reflect the global upload state, not only zone-2-triggered
      uploads). Similarly, error or persisting messages near zone 2 appear for any upload, whether
      triggered from zone 1 or zone 2.
    - Dragging a file over zone 2's button highlights zone 2 (dashed border accent) without
      highlighting zone 1.
    - Dropping or clicking zone 2 opens its independent file picker; on success the new image
      appends to the additional-images grid.
    - When the product has no images, zone 2 is not visible; zone 1 is the only upload entry
      point.

- **Post-build QA loop (scoped):**
  - Run targeted `lp-design-qa` on the images section of `CatalogProductForm`.
  - Run `tools-ui-contrast-sweep` to verify zone 2 border, text, and icon contrast meets
    requirements.
  - Run `tools-web-breakpoint` at mobile (375px), tablet (768px), desktop (1280px) to verify zone
    2 renders without overflow or clipping.
  - **Manual drag/disable smoke test (not automatable via RTL):**
    - Drag a file over zone 2 → confirm zone 2 highlights (dashed border accent); zone 1 does not
      highlight.
    - Start an upload from either zone → confirm both zone 1 and zone 2 buttons are visually
      disabled (cursor not-allowed or button disabled attribute set) during the in-flight upload.
  - Log findings. Auto-fix and re-verify until no Critical/Major issues remain. Minor findings may
    be deferred with rationale.

- **Validation contract:**
  - TC-01: `imageEntries.length === 0` → `data-testid="image-drop-zone-additional"` not in DOM.
  - TC-02: `imageEntries.length > 0` → `data-testid="image-drop-zone-additional"` in DOM.
  - TC-03: Zone 2 `ImageDropZone` receives `hasImages={true}` → primary copy is
    `uploadAddPhoto` key (not `uploadAddMainImage`).
  - TC-04: `imageEntries.length > 0` + `uploadStatus="error"` + `uploadError="…"` → error message
    text appears near zone 2 (within same conditional block).
  - TC-05: Zone 1 `ImageDropZone` (`data-testid="image-drop-zone"`) present regardless of image
    count.
  - TC-MANUAL: Both zones disabled together during in-flight upload — verified by code review
    (both `ImageDropZone` instances receive `canUpload={canUpload}`) and by manual smoke test in
    post-build QA; not assertable in RTL due to mock stripping `disabled` prop.
- **Execution plan:**
  - Red → In `CatalogProductForm.client.tsx`, destructure new hook fields from
    `useImageUploadController` call (line 461 area):
    ```tsx
    const {
      fileInputRef, ..., // existing
      fileInputRef2, dragOver2, handleDragOver2, handleDragLeave2, handleDrop2, handleFileInput2,
    } = useImageUploadController({ ... });
    ```
    Then, immediately before `<AdditionalImagesPanel ...>` (currently line 576), insert:
    ```tsx
    {imageEntries.length > 0 ? (
      <>
        <ImageDropZone
          canUpload={canUpload}
          isUploading={isUploading}
          dragOver={dragOver2}
          hasImages={true}
          fileInputRef={fileInputRef2}
          onDragOver={handleDragOver2}
          onDragLeave={handleDragLeave2}
          onDrop={handleDrop2}
          onFileInput={handleFileInput2}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="image-drop-zone-additional"
          t={t}
        />
        <UploadStatusMessages
          hasSlug={true}
          pendingPreviewUrl={null}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
          autosaveInlineMessage={null}
          autosaveStatus={autosaveStatus}
          fieldErrors={{}}
          t={t}
        />
      </>
    ) : null}
    ```
  - Green → TypeScript compiles; zone 2 appears conditionally; all TC pass.
  - Refactor → None: minimal additive insertion; no cleanup needed.
- **Planning validation:**
  - Checks run: read `CatalogProductForm.client.tsx` lines 400–603; confirmed
    `useImageUploadController` call site at line 461; `<AdditionalImagesPanel>` at line 576;
    `UploadStatusMessages` defined at lines 325–368 with confirmed prop contract;
    `uploadStatus`, `uploadError`, `autosaveStatus` are all available in scope.
  - Validation artifacts: fact-find §Parent-Level Drag Container; fact-find §Data & Contracts.
  - Unexpected findings: none.
- **Consumer tracing:**
  - New hook fields (`fileInputRef2`, `dragOver2`, etc.) → consumed in this task's render block.
  - `UploadStatusMessages` with `null`/`{}` for zone-1-only props → all props are required in
    the component signature (lines 334–342); the zone-2 instance passes concrete values for every
    prop (`hasSlug={true}`, `pendingPreviewUrl={null}`, `autosaveInlineMessage={null}`,
    `fieldErrors={{}}`). No missing props; no type errors expected.
  - No new values produced by this task that have downstream consumers outside this task.
- **Scouts:** None: insertion point, surrounding component list, and prop contracts all confirmed.
- **Edge Cases & Hardening:**
  - Last image removed → `imageEntries.length` drops to 0 → zone 2 unmounts cleanly (no state
    to preserve; `fileInputRef2` ref is not attached to any DOM node when zone 2 is absent).
  - `pendingPreview` state: zone 2 is conditional on `imageEntries.length > 0`; pending preview
    only activates before any image is uploaded (`imageEntries.length === 0`); these states are
    mutually exclusive — no interaction.
  - Two rapid zone-2 clicks: `canUpload=false` guard in `ImageDropZone` (`disabled={!canUpload}`)
    prevents double-submit.
- **What would make this >=90%:** Already at 90%. Would reach 95% with CI green on TypeScript +
  linting + zone-2 test assertions.
- **Rollout / rollback:**
  - Rollout: single PR with TASK-01.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - `UploadStatusMessages` is not exported from `CatalogProductImagesFields.client.tsx` — it is
    a local function in `CatalogProductForm.client.tsx` (lines 325–368). Render it in-place.

---

### TASK-03: Update `CatalogProductForm.test.tsx` for zone 2

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
    (hook return type reference)
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
    (component under test)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — mock pattern confirmed (jest.mock module factory returns plain object
    literal); new fields are straightforward additions; `ImageDropZone` mock update pattern
    (render `testId` prop) is simple; test cases are fully specified.
  - Approach: 85% — reusing jest.fn() pattern; zone 2 visibility tested via `draft.imageFiles`
    prop (no need to mock `parseImageEntries`, which is local non-exported); approach confirmed.
  - Impact: 85% — tests are additive; no existing assertions removed; existing passing tests
    continue to pass.
  - Held-back test (85%, no 80 exact threshold): one unresolved gap — the existing mock may use
    TypeScript strict typing of the return object. If `useImageUploadController` return type is
    inferred and strict, adding new fields to the mock may require a cast (`as unknown as
    ReturnType<typeof useImageUploadController>`). This is a compile-time nuance, not a logic
    problem, and is easily resolved in implementation. Score stays at 85 (not 90) until CI
    confirms.
- **Acceptance:**
  - `useImageUploadController` mock includes all six new fields: `fileInputRef2: { current: null }`,
    `dragOver2: false`, `handleDragOver2: jest.fn()`, `handleDragLeave2: jest.fn()`,
    `handleDrop2: jest.fn()`, `handleFileInput2: jest.fn()`.
  - `ImageDropZone` mock renders `data-testid` from `testId` prop so zone-2 selector is queryable.
  - Test case A: render with `draft.imageFiles=""` → `data-testid="image-drop-zone-additional"` not
    in DOM.
  - Test case B: render with `draft.imageFiles="images/slug/file.jpg"` →
    `data-testid="image-drop-zone-additional"` in DOM.
  - Test case C: render with `draft.imageFiles="images/slug/file.jpg"` and hook mock returning
    `uploadStatus: "error"`, `uploadError: "Image upload failed."` → at least two nodes render
    the error string (both zone-1 and zone-2 `UploadStatusMessages` instances are active);
    use `screen.getAllByText("Image upload failed.")` and assert `length >= 2`.
  - All existing tests continue to pass.
  - TypeScript compiles without errors.
  - **Note (manual verification only):** Both zones being disabled together during in-flight upload
    (`canUpload=false` → `disabled={!canUpload}` on each `ImageDropZone` button) cannot be
    asserted in RTL because the `ImageDropZone` mock renders a plain `<div>`, not the real button.
    Verify the shared-disable behavior by code review (both zones receive `canUpload={canUpload}`)
    and via the TASK-02 post-build QA smoke test.
  - **Expected user-observable behavior:** No user-observable impact (test-only change).
- **Validation contract:**
  - TC-01: base render (no `imageFiles`) → zone 2 absent.
  - TC-02: render with `imageFiles` populated → zone 2 present.
  - TC-03: render with `imageFiles="images/slug/f.jpg"` + hook mock returning `uploadStatus="error"`, `uploadError="Image upload failed."` → `screen.getAllByText("Image upload failed.").length >= 2`, confirming both the zone-1 and zone-2 `UploadStatusMessages` instances rendered the error (proving zone 2's block is active).
  - TC-04: All pre-existing test assertions still pass.
- **Execution plan:**
  - Red → In `CatalogProductForm.test.tsx`:
    - Update `ImageDropZone` mock factory to render `data-testid` from props:
      ```tsx
      ImageDropZone: ({ testId }: { testId?: string }) =>
        React.createElement("div", { "data-testid": testId ?? "image-drop-zone" }),
      ```
    - Add six new fields to `useImageUploadController` mock return object.
    - Add `describe("zone 2 visibility")` block with test cases A, B, C.
  - Green → All new TCs pass; existing TCs pass.
  - Refactor → None.
- **Planning validation:**
  - Checks run: read `CatalogProductForm.test.tsx` lines 1–60; confirmed mock factory structure
    and `parseImageEntries` is not mocked (local function, tested via real `draft.imageFiles`
    prop path).
  - Validation artifacts: fact-find §Recommended Test Approach.
  - Unexpected findings: `parseImageEntries` confirmed non-exported/non-mocked — zone 2 visibility
    test works by passing real `imageFiles` value to `draft` prop; component calls real
    `parseImageEntries` internally.
- **Consumer tracing:**
  - No new values produced; this task only updates tests.
- **Scouts:** None: mock pattern and test setup confirmed from reading the test file.
- **Edge Cases & Hardening:**
  - RTL mocks prevent asserting vertical DOM position; tests assert presence/absence and message
    content only. Placement is verified by code review of the render order (zone 2 inserted before
    `<AdditionalImagesPanel>`).
- **What would make this >=90%:** CI green on xa-uploader test suite with all new assertions
  passing.
- **Rollout / rollback:**
  - Rollout: same PR.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - `parseImageEntries` is local to `CatalogProductForm.client.tsx` — NOT in the mock. Zone 2
    visibility tests rely on passing a non-empty `draft.imageFiles` string to the component.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend hook + `ImageDropZone` | Yes — `useState`, `useRef`, `useCallback` already imported; `useDropZoneDragHandlers` confirmed present at line 265 | None | No |
| TASK-02: Render zone 2 in form | Partial — depends on TASK-01 new hook fields and `testId` prop. TASK-01 is sequenced first; all fields will be available. | [Ordering inversion] [Minor]: if implemented without TASK-01, TypeScript will error on missing hook fields — resolved by sequence order | No |
| TASK-03: Update tests | Yes — mock pattern confirmed; `parseImageEntries` local (not mocked); zone 2 selector requires `ImageDropZone` mock update (specified in acceptance). | [API signature mismatch] [Minor]: hook mock missing new fields will cause TypeScript error — resolved by adding fields in TASK-03 execution | No |

No Critical rehearsal findings. Plan proceeds to Active status.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript error in mock due to strict return type inference | Medium | Low | Cast mock return as `as unknown as ReturnType<typeof useImageUploadController>` if needed |
| Zone 2 file picker opens when zone 1 is clicked (shared ref bug) | Low | Medium | Separate `fileInputRef2` verified in TC-05 of TASK-01 |
| Both zones simultaneously uploading (race) | Low | Low | `canUpload=false` guard applied to both zones; TC in TASK-01 |
| `UploadStatusMessages` double-renders error when upload triggered | Low | Low | Both instances render the same `uploadError` string — correct UX (each zone shows its own nearby feedback) |

## Observability

- Logging: None: no new error paths introduced.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

**Automated (CI):**
- [ ] Zone 2 (`data-testid="image-drop-zone-additional"`) renders above `AdditionalImagesPanel`
  when `imageEntries.length > 0`.
- [ ] Zone 2 absent when no images uploaded.
- [ ] Zone 1 (`data-testid="image-drop-zone"`) unchanged in position and behavior.
- [ ] Zone 2 shows "Add another photo" / "继续添加图片" copy (existing `uploadAddPhoto` key).
- [ ] Zone 2 shows inline upload status/error messages.
- [ ] All existing xa-uploader tests pass in CI.
- [ ] New zone-2 tests (cases A, B, C) pass in CI.
- [ ] TypeScript compiles without errors on changed files.

**Manual smoke test (post-build QA — not assertable via RTL mocks):**
- [ ] Both zones disabled together during in-flight upload (both `ImageDropZone` instances receive
  `canUpload={canUpload}`; observed via browser devtools or visual check during upload).
- [ ] Dragging directly over zone 2 highlights zone 2 (dashed border accent); zone 1 does not
  highlight.

## Decision Log

- 2026-03-08: Second drag state owned by hook (not inline in form) — consistent with existing
  `useDropZoneDragHandlers` pattern being private to the module.
- 2026-03-08: `testId` prop added to `ImageDropZone` (optional, default `"image-drop-zone"`) —
  only change to the component; all visual/interaction behaviour unchanged.
- 2026-03-08: `UploadStatusMessages` reused in two places with different prop values —
  zone-1-only props (`pendingPreviewUrl`, `autosaveInlineMessage`, `fieldErrors`) passed as
  `null`/`{}` to zone 2 instance.
- 2026-03-08: Parent drag container (`<div onDragOver onDrop>`) left unchanged — zone 2's button
  handles `stopPropagation()` so zone 1 does not visually activate when dragging directly over
  zone 2.
- 2026-03-08: [Adjacent: delivery-rehearsal] No adjacent scope items identified. All delivery
  rehearsal checks passed within existing task scope.

## Overall-confidence Calculation

All tasks are S effort (weight = 1):
- TASK-01: 90% × 1 = 90
- TASK-02: 90% × 1 = 90
- TASK-03: 85% × 1 = 85

Overall-confidence = (90 + 90 + 85) / 3 = **88%**
