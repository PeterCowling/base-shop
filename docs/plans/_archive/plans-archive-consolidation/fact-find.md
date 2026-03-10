---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: plans-archive-consolidation
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/plans-archive-consolidation/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260303120000-0134
Trigger-Why: Two archive systems create confusion about where completed plans go. 213 loose files + 27 subdirectories in archive/ alongside 111 structured directories in _archive/. Demo files in _tmp/ pollute version control.
Trigger-Intended-Outcome: "type: operational | statement: Single clear archive system. archive/ contents audited and either deleted or migrated. _tmp/ cleaned or gitignored. | source: operator"
---

# Plans Archive Consolidation — Fact-Find Brief

## Scope

### Summary

`docs/plans/` has two archive systems (`_archive/` with 111 structured plan directories and `archive/` with 213 loose .md files + 27 subdirectories) plus a `_tmp/` directory with 3 demo files checked into version control. This fact-find assesses the current state, determines what in `archive/` is redundant vs unique, identifies code references that need updating, and scopes the consolidation work.

### Goals

- Determine whether all `archive/` content is superseded by `_archive/` entries or contains unique historical plans
- Identify all code references to `archive/` that need updating
- Scope the cleanup of `_tmp/` demo files
- Define a single authoritative archive system going forward

### Non-goals

- Building an automatic archive retention/pruning policy (identified as adjacent-later scope)
- Restructuring `_archive/` directory format (already well-structured)
- Migrating any archive content to a different storage system

### Constraints & Assumptions

- Constraints:
  - 9 TypeScript files reference `docs/plans/archive/` paths (2 linting exemptions + 3 runtime JSDoc comments + 4 test JSDoc comments)
  - `archive/` has 27 subdirectories with structured content (fact-find + plan pairs) alongside 213 loose .md files
  - `archive/` subdirectories use the same format as `_archive/` (fact-find.md, plan.md) — they predate the `_archive/` convention
  - Only 1 slug overlap between `archive/` loose files and `_archive/` directories (`prime-hardcoded-copy-i18n-remediation`)
- Assumptions:
  - The `archive/` content is all historical reference — no active plans reference it as input
  - `_archive/` is the canonical archive system; `archive/` is a legacy predecessor

## Outcome Contract

- **Why:** Two archive systems create confusion about where completed plans go. 213 loose files + 27 subdirectories in archive/ alongside 111 structured directories in _archive/. Demo files in _tmp/ pollute version control.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single clear archive system. archive/ contents audited and either deleted or migrated. _tmp/ cleaned or gitignored.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `docs/plans/` — root directory containing active plans, `_archive/`, `archive/`, `_tmp/`, and `_templates/`

### Key Modules / Files

- `docs/plans/_archive/` — 111 structured plan directories (canonical archive)
- `docs/plans/archive/` — 213 loose .md files + 27 subdirectories (291 total files including files inside subdirectories)
- `docs/plans/_tmp/` — 3 CASS demo files (checked into git)
- `scripts/src/docs-lint.ts` line 121 — `isArchivedPlanDoc()` exempts both `_archive/` and `archive/`
- `scripts/src/plans-lint.ts` line 179 — `LOCAL_JEST_PATTERN_EXEMPTIONS` includes both `_archive/` and `archive/`
- `scripts/src/startup-loop/learning-compiler.ts` line 8 — JSDoc references `docs/plans/archive/learning-compiler-plan.md`
- `scripts/src/startup-loop/baseline-priors.ts` line 8 — JSDoc references `docs/plans/archive/learning-compiler-plan.md`
- `scripts/src/startup-loop/s10-learning-hook.ts` line 7 — JSDoc references `docs/plans/archive/learning-compiler-plan.md`

### Patterns & Conventions Observed

- **Two archive eras:** `archive/` predates `_archive/`. The `_archive/` convention was introduced later and is now the standard. All recent plan completions archive to `_archive/`.
- **archive/ subdirectories are structured:** 27 of the `archive/` entries are subdirectories with fact-find.md + plan.md pairs — same format as `_archive/`. These can be moved directly.
- **archive/ loose files are flat:** 213 loose .md files with names like `<slug>-plan.md` or `<slug>-fact-find.md` — the pre-directory era format.
- **Minimal overlap:** Only 1 slug overlap between systems (`prime-hardcoded-copy-i18n-remediation`).
- **Code references are documentation-only:** All 9 TypeScript references to `archive/` are either linting exemptions (which also cover `_archive/`) or JSDoc comments pointing to the origin plan for a feature. No runtime imports.
- **_tmp/ is unreferenced:** Only mentioned in queue-state.json dispatch description. No code imports or references.

### Dependency & Impact Map

- Upstream dependencies: None — all `archive/` content is historical/completed
- Downstream dependents:
  - `docs-lint.ts` and `plans-lint.ts` — linting exemptions for `archive/` (will need updating or removing after migration)
  - 3 JSDoc comments in learning-compiler/baseline-priors/s10-learning-hook .ts files reference `archive/learning-compiler-plan.md`
  - 4 JSDoc comments in test files for learning-compiler/baseline-priors/s10-learning-hook reference `archive/learning-compiler-plan.md`
- Likely blast radius:
  - Moving archive/ subdirectories to _archive/: Git file moves + 2 lint file updates
  - Deleting archive/ loose files: Git delete (files are historical reference only, recoverable from git history)
  - Cleaning _tmp/: Git delete (3 files, no code references)
  - JSDoc comment updates: 7 .ts files (3 runtime + 4 test), documentation-only changes

