---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: xa-uploader-single-page-layout
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-single-page-layout/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307080000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# xa-uploader Single-Page Layout Fact-Find Brief

## Scope

### Summary

`CatalogProductForm` currently renders product data fields and images in a two-step tabbed UI (`FormStepId = "product" | "images"`). Only one step is visible at a time. The images step is gated behind `readiness.isDataReady` (draft data completeness, not a save action) — saving triggers auto-advance to images, but the tab is only enabled once all required data fields are populated. This creates friction: editing data and managing images are separate flows regardless of whether the product has been saved.

The goal is a single scrollable page with three sections visible simultaneously: (1) main image panel at top, (2) product data selectors in the middle, (3) additional photos at the bottom. The `xa-uploader-status-and-media-model-rewrite` plan is complete — the media and status contracts have been rewritten. This is the layout change that exposes the new model properly.

### Goals

- Remove step-based navigation entirely from `CatalogProductForm`
- Extract `MainImagePanel` (index-0 image) and `AdditionalImagesPanel` (index-1+ images) from `CatalogProductImagesFields` as named exports
- Interleave panels with `CatalogProductBaseFields` in a single-page layout
- Preserve all existing image upload, reorder, make-main, and remove behaviour
- Update tests to match new single-page render expectations

### Non-goals

- Changes to autosave logic (`useCatalogConsole`)
- Changes to `CatalogProductBaseFields` field content or sections
- Changes to the `CatalogConsole` parent or `EditProductFilterSelector`
- Any changes to API routes or data contracts (already done in prior plan)
- Mobile-specific layout changes beyond removing the step tabs

### Constraints & Assumptions

- Constraints:
  - `useImageUploadController` hook must remain the single source of truth for upload/reorder/make-main/remove state — it cannot be split across two independent instances
  - `hasSlug` guard on upload must remain — `ImageDropZone` should be disabled when no slug exists
  - `data-testid` attributes must be preserved for existing green tests that don't test step navigation
- Assumptions:
  - Upload drop zone stays at the top of the images area (before main image), so the "Add main image" CTA appears first when no images exist
  - `canOpenImageStep` gate is removed entirely — images are always visible; the `hasSlug` check inside the images component handles the "not yet saved" state
  - `useSaveButtonTransition` keeps saved-state visual feedback but drops `onAdvanceToImages` / `canOpenImageStep` params
  - `StatusDot` remains in the top bar (no layout change needed)

## Outcome Contract

