---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: xa-uploader-dual-upload-zones
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-dual-upload-zones/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308120000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Dual Upload Zones (xa-uploader) Fact-Find Brief

## Scope

### Summary

Currently `CatalogProductForm` renders one `ImageDropZone` at the top of the image section. It
switches copy based on `hasImages` — but it's always positioned above `MainImagePanel`, far away
from the `AdditionalImagesPanel` grid where the operator is already looking when they want to add
more photos. The change adds a second `ImageDropZone` immediately above `AdditionalImagesPanel`,
giving zone-appropriate feedback at the point of use.

### Goals

- Place a second upload zone directly above `AdditionalImagesPanel` so operators don't have to
  scroll back up to add supplementary photos.
- Keep zone 1 (above `MainImagePanel`) exactly as-is — it owns the main-image slot and the
  pending-preview flow.
- Show upload status/error feedback inline near zone 2, not only near zone 1.
- No data model changes: images appended via either zone land at the end of `imageFiles`; index 0
  is still main.

### Non-goals

- Changing the upload API, delete logic, or blob URL management.
- Distinguishing "uploaded from zone 1" vs "uploaded from zone 2" in stored data.
- Modifying the standalone `CatalogProductImagesFields` component (not currently wired up in the
  active UI; `CatalogProductForm` manages everything directly).
- Adding i18n keys — all required strings already exist (`uploadAddPhoto`,
  `uploadAdditionalPhotosHint`, `uploadDropZoneActive`, `uploadImageUploading`).

### Constraints & Assumptions

- Constraints:
  - Zone 2 must only render when `imageEntries.length > 0` (operator spec).
  - Both zones share the same `handleUpload` logic — no divergence in upload behaviour.
  - Each zone must have its own independent `fileInputRef` and drag state so clicking zone 1 does
    not trigger zone 2's file picker.
  - `canUpload` (i.e. `uploadStatus !== "uploading"`) applies to both zones; only one upload can
    be in flight at a time.
  - Follow existing `data-testid` / `data-cy` conventions; add new test IDs for zone 2 controls.
- Assumptions:
  - Upload status is shared between zones: if an upload is in progress (regardless of which zone
    triggered it) both zones show the uploading state. This is a consequence of the shared
    `handleUpload` function.
  - Zone 2 status feedback should show upload/error messages but NOT the slug-gate warning, the
    pending-preview hint, the `autosaveInlineMessage`, or `fieldErrors` — those are zone-1
    concerns.

## Outcome Contract

