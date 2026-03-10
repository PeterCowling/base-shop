---
Type: Artifact
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Relates-to: docs/plans/startup-loop-centralized-math-foundations/plan.md
Task-ID: TASK-03
---

# Posterior Policy Contract (TASK-03)

## Purpose
Define the minimum mathematically defensible policy layer the startup loop needs before optimization, graph analysis, survival risk, exploration, and calibration work are allowed to shape live decisions. The contract must map to the current self-evolving seams instead of inventing a parallel system.

## Current Seam Map

### Structural state that already exists
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - `StartupState` holds business/stage context, KPI definitions, channel automation flags, and constraints.
  - `MetaObservation` already captures structural and measured evidence fields.
  - `ImprovementCandidate` is the current unit of recurring-work memory.
- `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
  - Persists `startup-state.json`.

### Decision seams that are still heuristic
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - Computes weighted heuristic scores plus evidence readiness summaries.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
  - Builds candidates, applies route gates, and chooses queue-worthy work.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`
  - Sorts by consumed status, numeric priority, then queue time.

### Missing state
- No persisted belief state.
- No persisted utility contract or policy version.
- No decision journal that can support replay, calibration, regret, or propensity-aware evaluation.

## Contract Decisions

### 1. Persist policy state separately from startup state
Keep `startup-state.json` as structural business truth. Add a separate dynamic file:

- Path: `docs/business-os/startup-loop/self-evolving/<business>/policy-state.json`
- Writer: TASK-05 runtime
- Readers: orchestrator, queue allocator, dashboard, replay/calibration tooling

Rationale:
- `StartupState` is mostly slow-moving environment context.
- Policy state is fast-moving learned state and must be versioned independently.
- Keeping them separate prevents hidden mutation of operator-owned business context.

### 2. Persist decision records separately from policy state
Add a journal:

- Path: `docs/business-os/startup-loop/self-evolving/<business>/policy-decisions.jsonl`
- Writer: every policy decision seam
- Readers: TASK-10, TASK-12, TASK-13, TASK-14 replay/calibration/regret flows

This is the canonical replay surface. Nothing stochastic or authority-bearing is allowed to exist only in process memory.

## Proposed Types

### Policy state
```ts
type PolicyAuthorityLevel = "shadow" | "advisory" | "guarded_trial";

interface SelfEvolvingPolicyState {
  schema_version: "policy-state.v1";
  business_id: string;
  policy_state_id: string;
  policy_version: string;
  utility_version: string;
  prior_family_version: string;
  authority_level: PolicyAuthorityLevel;
  active_constraint_profile: ConstraintProfile;
  maturity_windows: MaturityWindowProfile;
  candidate_beliefs: Record<string, CandidateBeliefState>;
  last_decision_id: string | null;
  updated_at: string;
  updated_by: string;
}

interface MaturityWindowProfile {
  schema_version: "maturity-window-profile.v1";
  immediate_days: number;
  short_days: number;
  medium_days: number;
  long_days: number;
}
```

### Structural feature snapshot
```ts
interface StructuralFeatureSnapshot {
  snapshot_id: string;
  candidate_id: string;
  business_id: string;
  captured_at: string;
  startup_stage: StartupStage;
  candidate_type: CandidateType;
  recommended_route_hint: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  recurrence_count_window: number;
  operator_minutes_estimate: number;
  quality_impact_estimate: number;
  evidence_grade: ObservationEvidenceGrade | null;
  evidence_classification:
    | "measured"
    | "instrumented"
    | "structural_only"
    | "insufficient";
  blast_radius_tag: ImprovementCandidate["blast_radius_tag"];
  risk_level: ImprovementCandidate["risk_level"];
  estimated_effort: ImprovementCandidate["estimated_effort"];
  constraint_refs: string[];
}
```

### Posterior families
Use narrow, replayable posterior families rather than opaque model state:

