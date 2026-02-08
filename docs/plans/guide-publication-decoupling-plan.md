---
Type: Plan
Status: Active
Domain: CMS
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: guide-publication-decoupling
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BRIK
---

# Guide Publication Decoupling Plan

## Summary

Decouple guide drafting from brikette so the consumer site is a pure publication surface. Remove all ~60 draft/authoring files from brikette, simplify the two-tier status system to use manifest `status === "live"` directly, filter non-live guide content from the build bundle, and prepare the manifest schema for multi-site publishing. Business-os is already the complete authoring surface (Phase A done).

## Goals

- Remove all draft/authoring infrastructure from brikette (~60 files)
- Consumer sites render only `"live"` guides — no pages generated, no content bundled for non-live
- Simplify status system: eliminate `"published"` / `draftOnly` indirection
- Prepare `GuideManifestEntry` schema for per-site status (multi-site)
- All currently-published guides produce identical output after changes

## Non-goals

- Moving the manifest out of brikette into `@acme/guide-system` (future phase)
- Building multi-site management UI in business-os (schema preparation only)
- Lazy per-guide content loading (separate optimisation)
- Migrating manifest from TypeScript to database

## Constraints & Assumptions

- Constraints:
  - Static export (`OUTPUT_EXPORT=1`) must continue to work for staging
  - Production Worker build (`@opennextjs/cloudflare`) must continue to work
  - Existing published guides must produce identical static pages
  - Shared types in `@acme/guide-system`, app-specific code in app
  - Business-os API contracts unchanged
- Assumptions:
  - No second consumer site yet (schema-only multi-site prep)
  - Git-commit-as-release model continues

## Fact-Find Reference

- Related brief: `docs/plans/guide-publication-decoupling-fact-find.md`
- Key findings:
  - Two-tier status system (`live` → `published`) is unnecessary after decoupling
  - ALL 168 guide content files bundled regardless of status (~26.6 MB across 18 locales)
  - `HowToGetHereContent.tsx` has its own inline `PreviewBanner` using `PREVIEW_TOKEN` (separate from editorial components)
  - `guides.index.ts` defaults entries to `"published"` if status omitted
  - `generateStaticParams` has no test coverage
  - Manifest override system (write ops) only used by draft routes and editorial panel
  - Fact-find confidence: Implementation 82%, Approach 75%, Impact 78%, Testability 70%

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/data/guides.index.ts` — status mapping, `isGuidePublished()`, `getGuideStatus()`
  - `apps/brikette/src/routes/guides/guide-manifest.ts` — `buildGuideStatusMap()`, `buildGuideChecklist()`, `mergeManifestOverride()`
  - `apps/brikette/src/routes/guides/guide-seo/template/useGuideManifestState.ts` — 154 lines, bridge between manifest and template
  - `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx` — dynamic import of `GuideEditorialPanel`, renders preview components
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` — passes manifest state to template body
  - `apps/brikette/src/locales/guides.imports.ts` — `CONTENT_KEYS` loading (all 168 guides)
  - `packages/guide-system/src/manifest-types.ts` — `GuideManifestEntry`, `GuideStatus`, `createManifestEntrySchema()`
- Patterns to follow:
  - Status filtering: `GUIDES_INDEX.filter(g => g.status === "published")` in `generateStaticParams` (will become `status === "live"`)
  - Runtime guard: `if (!isGuidePublished(key)) notFound()` in page components

## Proposed Approach

**Three-phase approach**, each independently deployable and reversible:

### Phase 1: Remove Draft Facilities

Delete all draft routes, API routes, editorial/preview components, authoring utilities, and env vars from brikette. Simplify `useGuideManifestState` to return only `manifestEntry` (needed for blocks/meta). Clean up `HowToGetHereContent.tsx` preview logic.

### Phase 2: Simplify Status & Exclude Non-Live Content

Replace the two-tier status system (`live` → `published`) with direct `status === "live"` checks. Filter `CONTENT_KEYS` and `readSplitNamespace()` to exclude non-live guide content from builds. Add build-time logging of excluded guides.

### Phase 3: Multi-Site Schema Preparation

Add optional `sites?: Record<string, { status?: GuideStatus }>` field to `GuideManifestEntry`. Update status resolution to check per-site status first. Schema-only — no multi-site content bundling until a second consumer site exists.

