---
Type: Plan
Status: Complete
Domain: CMS
Created: 2026-02-08
Last-updated: 2026-02-09
Feature-Slug: guide-status-single-source
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BRIK
---

# Guide Status Single Source of Truth — Plan

## Summary

`GUIDES_INDEX` and `guide-manifest.ts` both independently declare a status for every guide, creating silent divergence bugs (confirmed: `santaMariaDelCastelloHike` is live in the index but draft in the manifest). This plan makes the manifest the single source of truth by: (1) migrating ~96 manifest entries from "draft" to "live" to match the current index reality, (2) switching `guides.index.ts` to derive status from the manifest registry at module init time, and (3) removing the now-redundant `status` field from `GUIDES_INDEX_BASE`. The public API (`isGuideLive()`, `getGuideStatus()`, `GUIDE_STATUS_BY_KEY`) stays identical.

## Goals

- Make `guide-manifest.ts` the single source of truth for guide status
- Derive `GUIDES_INDEX` status from the manifest at module load time (proven pattern — section derivation already works this way)
- Remove `status` from `GUIDES_INDEX_BASE` declarations entirely
- Fix all confirmed status inconsistencies (santaMariaDelCastelloHike, capriPositanoFerry, etc.)
- Preserve the existing 119 live / 12 draft count and the public API surface unchanged

## Non-goals

- Changing the publish workflow (Business OS publish button is a separate feature)
- Modifying the manifest schema (TASK-07 already added `sites` field)
- Moving manifest data out of brikette's source tree
- Adding `resolveGuideStatusForSite()` integration (exists but not consumed by the index yet — future work)

## Constraints & Assumptions

- Constraints:
  - No circular imports (verified: `guide-manifest.ts` never imports from `guides.index.ts`)
  - Must preserve 119 live / 12 draft count (TC-24, TC-05)
  - Module init order: `guide-manifest.ts` → `namespaces.ts` → `guides.index.ts` (depth-first ESM evaluation)
  - Must preserve existing `tags` field in GUIDES_INDEX (not in manifest)
- Assumptions:
  - All GUIDES_INDEX keys have manifest entries (verified: fallback entries auto-generated for any key in GUIDE_KEYS not in manifestSeed, via `guide-manifest.ts:4237-4250`)
  - HOW_TO_GET_HERE routes all have manifest entries (verified: 24 entries, 23 live + 1 draft `capriPositanoFerry`)

## Fact-Find Reference

