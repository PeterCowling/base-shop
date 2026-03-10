import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type {
  MetaObservation,
  PolicyDecisionRecord,
  StartupState,
} from "../self-evolving/self-evolving-contracts.js";
import type { PolicyEvaluationDataset } from "../self-evolving/self-evolving-evaluation.js";
import type { SelfEvolvingEvent } from "../self-evolving/self-evolving-events.js";
import { buildPromotionGateDecisions } from "../self-evolving/self-evolving-promotion-gate.js";

function buildStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "startup-state-1",
    business_id: "BRIK",
    stage: "traction",
    current_website_generation: 3,
    offer: {},
    icp: {},
    positioning: {},
    brand: {
      voice_tone: "clear",
      do_rules: [],
      dont_rules: [],
    },
    stack: {
      website_platform: "next",
      repo_ref: "base-shop",
      deploy_target: "staging",
    },
    analytics_stack: {
      provider: "ga4",
      workspace_id: "workspace-1",
      event_schema_ref: "schema-1",
    },
    channels_enabled: [{ channel: "seo", automation_allowed: true }],
    credential_refs: ["cred-1"],
    kpi_definitions: [
      {
        name: "activation_rate",
        unit: "ratio",
        aggregation_method: "rate",
        kind: "primary",
      },
    ],
    asset_refs: ["asset-1"],
    constraints: [],
    updated_at: "2026-03-10T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildRankedCandidate(input: {
  id: string;
  executorPath: string;
}): RankedCandidate {
  return {
    candidate: {
      schema_version: "candidate.v1",
      candidate_id: input.id,
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: [`obs-${input.id}`],
      executor_path: input.executorPath,
      change_scope: "business_only",
      applicability_predicates: ["business=BRIK"],
      expected_benefit: "benefit",
      risk_level: "low",
      blast_radius_tag: "small",
      autonomy_level_required: 2,
      estimated_effort: "M",
      recommended_action: "build",
      owners: ["ops"],
      approvers: ["lead"],
      test_plan: "tests",
      validation_contract: "v",
      rollout_plan: "r",
      rollback_contract: "rb",
      kill_switch: "k",
      blocked_reason_code: null,
      unblock_requirements: [],
      blocked_since: null,
      expiry_at: "2026-04-01T00:00:00.000Z",
    },
    score: {
      priority_score_v1: 2.4,
      priority_score_v2: null,
      autonomy_cap: 2,
      reasons: [],
      evidence: {
        classification: "measured",
        requirements_met: 6,
        requirements_total: 6,
        readiness_ratio: 1,
        missing_requirements: [],
        data_quality_ok_rate: {
          sample_size: 1,
          successes: 1,
          observed_rate: 1,
          posterior_mean: 0.75,
          lower_credible_bound: 0.2,
          upper_credible_bound: 1,
          confidence_level: 0.95,
          method: "beta_binomial_jeffreys",
          status: "measured",
        },
        measurement_ready_observation_rate: {
          sample_size: 1,
          successes: 1,
          observed_rate: 1,
          posterior_mean: 0.75,
          lower_credible_bound: 0.2,
          upper_credible_bound: 1,
          confidence_level: 0.95,
          method: "beta_binomial_jeffreys",
          status: "measured",
        },
      },
      utility: {
        expected_reward: 3,
        downside_penalty: 0.2,
        effort_penalty: 0.4,
        evidence_penalty: 0,
        instability_penalty: 0.1,
        exploration_bonus: 0,
        net_utility: 2.3,
      },
      policy: {
        policy_version: "self-evolving-policy.v1",
        utility_version: "self-evolving-utility.v1",
        prior_family_version: "self-evolving-priors.v1",
        belief_state_id: `belief-${input.id}`,
        structural_snapshot_id: `snapshot-${input.id}`,
        evidence_weight: 0.8,
        evidence_floor_met: true,
        fallback_reason: null,
      },
    },
    route: { route: "lp-do-build", reason: "test" },
    source_hard_signature: `sig-${input.id}`,
    generated_at: "2026-03-10T00:00:00.000Z",
    policy_context: {
      decision_id: `route-${input.id}`,
      decision_context_id: `context-${input.id}`,
      policy_version: "self-evolving-policy.v1",
      utility_version: "self-evolving-utility.v1",
      prior_family_version: "self-evolving-priors.v1",
      belief_state_id: `belief-${input.id}`,
      structural_snapshot_id: `snapshot-${input.id}`,
    },
  };
}

