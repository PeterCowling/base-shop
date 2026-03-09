---
Type: Micro-Build
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: ideas-queue-auto-executed-state-violation
Execution-Track: mixed
Deliverable-Type: multi-deliverable
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309120000-QSTATE-001
Related-Plan: none
---

# Ideas Queue auto_executed State Violation Micro-Build

## Scope
- Change: Reclassify all 19 `auto_executed` queue entries in `trial/queue-state.json` to correct canonical states (`completed` or `processed`); update the counts block; add a guard note to the lp-do-ideas SKILL.md Outputs section; add `completed` as a terminal state to trial contract Section 7.
- Non-goals: Migrating the hand-authored queue to the TS persistence format; fixing the noise stub pollution (separate dispatch QSTATE-002); changing any runtime behaviour.

## Execution Contract
- Affects: `docs/business-os/startup-loop/ideas/trial/queue-state.json`, `.claude/skills/lp-do-ideas/SKILL.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- Acceptance checks:
  - No entry in queue-state.json carries `queue_state: "auto_executed"`
  - Counts block: `auto_executed: 0`; `completed` and `processed` increased by reclassified amounts
  - SKILL.md Outputs section contains guard note about `auto_executed` being reserved in trial mode
  - Trial contract Section 7 state machine includes `processed → completed` transition
- Validation commands:
  - `pnpm --filter scripts typecheck`
- Rollback note: git revert the commit; all changes are in JSON/Markdown files.

## Outcome Contract
- **Why:** The trial contract's state machine defines only `enqueued`, `processed`, `skipped`, and `error` as valid queue lifecycle values. `auto_executed` was designed for Option C (auto-invoke P1 dispatches) which has not been activated. Because the queue is entirely hand-authored, these 19 entries were set incorrectly by hand. They create false signal in queue depth counts and make it impossible to tell which entries represent work that was genuinely reviewed and confirmed vs. work that bypassed the confirmation step.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All `auto_executed` entries in `trial/queue-state.json` are reclassified to correct canonical states; the counts block reflects the corrected states; and the operator-facing contract/skill docs include an explicit guard against hand-setting `auto_executed` in trial mode.
- **Source:** operator

## Tasks

### Task 1 — Reclassify auto_executed entries in queue-state.json
- Find all 19 `auto_executed` entries
- Reclassify per rules: `completed_by` → `completed`; `processed_by` (no `completed_by`) → `processed`; neither → check `status` field; `status == completed` → `completed`, otherwise → `processed`
- Update counts block: `auto_executed: 0`, add reclassified counts to `completed`/`processed`

### Task 2 — Add guard note to SKILL.md Outputs section
- Read `.claude/skills/lp-do-ideas/SKILL.md`
- At end of Outputs table, add: `> **Guard:** \`auto_executed\` is a reserved state and must never be hand-set in trial mode (Option B). Use \`completed\`, \`processed\`, \`skipped\`, or \`error\` only.`

### Task 3 — Add `completed` terminal state to trial contract Section 7
- Read `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- In Section 7 diagram block: add `processed → completed`
- In Transitions list: add `processed → completed: downstream skill finishes execution`
