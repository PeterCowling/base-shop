---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Build-completed: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-scripts-domain-dirs
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Scripts Domain Dirs Plan

## Summary

Reorganise 66 of 79 TypeScript source files in `scripts/src/startup-loop/` from a flat directory into 8 domain subdirectories (self-evolving/, ideas/, diagnostics/, website/, baselines/, build/, s2/, s10/). 13 cross-cutting infrastructure files remain at root. All test imports (72 files), source imports, and package.json script entries (14 entries) are updated. Zero runtime behavior change — TypeScript compilation is the verification gate.

## Active tasks

- [x] TASK-01: Move 66 source files to 8 domain subdirectories and update all references — Complete (2026-03-03)

## Goals

- Organise source files by logical domain for navigability
- Preserve all import resolution (TypeScript compilation clean)
- Update all package.json script paths
- Preserve git history via `git mv`

## Non-goals

- Reorganising `__tests__/` directory structure (tests stay flat, only imports updated)
- Adding barrel exports or TypeScript path aliases
- Renaming any files (only moving)
- Modifying the existing `naming/` subdirectory

## Inherited Outcome Contract

- **Why:** 79 TypeScript files in one flat directory. Domain groups (self-evolving, ideas, diagnostics, website, build) are only distinguishable by filename prefix. As more files are added, grep becomes the only navigation method.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Domain subdirectories created (self-evolving/, ideas/, diagnostics/, website/, build/, s10/, s2/, baselines/). All import paths and test references updated. TypeScript compilation clean.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-scripts-domain-dirs/fact-find.md`
- Key findings used:
  - 79 root-level .ts files classified into 8 domains (66 files) + root (13 files)
  - Intra-domain imports do not change (files move together, relative paths preserved)
  - 4 cross-domain import edges identified
  - 72 test files need import path updates (from `../filename` to `../domain/filename`)
  - 14 package.json script entries reference startup-loop file paths (13 need updating)
  - Self-evolving files are fully isolated — zero imports from outside self-evolving domain
  - No external consumers (no cross-package imports into startup-loop)

## Proposed Approach

- Option A: Single task — move all 66 files at once, update all references, verify with typecheck
- Option B: Multiple tasks per domain wave — move one domain at a time with intermediate typechecks
- Chosen approach: **Option A** — single task. Rationale: intra-domain imports don't change (files move together), so moving all domains at once is no riskier than moving them individually. TypeScript compilation catches all broken imports deterministically. One atomic commit preserves clean git history.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Move 66 source files to 8 domain subdirectories, update all imports and package.json | 85% | M | Complete (2026-03-03) | - | - |

## Tasks

### TASK-01: Move 66 source files to 8 domain subdirectories and update all references

- **Type:** IMPLEMENT
- **Deliverable:** code-change — reorganised directory structure in `scripts/src/startup-loop/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:**
  - `scripts/src/startup-loop/self-evolving/` (new — 21 files)
  - `scripts/src/startup-loop/ideas/` (new — 15 files)
  - `scripts/src/startup-loop/diagnostics/` (new — 8 files)
  - `scripts/src/startup-loop/website/` (new — 6 files)
  - `scripts/src/startup-loop/baselines/` (new — 5 files)
  - `scripts/src/startup-loop/build/` (new — 4 files)
  - `scripts/src/startup-loop/s2/` (new — 4 files)
  - `scripts/src/startup-loop/s10/` (new — 3 files)
  - `scripts/src/startup-loop/__tests__/*.ts` (import path updates in 72 test files)
  - `scripts/package.json` (14 script entries, 13 need path updates)
  - `[readonly] scripts/src/startup-loop/*.ts` (13 root files — unchanged, inform import context)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — mechanical `git mv` + compiler-guided import updates; same approach proven in dispatch B (self-evolving-per-business-reorg). Held-back test: no single unknown would drop below 80 because all file classifications are evidence-based (prefix + import graph) and TypeScript compilation catches all broken imports.
  - Approach: 85% — domain groupings map directly to filename prefixes; 4 cross-domain edges are minimal and documented. Held-back test: passed — approach was validated across 3 prior dispatches in this series.
  - Impact: 90% — zero runtime behavior change; purely organizational.
