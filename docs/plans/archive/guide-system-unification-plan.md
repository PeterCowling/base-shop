---
Type: Plan
Status: Historical
Domain: CMS / UI
Relates-to charter: Content unification
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27T17:28:00Z
Completed: 2026-01-27
Feature-Slug: guide-system-unification
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Archived: 2026-01-27
---

# Guide System Unification Plan


## Active tasks

No active tasks at this time.

## Summary

Unify the “guide system layer” across Brikette so that:

- Routing helpers (`guideNamespaceKey()` / `guideNamespace()`)
- Tag discovery (`GUIDES_INDEX`)
- Related content (`relatedGuidesByTags()`)
- Template behaviour defaults (structured data)

…all agree on a single area taxonomy: `experiences | assistance | howToGetHere`.

This plan **does not** attempt to rewrite how-to-get-here transport route rendering (currently `HowToGetHereContent`). Renderer/content migration is explicitly separated so this work stays deterministic and low-risk.

## Notes on “CI”

In this document, **CI** means **Confidence Index** (the score in the YAML frontmatter), not CI/CD pipelines.

## Success Signals (What “Good” Looks Like)

- `GUIDES_INDEX.section` matches `guideNamespaceKey(guide.key)` for every entry.
- No remaining `"help"` section value in code paths that represent user-facing areas (replaced by `assistance`).
- How-to-get-here transport route guide keys are classified as `howToGetHere` in discovery and related-guide filtering.
- `GuideSeoTemplate` emits HowTo JSON-LD when a guide manifest entry declares `structuredData: [..., "HowTo", ...]` (unless explicitly overridden by the caller).
- Existing URLs and page rendering behaviour remain unchanged (including continued use of `HowToGetHereContent` for transport routes).

## Goals

- Make the area taxonomy a single source of truth:
  - `guideNamespaceKey()` remains canonical for URL base routing.
  - `GUIDES_INDEX.section` becomes consistent with that routing.
- Reduce ongoing drift by removing duplicate “area/section” decisions spread across data + UI.
- Align structured data defaults with `guide-manifest.ts` declarations (starting with HowTo).

## Non-goals

- Migrating transport routes away from `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx`
- Converting how-to-get-here route locale JSON (`apps/brikette/src/locales/*/how-to-get-here/routes/*.json`) into guide-native content
- Changing any public URLs or the `/experiences/tags/*` route structure
- Redesigning guide UI

## Constraints & Assumptions

**Constraints:**
- URLs must remain stable (SEO critical).
- Changes must be reversible via git revert.
- Avoid a “flag framework” assumption; Brikette primarily uses env toggles and explicit branching.

**Assumptions:**
- `guideNamespaceKey()` already captures the intended “top-level area” decision (manifest-first, override fallback).
- Most section consumers either use the value for styling/filters or can tolerate a semantic rename from `"help"` → `assistance`.

## Related Work

- Completed prerequisite: `docs/plans/how-to-get-here-guides-migration-plan.md` (registers the 24 transport routes as guide keys for slugs/namespaces/indexing without changing rendering).

## Audit Updates (2026-01-27)

Concrete repo findings that drive this plan’s approach:

- How-to-get-here `[slug]` routing is already **hybrid**: route-definition first, then guide fallback:
  - `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`
- Transport routes already exist as guide keys and are indexed + tested:
  - Source of truth: `apps/brikette/src/data/how-to-get-here/routeGuides.ts`
  - GUIDES_INDEX integration: `apps/brikette/src/data/guides.index.ts`
  - Regression tests: `apps/brikette/src/routes/how-to-get-here/__tests__/routeGuides.test.ts`
- Namespace/base routing is already **manifest-first with override fallback**:
  - `apps/brikette/src/guides/slugs/namespaces.ts` (`guideNamespaceKey()`)