**Alternative considered:** Moving manifest to `@acme/guide-system` package. Rejected for now — larger refactor, and per-site status fields work fine with manifest staying in brikette. Can be done in a future phase.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add regression baseline tests for `generateStaticParams` and status filtering | 90% | M | Complete (2026-02-08) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Delete brikette draft routes and API routes | 92% | M | Complete (2026-02-08) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Remove editorial/preview components from guide templates | 88% | M | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Remove authoring utilities, env vars, override write ops, and clean up tests | 88% | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Simplify two-tier status to direct `live` check | 85% | M | Pending | TASK-01, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Filter non-live guide content from build bundle | 82% | M | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add `sites` field to manifest schema for multi-site preparation | 85% | M | Pending | TASK-06 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

_Execution waves for subagent dispatch. Tasks within a wave can run in parallel. Tasks in a later wave require all blocking tasks from earlier waves to complete._

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02 | - | Independent: test baseline + draft route deletion |
| 2 | TASK-03 | Wave 1: TASK-02 | Remove editorial/preview components from templates |
| 3 | TASK-04 | Wave 2: TASK-03 | Clean up utilities, env vars, override system, tests |
| 4 | TASK-05 | Wave 1: TASK-01, Wave 3: TASK-04 | Convergence point — simplify status system |
| 5 | TASK-06 | Wave 4: TASK-05 | Filter non-live content from build bundle |
| 6 | TASK-07 | Wave 5: TASK-06 | Multi-site schema preparation |

**Max parallelism:** 2 (Wave 1) | **Critical path:** TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06 → TASK-07 (6 waves) | **Total tasks:** 7

## Tasks

### TASK-01: Add regression baseline tests for `generateStaticParams` and status filtering

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (new)
  - Secondary: `[readonly] apps/brikette/src/data/guides.index.ts`, `[readonly] apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — Pure function tests, clear inputs/outputs, existing test patterns in `guide-manifest-completeness.test.ts`
  - Approach: 90% — Standard unit test for deterministic functions
  - Impact: 85% — No production code changes, only adding tests
- **Acceptance:**
  - Test file verifies `isGuidePublished()` returns correct status for known published/draft guides
  - Test verifies `getGuideStatus()` defaults to `"published"` for unknown keys
  - Test verifies `GUIDES_INDEX` contains expected count of published guides
  - Test snapshots the current published guide key list (regression anchor)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `isGuidePublished("santaMaria")` → `true` (known published guide)
    - TC-02: `isGuidePublished("ageAccessibility")` → `false` (known draft guide)
    - TC-03: `getGuideStatus("nonexistentKey")` → `"published"` (default behavior)
    - TC-04: `GUIDES_INDEX.filter(g => g.status === "published").length` → snapshot current count
    - TC-05: Published guide key set snapshot matches current production state
  - **Acceptance coverage:** TC-01/02 → status correctness, TC-03 → default behavior, TC-04/05 → regression anchor
  - **Test type:** unit
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (new)
  - **Run:** `pnpm --filter brikette test -- --testPathPattern=guide-status-filtering`
  - **End-to-end coverage:** N/A — non-user-facing test infrastructure task
- **TDD execution plan:**
  - **Red:** Write all 5 test cases; they should pass immediately (testing existing behavior)
  - **Green:** No implementation needed — these test existing functions
  - **Refactor:** N/A
- **Planning validation:**
  - Tests run: `pnpm --filter brikette test -- --testPathPattern=guide-manifest.status|guide-manifest-overrides` — 2 suites, 27 tests passed
  - Test stubs written: N/A (S effort equivalent — tests are the deliverable)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Merge test file directly, no feature flag needed
  - Rollback: Delete test file
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/brikette/src/test/content-readiness/guides/guide-manifest-completeness.test.ts`
- **Status:** Complete (2026-02-08)
- **Implementation notes:**
  - Created 5 test cases (TC-01 through TC-05) in `guide-status-filtering.test.ts`
  - TC-04 expected count: 119 published guides (fact-find estimated 166 — corrected from actual data)
  - TC-05 snapshots 12 non-published guide keys (ageAccessibility, arrivingByFerry, bookingBasics, changingCancelling, checkinCheckout, defectsDamages, depositsPayments, legal, naplesAirportBus, rules, security, travelHelp)
  - Used `toBe()` instead of `toMatchInlineSnapshot()` — Jest 29 + Prettier 3 incompatibility
- **Validation evidence:**
  - `pnpm --filter brikette exec jest --testPathPattern="guide-status-filtering"` — 5/5 pass
  - Full suite: 2 pre-existing failures (guide-collection-card.test.tsx — React rendering, unrelated), 708 passed, 8 todo

