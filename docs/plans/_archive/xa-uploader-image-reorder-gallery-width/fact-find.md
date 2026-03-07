---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-image-reorder-gallery-width
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-image-reorder-gallery-width/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# XA Uploader Image Reorder + Gallery Width Fact-Find Brief

## Scope

### Summary

The xa-uploader image management step has two UX gaps: (1) operators cannot reorder images once uploaded — the only option is delete-and-re-upload to change sequence — and (2) the gallery and upload panel are constrained inside `max-w-prose` (~65ch), wasting viewport width in a desktop operator tool where seeing images at full size matters.

### Goals

- Add image reorder controls (up/down buttons) to `CatalogProductImagesFields.client.tsx` so operators can change image sequence without deleting and re-uploading
- Persist reordered image state through the existing autosave mechanism (`onImageUploaded` → `handleSaveWithDraft`)
- Remove the `max-w-prose mx-auto` constraint from the images step wrapper and replace with a full-width layout appropriate for an operator desktop tool

### Non-goals

- Drag-to-reorder (not appropriate for this tool — see evidence below)
- Changes to image upload, delete, or role-assignment logic
- Changes to the draft schema data format (`imageFiles|imageRoles|imageAltTexts` pipe-separated strings remain unchanged)
- Changes to any API route or contract service

### Constraints & Assumptions

- Constraints:
  - No new npm dependencies (`@dnd-kit` is not present and adding it is out of scope)
  - Design tokens must use `gate-*` prefix (catalogStyles.ts is the source of truth for button classes)
  - Up/down button classes must come from `BTN_SECONDARY_CLASS` or a new catalogStyles entry — no inline arbitrary Tailwind
  - The `onChange` + `onImageUploaded` save path must be called for every reorder operation, identical to how removal is handled
  - xa-uploader uses webpack (not Turbopack) — no module alias constraints apply
  - `CatalogProductForm.test.tsx` mocks `CatalogProductImagesFields` entirely (`data-cy="images-fields"` div stub) — new unit tests for reorder logic go inside `CatalogProductImagesFields.client.tsx` or a new `__tests__/CatalogProductImagesFields.test.tsx`; tests run in CI only
  - eslint disable comment pattern `// eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid` must be preserved if changing grid layout

- Assumptions:
  - Up/down reorder buttons are the correct approach for a desktop operator tool (keyboard accessible, no drag library, works with keyboard/mouse)
  - Full-width gallery layout can be achieved by removing `max-w-prose mx-auto` and replacing with `w-full` or no wrapper class
  - The grid column count can increase from `grid-cols-2 sm:grid-cols-3` to e.g. `sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` now that width is unconstrained
  - No layout regression in the upload drop zone or required roles checklist (they remain inside whatever container replaces `max-w-prose`)

## Outcome Contract

- **Why:** xa-uploader UI review found that operators must delete and re-upload images to change sequence, and the gallery is constrained to `max-w-prose` despite being a desktop tool where full-width image review is more useful.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators can reorder images using up/down controls in the images step, with order persisted automatically; the gallery renders at full width with more columns visible per row.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — the image step component rendered by `CatalogProductForm.client.tsx` when `step === "images"`
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:336` — renders `<CatalogProductImagesFields onImageUploaded={onSaveWithDraft} />`

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — contains `ImageGallery`, `useImageUploadController`, `handleRemoveImage`, `appendImageDraftEntry`, `removePipeEntry`. **This is the only file that needs to change for both features.**
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:623` — `handleSaveWithDraft` sets `pendingAutosaveDraftRef.current = nextDraft` and calls `flushAutosaveQueue()`. This is the persistence path.
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:54` — `parseImageTuples` and `mergeAutosaveImageTuples` operate on pipe-separated `imageFiles|imageRoles|imageAltTexts`. Order in the array is meaningful and is preserved through the merge logic.
- `apps/xa-uploader/src/components/catalog/catalogStyles.ts` — `BTN_SECONDARY_CLASS`, `BTN_DANGER_CLASS` are the correct button tokens for reorder controls.
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` — draft snapshot stored/retrieved as `CatalogProductDraftInput[]`; image fields are pipe-strings, order is preserved as-is.
- `packages/lib/src/xa/catalogAdminSchema.ts:113` — schema: `imageFiles: z.string().optional()`, `imageRoles: z.string().optional()`, `imageAltTexts: z.string().optional()`. No structural change needed — order is implicit in pipe position.

