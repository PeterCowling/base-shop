---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-lifecycle-ledger
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-fact-find
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Evolving Lifecycle Ledger Plan

## Summary
The current self-evolving ledger records observation ingestion but not the decisions and outcomes that make a loop learn. This plan adds a bounded lifecycle-event layer so candidate generation, review, handoff, and eventual keep/revert outcomes become auditable. The scope is additive and prospective only: no fake backfill, no global event-ledger redesign. The critical requirement is that the resulting ledger must capture human review decisions explicitly, not just technical stage transitions.

## Active tasks
- [x] TASK-01: Extend the event contract with lifecycle event types and payload support
- [ ] TASK-02: Emit lifecycle events from candidate generation, explicit operator review, follow-up dispatch handoff, and completion seams
- [ ] TASK-03: Write a self-evolving control-flow contract defining precedence across the resulting systems

## Goals
- Record candidate lifecycle, not just observation ingestion.
- Link candidate IDs, dispatch IDs, and downstream outcome artifacts in one auditable path.
- Keep historical event files readable.
- Record explicit operator review decisions and explicit `outcome_missing` states where real measured outcome is unavailable.

## Non-goals
- Reconstruct historical candidate decisions retroactively.
- Actuator/autonomy policy changes.
- Business-wide event-ledger redesign.

## Constraints & Assumptions
- Constraints:
  - Event-file compatibility must remain additive.
  - Initial traceability can be keyed by candidate ID, dispatch ID, and plan slug.
  - Local Jest remains out of scope.
- Assumptions:
  - The minimum useful event set is candidate-generated, review/handoff, measured-outcome, and kept/reverted.
  - Existing queue completion and build-result artifacts provide enough seams to emit these events, but operator review cannot be inferred from technical transitions alone.

