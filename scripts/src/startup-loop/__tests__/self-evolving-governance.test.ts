import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type {
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
  StartupState,
} from "../self-evolving/self-evolving-contracts.js";
import {
  governExplorationSelections,
  governPortfolioSelections,
  governRouteDecisions,
} from "../self-evolving/self-evolving-governance.js";

function buildStartupState(input: { primary?: boolean; guardrail?: boolean } = {}): StartupState {
  const kpiDefinitions: StartupState["kpi_definitions"] = [];
  if (input.primary !== false) {
    kpiDefinitions.push({
      name: "activation_rate",
      unit: "ratio",
      aggregation_method: "rate",
      kind: "primary",
    });
  }
  if (input.guardrail) {
    kpiDefinitions.push({
      name: "regressions_detected",
      unit: "count",
      aggregation_method: "sum",
      kind: "guardrail",
    });
  }

  return {
    schema_version: "startup-state.v1",
    startup_state_id: "state-1",
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
      workspace_id: "w1",
      event_schema_ref: "schema-1",
    },
    channels_enabled: [{ channel: "seo", automation_allowed: true }],
    credential_refs: ["cred-1"],
    kpi_definitions: kpiDefinitions,
    asset_refs: ["asset-1"],
    constraints: [],
    updated_at: "2026-03-10T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildPolicyState(): SelfEvolvingPolicyState {
  return {
    schema_version: "policy-state.v1",
    business_id: "BRIK",
    policy_state_id: "policy-state-1",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    authority_level: "advisory",
    active_constraint_profile: {
      schema_version: "constraint-profile.v1",
      wip_cap: 1,
      max_candidates_per_route: {
        "lp-do-build": 1,
        "lp-do-plan": 1,
        "lp-do-fact-find": 1,
      },
      max_guarded_trial_blast_radius: "medium",
      minimum_evidence_floor: "instrumented",
      hold_window_days: 7,
      exploration_budget_slots: 1,
    },
    maturity_windows: {
      schema_version: "maturity-window-profile.v1",
      immediate_days: 0,
      short_days: 7,
      medium_days: 28,
      long_days: 56,
    },
    candidate_beliefs: {},
    last_decision_id: null,
    updated_at: "2026-03-10T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildRankedCandidate(input: {
  id: string;
  route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
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
        expected_reward: input.utility + 1,
        downside_penalty: 0.2,
        effort_penalty: 0.4,
        evidence_penalty: 0,
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
        evidence_weight: 0.8,
        evidence_floor_met: true,
        fallback_reason: null,
      },
    },
    route: { route: input.route, reason: `route-${input.route}` },
    source_hard_signature: `sig-${input.id}`,
    generated_at: "2026-03-10T00:00:00.000Z",
    policy_context: {
      decision_id: `route-${input.id}`,
      decision_context_id: `route-context-${input.id}`,
      policy_version: "self-evolving-policy.v1",
      utility_version: "self-evolving-utility.v1",
      prior_family_version: "self-evolving-priors.v1",
      belief_state_id: `belief-${input.id}`,
      structural_snapshot_id: `snapshot-${input.id}`,
    },
  };
}

function buildRouteDecision(candidate: RankedCandidate, createdAt = "2026-03-10T00:00:00.000Z"): PolicyDecisionRecord {
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
    decision_context_id:
      candidate.policy_context?.decision_context_id ??
      `route-context-${candidate.candidate.candidate_id}`,
    structural_snapshot: {
      snapshot_id:
        candidate.policy_context?.structural_snapshot_id ??
        `snapshot-${candidate.candidate.candidate_id}`,
      candidate_id: candidate.candidate.candidate_id,
      business_id: "BRIK",
      captured_at: createdAt,
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: candidate.route.route,
      recurrence_count_window: 3,
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.5,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [`route:${candidate.route.route}`],
    },
    belief_state_id: candidate.policy_context?.belief_state_id ?? `belief-${candidate.candidate.candidate_id}`,
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: candidate.route.route,
    action_probability: null,
    utility: candidate.score.utility,
    created_at: createdAt,
  };
}