---

### TASK-02: Delete brikette draft routes and API routes

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/app/[lang]/draft/` (delete ~20 files), `apps/brikette/src/app/api/guides/` (delete 6 files)
  - Secondary: `[readonly] apps/brikette/src/seo/robots.ts` (draft disallow lines reference deleted routes)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 92%
  - Implementation: 95% — Pure file deletion, no logic changes
  - Approach: 92% — Draft routes are env-gated and internal-only; business-os replaces them
  - Impact: 90% — Self-contained; no external consumers of draft routes. API routes only called from draft pages and editorial panel.
- **Acceptance:**
  - `apps/brikette/src/app/[lang]/draft/` directory deleted (all files)
  - `apps/brikette/src/app/api/guides/` directory deleted (all files)
  - `pnpm --filter brikette typecheck` passes
  - No broken imports in remaining code (type errors caught by typecheck)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-06: `apps/brikette/src/app/[lang]/draft/` does not exist after deletion
    - TC-07: `apps/brikette/src/app/api/guides/` does not exist after deletion
    - TC-08: `pnpm --filter brikette typecheck` passes with no errors
    - TC-09: `pnpm --filter brikette test` passes (no broken test imports)
  - **Acceptance coverage:** TC-06/07 → deletion verification, TC-08/09 → no regressions
  - **Test type:** build verification (typecheck + existing test suite)
  - **Test location:** Existing test suite + typecheck
  - **Run:** `pnpm --filter brikette typecheck && pnpm --filter brikette test`
  - **End-to-end coverage:** N/A — deletion task, verified by build
- **TDD execution plan:**
  - **Red:** N/A for deletion — verify draft routes exist before deletion
  - **Green:** Delete directories. Fix any resulting import errors (should be none if TASK-03 handles template refs)
  - **Refactor:** N/A
- **Planning validation:**
  - Tests run: Typecheck + test suite confirm current state compiles
  - Test stubs written: N/A
  - Unexpected findings: None — draft routes are self-contained
- **Rollout / rollback:**
  - Rollout: Single commit, no feature flag. Draft routes gated by env var anyway.
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - Draft route files listed in fact-find `§ Entry Points → Brikette Draft Routes`
  - API route files listed in fact-find `§ Entry Points → Brikette API Routes`
- **Status:** Complete (2026-02-08)
- **Implementation notes:**
  - Deleted `apps/brikette/src/app/[lang]/draft/` (21 files) and `apps/brikette/src/app/api/guides/` (6 files)
  - Removed draft test case from `guide-route-bundle-wiring.test.tsx` (dynamic import of deleted draft page)
  - Cleaned up `mockResolveDraftPathSegment` mock reference from same test file

---

### TASK-03: Remove editorial/preview components from guide templates

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx`, `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`, `apps/brikette/src/routes/guides/guide-seo/template/useGuideManifestState.ts`
  - Primary: `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/DevStatusPill.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/useTranslationCoverage.ts` (delete), `apps/brikette/src/routes/guides/guide-seo/components/SeoAuditBadge.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/SeoAuditDetails.tsx` (delete), `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx` (edit — remove PreviewBanner import)
  - Primary: `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` (remove preview banner and `PREVIEW_TOKEN` usage)
  - Secondary: `[readonly] apps/brikette/src/routes/guides/guide-seo/utils/preview.ts` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% — Removing imports and conditional rendering blocks from 3 template files; deleting 7 component files
  - Approach: 90% — Business-os editorial sidebar is the replacement; these components have no other consumers
  - Impact: 85% — Template files are critical render path; careful editing needed. `HeadSection.tsx` imports `PreviewBanner`, `HowToGetHereContent.tsx` has inline preview logic.
