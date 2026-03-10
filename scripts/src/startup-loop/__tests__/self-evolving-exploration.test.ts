import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type { PolicyDecisionRecord, SelfEvolvingPolicyState } from "../self-evolving/self-evolving-contracts.js";
import { buildExplorationDecisionLayer } from "../self-evolving/self-evolving-exploration.js";

function buildRankedCandidate(input: {
  id: string;
  utility: number;
}): RankedCandidate {
  return {
    candidate: {
      schema_version: "candidate.v1",
      candidate_id: input.id,
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: [`obs-${input.id}`],
      executor_path: "lp-do-build:container:website-v3",
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
      priority_score_v1: input.utility,
      priority_score_v2: null,
      autonomy_cap: 2,
      reasons: [],
      evidence: {
        classification: "instrumented",
        requirements_met: 4,
        requirements_total: 6,
        readiness_ratio: 0.66,
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
        expected_reward: input.utility + 1,
        downside_penalty: 0.2,
        effort_penalty: 0.4,
        evidence_penalty: 0.1,
        instability_penalty: 0.1,
        exploration_bonus: 0,
        net_utility: input.utility,
      },
      policy: {
        policy_version: "self-evolving-policy.v1",
        utility_version: "self-evolving-utility.v1",
        prior_family_version: "self-evolving-priors.v1",
        belief_state_id: `belief-${input.id}`,
        structural_snapshot_id: `snapshot-${input.id}`,
        evidence_weight: 0.6,
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
      portfolio_selected: true,
      portfolio_adjusted_utility: input.utility,
    },
  };
}

function buildPortfolioDecision(candidate: RankedCandidate): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: `portfolio-${candidate.candidate.candidate_id}`,
    business_id: "BRIK",
    candidate_id: candidate.candidate.candidate_id,
    decision_type: "portfolio_selection",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: "portfolio-1",
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
      evidence_grade: "structural",
      evidence_classification: candidate.score.evidence.classification,
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: ["route:lp-do-build"],
    },
    belief_state_id: candidate.policy_context?.belief_state_id ?? `belief-${candidate.candidate.candidate_id}`,
    eligible_actions: ["selected", "deferred"],
    chosen_action: "selected",
    action_probability: null,
    utility: candidate.score.utility,
    portfolio_selection: {
      schema_version: "portfolio-selection.v1",
      portfolio_id: "portfolio-1",
      candidate_set_hash: "candidate-set-1",
      candidate_count: 2,
      selected_candidate_ids: ["cand-certain", "cand-uncertain"],
      solver_status: "optimal",
      objective_value: 4.6,
      constraint_bindings: [],
      graph_snapshot_id: null,
      survival_snapshot_id: null,
      signal_snapshot: {
        graph_bottleneck_score: 0,
        shared_executor_candidate_count: 1,
        shared_constraint_candidate_count: 1,
        structural_penalty: 0,
        survival_status: "empty",
        median_verified_days: null,
        unresolved_after_hold_probability: null,
        missing_outcome_rate: null,
        survival_penalty: 0,
        adjusted_utility: candidate.score.utility.net_utility,
      },
    },
    created_at: "2026-03-10T00:00:00.000Z",
  };
}