- Related brief: `docs/plans/guide-status-single-source-fact-find.md`
- Key findings:
  - Module init order guarantees manifest registry is populated before `guides.index.ts` evaluates (already proven by `section` derivation on line 185)
  - No circular dependency risk — import graph is acyclic: `guides.index.ts → namespaces.ts → guide-manifest.ts`
  - GUIDES_INDEX defaults missing status to `"live"` (line 187) while manifest defaults to `"draft"` — opposite defaults cause silent divergence
  - 119 guides live in index, only 23 live in manifest — ~96 entries need manifest status updated to "live"
  - `santaMariaDelCastelloHike`: index=live, manifest=draft (confirmed bug)
  - `capriPositanoFerry`: HTH route, index=live (spread), manifest=draft (inconsistency)
  - 11 fallback entries exist (auto-generated with status="draft", no blocks) — some are live in the index

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/data/guides.index.ts` — Target file. 294 lines. Status defaulted to `"live"` on line 187. Already derives `section` from manifest (line 185)
  - `apps/brikette/src/routes/guides/guide-manifest.ts` — Source of truth (target). 4522 lines, 165 entries total (153 manifestSeed + 12 fallback)
  - `packages/guide-system/src/manifest-registry.ts` — Singleton registry. `getGuideManifestEntry(key)` returns entry from Map
  - `apps/brikette/src/guides/slugs/namespaces.ts` — Bridge. Already imports from manifest, exports `guideNamespaceKey()`
- Patterns to follow:
  - `guides.index.ts:185` — section derivation from manifest via `guideNamespaceKey()`. Exact same pattern for status
  - `manifest-registry.ts:25` — `getGuideManifestEntry()` API used throughout the codebase

## Proposed Approach

**Two-phase migration** (data first, then code):

1. **Phase 1 — Data migration:** Update ~96 manifest entries from `"draft"` to `"live"` to match the current GUIDES_INDEX status. This ensures zero behavioral change when the switch happens. Also fix `capriPositanoFerry` (HTH route that should be live).

2. **Phase 2 — Code switch:** Change `guides.index.ts` to read status from `getGuideManifestEntry()` instead of declaring it in `GUIDES_INDEX_BASE`. Remove `status` field from all `GUIDES_INDEX_BASE` entries. Remove `status` from `GuideIndexEntry` type.

3. **Phase 3 — Validation:** Add a cross-validation test ensuring every GUIDES_INDEX key has a manifest entry and no status divergence can recur. Update existing test expectations if counts shift.

**Why two-phase:** Separating data migration from code change means each phase is independently safe and revertable. If the manifest update is wrong, revert it. If the code switch is wrong, revert it. Neither breaks the other.

**Alternative considered:** Skip data migration — just switch to manifest and accept that ~96 guides go from live to draft. **Rejected** because this would break production (guides disappear).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Migrate manifest entry statuses to match GUIDES_INDEX | 95% | M | Complete (2026-02-08) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Derive GUIDES_INDEX status from manifest | 93% | S | Complete (2026-02-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add cross-validation test and update snapshots | 90% | S | Complete (2026-02-08) | TASK-01 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Data migration — must land first. No file overlap with wave 2 tasks. |
| 2 | TASK-02, TASK-03 | Wave 1: TASK-01 | No file overlap between TASK-02 (`guides.index.ts`) and TASK-03 (`guide-status-filtering.test.ts`) — safe to parallelize. |

**Max parallelism:** 2 (Wave 2)
**Critical path:** TASK-01 → TASK-02 (2 waves)
**Total tasks:** 3

## Tasks

### TASK-01: Migrate manifest entry statuses to match GUIDES_INDEX

- **Type:** IMPLEMENT
- **Effort:** M
- **Affects:** `apps/brikette/src/routes/guides/guide-manifest.ts`
- **Secondary:** `[readonly] apps/brikette/src/data/guides.index.ts`, `[readonly] apps/brikette/src/data/how-to-get-here/routeGuides.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 95%
  - Implementation: 98% — Pure find-and-replace of `status: "draft"` → `status: "live"` for specific entries. The set of entries to change is deterministic (those whose key is live in GUIDES_INDEX but draft in manifest).
  - Approach: 95% — Must update manifest before switching code, otherwise ~96 guides go dark. Two-phase is the only safe approach.
  - Impact: 92% — No behavioral change: index still reads its own `status` field in this phase. Manifest status values are only consumed by Business OS and draft-path logic, neither of which changes behavior for guides already treated as live.
- **Acceptance:**
  - Every guide that is `status: "live"` in GUIDES_INDEX (119 total) is also `status: "live"` in the manifest
  - The 12 guides that are `status: "draft"` in GUIDES_INDEX remain `status: "draft"` in the manifest
  - `santaMariaDelCastelloHike` manifest status changed from "draft" to "live"
  - `capriPositanoFerry` manifest status changed from "draft" to "live"
  - All fallback entries that are live in the index get their status updated
  - Existing tests (TC-21 through TC-32) still pass unchanged
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-24 (existing): Live guide count remains 119 → passes unchanged (no behavioral change in this phase)
    - TC-05 (existing): Draft key set remains 12 assistance articles → passes unchanged
    - TC-40: After migration, every live GUIDES_INDEX key has `status: "live"` in manifest → confirm with inline audit
    - TC-41: After migration, every draft GUIDES_INDEX key has `status: "draft"` in manifest → confirm with inline audit
  - **Acceptance coverage:** TC-24 covers live count stability. TC-05 covers draft set stability. TC-40/TC-41 cover cross-validation.
  - **Test type:** unit (existing regression tests)
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (existing), `apps/brikette/src/test/content-readiness/guides/guide-content-filtering.test.ts` (existing)
  - **Run:** `pnpm --filter brikette exec jest -- "guide-status-filtering" "guide-content-filtering" --no-coverage`
  - **Cross-boundary coverage:** N/A — single file change
  - **End-to-end coverage:** N/A — data-only migration, no user-facing flow change
