---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-idea-completion-reconciliation
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 90%
Confidence-Method: evidence-based on queue-state, completed-ideas, and plan/fact-find contract audit
Auto-Build-Intent: plan+auto
---

# Startup Loop Idea Completion Reconciliation Plan

## Summary
Run a deterministic sweep across the current ideas queue and close only the ideas the repository can prove are already implemented. The reconciler uses explicit dispatch linkage from `fact-find.md` / `micro-build.md`, completed execution artifacts, and existing queue routing metadata to update queue completion state and the completed-ideas registry without inventing fuzzy matches.

## Active tasks
- [x] TASK-01: Trace the canonical closure evidence for queue ideas in the self-improving loop
- [x] TASK-02: Implement a deterministic reconciliation CLI for queue completion backfill
- [x] TASK-03: Add targeted regression coverage for explicit dispatch links, routed slugs, and micro-build completions
- [x] TASK-04: Run the reconciler on the live trial queue and record the resulting closure counts

## Goals
- Close already-implemented ideas with loop-native evidence only.
- Keep queue-state and completed-ideas registry in sync.
- Avoid speculative title-similarity matching.

## Non-goals
- Declaring unresolved ideas to be complete by heuristic similarity.
- Reclassifying or suppressing open ideas.
- Rebuilding the whole startup-loop pipeline.

## Task Summary
| Task ID | Type | Description | Confidence | Status |
|---|---|---:|---:|---|
| TASK-01 | INVESTIGATE | Confirm how queue items are canonically marked completed and suppressed downstream | 93% | Complete |
| TASK-02 | IMPLEMENT | Add deterministic queue completion reconciliation across plans, micro-builds, and completed registry | 89% | Complete |
| TASK-03 | IMPLEMENT | Cover explicit dispatch-link, micro-build, and missing-evidence cases with tests | 88% | Complete |
| TASK-04 | VALIDATE | Run targeted validation and execute the reconciler on the live trial queue | 90% | Complete |

## Build completion evidence
- Added `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts` to scan queue-state, completed-ideas, and plan artifacts, then close queue items only when explicit completion evidence exists.
- Added `scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts` to cover explicit dispatch-id linkage, routed micro-build completion, and missing build-evidence fail-closed behavior.
- Ran the reconciler on `docs/business-os/startup-loop/ideas/trial/queue-state.json`; the write pass scanned `478` dispatches, found `148` with hard completion evidence, moved `56` additional queue entries to `queue_state: "completed"`, and backfilled `134` queue-derived entries into `docs/business-os/_data/completed-ideas.json`.
- Verified idempotence with a second dry-run: `queue_dispatches_completed: 0` and `completed_registry_added: 0`.

## Validation
- `pnpm exec tsc -p /Users/petercowling/base-shop/scripts/tsconfig.json --noEmit`
- `pnpm exec eslint /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts --no-warn-ignored`
- `pnpm --filter scripts startup-loop:lp-do-ideas-completion-reconcile -- --queue-state-path docs/business-os/startup-loop/ideas/trial/queue-state.json --write`

## Risks & follow-up
- A subset of queue items are clearly linked to active/complete work but still missing canonical build evidence such as `build-record.user.md`; those remain open by design until the execution artifacts are brought into contract.
- This reconciler is intentionally conservative; if broader closure is desired, the missing loop metadata should be fixed at source rather than inferred here.