- **Acceptance:**
  - 7 editorial/preview component files deleted from `guide-seo/components/`
  - `preview.ts` utility deleted from `guide-seo/utils/`
  - `GuideSeoTemplateBody.tsx`: no imports of `GuideEditorialPanel`, `DevStatusPill`, `isGuideAuthoringEnabled`, `buildGuideEditUrl`; no `shouldShowEditorialPanel`/`isDraftRoute` props
  - `_GuideSeoTemplate.tsx`: `useGuideManifestState` usage reduced to only `manifestEntry`; no `resolvedStatus`, `checklistSnapshot`, `draftUrl`, `isDraftRoute`, `shouldShowEditorialPanel` props passed
  - `useGuideManifestState.ts`: simplified to return only `{ manifestEntry }`; no override fetch, no checklist, no draft URL computation
  - `HeadSection.tsx`: no `PreviewBanner` import or usage
  - `HowToGetHereContent.tsx`: no `PREVIEW_TOKEN` import, no inline `PreviewBanner` function, no `showPreview` logic
  - `pnpm --filter brikette typecheck` passes
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-10: `GuideSeoTemplateBody.tsx` has no import of `GuideEditorialPanel` (grep verification)
    - TC-11: `useGuideManifestState` returns only `{ manifestEntry }` — existing published guide hydration test still passes
    - TC-12: `pnpm --filter brikette typecheck` passes
    - TC-13: `pnpm --filter brikette test -- --testPathPattern=published-guide-hydration` passes (published guides unaffected)
    - TC-14: `HowToGetHereContent.tsx` has no `PREVIEW_TOKEN` import (grep verification)
  - **Acceptance coverage:** TC-10/14 → deletion verification, TC-11/13 → no regression in published rendering, TC-12 → type safety
  - **Test type:** build verification + existing integration tests
  - **Test location:** Existing `published-guide-hydration.test.tsx`
  - **Run:** `pnpm --filter brikette typecheck && pnpm --filter brikette test -- --testPathPattern=published-guide-hydration`
  - **End-to-end coverage:** TC-13 covers published guide rendering end-to-end
- **TDD execution plan:**
  - **Red:** Verify `published-guide-hydration.test.tsx` passes before changes (baseline)
  - **Green:** Delete component files, edit template files to remove imports/props/conditional blocks, simplify `useGuideManifestState`. Fix typecheck errors.
  - **Refactor:** Remove unused imports, clean up prop types
- **Planning validation:**
  - Tests run: Published hydration tests pass in current state
  - Test stubs written: N/A
  - Unexpected findings: `HeadSection.tsx` also imports `PreviewBanner` (found via grep). `HowToGetHereContent.tsx` has inline preview banner with `PREVIEW_TOKEN` (not imported from editorial components).
- **What would make this ≥90%:**
  - Run a staging build after changes to verify static export works
- **Rollout / rollback:**
  - Rollout: Single commit with TASK-02. Phase 1 is zero user-facing impact.
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - `GuideSeoTemplateBody.tsx` lines: 8 (PREVIEW_TOKEN), 10-11 (authoring imports), 15 (DevStatusPill), 33-41 (GuideEditorialPanel dynamic import), 176-179 (editUrl), 214 (DevStatusPill render), 231-241 (GuideEditorialPanel render)
  - `_GuideSeoTemplate.tsx` lines: 19 (useGuideManifestState), 133-146 (destructuring), 509-514 (props passed)
  - `useGuideManifestState.ts`: lines 36-77 (override fetch → remove), 116-134 (checklist → remove), 136-140 (draftUrl → remove), 142-143 (isDraftRoute/shouldShow → remove)

---

