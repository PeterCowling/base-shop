---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-synthetic-dispatch-signal-enrichment
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 88%
Confidence-Method: evidence-based on bounded contract tracing plus targeted scripts validation
Auto-Build-Intent: plan+auto
---

# Startup Loop Synthetic Dispatch Signal Enrichment Plan

## Summary
Synthetic startup-loop bridges remain active, but their packets now preserve richer narrative when the source bridge has concrete information to pass through. This plan scoped and implemented a bounded repair: add optional narrative hints at the `ArtifactDeltaEvent` seam, preserve them in dispatch packet construction, and let the process-improvements collector prefer that richer context for synthetic queue items.

## Active tasks
- [x] TASK-01: Trace the synthetic bridge -> dispatch -> process-improvements contract and confirm the smallest additive fix boundary
- [x] TASK-02: Implement additive synthetic narrative enrichment and downstream surfacing updates
- [x] TASK-03: Run targeted scripts validation and persist the fact-find/build artifacts

## Goals
- Preserve legitimate synthetic signal intake.
- Improve surfaced queue idea quality without changing queue lifecycle semantics.
- Keep the repair additive to existing dispatch.v2 behavior.

## Non-goals
- Redesigning the full ideas pipeline.
- Suppressing synthetic bridges wholesale.
- Introducing a new queue format or new dispatch schema version.

## Task Summary
| Task ID | Type | Description | Confidence | Status |
|---|---|---:|---:|---|
| TASK-01 | INVESTIGATE | Confirm where narrative detail is lost in the synthetic bridge pipeline | 92% | Complete |
| TASK-02 | IMPLEMENT | Add event-level narrative hints and use them in dispatch/process-improvements surfacing | 86% | Complete |
| TASK-03 | VALIDATE | Run targeted scripts TypeScript compile and ESLint on touched files | 88% | Complete |

## Build completion evidence
- Added a new fact-find artifact at `docs/plans/startup-loop-synthetic-dispatch-signal-enrichment/fact-find.md`.
- Extended `ArtifactDeltaEvent` in `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` with optional narrative hints and used them when constructing packet `current_truth`, `next_scope_now`, `why`, and `intended_outcome`.
- Enriched the agent-session bridge in `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` with deterministic display summaries derived from actionable findings.
- Updated `scripts/src/startup-loop/build/generate-process-improvements.ts` so synthetic queue packets can surface enriched `current_truth` as their idea title instead of always using generic `area_anchor`.
- Added regression coverage in:
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-agent-session-bridge.test.ts`
  - `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`

## Validation
- `pnpm exec tsc -p /Users/petercowling/base-shop/scripts/tsconfig.json --noEmit`
- `pnpm exec eslint /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts /Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts /Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-agent-session-bridge.test.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts --no-warn-ignored`

## Risks & follow-up
- Agent-session extraction still admits some meta chatter into the raw artifact; this build improves surfaced narrative, not the full extraction model.
- Codebase and repo-maturity synthetic packets still rely mostly on generic fallback narrative unless their bridges are similarly enriched in a follow-on cycle.
