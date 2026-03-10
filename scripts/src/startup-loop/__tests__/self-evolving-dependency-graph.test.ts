import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type { PolicyDecisionRecord } from "../self-evolving/self-evolving-contracts.js";
import { buildDependencyGraphSnapshot } from "../self-evolving/self-evolving-dependency-graph.js";

function buildRankedCandidate(id: string, executorPath: string, triggerObservations: string[]): RankedCandidate {
  return {
    candidate: {
      schema_version: "candidate.v1",
      candidate_id: id,
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: triggerObservations,
      executor_path: executorPath,
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
      priority_score_v1: 3,
      priority_score_v2: null,
      autonomy_cap: 2,
      reasons: [],
      evidence: {
        classification: "instrumented",
        requirements_met: 4,
        requirements_total: 6,
        readiness_ratio: 0.66,
        missing_requirements: ["minimum_sample_size"],
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
          successes: 0,
          observed_rate: 0,
          posterior_mean: 0.25,
          lower_credible_bound: 0,
          upper_credible_bound: 0.8,
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
        belief_state_id: `belief-${id}`,
        structural_snapshot_id: `snapshot-${id}`,
        evidence_weight: 0.6,
        evidence_floor_met: true,
        fallback_reason: null,
      },
    },
    route: { route: "lp-do-plan", reason: "test" },
    source_hard_signature: `sig-${id}`,
    generated_at: "2026-03-10T00:00:00.000Z",
    policy_context: {
      decision_id: `decision-${id}`,
      decision_context_id: `context-${id}`,
      policy_version: "self-evolving-policy.v1",
      utility_version: "self-evolving-utility.v1",
      prior_family_version: "self-evolving-priors.v1",
      belief_state_id: `belief-${id}`,
      structural_snapshot_id: `snapshot-${id}`,
    },
  };
}

function buildDecision(id: string, constraintRefs: string[]): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: `decision-${id}`,
    business_id: "BRIK",
    candidate_id: id,
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: `context-${id}`,
    structural_snapshot: {
      snapshot_id: `snapshot-${id}`,
      candidate_id: id,
      business_id: "BRIK",
      captured_at: "2026-03-10T00:00:00.000Z",
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-plan",
      recurrence_count_window: 3,
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: constraintRefs,
    },
    belief_state_id: `belief-${id}`,
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-plan",
    action_probability: null,
    utility: {
      expected_reward: 3,
      downside_penalty: 0.2,
      effort_penalty: 0.4,
      evidence_penalty: 0,
      instability_penalty: 0.1,
      exploration_bonus: 0,
      net_utility: 2.3,
    },
    created_at: "2026-03-10T00:00:00.000Z",
  };
}

describe("buildDependencyGraphSnapshot", () => {
  it("TASK-08 TC-01 builds deterministic structural bottleneck signals", () => {
    const snapshot = buildDependencyGraphSnapshot({
      business_id: "BRIK",
      ranked_candidates: [
        buildRankedCandidate("cand-1", "lp-do-build:website", ["obs-1", "obs-2"]),
        buildRankedCandidate("cand-2", "lp-do-build:website", ["obs-3"]),
      ],
      policy_decisions: [
        buildDecision("cand-1", ["route:lp-do-plan", "risk:low"]),
        buildDecision("cand-2", ["route:lp-do-plan"]),
      ],
      generated_at: "2026-03-10T00:00:00.000Z",
      snapshot_id: "graph-1",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.node_count).toBeGreaterThan(0);
    expect(snapshot?.edge_count).toBeGreaterThan(0);
    expect(snapshot?.candidate_signals[0]).toEqual(
      expect.objectContaining({
        candidate_id: "cand-1",
        shared_executor_candidate_count: 1,
      }),
    );
  });
});