function buildRouteDecision(candidate: RankedCandidate): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: candidate.policy_context?.decision_id ?? `route-${candidate.candidate.candidate_id}`,
    business_id: "BRIK",
    candidate_id: candidate.candidate.candidate_id,
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: candidate.policy_context?.decision_context_id ?? `context-${candidate.candidate.candidate_id}`,
    structural_snapshot: {
      snapshot_id: candidate.policy_context?.structural_snapshot_id ?? `snapshot-${candidate.candidate.candidate_id}`,
      candidate_id: candidate.candidate.candidate_id,
      business_id: "BRIK",
      captured_at: "2026-03-10T00:00:00.000Z",
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-build",
      recurrence_count_window: 3,
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [],
    },
    belief_state_id: candidate.policy_context?.belief_state_id ?? `belief-${candidate.candidate.candidate_id}`,
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-build",
    action_probability: null,
    utility: candidate.score.utility,
    created_at: "2026-03-10T00:00:00.000Z",
  };
}

function buildEvaluationDataset(candidateId: string): PolicyEvaluationDataset {
  return {
    schema_version: "policy-evaluation-dataset.v1",
    generated_at: "2026-03-12T00:00:00.000Z",
    summary: {
      total_decisions: 1,
      observed_decisions: 1,
      pending_decisions: 0,
      censored_decisions: 0,
      missing_decisions: 0,
      replay_ready_decisions: 1,
      deterministic_decisions: 1,
      stochastic_decisions: 0,
      policy_version_counts: { "self-evolving-policy.v1": 1 },
    },
    records: [
      {
        schema_version: "policy-evaluation.v1",
        decision_id: `route-${candidateId}`,
        decision_context_id: `context-${candidateId}`,
        business_id: "BRIK",
        candidate_id: candidateId,
        chosen_action: "lp-do-build",
        policy_version: "self-evolving-policy.v1",
        utility_version: "self-evolving-utility.v1",
        decision_mode: "deterministic",
        eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
        action_probability: null,
        decision_created_at: "2026-03-10T00:00:00.000Z",
        dispatch_id: "dispatch-1",
        queue_state: "completed",
        completed_at: "2026-03-11T00:00:00.000Z",
        maturity_due_at: "2026-03-11T00:00:00.000Z",
        maturity_status: "matured",
        measurement_status: "verified",
        evaluation_status: "observed",
        evaluation_ready: true,
        outcome_event_id: "event-1",
        verified_observation_ids: ["obs-1"],
        outcome_reason_code: null,
        outcome_source_path: "docs/plans/example/plan.md",
        linked_dispatch_count: 1,
        recorded_at: "2026-03-12T00:00:00.000Z",
      },
    ],
  };
}

function buildObservation(): MetaObservation {
  return {
    schema_version: "meta-observation.v2",
    observation_id: "obs-1",
    observation_type: "experiment_result_observed",
    timestamp: "2026-03-11T00:00:00.000Z",
    business: "BRIK",
    actor_type: "automation",
    run_id: "run-1",
    session_id: "session-1",
    skill_id: "lp-do-build",
    container_id: "website-v3",
    artifact_refs: ["docs/plans/example/plan.md"],
    context_path: "startup-loop/test",
    hard_signature: "sig-1",
    soft_cluster_id: null,
    fingerprint_version: "1",
    repeat_count_window: 1,
    operator_minutes_estimate: 5,
    quality_impact_estimate: 0.4,
    detector_confidence: 0.8,
    severity: 0.2,
    inputs_hash: "inputs",
    outputs_hash: "outputs",
    toolchain_version: "test",
    model_version: null,
    kpi_name: "activation_rate",
    kpi_value: 0.3,
    kpi_unit: "ratio",
    aggregation_method: "rate",
    sample_size: 120,
    data_quality_status: "ok",
    data_quality_reason_code: null,
    baseline_ref: "baseline-1",
    measurement_window: "7d",
    traffic_segment: "all",
    evidence_refs: ["docs/evidence.md"],
    evidence_grade: "measured",
    measurement_contract_status: "verified",
  };
}