### TASK-04: Remove authoring utilities, env vars, override write ops, and clean up tests

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/routes/guides/guide-authoring/` (delete directory — `gate.ts`, `urls.ts`)
  - Primary: `apps/brikette/src/config/env.ts` (remove `PREVIEW_TOKEN` and `ENABLE_GUIDE_AUTHORING` lines 81-90)
  - Primary: `apps/brikette/src/seo/robots.ts` (remove draft disallow rules lines 8-11, 21)
  - Primary: `apps/brikette/src/utils/guideStatus.ts` (remove localStorage overrides — keep `getManifestGuideStatus`, remove `getEffectiveGuideStatus`, `setGuideStatus`, `toggleGuideStatus`, `readOverrides`, `writeOverrides`)
  - Primary: `apps/brikette/src/routes/guides/guide-manifest-overrides.node.ts` (delete — write ops no longer needed)
  - Primary: `apps/brikette/src/data/guides/guide-manifest-overrides.json` (delete), `guide-manifest-overrides.json.bak` (delete)
  - Primary: `apps/brikette/src/test/routes/guides/__tests__/hydration/preview-guide-hydration.test.tsx` (delete — tests preview mode that no longer exists)
  - Primary: `apps/brikette/src/test/content-readiness/guides/guide-manifest-overrides.node.test.ts` (delete — tests write ops that no longer exist)
  - Primary: `apps/brikette/src/test/content-readiness/guides/guide-manifest-overrides.test.ts` (review — keep if tests read-only validation, update if tests write ops)
  - Primary: `apps/brikette/src/locales/guides.imports.ts` (remove `preview` from `GLOBAL_IMPORTS` line 27)
  - Secondary: `[readonly] apps/brikette/src/routes/guides/guide-manifest-overrides.ts` (may need update if it re-exports node-specific functions)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 92% — Mostly file deletion and line removal; well-identified targets
  - Approach: 88% — Clean removal of no-longer-needed code; keeping `getManifestGuideStatus` for SSR-safe status checks
  - Impact: 85% — `env.ts` and `robots.ts` are shared; careful line editing. Override system removal affects test files.
- **Acceptance:**
  - `guide-authoring/` directory deleted
  - `PREVIEW_TOKEN` and `ENABLE_GUIDE_AUTHORING` removed from `env.ts`
  - Draft disallow rules removed from `robots.ts`
  - `guideStatus.ts` retains only `getManifestGuideStatus()`, all localStorage-based functions removed
  - `guide-manifest-overrides.node.ts` deleted
  - Override JSON files deleted
  - `preview-guide-hydration.test.tsx` deleted
  - `guide-manifest-overrides.node.test.ts` deleted
  - `preview` removed from `GLOBAL_IMPORTS` in `guides.imports.ts`
  - `pnpm --filter brikette typecheck && pnpm --filter brikette test` passes
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-15: `env.ts` contains neither `PREVIEW_TOKEN` nor `ENABLE_GUIDE_AUTHORING` (grep verification)
    - TC-16: `robots.ts` output contains no `draft` disallow lines
    - TC-17: `guideStatus.ts` exports only `getManifestGuideStatus` (no localStorage functions)
    - TC-18: `pnpm --filter brikette typecheck` passes
    - TC-19: `pnpm --filter brikette test` passes (deleted test files don't cause failures)
    - TC-20: `guides.imports.ts` GLOBAL_IMPORTS has no `preview` entry
  - **Acceptance coverage:** TC-15/16/17/20 → removal verification, TC-18/19 → build safety
  - **Test type:** build verification + existing test suite
  - **Test location:** Existing test suite
  - **Run:** `pnpm --filter brikette typecheck && pnpm --filter brikette test`
  - **End-to-end coverage:** N/A — cleanup task, verified by build
- **TDD execution plan:**
  - **Red:** Run full test suite before changes to establish baseline pass count
  - **Green:** Delete files and edit lines. Fix resulting import errors.
  - **Refactor:** Clean up any orphaned imports
- **Planning validation:**
  - Tests run: `pnpm --filter brikette test -- --testPathPattern=guide-manifest-overrides` — 2 suites, 27 tests passed
  - Test stubs written: N/A
  - Unexpected findings: `guide-manifest-overrides.test.ts` (browser-side) tests schema validation — may be worth keeping if it validates read-only override parsing
- **Rollout / rollback:**
  - Rollout: Single commit, completing Phase 1
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - `env.ts` lines 81-90 (env var declarations)
  - `robots.ts` lines 8-11, 21 (draft disallow rules)
  - 27 override tests currently pass — 2 suites will be deleted, need to verify remaining tests still pass

---

### TASK-05: Simplify two-tier status to direct `live` check

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/data/guides.index.ts` (change status type from `"published"` to use manifest `"live"` directly)
  - Primary: `apps/brikette/src/routes/guides/guide-manifest.ts` (remove `buildGuideStatusMap()`, `GuidePublicationStatus` type, `draftOnly` handling)
  - Primary: `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` (update `generateStaticParams` filter from `status === "published"` to `status === "live"`)
  - Primary: `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` (same update)
  - Primary: `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` (same update)
  - Primary: `apps/brikette/src/utils/guideStatus.ts` (update `getManifestGuideStatus` to return `GuideStatus` from `@acme/guide-system` instead of local type)
  - Secondary: `[readonly] packages/guide-system/src/manifest-types.ts`, `[readonly] apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (baseline from TASK-01)
- **Depends on:** TASK-01, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — Clear transformation: replace `"published"` with `"live"` throughout. Pure function changes.
  - Approach: 85% — Eliminates unnecessary indirection. `"live"` is the canonical status from manifest.
  - Impact: 80% — Touches critical `generateStaticParams` in 3 page files + status index. Baseline tests from TASK-01 provide safety net.
- **Acceptance:**
  - `guides.index.ts` uses `status: "live"` (not `"published"`) for guide entries
  - `GUIDE_STATUS_BY_KEY` maps to `GuideStatus` (`"draft" | "review" | "live"`)
  - `isGuidePublished()` renamed to `isGuideLive()` (or equivalent) checking `status === "live"`
  - `generateStaticParams` in 3 page files filters by `status === "live"`
  - Runtime 404 guard in page components checks `status === "live"`
  - `buildGuideStatusMap()` and `GuidePublicationStatus` type removed from `guide-manifest.ts`
  - `draftOnly` field removed from `GuideManifestEntry` usage (schema change deferred to TASK-07)
  - Regression tests from TASK-01 updated to use new status values and still pass
  - `pnpm --filter brikette typecheck && pnpm --filter brikette test` passes
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-21: `isGuideLive("santaMaria")` → `true` (known live guide)
    - TC-22: `isGuideLive("ageAccessibility")` → `false` (known draft guide)
    - TC-23: `getGuideStatus("nonexistentKey")` → `"draft"` (new safe default — unknown = not live)
    - TC-24: Published guide key set is identical before and after status terminology change (regression)
    - TC-25: `generateStaticParams` for experiences returns same slugs as before
    - TC-26: `generateStaticParams` for assistance returns same slugs as before
    - TC-27: `generateStaticParams` for how-to-get-here returns same slugs as before
  - **Acceptance coverage:** TC-21/22/23 → status logic correctness, TC-24-27 → zero regression in page generation
  - **Test type:** unit
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (update from TASK-01)
  - **Run:** `pnpm --filter brikette test -- --testPathPattern=guide-status-filtering`
  - **Cross-boundary coverage:** `GuideStatus` type from `@acme/guide-system` consumed by `guides.index.ts` — type compatibility verified by typecheck
  - **End-to-end coverage:** TC-25/26/27 test the full `generateStaticParams` path
- **TDD execution plan:**
  - **Red:** Update TASK-01 tests to expect `"live"` instead of `"published"`. Tests fail because code still uses `"published"`.
  - **Green:** Update `guides.index.ts` status values, rename `isGuidePublished` → `isGuideLive`, update 3 page files `generateStaticParams` filters and runtime guards.
  - **Refactor:** Remove `buildGuideStatusMap()` and `GuidePublicationStatus` from `guide-manifest.ts`. Clean up `draftOnly` references.
- **Planning validation:**
  - Tests run: `guide-manifest.status.test.ts` — need to verify it exists and what it covers
  - Test stubs written: N/A (covered by TASK-01 baseline)
  - Unexpected findings: Default for unknown guides changes from `"published"` to `"draft"` (safer — unknown guides should NOT render). Need to verify no code relies on unknown-key → published default.
- **What would make this ≥90%:**
  - Run staging build after changes to verify static export produces identical page set
- **Rollout / rollback:**
  - Rollout: Single commit. All currently-live guides must have `status: "live"` in manifest (they do — `buildGuideStatusMap` already gates on `live`).
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - `guides.index.ts:181-188` — current default-to-published logic
  - `guide-manifest.ts:4487-4505` — `buildGuideStatusMap()` to be removed
  - 3 page files with `generateStaticParams`: `experiences/[slug]/page.tsx:23-36`, `assistance/[article]/page.tsx:22-35`, `how-to-get-here/[slug]/page.tsx:24-39`

---

### TASK-06: Filter non-live guide content from build bundle

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/brikette/src/locales/guides.imports.ts` (filter `CONTENT_KEYS` to only include live guides)
  - Primary: `apps/brikette/src/locales/_guides/node-loader.ts` (filter content files in `readSplitNamespace()`)
  - Primary: `apps/brikette/src/data/generate-guide-slugs.ts` or equivalent (ensure `GENERATED_GUIDE_SLUGS` only includes live guides, or filter downstream)
  - Secondary: `[readonly] apps/brikette/src/data/guides.index.ts` (provides status data)
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 85% — Clear filter point in `guides.imports.ts` (line 14, `CONTENT_KEYS`). Node loader needs similar filter.
  - Approach: 82% — Filtering at content-key level is the right granularity. Alternative (namespace-level filter) would be more complex.
  - Impact: 78% — Changes content loading chain that serves ALL guide pages. Must verify live guides load correctly after filtering.