- `GuideSeoTemplate` has slot hooks (`articleLead/articleExtras/afterArticle`), but HowTo JSON-LD emission is currently **opt-in via prop**, not derived from manifest:
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/useHowToJson.ts`
  - Manifest declarations include `"HowTo"` for some guides:
    - `apps/brikette/src/routes/guides/guide-manifest.ts`

## Proposed Approach

1. Treat `guideNamespaceKey()`’s output (`experiences | assistance | howToGetHere`) as the canonical “area” taxonomy.
2. Update discovery (`GUIDES_INDEX.section`) and all section consumers to use that taxonomy (eliminate `"help"` as an area value).
3. Derive HowTo structured data defaults from manifest declarations to reduce route-by-route ad-hoc configuration.
4. Keep transport route rendering unchanged; ship these taxonomy/policy changes independently and safely.

## Task Summary

| Task ID | Type | Description | CI | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Introduce unified guide area/section types (no `"help"` leakage) | 92% | S | Complete | - |
| TASK-02 | IMPLEMENT | Make `GUIDES_INDEX.section` align with `guideNamespaceKey()` | 90% | M | Complete | TASK-01 |
| TASK-03 | IMPLEMENT | Update section consumers + tests (`related`, coverage data, routeGuides expectations) | 90% | M | Complete | TASK-02 |
| TASK-04 | IMPLEMENT | Manifest-driven HowTo JSON-LD default in `GuideSeoTemplate` | 90% | M | Complete | - |
| TASK-05 | DOC | Write follow-on plan for transport renderer/content unification | 95% | S | Complete | TASK-03 |

> Effort scale: S=1, M=2, L=3

## Milestones

| Milestone | Focus | Tasks | Effort | CI |
|-----------|-------|-------|--------|-----|
| 1 | Area taxonomy + discovery alignment | TASK-01, TASK-02, TASK-03 | M | **90%** |
| 2 | Manifest-driven structured data defaults | TASK-04 | M | **90%** |
| 3 | Follow-on renderer migration planning | TASK-05 | S | **95%** |

## Tasks

### TASK-01: Introduce unified guide area/section types (no `"help"` leakage)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/data/guides.index.ts`
  - `apps/brikette/src/utils/related.ts`
  - (Optional, preferred) new shared type module to avoid duplication across `guide-manifest.ts` + index
- **CI:** 92%
  - Implementation: 92% — Mechanical type + rename work, easy to validate.
  - Approach: 92% — Reuse existing area mapping (`help` → `assistance`) from guide manifest semantics.
  - Impact: 92% — No routing changes; primarily compile-time + metadata semantics.
- **Acceptance:**
  - A single exported union is used for “area-like” values where the UI means user-visible areas:
    - `experiences | assistance | howToGetHere`
  - No consumer relies on `"help"` as a user-facing area value (internally `GuideArea` may still use `"help"` inside the manifest, but must map to `assistance` via `guideAreaToSlugKey()`).
  - Verify (and keep) the mapping helper:
    - `apps/brikette/src/routes/guides/guide-manifest.ts` exports `guideAreaToSlugKey()` and maps `help` → `assistance`.
- **Test plan:**
  - Typecheck: `pnpm typecheck`
  - Targeted tests as needed after TASK-03 (section expectation updates).
- **Rollout / rollback:**
  - Rollout: direct merge (type-level + derived semantics)
  - Rollback: revert commit

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** 9ff2f8f3d7
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
- **Documentation updated:** None required
- **Implementation notes:**
  - Added `GuideNamespaceKey` type to `guides.index.ts` as the canonical user-facing type
  - Type represents the namespace taxonomy: `"experiences" | "assistance" | "howToGetHere"`
  - Marked legacy `GuideSection` as `@deprecated` with migration notes
  - Verified `guideAreaToSlugKey()` in guide-manifest.ts correctly maps `help` → `assistance`
  - No changes needed to `utils/related.ts` at this stage (will be updated in TASK-03)

### TASK-02: Make `GUIDES_INDEX.section` align with `guideNamespaceKey()`

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/data/guides.index.ts`
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — Deterministic derivation based on already-canonical namespace routing.
  - Approach: 90% — Removes duplicate “section” decisions that drift over time.
  - Impact: 90% — Changes metadata used by filters/styling; no URL changes.
- **Acceptance:**
  - `GUIDES_INDEX.section` equals `guideNamespaceKey(guide.key)` for every entry.
  - Provide area-specific exports (keeping existing exports stable where possible):
    - Keep existing `EXPERIENCES_GUIDES` (already present today).
    - Add `ASSISTANCE_GUIDES` and `HOW_TO_GET_HERE_GUIDES`.
  - Any legacy exports (`HELP_GUIDES`) become aliases (or are removed) with all call sites updated in TASK-03.
- **Test plan:**
  - Update/add a focused assertion test (location depends on existing patterns):
    - Prefer extending `apps/brikette/src/routes/how-to-get-here/__tests__/routeGuides.test.ts` for route keys
    - Add a small unit test for a representative assistance key and an experiences key
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: direct merge
  - Rollback: revert commit

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** 874a06490b
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2` — PASS (31 tests)
- **Documentation updated:** None required
- **Implementation notes:**
  - Changed `GuideMeta.section` type to `GuideNamespaceKey`
  - Section is now derived from `guideNamespaceKey()` in GUIDES_INDEX build
  - Removed hardcoded `section: "help"/"experiences"` from base entries
  - Added `ASSISTANCE_GUIDES` and `HOW_TO_GET_HERE_GUIDES` exports
  - `HELP_GUIDES` kept as deprecated alias pointing to `ASSISTANCE_GUIDES`
  - `GUIDE_SECTION_BY_KEY` now typed as `Record<GuideKey, GuideNamespaceKey>`
  - Updated existing test expectation from `"help"` to `"howToGetHere"` for route guides
  - Added invariant test: section === guideNamespaceKey() for all entries

