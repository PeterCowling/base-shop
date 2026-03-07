---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-ideas-dispatch-20260303-code-signals
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact)
Auto-Build-Intent: plan+auto
---

# BOS Ideas Dispatch 0155/0156 Plan

## Summary
Implement a code-signal bridge that converts critical bug-scan findings and structural git-diff signals into dispatch packets and appends them to queue-state, then wire it into post-build process-improvement generation.

## Active tasks
- [x] TASK-01: Implement bug-scan to dispatch bridge (`0155`)
- [x] TASK-02: Implement structural code-signal to dispatch bridge (`0156`)
- [x] TASK-03: Integrate bridge into post-build process-improvements flow
- [x] TASK-04: Add validation tests and registry admissions for synthetic artifacts

## Inherited Outcome Contract
- **Why:** Bug-scan and codebase evolution data are high-value but were not reaching the ideas queue.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Dispatch candidates are emitted automatically from critical code-quality and structural code-change signals.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-ideas-dispatch-20260303-code-signals/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bridge critical bug-scan artifact deltas into orchestrator events and queue dispatch appends | 88% | M | Complete (2026-03-03) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Bridge structural git-diff code signals into orchestrator events and queue dispatch appends | 84% | M | Complete (2026-03-03) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Wire bridge execution into `generate-process-improvements` post-build path | 84% | S | Complete (2026-03-03) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add tests + registry/t1 keyword updates for synthetic signal artifact admissions | 82% | S | Complete (2026-03-03) | TASK-03 | - |

## Acceptance Criteria (overall)
- [x] Critical bug-scan findings generate dispatch candidates through orchestrator path.
- [x] Structural code signals generate dispatch candidates through orchestrator path.
- [x] Queue-state receives new enqueued dispatches with dedupe against repeat runs.
- [x] Bridge is executed during process-improvements generation and reports run summary.
- [x] Tests cover first-run emission and repeat-run suppression behavior.
