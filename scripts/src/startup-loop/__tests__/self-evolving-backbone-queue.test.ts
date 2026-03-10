import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  enqueueBackboneCandidates,
  readBackboneQueue,
} from "../self-evolving/self-evolving-backbone-queue.js";
import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import { createDefaultPolicyState } from "../self-evolving/self-evolving-scoring.js";
import {
  createStartupStateStore,
  writePolicyState,
} from "../self-evolving/self-evolving-startup-state.js";

function buildRankedCandidate(input: {
  id: string;
  priority: number;
  portfolioSelected: boolean;
  portfolioAdjustedUtility: number | null;
  explorationApplied?: boolean;
  explorationMode?: "off" | "shadow" | "advisory" | "guarded_trial" | null;
}): RankedCandidate {
  return {
    candidate: {
      schema_version: "candidate.v1",
      candidate_id: input.id,
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: `Candidate ${input.id}`,
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
      validation_contract: "validation",
      rollout_plan: "rollout",
      rollback_contract: "rollback",
      kill_switch: "kill-switch",
      blocked_reason_code: null,
      unblock_requirements: [],
      blocked_since: null,
      expiry_at: "2026-04-01T00:00:00.000Z",
    },
    score: {
      priority_score_v1: input.priority,
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
        expected_reward: input.priority + 1,
        downside_penalty: 0.2,
        effort_penalty: 0.4,
        evidence_penalty: 0.1,
        instability_penalty: 0.1,
        exploration_bonus: 0,
        net_utility: input.priority,
      },
      policy: {
        policy_version: "self-evolving-policy.v1",
        utility_version: "self-evolving-utility.v1",
        prior_family_version: "self-evolving-priors.v1",
        belief_state_id: `belief-${input.id}`,
        structural_snapshot_id: `snapshot-${input.id}`,
        evidence_weight: 0.7,
        evidence_floor_met: true,
        fallback_reason: null,
      },
    },
    route: {
      route: "lp-do-build",
      reason: "test-route",
    },
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
      portfolio_decision_id: `portfolio-${input.id}`,
      portfolio_selected: input.portfolioSelected,
      portfolio_selected_at: "2026-03-10T00:00:00.000Z",
      portfolio_adjusted_utility: input.portfolioAdjustedUtility,
      exploration_decision_id: `exploration-${input.id}`,
      exploration_mode: input.explorationMode ?? null,
      exploration_selected: false,
      exploration_selected_at: null,
      exploration_priority_score: null,
      exploration_applied: input.explorationApplied ?? false,
    },
  };
}

describe("enqueueBackboneCandidates authority gating", () => {
  it("TASK-17 TC-02 keeps shadow queue ordering on baseline priority instead of portfolio selections", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-backbone-shadow-"));
    const entries = enqueueBackboneCandidates(
      tempRoot,
      "BRIK",
      [
        buildRankedCandidate({
          id: "cand-high-priority",
          priority: 9,
          portfolioSelected: false,
          portfolioAdjustedUtility: 1,
        }),
        buildRankedCandidate({
          id: "cand-selected",
          priority: 1,
          portfolioSelected: true,
          portfolioAdjustedUtility: 10,
        }),
      ],
      new Date("2026-03-10T00:00:00.000Z"),
    );

    expect(entries.entries.map((entry) => entry.candidate_id)).toEqual([
      "cand-high-priority",
      "cand-selected",
    ]);
    expect(readBackboneQueue(tempRoot, "BRIK").map((entry) => entry.candidate_id)).toEqual([
      "cand-high-priority",
      "cand-selected",
    ]);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-17 TC-03 lets guarded trial queue ordering honor portfolio selections", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-backbone-guarded-"));
    const store = createStartupStateStore(tempRoot);
    const policyState = createDefaultPolicyState("BRIK", "2026-03-10T00:00:00.000Z");
    writePolicyState(store, {
      ...policyState,
      authority_level: "guarded_trial",
      updated_at: "2026-03-10T00:00:00.000Z",
    });

    const entries = enqueueBackboneCandidates(
      tempRoot,
      "BRIK",
      [
        buildRankedCandidate({
          id: "cand-high-priority",
          priority: 9,
          portfolioSelected: false,
          portfolioAdjustedUtility: 1,
        }),
        buildRankedCandidate({
          id: "cand-selected",
          priority: 1,
          portfolioSelected: true,
          portfolioAdjustedUtility: 10,
        }),
      ],
      new Date("2026-03-10T00:00:00.000Z"),
    );

    expect(entries.entries.map((entry) => entry.candidate_id)).toEqual([
      "cand-selected",
      "cand-high-priority",
    ]);
    expect(readBackboneQueue(tempRoot, "BRIK").map((entry) => entry.candidate_id)).toEqual([
      "cand-selected",
      "cand-high-priority",
    ]);
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
