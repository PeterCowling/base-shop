---
Type: Plan
Status: Archived
Domain: Data
Workstream: Operations
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: self-evolving-per-business-reorg
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Self-Evolving Per-Business Reorg Plan

## Summary

Restructure `docs/business-os/startup-loop/self-evolving/` from type-based subdirectories (candidates/, events/, observations/, startup-state/, backbone-queue/, reports/) to per-business directories (BRIK/, SIMC/) with a shared `schemas/` directory. Update 5 TypeScript path constants and their resolve functions to construct per-business paths (`self-evolving/{business}/filename.ext` instead of `self-evolving/{type}/{business}.ext`). Update 2 CLI default paths, 4 schema `$id` values, and embedded paths in report JSONs.

## Active tasks

- [x] TASK-01: Create per-business directories and move data files — Complete (2026-03-03)
- [x] TASK-02: Update TypeScript path constants and resolve functions — Complete (2026-03-03)
- [x] TASK-03: Update schema $id values and embedded paths in reports — Complete (2026-03-03)
- [x] TASK-04: Verification — typecheck and grep — Complete (2026-03-03)

## Goals

- All data for a single business (BRIK or SIMC) lives in one directory
- Schemas separated from data into shared `schemas/` subdirectory
- All code path constants updated to per-business path construction pattern
- Zero stale type-directory paths remain

## Non-goals

- Renaming TypeScript module files (they keep `self-evolving-*.ts` names)
- Changing module APIs or type definitions
- Restructuring scripts/src/startup-loop/ (separate dispatch: startup-loop-scripts-domain-dirs)

## Constraints & Assumptions

- Constraints:
  - Path construction pattern changes from `path.join(ROOT_WITH_TYPE, businessId + ext)` to `path.join(SELF_EVOLVING_ROOT, businessId, filename)`
  - Schema $id fields must match new file paths
- Assumptions:
  - Only 2 businesses exist: BRIK and SIMC
  - Reports keep their filenames when moved (BRIK-2026-03-02-live.json stays as-is inside BRIK/reports/)

## Inherited Outcome Contract

- **Why:** self-evolving/ organises data by type (events/, observations/, candidates/) not by business. Finding all BRIK data requires checking 6 directories. Schemas mixed with data directories.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** self-evolving/ restructured to per-business directories (BRIK/, SIMC/) with schemas in schemas/. All self-evolving-*.ts path references updated.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/self-evolving-per-business-reorg/fact-find.md`
- Key findings used:
  - 5 path constants in 4 TS files define all data directory paths
  - 2 CLI default paths in self-evolving-report.ts and self-evolving-from-ideas.ts
  - Tests are path-agnostic — no fixture path changes needed
  - No skill or CI script references to self-evolving subdirectories
  - Schema validation is type-based, not path-based (schema file moves are cosmetic)
  - Embedded paths in 2 report JSONs + 1 archived plan artifact

## Proposed Approach

- Option A: Move files and update each ROOT constant in-place with a per-business path join
- Option B: Create a centralised `SELF_EVOLVING_ROOT` constant in a shared module and import it
- Chosen approach: Option A — each module already has its own constant and resolve function. Updating them in-place is simpler, avoids adding import dependencies, and mirrors the existing pattern. The constant name changes from type-specific (e.g. `CANDIDATE_ROOT`) to generic (e.g. `SELF_EVOLVING_ROOT`), and the resolve function adds the filename as a literal string.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create per-business directories and move data files | 85% | M | Complete (2026-03-03) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update TypeScript path constants and resolve functions | 85% | S | Complete (2026-03-03) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Update schema $id values and embedded paths | 85% | S | Complete (2026-03-03) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Verification — typecheck and grep | 85% | S | Complete (2026-03-03) | TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | File moves must complete before path updates |
| 2 | TASK-02, TASK-03 | TASK-01 | Path constant updates and embedded path updates run in parallel |
| 3 | TASK-04 | TASK-02, TASK-03 | Verification runs after all updates |

## Tasks

### TASK-01: Create per-business directories and move data files

- **Type:** IMPLEMENT
- **Deliverable:** File reorganisation — new directory structure under `docs/business-os/startup-loop/self-evolving/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `docs/business-os/startup-loop/self-evolving/` (all subdirectories and data files)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — mechanical file moves with clear source and destination
  - Approach: 90% — per-business structure is the obvious correct organisation
  - Impact: 85% — operational improvement, no runtime behaviour change