function buildPolicyState(authorityLevel: SelfEvolvingPolicyState["authority_level"], explorationBudgetSlots: number): SelfEvolvingPolicyState {
  return {
    schema_version: "policy-state.v1",
    business_id: "BRIK",
    policy_state_id: "policy-state-1",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    authority_level: authorityLevel,
    active_constraint_profile: {
      schema_version: "constraint-profile.v1",
      wip_cap: 10,
      max_candidates_per_route: {
        "lp-do-build": 2,
      },
      max_guarded_trial_blast_radius: "medium",
      minimum_evidence_floor: "instrumented",
      hold_window_days: 7,
      exploration_budget_slots: explorationBudgetSlots,
    },
    maturity_windows: {
      schema_version: "maturity-window-profile.v1",
      immediate_days: 0,
      short_days: 7,
      medium_days: 28,
      long_days: 56,
    },
    candidate_beliefs: {
      "cand-certain": {
        schema_version: "candidate-belief.v1",
        candidate_id: "cand-certain",
        structural_snapshot_id: "snapshot-cand-certain",
        success_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 2,
          prior_beta: 2,
          alpha: 22,
          beta: 4,
          successes: 20,
          failures: 2,
          updated_through_event_id: "event-certain",
        },
        positive_impact_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 2,
          prior_beta: 2,
          alpha: 24,
          beta: 4,
          successes: 22,
          failures: 2,
          updated_through_event_id: "event-certain",
        },
        guardrail_breach_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 1,
          prior_beta: 1,
          alpha: 1,
          beta: 10,
          successes: 0,
          failures: 9,
          updated_through_event_id: "event-certain",
        },
        time_to_effect: {
          family: "dirichlet_categorical",
          buckets: ["immediate", "short", "medium", "long", "unknown"],
          prior_alpha: [1, 1, 1, 1, 1],
          alpha: [3, 2, 1, 1, 1],
          counts: [2, 1, 0, 0, 0],
          updated_through_event_id: "event-certain",
        },
        evidence_weight: 0.8,
        evidence_floor_met: true,
        last_verified_outcome_at: "2026-03-01T00:00:00.000Z",
        last_outcome_event_id: "event-certain",
        last_decision_id: "route-cand-certain",
        last_override_id: null,
        updated_at: "2026-03-10T00:00:00.000Z",
      },
      "cand-uncertain": {
        schema_version: "candidate-belief.v1",
        candidate_id: "cand-uncertain",
        structural_snapshot_id: "snapshot-cand-uncertain",
        success_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 2,
          prior_beta: 2,
          alpha: 4,
          beta: 4,
          successes: 2,
          failures: 2,
          updated_through_event_id: "event-uncertain",
        },
        positive_impact_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 2,
          prior_beta: 2,
          alpha: 4,
          beta: 4,
          successes: 2,
          failures: 2,
          updated_through_event_id: "event-uncertain",
        },
        guardrail_breach_if_attempted: {
          family: "beta_binomial",
          prior_alpha: 1,
          prior_beta: 1,
          alpha: 1,
          beta: 5,
          successes: 0,
          failures: 4,
          updated_through_event_id: "event-uncertain",
        },
        time_to_effect: {
          family: "dirichlet_categorical",
          buckets: ["immediate", "short", "medium", "long", "unknown"],
          prior_alpha: [1, 1, 1, 1, 1],
          alpha: [1, 1, 1, 1, 1],
          counts: [0, 0, 0, 0, 0],
          updated_through_event_id: "event-uncertain",
        },
        evidence_weight: 0.6,
        evidence_floor_met: true,
        last_verified_outcome_at: null,
        last_outcome_event_id: null,
        last_decision_id: "route-cand-uncertain",
        last_override_id: null,
        updated_at: "2026-03-10T00:00:00.000Z",
      },
    },
    last_decision_id: null,
    updated_at: "2026-03-10T00:00:00.000Z",
    updated_by: "agent",
  };
}

describe("buildExplorationDecisionLayer", () => {
  it("TASK-10 TC-01 surfaces a higher-uncertainty selected candidate within the bounded budget", () => {
    const certain = buildRankedCandidate({ id: "cand-certain", utility: 2.4 });
    const uncertain = buildRankedCandidate({ id: "cand-uncertain", utility: 2.35 });
    const result = buildExplorationDecisionLayer({
      business_id: "BRIK",
      ranked_candidates: [certain, uncertain],
      portfolio_decisions: [certain, uncertain].map(buildPortfolioDecision),
      policy_state: buildPolicyState("advisory", 1),
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect(result.applied).toBe(true);
    expect([...result.prioritized_candidate_ids]).toEqual(["cand-uncertain"]);
    expect(result.decision_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate_id: "cand-uncertain",
          decision_type: "exploration_rank",
          decision_mode: "stochastic",
          chosen_action: "prioritized",
          action_probability: expect.any(Number),
        }),
      ]),
    );
  });

  it("TASK-10 TC-02 collapses to exploit-only ordering when the exploration budget is zero", () => {
    const certain = buildRankedCandidate({ id: "cand-certain", utility: 2.4 });
    const uncertain = buildRankedCandidate({ id: "cand-uncertain", utility: 2.35 });
    const result = buildExplorationDecisionLayer({
      business_id: "BRIK",
      ranked_candidates: [certain, uncertain],
      portfolio_decisions: [certain, uncertain].map(buildPortfolioDecision),
      policy_state: buildPolicyState("shadow", 0),
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect(result.applied).toBe(false);
    expect([...result.prioritized_candidate_ids]).toEqual([]);
    expect(result.decision_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate_id: "cand-certain",
          decision_mode: "deterministic",
          chosen_action: "baseline_selected",
          action_probability: 1,
        }),
        expect.objectContaining({
          candidate_id: "cand-uncertain",
          decision_mode: "deterministic",
          chosen_action: "baseline_selected",
          action_probability: 1,
        }),
      ]),
    );
  });
});
