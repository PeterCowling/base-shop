---
Status: Complete
Feature-Slug: self-evolving-per-business-reorg
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/self-evolving-per-business-reorg/build-event.json
---

# Self-Evolving Per-Business Reorg — Build Record

## What Was Built

Restructured `docs/business-os/startup-loop/self-evolving/` from type-based subdirectories to per-business directories. The old structure organised files by data type (candidates/, events/, observations/, startup-state/, backbone-queue/, reports/), requiring operators to check 6 directories to find all data for one business. The new structure groups all data by business (BRIK/, SIMC/) with schemas in a shared schemas/ directory.

15 data files and 4 schema files were moved via git mv. 5 TypeScript path constants (CANDIDATE_ROOT, EVENTS_ROOT, OBSERVATIONS_ROOT, STATE_ROOT, BACKBONE_QUEUE_ROOT) were replaced with per-module SELF_EVOLVING_ROOT constants, and all resolve functions updated from `path.join(ROOT_WITH_TYPE, businessId + ext)` to `path.join(SELF_EVOLVING_ROOT, businessId, filename)`. 2 CLI default paths, 4 schema $id values, and 6 embedded paths in report/artifact JSONs were updated. README.md was rewritten with the new directory tree.

## Tests Run

- `pnpm typecheck` — passed (pre-existing xa error only, not introduced by this build)
- `pnpm lint` — passed (0 errors, pre-existing warnings only)
- Comprehensive grep for stale type-directory paths — only plan/fact-find documentation references found (describing old→new changes, not live references)

## Validation Evidence

- **TC-01 (TASK-01):** `ls BRIK/` shows 5 data files + reports/ subdir. `ls SIMC/` shows 4 data files. `ls schemas/` shows 4 schema files. Old type dirs empty.
- **TC-02 (TASK-02):** Old ROOT constants eliminated. All resolve functions use new per-business pattern. Typecheck passes.
- **TC-03 (TASK-03):** `grep '$id' schemas/*.schema.json` shows all point to `self-evolving/schemas/`. No old type-dir paths in data/report files.
- **TC-04 (TASK-04):** Typecheck + lint + comprehensive grep all pass. Zero stale type-directory paths in code or data.

## Scope Deviations

None.

## Outcome Contract

- **Why:** self-evolving/ organises data by type (events/, observations/, candidates/) not by business. Finding all BRIK data requires checking 6 directories. Schemas mixed with data directories.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** self-evolving/ restructured to per-business directories (BRIK/, SIMC/) with schemas in schemas/. All self-evolving-*.ts path references updated.
- **Source:** operator
