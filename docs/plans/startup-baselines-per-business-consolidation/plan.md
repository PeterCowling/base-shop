---
Type: Plan
Status: Active
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-baselines-per-business-consolidation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Baselines Per-Business Consolidation Plan

## Summary

Move 20 flat files from `docs/business-os/startup-baselines/` root into per-business subdirectories (BRIK/, HBAG/, HEAD/, PET/), drop the redundant BIZ prefix from filenames, fix the missing hyphen in intake-packet date strings, and update all references across TypeScript source files (5), test files (8), skill documentation (~16), business-os docs (~7), and docs/registry.json. This aligns startup-baselines/ with every other domain directory's per-business subdirectory convention.

## Active tasks
- [x] TASK-01: Move flat files and update TypeScript source + test references (Complete 2026-03-03)
- [x] TASK-02: Update skill documentation, registry, and business-os docs (Complete 2026-03-03)
- [ ] TASK-03: Verify no stale references remain

## Goals
- Move all 20 flat files into per-business subdirectories
- Create PET/ subdirectory (currently missing)
- Drop redundant BIZ prefix from filenames inside subdirectories
- Fix naming inconsistency: `2026-02-12assessment` → `2026-02-12-assessment`
- Update all TypeScript source and test path references
- Update all skill documentation path patterns
- Update docs/registry.json and business-os workflow docs
- Confirm zero stale flat-file references remain

## Non-goals
- Normalizing `.user.` suffix across files (cosmetic, low value)
- Generating missing HTML companions for HBAG (separate concern)
- Updating archived plan docs in `docs/plans/_archive/` (dead code, no active consumers)
- Restructuring runtime loop engine paths (`<BIZ>/runs/`, etc.) — already use subdirectories

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only — file moves and code reference updates must be in the same commit to avoid CI breakage
  - Writer lock required for commits
  - Pre-commit hooks must pass (typecheck-staged.sh, lint-staged-packages.sh)
- Assumptions:
  - BIZ prefix drop is safe — no consumer parses BIZ code from filename (all use path templates with business variable)
  - Fixing missing hyphen won't break consumers — they use glob patterns or templates with business code, not date portion
  - Content-file internal cross-references (frontmatter, Source Ledger tables) can be updated as part of the file move without semantic impact

## Inherited Outcome Contract