## Inherited Outcome Contract
- **Why:** The self-evolving event ledger records that observations were ingested, but it does not record candidate review, promotion, rejection, measurement, or keep/revert outcomes, so the trial cannot learn from its own decisions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-evolving runtime emits lifecycle events that link candidate generation, human review, downstream routing, and measured keep-or-revert outcomes into one auditable ledger.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-lifecycle-ledger/fact-find.md`
- Key findings used:
  - `self-evolving-events.ts` already defines an append-only ledger and event-type enum.
  - `ImprovementOutcome` already exists in the contract layer.
  - Live BRIK `events.jsonl` currently shows observation-ingestion style events only.

## Proposed Approach
- Option A: add richer reporting over the current event stream.
  - Pros: low implementation cost.
  - Cons: does not solve missing lifecycle facts.
- Option B: extend the event contract and emit prospective lifecycle events from existing queue/build seams.
  - Pros: creates real learning history instead of cosmetic reporting.
  - Cons: touches several workflow seams together.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend event contract and helpers for lifecycle event types and structured payloads | 86% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Emit lifecycle events from candidate generation, explicit operator review, follow-up dispatch handoff, and completion seams | 82% | L | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Write a self-evolving control-flow contract defining precedence across evidence posture, route, queue state, lifecycle events, and review-required state | 80% | M | Pending | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract and helper support first |
| 2 | TASK-02 | TASK-01 | Emitters depend on the new lifecycle event model |
| 3 | TASK-03 | TASK-02 | Precedence contract must be written against the actual event and queue surfaces |

## Tasks

### TASK-01: Extend event contract and helpers for lifecycle event types and structured payloads
- **Type:** IMPLEMENT
- **Deliverable:** additive lifecycle event taxonomy and append/read helpers capable of storing linked candidate/dispatch/outcome metadata, including explicit operator review and `outcome_missing` events
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 86%
  - Implementation: 87% - current event helper is small and localized.
  - Approach: 86% - additive lifecycle payloads are the lowest-risk way to improve the ledger.
  - Impact: 86% - this is the minimum viable foundation for real learning history.
- **Acceptance:**
  - Lifecycle event types exist for candidate, operator-review, handoff, outcome, and `outcome_missing` stages.
  - Structured event payloads can link candidate IDs, dispatch IDs, and outcomes.
  - Existing observation-ingestion paths remain readable.
- **Validation contract (TC-01):**
  - TC-01: contract/helper tests cover new lifecycle event serialization.
  - TC-02: legacy event reading still works for old event files.
  - TC-03: targeted scripts lint/type validation passes.
- **Build completion evidence:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` now defines lifecycle review, outcome-missing, and linked lifecycle payload contracts plus validators for `ImprovementOutcome` and lifecycle payload consistency.
  - `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` now exposes additive lifecycle event types, validates `event.v1`/`event.v2` event records, and provides `createLifecycleEvent()` for candidate, review, handoff, outcome, and `outcome_missing` writes.
  - Existing observation-ingestion writes remain on `event.v1`, while append/read helpers now accept legacy records and validated lifecycle-bearing `event.v2` records.
  - `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts` now covers lifecycle serialization, required stage-payload enforcement, and legacy event-log readability.
  - Validation results:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit --pretty false` passed.
    - `pnpm exec eslint scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts scripts/src/startup-loop/self-evolving/self-evolving-events.ts scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts` passed.
    - Jest tests were updated but not run locally per repo CI-only test policy.

### TASK-02: Emit lifecycle events from candidate generation, explicit operator review, follow-up dispatch handoff, and completion seams
- **Type:** IMPLEMENT
- **Deliverable:** lifecycle-event emission from orchestrator/backbone/review/workflow completion seams with focused regression coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** L
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, any operator-review seam introduced to persist the decision event
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 81% - multiple seams need coordinated emission.
  - Approach: 83% - prospective emission is straightforward once payload support exists.
  - Impact: 82% - converts the ledger from activity log to decision history.
- **Acceptance:**
  - Candidate generation emits a lifecycle event.
  - Explicit operator review emits a lifecycle event with decision and rationale.
  - Follow-up dispatch handoff emits a lifecycle event linked to the candidate.
  - Completion or downstream closure records either a real outcome event or an explicit `outcome_missing` event with reason.
- **Validation contract (TC-02):**
  - TC-01: integration tests show lifecycle events written for generation, review, and handoff.
  - TC-02: queue completion or equivalent completion seam can append either a linked outcome event or `outcome_missing`.
  - TC-03: targeted scripts lint/type validation passes.

### TASK-03: Write a self-evolving control-flow contract defining precedence across evidence posture, route, queue state, lifecycle events, and review-required state
- **Type:** IMPLEMENT
- **Deliverable:** concise control-flow contract doc that defines canonical precedence between evidence posture, candidate route, queue state, lifecycle event state, and review-required state
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/self-evolving/README.md` or adjacent canonical contract path, `docs/plans/startup-loop-self-evolving-lifecycle-ledger/plan.md`, any touched startup-loop contract doc needed for cross-linking
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - doc-only but must reflect the actual built seams accurately.
  - Approach: 81% - one precedence contract is required to stop the four systems drifting into conflicting truths.
  - Impact: 80% - this is the control-plane glue the current plans are missing.
- **Acceptance:**
  - One short contract defines which state is authoritative when evidence posture, route, queue state, lifecycle events, and review-required state disagree.
  - The contract states when each system is descriptive versus authoritative.
  - The contract is linked from the relevant self-evolving docs/plans so future work uses one shared model.
- **Validation contract (TC-03):**
  - TC-01: the contract covers all five control surfaces explicitly.
  - TC-02: at least two conflict examples are documented with resolved precedence.
  - TC-03: touched docs remain internally consistent with the implemented systems.

## Risks & Mitigations
- Event payload design could sprawl.
  - Mitigation: keep the initial payload minimal and keyed to candidate/dispatch/outcome IDs only.
- Completion seam may not yet know true measured outcome.
  - Mitigation: require an explicit `outcome_missing` event rather than allowing silent absence.

## Observability
- Logging: lifecycle event append results in existing event files.
- Metrics: future counts by lifecycle stage.
- Alerts/Dashboards: future ledger-derived reporting.

## Acceptance Criteria (overall)
- [ ] Self-evolving events can represent candidate lifecycle, not just ingestion.
- [ ] Candidate and workflow handoff history become auditable through linked events.
- [ ] Existing event files remain readable.
- [ ] Operator review decisions are explicit first-class events.
- [ ] A single control-flow contract defines precedence across the resulting systems.

## Decision Log
- 2026-03-09: Chose additive prospective lifecycle events instead of retroactive event reconstruction.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
