---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-synthetic-dispatch-backfill
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 89%
Confidence-Method: evidence-based on the existing synthetic-dispatch investigation plus direct queue-state inspection
Auto-Build-Intent: plan+auto
---

# Startup Loop Synthetic Dispatch Backfill Plan

## Summary
Backfill existing synthetic queue stubs into well-formed ideas without suppressing the underlying requirement. The implementation adds one shared synthetic-dispatch narrative projector, uses it at read time for process-improvements surfacing, and exposes a deterministic queue backfill CLI so the current trial queue can be rewritten in place.

## Active tasks
- [x] TASK-01: Add a shared synthetic-dispatch narrative projector that can reconstruct better fields from existing evidence refs
- [x] TASK-02: Use the shared projector in process-improvements so legacy queue entries surface as concrete ideas immediately
- [x] TASK-03: Add a queue backfill CLI and targeted regression coverage for agent-session, codebase-structural, and repo-maturity synthetic packets
- [x] TASK-04: Run targeted validation and execute the queue backfill on the current trial queue

## Goals
- Make existing synthetic queue packets readable and actionable.
- Keep the backfill deterministic and additive to the current dispatch schema.
- Reuse one projection path for both read-time surfacing and queue rewriting.

## Non-goals
- Reclassifying or suppressing synthetic bridges.
- Redesigning queue-state storage.
- Re-running the full ideas pipeline.

## Task Summary
| Task ID | Type | Description | Confidence | Status |
|---|---|---:|---:|---|
| TASK-01 | IMPLEMENT | Add deterministic synthetic narrative projection and field backfill helpers | 90% | Complete |
| TASK-02 | IMPLEMENT | Apply synthetic projection during process-improvements collection | 88% | Complete |
| TASK-03 | IMPLEMENT | Add backfill CLI plus regression coverage | 87% | Complete |
| TASK-04 | VALIDATE | Run targeted TypeScript/ESLint validation and backfill the current trial queue | 89% | Complete |

## Build completion evidence
- Added `scripts/src/startup-loop/ideas/lp-do-ideas-synthetic-dispatch-narrative.ts` to reconstruct concrete narrative for agent-session, codebase-structural, and repo-maturity synthetic packets from preserved evidence refs.
- Added `scripts/src/startup-loop/ideas/lp-do-ideas-synthetic-dispatch-backfill.ts` and the `startup-loop:lp-do-ideas-synthetic-dispatch-backfill` package script for deterministic queue rewriting.
- Tightened low-signal filtering in `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` so narrative projection prefers concrete findings over routing/classification chatter when rehydrating agent-session packets.
- Updated `scripts/src/startup-loop/build/generate-process-improvements.ts` so generic synthetic queue items surface projected titles and bodies even before the queue file is rewritten.
- Added regression coverage in:
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-synthetic-dispatch-narrative.test.ts`
  - `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- Rewrote the current trial queue in `docs/business-os/startup-loop/ideas/trial/queue-state.json`; after concurrent queue growth during the run, the final queue snapshot had `477` dispatches with `183` synthetic packets and `0` remaining generic `current_truth` / `next_scope_now` / `why` stubs across those synthetic entries.

## Validation
- `pnpm exec tsc -p /Users/petercowling/base-shop/scripts/tsconfig.json --noEmit`
- `pnpm exec eslint /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-synthetic-dispatch-narrative.ts /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-synthetic-dispatch-backfill.ts /Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-synthetic-dispatch-narrative.test.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts --no-warn-ignored`
- `pnpm --filter scripts startup-loop:lp-do-ideas-synthetic-dispatch-backfill -- --queue-state-path docs/business-os/startup-loop/ideas/trial/queue-state.json --write`

## Risks & follow-up
- Agent-session backfill quality is best when transcript files are still available locally; when they are not, the projector falls back to preserved artifact findings or explicit “rehydration needed” wording.
- The backfill preserves queue routing semantics, so any truly low-value synthetic packets will still exist; they will just be much easier to triage.