- **Build evidence:** 15 files moved via git mv. BRIK/ has 5 data files + reports/ with 2 files. SIMC/ has 4 data files. schemas/ has 4 schema files. Old type dirs empty. README.md updated with new directory tree.
- **Acceptance:**
  - `self-evolving/BRIK/` contains: candidates.json, events.jsonl, observations.jsonl, startup-state.json, backbone-queue.jsonl, reports/BRIK-2026-03-02-live.json, reports/BRIK-2026-03-02-policy-check.json
  - `self-evolving/SIMC/` contains: candidates.json, events.jsonl, observations.jsonl, startup-state.json
  - `self-evolving/schemas/` contains all 4 schema files
  - `self-evolving/README.md` updated
  - Old type-based directories (candidates/, events/, observations/, startup-state/, backbone-queue/, reports/) removed
- **Validation contract (TC-01):**
  - TC-01: `ls self-evolving/BRIK/` → lists 5 data files + reports/ subdirectory
  - TC-02: `ls self-evolving/SIMC/` → lists 4 data files (no backbone-queue or reports)
  - TC-03: `ls self-evolving/schemas/` → lists 4 .schema.json files
  - TC-04: Old type directories do not exist (candidates/, events/, etc.)
- **Execution plan:**
  1. Create directories: BRIK/, BRIK/reports/, SIMC/, schemas/
  2. git mv data files from type dirs to per-business dirs, renaming: `candidates/BRIK.json` → `BRIK/candidates.json`, `events/BRIK.jsonl` → `BRIK/events.jsonl`, etc.
  3. git mv schema files: `*.schema.json` → `schemas/`
  4. git mv reports: `reports/BRIK-*` → `BRIK/reports/`
  5. Update README.md to reflect new structure
  6. Verify old empty directories are removed by git
- **Planning validation (required for M/L):**
  - Checks run: `ls -R docs/business-os/startup-loop/self-evolving/` — current structure verified
  - Validation artifacts: fact-find file counts verified by critique (11 data files, 4 schemas, 6 type dirs)
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: per-business directories (BRIK/, SIMC/) — consumed by TASK-02 (path constant updates) and TASK-03 (embedded path updates)
  - Modified behavior: file locations change — all path resolution in TASK-02 addresses this
  - Consumer `self-evolving-orchestrator.ts` is unchanged because it uses module imports (not direct path construction)
- **Scouts:** None: file count verified by fact-find critique
- **Edge Cases & Hardening:**
  - SIMC has no backbone-queue or reports — only 4 files (candidates, events, observations, startup-state)
  - Empty JSONL files (BRIK backbone-queue, BRIK events) must be moved correctly despite being 0 bytes
- **What would make this >=90%:**
  - Running the moves and verifying no data loss
- **Rollout / rollback:**
  - Rollout: single commit with all moves
  - Rollback: git revert
- **Documentation impact:** README.md updated in-place
- **Notes / references:** Pattern mirrors startup-loop-root-containers build (dispatch A)

### TASK-02: Update TypeScript path constants and resolve functions

- **Type:** IMPLEMENT
- **Deliverable:** Updated path resolution in 4 TypeScript files + 2 CLI default paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving-startup-state.ts`, `scripts/src/startup-loop/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving-report.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85%
  - Approach: 90%
  - Impact: 85%
- **Build evidence:** 5 ROOT constants replaced with SELF_EVOLVING_ROOT in 4 modules. All resolve functions updated to `path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "filename.ext")`. 2 CLI defaults updated in self-evolving-from-ideas.ts and self-evolving-report.ts.
- **Acceptance:**
  - All 5 ROOT constants replaced with `SELF_EVOLVING_ROOT` pointing to `docs/business-os/startup-loop/self-evolving`
  - All resolve functions updated to `path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "filename.ext")`
  - CLI defaults in self-evolving-from-ideas.ts and self-evolving-report.ts updated to new per-business paths
