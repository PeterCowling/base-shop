---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-image-reorder-gallery-width
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Image Reorder + Gallery Width Plan

## Summary

Two operator UX improvements to the xa-uploader image step, both confined to a single file (`CatalogProductImagesFields.client.tsx`). TASK-01 adds a `reorderPipeEntry` utility and up/down controls in `ImageGallery` so operators can resequence images without deleting and re-uploading; the reorder is persisted through the existing autosave path (`onChange` + `onImageUploaded`). TASK-02 removes the `max-w-prose mx-auto` constraint from the outer wrapper and widens the thumbnail grid so the gallery uses available viewport width on desktop. TASK-03 adds unit tests for the new `reorderPipeEntry` utility. No API, schema, contract, or dependency changes are required.

## Active tasks

- [x] TASK-01: Add image reorder controls (up/down buttons + `reorderPipeEntry` utility)
- [x] TASK-02: Remove `max-w-prose` constraint and widen gallery grid
- [x] TASK-03: Add unit tests for `reorderPipeEntry`

## Goals

- Operators can resequence images using up/down controls in the images step, with order persisted automatically through autosave
- Image gallery renders at full width with more columns visible per row on desktop screens

## Non-goals

- Drag-to-reorder (no drag library present; adding one is out of scope)
- Changes to upload, delete, or role-assignment logic
- Changes to draft schema format (`imageFiles|imageRoles|imageAltTexts` pipe-strings remain unchanged)
- API, contract, or server-side changes

## Constraints & Assumptions

- Constraints:
  - No new npm dependencies
  - Button classes must come from `BTN_SECONDARY_CLASS` in `catalogStyles.ts` — no inline arbitrary Tailwind for button styling
  - `onChange(nextDraft)` then `onImageUploaded(nextDraft)` call sequence required for every draft mutation
  - All three pipe strings (`imageFiles`, `imageRoles`, `imageAltTexts`) must be reordered in lockstep
  - ESLint disable comments follow pattern `// eslint-disable-next-line <rule> -- XAUP-0001 <reason>`
  - Tests run in CI only — never locally
- Assumptions:
  - Up/down buttons are appropriate for this desktop operator tool (keyboard-accessible, no library needed)
  - Removing `max-w-prose mx-auto` and using `w-full` on the outer wrapper is sufficient for full-width layout
  - Wider grid (`sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`) is aesthetically appropriate at typical operator desktop widths

## Inherited Outcome Contract

