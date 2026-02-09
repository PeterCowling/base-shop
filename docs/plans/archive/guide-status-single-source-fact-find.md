---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CMS
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: guide-status-single-source
Related-Plan: docs/plans/guide-status-single-source-plan.md
Business-Unit: BRIK
---

# Guide Status Single Source of Truth — Fact-Find Brief

## Scope

### Summary

`GUIDES_INDEX` (in `guides.index.ts`) and `guide-manifest.ts` both declare a status for every guide, but they are maintained independently. Publishing a guide requires editing **both** files manually, then committing and deploying. This creates a confirmed divergence bug (see Evidence below) and blocks any future "publish button" in Business OS.

The goal is to derive GUIDES_INDEX status from the manifest, making the manifest the single source of truth and eliminating the manual double-edit.

### Goals

- Single source of truth: `guide-manifest.ts` status is the canonical status
- `GUIDES_INDEX` derives its status from the manifest at module load time
- Remove the `status` field from `GUIDES_INDEX_BASE` declarations entirely
- Preserve all existing filtering behavior (47 consumers, build-time content filtering, static generation)
- Fix the confirmed `santaMariaDelCastelloHike` inconsistency (index=live, manifest=draft)

### Non-goals

- Changing the "publish via code edit + deploy" workflow (that's a separate feature: Business OS publish button)
- Changing the manifest schema itself (TASK-07 already added `sites` field)
- Moving manifest data out of brikette's source tree

### Constraints & Assumptions

- Constraints:
  - No circular imports (currently safe — see analysis below)
  - Must not regress 119 live guide count or 12 draft guide count (test TC-24, TC-05)
  - Must preserve existing `tags` field in GUIDES_INDEX (not in manifest)
  - Module initialization order must guarantee manifest is registered before index evaluates
- Assumptions:
  - Every guide in GUIDES_INDEX has a corresponding manifest entry (needs validation — see Open Questions)
  - The how-to-get-here route guides (spread from `HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS`) all have manifest entries

## Repo Audit (Current State)

### Entry Points

- `apps/brikette/src/data/guides.index.ts` — The index: declares `GUIDES_INDEX_BASE` array with `{key, tags, status?}`, derives `GUIDES_INDEX` by adding `section` from `guideNamespaceKey()`, defaults missing status to `"live"` (line 187)
- `apps/brikette/src/routes/guides/guide-manifest.ts` — The manifest: 4,500-line file with 135 `GuideManifestEntry` objects, each has explicit `status: "draft" | "live"`. Calls `registerManifestEntries()` at module level (line 4259)

### Key Modules / Files

- `apps/brikette/src/data/guides.index.ts` — **Primary target.** 294 lines, 107 explicit entries + how-to-get-here spread. Status defaults to `"live"` if omitted. Exports: `GUIDES_INDEX`, `isGuideLive()`, `getGuideStatus()`, `GUIDE_STATUS_BY_KEY`, collections, type/tag utilities
- `apps/brikette/src/routes/guides/guide-manifest.ts` — **Source of truth (target).** 135 entries with explicit status. 114 draft, 23 live (grep counts). No review entries currently
- `apps/brikette/src/guides/slugs/namespaces.ts` — Bridge: imports from `guide-manifest.ts`, exports `guideNamespaceKey()`. Already imported by `guides.index.ts`
- `packages/guide-system/src/manifest-registry.ts` — Singleton registry: `registerManifestEntries()` populates a Map, `getGuideManifestEntry()` reads it
- `apps/brikette/src/locales/guides.imports.ts` — Consumes `isGuideLive()` for content bundle filtering (TASK-06)
- `apps/brikette/src/locales/_guides/node-loader.ts` — Consumes `isGuideLive()` for SSR content loading (TASK-06)
- `apps/brikette/src/data/how-to-get-here/routeGuides.ts` — Declares how-to-get-here route guide keys, spread into GUIDES_INDEX_BASE with `status: "live" as const`

### Patterns & Conventions Observed

- Module-level evaluation pattern: `guide-manifest.ts` calls `registerManifestEntries()` at the top level, populating the registry before any downstream module evaluates — evidence: `guide-manifest.ts:4259`
- Status defaulting: GUIDES_INDEX defaults to `"live"` (line 187), `getGuideStatus()` defaults unknown keys to `"draft"` (line 232) — these are opposite defaults, creating a latent inconsistency vector
- Derived sections: `GUIDES_INDEX` already derives `section` from manifest (via `guideNamespaceKey()`), proving the pattern of reading manifest at index build time works

### Data & Contracts

- Types/schemas:
  - `GuideMeta` in `guides.index.ts` — `{ key: GuideKey, tags: string[], section: GuideNamespaceKey, status?: "draft" | "review" | "live" }`
  - `GuideManifestEntry` in `@acme/guide-system` — includes `status: GuideStatus` (required after schema transform, defaults to `"draft"`)
  - `GuideStatus` = `"draft" | "review" | "live"` from `@acme/guide-system`
- Persistence:
  - Both are source-code declarations (TypeScript files committed to git)
  - No database, no runtime state — purely compile-time/module-init-time
- API/event contracts:
  - Business OS writes to manifest overrides via `/api/guides/{key}/manifest` — but this writes to a JSON overrides file, not to the source manifest

### Dependency & Impact Map

- Upstream dependencies:
  - `guide-manifest.ts` → `@acme/guide-system` (types, `registerManifestEntries`)
  - `guide-manifest.ts` → `keys.ts`, `slugs.ts` (guide key/slug unions)
  - `guides.index.ts` → `namespaces.ts` → `guide-manifest.ts` (transitive)
- Downstream dependents (of `guides.index.ts`):
  - **47 files** across routes, components, utilities, locales, and tests
  - Key consumers: 12 route/page files, 12 component files, 6 utility files, 2 locale files, 11 test files
  - Only 1 file (`_GuideSeoTemplate.tsx`) imports both `guides.index` and `guide-manifest`
- Likely blast radius:
  - **High if status values change** — affects static generation, routing, content loading, UI filtering
  - **Low if API contract preserved** — `isGuideLive()`, `getGuideStatus()`, `GUIDE_STATUS_BY_KEY` signatures unchanged

### Circular Dependency Analysis

**No circular dependency exists.** The import graph is acyclic:

```
guides.index.ts
  → namespaces.ts
    → guide-manifest.ts
      → @acme/guide-system (manifest-registry)
      → keys.ts
      → slugs.ts
```

`guide-manifest.ts` does NOT import from `guides.index.ts` (directly or transitively). Verified by tracing all imports of `guide-manifest.ts` — none lead back to `guides.index.ts`.

### Module Initialization Order

JavaScript ES module evaluation is depth-first. The evaluation order is:

1. `guide-manifest.ts` executes first → calls `registerManifestEntries(allManifestEntries)` → registry populated
2. `namespaces.ts` executes → `getGuideManifestEntry()` now works (registry is populated)
3. `guides.index.ts` executes last → `guideNamespaceKey()` calls succeed

**This means `guides.index.ts` CAN safely read manifest status at module evaluation time.** This is already proven by the existing `section` derivation on line 185.

### Confirmed Status Inconsistencies

| Guide Key | GUIDES_INDEX status | Manifest status | Bug? |
|-----------|-------------------|-----------------|------|
| `santaMariaDelCastelloHike` | `"live"` (explicit, line 78) | `"draft"` (line 1059) | **YES** |
| Guides without explicit status in index | `"live"` (default) | Various (`"draft"` / `"live"`) | **Likely** |

The GUIDES_INDEX defaults missing status to `"live"` (line 187), while the manifest schema defaults to `"draft"`. This means **any guide without an explicit `status` field in GUIDES_INDEX_BASE is treated as live in the index, regardless of its manifest status.**

Out of 107 explicit entries + ~30 how-to-get-here entries, only 12 have explicit `status: "draft"`. The remaining ~95 non-HTH guides default to `"live"`, but 114 manifest entries are `"draft"`. This means **many guides may be incorrectly "live" in the index while "draft" in the manifest.**

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest
- **Commands:** `pnpm --filter brikette test`, `npx jest --testPathPattern=...`
- **CI integration:** Tests run in reusable-app.yml (skipped on staging branch, active on dev/main)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Index status filtering | unit | `guide-status-filtering.test.ts` | TC-21–TC-24, TC-05: live/draft filtering, counts, key snapshots |
| Content filtering | unit | `guide-content-filtering.test.ts` | TC-28–TC-32: CONTENT_KEYS matches live guides |
| Manifest sites field | unit | `manifest-sites.test.ts` | TC-34–TC-38: per-site status overrides |
| Namespace migration | unit | `guide-namespace-migration.test.ts` | Section derivation consistency |

#### Coverage Gaps (Planning Inputs)

- **No cross-validation test** between GUIDES_INDEX status and manifest status — this is the root cause of the inconsistency
- **No test verifying every GUIDES_INDEX key has a manifest entry** — some index entries may lack manifest entries

#### Testability Assessment
- **Easy to test:** Status derivation logic (pure function, manifest registry mockable)
- **Hard to test:** Full integration with 135+ entries (but snapshot tests handle this)
- **Test seams needed:** None — existing `isGuideLive()` / `getGuideStatus()` API is the seam

#### Recommended Test Approach
- **Regression test:** Snapshot of all guide statuses before/after migration (like TC-05 but comprehensive)
- **Cross-validation test:** Assert every GUIDES_INDEX key exists in manifest
- **Count test:** Update TC-24 expected count after fixing inconsistencies

### Recent Git History (Targeted)

```
bfc98f67b4 feat(guide-system): add per-site publication status field (TASK-07)
fad74ed4b0 feat(brikette): filter non-live guide content from build bundle (TASK-06)
244c5f8355 refactor(brikette): unify status to direct live check (TASK-05)
d89da1c304 refactor(brikette): remove authoring utilities (TASK-04)
```

TASK-05 unified terminology ("published" → "live") and TASK-06 added content filtering using `isGuideLive()`. Both depend on the GUIDES_INDEX as the status source. This fact-find addresses the remaining gap.

## Questions

### Resolved

- Q: Can `guides.index.ts` read from the manifest at module evaluation time?
  - A: **Yes.** Module initialization order guarantees `guide-manifest.ts` (and `registerManifestEntries()`) executes before `guides.index.ts` evaluates. Already proven by `section` derivation on line 185.
  - Evidence: Import chain `guides.index.ts → namespaces.ts → guide-manifest.ts` ensures depth-first evaluation.

- Q: Are there circular dependency risks?
  - A: **No.** `guide-manifest.ts` does not import (directly or transitively) from `guides.index.ts`. The dependency is one-way.
  - Evidence: Traced all imports of `guide-manifest.ts` — none reference `guides.index` or its dependents.

- Q: Does every GUIDES_INDEX entry have a manifest entry?
  - A: **Likely not.** GUIDES_INDEX has 107 explicit entries + ~30 how-to-get-here entries = ~137 total. Manifest has 135 entries. Some index entries (like `fornilloBeachToBrikette`) appear only in the index, not as manifest entry keys. The implementation must handle missing manifest entries gracefully.

### Open (User Input Needed)

- Q: When deriving status from manifest, what should happen for GUIDES_INDEX entries that have NO manifest entry?
  - Why it matters: Some guides in the index don't have manifest entries. Defaulting to `"draft"` would hide currently-visible guides. Defaulting to `"live"` preserves current behavior but masks the missing-entry problem.
  - Decision impacted: Default status for entries without manifest entries.
  - Default assumption: Default to `"draft"` (safe — hides unmanifested guides) + add manifest entries for any currently-live guides that lack them. Risk: Temporarily breaks a few guides if manifest entries are missing.

- Q: Should the ~90 guides that are currently "live" in GUIDES_INDEX but "draft" in the manifest be treated as draft or live after unification?
  - Why it matters: This is the bulk of the inconsistency. Making manifest authoritative means these guides go from visible to invisible on production.
  - Decision impacted: Whether migration requires updating 90+ manifest entries to "live" first.
  - Default assumption: Update manifest entries to match current GUIDES_INDEX status before switching to single source. Risk: Large diff, but necessary for correctness.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 90%
  - The pattern is already proven (section derivation). The change is mechanical: replace `entry.status ?? "live"` with `getGuideManifestEntry(entry.key)?.status ?? "draft"`. Module init order is safe. No circular deps.
  - What would raise to 95%: Confirm the exact set of guides with missing manifest entries.

- **Approach:** 85%
  - Deriving from manifest is clearly the right long-term design. The `sites` field (TASK-07) was specifically designed for this. The only risk is the data migration (aligning 90+ manifest statuses with index statuses).
  - What would raise to 95%: A dry-run script that compares index vs manifest status for all guides and produces the exact migration diff.

- **Impact:** 80%
  - 47 consumers, but the API surface (`isGuideLive()`, `getGuideStatus()`, `GUIDE_STATUS_BY_KEY`) stays identical. The risk is status VALUES changing (some guides flipping from live to draft or vice versa). Existing tests (TC-24, TC-05) will catch count/set changes.
  - What would raise to 90%: Migration test that snapshots all statuses before and after, confirming zero unintended flips.

- **Testability:** 95%
  - Existing tests cover the key behaviors. Adding a cross-validation test and updating snapshots is straightforward. `isGuideLive()` is a pure function backed by a static map.

## Planning Constraints & Notes

- Must-follow patterns:
  - `guides.index.ts` already derives `section` from manifest — follow the same pattern for `status`
  - Preserve `isGuideLive()` / `getGuideStatus()` / `GUIDE_STATUS_BY_KEY` API unchanged
  - Use `getGuideManifestEntry()` from the shared registry (same as `namespaces.ts` does)
- Rollout/rollback expectations:
  - **Two-phase**: First align manifest statuses with current index statuses (data migration), then switch index to derive from manifest (code change)
  - Rollback: Revert the code change; the old `GUIDES_INDEX_BASE` status declarations can be restored from git history
- Observability expectations:
  - Regression tests (TC-24 live count, TC-05 draft key set) serve as the observability layer
  - A migration script should output a comparison table for human review before committing

## Suggested Task Seeds (Non-binding)

1. **Audit & align statuses** — Script that compares GUIDES_INDEX status vs manifest status for every guide, outputs discrepancies, generates a migration diff to update manifest entries
2. **Add missing manifest entries** — For any GUIDES_INDEX entries without manifest entries (e.g. `fornilloBeachToBrikette`), add minimal manifest entries
3. **Derive status from manifest** — Change `GUIDES_INDEX` to read status from `getGuideManifestEntry()` instead of declaring it in `GUIDES_INDEX_BASE`
4. **Remove status from GUIDES_INDEX_BASE** — Delete `status` field from all entries in `GUIDES_INDEX_BASE` (now derived)
5. **Add cross-validation test** — Test that asserts every GUIDES_INDEX key has a manifest entry and status matches
6. **Update snapshot tests** — Adjust TC-24 count and TC-05 key set if any guides flip status during alignment

## Planning Readiness

- Status: **Ready-for-planning** (open questions are non-blocking — defaults are safe)
- Blocking items: None (open questions have safe default assumptions)
- Recommended next step: Proceed to `/plan-feature guide-status-single-source`