```ts
interface BetaPosterior {
  family: "beta_binomial";
  prior_alpha: number;
  prior_beta: number;
  alpha: number;
  beta: number;
  successes: number;
  failures: number;
  updated_through_event_id: string | null;
}

interface BucketPosterior {
  family: "dirichlet_categorical";
  buckets: ["immediate", "short", "medium", "long", "unknown"];
  prior_alpha: [number, number, number, number, number];
  alpha: [number, number, number, number, number];
  counts: [number, number, number, number, number];
  updated_through_event_id: string | null;
}
```

These families are intentionally simple:
- `beta_binomial` handles success, positive impact, and downside probability cleanly.
- `dirichlet_categorical` handles time-to-effect buckets without claiming spurious point precision.
- Both are deterministic to serialize, replay, and audit.

### Candidate belief state
```ts
interface CandidateBeliefState {
  schema_version: "candidate-belief.v1";
  candidate_id: string;
  structural_snapshot_id: string;
  success_if_attempted: BetaPosterior;
  positive_impact_if_attempted: BetaPosterior;
  guardrail_breach_if_attempted: BetaPosterior;
  time_to_effect: BucketPosterior;
  evidence_weight: number;
  evidence_floor_met: boolean;
  last_verified_outcome_at: string | null;
  last_outcome_event_id: string | null;
  last_decision_id: string | null;
  last_override_id: string | null;
  updated_at: string;
}
```

### Constraint and utility contracts
```ts
interface ConstraintProfile {
  schema_version: "constraint-profile.v1";
  wip_cap: number;
  max_candidates_per_route: Partial<Record<"lp-do-fact-find" | "lp-do-plan" | "lp-do-build", number>>;
  max_guarded_trial_blast_radius: "small" | "medium" | "large";
  minimum_evidence_floor: "instrumented" | "measured";
  hold_window_days: number;
}

interface UtilityBreakdown {
  expected_reward: number;
  downside_penalty: number;
  effort_penalty: number;
  evidence_penalty: number;
  instability_penalty: number;
  exploration_bonus: number;
  net_utility: number;
}
```

## Cold-Start Priors

### Required seeding axes
Cold-start priors must be seeded by:
- `candidate_type`
- startup `stage`
- proposed route family
- blast radius

### Initial prior family
Until enough verified history exists, TASK-05 should seed:
- `success_if_attempted`: weakly informative beta prior
- `positive_impact_if_attempted`: weakly informative beta prior
- `guardrail_breach_if_attempted`: downside-sensitive beta prior that is more pessimistic for `medium` and `large` blast radius
- `time_to_effect`: symmetric categorical prior with heavier mass on `unknown` for first-attempt candidates

### Cold-start update rule
- Observations that are only structural or declared do not change outcome posteriors.
- Verified outcomes update the posterior.
- Operator override alone does not count as success/failure; it is a label on the decision trace.
- Reverts count as downside evidence immediately.

## Utility Contract
Replace raw heuristic priority with guarded expected utility:

`net_utility = expected_reward - downside_penalty - effort_penalty - evidence_penalty - instability_penalty + exploration_bonus`

### Component meaning
- `expected_reward`
  - derived from posterior mean of positive impact, expected size class, and relevance to declared KPI kind
- `downside_penalty`
  - derived from upper credible bound of guardrail breach and blast radius weight
- `effort_penalty`
  - derived from structural effort bucket and operator capacity pressure
- `evidence_penalty`
  - applied when evidence floor is not met or outcome maturity is incomplete
- `instability_penalty`
  - applied when recent route churn, hold-window breach, or repeated overrides imply instability
- `exploration_bonus`
  - bounded bonus only available to the exploration layer; must be zero for purely deterministic policy decisions

### Hard rules
- Utility may rank candidates only after hard constraints pass.
- Candidates below the evidence floor cannot receive a positive net utility that bypasses the route floor.
- High-risk or high-blast-radius candidates cannot gain authority solely from expected reward.

## Decision Journal Contract
Every policy-bearing decision must emit a journal record.

