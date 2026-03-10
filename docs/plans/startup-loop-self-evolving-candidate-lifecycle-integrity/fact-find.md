---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-self-evolving-candidate-lifecycle-integrity
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Related-Plan: docs/plans/startup-loop-self-evolving-candidate-lifecycle-integrity/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309181500-9318
Trigger-Why: The self-evolving trial can detect recurring improvement opportunities, but it does not preserve their strongest downstream route or their prior lifecycle state across repeat detections. That turns learning into repeated re-triage.
Trigger-Intended-Outcome: "type: operational | statement: Self-evolving follow-up packets preserve the candidate's strongest validated route, and candidate-ledger merges retain lifecycle state and outcome history while adding new recurrence evidence instead of resetting to a fresh validated record. | source: operator"
---

# Startup Loop Self-Evolving Candidate Lifecycle Integrity Fact-Find Brief

## Scope
### Summary
The self-evolving trial now detects recurring gaps, scores them, and re-injects them into the canonical workflow. Rehearsing the intended process exposed four linked effectiveness defects. First, the handoff seam collapses every follow-up packet back to `lp-do-fact-find` even when the candidate was explicitly classified as stronger-route build or plan work. Second, the canonical `dispatch.v2` contract cannot currently represent `lp-do-plan`, so route preservation is partly impossible even if the hardcoded downgrade is removed. Third, stronger-route eligibility is computed across the full observation history for a repeat signature, so earlier weak evidence can permanently hold a candidate at fact-find even after later qualifying evidence arrives. Fourth, the candidate ledger uses last-write-wins replacement by `candidate_id`, so repeat detections can overwrite blocked, reverted, or kept state with a fresh validated candidate. This fact-find scopes those defects as one lifecycle-integrity problem: the trial is not reliably preserving what it has already learned or what route that learning should take.

### Goals
- Preserve the strongest validated downstream route when self-evolving candidates are handed back into the canonical workflow.
- Resolve the route-contract truth for plan-ready self-evolving candidates instead of relying on prose hints.
- Make stronger-route eligibility depend on current qualifying evidence, not an all-history veto.
- Preserve candidate lifecycle state and outcome memory across repeat detections of the same recurring problem.
- Define the narrowest additive changes needed to keep the trial manual while making it genuinely cumulative.

### Non-goals
- Enabling autonomous actuation or rollout.
- Reworking the evidence-admission contract already scoped in `startup-loop-self-evolving-evidence-admission`.
- Replacing the lifecycle-event work already scoped in `startup-loop-self-evolving-lifecycle-ledger`.
- Fixing KPI-admission contract mismatches in `self-evolving-from-ideas` beyond documenting them as an upstream blocker to coordinate with evidence-admission work.
- Broad redesign of candidate scoring heuristics.

### Constraints & Assumptions
- Constraints:
  - Keep the workflow boundary manual: `lp-do-ideas -> lp-do-fact-find` remains valid where evidence is weak, but stronger measured routes must not be downgraded silently.
  - Preserve additive compatibility with existing candidate ledgers and follow-up dispatches.
  - If `dispatch.v2` cannot carry `lp-do-plan`, this tranche must either extend that contract explicitly or narrow route-preservation claims to the routes the queue can really represent.
  - Avoid historical backfill of lifecycle states unless it can be derived deterministically.
- Assumptions:
  - Route preservation and state preservation belong in the self-evolving handoff and ledger seams, not in a new side store.
  - Historical weak observations should remain useful context for scoring, but should not permanently veto later stronger-route eligibility.
  - The right behavior is append-and-preserve, not reset-and-replace, when the same recurring problem is seen again.

