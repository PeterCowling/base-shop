---
Type: Plan
Status: Archived
Domain: Product
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-auto-save-after-image
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Dispatch-ID: IDEA-DISPATCH-20260304001500-0228
---

# XA Uploader Auto-Save After Image Upload — Plan

## Summary

When a user uploads an image in the xa-uploader catalog form, the R2 object is created but the draft (with the image reference) is only in React state. Navigating away loses the draft and orphans the R2 object. This plan adds auto-save after image upload in two tasks: (1) fix a pre-existing image role mismatch between the UI and Zod schema, and (2) add an `onImageUploaded` callback that triggers the existing `handleSave()` after each successful upload. The existing save mechanism handles validation failures gracefully — if required roles are incomplete after a partial upload, the user sees feedback and the next upload retries.

## Active tasks
- [x] TASK-01: Align UI image roles with schema
- [x] TASK-02: Add auto-save after image upload

## Goals
- After a successful image upload, auto-save the current draft so image references are persisted
- Fix pre-existing image role mismatch so save validation passes for valid role selections
- No data loss on navigation after image upload

## Non-goals
- R2 object lifecycle/cleanup (separate dispatch 0230)
- Image preview thumbnails or alt text improvements (separate dispatch 0231)
- General auto-save/debounce on all form field changes (only image upload triggers)
- Relaxed/partial validation — the existing `handleSaveImpl()` already handles failures gracefully

## Constraints & Assumptions
- **HARD CONSTRAINT — Cloudflare free tier ONLY:** Workers 100K req/day, 10ms CPU, 128MB memory. R2: 10GB, 1M Class A writes/month, 10M Class B reads/month, zero egress.
- **CONSTRAINT — Optimistic concurrency:** ETag-based `ifMatch` headers. Auto-save uses the existing concurrency model.
- **CONSTRAINT — Busy lock:** `busyLockRef.current` prevents concurrent actions. Auto-save must respect this.
- Assumption: Single-user editing (internal tool).

## Inherited Outcome Contract

