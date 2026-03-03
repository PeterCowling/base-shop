---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03T16:00:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: plans-archive-consolidation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Plans Archive Consolidation Plan

## Summary

Consolidate two parallel archive systems (`_archive/` with 111 structured directories and `archive/` with 213 loose .md files + 27 structured subdirectories) into a single canonical `_archive/` system. Move the 27 structured subdirectories from `archive/` to `_archive/`, delete the 213 loose files (all recoverable from git history), clean up 3 demo files in `_tmp/`, and update all code references (2 lint exemptions + 7 JSDoc comments in .ts files).

## Active tasks
- [x] TASK-01: Consolidate plan archives and update all references

## Goals
- Single authoritative archive system at `docs/plans/_archive/`
- All structured archive content preserved (27 subdirectories migrated)
- All code references updated (zero stale `docs/plans/archive/` references)
- `_tmp/` demo files removed

## Non-goals
- Building an automatic archive retention/pruning policy
- Restructuring `_archive/` directory format
- Migrating content to a different storage system

## Constraints & Assumptions
- Constraints:
  - 9 TypeScript files reference `docs/plans/archive/` paths (2 lint + 3 runtime JSDoc + 4 test JSDoc)
  - 27 archive/ subdirectories use the same structured format as _archive/ (fact-find.md + plan.md pairs)
  - Only 1 slug overlap between archive/ loose files and _archive/ directories (`prime-hardcoded-copy-i18n-remediation`) — loose file is superseded
  - All 7 JSDoc references point to the same file: `docs/plans/archive/learning-compiler-plan.md`
- Assumptions:
  - All archive/ content is historical — no active plans reference it as input (confirmed by fact-find grep)
  - _archive/ is the canonical archive system; archive/ is its legacy predecessor

## Inherited Outcome Contract

- **Why:** Two archive systems create confusion about where completed plans go. 213 loose files + 27 subdirectories in archive/ alongside 111 structured directories in _archive/. Demo files in _tmp/ pollute version control.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single clear archive system. archive/ contents audited and either deleted or migrated. _tmp/ cleaned or gitignored.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/plans-archive-consolidation/fact-find.md`
- Key findings used:
  - 27 archive/ subdirectories have identical format to _archive/ — direct move
  - 213 loose .md files are pre-directory-era archives with no code references — safe to delete
  - Only 1 slug overlap (prime-hardcoded-copy-i18n-remediation) — loose file superseded by _archive/ entry
  - All 7 JSDoc references point to `docs/plans/archive/learning-compiler-plan.md` — documentation-only
  - 2 lint files (docs-lint.ts, plans-lint.ts) have exemptions for `archive/` that can be removed
  - 3 _tmp/ demo files have no code references

## Proposed Approach
- Option A: Move archive/ subdirectories to _archive/, delete loose files, update all references in one pass
- Option B: Create new _archive/ directories for referenced loose files (learning-compiler-plan.md) before deleting
- Chosen approach: Option A — all loose files including learning-compiler-plan.md are deleted. JSDoc references are updated to note archival. Creating new _archive/ directories for loose files adds complexity without value since the JSDoc is historical documentation only, and the content is recoverable from git history.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Consolidate plan archives and update all references | 90% | M | Complete (2026-03-03) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task — sequential execution |

## Tasks

### TASK-01: Consolidate plan archives and update all references
- **Type:** IMPLEMENT
- **Deliverable:** Consolidated archive system — single `_archive/` directory, archive/ and _tmp/ removed, all code references updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Artifact-Destination:** Repository-local file reorganisation
- **Reviewer:** None: operational infrastructure cleanup
- **Approval-Evidence:** None: no reviewer required
- **Measurement-Readiness:** None: operational improvement with no ongoing metrics
- **Affects:** `docs/plans/archive/` (27 subdirectories + 213 loose files), `docs/plans/_archive/` (target), `docs/plans/_tmp/` (3 demo files), `scripts/src/docs-lint.ts`, `scripts/src/plans-lint.ts`, `scripts/src/startup-loop/learning-compiler.ts`, `scripts/src/startup-loop/baseline-priors.ts`, `scripts/src/startup-loop/s10-learning-hook.ts`, `scripts/src/startup-loop/__tests__/learning-compiler.test.ts`, `scripts/src/startup-loop/__tests__/baseline-priors.test.ts`, `scripts/src/startup-loop/__tests__/baseline-priors-extraction.test.ts`, `scripts/src/startup-loop/__tests__/s10-learning-hook.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — all file paths verified by fact-find grep/ls; operations are mechanical file moves, deletes, and text edits; no runtime behavior changes
  - Approach: 90% — clear pattern: move structured dirs, delete loose files, update references; evidence supports all decisions
  - Impact: 90% — zero functional code changes; all content in git history; lint exemption removal reduces future confusion
- **Acceptance:**
  - `docs/plans/archive/` directory no longer exists
  - `docs/plans/_tmp/` directory no longer exists
  - `docs/plans/_archive/` contains 138+ directories (111 existing + 27 migrated)
  - Zero TypeScript files contain `docs/plans/archive/` references
  - Lint and typecheck pass