- **Why:** xa-uploader UI review found that operators must delete and re-upload images to change sequence, and the gallery is constrained to `max-w-prose` despite being a desktop tool where full-width image review is more useful.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators can reorder images using up/down controls in the images step, with order persisted automatically; the gallery renders at full width with more columns visible per row.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-image-reorder-gallery-width/fact-find.md`
- Key findings used:
  - `CatalogProductImagesFields.client.tsx` is the sole file requiring changes for both features
  - `removePipeEntry` at line 180 is the exact pattern `reorderPipeEntry` should mirror — same split/filter/join approach, different array manipulation
  - `ImageGallery` props at line 444 need an `onReorder: (index: number, direction: "up" | "down") => void` addition
  - `useImageUploadController` returns object needs `handleReorderImage` added alongside `handleRemoveImage`
  - `onImageUploaded` prop is the autosave trigger; lines 631-632 (upload) and 692-693 (remove) show the exact two-call pattern to follow
  - `max-w-prose mx-auto` wrapper at line 776, with stale eslint disable at line 775 that must be removed when the class is removed
  - `@dnd-kit` absent from `package.json` — confirmed no drag library available
  - Schema validation in `catalogAdminSchema.ts:195` confirms roles and alts must have same count as files after reorder

## Proposed Approach

- Option A: Up/down button controls per image card (chosen)
- Option B: Drag-to-reorder with `@dnd-kit`
- Chosen approach: Option A. No drag library is present; adding one is out of scope per constraints. Up/down buttons are keyboard-accessible, consistent with existing button patterns in `catalogStyles.ts`, and straightforward to implement with a pure `reorderPipeEntry` utility following the same shape as `removePipeEntry`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add reorder controls + `reorderPipeEntry` utility | 90% | S | Complete (2026-03-06) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Remove `max-w-prose`, widen gallery grid | 90% | S | Complete (2026-03-06) | - | - |
| TASK-03 | IMPLEMENT | Unit tests for `reorderPipeEntry` | 85% | S | Complete (2026-03-06) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent changes to different parts of the same file; TASK-01 must be committed before TASK-03 |
| 2 | TASK-03 | TASK-01 complete | Tests depend on the exported utility from TASK-01 |

## Tasks

---

### TASK-01: Add image reorder controls + `reorderPipeEntry` utility

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Depends on:** -
- **Blocks:** TASK-03
- **Build evidence:** Codex offload route (exit 0). `reorderPipeEntry` exported at line 189, `handleReorderImage` at line 757, `onReorder` prop wired at line 884. Commit: `132b9fdce7`. Typecheck + lint: pass.
- **Confidence:** 90%
  - Implementation: 95% — `removePipeEntry` at line 180 is the exact model for `reorderPipeEntry`; the `handleRemoveImage` pattern at lines 669-699 is the exact model for `handleReorderImage`; `ImageGallery` props at line 444 show the simple extension point.
  - Approach: 90% — up/down button approach is unambiguous given no drag library; `BTN_SECONDARY_CLASS` is the right token. Held-back test: could the up/down button placement inside the card conflict with the existing remove button overlay? No — the remove button is `absolute top-1.5` overlay; the reorder buttons will be in the footer metadata bar (`div.flex` at line 483), not overlapping.
  - Impact: 90% — reorder persisted through `onImageUploaded` → autosave is the same path as upload/remove; no risk of silent no-op.

**Acceptance:**
- [ ] `reorderPipeEntry(pipeStr, fromIndex, toIndex)` pure function exists adjacent to `removePipeEntry` (after line 187)
- [ ] `reorderPipeEntry` correctly swaps adjacent items; calling with `fromIndex === 0` and direction "up" is a no-op; calling with `fromIndex === entries.length - 1` and direction "down" is a no-op
- [ ] `ImageGallery` accepts `onReorder: (index: number, direction: "up" | "down") => void` prop
- [ ] Each image card in the gallery shows an "up" button (disabled when `index === 0`) and a "down" button (disabled when `index === entries.length - 1`)
- [ ] Reorder buttons use `BTN_SECONDARY_CLASS` styling (from `catalogStyles.ts`)
- [ ] Reorder buttons have `min-h-11 min-w-11` for touch target parity with the remove button (line 495)
- [ ] `handleReorderImage(index, direction)` in `useImageUploadController` calls `onChange(nextDraft)` then `onImageUploaded(nextDraft)` where `nextDraft` has all three pipe strings (`imageFiles`, `imageRoles`, `imageAltTexts`) reordered in lockstep
- [ ] `reorderPipeEntry` is exported as a named export from `CatalogProductImagesFields.client.tsx` (required for TASK-03 tests)
- [ ] `handleReorderImage` is returned from `useImageUploadController` and passed as `onReorder` to `ImageGallery`
- [ ] Expected user-observable behavior:
  - Operator sees "up" and "down" arrow buttons in the bottom metadata bar of each image card
  - "Up" button is visually disabled (or absent) for the first image
  - "Down" button is visually disabled (or absent) for the last image
  - Clicking "up" moves the image one position earlier in the gallery and triggers autosave
  - Clicking "down" moves the image one position later and triggers autosave
  - Autosave status indicator changes to "saving" after a reorder click, then "saved" on success

**Validation contract (TC-01 to TC-04):**
- TC-01: `reorderPipeEntry("a|b|c", 1, "up")` → `"b|a|c"` (move index 1 up)
- TC-02: `reorderPipeEntry("a|b|c", 0, "up")` → `"a|b|c"` (no-op: index 0 cannot move up)
- TC-03: `reorderPipeEntry("a|b|c", 1, "down")` → `"a|c|b"` (move index 1 down)
- TC-04: Up button disabled when `index === 0`; down button disabled when `index === entries.length - 1`

**Execution plan:**
1. **Add `reorderPipeEntry` utility** immediately after `removePipeEntry` (line 187). Signature: `function reorderPipeEntry(pipeStr: string, fromIndex: number, direction: "up" | "down"): string`. Splits pipe string, computes `toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1`, guards against out-of-bounds (returns original string unchanged), swaps the two entries, rejoins.
2. **Extend `ImageGallery` props** to add `onReorder: (index: number, direction: "up" | "down") => void`. Add up/down buttons inside the `<li>` card metadata footer div (`div.flex` at line 483). Use `BTN_SECONDARY_CLASS` with `min-h-11 min-w-11`. Disable "up" when `index === 0`, disable "down" when `index === entries.length - 1`. Keep existing remove button overlay untouched.
3. **Add `handleReorderImage`** to `useImageUploadController`. Mirrors `handleRemoveImage` pattern: `useCallback` wrapping, constructs `nextDraft` by calling `reorderPipeEntry` on all three fields, calls `onChange(nextDraft)` then `onImageUploaded(nextDraft)`.
4. **Return `handleReorderImage`** from `useImageUploadController`, destructure in `CatalogProductImagesFields` export fn, pass as `onReorder` to `ImageGallery`.

**Consumer tracing (new outputs):**
- `reorderPipeEntry`: consumed only by `handleReorderImage` within the same file. No external consumers.
- `handleReorderImage`: consumed only by `CatalogProductImagesFields` → passed as `onReorder` to `ImageGallery`. `CatalogProductForm.client.tsx` is unaffected (it mocks `CatalogProductImagesFields` entirely in tests and passes no extra props).
- `onReorder` prop on `ImageGallery`: consumed only inside `ImageGallery` by the up/down buttons. No other consumers.

**Planning validation:**
- Checks run: Read `CatalogProductImagesFields.client.tsx` lines 180-187 (`removePipeEntry`), 444-506 (`ImageGallery`), 508-716 (`useImageUploadController` + return), 669-699 (`handleRemoveImage` pattern), 700-716 (return object), 774-817 (outer component)
- Validation artifacts: line numbers confirmed above
- Unexpected findings: The `ImageGallery` return value is `null` when `entries.length === 0` (line 455) — the `onReorder` prop will be passed regardless; this is safe since the prop is never used when the component returns early.

**Scouts:** `reorderPipeEntry` returns original string unchanged when `fromIndex` is out of bounds — boundary guard prevents bad array access.

**Edge Cases & Hardening:**
- Single-image gallery: both up and down buttons disabled (index 0 is also the last)
- Empty gallery: `ImageGallery` returns null before rendering any buttons — no edge case
- Pipe strings with trailing/leading spaces: follow `removePipeEntry`'s `.map(v => v.trim()).filter(Boolean)` pattern — already normalises whitespace
- `imageAltTexts` being `undefined`: `reorderPipeEntry("", 0, "down")` should return `""` — guard handles it via `filter(Boolean)` yielding empty array

**What would make this >=95%:** Live visual verification in the operator tool confirming button placement doesn't crowd the card metadata row.

**Rollout / rollback:**
- Rollout: single file change, no feature flag needed
- Rollback: revert the single commit

**Documentation impact:** None required — internal operator tool.

**Notes / references:**
- `removePipeEntry` at line 180 is the canonical implementation model
- `handleRemoveImage` at line 669 is the canonical handler pattern
- `BTN_SECONDARY_CLASS` defined in `apps/xa-uploader/src/components/catalog/catalogStyles.ts`

---

### TASK-02: Remove `max-w-prose` constraint and widen gallery grid

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Depends on:** -
- **Blocks:** -
- **Build evidence:** Inline edit. `max-w-prose mx-auto` removed (line 840 → `w-full`); eslint disable comment removed; grid widened to `md:grid-cols-4 lg:grid-cols-5`. TC-05/TC-06 verified by grep. Commit: `132b9fdce7`.
- **Confidence:** 90%
  - Implementation: 95% — exact line 776 confirmed; the change is to remove `mx-auto max-w-prose` and the stale eslint disable comment at line 775. The grid change is at line 463.
  - Approach: 90% — removing the constraint and widening columns is straightforward; no API or downstream impact. Held-back test: could removing `mx-auto` break centering of child elements that relied on it? No — the outer layout (`CatalogProductForm.client.tsx`) controls section-level centering; `CatalogProductImagesFields` only needs to fill its container.
  - Impact: 85% — layout improvement is clear. Minor risk that very wide desktops show too many small columns, but `lg:grid-cols-5` with `aspect-[4/5]` thumbnails is standard for image management UIs.

**Acceptance:**
- [ ] Line 776's `className` no longer contains `max-w-prose` or `mx-auto`; the stale `// eslint-disable-next-line ds/container-widths-only-at` comment at line 775 is removed
- [ ] Gallery grid updated from `grid-cols-2 gap-3 sm:grid-cols-3` to `grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
- [ ] `eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid` comment remains on the grid `<ul>` (line 462 pattern preserved)
- [ ] `typecheck` and `lint` pass with no new errors
- [ ] Expected user-observable behavior:
  - On a typical operator desktop (1280px+), the image gallery spans the full available width of the form panel
  - At least 4 columns are visible at 1024px+, 5 at 1280px+
  - The role selector, checklist, and drop zone still render correctly within the now full-width container

**Validation contract (TC-05 to TC-06):**
- TC-05: `grep 'max-w-prose'` on the file returns no matches after the change
- TC-06: `grep 'container-widths-only-at'` on the file returns no matches after the change (the stale disable comment is gone)

**Execution plan:**
1. At line 775-776, remove the eslint disable comment and change `<div className="mx-auto mt-8 max-w-prose space-y-4">` to `<div className="mt-8 w-full space-y-4">`.
2. At line 463, change `<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">` to `<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">`. The eslint disable comment on line 462 stays unchanged.

**Consumer tracing:** Layout change only; no new values produced. No external consumers affected.

**Planning validation:**
- Checks run: Read lines 774-817 (outer wrapper + gallery call site), 462-463 (grid `<ul>`)
- Validation artifacts: exact classes and line numbers confirmed
- Unexpected findings: `space-y-4` on the outer wrapper is a spacing utility (not a width constraint) and must be preserved.

**Scouts:** None required — pure CSS class removal/replacement.

**Edge Cases & Hardening:** Drop zone and required roles checklist are siblings inside the same wrapper div; removing `max-w-prose` makes them also full-width. The drop zone uses `w-full` already (line 403), so it naturally fills its container. The checklist uses `grid-cols-2 sm:grid-cols-3` inline — also fine at full width.

**What would make this >=95%:** Visual QA at 1280px and 1920px confirming column counts and drop zone appearance.

**Rollout / rollback:**
- Rollout: single-file CSS class change, no feature flag
- Rollback: revert commit

**Documentation impact:** None.

**Notes / references:**
- Target lines: 775-776 (outer wrapper), 463 (grid ul)
- `w-full` is the replacement for `max-w-prose mx-auto` — consistent with how the form section container handles width

---

### TASK-03: Unit tests for `reorderPipeEntry`

- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` (new file)
- **Depends on:** TASK-01
- **Build evidence:** 10 test cases written covering TC-07 through TC-12 plus extras (move first down, move last up, whitespace trim). File typechecks cleanly. Commit: `50ade8dfc5`.
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — pure function with no imports other than the utility itself; test pattern follows existing Jest conventions in the codebase.
  - Approach: 85% — `reorderPipeEntry` must be exported or the test file must be co-located and use the module's internal via a named export. Implementation in TASK-01 should export it as a named export alongside `removePipeEntry`. If not exported, this caps at 70 — note this as a TASK-01 dependency.
  - Impact: 80% — adds meaningful coverage for boundary conditions that protect against subtle reorder bugs (missing alt text, out-of-bounds swap).