### Patterns & Conventions Observed

- **Pipe-string image storage**: Images stored as `"path1|path2|path3"` for `imageFiles`, parallel arrays for `imageRoles` and `imageAltTexts`. Position index is the implicit order. Reorder = reorder all three pipe strings in lockstep.
- **No drag library**: `@dnd-kit` is absent from `apps/xa-uploader/package.json`. No drag-reorder infrastructure exists.
- **Drop-zone drag handlers already defined**: `useDropZoneDragHandlers` handles file-drop drag events — unrelated to image reorder drag. The naming distinction must be preserved.
- **`onImageUploaded` is the autosave trigger**: Both `handleUpload` (line 632) and `handleRemoveImage` (line 693) call `onImageUploaded(nextDraft)` after mutating the draft. Any reorder handler must follow the identical pattern.
- **`onChange` is called first, then `onImageUploaded`**: Lines 631-632 show `onChange(nextDraft); onImageUploaded(nextDraft);` — this pattern must be followed for reorder.
- **`max-w-prose mx-auto` wrapper**: Line 776: `<div className="mx-auto mt-8 max-w-prose space-y-4">` — this wraps the entire images step including the role selector, required roles checklist, drop zone, status messages, and gallery.
- **eslint disable on thumbnail grid**: Line 462 has `{/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid */}`.
- **ESLint disable on container**: Line 775: `{/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form */}` — this comment will need to be removed or updated when `max-w-prose` is removed.

### Data & Contracts

- Types/schemas/events:
  - `ImageEntry = { path: string; role: string; filename: string }` — local type, not persisted directly
  - `CatalogProductDraftInput.imageFiles: string | undefined` — pipe-separated paths
  - `CatalogProductDraftInput.imageRoles: string | undefined` — pipe-separated roles (same position)
  - `CatalogProductDraftInput.imageAltTexts: string | undefined` — pipe-separated alt texts (same position)
  - Schema validation at `catalogAdminSchema.ts:195` checks `imageRoles.length === imageFiles.length` — reorder must maintain parity
- Persistence:
  - Draft saved via `POST /api/catalog/products` in `handleSaveImpl`
  - `mergeAutosaveImageTuples` in `catalogConsoleActions.ts:70` merges server and local image tuples by file key, respecting removals against a baseline. Order of local tuples is preserved in the merge.
- API/contracts:
  - No API changes needed — reorder is a pure client-side pipe-string manipulation before autosave flush

### Dependency & Impact Map

- Upstream dependencies:
  - `CatalogProductForm.client.tsx` passes `onSaveWithDraft` as `onImageUploaded` prop — no interface change needed
  - `handleSaveWithDraft` in `useCatalogConsole.client.ts` — called unchanged
- Downstream dependents:
  - Autosave queue (`flushAutosaveQueue`) consumes the reordered draft — no change needed
  - `mergeAutosaveImageTuples` handles order via positional merge (local tuples order is authoritative for files present locally)
- Likely blast radius:
  - Changes confined to `CatalogProductImagesFields.client.tsx` only
  - No API, schema, or contract changes
  - `CatalogProductForm.test.tsx` is unaffected (mocks the component entirely)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: `pnpm test:local` (CI only — never run locally)
- CI integration: reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CatalogProductImagesFields | None | — | Component is mocked in CatalogProductForm.test.tsx; no direct unit tests exist |
| Image upload flow | None | — | No test covers the upload/remove/autosave flow in the images component |
| ImageGallery rendering | None | — | Not tested |
| Autosave integration | Integration | `useCatalogConsole-domains.test.tsx` | Tests autosave state transitions but not image-specific operations |

#### Coverage Gaps

