import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type { PolicyDecisionRecord } from "../self-evolving/self-evolving-contracts.js";
import { buildPortfolioSelection } from "../self-evolving/self-evolving-portfolio.js";

function buildRankedCandidate(input: {
  id: string;
  route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  evidence: "measured" | "instrumented" | "structural_only";
  blastRadius: "small" | "medium" | "large";
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
      executor_path: input.route === "lp-do-build" ? "lp-do-build:website" : `executor:${input.route}`,
      change_scope: "business_only",
      applicability_predicates: ["business=BRIK"],
      expected_benefit: "benefit",
      risk_level: "low",
      blast_radius_tag: input.blastRadius,
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
        classification: input.evidence,
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
        evidence_weight: 0.6,
        evidence_floor_met: true,
        fallback_reason: null,
      },
    },
    route: { route: input.route, reason: "test" },
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
      recommended_route_hint: candidate.route.route,
      recurrence_count_window: 3,
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: candidate.score.evidence.classification,
      blast_radius_tag: candidate.candidate.blast_radius_tag,
      risk_level: candidate.candidate.risk_level,
      estimated_effort: candidate.candidate.estimated_effort,
      constraint_refs: [`route:${candidate.route.route}`],
    },
    belief_state_id: candidate.policy_context?.belief_state_id ?? `belief-${candidate.candidate.candidate_id}`,
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: candidate.route.route,
    action_probability: null,
    utility: candidate.score.utility,
    created_at: "2026-03-10T00:00:00.000Z",
  };
}

describe("buildPortfolioSelection", () => {
  it("TASK-07 TC-01 selects the best feasible portfolio under route and evidence constraints", () => {
    const rankedCandidates = [
      buildRankedCandidate({
        id: "cand-build-good",
        route: "lp-do-build",
        evidence: "measured",
        blastRadius: "small",
        utility: 3,
      }),
      buildRankedCandidate({
        id: "cand-build-blocked",
        route: "lp-do-build",
        evidence: "measured",
        blastRadius: "large",
        utility: 5,
      }),
      buildRankedCandidate({
        id: "cand-plan-weak",
        route: "lp-do-plan",
        evidence: "structural_only",
        blastRadius: "small",
        utility: 4,
      }),
      buildRankedCandidate({
        id: "cand-fact-find",
        route: "lp-do-fact-find",
        evidence: "structural_only",
        blastRadius: "small",
        utility: 1.5,
      }),
    ];

    const selection = buildPortfolioSelection({
      business_id: "BRIK",
      ranked_candidates: rankedCandidates,
      candidate_route_decisions: rankedCandidates.map(buildRouteDecision),
      constraint_profile: {
        schema_version: "constraint-profile.v1",
        wip_cap: 2,
        max_candidates_per_route: {
          "lp-do-build": 1,
          "lp-do-plan": 1,
          "lp-do-fact-find": 2,
        },
        max_guarded_trial_blast_radius: "medium",
        minimum_evidence_floor: "instrumented",
        hold_window_days: 7,
      },
      dependency_graph: null,
      survival_signals: null,
      created_at: "2026-03-10T00:00:00.000Z",
    });

    expect([...selection.selected_candidate_ids].sort()).toEqual([
      "cand-build-good",
      "cand-fact-find",
    ]);
    expect(selection.decision_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate_id: "cand-build-good",
          chosen_action: "selected",
          decision_type: "portfolio_selection",
        }),
        expect.objectContaining({
          candidate_id: "cand-build-blocked",
          chosen_action: "deferred",
        }),
        expect.objectContaining({
          candidate_id: "cand-plan-weak",
          chosen_action: "deferred",
        }),
      ]),
    );
  });
});