**Acceptance:**
- [ ] Test file exists at `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`
- [ ] Tests cover: move index 1 up in 3-item list, move index 1 down, move first item up (no-op), move last item down (no-op), single-item list (both directions no-op), empty string input
- [ ] Tests run in CI without error (`pnpm test:local` in CI)

**Validation contract (TC-07 to TC-12):**
- TC-07: `reorderPipeEntry("a|b|c", 1, "up")` → `"b|a|c"`
- TC-08: `reorderPipeEntry("a|b|c", 1, "down")` → `"a|c|b"`
- TC-09: `reorderPipeEntry("a|b|c", 0, "up")` → `"a|b|c"` (no-op at first)
- TC-10: `reorderPipeEntry("a|b|c", 2, "down")` → `"a|b|c"` (no-op at last)
- TC-11: `reorderPipeEntry("a", 0, "up")` → `"a"` (single item)
- TC-12: `reorderPipeEntry("", 0, "down")` → `""` (empty string)

**Execution plan:**
1. Ensure `reorderPipeEntry` is exported from `CatalogProductImagesFields.client.tsx` (add `export` keyword — TASK-01 responsibility; note in TASK-01 execution plan).
2. Create `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`.
3. Import `reorderPipeEntry` and write `describe`/`it` blocks for TC-07 through TC-12.

