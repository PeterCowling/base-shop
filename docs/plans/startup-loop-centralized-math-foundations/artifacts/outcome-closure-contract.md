---
Type: Artifact
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Relates-to: docs/plans/startup-loop-centralized-math-foundations/plan.md
Task-ID: TASK-04
---

# Outcome Closure Contract (TASK-04)

## Purpose
Define the exact join keys, lifecycle responsibilities, maturity rules, and verified-measurement write conditions required for the startup loop to learn from its own completed work. This contract must close the current gap between self-evolving candidate generation and the canonical ideas completion path.

## Current Seam Map

### Handoff seam that exists today
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
  - follow-up dispatches already carry:
    - `artifact_id = self-evolving.candidate.<candidate_id>`
    - `root_event_id = self-evolving:candidate:<candidate_id>`
    - evidence refs including `self-evolving-candidate:<candidate_id>`
  - queue entries already persist `followup_dispatch_id` and `followup_route`

### Completion seam that exists today
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
  - writes only `plan_path`, `completed_at`, and `outcome`
- `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`
  - repairs queue completion state, but still reasons generically about `processed_by` and `completed_by`

### Lifecycle seam that is defined but not wired
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
  - supports `candidate_generated`
  - supports `followup_dispatch_handoff`
  - supports `outcome_recorded`
  - supports `outcome_missing`

## Canonical Join Graph
The canonical identity chain must be:

`candidate_id -> decision_id -> dispatch_id -> plan/build artifact -> outcome event -> verified observation(s)`

### Required keys
- `candidate_id`
  - canonical self-evolving learning unit
- `decision_id`
  - canonical policy-decision join key from TASK-03
- `dispatch_id`
  - canonical handoff join key into `lp-do-ideas`
- `plan_path` or `micro_build_path`
  - human execution artifact
- `outcome_event_id`
  - canonical lifecycle write-back
- `verified_observation_id[]`
  - measured evidence used for belief updates

Rule:
- `candidate_id` must never again be recoverable only by parsing `evidence_refs`.
- `evidence_refs` remains an audit and backfill surface, not the primary contract.

## Queue Metadata Contract

### Dispatch packet extension
Add a first-class self-evolving block to self-evolving-generated `dispatch.v2` payloads:

```ts
interface DispatchSelfEvolvingLink {
  candidate_id: string;
  decision_id: string;
  policy_version: string;
  recommended_route_origin: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  executor_path: string;
  handoff_emitted_at: string;
}
```

### Queue-state persistence
Persist the same link on the queue entry:

```ts
interface QueueProcessedBy {
  // existing fields
  self_evolving?: DispatchSelfEvolvingLink;
}

interface QueueCompletedBy {
  plan_path?: string;
  micro_build_path?: string;
  completed_at: string;
  outcome: string;
  self_evolving?: {
    candidate_id: string;
    decision_id: string;
    dispatch_id: string;
    maturity_due_at: string;
    maturity_status: "pending" | "matured";
    measurement_status:
      | "pending"
      | "verified"
      | "verified_degraded"
      | "missing"
      | "insufficient_sample";
    outcome_event_id: string | null;
    verified_observation_ids: string[];
  };
}
```

This keeps queue completion human-readable while making the self-evolving join explicit.

## Artifact Contract
Execution artifacts produced from self-evolving work must carry:
- `Source-Dispatch-ID`
- `Source-Candidate-ID`
- `Policy-Decision-ID`
- `Policy-Version`

Minimum required locations:
- plan frontmatter or outcome-contract metadata for plan-driven work
- `build-event.json` for build-driven work

Fallback behavior:
- if an older artifact lacks those fields, TASK-06 may backfill from queue metadata once
- no new self-evolving artifact is allowed to omit them

## Lifecycle Responsibility Table
| Component | Responsibility | Required write |
|---|---|---|
| `self-evolving-orchestrator.ts` | first persistence of a new candidate | `candidate_generated` lifecycle event |
| `self-evolving-backbone-consume.ts` | canonical dispatch handoff | `followup_dispatch_handoff` lifecycle event plus queue `processed_by.self_evolving` |
| plan/build producer | execution artifact metadata | source IDs on plan/build artifact |
| `lp-do-ideas-queue-state-completion.ts` or reconcile successor | mark completion | queue `completed_by.self_evolving` pending maturity record |
| verified measurement bridge | mature measurement emission | `meta-observation.v2` with `measurement_contract_status: "verified"` |
| lifecycle bridge | outcome close or missing close | `outcome_recorded` or `outcome_missing` event |

## Verified Measurement Contract

### Required states
`measurement_contract_status` remains the observation field, but the closure path must interpret it as:
- `none`
  - no declared measurable contract
- `declared`
  - measurable intent exists but cannot update beliefs