- **Validation contract (TC-02):**
  - TC-01: Each of the 5 old ROOT constants is gone: grep for the literal strings `"candidates",` / `"events",` / `"observations",` / `"startup-state",` / `"backbone-queue",` as the final segment of a `path.join()` call in the 4 affected files → zero matches
  - TC-02: Each resolve function constructs `path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "filename.ext")` — verified by reading the updated code
  - TC-03: Typecheck passes for scripts package
- **Execution plan:**
  1. In each of the 4 data-access modules: replace type-specific ROOT constant with `SELF_EVOLVING_ROOT = path.join("docs", "business-os", "startup-loop", "self-evolving")`
  2. Update each resolve function to: `path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "filename.ext")` where filename matches the new per-business filename (candidates.json, events.jsonl, observations.jsonl, startup-state.json, backbone-queue.jsonl)
  3. In self-evolving-from-ideas.ts: update CLI default startupStatePath from `...self-evolving/startup-state/BRIK.json` to `...self-evolving/BRIK/startup-state.json`
  4. In self-evolving-report.ts: update CLI default observationsPath from `...self-evolving/observations/BRIK.jsonl` to `...self-evolving/BRIK/observations.jsonl` and candidatesPath from `...self-evolving/candidates/BRIK.json` to `...self-evolving/BRIK/candidates.json`
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: all 5 constants and resolve functions verified in fact-find
- **Edge Cases & Hardening:**
  - `self-evolving-events.ts` has TWO constants (EVENTS_ROOT and OBSERVATIONS_ROOT) — both must be replaced
  - Ensure `mkdirSync(path.dirname(filePath), { recursive: true })` still works with new path structure (it will — path.dirname of `BRIK/candidates.json` is `BRIK/` which exists after TASK-01)
- **What would make this >=90%:**
  - Confirming typecheck passes after changes
- **Rollout / rollback:**
  - Rollout: committed with build
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:** 5 constants across 4 files: CANDIDATE_ROOT, EVENTS_ROOT, OBSERVATIONS_ROOT, STATE_ROOT, BACKBONE_QUEUE_ROOT

### TASK-03: Update schema $id values and embedded paths in reports

