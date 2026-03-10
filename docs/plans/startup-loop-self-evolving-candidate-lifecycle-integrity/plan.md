---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-candidate-lifecycle-integrity
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Self-Evolving Candidate Lifecycle Integrity Plan

## Summary
The self-evolving trial currently loses route truth, state truth, and part of its evidence truth between candidate generation and canonical workflow handoff. This plan fixes that at the lifecycle-integrity layer without expanding into live actuation. The chosen approach is to make stronger-route truth first-class end to end by extending the canonical dispatch contract to carry `lp-do-plan`, removing the all-history evidence veto that permanently traps candidates at fact-find, replacing last-write-wins candidate merging with stateful recurrence merging, and hardening the KPI-declared ideas bridge because invalid observations make the route layer untrustworthy before it even runs. Lifecycle-event emission and verified-measurement generation remain adjacent dependencies owned by their existing slugs, but this plan makes the join points explicit so the result is one coherent control path rather than three drifting partial fixes.

## Active tasks
- [x] TASK-01: Extend the canonical ideas dispatch contract so self-evolving `lp-do-plan` and `lp-do-build` routes survive handoff as structured data
- [x] TASK-02: Harden KPI-declared self-evolving ideas observations so route integrity is not built on validator-invalid inputs
- [x] TASK-03: Replace last-write-wins candidate recurrence merging with lifecycle-preserving merge semantics
- [x] TASK-04: Replace the all-history stronger-route veto with current-qualified evidence gating
- [x] TASK-05: Horizon checkpoint - reassess downstream integration with lifecycle-ledger and verified-measurement dependencies

## Goals
- Preserve stronger-route truth across self-evolving handoff into the canonical ideas workflow.
- Make `lp-do-plan` a real structured route in the canonical dispatch contract instead of a prose hint.
- Allow later qualifying evidence to upgrade recurring candidates without historical weak-signal poison.
- Preserve candidate lifecycle state and outcome memory across repeat detections.
- Remove the known KPI-declared observation contract mismatch that currently undermines route integrity at ingress.

## Non-goals
- Live actuation or rollout automation.
- Reimplementing the lifecycle-ledger plan inside this slug.
- Reimplementing the broader verified-measurement generation work from the evidence-admission lane.
- Historical backfill of old candidate or queue files.

## Constraints & Assumptions
- Constraints:
  - The workflow stays manual; preserving `lp-do-plan` or `lp-do-build` does not imply autonomous execution.
  - Changes must remain additive for existing `dispatch.v2`, queue-state, and candidate-ledger files.
  - Existing non-self-evolving ideas dispatches must continue to validate and route unchanged.
  - Local Jest remains out of scope.
- Assumptions:
  - The correct long-term fix is first-class structured route preservation, not continued collapse to fact-find plus explanatory prose.
  - Historical weak observations should inform context and scoring, but should not permanently veto current stronger-route eligibility.
  - Lifecycle event emission and verified-measurement generation will land through their adjacent slugs, so this plan should expose clean interfaces to those systems rather than duplicating them.

## Inherited Outcome Contract
- **Why:** The self-evolving trial can detect recurring improvement opportunities, but it does not preserve their strongest downstream route or their prior lifecycle state across repeat detections. That turns learning into repeated re-triage.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Self-evolving follow-up packets preserve the candidate's strongest validated route, and candidate-ledger merges retain lifecycle state and outcome history while adding new recurrence evidence instead of resetting to a fresh validated record.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`
- Key findings used:
  - `self-evolving-backbone.ts` can emit `lp-do-plan`, but `dispatch.v2` and the routing adapter cannot currently represent it.
  - `self-evolving-backbone-consume.ts` hardcodes `fact_find_ready` and `lp-do-fact-find` even for stronger-route candidates.
  - `deriveCandidateEvidencePosture()` currently requires the full observation history for a signature to be measured before stronger-route eligibility is possible.
  - `mergeRankedCandidates()` overwrites blocked, reverted, and kept state with fresh validated records.
  - `dispatchToMetaObservation()` can emit KPI-declared observations the validator rejects.
  - Lifecycle-event emission and verified-measurement generation remain adjacent dependencies, not already-solved seams.

## Proposed Approach
- Option A: keep the canonical ideas contract unchanged, formally collapse all self-evolving routes back to fact-find, and only fix candidate merge semantics.
  - Pros: smaller code change.
  - Cons: locks the system into permanent re-triage and leaves route classification partly dishonest.