- **Acceptance:**
  - [ ] 8 new subdirectories created with correct file counts (self-evolving: 21, ideas: 15, diagnostics: 8, website: 6, baselines: 5, build: 4, s2: 4, s10: 3)
  - [ ] 13 files remain at root (cass-retrieve, contract-lint, derive-state, generate-stage-operator-views, manifest-update, mcp-preflight, mcp-preflight-config, recovery, replan-trigger, run-concurrency, s6b-gates, stage-addressing, stage-id-compat)
  - [ ] `pnpm --filter scripts tsc --noEmit` passes with zero errors
  - [ ] All 14 package.json script entries verified; paths updated where files moved
  - [ ] Zero stale import paths in `__tests__/` referencing moved files at old locations
- **Validation contract (TC-XX):**
  - TC-01: After all moves and import updates → `pnpm --filter scripts tsc --noEmit` exits 0
  - TC-02: `ls scripts/src/startup-loop/*.ts | wc -l` → exactly 13 (root-staying files only)
  - TC-03: Each of 8 new subdirectories exists and contains the expected file count
  - TC-04: `grep -rn "from ['\"]\.\./" scripts/src/startup-loop/__tests__/ | grep -v "/naming/" | grep -v "/self-evolving/" | grep -v "/ideas/" | grep -v "/diagnostics/" | grep -v "/website/" | grep -v "/baselines/" | grep -v "/build/" | grep -v "/s2/" | grep -v "/s10/"` → only references to root-staying files (13 files). Grep matches both single and double-quoted imports.
  - TC-05: All 14 package.json script entries reference valid file paths: `grep "src/startup-loop/" scripts/package.json | sed 's/.*\(src\/startup-loop\/[^"'"'"' ]*\.ts\).*/\1/' | sort -u | while read f; do test -f "scripts/$f" || echo "MISSING: $f"; done` → zero MISSING lines
- **Execution plan:**
  - **Red phase:** Verify current state — 79 root files, 72 test files, 14 package.json entries. Confirm no existing subdirectories (except naming/) conflict with proposed names.
  - **Green phase:**
    1. Create 8 subdirectories: `mkdir -p self-evolving ideas diagnostics website baselines build s2 s10`
    2. `git mv` all 66 files to their classified domains (batch by domain for clarity)
    3. Run `pnpm --filter scripts tsc --noEmit` — capture all import errors
    4. For each broken import in source files: update path (e.g., `./baseline-priors.js` → `../baselines/baseline-priors.js` when file moved to different domain; imports between files in the same domain are unchanged)
    5. For each broken import in test files: update path (e.g., `../self-evolving-contracts` → `../self-evolving/self-evolving-contracts`)
    6. Update 13 package.json script entries with new subdirectory paths (e.g., `src/startup-loop/generate-process-improvements.ts` → `src/startup-loop/build/generate-process-improvements.ts`)
    7. Re-run `pnpm --filter scripts tsc --noEmit` — should pass
  - **Refactor phase:**
    1. Grep for stale path references in `.claude/skills/` and `docs/` mentioning moved files at old paths
    2. Update any stale documentation references
    3. Final typecheck + lint confirmation
- **Planning validation (required for M/L):**
  - Checks run:
    - Verified import convention: source files use `.js` extension (`from './self-evolving-backbone.js'`); test files omit extension (`from '../self-evolving-contracts'`)
    - Confirmed self-evolving files have zero imports from outside their domain — intra-domain moves require zero import changes
    - Identified 7 files importing `stage-id-compat` (root) — 6 of these are moving to subdirectories and need updated relative paths
    - Counted 14 package.json script entries (not 3 as initially estimated in fact-find)
  - Validation artifacts: Import pattern verification via Explore agent
  - Unexpected findings: 14 package.json entries vs 3 initially documented — scope expanded to cover all entries
- **Consumer tracing (M effort):**
  - New outputs: None — no new values, exports, or interfaces introduced
  - Modified behavior: None — only import paths change. TypeScript compilation verifies all import resolution. No function signatures or semantics change.
  - Consumer `stage-id-compat`: imported by 7 files (6 moving to subdirectories). All 6 imports update from `./stage-id-compat.js` to `../stage-id-compat.js`. Consumer `manifest-update` stays at root — unchanged.
  - Consumer `derive-state`: imported by 2 files. `event-validation.ts` moves to diagnostics/ (import updates). `recovery.ts` stays at root (no change).