function buildPortfolioDecision(
  candidate: RankedCandidate,
  chosenAction: "selected" | "deferred",
): PolicyDecisionRecord {
  return {
    ...buildRouteDecision(candidate),
    decision_id: `portfolio-${candidate.candidate.candidate_id}`,
    decision_type: "portfolio_selection",
    decision_context_id: "portfolio-1",
    eligible_actions: ["selected", "deferred"],
    chosen_action: chosenAction,
    portfolio_selection: {
      schema_version: "portfolio-selection.v1",
      portfolio_id: "portfolio-1",
      candidate_set_hash: "candidate-set-1",
      candidate_count: 2,
      selected_candidate_ids:
        chosenAction === "selected" ? [candidate.candidate.candidate_id] : [],
      solver_status: "optimal",
      objective_value: chosenAction === "selected" ? candidate.score.utility.net_utility : 0,
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
  };
}

function buildExplorationDecision(
  candidate: RankedCandidate,
  chosenAction: "prioritized" | "baseline_selected",
): PolicyDecisionRecord {
  return {
    ...buildRouteDecision(candidate),
    decision_id: `exploration-${candidate.candidate.candidate_id}`,
    decision_type: "exploration_rank",
    decision_mode: "stochastic",
    decision_context_id: "exploration-1",
    eligible_actions: ["prioritized", "baseline_selected"],
    chosen_action: chosenAction,
    action_probability: 0.5,
    utility: {
      ...candidate.score.utility,
      exploration_bonus: 0.3,
      net_utility: Number((candidate.score.utility.net_utility + 0.3).toFixed(6)),
    },
    exploration_rank: {
      schema_version: "exploration-rank.v1",
      exploration_batch_id: "exploration-1",
      candidate_set_hash: "candidate-set-1",
      portfolio_id: "portfolio-1",
      policy_mode: "advisory",
      budget_slots: 1,
      seed: 42,
      prioritized_candidate_ids:
        chosenAction === "prioritized" ? [candidate.candidate.candidate_id] : [],
      signal_snapshot: {
        baseline_adjusted_utility: candidate.score.utility.net_utility,
        sampled_success_probability: 0.6,
        sampled_impact_probability: 0.62,
        uncertainty_width: 0.2,
        context_weight: 0.03,
        exploration_bonus: 0.3,
        exploration_score: Number((candidate.score.utility.net_utility + 0.3).toFixed(6)),
      },
    },
  };
}

describe("self-evolving governance", () => {
  it("TASK-12 TC-01 blocks stronger route promotion inside the hold window and records the override", () => {
    const candidate = buildRankedCandidate({ id: "cand-1", route: "lp-do-build", utility: 2.2 });
    const result = governRouteDecisions({
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      prior_policy_decisions: [
        {
          ...buildRouteDecision({ ...candidate, route: { route: "lp-do-fact-find", reason: "prior" } }),
          decision_id: "prior-route",
          chosen_action: "lp-do-fact-find",
          created_at: "2026-03-08T00:00:00.000Z",
        },
      ],
      policy_state: buildPolicyState(),
      startup_state: buildStartupState({ primary: true, guardrail: true }),
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect(result.ranked_candidates[0]?.route).toEqual({
      route: "lp-do-fact-find",
      reason: "route_hold_window_preserve_lp-do-fact-find",
    });
    expect(result.decision_records[0]?.chosen_action).toBe("lp-do-fact-find");
    expect(result.override_records).toHaveLength(1);
    expect(result.override_records[0]?.decision_type).toBe("override_record");
  });

  it("TASK-12 TC-03 de-risks route policy when primary or guardrail counter-metrics are missing", () => {
    const buildCandidate = buildRankedCandidate({ id: "cand-build", route: "lp-do-build", utility: 2.4 });

    const missingPrimary = governRouteDecisions({
      ranked_candidates: [buildCandidate],
      route_decisions: [buildRouteDecision(buildCandidate)],
      prior_policy_decisions: [],
      policy_state: buildPolicyState(),
      startup_state: buildStartupState({ primary: false, guardrail: true }),
      created_at: "2026-03-10T00:00:00.000Z",
    });
    expect(missingPrimary.decision_records[0]?.chosen_action).toBe("lp-do-fact-find");

    const missingGuardrail = governRouteDecisions({
      ranked_candidates: [buildCandidate],
      route_decisions: [buildRouteDecision(buildCandidate)],
      prior_policy_decisions: [],
      policy_state: buildPolicyState(),
      startup_state: buildStartupState({ primary: true, guardrail: false }),
      created_at: "2026-03-10T00:00:00.000Z",
    });
    expect(missingGuardrail.decision_records[0]?.chosen_action).toBe("lp-do-plan");
    expect(missingGuardrail.decision_records[0]?.utility.downside_penalty).toBeGreaterThan(
      buildCandidate.score.utility.downside_penalty,
    );
  });

  it("TASK-12 TC-02 preserves recent portfolio/exploration choices and blocks fresh additions inside the hold window", () => {
    const candidateA = buildRankedCandidate({ id: "cand-a", route: "lp-do-build", utility: 2.6 });
    const candidateB = buildRankedCandidate({ id: "cand-b", route: "lp-do-build", utility: 3.1 });
    const policyState = buildPolicyState();

    const governedPortfolio = governPortfolioSelections({
      ranked_candidates: [candidateA, candidateB],
      decision_records: [
        buildPortfolioDecision(candidateA, "deferred"),
        buildPortfolioDecision(candidateB, "selected"),
      ],
      prior_policy_decisions: [
        {
          ...buildPortfolioDecision(candidateA, "selected"),
          decision_id: "prior-portfolio-a",
          created_at: "2026-03-08T00:00:00.000Z",
        },
        {
          ...buildPortfolioDecision(candidateB, "deferred"),
          decision_id: "prior-portfolio-b",
          created_at: "2026-03-08T00:00:00.000Z",
        },
      ],
      policy_state: policyState,
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect([...governedPortfolio.selected_candidate_ids]).toEqual(["cand-a"]);
    expect(
      governedPortfolio.decision_records.find((decision) => decision.candidate_id === "cand-a")
        ?.chosen_action,
    ).toBe("selected");
    expect(
      governedPortfolio.decision_records.find((decision) => decision.candidate_id === "cand-b")
        ?.chosen_action,
    ).toBe("deferred");
    expect(governedPortfolio.override_records).toHaveLength(2);

    const governedExploration = governExplorationSelections({
      decision_records: [
        buildExplorationDecision(candidateA, "baseline_selected"),
        buildExplorationDecision(candidateB, "prioritized"),
      ],
      prior_policy_decisions: [
        {
          ...buildExplorationDecision(candidateA, "prioritized"),
          decision_id: "prior-exploration-a",
          created_at: "2026-03-08T00:00:00.000Z",
        },
        {
          ...buildExplorationDecision(candidateB, "baseline_selected"),
          decision_id: "prior-exploration-b",
          created_at: "2026-03-08T00:00:00.000Z",
        },
      ],
      policy_state: policyState,
      selected_candidate_ids: governedPortfolio.selected_candidate_ids,
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect([...governedExploration.prioritized_candidate_ids]).toEqual(["cand-a"]);
    expect(
      governedExploration.decision_records.find((decision) => decision.candidate_id === "cand-a")
        ?.chosen_action,
    ).toBe("prioritized");
    expect(
      governedExploration.decision_records.find((decision) => decision.candidate_id === "cand-b")
        ?.chosen_action,
    ).toBe("baseline_selected");
    expect(governedExploration.override_records).toHaveLength(2);
  });
});