function buildLifecycleEvent(candidateId: string): SelfEvolvingEvent {
  return {
    schema_version: "event.v2",
    event_id: "event-1",
    correlation_id: candidateId,
    run_id: "run-1",
    session_id: "session-1",
    timestamp: "2026-03-11T00:00:00.000Z",
    source_component: "test",
    status: "ok",
    inputs_hash: "hash-1",
    outputs_hash: "hash-1",
    error_class: null,
    artifact_refs: ["docs/plans/example/plan.md"],
    effect_class: null,
    effect_reversibility: null,
    event_type: "outcome_recorded",
    lifecycle: {
      candidate_id: candidateId,
      dispatch_id: "dispatch-1",
      outcome: {
        schema_version: "outcome.v2",
        candidate_id: candidateId,
        dispatch_id: "dispatch-1",
        decision_id: `route-${candidateId}`,
        policy_version: "self-evolving-policy.v1",
        implementation_status: "success",
        promoted_at: null,
        maturity_status: "matured",
        measurement_status: "verified",
        baseline_window: "2026-03-01/2026-03-04",
        post_window: "2026-03-05/2026-03-12",
        measured_impact: 0.18,
        impact_confidence: 0.85,
        regressions_detected: 0,
        rollback_executed_at: null,
        kept_or_reverted: "kept",
        measurement_observation_ids: ["obs-1"],
        outcome_source_path: "docs/plans/example/plan.md",
        root_cause_notes: "test",
        follow_up_actions: [],
      },
    },
  };
}

describe("buildPromotionGateDecisions", () => {
  it("TASK-11 TC-01 holds when the executor path has no declared experiment hook contract", () => {
    const candidate = buildRankedCandidate({
      id: "cand-analytics",
      executorPath: "lp-do-build:container:analytics-v1",
    });
    const [decision] = buildPromotionGateDecisions({
      startup_state: buildStartupState(),
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      evaluation_dataset: buildEvaluationDataset(candidate.candidate.candidate_id),
      observations: [buildObservation()],
      lifecycle_events: [buildLifecycleEvent(candidate.candidate.candidate_id)],
      created_at: "2026-03-12T00:00:00.000Z",
    });

    expect(decision.chosen_action).toBe("hold");
    expect(decision.promotion_gate?.reason_code).toBe("experiment_hook_contract_absent");
  });

  it("TASK-11 TC-02 promotes only when verified experiment-hook-backed evidence clears the gate", () => {
    const candidate = buildRankedCandidate({
      id: "cand-website",
      executorPath: "lp-do-build:container:website-v3",
    });
    const [decision] = buildPromotionGateDecisions({
      startup_state: buildStartupState(),
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      evaluation_dataset: buildEvaluationDataset(candidate.candidate.candidate_id),
      observations: [buildObservation()],
      lifecycle_events: [buildLifecycleEvent(candidate.candidate.candidate_id)],
      created_at: "2026-03-12T00:00:00.000Z",
    });

    expect(decision.chosen_action).toBe("promote");
    expect(decision.decision_type).toBe("promotion_gate");
    expect(decision.promotion_gate).toEqual(
      expect.objectContaining({
        causal_status: "evaluated",
        evaluation_status: "observed",
        reason_code: "target_threshold_met",
      }),
    );
  });
});