- **TDD execution plan:**
  - **Red:** Run existing TC-24 and TC-05 before any changes (should pass — baseline)
  - **Green:** Update manifest entries to match GUIDES_INDEX status. Re-run all existing tests — all must pass unchanged
  - **Refactor:** N/A — mechanical data change
- **Scouts:**
  - Fallback entries auto-generate with `status: "draft"` → confirmed at `guide-manifest.ts:4243`
  - `capriPositanoFerry` is in manifestSeed (not fallback) → confirmed, needs manual status flip
- **Planning validation:**
  - Tests run: `pnpm --filter brikette exec jest -- "guide-status-filtering" --no-coverage` — 5 passed
  - Tests run: `pnpm --filter brikette exec jest -- "guide-content-filtering" --no-coverage` — 5 passed
  - Test stubs written: N/A (M effort — test case specs documented above)
  - Unexpected findings: `guide-status-filtering` test file doesn't match the `--testPathPattern` flag in pnpm test script — must use `pnpm exec jest` directly
- **Rollout / rollback:**
  - Rollout: Commit manifest status changes. No behavioral change — index still reads its own status
  - Rollback: `git revert` the commit
- **Documentation impact:** None
- **Notes / references:**
  - Entry-by-entry comparison approach: for each key in GUIDES_INDEX where `status !== "draft"` (i.e., live by default or explicit), find the manifest entry and set `status: "live"` if it's currently `"draft"`
  - Entries in manifestSeed need `status: "draft"` → `status: "live"` edit
  - Fallback entries (auto-generated) need the `FALLBACK_AREA_MAP` section updated OR individual entries moved to manifestSeed — simpler to change the fallback default for keys that are live in the index

### TASK-02: Derive GUIDES_INDEX status from manifest

- **Type:** IMPLEMENT
- **Effort:** S
- **Affects:** `apps/brikette/src/data/guides.index.ts`
- **Secondary:** `[readonly] packages/guide-system/src/manifest-registry.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 93%
  - Implementation: 96% — One-line change on line 187: `status: getGuideManifestEntry(entry.key)?.status ?? "draft"`. Import already available via the same path as `guideNamespaceKey`. The `section` derivation on line 185 proves this pattern works.
  - Approach: 93% — This is the stated goal. Deriving from manifest at module init time is proven safe (depth-first ESM eval). Default to `"draft"` for missing entries (safe — hides unknown guides rather than exposing them).
  - Impact: 90% — After TASK-01, all manifest statuses match index statuses, so this is a no-op behavioral change. API surface (`isGuideLive`, `getGuideStatus`, `GUIDE_STATUS_BY_KEY`) unchanged.
- **Acceptance:**
  - `guides.index.ts` imports `getGuideManifestEntry` from the shared registry (via `@acme/guide-system` or the local re-export)
  - Line 187 reads status from manifest: `status: getGuideManifestEntry(entry.key)?.status ?? "draft"`
  - `status` field removed from `GuideIndexEntry` type
  - `status` field removed from all `GUIDES_INDEX_BASE` entries (both explicit `status: "draft"` and `status: "live"`)
  - HOW_TO_GET_HERE spread no longer includes `status: "live" as const`
  - Existing tests (TC-21 through TC-32) still pass unchanged
  - 119 live / 12 draft count preserved
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-21 (existing): `isGuideLive("santaMariaDelCastelloHike")` returns true → passes (manifest now "live" from TASK-01)
    - TC-22 (existing): `isGuideLive("ageAccessibility")` returns false → passes (manifest is "draft")
    - TC-23 (existing): Unknown key defaults to "draft" → passes (`getGuideStatus` still defaults to "draft")
    - TC-24 (existing): Live count = 119 → passes (all statuses now derived from aligned manifest)
    - TC-05 (existing): Draft key set = 12 assistance articles → passes
    - TC-28–TC-32 (existing): Content filtering tests → pass
  - **Acceptance coverage:** Existing tests fully cover the behavioral contract
  - **Test type:** unit (existing regression tests)
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts`, `apps/brikette/src/test/content-readiness/guides/guide-content-filtering.test.ts`
  - **Run:** `pnpm --filter brikette exec jest -- "guide-status-filtering" "guide-content-filtering" --no-coverage`
  - **Cross-boundary coverage:** N/A — reads from already-populated registry (same boundary as section derivation)
  - **End-to-end coverage:** N/A — internal refactor, no user-facing flow change
