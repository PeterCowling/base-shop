---
Type: Plan
Status: Archived
Domain: Infra / Data
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-03
Sequenced: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-standing-data-domain-container-split
Deliverable-Type: code-change
Startup-Deliverable-Alias: startup-loop-gap-fill
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BOS Standing Data Domain Container Split Plan

## Summary

`docs/business-os/strategy/` is an undifferentiated flat bucket holding ~210 files across 9 businesses with no domain separation. This plan reorganises each active business directory into 5 domain containers (`assessment/`, `legal/`, `product/`, `marketing/`, `sales/`) via `git mv`, then updates all code references that break due to changed file locations. Two logic fixes are required beyond simple path substitution: `s6b-gates.ts` uses `fs.readdir()` on the business root (non-recursive — will stop finding `assessment/` files after migration) and `contract-lint.ts` has a canonical path pattern that only allows 1-level deep paths. The plan is structured as: classify → migrate → fix logic + update references (parallel wave) → verify.

## Active tasks
- [x] TASK-01: Produce file classification map (Complete 2026-03-03)
- [x] CP-01: Verify classification map before mass migration (Complete 2026-03-03)
- [x] TASK-02: Migrate files to container directories (Complete 2026-03-03)
- [x] TASK-03: Fix assessment file lookup in s6b-gates.ts and contract-lint.ts (Complete 2026-03-03)
- [x] TASK-04: Fix authorize.ts auth depth regex and naming CLI absolute paths (Complete 2026-03-03)
- [x] TASK-05: Update registry files (registry.json + standing-registry.json) (Complete 2026-03-03)
- [x] TASK-06: Update test fixture paths in 23 test files (Complete 2026-03-03)
- [x] TASK-07: Update GitHub workflow, skills, run verification gate (Complete 2026-03-03)

## Goals
- Create `assessment/`, `product/`, `marketing/`, `sales/`, `legal/` containers inside each active business directory
- Move all ~210 classified files via `git mv` (history preserved)
- Fix all code paths that break due to the migration (logic changes + path string updates)
- Update `docs/registry.json` (145 entries, minus 3 BRIK/data entries = 142 to update) and `standing-registry.json` (15 entries)
- CI passes (all 23 test files green) on dev after migration

## Non-goals
- Creating container endpoint synthesis documents (`assessment.user.md` etc.) — follow-on work
- Moving `BRIK/data/` — stays at root (operational CSV data, not domain strategy artifacts)
- Moving root-level files (`plan.user.md`, `plan.agent.md`, `index.user.md`, `businesses.json`, `business-maturity-model.md`, `startup-loop-holistic-strategy.md`)
- Moving pack files (`product-pack.user.md`, `market-pack.user.md`, `logistics-pack.user.md`, `sell-pack.user.md`) — these are generated synthesis packs that stay at business root
- Enforcing new canonical path format as hard-only in `contract-lint.ts` — migration-period grace (both old and new formats accepted)

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only — local test run forbidden (`docs/testing-policy.md`)
  - Pre-commit hooks must not be bypassed
  - Writer lock required for multi-file commits (`scripts/agents/with-writer-lock.sh`)
  - NEVER use `--no-verify` or `--force` flags
- Assumptions:
  - `HEAD/decisions/` (3 files: DEC-HEAD-CH-01, DEC-HEAD-NAME-01) → `HEAD/assessment/`
  - `HEAD/naming-sidecars/` → `HEAD/assessment/naming-sidecars/`; `HEAD/product-naming-sidecars/` → `HEAD/assessment/product-naming-sidecars/`
  - `BRIK/apps/reception/` (worldclass benchmarks) → `BRIK/product/`
  - `BRIK/data/` stays at root (3 registry.json entries confirmed; stays unchanged)
  - XA, PIPE, PLAT: root-level only (plan.user.md, plan.agent.md) — no containers created
  - `s6b-gates.ts` fix: try `assessment/` subdir first, fallback to root dir (backward-compatible)
  - `contract-lint.ts` canonical pattern: add optional container segment (allows both old and new paths during migration period)

## Inherited Outcome Contract