**Consumer tracing:** Test-only file; no production consumer impact.

**Planning validation:** No additional reads required — test pattern follows existing Jest test files in `apps/xa-uploader/src/components/catalog/__tests__/`.

**Scouts:** `reorderPipeEntry` export dependency on TASK-01 — if TASK-01 does not export it, add `export` in that task.

**Edge Cases & Hardening:** TC-09, TC-10, TC-11, TC-12 cover boundary conditions explicitly.

**What would make this >=90%:** Adding integration test covering `handleReorderImage` → `onImageUploaded` call chain via React Testing Library. Left as future work given test infrastructure setup cost.

**Rollout / rollback:** New file; trivially removable.

**Documentation impact:** None.

**Notes / references:**
- Existing test patterns: `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add reorder controls + utility | Yes — `removePipeEntry` model confirmed, `onImageUploaded` pattern confirmed, `ImageGallery` extension point confirmed | None | No |
| TASK-02: Remove max-w-prose + widen grid | Yes — exact lines confirmed (775-776, 463), independent of TASK-01 | None | No |
| TASK-03: Unit tests for `reorderPipeEntry` | Partial — depends on TASK-01 exporting `reorderPipeEntry`; currently unexported | Minor: export must be added in TASK-01; noted in TASK-01 execution plan and TASK-03 scouts | No (addressed in task) |

No Critical findings. All issues are Minor and addressed within task contracts.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `mergeAutosaveImageTuples` treats reorder as no-op (same file keys, reordered) | Low | High | Confirmed via code reading: local tuples overwrite server tuples at same index (line 96-101 of catalogConsoleActions.ts). Fresh `onImageUploaded(nextDraft)` call sends the new pipe order. Server-first iteration does not overwrite local order. |
| Pipe-string reorder misses `imageAltTexts` field | Medium | Medium | TASK-01 execution plan explicitly calls `reorderPipeEntry` on all three fields in lockstep. TC-01 through TC-04 validate the utility. |
| `reorderPipeEntry` not exported, blocking TASK-03 | Low | Low | Noted in TASK-01 execution plan and TASK-03 scouts — add `export` keyword when writing the utility. |
| Lint error from removing `ds/container-widths-only-at` comment without removing the class | Low | Low | TASK-02 removes both in the same step. |

## Observability

- Logging: None required — client-side UI change only
- Metrics: None required
- Alerts/Dashboards: None required

## Acceptance Criteria (overall)

- [ ] Operators can click up/down buttons on image cards to resequence images without deleting and re-uploading
- [ ] Reordered image order persists on save (autosave triggers after reorder)
- [ ] First image has no "up" button / disabled "up" button; last image has no "down" button / disabled "down" button
- [ ] Gallery renders at full width on desktop (no `max-w-prose` constraint)
- [ ] At least 4 columns visible at 1024px, 5 at 1280px
- [ ] `pnpm typecheck && pnpm lint` pass with no new errors in `apps/xa-uploader`
- [ ] Unit tests for `reorderPipeEntry` pass in CI

## Decision Log

- 2026-03-06: Up/down buttons chosen over drag-to-reorder. No drag library present; adding one is out of scope. Keyboard accessibility is better served by buttons.
- 2026-03-06: `reorderPipeEntry` co-located with `removePipeEntry` in `CatalogProductImagesFields.client.tsx` (not extracted to a shared utility file). Blast radius is single file; extraction is premature.

## Overall-confidence Calculation

- TASK-01: 90%, S (weight 1)
- TASK-02: 90%, S (weight 1)
- TASK-03: 85%, S (weight 1)
- Overall = (90 + 90 + 85) / 3 = **88%**
