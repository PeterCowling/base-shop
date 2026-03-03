---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: assessment-naming-workbench
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Assessment Naming Workbench Plan

## Summary

Move intermediate naming artifacts (candidate lists, RDAP lookups, TM pre-screens, shortlists, generation specs, prompts) from assessment/ root into assessment/naming-workbench/ for all businesses (HEAD, HBAG, PET, PWRB). Update naming CLI hardcoded paths to use dynamic per-business resolution. Fix pre-existing skill path references that point to BIZ root instead of assessment/. Remove empty duplicate sidecar directories at BIZ root level.

## Active tasks

- [x] TASK-01: Create naming-workbench/ directories and move intermediate files — Complete (2026-03-03)
- [x] TASK-02: Update naming CLI path constants to dynamic per-business resolution — Complete (2026-03-03)
- [x] TASK-03: Update assessment skill SKILL.md path references — Complete (2026-03-03)
- [x] TASK-04: Remove empty sidecar directories and verify no stale paths — Complete (2026-03-03)

## Goals

- Move 55 naming intermediates + 3 sidecar dirs into assessment/naming-workbench/ per business
- Make naming CLIs business-agnostic (dynamic path from BUSINESS constant)
- Fix skill path references to point to correct assessment/naming-workbench/ location
- Remove empty duplicate sidecar directories at BIZ root

## Non-goals

- Changing assessment skill logic or outputs
- Restructuring final assessment deliverables
- Adding test coverage for naming CLIs

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only — local verification is typecheck + lint + grep
  - Writer lock required for all commits
  - Use `git mv` for all file moves to preserve history
- Assumptions:
  - `naming-workbench/` is the target subdirectory name (per dispatch intent)
  - Pattern-based file classification is deterministic and complete

## Inherited Outcome Contract