- **Why:** `docs/business-os/strategy/` mixes assessment artifacts, product specs, marketing signals, and sales forecasts in one undifferentiated bucket. As more businesses and processes are added this structure will become unnavigable. Domain containers give each process a clear home, make CASS retrieval more precise, and enforce the `.user.md` + `.user.html` endpoint convention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `docs/business-os/strategy/<BIZ>/` reorganised into 5 domain containers for all active businesses; all existing content migrated; CASS roots and registries updated to new paths; CI passes.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-standing-data-domain-container-split/fact-find.md`
- Key findings used:
  - ~210 files across 5 active businesses (BRIK, HBAG, HEAD, PET, PWRB)
  - 35 script files reference strategy/ paths; 12 source files, 23 test files
  - `s6b-gates.ts` uses non-recursive `readdir` → functional regression if not fixed
  - `contract-lint.ts` canonical pattern is 1-level deep only → must extend to 2-level
  - `authorize.ts` auth regex is 1-level deep only → must extend to 2-level
  - Pack files stay at business root — test fixtures for those don't need updating
  - `standing-registry.json` has 15 entries (not 50+ as initially estimated)

## Proposed Approach

- Option A: Gradual migration (one business at a time, with dual-path support in code)
- Option B: Full immediate migration with logic fixes in same build pass
- **Chosen approach:** Option B. Operator constraint is "full migration now, not gradual." Logic fixes are well-contained (2 files). Dual-path support would add unnecessary complexity and drift risk.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes (6 waves; max parallelism 3; critical path 6 waves)
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Produce file classification map → migration-map.json | 90% | M | Complete (2026-03-03) | - | CP-01 |
| CP-01 | CHECKPOINT | Verify classification before mass migration | 95% | S | Complete (2026-03-03) | TASK-01 | TASK-02 |
| TASK-02 | IMPLEMENT | Migrate files to container directories (git mv + HTML regen) | 85% | L | Complete (2026-03-03) | CP-01 | TASK-03, TASK-04, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Fix s6b-gates readdir + contract-lint canonical pattern | 85% | M | Complete (2026-03-03) | TASK-02 | TASK-06 |
| TASK-04 | IMPLEMENT | Fix authorize.ts auth depth + naming CLI absolute paths | 90% | S | Complete (2026-03-03) | TASK-02 | TASK-07 |
| TASK-05 | IMPLEMENT | Update registry.json (142 entries) + standing-registry.json (15 entries) | 85% | M | Complete (2026-03-03) | TASK-02 | TASK-07 |
| TASK-06 | IMPLEMENT | Update test fixture paths in 23 test files | 85% | M | Complete (2026-03-03) | TASK-02, TASK-03 | TASK-07 |
| TASK-07 | IMPLEMENT | Update GitHub workflow + skills + run verification gate | 85% | S | Complete (2026-03-03) | TASK-03,TASK-04,TASK-05,TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Produces migration-map.json |
| 2 | CP-01 | TASK-01 | Checkpoint: verify classification before mass migration |
| 3 | TASK-02 | CP-01 | Serial — mass file migration (~210 files) |
| 4 | TASK-03, TASK-04, TASK-05 | TASK-02 | Parallel — independent code + registry changes (no file overlap) |
| 5 | TASK-06 | TASK-02, TASK-03 | Test fixtures (needs canonical path fixes from TASK-03) |
| 6 | TASK-07 | TASK-03, TASK-04, TASK-05, TASK-06 | Workflow + skills + CI push |

**Max parallelism:** 3 (Wave 4: TASK-03, TASK-04, TASK-05)
**Critical path:** TASK-01 → CP-01 → TASK-02 → TASK-03 → TASK-06 → TASK-07 (6 waves)

## Tasks

---

### TASK-01: Produce file classification map

- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/bos-standing-data-domain-container-split/artifacts/migration-map.json` — complete from/to path mapping for all files to migrate
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `docs/plans/bos-standing-data-domain-container-split/artifacts/migration-map.json`
- **Depends on:** -
- **Blocks:** CP-01
- **Confidence:** 90%
  - Implementation: 90% — All data is available from the investigation; classification rules are clear; edge cases (BRIK/apps/reception, HEAD/decisions, HEAD/naming-sidecars) are resolved
  - Approach: 90% — JSON format with `from`/`to` fields per file; exclude pack files, root files, BRIK/data
  - Impact: 95% — This artifact drives TASK-02 and TASK-06 exactly; no ambiguity in downstream use
- **Acceptance:**
  - `artifacts/migration-map.json` exists with correct schema: `{ "files": [{ "from": string, "to": string }] }`
  - All files under active business directories classified (no silently omitted files)
  - Pack files (`*-pack.user.md`) and root files (`plan.user.md`, `index.user.md`, `businesses.json`) excluded from migration entries
  - `BRIK/data/` files explicitly excluded (with note)
  - `HEAD/decisions/`, `HEAD/naming-sidecars/`, `HEAD/product-naming-sidecars/` classified to `HEAD/assessment/` path
  - `BRIK/apps/reception/` classified to `BRIK/product/`
  - Entry count matches sum of classification table in fact-find (~210 entries)
- **Build evidence (2026-03-03):**
  - Route: inline (Node.js script)
  - 191 entries classified across 6 businesses (BRIK=40, HBAG=49, HEAD=71, PET=16, PWRB=13, BOS=2)
  - 28 exclusions (6 BRIK/data, 15 root files, 2 pack files, 5 other root)
  - 0 unclassified files — all files accounted for
  - Containers used: assessment (119), product (26), marketing (11), sales (35)
  - TC-01-01 through TC-01-07: all PASS
  - Count is 191 vs plan estimate of ~210 — difference: `products-aggregate-pack.user.md` excluded as pack file per TC-01-04 glob; estimate was rough
- **Validation contract (TC-XX):**
  - TC-01-01: `migration-map.json` is valid JSON parseable by `JSON.parse`
  - TC-01-02: Every `from` path starts with `docs/business-os/strategy/` and the file currently exists on disk
  - TC-01-03: No `from` path contains `BRIK/data/` (excluded)
  - TC-01-04: No `from` path is a pack file (`*-pack.user.md`), root-level plan, or `businesses.json`
  - TC-01-05: Every `to` path has exactly one of the 5 container names (`assessment`, `product`, `marketing`, `sales`, `legal`) as the second path segment after the business prefix (e.g., `strategy/BRIK/<container>/...`). Note: for already-nested sources (`HEAD/decisions/`, `BRIK/apps/reception/`), segment count differs from flat-file migration — this is expected and acceptable.
  - TC-01-06: `HEAD/decisions/DEC-HEAD-*.user.md` entries map `to` paths under `HEAD/assessment/`
  - TC-01-07: `BRIK/apps/reception/` entries map `to` paths under `BRIK/product/`
