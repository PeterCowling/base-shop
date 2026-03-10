---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-reviewed: 2026-03-10
Last-updated: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-results-review-historical-carryover
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Results-Review Historical Carry-Over Plan

## Summary

The queue-unification thread fixed the live backlog path. What remains is a bounded historical cutover: normalize the archived legacy build-review ideas, discard the superseded ones explicitly, and carry only the worthwhile unresolved items into the canonical queue with historical provenance.

This plan is deliberately separate because archive carry-over is manual and audit-heavy. It must not reintroduce archive reads into the live backlog path.

## Active tasks

- [ ] TASK-01: Define the historical carry-over manifest and provenance contract
- [ ] TASK-02: Build the audited historical carry-over manifest for the 12 thematic candidates
- [ ] TASK-03: Admit the worthwhile unresolved historical candidates into the canonical queue
- [ ] TASK-04: Record discard rationale for non-carried candidates and verify queue-only canonicality remains intact

## Goals

- Carry the worthwhile historical backlog into the canonical queue.
- Preserve explicit provenance for backfilled items.
- Leave the live backlog path queue-only.
- Keep the discard set auditable.

## Non-goals

- Reintroducing direct archive reads into `process-improvements`.
- General rework of build-origin signal emission for active plans.
- Expanding beyond the `12` thematic candidates already identified by the audit.

## Fact-Find Reference

- Related brief: [fact-find.md](/Users/petercowling/base-shop/docs/plans/startup-loop-results-review-historical-carryover/fact-find.md)
- Upstream audit: [historical-carryover-audit.md](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Define the historical carry-over manifest and provenance contract | 80% | S | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Build the audited historical carry-over manifest for the 12 thematic candidates | 80% | M | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Admit the worthwhile unresolved historical candidates into the canonical queue | 75% | M | Pending | TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Record discard rationale and verify queue-only canonicality remains intact | 95% | S | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock the historical provenance contract first |
| 2 | TASK-02 | TASK-01 | Build the audited manifest before mutating queue state |
| 3 | TASK-03 | TASK-02 | Carry only the worthwhile unresolved set into queue |
| 4 | TASK-04 | TASK-03 | Verify discards are explicit and live canonicality still holds |

## What would make this >=90%

- A deterministic manifest helper that preloads all 12 normalized candidates with source paths.
- A draft queue-packet shape for historical carry-over provenance.
- A dry-run showing exactly how many queue admissions TASK-03 would write.
