---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-self-evolving-lifecycle-ledger
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, startup-loop
Related-Plan: docs/plans/startup-loop-self-evolving-lifecycle-ledger/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309181200-9316
Trigger-Why: The self-evolving event ledger records that observations were ingested, but it does not record candidate review, promotion, rejection, measurement, or keep/revert outcomes, so the trial cannot learn from its own decisions.
Trigger-Intended-Outcome: "type: operational | statement: The self-evolving runtime emits lifecycle events that link candidate generation, human review, downstream routing, and measured keep-or-revert outcomes into one auditable ledger. | source: operator"
---

# Startup Loop Self-Evolving Lifecycle Ledger Fact-Find Brief

## Scope
### Summary
The strategy calls for an event ledger that explains what happened, why, and with what outcome. The self-evolving runtime defines rich event types, but the current live ledger is effectively just an observation-ingestion log. This fact-find scopes the missing lifecycle/outcome instrumentation needed for the trial to learn from reviewed and implemented improvements.

### Goals
- Define the minimum lifecycle event set required for self-evolving trial effectiveness.
- Link candidates, follow-up dispatches, downstream fact-finds/plans, and measured outcomes in one ledger path.
- Identify the best existing workflow hooks for emitting review and outcome events without forcing backfill.

### Non-goals
- Full business-wide event-ledger redesign beyond the self-evolving lane.
- Mandatory retroactive reconstruction of every historical candidate decision.
- Autonomous rollout controls or actuator execution changes.

### Constraints & Assumptions
- Constraints:
  - The ledger extension must be additive and must not invalidate existing event files.
  - Historical records may remain observation-only if the required data is absent.
  - The implementation should reuse existing queue completion, plan archival, and outcome review seams where possible.
- Assumptions:
  - A useful trial ledger needs more than raw observation ingestion; candidate and decision lifecycle events are the minimum viable addition.
  - Linking by candidate ID, dispatch ID, and plan slug is sufficient for first-pass traceability.

## Outcome Contract
- **Why:** The self-evolving event ledger records that observations were ingested, but it does not record candidate review, promotion, rejection, measurement, or keep/revert outcomes, so the trial cannot learn from its own decisions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-evolving runtime emits lifecycle events that link candidate generation, human review, downstream routing, and measured keep-or-revert outcomes into one auditable ledger.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/strategy/startup-loop-holistic-strategy.md` - target ledger contract.
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` - self-evolving event model.
- `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl` - live ledger.
- `.claude/skills/lp-do-build/SKILL.md` - build completion and queue completion hooks.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` - defines event types but mainly maps observation types to event writes.
- `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl` - current runtime evidence showing only `execution_end` events.
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - defines `ImprovementOutcome` but no corresponding persisted lifecycle path is active in the runtime.
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` - likely downstream seam for routing/closure telemetry.
- `docs/plans/startup-loop-self-evolving-launch-accelerator/plan.md` - broader strategic context for self-evolving runtime maturity.

### Patterns & Conventions Observed
- The runtime event model already anticipates experiment, actuator, and feedback events.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
- Current live event files reflect observation ingestion, not decision lifecycle.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl`
- `ImprovementOutcome` exists as a type, but the runtime does not appear to persist it through the observed workflow path.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`

### Data & Contracts
- Types/schemas/events:
  - Event types exist for `experiment_outcome`, `actuator_call_*`, and related paths.
  - `ImprovementOutcome` defines a natural measured-outcome contract.
- Persistence:
  - Current ledger is append-only JSONL under `docs/business-os/startup-loop/self-evolving/<BIZ>/events.jsonl`.
- API/contracts:
  - Strategy requires ledger coverage of decisions, actions, rollbacks, exceptions, and metric snapshots.

### Dependency & Impact Map
- Upstream dependencies:
  - Candidate generation and backbone routing.
  - Queue completion and downstream plan/build archival.
- Downstream dependents:
  - Self-evolving report/dashboard truthfulness.
  - Future effectiveness scoring based on actual kept/reverted outcomes.
  - Operator auditability.
- Likely blast radius:
  - Event writer utilities, queue completion hooks, build completion hooks, and self-evolving report surfaces.

### Recent Git History (Targeted)
- `docs/plans/startup-loop-self-evolving-launch-accelerator/plan.md` - the broader design already treats the event ledger as first-class, but the current runtime evidence suggests the implementation is still partial.

## Questions
### Resolved
- Q: Is the current issue just missing richer dashboards?
  - A: No. The underlying problem is missing lifecycle events, so no dashboard can truthfully report candidate review and outcome history.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `docs/business-os/startup-loop/self-evolving/BRIK/events.jsonl`
- Q: Does the runtime already have an outcome-shaped contract to build on?
  - A: Yes. `ImprovementOutcome` already exists as a type, which reduces design risk for additive persistence.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 86%
  - Basis: additive lifecycle events are conceptually straightforward but touch several workflow seams.
- Approach: 90%
  - Basis: this is a missing-instrumentation problem, not a full architecture reset.
- Impact: 93%
  - Basis: without outcome-linked history, trial effectiveness cannot be measured honestly.
- Delivery-Readiness: 88%
  - Basis: the target hooks and contracts already exist in adjacent form.
- Testability: 83%
  - Basis: can be covered with integration-style runtime tests, but full downstream outcome linkage spans several artifacts.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Lifecycle events are emitted in too many places and drift out of sync | Medium | High | Define one canonical emission path per lifecycle stage and document it explicitly |
| Historical gaps tempt a forced backfill | Medium | Medium | Keep old records readable and start emitting richer events prospectively |
| The outcome model is specified before the real review workflow seams are mapped | Medium | Medium | Trace queue completion, plan archival, and build-result hooks before implementation |