- **Execution plan:**
  - Red: run `ls -R docs/business-os/strategy/BRIK/ | grep -v "^$"` — confirm files exist before classification
  - Green: enumerate all files in each active business directory (BRIK, HBAG, HEAD, PET, PWRB, BOS) using Glob; classify each by name pattern (brand-identity/brand-profile/solution*/naming/measurement/distribution/prioritization/weekly-kpcs/problem-statement/operator-context → `assessment/`; worldclass*/product-spec/room-pricing/prime-app-design → `product/`; signal-review/website-iteration → `marketing/`; revenue-architecture/*forecast*/octorate*/historical*baseline/sales-funnel/kpcs-decision/ga4-search-console → `sales/`); write `migration-map.json`
  - Refactor: verify all TC contracts above with rg checks; compare entry count with fact-find classification table
- **Planning validation (required for M/L):**
  - Checks run: `ls` on BRIK/, HBAG/, HEAD/, PET/, PWRB/, BOS/ confirmed file listings
  - Validation artifacts: investigation agent results from session (classification counts per business)
  - Unexpected findings: HEAD/decisions/ = 3 decision files (not large as initially thought); BRIK/apps/reception/ = worldclass benchmarks (product, not design docs)
- **Scouts:**
  - `BRIK/data/` confirmed has 3 registry.json entries — exclusion correct
  - `standing-registry.json` confirmed 15 entries (not 50+ as in initial fact-find estimate)
  - `HEAD/naming-sidecars/` and `HEAD/product-naming-sidecars/` confirmed as HEAD naming artifact dirs
- **Edge Cases & Hardening:**
  - Files with ambiguous names (e.g., `2026-02-13-prioritization-scorecard.user.md`) → `assessment/` (pre-launch prioritization)
  - Files with `octorate` prefix → `sales/` (operational data baseline)
  - `BOS/` business: 2 sales-adjacent files (CASS scorecard) → `sales/`; root plan/agent files stay at root
  - `PWRB/assets/` subdir: check contents and classify; if design/marketing assets → `marketing/`
- **What would make this >=90%:** Run the Glob enumeration live before writing the map to verify every file is captured (currently relying on investigation counts which may miss edge cases in some business dirs).
- **Rollout / rollback:**
  - Rollout: artifact creation only; no production state change
  - Rollback: delete `migration-map.json` — no side effects
- **Documentation impact:** None
- **Notes / references:**
  - Classification rules derived from fact-find investigation; use name pattern matching + date prefix analysis
  - `PWRB/assets/` seen in ls output — verify and classify during execution

---

### CP-01: Verify classification before mass migration

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if any downstream task confidence drops based on classification map review
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/bos-standing-data-domain-container-split/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents mass migration with misclassified files
  - Impact: 95% — file moves are hard to undo; pre-flight check is high value
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-02 through TASK-07
  - Downstream task confidence recalibrated from `migration-map.json` evidence
  - Plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - Migration map entry count is consistent with classification table (~210 entries)
  - No pack files or root-level files accidentally included
  - `BRIK/data/` explicitly excluded
- **Validation contract:** `migration-map.json` passes all TC-01-XX checks; downstream tasks remain at >=80% confidence
- **Planning validation:** Classification map produced by TASK-01
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan.md updated by `/lp-do-replan` checkpoint pass

---

### TASK-02: Migrate files to container directories