## Outcome Contract
- **Why:** The self-evolving trial can detect recurring improvement opportunities, but it does not preserve their strongest downstream route or their prior lifecycle state across repeat detections. That turns learning into repeated re-triage.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Self-evolving follow-up packets preserve the candidate's strongest validated route, and candidate-ledger merges retain lifecycle state and outcome history while adding new recurrence evidence instead of resetting to a fresh validated record.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - candidate generation, validation, and route selection.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts` - candidate-to-backbone route mapping.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts` - follow-up dispatch generation back into the canonical workflow.
- `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts` - candidate ledger persistence and merge behavior.
- `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts` - observation-to-route eligibility posture, including stronger-route gating.
- `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts` - lifecycle state machine and blocked-state SLA rules.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - canonical dispatch.v2 status and route contract.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` - downstream route/status validation and rejection behavior.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - idea-dispatch observation synthesis for self-evolving intake.
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - validation rules for `meta-observation.v2` payloads.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts` - maps `container_update` to `lp-do-build` and some other candidate types to `lp-do-plan`.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - preserves stronger routes when evidence posture is measured enough, but only until the handoff seam.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts` - hardcodes self-evolving follow-up packets to `recommended_route: "lp-do-fact-find"` and `status: "fact_find_ready"` even when the queued candidate route is stronger.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - defines a dispatch contract that has no `lp-do-plan` or plan-ready status, making some route-preservation claims unrepresentable.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` - enforces the limited route/status set and rejects mismatches.
- `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts` - requires every observation in the candidate set to be measured before stronger-route eligibility becomes true.
- `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts` - merges incoming candidates by `candidate_id` with direct replacement, preserving neither prior lifecycle state nor prior outcome metadata.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - can synthesize KPI-hinted observations with `kpi_name` but `kpi_value: null`, creating an upstream contract mismatch against the validator.
- `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts` - defines a richer state machine (`blocked`, `canary`, `promoted`, `monitored`, `kept`, `reverted`) that the ledger merge does not currently protect.

### Patterns & Conventions Observed
- Route selection is intentionally evidence-aware before the handoff seam.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- The handoff seam currently normalizes every follow-up candidate into a fact-find packet regardless of the candidate's own route.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
- The runtime defines lifecycle events for candidate generation, handoff, and outcome, but the non-test runtime path observed here still writes observation-derived events only.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- The self-evolving backbone can classify candidates as `lp-do-plan`, but the canonical ideas queue cannot currently carry that route as a first-class dispatch.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`
- Stronger-route eligibility is an all-history gate: one non-measured observation in the repeat set keeps the entire candidate at fact-find posture.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- Candidate persistence currently optimizes for deterministic identity but not for state continuity.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`
- The upstream ideas bridge can emit an observation shape that the contract validator itself rejects, which makes KPI-bearing declared evidence a live intake hazard rather than a purely downstream concern.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
- Normal ingress paths still do not produce verified measurement-ready observations, which means stronger-route promotion and write-back remain dependent on adjacent evidence-admission work rather than being reachable from ordinary execution today.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts`
- The lifecycle module already assumes candidate state matters over time, which makes last-write-wins replacement semantically weaker than the declared state model.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts`

### Data & Contracts
- Types/schemas/events:
  - `BackboneRoutingDecision` permits `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.
  - `dispatch.v2` and the routing adapter currently permit only `lp-do-fact-find`, `lp-do-build`, and `lp-do-briefing`.
  - `ImprovementCandidate` includes lifecycle state, blockers, rollback contract, and expiry metadata.
  - `meta-observation.v2` validation requires `kpi_value` when `kpi_name` is present.
- Persistence:
  - Candidate ledger persists to `docs/business-os/startup-loop/self-evolving/<BIZ>/candidates.json`.
  - Follow-up dispatches persist to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- API/contracts:
  - `dispatch.v2` packets are the canonical workflow re-entry shape, so any preserved route must be representable there rather than only narrated in free text.
  - Candidate lifecycle semantics already exist and should not be silently erased by merge behavior.

### Dependency & Impact Map
- Upstream dependencies:
  - Evidence admission and scoring determine whether a candidate earns a stronger route.
  - The `dispatch.v2` route/status contract determines which self-evolving routes can survive canonical handoff.
  - Candidate generation provides deterministic `candidate_id`.
- Downstream dependents:
  - Fact-find intake quality and whether build-ready or plan-ready work is allowed to stay stronger-route work.
  - Lifecycle ledger truthfulness and future kept/reverted learning.
  - Any operator reviewing candidate backlog state across recurrences.
- Likely blast radius:
  - Self-evolving route generation, ideas dispatch contract usage, candidate ledger merge semantics, and targeted integration tests.

### Recent Git / Adjacent Scope Context
- `docs/plans/startup-loop-self-evolving-followup-dispatch-closure/` - solved stale closure and explicit consume diagnostics, but did not preserve stronger route information in emitted packets.
- `docs/plans/startup-loop-self-evolving-lifecycle-ledger/` - scopes missing event writes, but not candidate-ledger overwrite semantics.
- `docs/plans/startup-loop-self-evolving-evidence-admission/` - scopes low-evidence intake, but not post-admission route/state preservation.
- The rehearsal shows this tranche depends on both adjacent tranches landing coherently: route/state integrity is not independent of evidence-admission truthfulness or lifecycle-event persistence.

## Questions
### Resolved
- Q: Does the code already know which candidates are build-ready or plan-ready?
  - A: Yes. `mapCandidateToBackboneRoute()` can return `lp-do-build` and `lp-do-plan`, and the orchestrator preserves those stronger routes when evidence posture allows it.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- Q: Can the canonical ideas dispatch contract faithfully preserve `lp-do-plan` today?
  - A: No. The backbone layer can emit `lp-do-plan`, but `dispatch.v2` and the routing adapter only accept fact-find, build, and briefing routes/statuses.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`