- **Why:** The single upload zone is positioned at the top of the image section. Once a main image
  exists and the operator scrolls down through product fields to the additional-images grid, there
  is no upload affordance nearby — they must scroll back up. A second zone at the point of use
  reduces friction.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `CatalogProductForm` renders two `ImageDropZone` instances: the
  original above `MainImagePanel`, and a second above `AdditionalImagesPanel` (visible only when
  `imageEntries.length > 0`). Both share the same upload logic but have independent file inputs
  and drag state. Zone-2-specific upload status feedback is shown inline near zone 2.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:476` — `CatalogProductForm` render; owns the single-page image layout. **Primary edit site.**
- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:282` — `ImageDropZone` export (receives one new optional `testId` prop; otherwise unchanged).
- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:680` — `useImageUploadController` hook (source of `fileInputRef`, drag state, upload callbacks). **Needs extension.**

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — product form orchestrator; renders `ImageDropZone`, `UploadStatusMessages`, `MainImagePanel`, product fields, `AdditionalImagesPanel`, `DraftActionRow` in sequence (lines 476–603). This is the primary build site.
- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — houses `ImageDropZone` (receives new optional `testId` prop), `useImageUploadController` (extended with second-zone fields), `useDropZoneDragHandlers` (private helper, called twice inside hook), `AdditionalImagesPanel`, `MainImagePanel`.
- `apps/xa-uploader/src/lib/uploaderI18n.ts` — all relevant copy already exists: `uploadAddPhoto`, `uploadAdditionalPhotosHint`, `uploadDropZoneActive`, `uploadImageUploading`, `uploadImagePersisting`, `uploadImagePersisted`, `uploadImageErrorFailed` etc.
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx` — integration test for `CatalogProductForm`; mocks `useImageUploadController`, `ImageDropZone`, `AdditionalImagesPanel` via `jest.mock`. Will need new assertions for zone 2.
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` — unit tests for `reorderPipeEntry` (pure function); unaffected by this change.

### Patterns & Conventions Observed

- **Second-ref pattern**: The hook already uses `useRef<HTMLInputElement>(null)` for `fileInputRef` and `pendingPreviewRef`. Adding `fileInputRef2` follows the same pattern.
- **Drag state pattern**: `useDropZoneDragHandlers(setDragOver)` is a shared helper. It is **not currently exported**. Two options: (a) export it so `CatalogProductForm` can create a second pair inline, (b) add second drag state fully inside the hook. Option (b) is cleaner — keeps drag state with the ref it drives.
- **Status feedback pattern**: `UploadStatusMessages` (lines 325–368 of `CatalogProductForm.client.tsx`) is a local presentational component taking `hasSlug`, `pendingPreviewUrl`, `uploadStatus`, `uploadError`, `autosaveInlineMessage`, `autosaveStatus`, `fieldErrors`. Zone 2's inline feedback only needs `uploadStatus`, `uploadError`, and `autosaveStatus` (for the persisting variant). Either render the full component with `null`/`false` defaults for zone-1-only props, or extract a smaller `UploadFeedback` variant. The simpler choice (render `UploadStatusMessages` with minimal props) avoids a new component.
- **`data-testid` pattern**: `ImageDropZone` hardcodes `data-testid="image-drop-zone"` internally (line 331 of `CatalogProductImagesFields.client.tsx`) and does not accept a passthrough `testId` prop. To give zone 2 a distinct selector, an optional `testId?: string` prop (defaulting to `"image-drop-zone"`) must be added to `ImageDropZone`. This is a minimal change to the component; it does not change its visual behaviour. Scoped in TASK-01.
- **`eslint-disable` comments**: file uses `// eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id` for test selectors. Follow same pattern for zone-2 test IDs.
- **`max-lines-per-function` suppression**: both files already carry this suppression for the upload hook and form orchestrator. Adding ~15 lines to `useImageUploadController` and ~20 lines to `CatalogProductForm` render stays within that waiver.

### Parent-Level Drag Container (Form)

`CatalogProductForm` wraps the full image section in a `<div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>` at line 512–517. This means dragging over any part of the images section (including the zone-2 area and the additional-images grid) triggers zone 1's drag handlers.

**Interaction with zone 2:**

`ImageDropZone` calls `event.stopPropagation()` inside both `handleDragOver` and `handleDragLeave` (see `useDropZoneDragHandlers`). So when the user drags directly over the zone-2 `<button>`, `stopPropagation()` fires and the parent container's zone-1 handlers do NOT receive the event — zone 2's visual state activates without lighting up zone 1.

However, when the user drags over the gap between zone 2 and `AdditionalImagesPanel` (not over any dropzone button), the parent fires → zone 1's `dragOver` activates → a drop there calls zone 1's `handleDrop`. This is acceptable: the parent is a convenience drop target for the whole section, and any drop from there still calls `handleUpload` (same result as zone 2). The plan should document this behaviour rather than split or remove the parent handler.

**Implementation note for TASK-01**: Zone 2's `<ImageDropZone>` element receives its own `onDragOver={handleDragOver2}`, `onDragLeave={handleDragLeave2}`, `onDrop={handleDrop2}` props. These map to hook-returned handlers backed by `dragOver2`/`setDragOver2`. The parent container's handlers remain unchanged (zone 1 only).

### Data & Contracts

- Types/schemas/events:
  - `CatalogProductDraftInput.imageFiles: string` — pipe-delimited image path list. Not changed.
  - `UploadStatus = "idle" | "uploading" | "persisting" | "persisted" | "error"` — shared across both zones (one in-flight upload at a time).
  - `ImageEntry = { path: string; filename: string; isMain: boolean }` — derived from `imageFiles`; index 0 is main.
- Persistence:
  - `appendImageDraftEntry()` appends to `imageFiles` pipe string; called in `handleUpload`. Both zones call the same function.
- API/contracts:
  - Upload API: `POST /api/catalog/images?storefront=&slug=` — unchanged.
  - Hook return type: currently returns `fileInputRef`, `dragOver`, `handleDragOver`, `handleDragLeave`, `handleDrop`, `handleFileInput`. Needs `fileInputRef2`, `dragOver2`, `handleDragOver2`, `handleDragLeave2`, `handleDrop2`, `handleFileInput2` added.

