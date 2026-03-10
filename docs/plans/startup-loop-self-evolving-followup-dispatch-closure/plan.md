---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-followup-dispatch-closure
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-fact-find
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Evolving Follow-Up Dispatch Closure Plan

## Summary
The repo already has a self-evolving backbone consumer that should emit canonical follow-up dispatches and mark queue entries consumed. Live BRIK artifacts show that closure is not trustworthy enough yet. This plan hardens the consume path with explicit invariants, diagnostics, and stale-entry reconciliation so the trial can prove whether validated candidates actually re-enter the canonical workflow.

## Active tasks
- [x] TASK-01: Add consume-path closure assertions and runtime diagnostics
- [x] TASK-02: Add stale backbone reconciliation and focused regression coverage

## Goals
- Make backbone consume success or failure explicit.
- Prevent silent divergence between backbone queue state and trial queue state.
- Provide a deterministic stale-entry recovery path.
- Distinguish `closed`, `stale-repairable`, and `hard-failed` closure outcomes explicitly.

## Non-goals
- Autonomous downstream execution.
- Redesign of candidate routing heuristics.
- Migration away from the current trial queue file.

## Constraints & Assumptions
- Constraints:
  - Existing `dispatch.v2` follow-up packets stay canonical.
  - Queue writes must remain idempotent.
  - Local Jest remains out of scope.
- Assumptions:
  - The gap is a closure/diagnostics problem, not absence of a consumer.
  - Hardening this seam can be done without changing workflow governance, but it must also repair the live stale backlog rather than merely describe it.

## Inherited Outcome Contract
- **Why:** The self-evolving runtime claims to convert validated candidates into canonical workflow dispatches, but current BRIK runtime state still shows unconsumed backbone entries with no emitted follow-up packets, so trial closure cannot be trusted.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every queued self-evolving candidate either emits a canonical dispatch and marks the backbone entry consumed or surfaces a hard failure and stale-entry recovery path.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-followup-dispatch-closure/fact-find.md`
- Key findings used:
  - `self-evolving-backbone-consume.ts` already writes `consumed_at` and `followup_dispatch_id`.
  - Current BRIK `backbone-queue.jsonl` entries remain entirely unconsumed.
  - Ingestion paths report `backbone_queued` and `followup_dispatches_emitted`, but no hard invariant currently surfaces broken closure.

## Proposed Approach
- Option A: rely on current counts and document the gap operationally.
  - Pros: minimal churn.
  - Cons: preserves silent failure modes.
- Option B: add explicit postconditions to consume results, record stale/backlog diagnostics, and provide a reconciler for pending entries.
  - Pros: directly addresses trust in the handoff seam.
  - Cons: touches runtime helpers and tests together.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add consume-path invariants and explicit diagnostics for queue/dispatch closure | 88% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add stale-entry reconciliation and regression coverage for repeated drains and broken closure | 84% | M | Complete (2026-03-09) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Runtime closure truth first |
| 2 | TASK-02 | TASK-01 | Reconciler depends on stable diagnostics and invariants |

## Tasks

### TASK-01: Add consume-path invariants and explicit diagnostics for queue/dispatch closure
- **Type:** IMPLEMENT
- **Deliverable:** consume result enriched with closure diagnostics and hard postconditions around queued entries, emitted dispatches, and consumed markers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 88%
  - Implementation: 88% - the core seam is narrow and already returns result counts.
  - Approach: 89% - fail-loud diagnostics are the right response to contradictory runtime state.
  - Impact: 88% - this decides whether the self-evolving lane can be trusted operationally.
- **Acceptance:**
  - Consume results explicitly report when queued candidates did not close into emitted dispatches and consumed markers.
  - Ingestion paths surface those diagnostics instead of only aggregate counts.
  - Regression coverage asserts closure on the happy path and visible warning/failure metadata on the broken path.
- **Validation contract (TC-01):**
  - TC-01: integration tests still show emitted follow-up dispatches on a normal recurrence path.
  - TC-02: a synthetic broken-close scenario produces explicit diagnostics rather than silent success.
  - TC-03: targeted scripts lint/type validation passes.
- **Build evidence:**
  - `self-evolving-backbone-consume.ts` now reports pending-entry counts, resolved/unresolved candidate IDs, and consumed-entry counts instead of only aggregate dispatch totals.
  - Pending entries that do not close into emitted-plus-consumed follow-up records now return `ok: false` with `error: "unresolved_pending_backbone_entries"` rather than silently succeeding.
  - `self-evolving-from-ideas.ts` and `self-evolving-from-build-output.ts` now surface the consume diagnostics so upstream callers can see unresolved closure directly.
  - Added integration coverage for both the happy path and a missing-candidate failure path, and validated with targeted eslint plus `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`.

### TASK-02: Add stale-entry reconciliation and regression coverage for repeated drains and broken closure
- **Type:** IMPLEMENT
- **Deliverable:** stale backbone-entry reconciler plus explicit tri-state closure classification and focused tests proving idempotent repair and non-duplication
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/package.json`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 84% - idempotent reconciliation needs careful duplicate protection.
  - Approach: 85% - explicit stale repair is better than leaving dead queue entries to manual discovery.
  - Impact: 84% - closes the observed live-state gap directly.