- **Why:** startup-baselines/ is split-brained — same businesses have data both as flat files at the root and in per-business subdirectories. Naming conventions vary across files. Every other domain directory uses clean per-business subdirectories. This one should too.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All flat files in startup-baselines/ moved into per-business subdirectories. BIZ prefix dropped from filenames (now redundant inside subdirectory). All script/skill path references updated. No stale paths remain.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-baselines-per-business-consolidation/fact-find.md`
- Key findings used:
  - 20 flat files identified across 4 businesses (BRIK:4, HBAG:5, HEAD:6, PET:5)
  - 5 TypeScript source files use flat-file path templates
  - Fact-find identified 1 test file, but **planning validation found 8** test files with flat-file patterns
  - ~16 skills reference flat-file patterns in documentation
  - 20 additional docs files reference flat-file paths (7 active, 13 archived)
  - Content files have internal cross-references to other flat files (frontmatter sources, Source Ledger tables)
  - Proven approach from scripts domain-dirs reorg (commit 390142607a)

## Proposed Approach
- Option A: Move files in one task, update all references in a second task, verify in a third. Risk: CI breakage between commits if file moves and code updates are in separate commits.
- Option B: Move files + update code/test references atomically (single commit), then update docs/skills (no CI impact), then verify.
- Chosen approach: **Option B** — Groups code changes that must be atomic to avoid CI breakage. Separates documentation-only changes that can be committed independently.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Move flat files + update TypeScript source/test references | 85% | M | Complete (2026-03-03) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update skill docs, registry, business-os docs | 80% | M | Complete (2026-03-03) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Verify no stale references remain | 85% | S | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Atomic commit: file moves + code/test reference updates |
| 2 | TASK-02 | TASK-01 | Documentation-only changes, no CI impact |
| 3 | TASK-03 | TASK-01, TASK-02 | Verification sweep |

## Tasks

### TASK-01: Move flat files and update TypeScript source + test references
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 20 files moved, 5 source files updated, 8 test files updated, content cross-references fixed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Build evidence:** Commit `69f80ee497`. 20 files git mv'd. 6 source files updated (5 planned + 1 discovered: `map-artifact-delta-to-website-backlog.ts`). 8 test files updated. 4 content files' internal cross-references fixed. 6 HTML self-reference Source paths fixed. Pre-commit hooks passed (typecheck: 0 errors, lint: 0 errors). Controlled scope expansion: `map-artifact-delta-to-website-backlog.ts` discovered during build — matches on `-offer.md` and `-channels.md` suffixes, added to Affects.
- **Affects:**
  - `docs/business-os/startup-baselines/BRIK-*.md`, `BRIK-*.html` (moved to `BRIK/`)
  - `docs/business-os/startup-baselines/HBAG-*.md` (moved to `HBAG/`)
  - `docs/business-os/startup-baselines/HEAD-*.md`, `HEAD-*.html` (moved to `HEAD/`)
  - `docs/business-os/startup-baselines/PET-*.md`, `PET-*.html` (moved to `PET/`)
  - `scripts/src/startup-loop/website/compile-website-content-packet.ts`
  - `scripts/src/startup-loop/website/materialize-site-content-payload.ts`
  - `scripts/src/startup-loop/website/lint-website-content-packet.ts`
  - `scripts/src/startup-loop/s2/s2-market-intelligence-handoff.ts`
  - `scripts/src/startup-loop/build/generate-build-summary.ts`
  - `scripts/src/startup-loop/__tests__/baseline-priors-migration.test.ts`
  - `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`
  - `scripts/src/startup-loop/__tests__/compile-website-content-packet.test.ts`
  - `scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts`
  - `scripts/src/startup-loop/__tests__/lint-website-content-packet.test.ts`
  - `scripts/src/startup-loop/__tests__/map-artifact-delta-to-website-backlog.test.ts`
  - `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
  - `scripts/src/startup-loop/__tests__/contract-lint.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% - Proven pattern from scripts domain-dirs reorg (commit 390142607a). 20 git mv operations + path template changes in 13 TypeScript files. Planning validation confirmed all source/test file paths via comprehensive grep. Evidence class: direct file verification.
  - Approach: 90% - Only one approach: git mv + update references atomically. No alternatives to evaluate. Evidence class: precedent (prior successful reorg).
  - Impact: 85% - No behavioral change. Risk limited to stale path references in a source or test file not caught by planning validation. All consumers identified via comprehensive grep. Evidence class: direct file verification.
- **Acceptance:**
  - [ ] PET/ subdirectory created
  - [ ] All 20 flat files moved into per-business subdirectories
  - [ ] BIZ prefix dropped from all filenames
  - [ ] Missing hyphen fixed in 4 intake-packet filenames (`2026-02-12assessment` → `2026-02-12-assessment`)
  - [ ] 5 TypeScript source files updated from `${business}-name` to `${business}/name` pattern
  - [ ] 8 test files updated to match new path pattern
  - [ ] Internal cross-references in moved content files updated (frontmatter sources, Source Ledger tables)
  - [ ] HTML companion self-reference paths updated
  - [ ] CI passes (typecheck + tests)
- **Validation contract (TC-XX):**
  - TC-01: `git ls-files docs/business-os/startup-baselines/ | grep '^docs/business-os/startup-baselines/[A-Z]+-'` returns empty → no flat files remain at root
  - TC-02: `git ls-files docs/business-os/startup-baselines/PET/` returns ≥5 files → PET subdirectory populated
  - TC-03: TypeScript compilation succeeds → no broken imports or type errors
  - TC-04: `grep -rE 'startup-baselines/\$\{.*\}-' scripts/src/` returns empty → no flat-pattern template strings remain in source
  - TC-05: `grep -rE 'startup-baselines/[A-Z]+-' scripts/src/` returns empty → no flat-pattern literal strings (TEST-, HEAD-, BRIK-, etc.) remain in tests or source
  - TC-06: `baseline-priors-migration.test.ts` passes in CI → updated file-existence assertions resolve
- **Execution plan:**
  1. Create PET/ subdirectory: `mkdir -p docs/business-os/startup-baselines/PET`
  2. git mv all 20 flat files to per-business subdirectories with prefix drop and hyphen fix. Pattern: `git mv BRIK-forecast-seed.user.md BRIK/forecast-seed.user.md` etc.
  3. Update 5 TypeScript source files: change path templates from `${business}-<name>` to `${business}/<name>`. Notable cases: (a) `generate-build-summary.ts` — reads `startup-baselines/` directory (line 357), parses `<BIZ>-name.md` filenames to extract business codes (lines 344-346), uses prefix matching (lines 208, 246, 343); must change to scan subdirectories and extract business code from directory name. (b) `s2-market-intelligence-handoff.ts` — update `${business}-${suffix}.user.md` (line 208) to `${business}/${suffix}.user.md` and fix error message (line 1136).
  4. Update 8 test files: change hardcoded flat paths to subdirectory paths. For template-based tests, update `${business}-<name>` to `${business}/<name>`. For `contract-lint.test.ts`, update literal `HEAD-2026-02-12assessment-intake-packet.user.md` to `HEAD/2026-02-12-assessment-intake-packet.user.md`.
  5. Update internal cross-references in moved content files (frontmatter `docs/business-os/startup-baselines/<BIZ>-name` → `<BIZ>/name`).
  6. Update HTML companion self-reference Source paths.
  7. Stage all changes and commit atomically.
- **Planning validation (required for M):**
  - Checks run: grep for flat-file pattern across scripts/, docs/, .claude/skills/; ls of startup-baselines directory; test file count verification
  - Validation artifacts: grep output confirming 5 source files, 8 test files, 20 flat files, 6 HTML files
  - Unexpected findings: Fact-find identified 1 test file; planning validation found 8. Content files have internal cross-references to other flat files.
- **Consumer tracing:**
  - No new values introduced — only path string changes in existing templates
  - Modified behavior: 5 source files change path construction from `${business}-name` to `${business}/name`
  - All consumers of these paths are the scripts themselves (construct paths to read/write files on disk)
  - Test files test these scripts and are updated in the same task — all consumers covered
  - `generate-build-summary.ts` scan pattern change: downstream consumers of scan results receive business names, not file paths — unaffected
  - `compile-website-content-packet.ts` writes `${business}/content-packet.md` (was `${business}-content-packet.md`). Downstream consumers (`materialize-site-content-payload.ts`, `lint-website-content-packet.ts`) updated in same task to read new path.
- **Scouts:** None: all paths confirmed via planning validation grep
- **Edge Cases & Hardening:**
  - Edge case: HTML companion files must move alongside .md counterparts. Handled by including all 6 HTML files in git mv list.
  - Edge case: Content files with internal cross-references to other flat files (e.g., HBAG-content-packet.md → HBAG-offer.md). Handled by updating internal references in step 5.
  - Edge case: `generate-build-summary.ts` does directory scanning and filename parsing to extract business codes. After move, business code comes from directory name, not filename prefix. Path parsing logic (lines 344-346) needs rewriting. Handled in step 3.
  - Edge case: `s2-market-intelligence-handoff.ts` has a user-facing error message (line 1136) with the flat pattern — must update error message text too.
  - Edge case: `lp-readiness` glob pattern `<BIZ>-*.md` in scripts — must update to scan subdirectory.
- **What would make this >=90%:**
  - Pre-push CI validation. Tests are CI-only per testing policy; confidence relies on comprehensive grep + typecheck instead.
- **Rollout / rollback:**
  - Rollout: Single commit on dev branch. Push and verify CI.
  - Rollback: `git revert <commit>` — all changes in one commit.
- **Documentation impact:**
  - Content files updated in-place (moved + internal references fixed)
  - External documentation changes handled by TASK-02
- **Notes / references:**
  - Precedent: scripts domain-dirs reorg (commit 390142607a, 66 files)

### TASK-02: Update skill documentation, registry, and business-os docs
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 77 documentation/config/skill files updated (scope expanded from ~23 during execution)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Build evidence:** 77 files updated via bulk sed replacements: 17 skill files (`<BIZ>-` → `<BIZ>/`), 60 docs files (literal `BRIK-`, `HBAG-`, `HEAD-`, `PET-` → slash separator + date-hyphen fix). Controlled scope expansion: plan estimated ~24 files, actual was 77 (more docs files referenced flat paths than identified during planning). Grep verification: 0 stale template patterns in skills, 0 stale literal patterns in active docs (only _archive/ and our own plan.md remain).
- **Affects:**
  - `.claude/skills/lp-offer/SKILL.md`
  - `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-channels/modules/channel-gtm-output.md`
  - `.claude/skills/lp-seo/modules/phase-base-contract.md`
  - `.claude/skills/lp-forecast/SKILL.md`
  - `.claude/skills/idea-forecast/SKILL.md`
  - `.claude/skills/lp-readiness/SKILL.md`
  - `.claude/skills/lp-other-products/SKILL.md`
  - `.claude/skills/lp-do-assessment-01-problem-statement/SKILL.md`
  - `.claude/skills/lp-do-assessment-08-current-situation/SKILL.md`
  - `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`
  - `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`
  - `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
  - `.claude/skills/startup-loop/modules/cmd-start.md`
  - `.claude/skills/startup-loop/modules/cmd-advance.md`
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md`
  - `.claude/skills/_shared/business-resolution.md`
  - `docs/registry.json`
  - `docs/business-os/startup-loop-workflow.user.md`
  - `docs/business-os/startup-loop-workflow.user.html`
  - `docs/business-os/startup-loop-output-registry.user.html`
  - `docs/business-os/strategy/BRIK/plan.user.md`
  - `docs/business-os/strategy/HEAD/assessment/s1-readiness.user.md`
  - `docs/business-os/strategy/HEAD/assessment/s1-readiness.user.html`
  - `docs/business-os/startup-loop/schemas/stage-result-schema.md`
  - `docs/plans/hbag-pdp-material-specs/plan.md`
  - `[skip] docs/plans/_archive/*` (dead code — no update)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% - Mechanical find-replace in markdown/HTML files. ~24 files to update. Planning validation confirmed exact file list via comprehensive grep. Evidence class: direct file verification.
  - Approach: 90% - Single approach: update documented path patterns from `<BIZ>-name` to `<BIZ>/name`. No alternatives. Evidence class: precedent.
  - Impact: 80% - Held-back test: no single unresolved unknown would drop this below 80 because skill docs use a consistent `<BIZ>-name` pattern, the update is mechanical find-replace, and agents tolerate minor path documentation inaccuracies (they resolve via filesystem). Evidence class: direct file verification + reasoning.
- **Acceptance:**
  - [ ] All ~16 skill files updated from `<BIZ>-name` to `<BIZ>/name` pattern
  - [ ] docs/registry.json entries updated to new paths
  - [ ] Business-os workflow/strategy docs updated
  - [ ] Grep for flat-pattern offer/channels/intake/forecast/content-packet references in skills returns empty
- **Validation contract (TC-XX):**
  - TC-01: `grep -r 'startup-baselines/.*-offer\.md' .claude/skills/` returns empty → no flat-pattern offer references
  - TC-02: `grep -r 'startup-baselines/.*-channels\.md' .claude/skills/` returns empty → no flat-pattern channel references
  - TC-03: `grep -r 'startup-baselines/.*-intake-packet' .claude/skills/` returns only `<BIZ>/<date>-assessment-intake-packet` pattern
  - TC-04: `grep -r 'startup-baselines/.*-forecast-seed' .claude/skills/` returns empty
  - TC-05: `grep -r 'startup-baselines/.*-content-packet' .claude/skills/` returns empty
  - TC-06: docs/registry.json contains no flat-pattern paths for startup-baselines entries
- **Execution plan:**
  1. Update all skill SKILL.md and module .md files: `<BIZ>-offer.md` → `<BIZ>/offer.md`, `<BIZ>-channels.md` → `<BIZ>/channels.md`, `<BIZ>-<YYYY-MM-DD>assessment-intake-packet` → `<BIZ>/<YYYY-MM-DD>-assessment-intake-packet`, `<BIZ>-forecast-seed` → `<BIZ>/forecast-seed`, `<BIZ>-content-packet` → `<BIZ>/content-packet`.
  2. Update docs/registry.json — change all startup-baselines flat-pattern entries to subdirectory pattern.
  3. Update business-os docs — same pattern in workflow docs, strategy docs, schema docs.
  4. Update active plan docs (hbag-pdp-material-specs/plan.md).
  5. Skip archived plans in docs/plans/_archive/ (no active consumers).
  6. Commit.
- **Planning validation (required for M):**
  - Checks run: grep for flat-file pattern across .claude/skills/ and docs/; exact file list enumerated
  - Validation artifacts: grep output confirming ~16 skill files + ~8 docs files
  - Unexpected findings: More docs files reference flat paths than fact-find identified (20 total, 7 active + 1 active plan, 12 archived)
- **Consumer tracing:**
  - No new values introduced — only documentation path pattern changes
  - Skill docs consumed by agents (LLMs reading markdown) — agents will use updated paths for file access
  - docs/registry.json consumed by registry lookup tools — updated entries resolve correctly
  - No code signatures or runtime behavior changes
- **Scouts:** None: all paths confirmed via planning validation grep
- **Edge Cases & Hardening:**
  - Edge case: Skill files using date patterns like `<YYYY-MM-DD>assessment-intake-packet` need hyphen fix too (→ `<YYYY-MM-DD>-assessment-intake-packet`)
  - Edge case: Some skill files reference both flat and subdirectory patterns (e.g., lp-forecast reads flat offer, writes to `<BIZ>/S3-forecast/`). After update, both become subdirectory.
  - Edge case: HTML files may have encoded paths — update inline HTML content alongside markdown.
- **What would make this >=90%:**
  - Automated regex replacement script instead of manual edits — reduces risk of missed occurrences.
- **Rollout / rollback:**
  - Rollout: Single commit on dev branch.
  - Rollback: `git revert <commit>`.
- **Documentation impact:**
  - Self-referential — this task IS the documentation update.
- **Notes / references:**
  - Archived plans in docs/plans/_archive/ intentionally skipped (dead code, historical record).

### TASK-03: Verify no stale references remain
- **Type:** IMPLEMENT
- **Deliverable:** code-change — verification report (pass/fail), fix any remaining stale references
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `[readonly] entire repository` (grep scan)
  - Any files with stale references found during verification
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - grep + typecheck are standard, well-understood verification tools. Evidence class: standard tooling.
  - Approach: 90% - Standard verification approach proven in prior reorgs (scripts domain-dirs). Evidence class: precedent.
  - Impact: 85% - Catches remaining stale references. Low residual risk after TASK-01 and TASK-02. Evidence class: reasoning.
- **Acceptance:**
  - [ ] Repo-wide grep for `startup-baselines/[A-Z]+-` in non-archived files returns empty
  - [ ] TypeScript compilation succeeds
  - [ ] All 20 flat files confirmed at new subdirectory locations
  - [ ] No flat files remain at startup-baselines root
- **Validation contract (TC-XX):**
  - TC-01a: Repo-wide grep for `startup-baselines/[A-Z]+-` in *.ts, *.md, *.json (excluding docs/plans/_archive/) returns empty → no literal flat-pattern references
  - TC-01b: Repo-wide grep for `startup-baselines/\${.*}-` in *.ts (excluding docs/plans/_archive/) returns empty → no template-string flat-pattern references
  - TC-02: TypeScript compilation (`pnpm typecheck`) passes
  - TC-03: `ls docs/business-os/startup-baselines/*.md 2>/dev/null` returns empty (no .md at root)
  - TC-04: `ls docs/business-os/startup-baselines/PET/` returns ≥5 files
  - TC-05: Existing subdirectory files untouched (BRIK/demand-evidence-pack.md, HBAG/demand-evidence-pack.md, HBAG/S3-forecast/, HEAD/S3-forecast/ still present)
- **Execution plan:**
  1. Run comprehensive grep for old flat-file pattern across entire repo (excluding docs/plans/_archive/).
  2. If any non-archived stale references found, fix them.
  3. Run `pnpm typecheck` to verify no TypeScript errors.
  4. Verify moved files exist at new locations.
  5. Verify no flat files remain at startup-baselines root.
  6. Verify existing subdirectory files untouched.
- **Planning validation:** None: S-effort verification task
- **Scouts:** None: verification task
- **Edge Cases & Hardening:**
  - Edge case: `_templates/` directory at startup-baselines root is legitimate — exclude from "no files at root" check.
  - Edge case: Existing subdirectory files (demand-evidence-pack.md, S3-forecast/) should remain untouched — verify presence.
- **What would make this >=90%:**
  - Running full CI test suite locally. Not possible per testing policy.
- **Rollout / rollback:**
  - Rollout: Fixes committed if stale references found; otherwise verification-only.
  - Rollback: N/A — verification task.
- **Documentation impact:** None.
- **Notes / references:**
  - Same verification approach used in scripts domain-dirs reorg.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Move files + update code/test refs | Yes | None — all source/test files identified via planning validation grep; file moves atomic with reference updates in single commit; no circular deps; all path templates use string interpolation (no config keys or env vars involved) | No |
| TASK-02: Update skill docs + registry + biz docs | Yes — TASK-01 completes first, files at new locations | None — all skill/doc files identified via grep; mechanical find-replace; no API signatures or type contracts involved | No |
| TASK-03: Verify no stale references | Yes — TASK-01 and TASK-02 complete, all changes landed | None — verification tooling (grep, typecheck) is standard; no precondition gaps | No |

## Risks & Mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Stale path in a source/test file not identified during planning | Medium | TASK-03 comprehensive grep catches any remaining references |
| 2 | generate-build-summary.ts scan logic more complex than simple string replacement | Medium | Inspect scan implementation during TASK-01 execution; fall back to simpler pattern if needed |
| 3 | Content-file internal cross-references missed | Low | TASK-03 grep covers content files too |
| 4 | lp-readiness glob pattern `<BIZ>-*.md` in source breaks | Medium | Update glob in TASK-01 to scan subdirectory: `<BIZ>/*.md` |

## Observability

None: filesystem reorganization with no runtime behavior changes.

## Acceptance Criteria (overall)
- [ ] Zero flat files remain at startup-baselines root (excluding _templates/)
- [ ] All 4 per-business subdirectories exist and contain expected files
- [ ] TypeScript compilation passes
- [ ] CI tests pass
- [ ] Comprehensive grep for old flat-file pattern returns empty (excluding archived plans)

## Decision Log
- 2026-03-03: Chose Option B (atomic code changes, separate doc changes) to prevent CI breakage between commits.
- 2026-03-03: Skip archived plan doc updates (docs/plans/_archive/) — dead code with no active consumers.

## Overall-confidence Calculation
- TASK-01: 85% x M(2) = 170
- TASK-02: 80% x M(2) = 160
- TASK-03: 85% x S(1) = 85
- Sum weights: 2+2+1 = 5
- Overall-confidence: 415/5 = 83%