### TASK-03: Update section consumers + tests

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/utils/related.ts` (section filtering)
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (styling decisions based on section)
  - `apps/brikette/src/routes/how-to-get-here/__tests__/routeGuides.test.ts` (section expectations)
  - `apps/brikette/src/routes/guides/__tests__/coverage-data.ts` (fixture section values)
  - Any other call sites found by searching for `"help"` usage
- **Depends on:** TASK-02
- **CI:** 90%
  - Implementation: 90% — Straightforward updates + test expectation changes.
  - Approach: 90% — Search-driven, finite list of call sites.
  - Impact: 90% — Behaviour unchanged aside from metadata semantics; tests lock this in.
- **Acceptance:**
  - No remaining `"help"` in `GuideSection` comparisons/filters (except where `"help"` is an internal manifest value).
  - Route guide keys now expect `section === "howToGetHere"` in tests.
  - Tag pages and related guide selection still work (no runtime errors; same URLs).
  - Styling behaviour is preserved:
    - `experiences` guides keep the existing “heavier headings” behaviour.
    - `assistance` and `howToGetHere` guides keep the existing “lighter headings” behaviour (previously both were `"help"`).
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
  - Run: `pnpm --filter @apps/brikette test guide-namespace-migration -- --maxWorkers=2`
  - Sanity search (to catch missed call sites): `rg -n -t ts "\"help\"" apps/brikette/src`
- **Rollout / rollback:**
  - Rollout: direct merge
  - Rollback: revert commit

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** 10ffa6f198
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2` — PASS (31 tests)
  - Ran: `pnpm --filter @apps/brikette test guide-namespace-migration -- --maxWorkers=2` — PASS (4 tests)
  - Sanity search: `rg -n -t ts '"help"' apps/brikette/src` — Remaining usages are acceptable:
    - guide-manifest.ts internal values
    - GuideSection type for backwards compat
    - normaliseGuideSection() backwards compat
- **Documentation updated:** None required
- **Implementation notes:**
  - Updated `normaliseGuideSection()` in BlockAccumulator.ts and alsoHelpfulBlock.ts
    to accept new namespace values while keeping backwards compat for "help"
  - Updated coverage-data.ts fixture sections to match actual namespace assignments
  - Styling behavior preserved (experiences = bold, others = semibold)
  - `utils/related.ts` unchanged - works correctly with new types