- **Type:** IMPLEMENT
- **Deliverable:** All ~210 strategy files moved to correct container paths; `.user.html` files regenerated at new locations
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/strategy/BRIK/**`, `docs/business-os/strategy/HBAG/**`, `docs/business-os/strategy/HEAD/**`, `docs/business-os/strategy/PET/**`, `docs/business-os/strategy/PWRB/**`, `docs/business-os/strategy/BOS/**`
- **Depends on:** CP-01
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `git mv` is mechanical; L effort is justified by 210 files across 6 businesses; risk is completeness
  - Approach: 85% — migration-map.json drives every move; verification rg sweep confirms no stragglers
  - Impact: 90% — file moves are reversible with `git revert`; no database or runtime state changes
- **Acceptance:**
  - All files in `migration-map.json` exist at their `to` paths
  - No files remain at `from` paths (except files correctly excluded from migration: root files, pack files, BRIK/data)
  - Every moved `.user.md` file has a corresponding `.user.html` at the new path
  - No stale `.user.html` files remain at old paths
  - Container directories created for each active business: `BRIK/assessment/`, `BRIK/product/`, `BRIK/marketing/`, `BRIK/sales/` (and equivalent for HBAG, HEAD, PET, PWRB, BOS where contents exist)
  - `BRIK/data/` files unchanged
  - `HEAD/assessment/naming-sidecars/` and `HEAD/assessment/product-naming-sidecars/` exist with correct contents
- **Validation contract (TC-XX):**
  - TC-02-01: `rg "docs/business-os/strategy/BRIK/2026" docs/` returns only new container paths (no flat BRIK/ paths for migrated files)
  - TC-02-02: `ls docs/business-os/strategy/BRIK/assessment/` returns expected assessment files
  - TC-02-03: `ls docs/business-os/strategy/BRIK/product/` returns expected product files
  - TC-02-04: `ls docs/business-os/strategy/BRIK/data/` is unchanged (CSV + meta files)
  - TC-02-05: Every `.user.md` at new path has a corresponding `.user.html` (no orphaned markdown)
  - TC-02-06: `HEAD/assessment/naming-sidecars/` and `HEAD/assessment/product-naming-sidecars/` exist
  - TC-02-07: `HEAD/decisions/` directory no longer exists (contents moved to `HEAD/assessment/`)
- **Execution plan:**
  - Red: verify all `from` paths in `migration-map.json` currently exist on disk; count them; confirm total matches expectation
  - Green: for each entry in `migration-map.json`:
    1. Create target container directory if not exists: `mkdir -p <to_dir>`
    2. `git mv <from> <to>` for the `.user.md` or plain `.md` file
    3. If `.user.html` exists at same path: `git mv <from.user.html> <to.user.html>` OR `git rm <from.user.html>` and schedule re-render
    4. After all moves: run `pnpm docs:render-user-html -- <to_path>` for all moved `.user.md` files to regenerate HTML at new paths
  - Refactor: run `rg "docs/business-os/strategy" docs/business-os/strategy/ --include="*.md" --include="*.html"` to confirm cross-document links are updated; spot-check 5 moved files
- **Planning validation (required for M/L):**
  - Checks run: confirmed git mv available; `render-user-doc-html.ts` is deterministic and path-agnostic
  - Validation artifacts: `pnpm docs:render-user-html` script exists and works on any `.user.md` path
  - Unexpected findings: BRIK/data/ has 3 registry.json entries (bookings_by_month.meta.md, data_quality_notes.md, net_value_by_month.meta.md) — confirmed stays at root, no registry update needed for these
- **Consumer tracing (L task):**
  - New values: none (file system operation only)
  - Modified behavior: file paths change for ~210 files. All consumers addressed in TASK-03 through TASK-07.
  - Unchanged consumers: `compile-website-content-packet.ts` (pack files at root, unchanged); `generate-build-summary.ts` (pattern-based `startsWith` + `businesses.json` root); `contract-lint.ts` (pattern-based `startsWith`); `lp-do-ideas-registry-migrate-v1-v2.ts` (pack file refs, historical migration script)
- **Scouts:**
  - `PWRB/assets/` dir: verify contents during TASK-01 and handle correctly in migration
  - Cross-document relative links (`../`): `rg "\.\.\/" docs/business-os/strategy/` scan for relative link patterns
- **Edge Cases & Hardening:**
  - Large batch: write a helper script (or use a bash loop) to run all git mv operations from migration-map.json entries rather than doing them one by one
  - `.user.html` regeneration: run in batch after all git mv operations complete; don't interleave
  - If `render-user-doc-html.ts` fails for any file: log the failure and continue; re-run failures at end
- **What would make this >=90%:** Write and test the bash migration loop script in TASK-01 as a dry-run; confirm all 210 git mv operations execute cleanly
- **Rollout / rollback:**
  - Rollout: `git commit` after all moves; writer lock via `with-writer-lock.sh`
  - Rollback: `git revert <commit-hash>` restores all file locations atomically
- **Documentation impact:** None beyond the file moves themselves

---

### TASK-03: Fix assessment file lookup in s6b-gates.ts and contract-lint.ts

- **Type:** IMPLEMENT
- **Deliverable:** `s6b-gates.ts` finds measurement-verification in `assessment/` subdir; `contract-lint.ts` canonical pattern accepts container subdirectory paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/s6b-gates.ts`, `scripts/src/startup-loop/contract-lint.ts`, `scripts/src/startup-loop/__tests__/contract-lint.test.ts`, `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% — The `readdir` fix and canonical pattern extension are clear; risk is callers of these functions having hidden assumptions about file locations that aren't covered by existing tests
  - Approach: 80% — Backward-compatible fixes: `s6b-gates` tries `assessment/` first with root fallback; `contract-lint` adds optional container segment
  - Impact: 85% — Fixes two functional regressions; test suite covers correctness
- **Acceptance:**
  - `s6b-gates.ts`: `checkSellActGate()` finds measurement-verification in `assessment/` subdirectory (new path after migration)
  - `s6b-gates.ts`: fallback to root directory retained for backward compatibility
  - `contract-lint.ts`: canonical pattern accepts both `strategy/<BIZ>/<file>` and `strategy/<BIZ>/<container>/<file>`
  - `contract-lint.test.ts`: "compliant path" test passes with new container path format
  - `s2-market-intelligence-handoff.test.ts`: measurement-verification fixture uses `assessment/` subdir path
- **Validation contract (TC-XX):**
  - TC-03-01: `checkSellActGate(repoRoot, "BRIK")` with mocked `assessment/` subdir finds the measurement-verification file and sets `check1Pass = true`
  - TC-03-02: `checkSellActGate(repoRoot, "BRIK")` with file at root dir (no `assessment/` subdir) still finds it via fallback → check1Pass = true
  - TC-03-03: `lintStartupLoopArtifactPath({ filePath: "docs/business-os/strategy/BRIK/assessment/2026-01-15-measurement-verification.user.md" })` returns `issues = []`
  - TC-03-04: `lintStartupLoopArtifactPath({ filePath: "docs/business-os/strategy/BRIK/2026-01-15-measurement-verification.user.md" })` still returns `issues = []` (grace period — both formats valid)
  - TC-03-05: `lintStartupLoopArtifactPath({ filePath: "docs/other/BRIK/measurement-verification.user.md" })` returns `measurement_verification_wrong_path` issue
- **Execution plan:**
  - Red: write a test that passes a measurement-verification file path at `strategy/BRIK/assessment/` to `lintStartupLoopArtifactPath` → expect `issues = []` → FAILS before fix
  - Green:
    - `s6b-gates.ts`: replace `readdir(strategyDir)` with try/catch: first read `strategyDir/assessment/`; on ENOENT fallback to `strategyDir`; combine entries from both if both exist
    - `contract-lint.ts`: update canonical pattern from `[^/]+\/[^/]*measurement-verification` to `[^/]+\/([^/]+\/)?[^/]*measurement-verification` (optional container segment)
    - Update `contract-lint.test.ts` VC-01 "compliant path" test to use `assessment/` subdir path (add as new TC; keep old path test as valid-both-formats)
    - Update `s2-market-intelligence-handoff.test.ts` fixture to put measurement-verification in `assessment/` subdir
  - Refactor: verify TC-03-01 through TC-03-05 pass; `npx tsc --noEmit` in scripts/
- **Planning validation (required for M/L):**
  - Checks run: read `s6b-gates.ts` lines 81-115; confirmed `readdir` on root only; function signature: `checkSellActGate(repoRoot: string, business: string): Promise<{pass: boolean; reasons: string[]}>`
  - Validation artifacts: `contract-lint.ts` canonical regex at line ~163 confirmed
  - Unexpected findings: `s6b-gates.ts` has additional checks (Check 2: plan.user.md risks; Check 3: conversion intent events) — these are at strategyDir root (`plan.user.md`) and may also need updating if measurement baseline files move; verify during execution
- **Consumer tracing (M task):**
  - `checkSellActGate`: function signature unchanged → callers safe; internal logic change only
  - `lintStartupLoopArtifactPath`: return type unchanged; canonical pattern now accepts more paths → no breaking change for callers
  - `contract-lint.test.ts`: test TC-VC-01 updated to use new canonical path → this is TASK-03 responsibility
- **Scouts:** `s6b-gates.ts` Check 3 reads `strategyDir` files for conversion intent events — verify these don't reference files that moved to `assessment/`
- **Edge Cases & Hardening:**
  - ENOENT on `assessment/` for businesses without an assessment container yet → fallback to root readdir handles this gracefully
  - Both old-style and new-style paths valid in contract-lint → avoids hard failure during any partial migration state
- **What would make this >=90%:** Read `s6b-gates.ts` Check 3 logic to confirm it's not affected by assessment/ migration; review all test cases in `s2-market-intelligence-handoff.test.ts` for other strategy file path fixtures
- **Rollout / rollback:**
  - Rollout: normal commit; logic changes are backward-compatible
  - Rollback: `git revert <commit>` — fallback path in s6b-gates ensures backward compatibility
- **Documentation impact:** `scripts/src/startup-loop/contract-lint.ts` header comment (line 9) path pattern; update to note both formats accepted

---

### TASK-04: Fix authorize.ts auth depth regex + naming CLI absolute paths

- **Type:** IMPLEMENT
- **Deliverable:** `authorize.ts` accepts 2-level-deep container file paths; `tm-prescreen-cli.ts` and `rdap-cli.ts` absolute paths updated to new container locations
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/business-os/src/lib/auth/authorize.ts`, `scripts/src/startup-loop/naming/tm-prescreen-cli.ts`, `scripts/src/startup-loop/naming/rdap-cli.ts`, `apps/business-os/src/lib/auth/authorize.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 90% — Three targeted single-file changes; authorize.ts regex well-understood; absolute paths are literal strings
  - Approach: 90% — Add a second regex alternative for 2-level deep; keep existing 1-level deep regex for root-level files; update two absolute paths
  - Impact: 90% — Restores access to container files in BOS app; naming CLI uses correct directories
- **Acceptance:**
  - `authorize.ts`: `isPathAllowed("strategy", "BRIK/assessment/brand-identity-dossier.user.md")` returns true
  - `authorize.ts`: `isPathAllowed("strategy", "BRIK/plan.user.md")` still returns true (root file unchanged)
  - `tm-prescreen-cli.ts`: absolute path updated from `HEAD/product-naming-sidecars` to `HEAD/assessment/product-naming-sidecars`
  - `rdap-cli.ts`: absolute path updated from `HEAD/naming-sidecars` to `HEAD/assessment/naming-sidecars`
  - `authorize.test.ts`: test for container file access passes
- **Validation contract (TC-XX):**
  - TC-04-01: `authorize.ts` `strategy` case regex matches `strategy/BRIK/assessment/brand-identity-dossier.user.md`
  - TC-04-02: `authorize.ts` regex still matches `strategy/BRIK/plan.user.md` (root file — 1-level)
  - TC-04-03: `authorize.ts` regex still matches `strategy/businesses.json` (root JSON — 0-level BIZ)
  - TC-04-04: `authorize.ts` regex rejects `strategy/BRIK/assessment/sub/file.md` (3-level deep — not allowed)
  - TC-04-05: `tm-prescreen-cli.ts` absolute path resolves to existing directory after migration (`HEAD/assessment/product-naming-sidecars`)
  - TC-04-06: `rdap-cli.ts` absolute path resolves to existing directory after migration (`HEAD/assessment/naming-sidecars`)
- **Execution plan:**
  - Red: add test for `isPathAllowed("strategy", "BRIK/assessment/brand-identity-dossier.user.md")` → FAILS before fix
  - Green:
    - `authorize.ts` strategy case: add `/^strategy\/[^/]+\/[^/]+\/[^/]+\.md$/.test(normalized)` alongside existing patterns
    - `tm-prescreen-cli.ts` line 46: update absolute path string
    - `rdap-cli.ts` line 23: update absolute path string
  - Refactor: run `npx tsc --noEmit` in apps/business-os/ and scripts/; verify all TC contracts above
- **Planning validation:**
  - Checks run: read `authorize.ts` lines 73-102; confirmed regex pattern on line 101-102; `tm-prescreen-cli.ts` line 46 confirmed absolute path; `rdap-cli.ts` line 23 confirmed
  - Validation artifacts: `authorize.test.ts` has tests at lines 17, 108 for `businesses.json` (root file — confirm not broken)
  - Unexpected findings: Business-OS app refs to strategy/ are mostly root-level (plan.user.md, businesses.json) — very few refs to individual strategy artifacts; main gap is auth depth
- **Consumer tracing (S task):**
  - `isPathAllowed`: adding a new matching case — additive, no breaking change; existing callers unaffected
  - naming CLI scripts: internal path variable only; no exported API change
- **Scouts:** None — changes are straightforward
- **Edge Cases & Hardening:**
  - Don't add 3-level deep support (`strategy/<BIZ>/<container>/<subdir>/<file>`) — unnecessary and security risk; add only exactly 3-segment paths
- **What would make this >=90%:** Already 90% — single unknown is whether `rdap-cli.ts` line 23 is used in a test that would need updating
- **Rollout / rollback:**
  - Rollout: normal commit; additive change
  - Rollback: `git revert` — existing auth patterns remain; only new pattern is removed
- **Documentation impact:** None

---

### TASK-05: Update registry files

- **Type:** IMPLEMENT
- **Deliverable:** `docs/registry.json` (142 entries updated) and `docs/business-os/startup-loop/ideas/standing-registry.json` (15 entries updated) to use new container paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/registry.json`, `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — Scripted path substitution from migration-map.json is deterministic; 3 BRIK/data entries confirmed to stay unchanged
  - Approach: 85% — Use migration-map.json as the authoritative from/to source; apply to both registry files; verify with entry count before/after
  - Impact: 90% — Registries correct = artifact lookup works; these are read at runtime by lp-do-ideas pipeline
- **Acceptance:**
  - `docs/registry.json`: entry count unchanged (145); 142 entries at new container paths; 3 BRIK/data entries unchanged
  - `standing-registry.json`: all 15 strategy/ entries updated to new container paths
  - `rg "docs/business-os/strategy/BRIK/2026-02-12-brand-identity" docs/registry.json` returns new container path
  - `rg "docs/business-os/strategy/HBAG/2026-02-21-brand-identity" docs/ --include="*.json"` returns new container path in both registries
- **Validation contract (TC-XX):**
  - TC-05-01: `jq '. | length' docs/registry.json` before = after (145 entries preserved)
  - TC-05-02: `jq '[.[] | select(.path | startswith("docs/business-os/strategy/"))] | length' docs/registry.json` equals 145 (no entries lost; BRIK/data entries preserved at old path since BRIK/data stays)
  - TC-05-03: `jq '[.[] | select(.path | test("/assessment/|/product/|/marketing/|/sales/"))] | length' docs/registry.json` > 0 (container paths present)
  - TC-05-04: `jq '[.[] | select(.path | startswith("docs/business-os/strategy/BRIK/data"))] | length' docs/registry.json` = 3 (BRIK/data entries unchanged)
  - TC-05-05: All 15 standing-registry entries with old strategy/ paths updated to new container paths
- **Execution plan:**
  - Red: run TC-05-03 pre-migration; expect result = 0 (no container paths yet)
  - Green: write a node script (or use jq) that reads migration-map.json, builds a from→to substitution map, applies to every `path`, `location_anchors[]`, `relativePath`, and other path fields in both registry files; write updated files
  - Refactor: run TC-05-01 through TC-05-05; spot-check 5 entries per registry file
- **Planning validation (required for M/L):**
  - Checks run: confirmed `standing-registry.json` is 261 lines with 15 entries having strategy/ paths (counted via grep)
  - Validation artifacts: `docs/registry.json` entry count = 145 confirmed via grep
  - Unexpected findings: `standing-registry.json` count is 15 (much fewer than initial "50+" estimate — significantly reduces complexity)
- **Consumer tracing (M task):**
  - `docs/registry.json` consumers: `render-user-doc-html.ts`, `contract-lint.ts` (reads registry for validation), `lp-do-ideas-trial.ts` pipeline — all use path fields to locate files; updated paths → correct file lookup
  - `standing-registry.json` consumers: `lp-do-ideas-trial.ts` and `lp-do-ideas-live.ts` — read `path` field for artifact registration; must match actual file locations after migration
  - No callers hard-depend on the old path format (they use the path field dynamically)
- **Scouts:** None
- **Edge Cases & Hardening:**
  - BRIK/data/ entries: the substitution script must explicitly SKIP entries where `from` path contains `BRIK/data/` — these stay at original paths since BRIK/data/ is not migrated
  - Verify: count BRIK/data entries in registry.json before and after (should be exactly 3 in both counts)
- **What would make this >=90%:** Run the substitution script in dry-run mode and compare output before committing
- **Rollout / rollback:**
  - Rollout: atomic update to both registry files in one commit
  - Rollback: `git revert <commit>` restores both files
- **Documentation impact:** None

---

### TASK-06: Update test fixture paths in 23 test files

- **Type:** IMPLEMENT
- **Deliverable:** All 23 test files updated to use new container paths for individual artifact fixtures; CI passes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-live.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-live-integration.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-live-hook.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-runner.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts`, `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`, `scripts/src/startup-loop/__tests__/compile-website-content-packet.test.ts`, `scripts/src/startup-loop/__tests__/contract-lint.test.ts`, `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`, `scripts/src/startup-loop/__tests__/website-iteration-throughput-report.test.ts`, `scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts`, `scripts/src/startup-loop/__tests__/map-artifact-delta-to-website-backlog.test.ts`, `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`, `scripts/src/startup-loop/__tests__/learning-ledger.test.ts`, `scripts/src/startup-loop/__tests__/map-logistics-policy-blocks.test.ts`, `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — migration-map.json provides the exact substitution map; pack file fixtures (market-pack, sell-pack, logistics-pack, index.user.md) stay at root and DON'T need updating; individual artifact fixtures (brand-identity-dossier, launch-distribution-plan, etc.) DO need updating
  - Approach: 80% — Apply migration-map.json substitutions to test files; pack file paths are NOT in migration-map so they're automatically excluded from substitution
  - Impact: 85% — CI green = delivery confirmation
- **Acceptance:**
  - All 23 test files compile without TypeScript errors
  - `rg "docs/business-os/strategy/BRIK/2026-02-12-brand-identity" scripts/src/` returns new container path
  - Pack file fixture paths unchanged (`strategy/HBAG/sell-pack.user.md`, `strategy/HBAG/market-pack.user.md` etc.)
  - `cass-retrieve.test.ts` TC-02-03 (`toHaveLength(4)`) still passes — `DEFAULT_SOURCE_ROOTS` unchanged
  - `contract-lint.test.ts` VC-01 test updated to use `assessment/` container path (delegated from TASK-03)
  - `s2-market-intelligence-handoff.test.ts` measurement-verification fixture at `assessment/` subdir (delegated from TASK-03)
- **Validation contract (TC-XX):**
  - TC-06-01: `rg "docs/business-os/strategy/BRIK/[0-9]" scripts/src/__tests__/` — all returned paths use container subdirectory
  - TC-06-02: `rg "strategy/(BRIK|HBAG|HEAD|PET|PWRB)/(sell|market|logistics|product)-pack" scripts/` — unchanged pack paths (these should return lines but with OLD root path — correct)
  - TC-06-03: Push to CI and confirm all 23 test files pass (no test failures related to path validation)
  - TC-06-04: `cd scripts && npx tsc --noEmit` returns 0 errors
- **Execution plan:**
  - Red: run `rg "docs/business-os/strategy/BRIK/2026" scripts/src/__tests__/` before fix — confirms old paths present
  - Green: for each entry in `migration-map.json`, run sed substitution on all 23 test files using `from`/`to` paths; explicitly verify pack file paths NOT substituted (they're not in migration-map); update `contract-lint.test.ts` VC-01 test to include container path as valid
  - Refactor: run TC-06-01 through TC-06-04; spot-check 3 test files for correctness
- **Planning validation (required for M/L):**
  - Checks run: read `lp-do-ideas-trial.test.ts` lines 21-100; confirmed mix of pack file fixtures (stay) and individual artifact fixtures (update); `contract-lint.test.ts` lines 101-135 confirmed canonical path tests
  - Validation artifacts: test file listing confirmed 23 files; grep filter confirms pack paths are separate from individual artifact paths
  - Unexpected findings: `cass-retrieve.test.ts` (TC-02-03) checks `DEFAULT_SOURCE_ROOTS` length = 4; this must NOT change since we're keeping the single root in DEFAULT_SOURCE_ROOTS
- **Consumer tracing (M task):**
  - Test files are test-only; no downstream consumers of these files
  - The only consumer is the CI test runner — confirmed by CI output
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Template string paths (e.g., `` `strategy/${business}/brand-identity` ``): if any test uses dynamic path construction, sed substitution won't catch it → use grep post-substitution to find remaining old paths
  - `cass-retrieve.test.ts` line 16: `toHaveLength(4)` guard — `DEFAULT_SOURCE_ROOTS` stays as 4 entries; this test should still pass
- **What would make this >=90%:** Run `rg "docs/business-os/strategy/[A-Z][A-Z][A-Z][A-Z]?/[0-9]" scripts/src/__tests__/` to enumerate individual artifact path fixtures across all 23 files before writing the substitution script — gives exact count of replacements needed
- **Rollout / rollback:**
  - Rollout: commit updated test files; push to CI
  - Rollback: `git revert` — test-only change; no production impact
- **Documentation impact:** None

---

### TASK-07: Update GitHub workflow + skills + run verification gate

- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/brik-weekly-kpi-reminder.yml` updated; `lp-seo/SKILL.md` updated; rg verification sweep passes; `process-improvements.json` and `build-summary.json` regenerated; CI pushed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** startup-loop-gap-fill
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/brik-weekly-kpi-reminder.yml`, `.claude/skills/lp-seo/SKILL.md`, `docs/business-os/_data/process-improvements.json`, `docs/business-os/_data/build-summary.json`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Small targeted file updates + rg sweep; confidence lower for lp-seo SKILL.md because we haven't read its full content
  - Approach: 85% — Update literal path strings; run generators; rg sweep confirms no stragglers
  - Impact: 85% — Final verification gate; CI push confirms everything works end-to-end
- **Acceptance:**
  - `.github/workflows/brik-weekly-kpi-reminder.yml` updated: `2026-02-12-ga4-search-console-setup-note.user.md` and `2026-02-12-historical-performance-baseline.user.md` at new container paths
  - `lp-seo/SKILL.md` updated: any strategy/ path refs use new container paths
  - Verification rg sweep: `rg "docs/business-os/strategy/BRIK/[0-9]" . --exclude-dir=.git --exclude-dir=node_modules` returns only new container paths (no flat BIZ-level individual artifact paths)
  - `pnpm --filter scripts startup-loop:generate-process-improvements` runs without error
  - `process-improvements.json` and `build-summary.json` regenerated
  - Commit pushed to CI; CI confirms all checks pass on dev branch
- **Validation contract (TC-XX):**
  - TC-07-01: `rg "strategy/BRIK/2026-02-12" . --include="*.yml"` returns new container path (not root BRIK/ path)
  - TC-07-02: Verification sweep: `rg "docs/business-os/strategy/(BRIK|HBAG|HEAD|PET|PWRB)/[0-9]" . --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" --exclude-dir=.git --exclude-dir=node_modules` returns only new container paths
  - TC-07-03: Generated files regenerated: `docs/business-os/_data/process-improvements.json` and `build-summary.json` have current timestamps post-update
  - TC-07-04: CI passes all checks (push to dev; monitor via `gh run watch`)
- **Execution plan:**
  - Red: run TC-07-02 before fix; confirm old flat paths appear
  - Green: update workflow file; update lp-seo SKILL.md; run generators; push to CI
  - Refactor: TC-07-01 through TC-07-04
- **Planning validation:**
  - Checks run: `brik-weekly-kpi-reminder.yml` lines 134-135 confirmed two specific BRIK strategy file references
  - Validation artifacts: `lp-seo/SKILL.md` not yet read — assumed to have path refs based on fact-find investigation
  - Unexpected findings: None for workflow file
- **Consumer tracing (S task):** N/A — small file updates with no exported API changes
- **Scouts:** Read `lp-seo/SKILL.md` before updating to understand scope of changes needed
- **Edge Cases & Hardening:**
  - Generator scripts may fail if they try to read a strategy file that hasn't been updated yet — run AFTER all TASK-02 through TASK-06 are complete
  - CI watch: if CI fails, diagnose failing test before re-pushing
- **What would make this >=90%:** Read lp-seo/SKILL.md before executing to confirm what needs changing (currently at 85% because this file wasn't fully investigated)
- **Rollout / rollback:**
  - Rollout: final commit with workflow + skills + generated files; push to dev
  - Rollback: `git revert` — generated files regenerate automatically
- **Documentation impact:** Updated `lp-seo/SKILL.md` inline references

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Produce classification map | Yes | None | No |
| CP-01: Verify classification | Yes — depends on TASK-01 output | None | No |
| TASK-02: File migration (git mv) | Yes — depends on CP-01 | None | No |
| TASK-03: Fix s6b-gates + contract-lint | Yes — depends on TASK-02 | None | No |
| TASK-04: Fix authorize.ts + naming CLIs | Yes — depends on TASK-02 | [Minor] rdap-cli.ts test coverage unknown | No |
| TASK-05: Update registry files | Yes — depends on TASK-02 | None | No |
| TASK-06: Update test fixtures | Yes — depends on TASK-02 AND TASK-03 (canonical paths) | None | No |
| TASK-07: Workflow + skills + CI push | Yes — depends on all prior tasks | None | No |

No Critical or Major simulation findings. Plan can proceed.

## Risks & Mitigations

- **Test fixture completeness risk** (Medium/High): Some test files may use template strings or dynamic path construction that sed substitution won't catch. Mitigation: post-substitution grep sweep for any remaining old-style individual artifact paths.
- **s6b-gates.ts Check 3 unknown** (Medium/Low): Check 3 reads the `strategyDir` for conversion intent events — not yet fully read. If Check 3 also reads individual files that move to `assessment/`, it would need the same fix as Check 1. Mitigation: explicitly read all of s6b-gates.ts Check 3 logic during TASK-03 execution.
- **Old HTML files not removed** (Medium/Low): After git mv, old `.user.html` at original paths may remain if not explicitly removed. Mitigation: explicit git rm step in TASK-02 before regeneration.
- **GitHub Actions workflow path filter stale** (Medium/Medium): `brik-weekly-kpi-reminder.yml` may not trigger on changes in container subdirs if watch patterns aren't updated. Mitigation: TASK-07 updates the file; verify watch patterns cover container paths.
- **standing-registry.json partial update** (Low/High): if any of the 15 entries is missed, lp-do-ideas pipeline breaks at runtime. Mitigation: scripted substitution + TC-05-05 count verification.

## Observability
- Logging: None: infrastructure migration; file existence is self-evidencing
- Metrics: `rg` sweep counts before/after each task; CI test pass rate
- Alerts/Dashboards: None: migration is one-time

## Acceptance Criteria (overall)
- [ ] All files in migration-map.json exist at `to` paths; none remain at `from` paths
- [ ] `docs/registry.json` entry count unchanged (145)
- [ ] `standing-registry.json` all 15 entries updated
- [ ] `authorize.ts` accepts 2-level deep container paths
- [ ] `s6b-gates.ts` finds measurement-verification in `assessment/` subdir
- [ ] `contract-lint.ts` accepts container-path format
- [ ] All absolute paths in naming CLIs point to new locations
- [ ] CI passes all tests on dev branch
- [ ] Verification rg sweep: no old-style individual artifact paths in non-archived code

## Decision Log
- 2026-03-02: Full immediate migration chosen over gradual (operator constraint: "full migration now, not gradual")
- 2026-03-02: `DEFAULT_SOURCE_ROOTS` kept as single `"docs/business-os/strategy"` root — rg recursion handles new container paths automatically; no code change needed
- 2026-03-02: contract-lint canonical pattern extended with optional container segment (migration-period grace: both old and new paths valid)
- 2026-03-02: s6b-gates fix: try `assessment/` first, fallback to root (backward-compatible)

## Overall-confidence Calculation
- TASK-01: M=2, conf=90%
- CP-01: S=1, conf=95%
- TASK-02: L=3, conf=85%
- TASK-03: M=2, conf=80%
- TASK-04: S=1, conf=90%
- TASK-05: M=2, conf=85%
- TASK-06: M=2, conf=80%
- TASK-07: S=1, conf=85%
- Total weight = 14; Weighted sum = (180+95+255+160+90+170+160+85) = 1195
- Overall = 1195/14 = 85.4% → **85%**