- **Type:** IMPLEMENT
- **Deliverable:** Updated $id fields in 4 schema files, updated embedded paths in report JSONs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `docs/business-os/startup-loop/self-evolving/schemas/startup-state.schema.json`, `docs/business-os/startup-loop/self-evolving/schemas/meta-observation.schema.json`, `docs/business-os/startup-loop/self-evolving/schemas/container-contract.schema.json`, `docs/business-os/startup-loop/self-evolving/schemas/actuator-adapter.schema.json`, `docs/business-os/startup-loop/self-evolving/BRIK/reports/BRIK-2026-03-02-live.json`, `docs/business-os/startup-loop/self-evolving/BRIK/reports/BRIK-2026-03-02-policy-check.json`, `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/simulation.terms-and-conditions.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90%
  - Approach: 90%
  - Impact: 85%
- **Build evidence:** 4 schema $id values updated to schemas/ path. BRIK-2026-03-02-live.json: 3 embedded paths updated. BRIK-2026-03-02-policy-check.json: empty, no paths to update. simulation.terms-and-conditions.json: 3 embedded paths updated.
- **Acceptance:**
  - All 4 schema $id values updated to `docs/business-os/startup-loop/self-evolving/schemas/<filename>`
  - Report embedded paths updated to per-business structure (`BRIK/startup-state.json`, `BRIK/candidates.json`, `BRIK/backbone-queue.jsonl`)
  - Archived plan artifact paths updated
- **Validation contract (TC-03):**
  - TC-01: `grep -r 'self-evolving/candidates/' docs/` → zero matches (old type-dir path gone)
  - TC-02: `grep '$id' docs/business-os/startup-loop/self-evolving/schemas/*.schema.json` → all point to `self-evolving/schemas/`
- **Execution plan:**
  1. Update $id in each of the 4 schema files from `self-evolving/<name>.schema.json` to `self-evolving/schemas/<name>.schema.json`
  2. Update embedded paths in BRIK-2026-03-02-live.json: `backbone_queue_path`, `startup_state_path`, `candidate_path`
  3. Update matching embedded paths in BRIK-2026-03-02-policy-check.json (if present)
  4. Update embedded paths in archived plan artifact `simulation.terms-and-conditions.json`
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: all 7 files with embedded paths verified in fact-find
- **Edge Cases & Hardening:** BRIK-2026-03-02-policy-check.json may not contain embedded paths — check before editing
- **What would make this >=90%:** Verifying all old type-directory paths eliminated by grep
- **Rollout / rollback:**
  - Rollout: committed with build
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:** Schema $id is informational; code validates via schema_version strings

### TASK-04: Verification — typecheck and grep

- **Type:** IMPLEMENT
- **Deliverable:** Verification evidence that no stale paths remain
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** None (verification only)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90%
  - Approach: 90%
  - Impact: 85%
- **Build evidence:** Typecheck passes (pre-existing xa error only). Lint passes (0 errors). Comprehensive grep returns only plan/fact-find documentation references (describing old→new change). Zero stale type-directory paths in code, data, or other docs.
- **Acceptance:**
  - Typecheck passes (pre-existing errors only)
  - Lint passes
  - Comprehensive grep for `self-evolving/(candidates|events|observations|startup-state|backbone-queue|reports)/` returns zero matches
- **Validation contract (TC-04):**
  - TC-01: `pnpm typecheck` passes (pre-existing xa error only; scripts package has no scoped typecheck)
  - TC-02: `pnpm lint` passes
  - TC-03: Comprehensive grep (`-E`) for old type-directory paths → zero matches across entire repo (including archives)
- **Execution plan:**
  1. Run `pnpm typecheck` (scripts package has no scoped typecheck script; full-repo typecheck is the available validation — pre-existing xa error is the only expected failure)
  2. Run `pnpm lint` (scripts package has no scoped lint script; full-repo lint is the available validation)
  3. Run comprehensive grep: `grep -rE 'self-evolving/(candidates|events|observations|startup-state|backbone-queue|reports)/' .` across entire repo (using `-E` for extended regex)
  4. Fix any stale references found (controlled scope expansion, documented)
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: verification task
- **Edge Cases & Hardening:** Stale references in docs/plans/_archive/ must also be fixed — overall acceptance requires zero stale type-directory paths
- **What would make this >=90%:** Running the verification
- **Rollout / rollback:**
  - Rollout: N/A (verification)
  - Rollback: N/A
- **Documentation impact:** None
- **Notes / references:** Learned from startup-loop-root-containers that comprehensive grep finds ~70 more stale refs than fact-find enumerated

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stale paths in docs beyond fact-find enumeration | Medium | Low | TASK-04 comprehensive grep catches all |
| Path construction pattern change breaks runtime | Low | High | Centralised constants + typecheck verification |
| New business code added concurrently | Very Low | Low | Only BRIK and SIMC exist; new business follows new pattern |

## Observability

None: operational file reorganisation with no runtime observability impact.

## Acceptance Criteria (overall)

- [ ] Per-business directory structure: `self-evolving/BRIK/`, `self-evolving/SIMC/`, `self-evolving/schemas/`
- [ ] All TypeScript path constants resolve to per-business paths
- [ ] Typecheck and lint pass
- [ ] Zero stale type-directory paths in repo

## Decision Log

- 2026-03-03: Chose Option A (in-place constant updates) over Option B (shared module) — simpler, no new import dependencies

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × S(1) = 85
- Total: 425 / 5 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create dirs and move files | Yes | None | No |
| TASK-02: Update TS path constants | Yes (TASK-01 complete) | None — resolve functions change from `path.join(ROOT, businessId + ext)` to `path.join(ROOT, businessId, filename)` | No |
| TASK-03: Update schema $id and embedded paths | Yes (TASK-01 complete) | None | No |
| TASK-04: Verification | Yes (TASK-02, TASK-03 complete) | None | No |

## Validation Contracts

- TC-01 (TASK-01): Directory structure matches per-business layout
- TC-02 (TASK-02): No old type-directory path segments in TypeScript; typecheck passes
- TC-03 (TASK-03): No old type-directory paths in docs; schema $id values correct
- TC-04 (TASK-04): Typecheck + lint + comprehensive grep all pass