- **Why:** HEAD assessment/ has 60 files. Most are intermediate naming artifacts (7 rounds of candidates, RDAP, shortlists, TM pre-screens) burying actual assessment outputs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Intermediate naming artifacts moved to assessment/naming-workbench/ for all businesses. Only final deliverables remain at assessment/ root. Naming CLI sidecar paths updated.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/assessment-naming-workbench/fact-find.md`
- Key findings used:
  - HEAD: 58 files, 33 naming intermediates; HBAG: 33/15; PET: 10/2; PWRB: 9/5; BRIK: 6/0
  - Two distinct sidecar directory families: `naming-sidecars/` (rdap-cli) and `product-naming-sidecars/` (tm-prescreen-cli)
  - CLIs hardcode HEAD-specific absolute paths with no dynamic resolution
  - Skills 04, 05, 13 reference BIZ root paths instead of assessment/ subdirectory
  - 3 empty sidecar directories at BIZ root level (duplicates of populated assessment/ versions)
  - 2 test files reference assessment/ but only for final deliverables — no updates needed

## Proposed Approach

- Chosen approach: Single-pass reorganisation in 3 waves. Wave 1 moves files into naming-workbench/ using `git mv`. Wave 2 updates all path references (CLIs + skills) in parallel. Wave 3 removes empty directories and verifies no stale paths remain.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create naming-workbench/ dirs and move intermediate files | 85% | M | Complete (2026-03-03) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update naming CLI path constants | 85% | S | Complete (2026-03-03) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Update assessment skill SKILL.md path references | 85% | S | Complete (2026-03-03) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Remove empty sidecar dirs and verify no stale paths | 85% | S | Complete (2026-03-03) | TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | File moves must complete before path updates |
| 2 | TASK-02, TASK-03 | TASK-01 | CLI updates and skill updates are independent |
| 3 | TASK-04 | TASK-02, TASK-03 | Cleanup and verification after all changes |

## Tasks

### TASK-01: Create naming-workbench/ directories and move intermediate files

- **Type:** IMPLEMENT
- **Deliverable:** File moves under `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/strategy/HEAD/assessment/`, `docs/business-os/strategy/HBAG/assessment/`, `docs/business-os/strategy/PET/assessment/`, `docs/business-os/strategy/PWRB/assessment/`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% - git mv commands are deterministic; file identification by pattern is validated; 55 files + 3 sidecar dirs across 4 businesses
  - Approach: 90% - pattern-based classification tested against actual file listing; all intermediates identified
  - Impact: 85% - reduces assessment/ clutter from 58→25 files (HEAD); similar ratios for other businesses
- **Acceptance:**
  - All files matching naming intermediate patterns are in `assessment/naming-workbench/` for HEAD, HBAG, PET, PWRB
  - No naming intermediate files remain at assessment/ root
  - Sidecar directories (`naming-sidecars/`, `product-naming-sidecars/`) moved inside naming-workbench/
  - Final deliverables remain at assessment/ root unchanged
- **Validation contract (TC-XX):**
  - TC-01: `find docs/business-os/strategy/HEAD/assessment -maxdepth 1 -type f \( -name "*naming*" -o -name "*candidate-names*" -o -name "*rdap*" -o -name "*shortlist*" -o -name "*generation-spec*" -o -name "*product-naming*" \)` → 0 results
  - TC-02: `find docs/business-os/strategy/HEAD/assessment/naming-workbench -maxdepth 1 -type f` → 33 files
  - TC-03: `find docs/business-os/strategy/HBAG/assessment/naming-workbench -maxdepth 1 -type f` → 15 files
  - TC-04: `find docs/business-os/strategy/PET/assessment/naming-workbench -maxdepth 1 -type f` → 2 files
  - TC-05: `find docs/business-os/strategy/PWRB/assessment/naming-workbench -maxdepth 1 -type f` → 5 files
  - TC-06: `ls docs/business-os/strategy/HEAD/assessment/naming-workbench/naming-sidecars/` → 1 file
  - TC-07: `ls docs/business-os/strategy/HEAD/assessment/naming-workbench/product-naming-sidecars/` → 1 file
  - TC-08: `ls docs/business-os/strategy/HBAG/assessment/naming-workbench/product-naming-sidecars/` → 1 file
- **Execution plan:**
  - Create `naming-workbench/` subdirectory in each business's assessment/ dir (HEAD, HBAG, PET, PWRB)
  - For each business, `git mv` all files matching naming intermediate patterns into naming-workbench/
  - `git mv` sidecar directories into naming-workbench/ (HEAD: naming-sidecars + product-naming-sidecars; HBAG: product-naming-sidecars)
  - Run TC-01 through TC-08 to verify
- **Planning validation (required for M/L):**
  - Checks run: `find` commands verified file counts per business; pattern classification validated against HEAD file listing (33 matches out of 58 total)
  - Validation artifacts: fact-find evidence section with exact counts
  - Unexpected findings: `candidate-names-*` pattern was initially missed; now included in classification
- **Consumer tracing:**
  - New output: files at `assessment/naming-workbench/<filename>` (new paths). Consumers:
    - rdap-cli.ts SIDECAR_DIR → addressed by TASK-02 (changes path to naming-workbench/naming-sidecars)
    - tm-prescreen-cli.ts SIDECAR_DIR → addressed by TASK-02 (changes path to naming-workbench/product-naming-sidecars)
    - Skills 04, 05, 13 path references → addressed by TASK-03
    - Test files (`contract-lint.test.ts`, `lp-do-ideas-trial.test.ts`) → unchanged because they reference final deliverables, not naming intermediates
  - Modified behavior: file location changes from `assessment/<file>` to `assessment/naming-workbench/<file>`. All consumers addressed within this plan.
- **Scouts:** None: all files are documentation/data with no runtime consumers beyond identified CLIs and skills
- **Edge Cases & Hardening:**
  - Edge case: a file matches multiple patterns (e.g. `product-naming-shortlist-*` matches both `*naming*` and `*shortlist*`). Handled: `git mv` is idempotent — moving a file that's already moved produces an error that's caught. The classification is for identification, not for separate move operations.
  - Edge case: sidecar dir contains subdirectories. Handled: `git mv` of directories moves recursively.
- **What would make this >=90%:**
  - Dry-run the `git mv` commands and confirm all 55 files + 3 dirs are addressed with zero errors
- **Rollout / rollback:**
  - Rollout: single commit with all file moves
  - Rollback: `git revert` on the commit
- **Documentation impact:**
  - README or index of assessment/ contents could be useful but is out of scope
- **Notes / references:**
  - Use `git mv` (not `mv`) to preserve history

### TASK-02: Update naming CLI path constants

- **Type:** IMPLEMENT
- **Deliverable:** Code change in `scripts/src/startup-loop/naming/rdap-cli.ts` and `scripts/src/startup-loop/naming/tm-prescreen-cli.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/naming/rdap-cli.ts`, `scripts/src/startup-loop/naming/tm-prescreen-cli.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - 2 constants to change; clear before/after; absolute→relative with dynamic business
  - Approach: 85% - use `path.resolve` with BUSINESS constant for dynamic resolution
  - Impact: 85% - makes CLIs work for any business, not just HEAD
- **Acceptance:**
  - rdap-cli.ts SIDECAR_DIR uses relative path with BUSINESS variable pointing to `assessment/naming-workbench/naming-sidecars`
  - tm-prescreen-cli.ts SIDECAR_DIR default uses relative path with BUSINESS variable pointing to `assessment/naming-workbench/product-naming-sidecars`
  - tm-prescreen-cli.ts JSDoc comment updated to reflect new default path
  - rdap-cli.ts JSDoc header updated if it references the old path
  - No absolute `/Users/petercowling/...` paths remain in either file
  - Typecheck passes
