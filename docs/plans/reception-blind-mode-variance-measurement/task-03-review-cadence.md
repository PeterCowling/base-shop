---
Type: Runbook
Status: Active
Domain: Platform
Last-updated: 2026-03-04
Feature-Slug: reception-blind-mode-variance-measurement
Task-ID: TASK-03
---

# TASK-03 Weekly Review Cadence and Threshold Actions

## Cadence
- Frequency: weekly (every Monday, covering prior full Italy week).
- Owner: Reception management owner on duty (or delegated manager).
- Input artifact: `blind-mode-variance-weekly.<week>.md/.json` from Task-02 generator.

## Threshold Actions

### Action A — Improvement on track
Trigger:
- `combined_abs_improvement_percent >= 10`

Action:
- Record status as `on-track`.
- Continue weekly monitoring with no process change.

### Action B — No meaningful improvement
Trigger:
- `0 <= combined_abs_improvement_percent < 10`

Action:
- Open a focused `/lp-do-fact-find` on discrepancy drivers (role, shift window, recount behavior).
- Add one operator coaching intervention and reassess next cycle.

### Action C — Regression
Trigger:
- `combined_abs_improvement_percent < 0`

Action:
- Escalate immediately to `/lp-do-fact-find` with priority P2.
- Require root-cause investigation before next planned UX/process change.

## Routing Contract
- Monitoring only: no dispatch needed when Action A triggers.
- Action B/C: create operator-idea dispatch with `recommended_route: lp-do-fact-find` and evidence link to the weekly artifact.

## Evidence Required Each Week
- Generated artifact path(s)
- Triggered action (A/B/C)
- Short note describing rationale and owner