- Option B: extend the canonical ideas contract with first-class `plan_ready` support, preserve stronger-route truth structurally at handoff, replace the all-history route veto with current-qualified gating, harden invalid KPI-declared observation admission, and switch candidate recurrence to stateful merge semantics.
  - Pros: aligns the control path with the route/state model the self-evolving code already claims to support.
  - Cons: touches multiple route/status consumers and requires disciplined consumer tracing.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend canonical dispatch/status support so self-evolving `lp-do-plan` and `lp-do-build` routes survive handoff structurally | 82% | L | Complete (2026-03-09) | - | TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Remove the KPI-declared observation contract mismatch in the ideas bridge and validate emitted observations directly | 86% | M | Complete (2026-03-09) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Replace last-write-wins candidate recurrence merging with lifecycle-preserving merge rules | 84% | M | Complete (2026-03-09) | - | TASK-05 |
| TASK-04 | IMPLEMENT | Replace all-history stronger-route gating with current-qualified evidence routing | 81% | M | Complete (2026-03-09) | TASK-01, TASK-02 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess build handoff against lifecycle-ledger and verified-measurement dependency seams | 95% | S | Complete (2026-03-09) | TASK-01, TASK-03, TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Route contract, ingress hardening, and stateful merge can be developed independently at first pass |
| 2 | TASK-04 | TASK-01, TASK-02 | Current-qualified routing depends on the new structured route contract and valid ingress observations |
| 3 | TASK-05 | TASK-01, TASK-03, TASK-04 | Checkpoint after the core control-path changes so adjacent plan interfaces can be revalidated cleanly |

## Tasks

### TASK-01: Extend canonical dispatch/status support so self-evolving `lp-do-plan` and `lp-do-build` routes survive handoff structurally
- **Type:** IMPLEMENT
- **Deliverable:** additive `dispatch.v2` and routing support for a first-class `plan_ready` / `lp-do-plan` path, plus self-evolving follow-up dispatch emission that preserves route/status as structured data rather than prose hints
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 82%
  - Implementation: 80% - the emitting seam is localized, but the consumer set is wider than it first appears.
  - Approach: 84% - first-class route support is the only fix that removes the current contract lie instead of documenting it.
  - Impact: 82% - route truth is a load-bearing effectiveness issue.
- **Acceptance:**
  - `dispatch.v2` can represent a plan-ready self-evolving follow-up packet as structured route/status data.
  - `self-evolving-backbone-consume.ts` emits route/status pairs that match the queued candidate route.
  - The routing adapter, queue-state helpers, trial queue helpers, and metrics runner accept the new status without breaking existing routable statuses.
  - Existing non-self-evolving `fact_find_ready`, `micro_build_ready`, and `briefing_ready` packets remain valid and unchanged.
- **Validation contract (TC-01):**
  - TC-01: plan-ready and build-ready self-evolving follow-up packets validate and route successfully through the updated adapter.
  - TC-02: mismatched status/route pairs still fail closed with deterministic error messages.
  - TC-03: queue counts and metrics reconcile after adding the new routable status.
- **Execution plan:** Red -> add tests for plan-ready contract rejection and expected routing; Green -> extend contract/adapter/consume/queue helpers; Refactor -> consolidate route/status mapping helpers so self-evolving and canonical ideas share one source of truth.
- **Planning validation (required for M/L):**
  - Checks run: traced route/status consumers across `lp-do-ideas-trial.ts`, `lp-do-ideas-routing-adapter.ts`, `lp-do-ideas-trial-queue.ts`, `lp-do-ideas-queue-state-file.ts`, `lp-do-ideas-metrics-runner.ts`, and `self-evolving-backbone-consume.ts`.
  - Validation artifacts: `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`
  - Unexpected findings: `lp-do-plan` is currently impossible in the canonical dispatch contract even though the backbone route layer emits it.
- **Scouts:** None: the consumer map is already concrete enough to implement directly.
- **Edge Cases & Hardening:** preserve case-normalized routing behavior, keep duplicate-dispatch suppression stable under the new status, and confirm stale-entry repair still works for existing queue records.
- **What would make this >=90%:**
  - A full file-by-file consumer checklist for every `status` and `recommended_route` read path.
  - Targeted fixtures for queue metrics, queue counts, and stale-repair branches using the new status.