- **Validation contract (TC-XX):**
  - TC-01: `grep -c '/Users/petercowling' rdap-cli.ts` → 0
  - TC-02: `grep -c '/Users/petercowling' tm-prescreen-cli.ts` → 0
  - TC-03: `grep 'naming-workbench/naming-sidecars' rdap-cli.ts` → 1 match
  - TC-04: `grep 'naming-workbench/product-naming-sidecars' tm-prescreen-cli.ts` → 1 match
  - TC-05: `pnpm typecheck` → passes (pre-existing xa error only)
- **Execution plan:**
  - rdap-cli.ts: Move `const BUSINESS = 'HEAD'` declaration ABOVE `SIDECAR_DIR` (currently declared after — using BUSINESS in SIDECAR_DIR init before its declaration causes a TDZ error). Then replace `const SIDECAR_DIR = '/Users/petercowling/base-shop/docs/business-os/strategy/HEAD/assessment/naming-sidecars'` with `const SIDECAR_DIR = path.resolve('docs/business-os/strategy', BUSINESS, 'assessment/naming-workbench/naming-sidecars')`. Add `import * as path from 'node:path'`.
  - tm-prescreen-cli.ts: Move `const BUSINESS = ...` declaration ABOVE `SIDECAR_DIR` (same TDZ concern). Replace hardcoded default in SIDECAR_DIR with `path.resolve('docs/business-os/strategy', BUSINESS, 'assessment/naming-workbench/product-naming-sidecars')`.
  - Update JSDoc comments in both files to reflect new paths
- **Scouts:** None: CLIs have no callers other than operator invocation from command line
- **Edge Cases & Hardening:** None: env var override in tm-prescreen-cli.ts continues to work unchanged (TM_SIDECAR_DIR overrides the default)
- **What would make this >=90%:**
  - Confirm typecheck passes after changes
- **Rollout / rollback:**
  - Rollout: committed with TASK-01 or immediately after
  - Rollback: `git revert`
- **Documentation impact:** CLI usage comments updated inline
- **Notes / references:** rdap-cli.ts needs `import * as path from 'node:path'` added. Both CLIs need BUSINESS declared before SIDECAR_DIR to avoid TDZ error.

### TASK-03: Update assessment skill SKILL.md path references

- **Type:** IMPLEMENT
- **Deliverable:** Documentation change in `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - search-replace in 3 markdown files; all references identified via grep
  - Approach: 90% - straightforward path update in documentation
  - Impact: 85% - fixes pre-existing path mismatch; skills will reference correct locations
- **Acceptance:**
  - All naming output path references in skills 04, 05, 13 point to `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/` instead of `docs/business-os/strategy/<BIZ>/`
  - Shell script snippets in skills reference naming-workbench/ subdirectory
  - Sidecar path references updated (skill 13 references `product-naming-sidecars`)
- **Validation contract (TC-XX):**
  - TC-01: grep for `strategy/\${BIZ}/naming-` in all 3 skill files → 0 matches (old BIZ-root pattern gone)
  - TC-02: grep for `strategy/\${BIZ}/product-naming-` in skill 13 → 0 matches (old pattern gone)
  - TC-03: grep for `naming-workbench/` in all 3 skill files → matches present for each updated path
  - TC-04: grep for `strategy/<BIZ>/naming-` in all 3 skill files → 0 matches (prose references also updated)
- **Execution plan:**
  - Skill 04: Update `CANDIDATES`, `OUT` shell vars and prose paths from `strategy/${BIZ}/naming-*` to `strategy/${BIZ}/assessment/naming-workbench/naming-*`; update shortlist save path
  - Skill 05: Update naming-generation-spec and naming-candidates paths to include `assessment/naming-workbench/`; update shortlist save path
  - Skill 13: Update `CANDIDATES`, `OUT`, `TM_SIDECAR_DIR` shell vars and prose paths from `strategy/${BIZ}/product-naming-*` to `strategy/${BIZ}/assessment/naming-workbench/product-naming-*`
- **Scouts:** None: skills are documentation, not code; no compilation or import resolution
- **Edge Cases & Hardening:** None: markdown text replacement
- **What would make this >=90%:**
  - Manually verify each skill file's path references post-edit
- **Rollout / rollback:**
  - Rollout: committed with other path updates
  - Rollback: `git revert`
- **Documentation impact:** The skill files ARE the documentation
- **Notes / references:** This also fixes the pre-existing mismatch where skills referenced BIZ root instead of assessment/

### TASK-04: Remove empty sidecar directories and verify no stale paths

- **Type:** IMPLEMENT
- **Deliverable:** Cleanup of empty directories + verification grep
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/strategy/HEAD/naming-sidecars/`, `docs/business-os/strategy/HEAD/product-naming-sidecars/`, `docs/business-os/strategy/HBAG/product-naming-sidecars/`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - 3 empty directories to remove; comprehensive stale-path grep
  - Approach: 90% - deterministic cleanup + verification
  - Impact: 85% - prevents confusion from duplicate empty directories