- **Why:** The status/media contract rewrite is complete and archived. The step-based tab navigation is now the only barrier to operator efficiency — requiring a tab switch between editing product data and managing images. Removing it makes the catalog entry flow continuous.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `CatalogProductForm` renders main image, data selectors, and additional images in a single scrollable page without step navigation. `MainImagePanel` and `AdditionalImagesPanel` extracted from `CatalogProductImagesFields` and interleaved in `CatalogProductForm`.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:60` — `ProductEditor` renders `CatalogProductForm` with full prop set; no step awareness here
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:174` — `CatalogProductForm` export: owns step state, `StepIndicator` tabs, conditional rendering

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` (364 lines) — **primary change target**: `FormStepId`, `StepIndicator`, `useSaveButtonTransition` (with auto-advance), step-conditional renders
- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` (765 lines) — **primary change target**: monolithic export; `useImageUploadController` hook (private), `ImageDropZone`, `ImageGallery` (flat grid of all images); `parseImageEntries` → `isMain: index === 0`
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` — **read-only**: accepts `sections?: CatalogBaseFieldSection[]` (`"identity" | "taxonomy" | "commercial"`); currently called with `["identity", "taxonomy"]`; no change required
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx` (240 lines) — **update required**: 4 of 7 tests are step/auto-advance-specific and become extinct; 3 remain valid (2 save-draft, 1 commercial-section omission)
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` — **unaffected**: tests `reorderPipeEntry` pure function only (already exported)

### Patterns & Conventions Observed

- Step state owned by `CatalogProductForm`, not hoisted to `useCatalogConsole` — evidence: `CatalogProductForm.client.tsx:210`
- `isMain` derived from `index === 0` — evidence: `CatalogProductImagesFields.client.tsx:100`; no role field
- `useImageUploadController` is a private function inside `CatalogProductImagesFields.client.tsx` — not exported; all upload state (`uploadStatus`, `previews`, `dragOver`, handlers) lives there
- `ImageGallery` renders all entries in one flat grid — `entries.map(...)` at `:374`; `isMain` used only for badge copy and disabling "make main" on index 0
- `ImageDropZone` `hasImages` prop switches copy: `uploadAddMainImage` (no images) → `uploadAddPhoto` (has images) at `:304`

### Data & Contracts

- Types/schemas:
  - `CatalogProductDraftInput` — `imageFiles: string` (pipe-separated paths), `imageAltTexts: string` (pipe-separated). No change.
  - `ImageEntry = { path: string; filename: string; isMain: boolean }` — local type, unchanged
  - `CatalogBaseFieldSection = "identity" | "taxonomy" | "commercial"` — exported from `CatalogProductBaseFields.client.tsx:722`
- API contracts: None changed — `/api/catalog/images` POST/DELETE unchanged

### Dependency & Impact Map

- Upstream: `CatalogConsole.client.tsx` → `CatalogProductForm` (passes `draft`, `storefront`, handlers). No prop changes needed at this layer — `CatalogProductForm` props are unchanged.
- Downstream:
  - `CatalogProductImagesFields` → `CatalogProductBaseFields` are siblings under `CatalogProductForm`; no interdependencies
  - `CatalogConsole` renders `CatalogProductForm` via `ProductEditor` — no change required
- Blast radius: **local only** — 2 component files + 1 test file. `CatalogConsole` and `useCatalogConsole` are unaffected.

### Test Landscape

#### Test Infrastructure

- Framework: Jest + jsdom + React Testing Library
- Commands: governed runner — `pnpm -w run test:governed`; not run locally per policy
- CI integration: GitHub Actions (`reusable-app.yml`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `CatalogProductForm` step navigation | Unit (RTL) | `CatalogProductForm.test.tsx` | 4 step/auto-advance tests — all become extinct |
| `CatalogProductForm` save button | Unit (RTL) | `CatalogProductForm.test.tsx` | 2 tests remain valid (`renders Save as draft` for add/edit flows) |
| `CatalogProductForm` field section guard | Unit (RTL) | `CatalogProductForm.test.tsx` | 1 test remains valid (`does not render the commercial/derived description section`) |
| `reorderPipeEntry` pure function | Unit | `CatalogProductImagesFields.test.ts` | 10 cases — fully unaffected |

#### Coverage Gaps

- Untested paths:
  - No render tests for `ImageGallery` or `ImageDropZone` in isolation
  - No test for single-page simultaneous render of base fields + images (new behaviour requires new test)
- Extinct tests (to remove, not update) — 4 of 7:
  - `"keeps save action scoped to product step only"` — clicks `workflowStepImages` button; step indicator disappears
  - `"shows saved state for 2 seconds then auto-advances to images"` — tests auto-advance timer
  - `"shows save-and-advance feedback when the transition timer fires"` — tests `onSavedFeedback` after advance timer
  - `"cancels save auto-advance when delete is clicked during saved state"` — tests cancel-advance path
- Tests to keep — 3 of 7:
  - `"renders Save as draft in product step for add flow"` — save button / no delete button
  - `"renders Save as draft in product step for edit flow"` — save button + delete button
  - `"does not render the commercial/derived description section"` — verifies `sections` prop is `["identity", "taxonomy"]`; non-step test, remains valid

#### Recommended Test Approach

- Unit tests for: new single-page render (base fields + main image panel + additional panel all present simultaneously); save button behaviour unchanged
- Remove: 4 extinct step/auto-advance tests
- Keep: 3 valid tests (2 save-draft tests, add/edit flows; 1 commercial-section omission test) — unaffected by layout change
- Keep: all 10 `reorderPipeEntry` tests — unaffected

### Recent Git History (Targeted)

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — last touched in `xa-uploader-status-and-media-model-rewrite` (TASK-03): rewrote role-based model to index-based (`isMain: index === 0`); `handleMakeMainImage` and `handleReorderImage` already in place
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — last meaningful change: step UI added in earlier workflow rebuild plan; untouched by media rewrite

## Questions

### Resolved

- Q: Where should the `ImageDropZone` sit in the new layout?
  - A: At the top of the images area, before the main image display. When no images exist, the drop zone is the primary CTA ("Add main image"). When images exist, it sits above the main image preview as "Add photo". This is the most natural progressive disclosure — empty state first, then populated state beneath.
  - Evidence: `ImageDropZone` copy switches on `hasImages` prop at `CatalogProductImagesFields.client.tsx:298-304`

- Q: What replaces `canOpenImageStep` when the step gate is removed?
  - A: Nothing — remove it entirely. `CatalogProductImagesFields` already has an internal `hasSlug` guard that disables upload when no slug exists (`:687`, `canUpload = hasSlug && uploadStatus !== "uploading"`). A soft `text-gate-muted` hint near the drop zone ("Save product details to enable upload") is sufficient; no hard gate needed.
  - Evidence: `CatalogProductImagesFields.client.tsx:654`, `CatalogProductForm.client.tsx:211`

- Q: Does `useSaveButtonTransition` need an overhaul?
  - A: Minor trim only — remove `canOpenImageStep` and `onAdvanceToImages` params; the saved-state visual feedback (2 s green "Saved" state) is still useful UX and should remain. `onSavedFeedback` callback stays.
  - Evidence: `CatalogProductForm.client.tsx:103-172`

- Q: How does `useImageUploadController` serve both `MainImagePanel` and `AdditionalImagesPanel` if they're separate components?
  - A: The hook stays in the parent `CatalogProductImagesFields` export (or a new wrapper). Both panels receive their slice of the output via props. `MainImagePanel` receives `entries[0]` + `onRemove(0)` + `onMakeMain` (no-op at index 0) + `previews`. `AdditionalImagesPanel` receives `entries.slice(1)` + `onRemove` + `onMakeMain` + `onReorder` + `previews`. The hook is not split — it is called once in the parent and data is threaded down.
  - Evidence: `useImageUploadController` at `:450`, returns unified state/handlers

- Q: Does `ImageGallery` need to be rewritten?
  - A: `ImageGallery` can be reused for `AdditionalImagesPanel` (index 1+ entries). `MainImagePanel` is a new sub-component — a single large image display (no grid) with the "Main" badge, a "Make Main" disabled state, and remove button. This minimises changes to `ImageGallery`.

### Open (Operator Input Required)

None — all questions resolved by code evidence and operator-stated preferences.

## Confidence Inputs

- Implementation: 92%
  - Basis: All files read end-to-end. Full picture of step state, hook architecture, and test surface.
  - To raise to 95%: Run typecheck pass on proposed prop interfaces before build.

- Approach: 88%
  - Basis: Operator confirmed Option B (split into `MainImagePanel` + `AdditionalImagesPanel`). Hook architecture cleanly supports prop-threading.
  - To raise to 95%: Verify no TypeScript `strict` edge cases on the new prop slices.

- Impact: 90%
  - Basis: Blast radius is local. `CatalogConsole` is unaffected. No API surface changes.
  - To raise to 95%: Confirm `CatalogConsole` prop set remains unchanged after `CatalogProductForm` signature update.

- Delivery-Readiness: 88%
  - Basis: 2 files to modify, 1 test file to update, 4 tests to remove and 1 to add. No build tooling changes.
  - To raise to 95%: Pass CI on first attempt (no lint/typecheck regressions).

- Testability: 85%
  - Basis: RTL + jsdom pattern already established. New single-page render test is straightforward.
  - What would raise to 90%: Add one RTL test asserting base fields and images section both appear in the same render.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `useImageUploadController` prop-threading error — `onRemove(index)` receives wrong index if `AdditionalImagesPanel` passes `index` relative to its own slice (0, 1, 2) instead of the global index (1, 2, 3) | Medium | High | `AdditionalImagesPanel` must offset index by 1 before calling handlers, OR `onRemove`/`onReorder`/`onMakeMain` receive global index and panel passes `sliceIndex + 1`. Must be explicitly documented in task. |
| 4 extinct tests removed but replacement test coverage insufficient — single-page render not covered by any test | Low | Moderate | Task validation contract must require ≥1 new RTL test asserting simultaneous render of base fields + images section. |
| `ImageDropZone` `hasImages` copy change — moving drop zone to top while it continues to show "Add photo" when images exist may confuse semantics | Low | Low | Verify copy strings remain coherent in new position; adjust hint text if needed (i18n key `uploadAddPhoto` → adjust copy or add new key). |
| TypeScript strict null on `entries[0]` in `MainImagePanel` when no images exist | Low | Low | Guard with `if (!entry) return null` or `<EmptyMainImagePlaceholder />`. |

## Planning Constraints & Notes

- Must-follow patterns:
  - `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool` pattern for fixed aspect-ratio / grid layout
  - `data-testid` on interactive elements must be preserved for remaining green tests
  - Writer lock for all commits: `scripts/agents/with-writer-lock.sh`
  - No `jest` run locally — push and use CI
- Rollout/rollback: Single commit on `dev`; immediate staging deploy after passing CI. Rollback = revert commit.
- Observability: No analytics events on this UI — visual QA via staging deploy sufficient.

## Suggested Task Seeds (Non-binding)

- **TASK-01 IMPLEMENT** — Extract `MainImagePanel` and `AdditionalImagesPanel` from `CatalogProductImagesFields.client.tsx`
  - Keep `useImageUploadController` inside the parent export; thread state to sub-components via props
  - `MainImagePanel`: single large image, "Main" badge, remove button; no reorder controls; `isMain` always true
  - `AdditionalImagesPanel`: wraps existing `ImageGallery` with index-offset; receives `entries.slice(1)`, passes `index + 1` to global handlers
  - Export both panels as named exports alongside `CatalogProductImagesFields`
  - Confidence target: 88 (IMPLEMENT threshold met)

- **TASK-02 IMPLEMENT** — Rewrite `CatalogProductForm.client.tsx` to single-page layout
  - Remove: `FormStepId`, `step` state, `StepIndicator` components, step-conditional renders, `canOpenImageStep`, `onAdvanceToImages` in `useSaveButtonTransition`
  - Add: render `ImageDropZone` + `MainImagePanel` at top (via `CatalogProductImagesFields` restructured or direct panel imports), then `CatalogProductBaseFields`, then `AdditionalImagesPanel`, then save/delete buttons
  - Keep: `StatusDot`, `autosaveCopy`, feedback banner, `onSavedFeedback`, saved-state button visual
  - `CatalogConsole` props are unchanged; `CatalogProductForm` external prop signature is unchanged
  - Confidence target: 88

- **TASK-03 IMPLEMENT** — Update `CatalogProductForm.test.tsx`
  - Remove 4 extinct step/auto-advance tests (listed in Coverage Gaps above)
  - Keep 3 existing valid tests: 2 save-draft tests (add/edit flows) + 1 commercial-section omission test
  - Add 1 new test: single-page render asserts base-fields and images-fields both present simultaneously without tab interaction
  - Confidence target: 88

- **TASK-04 CHECKPOINT** — Visual QA + staging deploy
  - Run `/lp-design-qa` scoped to changed routes
  - `wrangler deploy --env preview` to `xa-uploader-preview` worker
  - Confirm all three sections visible on page load without any step interaction

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `tools-ui-contrast-sweep` (post-build, scoped to changed components)
- Deliverable acceptance package:
  - `CatalogProductForm` renders base fields + image panels simultaneously in a single render
  - No step indicator visible
  - All upload, reorder, make-main, remove operations functional
  - CI green (typecheck + lint + tests)
- Post-delivery measurement plan: Staging visual QA; no metric tracking required for this layout change

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `CatalogProductForm` step removal | Yes | None | No |
| `useImageUploadController` hook sharing between `MainImagePanel` / `AdditionalImagesPanel` | Yes | [Moderate]: Index offset for AdditionalImagesPanel is an off-by-one trap | Yes — documented in Risks + TASK-01 seed |
| `CatalogProductForm.test.tsx` extinct test removal | Yes | None | No |
| `CatalogConsole` blast radius | Yes | None — parent props unchanged | No |
| TypeScript strict null on `entries[0]` | Yes | [Minor]: empty state guard needed in `MainImagePanel` | No — low risk, captured in Risks |

## Scope Signal

Signal: right-sized

Rationale: Scope is 2 component files + 1 test file. Operator has resolved all architectural decisions (Option B: split panels, hook stays in parent, index-offset via props). No external dependencies, no API changes, no upstream parent changes. The work is self-contained with a clear validation path.

## Evidence Gap Review

### Gaps Addressed

- `useImageUploadController` hook architecture read in full — prop-threading approach confirmed feasible
- Test landscape fully audited — extinct tests identified by name, replacement coverage specified
- Blast radius confirmed local — `CatalogConsole` needs no changes

### Confidence Adjustments

- No downward adjustments required. All critical architectural questions resolved.

### Remaining Assumptions

- `ImageDropZone` i18n copy (`uploadAddPhoto`) remains coherent when positioned above the main image preview — low risk, verifiable at build time

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-single-page-layout --auto`