- **Rollout / rollback:**
  - Rollout: ship additive schema/adapter support first, then switch the self-evolving emitter to use the new route/status pair.
  - Rollback: keep readers backward-compatible and revert only the self-evolving emitter if downstream consumers prove incomplete.
- **Documentation impact:**
  - Update the canonical `lp-do-ideas` trial/routing contract docs for the new status.
  - Update self-evolving handoff documentation to remove prose-only route hints.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`

### TASK-02: Remove the KPI-declared observation contract mismatch in the ideas bridge and validate emitted observations directly
- **Type:** IMPLEMENT
- **Deliverable:** valid KPI-declared `meta-observation.v2` emission for ideas-derived self-evolving observations, plus regression coverage that validates emitted observations rather than only checking field values
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 86%
  - Implementation: 87% - the producer/validator seam is small and directly observed.
  - Approach: 85% - route integrity should not be layered on top of invalid ingress objects.
  - Impact: 86% - this removes a real blocker to trustworthy evidence posture.
- **Acceptance:**
  - Ideas-derived self-evolving observations no longer emit `kpi_name` with a validator-invalid `kpi_value: null` combination.
  - Focused tests validate generated observations with `validateMetaObservation()` instead of asserting only selected fields.
  - The chosen contract remains additive for non-KPI exploratory observations.
- **Validation contract (TC-02):**
  - TC-01: KPI-hinted ideas dispatches produce validator-clean observations.
  - TC-02: non-KPI ideas dispatches still emit exploratory observations without new validation failures.
  - TC-03: orchestrator integration can ingest the produced observations without contract errors.
- **Execution plan:** Red -> add failing tests that validate emitted observations; Green -> reconcile builder/validator behavior; Refactor -> centralize the KPI-declared observation helper if duplicated logic remains.
- **Planning validation (required for M/L):**
  - Checks run: traced `dispatchToMetaObservation()` into `runSelfEvolvingFromIdeas()` and `appendObservationAsEvent()` validation.
  - Validation artifacts: `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`
  - Unexpected findings: current tests assert declared posture fields but do not validate the resulting observation object.
- **Scouts:** None: the contract mismatch is already directly verified.
- **Edge Cases & Hardening:** keep the declared/exploratory split intact, preserve legacy observation readability, and avoid inventing fake KPI values just to satisfy validation.
- **What would make this >=90%:**
  - A quick inventory proving no other self-evolving builders rely on the same KPI-without-value pattern.
  - A single helper enforcing the chosen KPI-declared contract across all current builders.
- **Rollout / rollback:**
  - Rollout: land test-backed builder/validator consistency first, then reuse the helper elsewhere if needed.
  - Rollback: revert the builder change while keeping any additive validator relaxation compatible if required.
- **Documentation impact:**
  - Update any self-evolving observation contract notes that describe declared KPI posture.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`

### TASK-03: Replace last-write-wins candidate recurrence merging with lifecycle-preserving merge rules
- **Type:** IMPLEMENT
- **Deliverable:** stateful candidate-ledger merge logic that preserves lifecycle state and prior outcome metadata while appending new recurrence evidence and requiring explicit reopen transitions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 84%
  - Implementation: 83% - the merge helper is small, but the reopen semantics need precision.
  - Approach: 85% - preserving state and reopening explicitly matches the declared lifecycle model.
  - Impact: 84% - recurrence memory is one of the core effectiveness failures.
- **Acceptance:**
  - Repeated detections do not overwrite blocked, reverted, kept, or monitored state with fresh validated records.
  - New recurrence evidence appends trigger-observation context without losing historical state/outcome fields.
  - Reopening a candidate requires an explicit valid transition and a documented rule for when reopen is allowed.
  - Candidate ledger ordering remains deterministic after the merge change.
- **Validation contract (TC-03):**
  - TC-01: a repeated detection preserves non-draft lifecycle state and outcome metadata.
  - TC-02: materially new evidence can reopen a candidate only through an explicit transition rule.
  - TC-03: trigger-observation sets stay unique and deterministic after multiple merges.