- `verified`
  - provenance, maturity, and measurement requirements passed

### Verified write conditions
A verified measurement observation is allowed only when all of the following are true:
- `candidate_id`, `decision_id`, and `dispatch_id` are all present
- `baseline_ref` is present
- `measurement_window` is present
- `kpi_name` is present
- `sample_size` is present
- `data_quality_status` is `ok` or `degraded`
- at least one outcome artifact ref exists
- the maturity window for the declared metric family has elapsed, or the outcome class is immediate

### Quality handling
- `data_quality_status = ok`
  - full-weight belief update allowed
- `data_quality_status = degraded`
  - verified write allowed, but update weight must be discounted and promotion eligibility must stay blocked
- `data_quality_status = unknown`
  - verified write forbidden; emit `outcome_missing`

## Maturity Windows
Maturity is not optional. The loop must not treat an early completion as a mature business result.

### Default maturity profile
| Outcome family | Default due-at rule | Notes |
|---|---|---|
| Build correctness / rollback / validation failure | immediate (`completed_at`) | can update downside or success immediately |
| Workflow or operator-load improvement | `completed_at + 7 days` | short behavioral maturation |
| Primary KPI movement | `completed_at + 28 days` | medium business maturation |
| Retention / churn / long-horizon value | `completed_at + 56 days` | long maturation |

### Hard rules
- Before `maturity_due_at`, completion is `pending` rather than success.
- Pending outcomes may be shown on dashboards but must not update reward beliefs.
- Reverts and hard failures are immediate and do update downside beliefs.

## Outcome Missing Contract
Only emit `outcome_missing` after maturity is due and the bridge still cannot verify outcome evidence.

### Required reason codes
- `dispatch_join_missing`
- `candidate_join_missing`
- `artifact_missing`
- `baseline_missing`
- `measurement_window_missing`
- `insufficient_sample`
- `data_quality_unknown`
- `metric_not_available`

### Required payload
```ts
interface OutcomeMissingRecord {
  reason_code: string;
  detail: string | null;
  expected_artifact_ref: string | null;
}
```

Effects:
- freezes positive-reward updates
- marks candidate as closure-incomplete
- creates an auditable reason rather than letting the signal vanish

## Outcome Recorded Contract
When verification succeeds, write:

1. one `ImprovementOutcome` or successor outcome payload linked to `candidate_id`
2. one `outcome_recorded` lifecycle event
3. one or more verified `meta-observation.v2` records carrying the actual KPI measurement

### Proposed successor outcome shape
The current `ImprovementOutcome` is too thin for provenance and maturity. TASK-06 should extend it:

```ts
interface ImprovementOutcomeV2 {
  schema_version: "outcome.v2";
  candidate_id: string;
  dispatch_id: string;
  decision_id: string;
  policy_version: string;
  implementation_status: "success" | "failed" | "reverted";
  maturity_status: "matured";
  measurement_status: "verified" | "verified_degraded";
  baseline_window: string;
  post_window: string;
  measured_impact: number;
  impact_confidence: number;
  regressions_detected: number;
  kept_or_reverted: "kept" | "reverted";
  measurement_observation_ids: string[];
  outcome_source_path: string | null;
  root_cause_notes: string;
  follow_up_actions: string[];
}
```

## Belief-Update Eligibility
Belief update rules after closure:
- verified mature success -> update `success_if_attempted`, `positive_impact_if_attempted`, `time_to_effect`
- verified mature degraded-quality success -> update with reduced weight
- revert or hard failure -> update `guardrail_breach_if_attempted` immediately
- outcome missing -> no reward update, but evidence-floor and closure-completeness flags worsen

## Mapping to Current Code Seams
- `self-evolving-backbone-consume.ts`
  - already has enough information to emit `followup_dispatch_handoff`; TASK-06 should stop relying on `extractCandidateIdFromEvidenceRefs()` as the primary join
- `lp-do-ideas-queue-state-file.ts`
  - must grow a first-class `self_evolving` metadata block on `processed_by` and `completed_by`
- `lp-do-ideas-queue-state-completion.ts`
  - must stop treating completion as a generic string outcome only
- `self-evolving-events.ts`
  - already has event types and payload validator support; TASK-06 should wire the runtime writes rather than inventing another lifecycle sink

## Acceptance Check Against TASK-04
- candidate/dispatch/plan join keys: yes
- lifecycle responsibilities: yes
- maturity-window rules: yes
- verified-measurement gates: yes
- outcome-missing handling: yes
- direct mapping to completion and event seams: yes

## Implementation Notes for TASK-06
- Implement queue metadata first so the closure path stops guessing.
- Emit lifecycle events at the three existing seams rather than creating a fourth store.
- Treat pending maturity as a first-class status; do not collapse it into success or missing.