### TASK-04: Manifest-driven HowTo JSON-LD default in `GuideSeoTemplate`

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/useHowToJson.ts` (tests only, if needed)
  - `apps/brikette/src/test/routes/guides/__tests__/*` (new focused test)
- **Depends on:** -
- **CI:** 90%
  - Implementation: 90% — Use existing `manifestEntry.structuredData` declarations.
  - Approach: 90% — Backwards-compatible defaulting: explicit prop still wins.
  - Impact: 90% — Adds JSON-LD on pages that already declare HowTo intent; measurable and revertible.
- **Acceptance:**
  - If `includeHowToStructuredData` prop is provided, it wins (no behaviour change for callers that intentionally override).
  - Otherwise, default `includeHowToStructuredData` to `true` when:
    - `manifestEntry?.structuredData` includes `"HowTo"` (string declaration) OR `{ type: "HowTo", ... }`
  - Add a unit test that asserts a manifest-declared HowTo guide (e.g. `pathOfTheGods` or `laundryPositano`) produces a non-null HowTo JSON payload.
- **Test plan:**
  - Add/extend: a focused unit test under `apps/brikette/src/test/routes/guides/__tests__/`
  - Run: `pnpm --filter @apps/brikette test structured-toc-block.policy -- --maxWorkers=2` (if impacted)
  - Run: `pnpm --filter @apps/brikette test guide-manifest-overrides -- --maxWorkers=2` (if impacted)
- **Rollout / rollback:**
  - Rollout: direct merge
  - Rollback: revert commit
- **Notes:**
  - This does not attempt to change how-to-get-here transport routes, which already emit HowTo JSON-LD from `HowToGetHereContent`.

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** a599889bdd
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
  - Ran: `pnpm lint` — PASS
  - Ran: `pnpm --filter @apps/brikette test howto-manifest-default -- --maxWorkers=2` — PASS (14 tests)
  - Ran: `pnpm --filter @apps/brikette test structured-toc-block.policy -- --maxWorkers=2` — PASS (12 tests)
  - Ran: `pnpm --filter @apps/brikette test guide-manifest-overrides -- --maxWorkers=2` — PASS (40 tests)
- **Documentation updated:** None required
- **Implementation notes:**
  - Added `manifestDeclaresHowTo()` helper to check for HowTo in structuredData array
  - Supports both string declarations (`"HowTo"`) and object declarations (`{ type: "HowTo", ... }`)
  - Changed `includeHowToStructuredData` prop default from `false` to `undefined`
  - Computed `effectiveIncludeHowToStructuredData`: explicit prop wins, otherwise derived from manifest
  - New test file: `apps/brikette/src/test/routes/guides/__tests__/howto-manifest-default.test.ts`
  - Tests verify: helper logic, manifest entry declarations, defaulting behavior expectations

### TASK-05: Write follow-on plan for transport renderer/content unification

- **Type:** DOC
- **Affects:** new plan doc under `docs/plans/`
- **Depends on:** TASK-03
- **CI:** 95%
  - Implementation: 95% — Plan writing, no code.
  - Approach: 95% — Use the audit facts and the now-unified taxonomy/policy baseline.
  - Impact: 95% — Documentation only.
- **Acceptance:**
  - New plan doc clearly separates:
    - Renderer unification options (reuse `HowToGetHereContent` vs adapt to `GuideSeoTemplate`)
    - Content migration options (`howToGetHere` namespace JSON → guide-native content)
    - Acceptance criteria for feature parity (galleries, callouts, Chiesa Nuova drop-in, structured data)
    - Test strategy (targeted; no unfiltered `pnpm test`)
    - Rollback plan

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** N/A (documentation only)
- **Validation:** N/A (no code changes)
- **Documentation updated:** Created `docs/plans/transport-renderer-content-unification-plan.md`
- **Implementation notes:**
  - Created comprehensive follow-on plan covering:
    - Three options analysis (A: Adapt to GuideSeoTemplate, B: Enhance HowToGetHereContent, C: Hybrid Wrapper)
    - Recommended Option A with phased approach (blocks → schema mapping → pilot → batch → cleanup)
    - Feature parity checklist (galleries, callouts, Chiesa Nuova, HowTo JSON-LD, meta/SEO)
    - High-level task breakdown with 8 tasks
    - Targeted test strategy (no unfiltered `pnpm test`)
    - Per-route and phase-level rollback strategy
    - Risks and mitigations table
    - Open questions for DECISION task

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Semantic rename breaks filters/styling | TASK-03 updates all call sites; add tests locking expected behaviour. |
| Some pages unexpectedly gain HowTo JSON-LD | Restrict defaulting to manifest entries that explicitly declare `"HowTo"`; keep explicit prop override. |
| Drift reappears between routing and discovery | Derive `GUIDES_INDEX.section` from canonical routing (`guideNamespaceKey()`). |
| `GuideSeoTemplate` behaviour change regresses non-target guides | Add a focused unit test for an experiences guide and an assistance guide when updating TASK-04; keep explicit prop override semantics. |

## Rollback Strategy (Global)

- Rollback is a straightforward `git revert` of the taxonomy/policy commits.
- No content files need migrating for this plan, which keeps reversibility simple.

## Acceptance Criteria (overall)

- [x] `GUIDES_INDEX.section === guideNamespaceKey(key)` for all entries (TASK-02)
- [x] No `"help"` in user-facing `GuideSection` comparisons (manifest internals may still use `"help"`) (TASK-03)
- [x] HowTo JSON-LD is emitted for manifest-declared HowTo guides (unless explicitly overridden) (TASK-04)
- [x] `pnpm typecheck` passes (verified for all tasks)
- [x] Targeted tests pass (at minimum: `routeGuides`, `guide-namespace-migration`, and the new HowTo defaulting test) (all pass)
