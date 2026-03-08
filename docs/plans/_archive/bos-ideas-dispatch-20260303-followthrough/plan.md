---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-ideas-dispatch-20260303-followthrough
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BOS Ideas Dispatch 2026-03-03 Followthrough Plan

## Summary
This plan executes the four queued BOS idea dispatches from 2026-03-03 as one bounded loop-closure package. It expands standing registry domain coverage, wires a deterministic lp-do-build post-commit ideas hook utility, activates first-pass self-evolving input from build artifacts, and ships a safe queue-state canonicalization utility plus migration spec. Changes stay in scripts/docs paths and are additive-first.

## Active tasks
- [x] TASK-01: Register non-assessment standing artifacts
- [x] TASK-02: Add lp-do-build post-commit ideas hook utility
- [x] TASK-03: Add self-evolving build-output bridge
- [x] TASK-04: Add queue-state canonicalization utility + migration spec

## Goals
- Close structural feedback gaps in ideas ingestion across domains and build outputs.
- Keep runtime safety posture advisory/fail-open for new hooks.
- Provide deterministic migration path for queue-state convergence.

## Non-goals
- Switching production queue-state writer to canonical format in this cycle.

## Inherited Outcome Contract
- **Why:** These dispatches identify missing links in loop-level learning and dispatch generation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Build and document loop-closure utilities that make non-assessment changes and build outputs visible to ideas and self-evolving pipelines while preserving queue data integrity.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-ideas-dispatch-20260303-followthrough/fact-find.md`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Register MARKET/SELL/PRODUCTS/LOGISTICS artifacts in standing registry | 88% | S | Complete (2026-03-03) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add deterministic post-commit ideas hook utility for lp-do-build | 84% | M | Complete (2026-03-03) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add self-evolving build-output observation bridge utility | 82% | M | Complete (2026-03-03) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add queue-state canonicalization utility and migration spec | 82% | M | Complete (2026-03-03) | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Expand registry coverage first to widen event eligibility. |
| 2 | TASK-02 | TASK-01 | Build hook utility depends on registry shape. |
| 3 | TASK-03 | TASK-02 | Self-evolving bridge added after post-commit hook tooling lands. |
| 4 | TASK-04 | TASK-03 | Canonicalization utility and migration documentation finalize package. |

## Risks & Mitigations
- Risk: queue migration data-loss.
  - Mitigation: dry-run default, schema validation, explicit mapping spec.
- Risk: hook integration ambiguity with skill-driven flow.
  - Mitigation: ship utility CLI with explicit arguments and JSON summary output.

## Acceptance Criteria (overall)
- [x] Registry includes non-assessment domain artifacts.
- [x] New post-commit hook utility can compute events from commit diff and run advisory hook.
- [x] New self-evolving bridge can parse build artifacts and write observations via orchestrator.
- [x] Queue-state migration utility and spec are present for controlled cutover.

## Build Evidence

### TASK-01: Register non-assessment standing artifacts
- **Status:** Complete (2026-03-04, expanded from initial thin coverage)
- **Deliverable:** `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Evidence:** Registry expanded from 15 ASSESSMENT-only entries to 34 total:
  - 15 ASSESSMENT entries (original, unchanged)
  - 8 SELL entries: BRIK weekly KPCs + funnel brief + Octorate baseline, BOS CASS scorecard, HEAD weekly KPCs + 90-day forecast, PET weekly KPCs + 90-day forecast
  - 5 PRODUCTS entries: BRIK product spec, HBAG aggregate pack + line mapping + supplier spec
  - 3 MARKET entries: HBAG site builder prompt + website throughput, HEAD messaging hierarchy
  - 1 LOGISTICS entry: HBAG logistics pack
  - 3 BOS synthetic entries (inactive — pending dispatch 0155/0156/0157 bridges): bug scan findings, codebase structural signals, agent session findings
- **Quality fix (2026-03-04):** Initial implementation had only 1 entry per domain (token coverage). Expanded to comprehensive coverage of actual standing artifacts across businesses. Synthetic entries set `active: false` since target files don't exist yet.

### TASK-02: Add lp-do-build post-commit ideas hook utility
- **Status:** Complete (2026-03-03)
- **Deliverable:** `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts` (229 lines)
- **Script entry:** `startup-loop:lp-do-ideas-build-commit-hook` in `scripts/package.json`
- **Evidence:** CLI utility that parses `--business`, `--from-ref`, `--to-ref` arguments, runs `git diff --name-only` between refs, matches changed files against standing registry entries, calls `runLiveHook()` with artifact delta events. Returns JSON summary with event_count, matched_artifacts, dispatched_count. Advisory/fail-open by design.

### TASK-03: Add self-evolving build-output bridge
- **Status:** Complete (2026-03-03)
- **Deliverable:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` (287 lines)
- **Script entry:** `startup-loop:self-evolving-from-build-output` in `scripts/package.json`
- **Evidence:** Bridge reads build-record, results-review, and pattern-reflection artifacts. Extracts "New Idea Candidates" bullets. Builds MetaObservation records with proper schema (hard_signature, stable hashes). Feeds into self-evolving orchestrator. Graceful error handling when startup-state.json is missing.

### TASK-04: Add queue-state canonicalization utility + migration spec
- **Status:** Complete (2026-03-03)
- **Deliverable:** `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-canonicalize.ts` (222 lines)
- **Spec:** `docs/plans/bos-ideas-dispatch-20260303-followthrough/artifacts/queue-state-canonicalization-spec.md`
- **Script entry:** `startup-loop:queue-state-canonicalize` in `scripts/package.json`
- **Evidence:** Handles both legacy `dispatches[]` and canonical `entries[]` formats. State mapping: enqueued→enqueued, processed/completed/auto_executed→processed, skipped→skipped, unknown→error. Dry-run default (--write flag for output). Outputs to sidecar path, never overwrites live queue file.

## Decision Log
- 2026-03-03: Combined four dispatches into one implementation slug to keep cross-cutting utilities coherent and avoid duplicated integration work.
- 2026-03-04: TASK-01 quality fix — expanded registry from token coverage (1 entry per domain) to comprehensive standing artifact coverage (12 new entries across SELL/PRODUCTS/MARKET). Set synthetic BOS entries inactive until their automation bridges are built.