- **Execution plan:** Red -> add merge regression tests for blocked/reverted/kept candidates; Green -> implement stateful merge with explicit reopen rules; Refactor -> extract reusable merge helpers for recurrence evidence and state precedence.
- **Planning validation (required for M/L):**
  - Checks run: traced `mergeRankedCandidates()` usage from orchestrator output into backbone queue generation.
  - Validation artifacts: `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`
  - Unexpected findings: the current helper is pure last-write-wins replacement despite a richer lifecycle model existing elsewhere.
- **Scouts:** None: the failure mode is already directly encoded in the current helper.
- **Edge Cases & Hardening:** handle duplicate trigger observations, expired candidates, and state-preservation when a new score drops below an older priority score.
- **What would make this >=90%:**
  - Sample candidate-ledger fixtures covering blocked, reverted, kept, and expired recurrences.
  - An explicit reopen matrix covering each allowed and forbidden state transition.
- **Rollout / rollback:**
  - Rollout: ship the merge helper and tests together without mutating historical records beyond the new merge semantics.
  - Rollback: revert to deterministic replacement if the reopen matrix proves incomplete, while preserving any new test fixtures for future repair.
- **Documentation impact:**
  - Update self-evolving lifecycle notes to describe recurrence merge precedence and reopen rules.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts`

### TASK-04: Replace all-history stronger-route gating with current-qualified evidence routing
- **Type:** IMPLEMENT
- **Deliverable:** candidate-evidence posture and routing logic that use a defined current qualifying tranche for stronger-route eligibility while retaining historical observations for context and reporting
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Confidence:** 81%
  - Implementation: 79% - the logic seam is localized, but the definition of "current qualifying tranche" must be encoded carefully.
  - Approach: 84% - current-qualified routing is the only credible alternative to the permanent all-history veto.
  - Impact: 81% - this is what makes stronger routes reachable from real recurrence history.
- **Acceptance:**
  - A candidate can graduate to a stronger route after earlier weak observations if the current qualifying evidence tranche satisfies the measured threshold.
  - Historical weak observations remain visible for context, scoring, and reporting rather than being discarded.
  - Route demotion remains deterministic when current qualifying evidence disappears or regresses below threshold.
  - Posture/dashboard summaries still reconcile after the change.
- **Validation contract (TC-04):**
  - TC-01: a weak-to-measured observation sequence can promote a recurring candidate to the stronger route when the current qualifying tranche meets requirements.
  - TC-02: a later regression in current qualifying evidence demotes the route deterministically.
  - TC-03: posture/dashboard summaries still report historical and current counts coherently after the routing change.
- **Execution plan:** Red -> add progression/regression tests covering mixed observation histories; Green -> implement current-qualified posture logic and route policy; Refactor -> centralize current-window selection so dashboard and orchestrator share one rule.
- **Planning validation (required for M/L):**
  - Checks run: traced route decisions from `deriveCandidateEvidencePosture()` through `applyEvidenceAwareRoute()` into queue emission and dashboard summary consumers.
  - Validation artifacts: `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`
  - Unexpected findings: stronger-route eligibility currently requires every historical observation in the repeat set to be measured.
- **Scouts:** None: the core policy failure is already concrete.
- **Edge Cases & Hardening:** mixed legacy/v2 observations, signatures with sparse timestamps, and route promotion where the latest evidence is measured but the historical majority remains weak.
- **What would make this >=90%:**
  - A crisp, test-backed definition of the current qualifying tranche with example ledgers for promote, hold, and demote outcomes.
  - Confirmed agreement on whether dashboard policy counts should reflect current route eligibility, historical posture, or both.
- **Rollout / rollback:**
  - Rollout: land test-backed posture changes first, then update dashboard/report consumers to the same current-window rule.
  - Rollback: revert the current-window selector while preserving regression tests that document the desired target behavior.
- **Documentation impact:**
  - Update route-policy notes in self-evolving docs to distinguish historical context from current route eligibility.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`