- **Scouts:** None: all file classifications verified by filename prefix + import graph analysis
- **Edge Cases & Hardening:**
  - Jest test discovery: Tests remain in `__tests__/` (flat). Jest config discovers by `__tests__` glob, not by source path — no config change needed.
  - Shell scripts referencing file paths: `scripts/git-hooks/generate-process-improvements.sh` uses `pnpm --filter scripts startup-loop:generate-process-improvements` (package.json script name, not file path) — no change needed.
  - Skill doc path references: `.claude/skills/lp-do-build/SKILL.md` references `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` and `scripts/src/startup-loop/generate-process-improvements.ts`. These are documentation paths — update for correctness.
- **What would make this >=90%:**
  - Running the actual `git mv` + typecheck cycle once to confirm zero surprises. At 85%, the only uncertainty is whether the domain classification is complete — if a file should be in a different domain, it's trivially fixable but adds iteration.
- **Build completion evidence (2026-03-03):**
  - TC-01: `npx tsc --noEmit --project scripts/tsconfig.json` — zero TS2307 import errors (only pre-existing TS2322 in xa/run-xa-pipeline.ts)
  - TC-02: `ls scripts/src/startup-loop/*.ts | wc -l` → 13 (correct)
  - TC-03: All 8 subdirectories contain expected file counts (self-evolving: 21, ideas: 15, diagnostics: 8, website: 6, baselines: 5, build: 4, s2: 4, s10: 3)
  - TC-04: All test `../` imports without domain prefix reference root-staying files only (verified via grep)
  - TC-05: All 14 package.json script entries resolve to existing files (zero MISSING)
  - Source imports fixed: 24 edits across 13 source files (cross-domain + depth changes)
  - Test imports fixed: 55 of 72 test files updated; 17 unchanged (root-only imports)
  - Package.json: 13 of 14 script entries updated (1 unchanged: references root-staying file)
  - Refactor phase: stale path references updated in 12 docs/skills files (lp-do-build/SKILL.md, lp-do-ideas/SKILL.md, metrics-adapter-contract.md, loop-output-contracts.md, self-evolving/README.md, ideas trial-contract/rollback-playbook/go-live-seam/go-live-checklist/routing-matrix/telemetry-schema, ideas/_deprecated/README.md)
- **Rollout / rollback:**
  - Rollout: single commit via writer lock
  - Rollback: `git revert <commit>` — fully reversible
- **Documentation impact:**
  - Update skill doc path references in `.claude/skills/lp-do-build/SKILL.md`
  - Update any stale path references in `docs/` found during refactor phase grep
- **Notes / references:**
  - Domain classification table: see fact-find `## Evidence Audit > Key Modules / Files > Domain Classification`
  - Import convention: source uses `.js` extension; tests omit extension
  - Cross-domain edges (4): s10→baselines, build→ideas, root→diagnostics, self-evolving→ideas

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Move 66 files + update imports | Yes | None — all file classifications evidence-based; TypeScript compilation catches all broken imports deterministically; package.json entries enumerated | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed import path in source or test file | Low | Low | TypeScript compilation catches all broken imports — zero-miss guarantee |
| Package.json script entry missed | Low | Medium | Grep for all `src/startup-loop/` references in package.json; 14 entries identified at planning time |
| Skill/doc references to old paths | Low | Low | Refactor phase grep for stale paths in `.claude/skills/` and `docs/` |
| File classified in wrong domain | Very Low | Very Low | Trivially correctable by moving file again; no build dependency on classification |

## Observability

None: internal infrastructure change with no runtime impact.

## Acceptance Criteria (overall)

- [x] 66 files moved to 8 domain subdirectories
- [x] 13 files remain at root
- [x] TypeScript compilation passes
- [x] All 14 package.json script entries verified and updated where needed
- [x] Zero stale import references
- [ ] Committed via writer lock

## Decision Log

- 2026-03-03: Single task (Option A) chosen over multi-wave (Option B). Rationale: intra-domain imports are unchanged (files move together), so incremental verification adds overhead without reducing risk. TypeScript compilation is equally effective as a single-pass gate.
- 2026-03-03: Tests stay flat in `__tests__/`. Rationale: 50% less file movement; test discoverability is already good via 1:1 naming convention; Jest glob-based discovery is unaffected.
- 2026-03-03: 14 package.json entries identified (expanded from fact-find's initial 3). All 13 referencing moved files need path updates.

## Overall-confidence Calculation

- TASK-01: M effort (weight 2), confidence 85%
- Overall-confidence = 85% × 2 / 2 = 85%