- Q: Is the route loss happening before or after candidate scoring?
  - A: After. The route is downgraded at follow-up dispatch generation, where emitted packets are hardcoded back to fact-find.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
- Q: Can a later measured signal still fail to graduate a repeat candidate because of earlier weak observations?
  - A: Yes. Stronger-route eligibility requires every observation in the repeat set to qualify as measured, so earlier structural observations can permanently hold posture at fact-find.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-evidence-posture.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- Q: Is lifecycle-state loss theoretical or encoded directly in persistence?
  - A: Encoded directly. `mergeRankedCandidates()` replaces existing entries by `candidate_id`, so a later recurrence can overwrite a previously blocked, reverted, or kept candidate record.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`
- Q: Does the runtime already declare richer lifecycle states than the merge layer protects?
  - A: Yes. The lifecycle model defines states and transitions far richer than the current replacement merge preserves.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts`
- Q: Is there an upstream KPI-contract mismatch in the ideas bridge that could invalidate declared evidence before routing even happens?
  - A: Yes. `dispatchToMetaObservation()` can emit `kpi_name` with `kpi_value: null`, while the validator rejects that shape.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
- Q: Is lifecycle/outcome recording already live enough that this slug can assume durable candidate/outcome memory exists elsewhere?
  - A: No. The lifecycle event model exists, but the runtime path observed here still stops at observation append, while queue completion writes outcome text without bridging it back into self-evolving events.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- Q: Can normal execution currently generate the verified measurement posture needed for stronger downstream policy?
  - A: Not reliably. Build-output and build-failure ingestion still emit structural or null measurement fields, so ordinary execution does not naturally produce verified measurement-ready observations yet.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts`

### Open (Operator Input Required)
None.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Strong-route classification | Yes | Major: route classification can produce `lp-do-plan`, but the canonical queue contract cannot represent that route | Yes |
| Follow-up dispatch emission | Yes | Major: stronger route is discarded at packet emit time even before queue limitations are considered | Yes |
| Evidence-posture graduation | Yes | Major: all-history measured gate can permanently block stronger-route eligibility | Yes |
| Candidate ledger merge semantics | Yes | Major: last-write-wins replacement erases lifecycle memory | Yes |
| Upstream declared-evidence admission | Yes | Moderate: KPI-hinted ideas observations can violate the observation validator | Yes |
| Lifecycle/outcome dependency seam | Yes | Moderate: candidate/outcome memory is not yet backed by runtime lifecycle events, so this slug must coordinate rather than assume it | Yes |
| Verified-measurement dependency seam | Yes | Moderate: ordinary ingestion still does not produce verified posture, so route-graduation fixes must not assume measured inputs are already common | Yes |
| Lifecycle-state contract | Yes | Moderate: declared state model is richer than persisted behavior | Yes |
| Adjacent overlap with March 9 tranches | Yes | Moderate: route/state work must coordinate with evidence-admission and lifecycle-ledger tranches to avoid partial fixes | Yes |

## Confidence Inputs
- Implementation: 80%
  - Basis: the direct seams are localized, but route preservation now clearly depends on a queue-contract decision and evidence-posture gating change, not only a consume-path edit.
- Approach: 84%
  - Basis: the fix direction is coherent, but the plan/build route contract choice must be made explicitly to avoid another prose-versus-structure mismatch.
- Impact: 91%
  - Basis: this is a direct effectiveness issue, not an efficiency nicety. Re-triaging, false route preservation, and permanent fact-find posture mean the trial is not cumulative.
- Delivery-Readiness: 79%
  - Basis: the code seams are present, but adjacent evidence-admission and lifecycle-ledger work now read as dependencies rather than optional cleanups.
- Testability: 78%
  - Basis: integration tests can cover route preservation, observation validation, and recurrence-state behavior, but multiple cross-file contracts need coordinated coverage.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Extending route preservation without first resolving the `lp-do-plan` contract creates a new impossible state rather than a real fix | High | High | Decide whether `plan_ready` becomes a real dispatch route/status or whether plan-ready candidates intentionally collapse to fact-find |
| Preserving a stronger route too aggressively causes stale direct-build packets after evidence posture regresses | Medium | Medium | Route preservation should key off current qualifying evidence, not historical route alone |
| All-history evidence gating continues to hold candidates at fact-find even after downstream measurement improves | High | High | Separate routing eligibility from full historical context or define a current qualifying tranche |
| Protecting lifecycle state too rigidly prevents legitimate reopening of a candidate after materially new evidence arrives | Medium | Medium | Merge logic should append evidence and require explicit transition rules for reopening |
| Route/state fixes ship before lifecycle-ledger hooks exist and create another split truth between queue state and event history | Medium | Medium | Keep lifecycle-event emission in the adjacent slug, but make the required join points explicit in this plan |
| Route-graduation logic is improved before normal ingestion can emit verified posture, leaving the stronger route path technically correct but rarely reachable | Medium | Medium | Treat verified-measurement generation as an explicit adjacent dependency rather than an implicit assumption |
| Scope overlaps with lifecycle-ledger instrumentation and evidence-admission work | Medium | Medium | Keep this tranche focused on route/state truthfulness while explicitly coordinating interface points with adjacent tranches |

## Evidence Gap Review
### Gaps Addressed
- Verified the route-preservation defect directly in the handoff emitter rather than inferring it from queue output.
- Verified that route preservation is not just a consume-path problem: `lp-do-plan` is not currently representable in the canonical dispatch contract.
- Verified that stronger-route eligibility is an all-history gate, not a latest-qualified-evidence gate.
- Verified the state-loss defect directly in the candidate-ledger merge helper rather than inferring it from live files.
- Verified that the ideas bridge can emit a KPI-bearing observation shape that the observation validator rejects.
- Verified that lifecycle/outcome persistence remains an adjacent dependency, not an already-solved seam this slug can rely on.
- Verified that ordinary ingestion still does not produce verified measurement posture, so route-integrity fixes must not assume that prerequisite is already common in runtime data.
- Verified that richer lifecycle states already exist, so the issue is not missing vocabulary but missing persistence semantics.

### Confidence Adjustments
- Confidence increased after confirming the route downgrade is a hardcoded implementation choice, not a heuristic byproduct.
- Confidence decreased slightly after confirming that part of the route-preservation problem is contractual: the queue cannot currently carry `lp-do-plan`.
- Confidence decreased slightly after confirming that stronger-route eligibility is stricter than assumed and can be poisoned by older weak observations.
- Confidence increased after confirming the merge helper is deterministic replacement by `candidate_id`, with no state merge behavior.

### Remaining Assumptions
- The eventual fix should keep additive compatibility with existing candidate ledgers and queue entries.
- A single tranche can still cover route preservation and state-preserving merges, but it must either make the dispatch contract truth explicit or narrow claims to the routes the queue already supports.
- The KPI-admission mismatch should be fixed in the adjacent evidence-admission tranche rather than silently worked around here.
- Lifecycle event emission and verified-measurement generation should remain coordinated dependencies, not be reimplemented opportunistically under this slug unless they become direct blockers during build.

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve the manual trial boundary.
  - Keep candidate IDs deterministic.
  - Do not preserve route information only in prose fields such as `next_scope_now` or `adjacent_later`; preserved routes must survive as structured contract data.
  - Use explicit lifecycle transitions when reopening or superseding prior candidate states.
- Rollout / rollback expectations:
  - Script-only additive changes with regression coverage in self-evolving integration tests.
  - No live actuation or rollout-control changes in this tranche.
  - Coordinate the interface points with `startup-loop-self-evolving-evidence-admission` and `startup-loop-self-evolving-lifecycle-ledger` rather than duplicating their implementation scope here.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-self-evolving-candidate-lifecycle-integrity`

## Scope Signal
Signal: right-sized

Rationale: This work is still narrower than a full self-improvement workflow rewrite, but rehearsal showed it is not just a consume-path fix. It is right-sized only if the plan treats three items as first-class design decisions: the queue contract truth for `lp-do-plan`, current-versus-historical evidence gating, and state-preserving candidate merges. Adjacent KPI-admission and lifecycle-event work should be coordinated, not absorbed wholesale into this slug.