- **Acceptance:**
  - `CONTENT_KEYS` in `guides.imports.ts` only includes keys for live guides
  - `readSplitNamespace()` in `node-loader.ts` only reads content files for live guides
  - Build logs which guides were excluded (console.info at build time)
  - Build warns if a live guide has no content file
  - All published guide pages render identical content
  - Content for non-live guides is NOT present in the build output
  - `pnpm --filter brikette typecheck && pnpm --filter brikette test` passes
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-28: `CONTENT_KEYS` count matches number of live guides (not total guides)
    - TC-29: `CONTENT_KEYS` includes all live guide content keys
    - TC-30: `CONTENT_KEYS` excludes known draft guide content keys
    - TC-31: `loadGuidesNamespaceFromImports("en")` returns content only for live guides
    - TC-32: Published guide pages render without error after content filtering
    - TC-33: Build output (`out/` directory for static export) does not contain draft guide content references
  - **Acceptance coverage:** TC-28/29/30 → filter correctness, TC-31 → runtime loading, TC-32 → integration, TC-33 → build verification
  - **Test type:** unit + integration + build verification
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-content-filtering.test.ts` (new)
  - **Run:** `pnpm --filter brikette test -- --testPathPattern=guide-content-filtering`
  - **End-to-end coverage:** TC-32 — published guide rendering after content filtering
- **TDD execution plan:**
  - **Red:** Write TC-28/29/30 tests importing `CONTENT_KEYS` and checking against live guide list. Tests fail because `CONTENT_KEYS` still includes all guides.
  - **Green:** Add status-based filter to `CONTENT_KEYS` derivation. Import `isGuideLive` (from TASK-05) or use `GUIDE_STATUS_BY_KEY` to filter. Apply same filter in `readSplitNamespace()`.
  - **Refactor:** Extract filter logic into shared utility function used by both import loader and node loader.
- **Planning validation:**
  - Tests run: No existing tests for content filtering
  - Test stubs written: N/A
  - Unexpected findings: `CONTENT_KEYS` derives from `GENERATED_GUIDE_SLUGS` which may be a build-time generated file. Need to check if filtering can happen at import time or needs to be at generate time.
- **What would make this ≥90%:**
  - Prototype the filter in a branch, run staging build, verify bundle size reduction and published guide rendering
  - Add build-time test that checks `out/` directory for draft content absence
- **Rollout / rollback:**
  - Rollout: Single commit. Verify staging build before production.
  - Rollback: `git revert` — reverts to bundling all content (safe, just larger bundle)
- **Documentation impact:** None
- **Notes / references:**
  - `guides.imports.ts:14` — `const CONTENT_KEYS = Object.keys(GENERATED_GUIDE_SLUGS)`
  - `node-loader.ts` `readSplitNamespace()` — reads `guides/content/*.json` from directory listing
  - Circular dependency risk: `guides.imports.ts` → `generate-guide-slugs` ↔ `guides.index.ts`. Verify filter import doesn't create cycle.

---

### TASK-07: Add `sites` field to manifest schema for multi-site preparation

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `packages/guide-system/src/manifest-types.ts` (add `sites` field to `GuideManifestEntry`, update `createManifestEntrySchema()`)
  - Primary: `apps/brikette/src/data/guides.index.ts` (update status resolution to check `entry.sites?.brikette?.status ?? entry.status`)
  - Secondary: `[readonly] apps/business-os/src/app/guides/edit/[guideKey]/components/EditorialSidebar.tsx` (future: show per-site status)
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Adding optional field to existing type + Zod schema. Clear pattern from existing optional fields.
  - Approach: 82% — `Record<string, { status?: GuideStatus }>` is the simplest shape. Alternative shapes (array, nested object) are more complex without benefit.
  - Impact: 82% — Schema change in `@acme/guide-system` affects both apps, but field is optional so existing code is unaffected.
- **Acceptance:**
  - `GuideManifestEntry` has optional `sites?: Record<string, { status?: GuideStatus }>` field
  - `createManifestEntrySchema()` validates `sites` field correctly
  - Status resolution in `guides.index.ts` checks `entry.sites?.brikette?.status` before `entry.status`
  - `@acme/guide-system` builds successfully
  - Both apps typecheck successfully
  - Existing guides without `sites` field work identically (backwards compatible)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-34: `GuideManifestEntry` with no `sites` field parses successfully (backwards compat)
    - TC-35: `GuideManifestEntry` with `sites: { brikette: { status: "live" } }` parses and resolves to `"live"` for brikette
    - TC-36: `GuideManifestEntry` with `sites: { brikette: { status: "draft" } }` but `status: "live"` → brikette resolves to `"draft"` (per-site overrides global)
    - TC-37: `GuideManifestEntry` with `sites: { otherSite: { status: "live" } }` → brikette uses global `status` (no brikette-specific override)
    - TC-38: `createManifestEntrySchema()` rejects invalid `sites` values (e.g., `sites: { brikette: { status: "invalid" } }`)
  - **Acceptance coverage:** TC-34 → backwards compat, TC-35/36/37 → resolution logic, TC-38 → schema validation
  - **Test type:** unit
  - **Test location:** `packages/guide-system/src/__tests__/manifest-sites.test.ts` (new)
  - **Run:** `pnpm --filter @acme/guide-system test -- --testPathPattern=manifest-sites`
  - **Cross-boundary coverage:** Schema validated in `@acme/guide-system`, consumed by `brikette/guides.index.ts` — type compatibility verified by both apps' typecheck
  - **End-to-end coverage:** N/A — schema preparation, no user-facing flow yet
- **TDD execution plan:**
  - **Red:** Write TC-34-38 tests. Tests fail because `sites` field doesn't exist yet.
  - **Green:** Add `sites` optional field to `GuideManifestEntry` type and Zod schema. Update `guides.index.ts` status resolution to prefer per-site status.
  - **Refactor:** Extract status resolution into a named function (`resolveGuideStatusForSite(entry, siteKey)`)
- **Planning validation:**
  - Tests run: `pnpm --filter @acme/guide-system test` — need to verify test infrastructure exists
  - Test stubs written: N/A
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Single commit. Optional field, fully backwards compatible.
  - Rollback: `git revert`
- **Documentation impact:**
  - Update `docs/plans/guide-publication-decoupling-fact-find.md` status to Complete
- **Notes / references:**
  - Pattern: Existing optional fields in `GuideManifestEntry` (`metaKey?`, `options?`, `expectations?`, `template?`, `focusKeyword?`)
  - `manifest-types.ts:132-152` — current type definition
  - `manifest-types.ts:158-275` — `createManifestEntrySchema()`

---

## Risks & Mitigations

- **Risk: Published guide regression** — Status change from `"published"` to `"live"` could miss a guide if manifest status is wrong.
  - Mitigation: TASK-01 creates regression baseline snapshots. TASK-05 verifies identical page set before/after. Run staging build.
- **Risk: Content bundle filter breaks guide rendering** — Excluding content files could cause runtime errors if a page tries to load excluded content.
  - Mitigation: TASK-06 includes build-time warning for live guides with missing content. Runtime 404 guard prevents rendering non-live guides.
- **Risk: Circular dependency in content filtering** — `guides.imports.ts` → `generate-guide-slugs` ↔ `guides.index.ts` status data.
  - Mitigation: TASK-06 investigates import graph before implementation. May filter at generate time rather than import time.
- **Risk: Breaking business-os API contracts** — Brikette's API routes are deleted, but business-os has its own copies.
  - Mitigation: business-os API routes are independent. Only brikette's copies are deleted.

## Observability

- Logging: Build-time `console.info` listing excluded non-live guides (TASK-06)
- Logging: Build-time `console.warn` if live guide has missing content file (TASK-06)
- Metrics: None needed (internal tooling, not user-facing service)
- Alerts/Dashboards: None needed

## Acceptance Criteria (overall)

- [ ] No draft routes, API routes, editorial panel, or preview components remain in brikette
- [ ] `PREVIEW_TOKEN` and `ENABLE_GUIDE_AUTHORING` env vars removed from brikette
- [ ] Status system uses `"live"` directly, no `"published"` / `draftOnly` indirection
- [ ] Non-live guide content excluded from build bundle
- [ ] `GuideManifestEntry` schema supports optional per-site status
- [ ] All currently-published guides render identical pages after changes
- [ ] `pnpm --filter brikette typecheck && pnpm --filter brikette test` passes
- [ ] `pnpm --filter @acme/guide-system build` passes

## Decision Log

- 2026-02-08: Keep manifest in brikette (not move to `@acme/guide-system`) — lower risk, smaller scope, move deferred to future phase
- 2026-02-08: Multi-site is schema-only preparation — no second consumer site exists yet
- 2026-02-08: Replace `"published"` status with direct `"live"` check — eliminates unnecessary indirection
- 2026-02-08: Default for unknown guide keys changes from `"published"` to `"draft"` — safer default (unknown = don't render)