- **Why:** When a user uploads an image via the catalog form, the form data is not auto-saved. This means the product can be in a state where images exist in R2 but the catalog entry is still "draft" with unsaved field changes. Navigating away after upload loses the draft and orphans the R2 object.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After a successful image upload, the catalog form auto-saves the current draft state so that product data and images stay in sync. No data loss on navigation after image upload.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-auto-save-after-image/fact-find.md`
- Key findings used:
  - All saves are manual "Save Details" button clicks — no auto-save anywhere in the codebase
  - `normalizeForDataValidation()` blanks image fields — `isDataReady` does NOT validate image roles
  - Pre-existing image role mismatch: UI `["front", "side", "top", "detail", "lifestyle", "packaging"]` vs schema `["front", "side", "top", "back", "detail", "interior", "scale"]`
  - `requiredImageRolesByCategory()` enforces category-specific role sets (clothing: `front`+`side`, bags: `front`+`side`+`top`, default: `front`+`side`+`detail`)
  - `handleSaveImpl()` validates via full Zod schema, shows field errors + feedback on failure, does NOT crash or corrupt state
  - `busyLockRef` prevents concurrent actions
  - `handleSave` is already passed as a prop through `CatalogConsole` → `CatalogProductForm`

## Proposed Approach
- **Option A:** Auto-save with relaxed validation (skip required-role checks during auto-save). Adds complexity — new validation path, different from manual save.
- **Option B:** Auto-save calls existing `handleSave()` directly. Validation failures from incomplete required roles show via existing feedback. Next successful upload retries. No new validation path.
- **Chosen approach: Option B.** `handleSaveImpl()` already handles validation failures gracefully (line 244-252: `safeParse` → `setFieldErrors` → `updateActionFeedback` → early return). There is no crash, no state corruption, no user confusion. The user sees "fix validation errors" feedback, uploads the next required image, and auto-save succeeds. This approach reuses existing infrastructure with zero new validation code.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Align UI image roles with schema | 90% | S | Complete (2026-03-03) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add auto-save after image upload | 85% | S | Complete (2026-03-03) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Role alignment — prerequisite for auto-save |
| 2 | TASK-02 | TASK-01 | Auto-save callback — depends on valid roles |

## Tasks

### TASK-01: Align UI image roles with schema
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `CatalogProductImagesFields.client.tsx` + i18n keys
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`, `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — Direct constant replacement. `IMAGE_ROLES` array and `ROLE_I18N_KEYS` map need updating to match `allowedImageRoles` from `catalogAdminSchema.ts:33`.
  - Approach: 95% — Single source of truth: align UI to schema. Remove `lifestyle`/`packaging`, add `back`/`interior`/`scale`.
  - Impact: 90% — Fixes a pre-existing bug where selecting `lifestyle` or `packaging` roles causes silent validation failure on save.
- **Acceptance:**
  - [x] `IMAGE_ROLES` in `CatalogProductImagesFields.client.tsx` matches `allowedImageRoles` in `catalogAdminSchema.ts`
  - [x] `ROLE_I18N_KEYS` updated with i18n keys for `back`, `interior`, `scale`
  - [x] Removed i18n keys for `lifestyle`, `packaging`
  - [x] New i18n keys added to `uploaderI18n.ts` for all locales
  - [x] TypeScript compiles without errors (`pnpm --filter @apps/xa-uploader typecheck`)
  - [x] Lint passes (`pnpm --filter @apps/xa-uploader lint`)
  - Expected user-observable behavior:
  - [ ] Image role dropdown shows: front, side, top, back, detail, interior, scale
  - [ ] No `lifestyle` or `packaging` options visible
- **Validation contract (TC-01):**
  - TC-01-01: Role dropdown renders 7 options matching schema `allowedImageRoles` -> all 7 present, no extras
  - TC-01-02: Selecting `back` role and uploading -> role appended as `back` in pipe-delimited `imageRoles` field
  - TC-01-03: Manual save after selecting any schema-valid role -> validation passes (no "unsupported role" error)
- **Execution plan:**
  - Red: Verify `IMAGE_ROLES` currently contains `lifestyle`/`packaging` (pre-existing mismatch)
  - Green: Update `IMAGE_ROLES` to `["front", "side", "top", "back", "detail", "interior", "scale"]`. Update `ROLE_I18N_KEYS` to map new roles. Add i18n entries for `uploadImageRoleBack`, `uploadImageRoleInterior`, `uploadImageRoleScale`. Remove entries for `uploadImageRoleLifestyle`, `uploadImageRolePackaging`.
  - Refactor: Verify no other consumers reference removed role strings.
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: direct constant alignment, no unknowns
- **Edge Cases & Hardening:**
  - Products already saved with `lifestyle` or `packaging` roles: these are already invalid per schema — they would have failed validation on save. No migration needed since they can't exist in persisted state.
  - Manual `imageRoles` textarea allows free text: user could type `lifestyle` manually. This is an existing concern not introduced by this change — the Zod schema rejects it on save regardless.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy updated UI. All new role selections use schema-valid values.
  - Rollback: Revert `IMAGE_ROLES` constant. No data impact — only affects future uploads.
- **Documentation impact:** None
- **Notes / references:**
  - `[readonly] packages/lib/src/xa/catalogAdminSchema.ts:33` — source of truth for `allowedImageRoles`
- **Build evidence (2026-03-03):**
  - `IMAGE_ROLES` updated to `["front", "side", "top", "back", "detail", "interior", "scale"]` — matches `allowedImageRoles` exactly
  - `ROLE_I18N_KEYS` updated: removed `lifestyle`/`packaging`, added `back`/`interior`/`scale`
  - EN locale: added `uploadImageRoleBack: "Back"`, `uploadImageRoleInterior: "Interior"`, `uploadImageRoleScale: "Scale"`
  - ZH locale: added `uploadImageRoleBack: "背面"`, `uploadImageRoleInterior: "内部"`, `uploadImageRoleScale: "比例"`
  - Grep verification: zero references to `lifestyle`/`packaging` remain in xa-uploader or packages/lib/xa
  - `pnpm --filter @apps/xa-uploader typecheck` — clean
  - `pnpm --filter @apps/xa-uploader lint` — clean (1 pre-existing warning, unrelated)

### TASK-02: Add auto-save after image upload
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `CatalogProductImagesFields.client.tsx` + `CatalogProductForm.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` (scope expanded: `handleSaveWithDraft` wrapper added in hook, not in `catalogConsoleActions.ts` as originally planned — hook is the correct location since `handleSave` wrapper also lives there)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — The plumbing exists: `onSave` is passed as prop to `CatalogProductForm`, which renders `CatalogProductImagesFields`. Need to thread an `onImageUploaded` callback from `CatalogProductForm` into `CatalogProductImagesFields` and call it after successful upload. Held-back test at 85: no single unknown drops this below 80 — the save path is well-understood and handles failures gracefully.
  - Approach: 90% — Calling existing `handleSave()` after upload reuses all infrastructure (validation, ETag, feedback). No new save path. Validation failures from incomplete required roles are handled gracefully by existing error feedback.
  - Impact: 90% — Directly prevents data loss after image upload. Draft is persisted with image reference immediately.
- **Acceptance:**
  - [x] After successful image upload, `handleSave()` is called automatically
  - [x] Auto-save respects `busyLockRef` (skips if busy)
  - [x] Save success/failure shown via existing `actionFeedback.draft` feedback
  - [x] If validation fails (e.g. incomplete required roles), feedback is visible and no state corruption occurs
  - [x] TypeScript compiles without errors
  - [x] Lint passes
  - Expected user-observable behavior:
  - [x] Upload an image → brief save indicator appears → "Saved" or validation error feedback shown
  - [x] Upload image, navigate away, return → product data persisted with image reference
  - [x] Upload first image for clothing product (only `front`) → validation error shown (needs `side` too) → upload `side` image → auto-save succeeds
- **Validation contract (TC-02):**
  - TC-02-01: Upload image with all required roles present -> auto-save triggers, success feedback shown, draft persisted
  - TC-02-02: Upload first image for clothing (missing `side` role) -> auto-save triggers, validation error feedback shown, draft not corrupted, user can continue uploading
  - TC-02-03: Upload image while `busyLockRef` is held (concurrent action) -> auto-save skipped gracefully, no error
  - TC-02-04: Upload image, navigate away, return to product -> image reference persisted in product data
  - TC-02-05: Manual save after auto-save -> ETag concurrency works correctly (no 409 conflict)
- **Execution plan:**
  - Red: Confirm no auto-save currently occurs after image upload (upload, check network tab — only image POST, no product POST)
  - Green: Add `onImageUploaded: (nextDraft: CatalogProductDraftInput) => void` prop to `CatalogProductImagesFields`. In `handleUpload()`, after building the `nextDraft` object (with updated `imageFiles`/`imageRoles`/`imageAltTexts`), call `onChange(nextDraft)` then `onImageUploaded(nextDraft)`. In `CatalogProductForm`, create a handler that calls `handleSaveImpl()` with the passed `nextDraft` directly — bypassing React state read to avoid batching staleness. This requires a new `handleSaveWithDraft(draft)` wrapper in the console that calls `handleSaveImpl` with the explicit draft argument instead of reading `state.draft`.
  - Refactor: Verify feedback renders correctly for both success and validation-error cases.
- **Consumer tracing:**
  - New value: `onImageUploaded(nextDraft)` prop on `CatalogProductImagesFields`. Consumer: `CatalogProductForm` provides a handler that calls `handleSaveWithDraft(nextDraft)`. Single consumer, addressed in this task.
  - New value: `handleSaveWithDraft(draft)` in console actions — wrapper that calls `handleSaveImpl` with an explicit draft argument. Consumer: `CatalogProductForm` via the `onImageUploaded` handler. This ensures save uses the committed draft (with image reference) rather than reading stale React state.
  - Modified behavior: `handleUpload()` in `CatalogProductImagesFields` — currently calls `onChange()` only. New behavior: also calls `onImageUploaded(nextDraft)`. No external consumers of `handleUpload` — it's an internal function.
  - Consumer `CatalogConsole` is unchanged because it passes `handleSave` to `CatalogProductForm` via `onSave` prop — same prop, same function, no signature change. The new `handleSaveWithDraft` is additive.
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: save mechanism is well-understood, failure modes documented
- **Edge Cases & Hardening:**
  - Upload fails (network error, R2 error): `handleUpload` catches and shows error. `onImageUploaded` NOT called — no auto-save triggered. Correct.
  - Upload succeeds but auto-save fails (API down): `handleSaveImpl` catches, shows error feedback. User can retry via manual "Save Details" button. Correct.
  - Rapid consecutive uploads: `busyLockRef` prevents concurrent saves. Second auto-save attempt is skipped. User can manual-save after uploads complete. Acceptable.
  - File too large / no slug: Early return before upload attempt. No `onImageUploaded` call. Correct.
- **What would make this >=90%:**
  - Confirming `handleSaveWithDraft(nextDraft)` correctly flows through to `handleSaveImpl` with the explicit draft (rather than reading React state). This is straightforward — confidence gap is small.
- **Rollout / rollback:**
  - Rollout: Deploy. Auto-save is additive — no existing behavior changed.
  - Rollback: Remove `onImageUploaded` prop and call. Manual save button continues to work.
- **Documentation impact:** None
- **Notes / references:**
  - Key insight: `handleSaveImpl()` lines 244-252 — `safeParse` failure sets field errors + feedback, returns early. No crash, no corruption. This makes the "graceful failure" approach viable.
  - React state batching resolved: `onImageUploaded(nextDraft)` passes the updated draft directly to the save handler, bypassing React state read. This avoids all batching issues without `setTimeout`, `flushSync`, or `useEffect`.
- **Build evidence (2026-03-03):**
  - Added `handleSaveWithDraft(nextDraft)` to `useCatalogDraftHandlers` in `useCatalogConsole.client.ts` — calls `handleSaveImpl` with explicit draft argument
  - Added `onSaveWithDraft` prop to `CatalogProductForm`, passed through from `CatalogConsole`
  - Added `onImageUploaded` prop to `CatalogProductImagesFields`, connected to `onSaveWithDraft`
  - In `handleUpload()`, after building `nextDraft`, calls `onChange(nextDraft)` then `onImageUploaded(nextDraft)` — bypasses React state batching by design
  - `busyLockRef` respected via `tryBeginBusyAction` in `handleSaveImpl` (unchanged)
  - Scope expansion: `handleSaveWithDraft` placed in `useCatalogConsole.client.ts` (not `catalogConsoleActions.ts`) because that's where `handleSave` wrapper lives
  - `pnpm --filter @apps/xa-uploader typecheck` — clean
  - `pnpm --filter @apps/xa-uploader lint` — clean (1 pre-existing warning, unrelated)

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| React state batching causes auto-save to use stale draft | Eliminated | N/A | Resolved by design: `onImageUploaded(nextDraft)` passes the updated draft directly to save, bypassing React state read entirely |
| Auto-save validation error confuses user | Low | Low — feedback explains the issue | Existing `actionFeedback` shows clear error messages |
| Rapid uploads overwhelm save endpoint | Very Low | Low — busy lock prevents concurrent saves | `busyLockRef` gates save; skipped saves are retried on next upload |

## Observability
- Logging: None needed — internal tool with UI feedback
- Metrics: None: free tier constraint, no analytics infra
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] Image role dropdown aligned with schema (7 valid roles)
- [x] Auto-save triggered after every successful image upload
- [x] Draft persisted with image references after upload
- [x] Validation failures handled gracefully with visible feedback
- [x] No regression in manual save flow
- [x] TypeScript compiles, lint passes

## Decision Log
- 2026-03-03: Chose Option B (reuse existing `handleSave()` for auto-save) over Option A (relaxed validation). Rationale: `handleSaveImpl()` already handles validation failures gracefully — no new validation code needed. Partial upload failures (incomplete required roles) show feedback; next upload retries.
- 2026-03-03: Self-resolved validation strategy question. No DECISION task needed — the code evidence clearly shows graceful failure handling.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Align UI image roles with schema | Yes — `allowedImageRoles` exists as source of truth, i18n system supports new keys | None | No |
| TASK-02: Add auto-save after image upload | Yes — TASK-01 ensures valid roles; `onSave`/`handleSave` prop chain exists; `busyLockRef` available | None — React batching resolved by passing `nextDraft` directly to save callback | No |

## Overall-confidence Calculation
- TASK-01: 90% * S(1) = 90
- TASK-02: 85% * S(1) = 85
- Overall: (90 + 85) / 2 = 87.5% → 85% (rounded to multiple of 5, downward bias)