### Dependency & Impact Map

- Upstream dependencies:
  - `useImageUploadController` hook — extended but not broken (new fields added to return; callers using destructuring get the new fields transparently).
  - `ImageDropZone` — receives one new optional `testId?: string` prop (defaulting to `"image-drop-zone"`); visual behaviour and all other props unchanged.
  - `UploadStatusMessages` (local to `CatalogProductForm`) — reused unchanged, rendered twice with different props.
- Downstream dependents:
  - `CatalogProductForm.test.tsx` — mock of `useImageUploadController` returns object literal; needs new fields added to the mock return value.
  - No other callers of `useImageUploadController` (confirm: only `CatalogProductForm` and the standalone `CatalogProductImagesFields` call it).
- Likely blast radius:
  - Contained to two files (`CatalogProductForm.client.tsx`, `CatalogProductImagesFields.client.tsx`) plus one test file.
  - No API, data model, or autosave contract changes.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (jsdom), `@jest/globals`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only)
- CI integration: standard xa-uploader test suite in reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `reorderPipeEntry` | Unit | `CatalogProductImagesFields.test.ts` | Pure function; no UI, unaffected |
| `CatalogProductForm` render | Integration (RTL) | `CatalogProductForm.test.tsx` | Mocks `ImageDropZone`, `useImageUploadController`, AND `parseImageEntries`. `parseImageEntries` is mocked to always return `[]` in the base setup. No explicit assertion on `ImageDropZone` count. |
| Upload status messages | Integration | `CatalogProductForm.test.tsx` (implied) | No direct test of `UploadStatusMessages` rendering with different props |

#### Coverage Gaps

- Untested paths:
  - No test verifies that a second `ImageDropZone` appears when `imageEntries.length > 0`.
  - No test verifies that zone 2 is absent when `imageEntries.length === 0`.
  - No test verifies that zone-2 status messages (persisting/error) appear near zone 2 when upload status changes — covered by TASK-03 test case C below.
- Extinct tests: none detected — the mock approach in `CatalogProductForm.test.tsx` is resilient to structural changes.

#### Recommended Test Approach

- Unit tests for: hook return shape (new `fileInputRef2` / `dragOver2` / `handleDrop2` / `handleFileInput2` fields present in returned object).
- Integration tests for zone 2 visibility in `CatalogProductForm.test.tsx`:
  - Test case A (zone 2 absent): base mock of `parseImageEntries` returning `[]` is already set up — assert that `data-testid="image-drop-zone-additional"` is NOT in the DOM.
  - Test case B (zone 2 present): reconfigure `parseImageEntries` mock (via `jest.mocked(...).mockReturnValueOnce(...)`) to return one entry; also update `useImageUploadController` mock to include new fields (`fileInputRef2: { current: null }`, `dragOver2: false`, `handleDragOver2: jest.fn()`, `handleDragLeave2: jest.fn()`, `handleDrop2: jest.fn()`, `handleFileInput2: jest.fn()`). Assert `data-testid="image-drop-zone-additional"` is in the DOM.
  - The `ImageDropZone` mock in `CatalogProductForm.test.tsx` renders `<div data-cy="image-drop-zone" />` prop-agnostically. Update it to render `data-testid` from the `testId` prop so zone-2 selector becomes queryable.
  - Test case C (zone-2 status feedback): configure hook mock with `uploadStatus: "error"`, `uploadError: "Image upload failed."`, and `parseImageEntries` returning one entry. Assert that a zone-2 `UploadStatusMessages`-equivalent error message appears in the DOM (rendered near `data-testid="image-drop-zone-additional"`). Note: RTL mocks prevent asserting vertical placement order — test asserts message presence, not DOM position.
- E2E tests for: not required for this scope (no behavioural logic change, only layout).

### Recent Git History (Targeted)

- `1bd76eb705` (feat: pre-slug image buffer) — added `pendingPreview` flow to `useImageUploadController`; introduced `pendingPreviewRef` pattern. Relevant: same ref pattern applies to `fileInputRef2`.
- `a3b2b5edf9` (feat: add Change button to main image card) — added `onChangeClick` to `MainImagePanel`, wiring it to `fileInputRef.current?.click()`. Zone 2 follows the same click-to-open-picker pattern.
- `b6802c9976` (feat: improve publish action feedback) — most recent form change; stable, no conflicts expected.
- `b114195a2a feat(xa-uploader): TASK-02 rewrite CatalogProductForm to single-page layout` — established the current layout order. Zone 2 is inserted into this already-settled layout.