- **Acceptance:**
  - Empty sidecar directories at BIZ root are removed: HEAD/naming-sidecars/, HEAD/product-naming-sidecars/, HBAG/product-naming-sidecars/
  - No references to old naming intermediate paths remain in code or skill files
  - `pnpm typecheck` passes
  - `pnpm lint` passes
- **Validation contract (TC-XX):**
  - TC-01: `test -d docs/business-os/strategy/HEAD/naming-sidecars && echo EXISTS || echo GONE` → GONE
  - TC-02: `test -d docs/business-os/strategy/HEAD/product-naming-sidecars && echo EXISTS || echo GONE` → GONE
  - TC-03: `test -d docs/business-os/strategy/HBAG/product-naming-sidecars && echo EXISTS || echo GONE` → GONE
  - TC-04: grep for old naming intermediate paths (`assessment/naming-candidates-`, `assessment/naming-sidecars`, `assessment/product-naming-sidecars`) in `scripts/` and `.claude/skills/` → 0 matches in live code/skill files (plan/fact-find docs are exempt from this check)
  - TC-05: `pnpm typecheck` → passes (pre-existing xa error only)
  - TC-06: `pnpm lint` → passes (0 errors)
- **Execution plan:**
  - Remove the 3 empty sidecar directories at BIZ root (`git rm -r` if tracked, `rm -rf` if untracked-empty)
  - Run comprehensive grep for stale path patterns in `scripts/` and `.claude/skills/`: `assessment/naming-candidates-`, `assessment/naming-sidecars`, `assessment/product-naming-sidecars`, `assessment/naming-shortlist-`, etc. → expect 0 matches (plan/fact-find docs under `docs/plans/` are outside this scope and exempt)
  - Run `pnpm --filter scripts typecheck` for scoped validation, then `pnpm typecheck` and `pnpm lint` for full verification
- **Scouts:** None: directories confirmed empty in fact-find
- **Edge Cases & Hardening:** Edge case: empty directories may be untracked by git (git doesn't track empty dirs). Handled: use `rm -rf` as fallback if `git rm -r` fails.
- **What would make this >=90%:**
  - Confirm zero stale path references outside plan docs
- **Rollout / rollback:**
  - Rollout: final commit in the sequence
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** Empty directories may not be tracked by git (git doesn't track empty directories). Use `rm -rf` as fallback if `git rm -r` fails on untracked dirs.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Naming skill invocation writes to old path after move | Low | Medium | TASK-03 updates all skill path references in same PR |
| Undiscovered reference to old paths | Low | Low | TASK-04 runs comprehensive grep |
| Git history harder to follow | Low | Low | git mv preserves history; single commit per wave |

## Observability

None: documentation reorganisation only.

## Acceptance Criteria (overall)

- [ ] All naming intermediates in assessment/naming-workbench/ for HEAD, HBAG, PET, PWRB
- [ ] No naming intermediates at assessment/ root
- [ ] CLI paths use dynamic per-business resolution (no absolute paths)
- [ ] Skill path references point to assessment/naming-workbench/
- [ ] Empty BIZ-root sidecar directories removed
- [ ] No stale path references in code or skills
- [ ] Typecheck and lint pass

## Decision Log

- 2026-03-03: Decided to move sidecar directories into naming-workbench/ (not just files) since sidecar data is naming pipeline output, not final deliverables.
- 2026-03-03: Decided to fix pre-existing skill path mismatch (BIZ root → assessment/naming-workbench/) opportunistically as part of this reorganisation.

## Overall-confidence Calculation

- TASK-01: 85% * M(2) = 170
- TASK-02: 85% * S(1) = 85
- TASK-03: 85% * S(1) = 85
- TASK-04: 85% * S(1) = 85
- Total: 425 / 5 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Move files to naming-workbench/ | Yes — directories will be created before git mv | None | No |
| TASK-02: Update CLI paths | Yes — TASK-01 moves files first; CLIs update to point to new locations | None | No |
| TASK-03: Update skill paths | Yes — TASK-01 moves files first; skills update to point to new locations | None | No |
| TASK-04: Cleanup + verification | Yes — TASK-02 and TASK-03 complete first; all paths updated before grep verification | None | No |