```ts
type PolicyDecisionType =
  | "candidate_route"
  | "portfolio_selection"
  | "exploration_rank"
  | "promotion_gate"
  | "override_record";

type PolicyDecisionMode = "deterministic" | "stochastic";

interface PolicyDecisionRecord {
  schema_version: "policy-decision.v1";
  decision_id: string;
  business_id: string;
  candidate_id: string;
  decision_type: PolicyDecisionType;
  decision_mode: PolicyDecisionMode;
  policy_version: string;
  utility_version: string;
  prior_family_version: string;
  authority_level: PolicyAuthorityLevel;
  structural_snapshot: StructuralFeatureSnapshot;
  belief_snapshot: CandidateBeliefState;
  constraint_profile: ConstraintProfile;
  utility_breakdown: UtilityBreakdown;
  chosen_action: Record<string, unknown>;
  rejected_actions: Array<{ action: string; reason_code: string }>;
  source_event_ids: string[];
  override: OperatorOverrideRecord | null;
  stochastic_trace?: {
    random_seed: string;
    propensity: number;
    sampled_values: Array<{ action_id: string; sample: number }>;
  };
  created_at: string;
}
```

### Mandatory trace rules
- Deterministic decisions must log:
  - `utility_breakdown`
  - active constraints
  - chosen action
  - rejected-action reason codes
  - source events
- Stochastic decisions must additionally log:
  - RNG seed
  - propensity
  - sampled value per action

Without those fields the result is not replayable and cannot feed regret or calibration analysis.

## Deterministic vs Stochastic Decisions
Deterministic:
- contract validation
- cold-start prior selection
- evidence-floor enforcement
- authority-ladder enforcement
- infeasible-solver fail-closed handling
- final tie-break once candidate set and utilities are fixed

Stochastic:
- bounded contextual exploration draws
- any Thompson-style ranking sample

Rule:
- stochasticity is allowed only where the policy is intentionally exploring
- route floors, authority caps, and hard risk constraints are always deterministic

## Operator Override Recording
Overrides must be first-class journal events rather than free-text notes.

```ts
interface OperatorOverrideRecord {
  override_id: string;
  actor_type: ActorType;
  actor_id: string | null;
  recorded_at: string;
  reason_code: string;
  rationale: string;
  prior_action: Record<string, unknown>;
  override_action: Record<string, unknown>;
}
```

Override effects:
- do not silently mutate posterior beliefs
- do become labeled decision outcomes for later calibration and policy-quality analysis
- increment instability tracking when repeated on the same route family

## Update Triggers
| Trigger | State change | Belief update allowed | Journal required |
|---|---|---|---|
| New candidate generated | create cold-start `CandidateBeliefState` | no | yes |
| New structural observation | refresh `StructuralFeatureSnapshot` | no | only if a decision changes |
| Verified positive or negative outcome recorded | update beta and time-to-effect posteriors | yes | yes |
| Outcome missing after maturity | set evidence floor fail, no reward update | no | yes |
| Operator override | update override counters only | no | yes |
| Guarded-trial revert | update downside posterior immediately | yes | yes |

## Mapping to Current Seams
- `self-evolving-startup-state.ts`
  - keep as writer/reader for structural `StartupState` only
  - add sibling policy-state store rather than extending `StartupState` with dynamic beliefs
- `self-evolving-scoring.ts`
  - TASK-05 should turn `computeScoreResult()` into a utility-builder or retire it behind a compatibility adapter
- `self-evolving-orchestrator.ts`
  - becomes the main policy-state reader and decision-journal writer
- `self-evolving-backbone-queue.ts`
  - must stop treating `priority` as a raw scalar with no provenance and instead persist the `decision_id` or equivalent policy trace link

## Acceptance Check Against TASK-03
- Versioned belief-state contract: yes, `policy-state.v1` and `candidate-belief.v1`
- Cold-start priors and update triggers: yes, defined above
- Policy versioning and overrides: yes, explicit fields and journaling rules
- Separation of structural features, beliefs, context, outputs: yes
- Deterministic vs stochastic decision trace requirements: yes

## Implementation Notes for TASK-05 and TASK-13
- TASK-05 should implement these contracts exactly enough that no belief-bearing decision depends on unpersisted in-memory state.
- TASK-13 should treat `policy-decisions.jsonl` as the canonical calibration/regret input, not reconstruct decisions from queue order after the fact.