## Questions

### Resolved

- Q: Should zone 2 use a separate `handleUpload` or the same one?
  - A: Same. The upload API, validation, and draft-update logic are identical. The only difference is which zone's file picker triggered the call.
  - Evidence: `appendImageDraftEntry()` always appends to end of pipe string; no index targeting needed.

- Q: Where does zone 2's drag state live — hook or form component?
  - A: Hook. `useDropZoneDragHandlers` is a private helper, and all reactive state (upload status, refs, drag) currently lives in the hook. Adding second drag state to the hook is consistent. Exporting `useDropZoneDragHandlers` to split the state would scatter ownership.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:265–280` — function is private to module.

- Q: Do we need new i18n keys?
  - A: No. With `hasImages=true` (always true for zone 2 since it only renders when `imageEntries.length > 0`), `ImageDropZone` naturally renders `uploadAddPhoto` as primary copy and `uploadAdditionalPhotosHint` as subtitle — both keys exist in EN and ZH.
  - Evidence: `apps/xa-uploader/src/lib/uploaderI18n.ts:358–385` and `:833–860`.

- Q: Should zone 2 show the same status messages as zone 1?
  - A: Partially. Zone 2 should show upload-specific messages (`persisting`, `persisted`, `error`) but NOT the slug-gate warning, pending-preview hint, `autosaveInlineMessage`, or `fieldErrors`. Zone 2 is only visible when there is already a slug and a main image, so those zone-1-specific messages are always false at that point anyway. Pass `hasSlug=true`, `pendingPreviewUrl=null`, `autosaveInlineMessage=null`, `fieldErrors={}` to a second `<UploadStatusMessages />` instance near zone 2.
  - Evidence: `CatalogProductForm.client.tsx:325–368` — `UploadStatusMessages` is already a standalone presentational component; safe to render twice.

- Q: Does `canUpload` need to be per-zone?
  - A: No. `canUpload = uploadStatus !== "uploading"` is global — only one upload at a time. Both zones are disabled together during an in-flight upload. This is correct behaviour.
  - Evidence: `useImageUploadController:916` — `canUpload: uploadStatus !== "uploading"`.

### Open (Operator Input Required)

None. All decisions are resolvable from code evidence and the operator spec.

## Scope Signal

- **Signal: right-sized**
- **Rationale:** Two files changed (form component + hook), one test file updated. No API, data model, or i18n changes. All building blocks exist. The operator spec is complete and leaves no architectural fork open.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Hook extension (second ref + drag state) | Yes | None | No |
| Form render changes (zone 2 insertion) | Yes | None | No |
| i18n keys | Yes | None — all keys present | No |
| Status feedback near zone 2 | Yes | `UploadStatusMessages` reuse with different props confirmed safe | No |
| Test impact (`CatalogProductForm.test.tsx` mock) | Yes | Mock must include new hook return fields; new assertions needed | No (advisory) |
| Data model impact | Yes | None — `appendImageDraftEntry` unchanged | No |
| Standalone `CatalogProductImagesFields` component | Yes | Not in active UI path; no change needed | No |

## Confidence Inputs

- **Implementation: 95%**
  - Entry points, component boundaries, and hook return shape fully traced. No ambiguous paths.
  - What raises to ≥80: already there. What raises to ≥90: already there.

- **Approach: 90%**
  - Extend hook + reuse `ImageDropZone` + reuse `UploadStatusMessages` is the lowest-risk path.
  - Minor uncertainty: decision to add drag state inside hook vs inline in form (either works, hook preferred for consistency).
  - What raises to ≥90: already there (hook ownership is consistent with existing pattern).

- **Impact: 88%**
  - Functional impact is purely additive (new UI zone); no existing behaviour changes.
  - Minor risk: operators may double-click both zones rapidly; `canUpload=false` during upload prevents queued uploads.
  - What raises to ≥90: confirm via CI that `canUpload` guard is consistent across both zones.

- **Delivery-Readiness: 95%**
  - All building blocks confirmed in code. Clear task decomposition (see seeds below). No blockers.

- **Testability: 85%**
  - RTL integration test pattern already established. Hook mock pattern in `CatalogProductForm.test.tsx` requires adding new fields.
  - What raises to ≥90: new hook mock fields + zone-2 render assertions added in same PR.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Both zones fire simultaneously (race condition on rapid clicks) | Low | Low | `canUpload=false` during upload already prevents a second upload starting; both zones share the same guard |
| Zone 2's file picker opens when zone 1 is clicked (shared ref) | Low | Medium | Each zone gets its own `fileInputRef` — this risk is the reason for the two-ref approach |
| Test mock omits new hook fields → test failures in CI | Medium | Low | Add new fields to mock in same PR as implementation |
| `UploadStatusMessages` rendered twice shows duplicate error messages | Low | Low | Both instances receive same `uploadError` string — visually near their respective zone which is correct; no logic duplication |

## Planning Constraints & Notes

- Must-follow patterns:
  - Hook (`useImageUploadController`) owns all upload and drag state.
  - `ImageDropZone` receives one new optional `testId` prop only; all other existing props and behaviour unchanged.
  - `UploadStatusMessages` is the established pattern for inline feedback; reuse it.
  - Test IDs follow `data-testid` for Jest/RTL + `data-cy` for Cypress selectors.
  - `eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id` on hardcoded test ID strings.
- Rollout/rollback expectations:
  - No feature flag needed — change is fully contained to the form render. Rollback = revert the PR.
- Observability expectations:
  - No new logging required. Upload errors and status already surface via existing UI messages.

## Suggested Task Seeds (Non-binding)

- **TASK-01**: Extend `useImageUploadController` and `ImageDropZone` for second-zone support
  - In `CatalogProductImagesFields.client.tsx`:
    - Add optional `testId?: string` prop to `ImageDropZone` (defaulting to `"image-drop-zone"`). Used for zone-2's distinct test selector.
    - Add `fileInputRef2: useRef<HTMLInputElement>(null)`, `dragOver2`/`setDragOver2`, and a second `useDropZoneDragHandlers(setDragOver2)` call inside `useImageUploadController`. Return `fileInputRef2`, `dragOver2`, `handleDragOver2`, `handleDragLeave2`, `handleDrop2` (clears `dragOver2`, calls `handleUpload`), `handleFileInput2` (same as `handleFileInput` — reads file and calls `handleUpload`).

- **TASK-02**: Render zone 2 in `CatalogProductForm`
  - Destructure new hook fields. Conditionally render zone 2 immediately before `<AdditionalImagesPanel />` when `imageEntries.length > 0`:
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
  - The parent-level drag container (`onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}` at line 512–517) remains unchanged (zone 1 fallback). Zone 2's `ImageDropZone` button calls `stopPropagation()` in its drag handlers, so dragging directly over zone 2 does not trigger zone 1's state.

- **TASK-03**: Update `CatalogProductForm.test.tsx`
  - Add new hook return fields to the `useImageUploadController` mock.
  - Add tests: zone-2 absent when `imageFiles` empty; zone-2 present when `imageFiles` has entries.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Zone 2 renders above `AdditionalImagesPanel` when `imageEntries.length > 0`. (Placement is verified by code review of render order; RTL mocks assert presence/absence only — not DOM position.)
  - Zone 2 absent when no images uploaded.
  - Both zones share upload behaviour; only one upload in flight at a time.
  - Inline status messages appear near zone 2 after upload from zone 2.
  - All existing tests pass; new zone-2 tests pass.
- Post-delivery measurement plan: manual smoke test in xa-uploader dev instance.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `useDropZoneDragHandlers` is not exported — design decision to extend hook resolved.
- Confirmed `UploadStatusMessages` is a local component (not imported from image fields) — safe to render twice.
- Confirmed no i18n additions needed — all keys present in both locales.
- Confirmed hook's only caller in the active UI is `CatalogProductForm` (standalone `CatalogProductImagesFields` is a secondary path not actively rendered).

### Confidence Adjustments

- Implementation raised from 88% → 95% after confirming `UploadStatusMessages` component location and prop contract (lines 325–368).
- Testability raised from 80% → 85% after confirming `jest.mock` shape in `CatalogProductForm.test.tsx` (mock returns an object literal easily extended with new fields).

### Remaining Assumptions

- None. `useImageUploadController` callers confirmed via grep: exactly two call sites, both within xa-uploader — `CatalogProductForm.client.tsx:461` and `CatalogProductImagesFields.client.tsx:970`.

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-uploader-dual-upload-zones --auto`