- **TDD execution plan:**
  - **Red:** N/A — this is a refactor under existing green tests. All tests should stay green throughout
  - **Green:** Import `getGuideManifestEntry` from registry. Change line 187 to derive from manifest. Remove `status` from `GuideIndexEntry` type and all `GUIDES_INDEX_BASE` entries. Remove `status: "live" as const` from HTH spread
  - **Refactor:** Clean up any now-unused imports. Verify no `status` references remain in `GUIDES_INDEX_BASE`
- **Scouts:**
  - `getGuideManifestEntry` is importable from `@acme/guide-system` → confirmed at `packages/guide-system/src/index.ts` (re-exported)
  - Module init order guarantees registry is populated → confirmed by existing `guideNamespaceKey()` usage on line 185
  - `guides.index.ts` already imports from `namespaces.ts` which imports from `guide-manifest.ts` → registry guaranteed populated
- **Planning validation:**
  - Tests run: `pnpm --filter brikette exec jest -- "guide-status-filtering" --no-coverage` — 5 passed
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Single commit. After TASK-01 lands, this is a pure refactor with zero behavioral change
  - Rollback: `git revert` — restore inline status declarations
- **Documentation impact:** None — internal implementation detail
- **Notes / references:**
  - Pattern reference: `guides.index.ts:185` — `section: guideNamespaceKey(entry.key)` — identical manifest-read pattern
  - Import path: `getGuideManifestEntry` from `@acme/guide-system` (already available in brikette's deps)
  - Alternative: import the local `getGuideManifestEntry` from `@/routes/guides/guide-manifest`. However, using the shared registry is cleaner (no new direct import from manifest file)

### TASK-03: Add cross-validation test and update snapshots

- **Type:** IMPLEMENT
- **Effort:** S
- **Affects:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts`
- **Secondary:** `[readonly] apps/brikette/src/data/guides.index.ts`, `[readonly] apps/brikette/src/routes/guides/guide-manifest.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Standard Jest test additions. The test pattern is established by existing TC-21 through TC-05. Both `getGuideManifestEntry` and `GUIDES_INDEX` are importable in tests.
  - Approach: 90% — Cross-validation prevents future divergence. This is the primary regression safety net for the single-source-of-truth invariant.
  - Impact: 85% — Test-only change. No production code affected. Worst case: test is too strict and needs adjustment if guides are intentionally allowed to diverge in future (unlikely).
- **Acceptance:**
  - New test: every key in `GUIDES_INDEX` has a corresponding manifest entry (not undefined)
  - New test: for every key in `GUIDES_INDEX`, status from index matches status from manifest (after TASK-02, this is tautological — but protects against future regressions if someone re-adds inline status)
  - Existing TC-24 and TC-05 still pass
  - All new tests pass
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-42: Every GUIDES_INDEX key has a manifest entry → `getGuideManifestEntry(key)` is not undefined for all keys
    - TC-43: No status divergence → for every GUIDES_INDEX entry, `entry.status === getGuideManifestEntry(entry.key)?.status` (or both default to draft)
    - TC-44: Manifest entry count ≥ GUIDES_INDEX entry count → ensures no index entry is orphaned
  - **Acceptance coverage:** TC-42 covers manifest completeness. TC-43 covers status consistency. TC-44 covers coverage.
  - **Test type:** unit
  - **Test location:** `apps/brikette/src/test/content-readiness/guides/guide-status-filtering.test.ts` (append to existing file)
  - **Run:** `pnpm --filter brikette exec jest -- "guide-status-filtering" --no-coverage`
  - **Cross-boundary coverage:** Tests cross the `guides.index.ts` → `manifest-registry` boundary
  - **End-to-end coverage:** N/A — test infrastructure only
- **TDD execution plan:**
  - **Red:** Write TC-42, TC-43, TC-44 tests. TC-42 and TC-44 should pass immediately (all keys have manifest entries via fallback). TC-43 passes after TASK-02 (status derived from manifest)
  - **Green:** Tests pass after TASK-01 + TASK-02 are complete
  - **Refactor:** Group new tests under a descriptive `describe("single source of truth invariants")` block
- **Planning validation:**
  - Tests run: `pnpm --filter brikette exec jest -- "guide-status-filtering" --no-coverage` — 5 passed
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **What would make this ≥95%:**
  - Verify the exact import path for `getGuideManifestEntry` in test context (may need `@acme/guide-system` or direct import)
- **Rollout / rollback:**
  - Rollout: Add tests in same commit as TASK-02, or as a follow-up commit
  - Rollback: Remove test additions
- **Documentation impact:** None
- **Notes / references:**
  - Import `getGuideManifestEntry` from `@acme/guide-system` (shared registry) or from `@/routes/guides/guide-manifest` (local)
  - Pattern reference: existing TC-21–TC-05 tests in the same file

## Risks & Mitigations

- **Risk:** Manifest entries accidentally left as "draft" after TASK-01 migration → guides disappear from production
  - **Mitigation:** TC-24 (119 live count) fails if any live guide flips to draft. TC-05 catches any new draft entries. Cross-validation test (TC-43) prevents future divergence
- **Risk:** Module init order changes if imports are restructured → manifest not populated when index evaluates
  - **Mitigation:** The `section` derivation (line 185) already depends on this order. If it breaks, section derivation also breaks — which has its own existing tests. No additional risk introduced
- **Risk:** Future guides added to GUIDES_INDEX_BASE without a manifest entry → treated as draft (hidden)
  - **Mitigation:** TC-42 (every index key has manifest entry) catches this immediately. Developer workflow: add guide to manifest first, then it appears in the index

## Observability

- Logging: N/A — compile-time/module-init-time change, no runtime logging
- Metrics: N/A — no runtime metrics
- Alerts/Dashboards: Existing CI tests (TC-24, TC-05) serve as the regression alert

## Acceptance Criteria (overall)

- [x] `guide-manifest.ts` is the single source of truth for guide status
- [x] `GUIDES_INDEX` derives status from manifest at module init time
- [x] `status` field removed from `GUIDES_INDEX_BASE` declarations and `GuideIndexEntry` type
- [x] All 119 live guides remain live, all 12 draft guides remain draft
- [x] `isGuideLive()`, `getGuideStatus()`, `GUIDE_STATUS_BY_KEY` API unchanged
- [x] Cross-validation test prevents future divergence
- [x] All existing tests pass: TC-21 through TC-32, TC-05, TC-24
- [x] No regressions

## Decision Log

- 2026-02-08: Two-phase approach chosen (data migration → code switch) — only safe path that avoids hiding ~96 live guides
- 2026-02-08: Default for missing manifest entries = "draft" — safe default (hides unknown guides). All current index entries have manifest entries (via fallback mechanism), so this default never triggers in practice
- 2026-02-08: Import `getGuideManifestEntry` from shared registry (`@acme/guide-system`) rather than local re-export — consistent with cross-app registry pattern
