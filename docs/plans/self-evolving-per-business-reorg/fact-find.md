---
Type: Fact-Find
Outcome: Planning
Status: Infeasible
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: self-evolving-per-business-reorg
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/self-evolving-per-business-reorg/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
Dispatch-ID: IDEA-DISPATCH-20260303120000-0130
---

# Self-Evolving Per-Business Reorg — Fact-Find Brief

## Scope

### Summary

Dispatch proposed restructuring `self-evolving/` from per-type directories to per-business directories. Investigation reveals **this work was already completed** by an earlier build (commit `2e0acb1d59`, archived at `docs/plans/_archive/self-evolving-per-business-reorg/`). The intended outcome is fully met.

The only remaining artifact is 6 empty scaffold directories (`events/`, `observations/`, `candidates/`, `backbone-queue/`, `startup-state/`, `reports/`) left behind after the migration. These contain zero files and zero code references them.

### Goals

- Delete 6 empty per-type scaffold directories from `self-evolving/`

### Non-goals

- Restructuring data paths (already done)
- Updating script path references (already done)
- Relocating schemas (already done — schemas/ exists)

### Constraints & Assumptions

- Constraints: None — the work is trivial
- Assumptions: None

## Outcome Contract

- **Why:** self-evolving/ organises data by type not by business. Finding all data for one business requires checking 6 directories. This inverted structure makes per-business archival, debugging, and scaling painful.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** self-evolving/ restructured to per-business directories (BRIK/, SIMC/) with schemas in schemas/ subdirectory. All 17 self-evolving-*.ts file references updated. Tests pass.
- **Source:** operator

## Kill Rationale

Intended outcome already achieved by archived plan `docs/plans/_archive/self-evolving-per-business-reorg/` (commit `2e0acb1d59`, results-review verdict: Met). The 6 empty scaffold directories are a trivial `rmdir` cleanup, not pipeline-worthy work.

## Evidence Audit (Current State)

### Completed work (from archived plan)

- **Commit `2e0acb1d59`**: `refactor(self-evolving): restructure to per-business directories`
- All data moved to `BRIK/` and `SIMC/` per-business directories
- All 5 path constants updated in TypeScript source files
- All CLI defaults updated to per-business pattern
- Schemas relocated to `schemas/` subdirectory
- README.md updated to document per-business structure
- Typecheck, lint, and comprehensive grep verification passed

### Remaining artifact (trivial)

6 empty directories at `docs/business-os/startup-loop/self-evolving/`:
- `backbone-queue/` (0 files)
- `candidates/` (0 files)
- `events/` (0 files)
- `observations/` (0 files)
- `reports/` (0 files)
- `startup-state/` (0 files)

**Code references to these directories:** Zero. Confirmed by grep across all TypeScript, test, skill, and documentation files.

### Recommended action

Delete the 6 empty directories directly:
```bash
rmdir docs/business-os/startup-loop/self-evolving/{backbone-queue,candidates,events,observations,reports,startup-state}
```

## Access Declarations

None.