- No unit tests for `ImageGallery`, `useImageUploadController`, `parseImageEntries`, `removePipeEntry`, `appendImageDraftEntry`
- A new `reorderPipeEntry` utility function (needed for implementation) will also be untested initially

#### Recommended Test Approach

- Unit tests for: `reorderPipeEntry` pure function (move index up/down, boundary conditions — first item cannot move up, last cannot move down)
- Integration tests for: reorder button click → draft mutation → `onImageUploaded` called with correct reordered draft
- E2E tests for: not required for this change

### Recent Git History (Targeted)

- `CatalogProductImagesFields.client.tsx` — last touched in `feat(xa-uploader): autosave queue flush + conflict retry + sync gating (TASK-01/02/03/04)` and `feat(xa-uploader): auto-save after image upload + align image roles with schema`
- No recent reorder or gallery-width work — clean slate for this feature

## Access Declarations

None — all evidence is from local codebase files, no external services required for this fact-find.

## Questions

### Resolved

- Q: Is `@dnd-kit` or any drag-reorder library already a dependency?
  - A: No. `apps/xa-uploader/package.json` lists no `@dnd-kit` or similar. Up/down buttons are the correct choice.
  - Evidence: `apps/xa-uploader/package.json` — dependencies section contains no drag library.

- Q: Does image order need to be stored differently in the draft schema, or is the pipe-string position sufficient?
  - A: Pipe-string position is sufficient. The schema (`catalogAdminSchema.ts`) and `mergeAutosaveImageTuples` both operate positionally. No schema change needed.
  - Evidence: `catalogConsoleActions.ts:54-113` — `parseImageTuples` uses positional index; merge preserves local tuple order.

- Q: What save path does reorder need to follow?
  - A: Same as upload and remove: call `onChange(nextDraft)` then `onImageUploaded(nextDraft)`. `onImageUploaded` is wired to `handleSaveWithDraft` which enqueues the draft for autosave.
  - Evidence: `CatalogProductImagesFields.client.tsx:631-632` (upload) and `691-693` (remove).

- Q: Where exactly does `max-w-prose` appear and what does it wrap?
  - A: Line 776: `<div className="mx-auto mt-8 max-w-prose space-y-4">` — wraps the entire images step output including role selector, checklist, drop zone, status messages, and `ImageGallery`. The eslint disable comment at line 775 (`ds/container-widths-only-at`) must be removed or replaced.
  - Evidence: `CatalogProductImagesFields.client.tsx:774-817`.

- Q: Is up/down or drag-to-reorder more appropriate for this operator tool?
  - A: Up/down buttons. The tool uses webpack (not Turbopack), has no drag library, is a desktop-only internal operator tool where accessibility and keyboard control matter more than drag UX. Adding `@dnd-kit` would be a dependency addition out of scope. Up/down buttons are simpler, fully keyboard accessible, and consistent with the existing button patterns in catalogStyles.ts.
  - Evidence: `package.json` (no drag lib), dispatch constraints (no new deps), `catalogStyles.ts` (BTN_SECONDARY_CLASS available).

### Open (Operator Input Required)

None. All questions resolved from evidence.

## Confidence Inputs

