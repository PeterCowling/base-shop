---
Type: Build-Record
Status: Complete
Feature-Slug: ideas-queue-auto-executed-state-violation
Build-date: 2026-03-09
Dispatch-ID: IDEA-DISPATCH-20260309120000-QSTATE-001
artifact: build-record
Lane: micro-build
---

# Build Record — Ideas Queue auto_executed State Violation

## Summary

Reclassified 19 `auto_executed` queue entries in `trial/queue-state.json` to correct canonical states (all to `processed`, as none had `completed_by` blocks). Updated the counts block to `auto_executed: 0`, `processed: 19`. Hardened docs: added a guard note to the lp-do-ideas SKILL.md Outputs section and added `completed` as a terminal state to the trial contract Section 7 state machine.

## Changes Made

| File | Change |
|---|---|
| `docs/business-os/startup-loop/ideas/trial/queue-state.json` | Reclassified 19 `auto_executed` entries → `processed`; updated counts; stamped QSTATE-001 dispatch as `processed` |
| `.claude/skills/lp-do-ideas/SKILL.md` | Added guard note after canonical queue lifecycle values table |
| `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` | Added `processed → completed` to Section 7 state machine diagram and transitions list |
| `docs/plans/ideas-queue-auto-executed-state-violation/micro-build.md` | Created micro-build plan artifact |

## Outcome Contract

- **Why:** The trial contract's state machine defines only `enqueued`, `processed`, `skipped`, and `error` as valid queue lifecycle values. `auto_executed` was designed for Option C (auto-invoke P1 dispatches) which has not been activated. 19 entries were set incorrectly by hand, creating false signal in queue depth counts.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All `auto_executed` entries in `trial/queue-state.json` are reclassified to correct canonical states; the counts block reflects the corrected states; and the operator-facing contract/skill docs include an explicit guard against hand-setting `auto_executed` in trial mode.
- **Source:** operator
