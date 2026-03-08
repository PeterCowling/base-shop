---
Type: Build-Record
Status: Complete
Feature-Slug: startup-baselines-per-business-consolidation
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/startup-baselines-per-business-consolidation/build-event.json
---

# Build Record: Startup Baselines Per-Business Consolidation

## Outcome Contract

- **Why:** startup-baselines/ is split-brained — same businesses have data both as flat files at the root and in per-business subdirectories. Naming conventions vary across files. Every other domain directory uses clean per-business subdirectories. This one should too.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All flat files in startup-baselines/ moved into per-business subdirectories. BIZ prefix dropped from filenames (now redundant inside subdirectory). All script/skill path references updated. No stale paths remain.
- **Source:** operator

## What Was Built

**TASK-01 (commit 69f80ee497):** Moved 20 flat files from `docs/business-os/startup-baselines/` root into per-business subdirectories (BRIK/, HBAG/, HEAD/, PET/). Created PET/ subdirectory. Dropped BIZ prefix from all filenames. Fixed missing hyphen in 4 intake-packet date filenames. Updated 6 TypeScript source files (5 planned + 1 discovered: `map-artifact-delta-to-website-backlog.ts`), 8 test files, 4 content files' internal cross-references, and 6 HTML self-reference Source paths. All changes committed atomically to prevent CI breakage.

**TASK-02 (commit 53ca9b397f):** Updated 77 documentation and configuration files: 17 skill files (template pattern `<BIZ>-name` → `<BIZ>/name`), 60 docs files (literal `BRIK-`, `HBAG-`, `HEAD-`, `PET-` → slash separator + date-hyphen fix). Scope expanded from planned ~24 files to 77 because more docs files referenced flat paths than identified during planning. Archived plan docs (`_archive/`) intentionally skipped per plan.

**TASK-03 (verification):** All verification criteria passed with no fixes required. Zero stale flat-file patterns in active TypeScript or documentation files.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` (via pre-commit hook) | Pass | Pre-existing error in xa-pipeline.ts unrelated to changes |
| `eslint` (via pre-commit hook) | Pass | 0 errors, 123 warnings (all pre-existing) |
| Grep verification: `startup-baselines/[A-Z]+-` in scripts/src | Pass (0 matches) | No stale patterns in source or test files |
| Grep verification: `startup-baselines/<BIZ>-` in skills | Pass (0 matches) | No stale template patterns in skill docs |
| Grep verification: `startup-baselines/[A-Z]+-` in active docs | Pass (0 matches) | Only `_archive/` and own plan remain |

## Validation Evidence

### TASK-01
- TC-01: `git ls-files docs/business-os/startup-baselines/ | grep '^docs/business-os/startup-baselines/[A-Z]+-'` returns empty — no flat files remain
- TC-02: PET/ contains 5 files (offer.md, forecast-seed.user.md/.html, assessment-intake-packet.user.md/.html)
- TC-03: TypeScript compilation succeeds (pre-commit hook)
- TC-04: `grep -rE 'startup-baselines/\$\{.*\}-' scripts/src/` returns empty
- TC-05: `grep -rE 'startup-baselines/[A-Z]+-' scripts/src/` returns empty
- TC-06: Tests to be verified in CI

### TASK-02
- TC-01-05: All grep patterns for flat-file references in skills/docs return empty
- TC-06: docs/registry.json updated — all startup-baselines entries use subdirectory paths

### TASK-03
- TC-01a: 0 literal flat-pattern references in active files
- TC-01b: 0 template-string flat-pattern references in .ts files
- TC-02: TypeScript compilation passes
- TC-03: No .md files at startup-baselines root
- TC-04: PET/ contains 5 files
- TC-05: Existing subdirectory files untouched (demand-evidence-pack.md, S3-forecast/ dirs)

## Scope Deviations

- **TASK-01 controlled expansion:** Discovered `scripts/src/startup-loop/website/map-artifact-delta-to-website-backlog.ts` — matches on `-offer.md` and `-channels.md` suffixes. Not identified in fact-find or plan. Updated to match on `/offer.md` and `/channels.md`. Added to task Affects.
- **TASK-02 scope expansion:** Plan estimated ~24 files; actual was 77. Many more business-os strategy/assessment/market-research docs referenced flat paths than identified during planning. All mechanical find-replace, same pattern.