- Implementation: 95% — entry points, mutation pattern, save hook, and layout constraint all confirmed from source code.
- Approach: 92% — up/down buttons with pipe-string reorder is unambiguous; no alternative approach is more appropriate given constraints.
- Impact: 88% — operator UX improvement is clear; no risk of data loss or API breakage.
- Delivery-Readiness: 95% — all evidence present, single-file implementation, no new dependencies, no schema changes.
- Testability: 80% — `reorderPipeEntry` pure function is trivially testable; full component integration test requires test infrastructure setup.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `mergeAutosaveImageTuples` treats reorder as a no-op because file keys are the same | Low | High | Verify: merge preserves local order for files already present in server snapshot (line 96-101 of catalogConsoleActions.ts confirms local tuple overwrites server tuple at same index, but order of iteration is server-first). To be safe, the reorder call to `onImageUploaded` should set a fresh draft so the autosave flush sends the updated pipe order. |
| ESLint `ds/container-widths-only-at` disable comment removal breaks lint | Low | Low | Remove the comment and the `mx-auto max-w-prose` class together; lint will pass since the constraint is no longer applied. |
| Up/down buttons in the thumbnail card become too small on the aspect-[4/5] card | Low | Low | Use `min-h-11 min-w-11` pattern (already used on remove button line 495) to ensure touch target size. |
| Pipe-string reorder of `imageAltTexts` is missed | Medium | Medium | Implementation must reorder all three pipe strings in lockstep (files, roles, alts). The `reorderPipeEntry` utility must operate on all three. |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Pipe-string storage format and reorder mechanism | Yes | None | No |
| `onImageUploaded` → autosave save path | Yes | None | No |
| `max-w-prose` constraint location and scope | Yes | None | No |
| Dependency check (`@dnd-kit`) | Yes | None | No |
| Schema validation parity after reorder | Yes | Parallel arrays must stay in sync | Noted in implementation constraints — no blocker |
| Test landscape for images component | Yes | No existing tests for images component | Advisory — new tests recommended but not a blocker |
| `mergeAutosaveImageTuples` order preservation | Partial | Server-first iteration could theoretically overwrite local order | Low risk — local tuples overwrite at existing indexes, new ones append |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** Two clearly bounded changes to a single file (`CatalogProductImagesFields.client.tsx`): (1) a `reorderPipeEntry` utility + up/down controls in `ImageGallery` wired to `onImageUploaded`; (2) remove `max-w-prose mx-auto` from the wrapper div and update the grid column count. No API, schema, contract, or dependency changes required.

## Evidence Gap Review

### Gaps Addressed

- `@dnd-kit` presence confirmed absent — up/down button approach confirmed
- `onImageUploaded` prop wiring from `CatalogProductForm.client.tsx` confirmed at line 344
- `max-w-prose` wrapper confirmed at line 776, with eslint disable comment at line 775 that must be removed
- Pipe-string order as implicit image order confirmed throughout `catalogConsoleActions.ts` and `catalogAdminSchema.ts`
- Schema validation of role/alt parity confirmed — reorder must operate on all three fields

### Confidence Adjustments

- No adjustments needed — evidence is comprehensive and unambiguous for both sub-tasks

### Remaining Assumptions

- `mergeAutosaveImageTuples` will preserve reordered local order correctly — assessed as low risk based on code reading but not verified through a test run (tests run in CI only)
- Wider gallery grid (`md:grid-cols-4 lg:grid-cols-5`) will be aesthetically correct at expected viewport widths — operator desktop tool assumption, no viewport data available

## Planning Constraints & Notes

- Must-follow patterns:
  - Button classes from `BTN_SECONDARY_CLASS` in `catalogStyles.ts`
  - `onChange(nextDraft)` then `onImageUploaded(nextDraft)` call sequence for any draft mutation
  - eslint disable comment pattern `// eslint-disable-next-line <rule> -- XAUP-0001 <reason>` for any new layout overrides
  - New pure utility `reorderPipeEntry(pipeStr: string, fromIndex: number, toIndex: number): string` should be co-located with `removePipeEntry` in the same file
- Rollout/rollback expectations:
  - Single file change, trivially revertable
  - No data migration — pipe-string format unchanged
- Observability expectations:
  - None required — operator UI change with no server-side effects

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `reorderPipeEntry` utility, `handleReorderImage` handler in `useImageUploadController`, and up/down buttons in `ImageGallery` (wired to `onImageUploaded`)
- TASK-02: Remove `max-w-prose mx-auto` from outer wrapper div, update grid to wider column count, remove stale eslint disable comment
- TASK-03: Add unit tests for `reorderPipeEntry` (boundary conditions: first/last item, mid-item)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `CatalogProductImagesFields.client.tsx` modified with reorder controls and wider gallery
  - No API, schema, or contract files changed
  - Typecheck and lint pass locally
  - Tests pass in CI
- Post-delivery measurement plan: None required for operator tool UX change

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-image-reorder-gallery-width --auto`
