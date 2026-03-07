---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-ideas-dispatch-20260303-agent-session-signals
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact)
Auto-Build-Intent: plan+auto
---

# BOS Ideas Dispatch 0157 Plan

## Summary
Implement a deterministic bridge that converts agent walkthrough/testing session findings (from transcript JSONL) into synthetic artifact deltas and enqueued ideas dispatches, with registry admission and dedupe safeguards.

## Active tasks
- [x] TASK-01: Implement transcript-to-session-findings bridge (`0157` core)
- [x] TASK-02: Register synthetic artifact + semantic keywords for routing
- [x] TASK-03: Add bridge command wiring and tests

## Inherited Outcome Contract
- **Why:** Agent-session findings are currently lost after sessions, preventing loop learning from frequent issue discovery.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Agent-session findings are captured deterministically and routed into ideas trial queue as deduplicated dispatch candidates.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-ideas-dispatch-20260303-agent-session-signals/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `lp-do-ideas-agent-session-bridge` to parse transcripts, persist synthetic findings artifact, emit artifact delta event, and append deduped dispatches | 86% | M | Complete (2026-03-03) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Extend standing registry + T1 semantic keywords for `BOS-BOS-AGENT_SESSION_FINDINGS` routing eligibility | 88% | S | Complete (2026-03-03) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Wire package command + add bridge tests for emission and repeat suppression | 84% | S | Complete (2026-03-03) | TASK-01, TASK-02 | - |

## Acceptance Criteria (overall)
- [x] Agent-session bridge scans transcript files and extracts bounded finding candidates.
- [x] Bridge writes `agent-session-findings.latest.json` and emits dispatch candidates via trial orchestrator.
- [x] Bridge dedupes repeat runs using persisted findings hash state.
- [x] Standing registry includes active `BOS-BOS-AGENT_SESSION_FINDINGS` source artifact.
- [x] Tests verify first-run dispatch emission and second-run suppression.
