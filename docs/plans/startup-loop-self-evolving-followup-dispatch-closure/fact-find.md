---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-self-evolving-followup-dispatch-closure
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Related-Plan: docs/plans/startup-loop-self-evolving-followup-dispatch-closure/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309181100-9315
Trigger-Why: The self-evolving runtime claims to convert validated candidates into canonical workflow dispatches, but current BRIK runtime state still shows unconsumed backbone entries with no emitted follow-up packets, so trial closure cannot be trusted.
Trigger-Intended-Outcome: "type: operational | statement: Every queued self-evolving candidate either emits a canonical dispatch and marks the backbone entry consumed or surfaces a hard failure and stale-entry recovery path. | source: operator"
---

# Startup Loop Self-Evolving Follow-Up Dispatch Closure Fact-Find Brief

## Scope
### Summary
The self-evolving trial is supposed to hand validated candidates back into the canonical ideas workflow. The code path exists, but the current live BRIK state contradicts the claimed behavior: backbone entries remain unconsumed and no corresponding self-evolving follow-up dispatches are present in the trial queue. This fact-find scopes the reliability gap at the handoff seam, not the broader self-improvement design.

### Goals
- Verify why live backbone entries can remain pending despite the consumer path existing in code.
- Add a deterministic postcondition so ingest runs cannot silently stop after queueing candidates.
- Define stale-entry reconciliation for self-evolving backbone items that fail to produce follow-up dispatches.

### Non-goals
- Changing the operator-confirmed workflow boundary.
- Full redesign of candidate routing heuristics.
- Autonomous invocation of `lp-do-fact-find`.

### Constraints & Assumptions
- Constraints:
  - Preserve the existing `dispatch.v2` follow-up packet shape.
  - Keep queue storage additive and idempotent.
  - Avoid queue-format migration while the legacy trial queue remains active.
- Assumptions:
  - The gap is in runtime closure or state mutation, not in the basic existence of a consumer implementation.
  - A hard ingest postcondition is acceptable in trial even if the downstream route remains manual.

## Outcome Contract
- **Why:** The self-evolving runtime claims to convert validated candidates into canonical workflow dispatches, but current BRIK runtime state still shows unconsumed backbone entries with no emitted follow-up packets, so trial closure cannot be trusted.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every queued self-evolving candidate either emits a canonical dispatch and marks the backbone entry consumed or surfaces a hard failure and stale-entry recovery path.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - ideas ingestion path.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - build-output ingestion path.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts` - backbone consumer.
- `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl` - live queued entries.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` - canonical trial queue.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts` - intended emitter and consumer-state writer.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts` - queue persistence model and consumed markers.
- `docs/business-os/startup-loop/self-evolving/README.md` - claims both ingestion entrypoints emit follow-up dispatches automatically.
- `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json` - current source candidate ledger for queued entries.
- `docs/plans/startup-loop-self-improvement-workflow-closure/fact-find.md` - adjacent broader plan covering workflow closure as a concept.

### Patterns & Conventions Observed
- The consumer only acts on entries where `followup_dispatch_id` and `consumed_at` are null.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
- The README documents successful automatic consumption as if it were already true in normal runs.
  - Evidence: `docs/business-os/startup-loop/self-evolving/README.md`
- Current BRIK backbone entries remain pending despite recent candidate generation timestamps.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`, `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`

### Data & Contracts
- Types/schemas/events:
  - Follow-up packets are `dispatch.v2` and validated through `validateDispatchV2()`.
- Persistence:
  - Backbone queue: `docs/business-os/startup-loop/self-evolving/<BIZ>/backbone-queue.jsonl`
  - Trial queue: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- API/contracts:
  - Consumer contract implies queued candidates become trial-queue work items.

### Dependency & Impact Map
- Upstream dependencies:
  - Self-evolving candidate generation.
  - Trial queue persistence adapter.
- Downstream dependents:
  - `lp-do-fact-find` intake of self-evolving follow-up work.
  - Operator trust in the self-improvement trial.
  - Any future backlog or dashboard built from queue state.
- Likely blast radius:
  - Backbone consumer, queue write path, ingest entrypoints, and runtime reporting docs.

### Recent Git History (Targeted)
- `docs/plans/startup-loop-self-improvement-workflow-closure/` - earlier tranche scoped broader closure work; this finding narrows to actual follow-up dispatch reliability in the live runtime.

## Questions
### Resolved
- Q: Is this just a critique of the trial being manual?
  - A: No. The issue is that the trial's own documented handoff path appears incomplete in live state, even before any human review step begins.
  - Evidence: `docs/business-os/startup-loop/self-evolving/README.md`, `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`
- Q: Is there already a consumer implementation in code?
  - A: Yes. The issue is runtime closure reliability, not absence of a consumer function.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 90%
  - Basis: the relevant runtime seam is tightly bounded to queue consume/persist behavior.
- Approach: 89%
  - Basis: hard postconditions and stale reconciliation are additive and trial-compatible.
- Impact: 91%
  - Basis: without reliable follow-through, the trial cannot prove that validated candidates re-enter the real workflow.
- Delivery-Readiness: 90%
  - Basis: live contradictory artifacts already exist and are easy to inspect.
- Testability: 86%
  - Basis: existing integration tests can be extended to assert consume-state mutation and emitted dispatch persistence.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| The issue is intermittent and hard to reproduce locally | Medium | Medium | Add deterministic post-run assertions and reconciliation diagnostics |
| Fixing consume-state mutation on legacy queue shape introduces duplicate dispatches | Medium | High | Make emitted dispatch persistence idempotent and key reconciliation on candidate ID + dispatch ID |
| Broader workflow-closure plans create duplicate scope | Medium | Low | Keep this tranche explicitly limited to follow-up dispatch reliability and stale-entry closure |

