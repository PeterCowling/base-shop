---
Type: Critique-History
Plan: docs/plans/startup-loop-root-containers/plan.md
Feature-Slug: startup-loop-root-containers
---

# Critique History

## Round 1 (codemoot route)

- **Score:** 6/10 (lp_score 3.0)
- **Verdict:** needs_revision
- **Findings:**
  - CRITICAL: loop-spec.yaml code refs undercounted — missing `scripts/check-startup-loop-contracts.sh` reference (also `stage-operator-dictionary.yaml`, `autonomy-policy.md`, `event-state-schema.md`, `manifest-schema.md`, `stage-result-schema.md`, `contract-migration.yaml`)
  - MAJOR: Skill reference inventory incomplete — missing potential refs in lp-do-plan and other skill modules
  - MAJOR: "All skill references identified" confidence statement overstated
  - MINOR: `_deprecated/` labeled "2 files" but tree shows 3 entries (README + 2 deprecated files)
  - MINOR: "Open Questions: None" conflicts with partial registry.json coverage noted in simulation trace

### Fixes Applied
- Added CI script references section with `check-startup-loop-contracts.sh` (7 path references)
- Updated loop-spec.yaml, autonomy-policy.md, stage-operator-dictionary.yaml code ref counts to include CI script
- Fixed `_deprecated/` count to "3 files (README + 2 deprecated)"
- Updated risk #2 to mention CI script reference
- Changed "All skill references identified" to specific count "8 skills (11 path references)"
- Changed Open Questions to show resolved registry question
- Added CI script row to simulation trace
- Updated summary count from "30+" to "40+"

## Plan Critique — Round 1 (codemoot route)

- **Score:** 5/10 (lp_score 2.5)
- **Verdict:** needs_revision
- **Findings:**
  - MAJOR: File count "31" incorrect — should be 34 (36 minus 2 registries at root)
  - MAJOR: CI script path references undercounted as "7" — actual count is 10 occurrences
  - MAJOR: TASK-06 title says "test pass" but tests run in CI only
  - MAJOR: Verification uses full-repo `pnpm typecheck` instead of scoped validation
  - MAJOR: Missing skill references in queue-check-gate.md and cmd-advance.md (partially invalid — queue-check-gate references `ideas/trial/` subdirectory not root; cmd-advance has no matching references)
  - MINOR: TASK-06 marks Affects as [readonly] but execution plan says "fix any new failures"

### Fixes Applied
- Fixed file count from "31" to "32 to containers + 2 to _deprecated (34 total)" throughout
- Updated CI script reference count from "7" to "10 path occurrences across 7 unique files"
- Renamed TASK-06 from "typecheck and test pass" to "typecheck and lint"; added CI push for test gating
- Removed [readonly] from TASK-06 Affects (may need to fix stale refs)
- Added comprehensive grep edge case to TASK-05 for catching references not enumerated in fact-find
- Noted queue-check-gate.md references ideas/trial/ (not root) — no update needed
- Updated simulation trace notes for TASK-03 and TASK-06

## Plan Critique — Round 2 (codemoot route)

- **Score:** 8/10 (lp_score 4.0)
- **Verdict:** needs_revision (but score is credible at ≥4.0)
- **Findings:**
  - MAJOR: TASK-06 claims "scoped validation" but still specifies `pnpm typecheck`/`pnpm lint` (full-repo); should use `pnpm --filter <pkg>` per repo policy

### Fixes Applied
- Changed TASK-06 validation contract and execution plan to use `pnpm --filter scripts typecheck` and `pnpm --filter business-os typecheck` (scoped)
- Updated acceptance criteria to say "affected packages" not full-repo

**Final verdict: credible (lp_score 4.0). No Critical findings. Auto-build eligible.**