- **Acceptance:**
  - A stale backbone repair path exists for entries left pending without closure, including the current live backlog shape.
  - Re-running consume/reconcile does not duplicate follow-up dispatches.
  - Runtime/report surfaces classify closure results as `closed`, `stale-repairable`, or `hard-failed`.
- **Validation contract (TC-02):**
  - TC-01: repeated consume runs remain idempotent.
  - TC-02: stale entries can be reconciled or surfaced deterministically by closure class.
  - TC-03: targeted scripts lint/type validation passes.
- **Build evidence:**
  - `self-evolving-backbone-consume.ts` now reconciles against the live legacy `ideas/trial/queue-state.json` `dispatches[]` format, so stale backbone entries can be repaired from an already-present follow-up dispatch or replayed back into the queue without duplicate admissions.
  - Closure reporting is now explicit and tri-state: `closed`, `stale-repairable`, or `hard-failed`, with per-class candidate ID lists and counts surfaced in consume results.
  - Added a bounded manual recovery entrypoint via `pnpm --filter scripts startup-loop:self-evolving-backbone-reconcile`, which runs the consume CLI in stale-only mode for backlog repair.
  - `self-evolving-from-ideas.ts` and `self-evolving-from-build-output.ts` now bubble the closure class and candidate buckets upward so upstream runtime/report callers can distinguish repaired stale backlog from fresh clean closure.
  - Regression coverage now proves stale replay into the legacy trial queue, stale repair from an already-existing dispatch without duplication, and the hard-failed missing-candidate path.
  - Validated with `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` and focused `eslint` on the touched self-evolving files/tests.

## Risks & Mitigations
- Closure diagnostics may reveal pre-existing drift and create noisy warnings.
  - Mitigation: distinguish hard closure failures from stale historical backlog cleanly with explicit tri-state classification.
- Reconciler could emit duplicates.
  - Mitigation: key idempotency on candidate ID plus existing `followup_dispatch_id`.

## Observability
- Logging: consume warnings/failure metadata from ingestion paths.
- Metrics: closure counts and stale pending counts.
- Alerts/Dashboards: future report surfacing for stale backbone entries.

## Acceptance Criteria (overall)
- [x] Backbone consume success and failure are explicit, not inferred.
- [x] Pending stale entries can be reconciled or surfaced deterministically, including the current live backlog shape.
- [x] Repeated drains remain idempotent.
- [x] Closure status is tri-state rather than a single undifferentiated failure bucket.

## Decision Log
- 2026-03-09: Chose runtime closure hardening plus reconciliation over documentation-only treatment.
- 2026-03-09: Expanded TASK-02 scope to surface closure classification through the self-evolving entrypoints because keeping the tri-state status inside the low-level consumer would not satisfy the runtime/report visibility requirement.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