### TASK-05: Horizon checkpoint - reassess downstream integration with lifecycle-ledger and verified-measurement dependencies
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if adjacent lifecycle-ledger or verified-measurement dependencies shifted during execution
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/plan.md`
- **Depends on:** TASK-01, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint mechanics are defined.
  - Approach: 95% - this is the cleanest way to stop adjacency drift from invalidating the plan mid-flight.
  - Impact: 95% - prevents route/state work from quietly diverging from lifecycle and evidence dependencies.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - Adjacent interface assumptions for lifecycle-ledger and verified-measurement generation revalidated against latest repo state.
  - If interface assumptions changed, `/lp-do-replan` run and plan updated before downstream execution continues.
- **Horizon assumptions to validate:**
  - The lifecycle-ledger lane preserves candidate ID and dispatch ID joins without forcing this slug to duplicate event emission.
  - Verified-measurement generation remains prospective and additive, not a hidden prerequisite baked into this slug's implementation.
- **Validation contract:** checkpoint notes explicitly confirm or revise the adjacent plan interface assumptions before any downstream continuation.
- **Planning validation:** `docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/fact-find.md`, adjacent plans under `docs/plans/startup-loop-self-evolving-lifecycle-ledger/` and `docs/plans/startup-loop-self-evolving-evidence-admission/`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan if replan is required.
- **Checkpoint outcome (2026-03-09):**
  - `docs/plans/startup-loop-self-evolving-lifecycle-ledger/plan.md` remains active and still owns runtime lifecycle-event emission; this slug continues to expose clean candidate/dispatch seams without duplicating that work.
  - `docs/plans/startup-loop-self-evolving-evidence-admission/plan.md` is complete, and its explicit posture contract is compatible with the current-qualified measured-suffix routing rule implemented here.
  - No `/lp-do-replan` was required because the adjacent interface assumptions remained stable.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend canonical dispatch/status support | Yes | Major: route/status consumers span queue validation, metrics, routing, and self-evolving emitters; missing one consumer would create a dead-end field | Yes |
| TASK-02: Harden KPI-declared ideas observations | Yes | Moderate: the declared KPI contract is ambiguous today because builder and validator disagree | Yes |
| TASK-03: Replace candidate merge semantics | Yes | Major: reopen rules can accidentally recreate the same state-loss bug if merge precedence is underspecified | Yes |
| TASK-04: Replace all-history route veto | Partial | Major: route-graduation work depends on TASK-01 structured route support and TASK-02 valid ingress observations | Yes |
| TASK-05: Horizon checkpoint | Partial | Moderate: adjacent lifecycle-ledger and verified-measurement plans may change interface assumptions during execution | Yes |

## Risks & Mitigations
- Extending the canonical dispatch contract could miss a non-obvious consumer and create a silent no-op route.
  - Mitigation: keep TASK-01 consumer tracing explicit and test routing, queue counts, and metrics together.
- Current-qualified routing could upgrade candidates too aggressively if the qualifying tranche is underspecified.
  - Mitigation: require explicit promote/hold/demote fixtures before implementation confidence increases.
- Stateful merge rules could accidentally freeze candidates that should legitimately reopen.
  - Mitigation: define reopen rules explicitly in lifecycle terms rather than encoding implicit merge precedence.
- Adjacent lifecycle-ledger and verified-measurement work could drift and reintroduce split truth.
  - Mitigation: keep those systems out of scope for direct reimplementation here, but make the join assumptions explicit and revalidate them at TASK-05.

## Observability
- Logging:
  - Preserve deterministic route/status mismatch failures in the routing adapter.
  - Emit clear consume-path warnings when a stronger-route candidate is downgraded or repaired.
- Metrics:
  - Queue counts include any new plan-ready status.
  - Candidate merge behavior can be inspected through preserved lifecycle state and recurrence evidence in the ledger.
  - Route demotions/promotions should remain explainable from posture summaries.
- Alerts/Dashboards:
  - None: no new mandatory alerting in this tranche.

## Acceptance Criteria (overall)
- [x] The canonical ideas dispatch contract can represent a self-evolving `lp-do-plan` handoff structurally.
- [x] Self-evolving follow-up dispatches preserve route truth as contract data rather than prose hints.
- [x] Later qualifying evidence can upgrade recurring candidates without an all-history veto.
- [x] Repeat detections preserve candidate lifecycle state and outcome memory.
- [x] KPI-hinted ideas observations validate at ingress.
- [x] Lifecycle-ledger and verified-measurement dependencies are explicit and revalidated before downstream continuation.

## Decision Log
- 2026-03-09: Chose first-class `plan_ready` / `lp-do-plan` support over deliberate permanent collapse back to fact-find.
- 2026-03-09: Kept lifecycle-ledger emission and verified-measurement generation as adjacent dependencies rather than reopening those slugs inside this plan.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## Section Omission Rule
- None: all template sections are relevant to this plan.