### Delivery & Channel Landscape

- Audience/recipient: Internal engineering team / agents
- Channel constraints: None — all artifacts are repo-local
- Approvals/owners: None — decision resolved: structured subdirs migrate to _archive/, loose files deleted (recoverable from git history)
- Compliance constraints: None
- Measurement hooks: None — operational improvement

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | archive/ subdirectories can be moved to _archive/ without conflicts | Confirming no name collisions | Low — ls comparison | Done |
| H2 | archive/ loose files are safe to delete (superseded or purely historical) | Confirming no active references | Low — grep search | Done |
| H3 | _tmp/ demo files can be deleted without breaking anything | Confirming no code imports | Low — grep search | Done |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | No directory name collisions between archive/ subdirs and _archive/ | ls + comparison | 95% |
| H2 | No code imports from archive/ loose files; only JSDoc references and lint exemptions | grep across codebase | 90% |
| H3 | _tmp/ files referenced only in queue-state.json dispatch description | grep across codebase | 95% |

### Recent Git History (Targeted)

Not investigated: Archive files are historical completed plans with no recent changes relevant to this scope.

## Access Declarations

None — all artifacts are repo-local.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| archive/ subdirectory contents | Yes | None | No |
| archive/ loose file usage | Yes | None | No |
| _archive/ name collision check | Yes | None | No |
| Code references to archive/ | Yes | None — all are JSDoc/lint, not runtime | No |
| _tmp/ file references | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three discrete tasks (move subdirectories, handle loose files, clean _tmp/) are well-bounded with clear evidence. Code references are limited to JSDoc comments and lint exemptions — no functional changes needed. All content is historical/completed with no active downstream consumers.

## Questions

### Resolved

- Q: Are any archive/ files still actively referenced by running code?
  - A: No — only JSDoc comments (documentation) and linting exemptions. No runtime imports or dynamic path resolution.
  - Evidence: `grep` for `docs/plans/archive/` across all `.ts` files shows only JSDoc and lint exemption matches.

- Q: Do archive/ subdirectories overlap with _archive/ directories?
  - A: No directory-level overlap. Only 1 loose-file slug overlaps (`prime-hardcoded-copy-i18n-remediation`).
  - Evidence: `ls` comparison of both directories.

- Q: Can _tmp/ files be safely deleted?
  - A: Yes — no code references. Only mentioned in a queue-state dispatch description (informational context).
  - Evidence: `grep` for `docs/plans/_tmp/` returns only queue-state.json.

- Q: Should archive/ loose files be migrated to _archive/ or deleted?
  - A: The 27 subdirectories should be moved to `_archive/` (they have the same structured format). The 213 loose .md files represent pre-directory-era archives and are safe to delete — all content is recoverable from git history if ever needed. No active code or plans reference these files.
  - Evidence: archive/ subdirectories contain fact-find.md + plan.md pairs identical in format to _archive/. Loose files are single-file exports from before the structured archive convention.

### Open (Operator Input Required)

None — all questions resolved from evidence.

## Confidence Inputs

- Implementation: 90% — straightforward file moves and deletes; all paths mapped
  - To reach >=90: already there
- Approach: 90% — clear pattern (move structured dirs, handle loose files, clean _tmp/)
  - To reach >=90: already there
- Impact: 90% — low-risk file reorganisation; JSDoc + lint updates only
  - To reach >=90: already there
- Delivery-Readiness: 90% — all inputs available, no external dependencies
  - To reach >=90: already there

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Learning-compiler JSDoc references break after archive/ removal | Low | Low | Update 7 JSDoc comments (3 runtime + 4 test) to new paths |
| archive/ files needed for future reference | Very Low | Low | All content in git history; recoverable |
| Lint exemptions become stale after archive/ removal | Low | Low | Update or remove archive/ entries in docs-lint.ts and plans-lint.ts |

## Planning Constraints & Notes

- Must-follow patterns:
  - Move archive/ subdirectories (27) to _archive/ — they have the same format
  - Update JSDoc comments in 7 .ts files (3 runtime + 4 test) after moves
  - Update lint exemptions in docs-lint.ts and plans-lint.ts
  - Delete _tmp/ demo files
- Rollout/rollback expectations:
  - Fully reversible file moves/deletes; no code behaviour change
- Observability expectations:
  - None — operational doc improvement

## Suggested Task Seeds (Non-binding)

1. Move archive/ subdirectories to _archive/, handle loose files (delete or move to _legacy-archive/), update lint exemptions
2. Update JSDoc comments in 7 .ts files (3 runtime + 4 test) to reference new archive paths
3. Delete _tmp/ demo files

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: single _archive/ system, archive/ removed or renamed, _tmp/ cleaned, lint/JSDoc references updated
- Post-delivery measurement plan: None — operational improvement

## Evidence Gap Review

### Gaps Addressed

- Confirmed archive/ content is all historical (no active references)
- Confirmed no directory name collisions between archive/ subdirs and _archive/
- Confirmed _tmp/ files have no code dependencies

### Confidence Adjustments

- No adjustments needed — initial confidence inputs match evidence

### Remaining Assumptions

- archive/ loose files are not needed beyond git history (mitigated by git recovery)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan plans-archive-consolidation --auto`