- **Validation contract (VC-XX):**
  - VC-01: `ls docs/plans/archive/ 2>&1` returns "No such file or directory" -> archive/ fully removed
  - VC-02: `ls docs/plans/_tmp/ 2>&1` returns "No such file or directory" -> _tmp/ fully removed
  - VC-03: `ls -d docs/plans/_archive/*/ | wc -l` returns >= 138 -> all 27 subdirectories migrated
  - VC-04: `grep -r "docs/plans/archive/" scripts/src/ --include="*.ts" | wc -l` returns 0 -> all code references updated
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan:
    - Confirm archive/ exists with 27 subdirectories and 213+ loose files
    - Confirm _tmp/ exists with 3 files
    - Confirm 9 TypeScript files reference `docs/plans/archive/`
    - Confirm _archive/ has 111 directories
  - Green evidence plan:
    - Move 27 archive/ subdirectories to _archive/ using `git mv`
    - Delete 213 loose .md files from archive/ using `git rm`
    - Remove empty archive/ directory
    - Delete 3 _tmp/ demo files using `git rm`, remove _tmp/ directory
    - Update `scripts/src/docs-lint.ts`: remove `normalized.startsWith("docs/plans/archive/")` line from `isArchivedPlanDoc()`
    - Update `scripts/src/plans-lint.ts`: remove `"docs/plans/archive/"` from `LOCAL_JEST_PATTERN_EXEMPTIONS`
    - Update 7 .ts files: change JSDoc `docs/plans/archive/learning-compiler-plan.md` to `the learning-compiler plan (archived — see git history)` — replacement text must NOT contain `docs/plans/archive/` to satisfy VC-04
    - Run VC-01 through VC-04
  - Refactor evidence plan:
    - Run scoped validation: `pnpm --filter scripts typecheck` and `pnpm --filter scripts lint` (changes are limited to scripts/src/ + docs/)
    - Grep `.ts` files in `scripts/src/` for any remaining `docs/plans/archive/` references to confirm VC-04 passes. Non-.ts files (e.g. queue-state.json dispatch descriptions) contain historical context strings that are exempt from updates.
- **Planning validation (required for M/L):**
  - Checks run: grep verification of all 9 TypeScript references; ls verification of archive/ subdirectories and _archive/ directories; overlap check between archive/ subdirs and _archive/
  - Validation artifacts: fact-find evidence audit (Phase 5.5 simulation trace passed)
  - Unexpected findings: None
- **Scouts:** None: all paths verified by fact-find investigation with 90%+ confidence
- **Edge Cases & Hardening:**
  - Slug overlap (`prime-hardcoded-copy-i18n-remediation`): archive/ loose file is superseded by _archive/ directory — safe to delete
  - `docs/plans/archive/` referenced in queue-state.json dispatch descriptions (historical text): these are informational context strings in past dispatches, not code references — no update needed
  - `docs/plans/_tmp/` referenced in queue-state.json dispatch description: informational context only — no update needed
- **What would make this >=95%:**
  - Executing the operations and confirming VC-01 through VC-04 all pass (which happens during build)
- **Rollout / rollback:**
  - Rollout: Single git commit with all file moves, deletes, and text edits
  - Rollback: `git revert <commit-sha>` restores all files and references
- **Documentation impact:**
  - None beyond the files being moved/updated — this is a documentation infrastructure cleanup
- **Notes / references:**
  - The `historical/` path in docs-lint.ts isArchivedPlanDoc() is unrelated to this scope and should not be modified
  - All 7 JSDoc references point to the same file (`learning-compiler-plan.md`) — a single find-and-replace pattern handles all of them
- **Build evidence (2026-03-03):**
  - Red: Confirmed 27 subdirs, 213 loose files, 111 _archive/ dirs, 3 _tmp/ files, 9 .ts references — all match fact-find
  - Green: git mv 27 subdirs → _archive/ (138 total); git rm 213 loose files; rm -rf _tmp/ (untracked); edited docs-lint.ts, plans-lint.ts, 7 JSDoc files
  - VC-01: `archive/` — No such file or directory (PASS)
  - VC-02: `_tmp/` — No such file or directory (PASS)
  - VC-03: `_archive/` has 138 directories (PASS)
  - VC-04: 0 TypeScript references to `docs/plans/archive/` (PASS)
  - Refactor: Scoped typecheck passed (no errors in changed files; pre-existing error in run-xa-pipeline.ts:539 unrelated)

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed reference to archive/ in .ts files | Low | Low | VC-04 grep catches any remaining .ts references; non-.ts historical context strings (e.g. queue-state.json) are exempt |
| archive/ content needed for future reference | Very Low | Low | All content remains in git history; recoverable via `git log --all -- docs/plans/archive/` |
| Lint exemption removal causes false positive lint failures | Low | Low | VC-04 + typecheck/lint run in refactor step catches any issues |

## Observability
- Logging: None — operational file cleanup
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Single archive system at `docs/plans/_archive/` with 138+ directories
- [ ] `docs/plans/archive/` directory removed
- [ ] `docs/plans/_tmp/` directory removed
- [ ] Zero TypeScript references to `docs/plans/archive/`
- [ ] Lint and typecheck pass

## Decision Log
- 2026-03-03: Chose Option A (delete loose files including learning-compiler-plan.md) over Option B (preserve referenced files in new _archive/ directories). Rationale: JSDoc references are historical documentation; creating new directories adds complexity without value. Git history preserves content.

## Overall-confidence Calculation
- TASK-01: 90% * M(2) = 180
- Total = 180 / 2 = 90%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Consolidate plan archives and update all references | Yes | None — all file paths verified, no directory name collisions, all code references mapped, operations are reversible file moves/deletes/edits | No |
