import { describe, expect, it } from "@jest/globals";

import type { QueueDispatch } from "../ideas/lp-do-ideas-queue-state-file.js";
import type {
  ImprovementOutcome,
  PolicyDecisionRecord,
} from "../self-evolving/self-evolving-contracts.js";
import { buildPolicyEvaluationDataset } from "../self-evolving/self-evolving-evaluation.js";
import type { SelfEvolvingEvent } from "../self-evolving/self-evolving-events.js";
import { buildPolicyAuditTelemetry } from "../self-evolving/self-evolving-policy-audit.js";

function buildRouteDecision(input: {
  decisionId: string;
  candidateId: string;
  createdAt: string;
  policyVersion: string;
  predictedPositiveImpact: number;
}): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: input.decisionId,
    business_id: "BRIK",
    candidate_id: input.candidateId,
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: input.policyVersion,
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: `context-${input.decisionId}`,
    structural_snapshot: {
      snapshot_id: `snapshot-${input.candidateId}`,
      candidate_id: input.candidateId,
      business_id: "BRIK",
      captured_at: input.createdAt,
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-plan",
      recurrence_count_window: 3,
      operator_minutes_estimate: 15,
      quality_impact_estimate: 0.5,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [],
    },
    belief_state_id: `belief-${input.candidateId}`,
    belief_audit: {
      schema_version: "policy-belief-audit.v1",
      success_probability_mean: input.predictedPositiveImpact,
      positive_impact_probability_mean: input.predictedPositiveImpact,
      guardrail_breach_probability_mean: 0.08,
      evidence_weight: 0.9,
      evidence_floor_met: true,
    },
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-plan",
    action_probability: null,
    utility: {
      expected_reward: 3,
      downside_penalty: 0.3,
      effort_penalty: 0.6,
      evidence_penalty: 0,
      instability_penalty: 0.1,
      exploration_bonus: 0,
      net_utility: 2,
    },
    created_at: input.createdAt,
  };
}

function buildDispatch(input: {
  dispatchId: string;
  decisionId: string;
  candidateId: string;
  createdAt: string;
  completedAt: string;
}): QueueDispatch {
  return {
    dispatch_id: input.dispatchId,
    business: "BRIK",
    status: "completed",
    queue_state: "completed",
    created_at: input.createdAt,
    self_evolving: {
      candidate_id: input.candidateId,
      decision_id: input.decisionId,
      policy_version: "self-evolving-policy.v1",
      recommended_route_origin: "lp-do-plan",
      executor_path: "lp-do-build:container:website-v3",
      handoff_emitted_at: input.createdAt,
    },
    completed_by: {
      completed_at: input.completedAt,
      outcome: "observed",
      plan_path: "docs/plans/example/plan.md",
      self_evolving: {
        candidate_id: input.candidateId,
        decision_id: input.decisionId,
        dispatch_id: input.dispatchId,
        maturity_due_at: input.completedAt,
        maturity_status: "matured",
        measurement_status: "verified",
        outcome_event_id: `event-${input.decisionId}`,
        verified_observation_ids: [`obs-${input.candidateId}`],
      },
    },
  };
}

function buildOutcomeEvent(input: {
  decisionId: string;
  dispatchId: string;
  candidateId: string;
  completedAt: string;
  positive: boolean;
}): SelfEvolvingEvent {
  const outcome: ImprovementOutcome = {
    schema_version: "outcome.v2",
    candidate_id: input.candidateId,
    dispatch_id: input.dispatchId,
    decision_id: input.decisionId,
    policy_version: "self-evolving-policy.v1",
    implementation_status: "success",
    promoted_at: null,
    maturity_status: "matured",
    measurement_status: "verified",
    baseline_window: "baseline",
    post_window: "2026-03-10T00:00:00.000Z",
    measured_impact: input.positive ? 0.2 : -0.1,
    impact_confidence: 0.8,
    regressions_detected: 0,
    rollback_executed_at: null,
    kept_or_reverted: input.positive ? "kept" : "not_kept",
    measurement_observation_ids: [`obs-${input.candidateId}`],
    outcome_source_path: "docs/plans/example/plan.md",
    root_cause_notes: "test",
    follow_up_actions: [],
  };

  return {
    schema_version: "event.v2",
    event_id: `event-${input.decisionId}`,
    correlation_id: input.candidateId,
    run_id: "run-1",
    session_id: "session-1",
    timestamp: input.completedAt,
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
      candidate_id: input.candidateId,
      dispatch_id: input.dispatchId,
      outcome,
    },
  };
}

function buildExplorationDecision(input: {
  baseDecision: PolicyDecisionRecord;
  batchId: string;
  chosenAction: "prioritized" | "baseline_selected";
  actionProbability: number;
}): PolicyDecisionRecord {
  return {
    ...input.baseDecision,
    decision_id: `exploration-${input.baseDecision.candidate_id}`,
    decision_type: "exploration_rank",
    decision_mode: "stochastic",
    decision_context_id: input.batchId,
    eligible_actions: ["prioritized", "baseline_selected"],
    chosen_action: input.chosenAction,
    action_probability: input.actionProbability,
    exploration_rank: {
      schema_version: "exploration-rank.v1",
      exploration_batch_id: input.batchId,
      candidate_set_hash: "set-1",
      portfolio_id: "portfolio-1",
      policy_mode: "advisory",
      budget_slots: 1,
      seed: 42,
      prioritized_candidate_ids:
        input.chosenAction === "prioritized"
          ? [input.baseDecision.candidate_id]
          : ["cand-a"],
      signal_snapshot: {
        baseline_adjusted_utility: input.baseDecision.utility.net_utility,
        sampled_success_probability: 0.6,
        sampled_impact_probability: 0.55,
        uncertainty_width: 0.35,
        context_weight: 0.04,
        exploration_bonus: 0.12,
        exploration_score: input.baseDecision.utility.net_utility + 0.12,
      },
    },
    portfolio_selection: null,
    promotion_gate: null,
  };
}

function buildOverrideRecord(baseDecision: PolicyDecisionRecord): PolicyDecisionRecord {
  return {
    ...baseDecision,
    decision_id: `override-${baseDecision.candidate_id}`,
    decision_type: "override_record",
    decision_mode: "deterministic",
    eligible_actions: ["current:lp-do-build", "governed:lp-do-plan"],
    chosen_action: "governed:hold_window_active:lp-do-plan",
    action_probability: 1,
    portfolio_selection: null,
    exploration_rank: null,
    promotion_gate: null,
  };
}

describe("buildPolicyAuditTelemetry", () => {
  it("TASK-13 TC-01 computes deterministic calibration and policy-version comparisons", () => {
    const routeDecisions = [
      buildRouteDecision({
        decisionId: "decision-a",
        candidateId: "cand-a",
        createdAt: "2026-03-09T00:00:00.000Z",
        policyVersion: "self-evolving-policy.v1",
        predictedPositiveImpact: 0.8,
      }),
      buildRouteDecision({
        decisionId: "decision-b",
        candidateId: "cand-b",
        createdAt: "2026-03-09T00:00:00.000Z",
        policyVersion: "self-evolving-policy.v2",
        predictedPositiveImpact: 0.3,
      }),
    ];

    const dataset = buildPolicyEvaluationDataset({
      decisions: routeDecisions,
      queue_dispatches: [
        buildDispatch({
          dispatchId: "dispatch-a",
          decisionId: "decision-a",
          candidateId: "cand-a",
          createdAt: "2026-03-09T00:05:00.000Z",
          completedAt: "2026-03-10T00:00:00.000Z",
        }),
        buildDispatch({
          dispatchId: "dispatch-b",
          decisionId: "decision-b",
          candidateId: "cand-b",
          createdAt: "2026-03-09T00:05:00.000Z",
          completedAt: "2026-03-10T00:00:00.000Z",
        }),
      ],
      lifecycle_events: [
        buildOutcomeEvent({
          decisionId: "decision-a",
          dispatchId: "dispatch-a",
          candidateId: "cand-a",
          completedAt: "2026-03-10T00:00:00.000Z",
          positive: true,
        }),
        buildOutcomeEvent({
          decisionId: "decision-b",
          dispatchId: "dispatch-b",
          candidateId: "cand-b",
          completedAt: "2026-03-10T00:00:00.000Z",
          positive: false,
        }),
      ],
    });

    const audit = buildPolicyAuditTelemetry({
      decisions: routeDecisions,
      evaluation_dataset: dataset,
      generated_at: "2026-03-12T00:00:00.000Z",
    });

    expect(audit.belief_quality.calibration).toEqual(
      expect.objectContaining({
        status: "measured",
        sample_size: 2,
        positive_outcome_count: 1,
        mean_predicted_positive_probability: 0.55,
        observed_positive_rate: 0.5,
        brier_score: 0.065,
      }),
    );
    expect(audit.policy_quality.policy_version_comparison).toEqual([
      expect.objectContaining({
        policy_version: "self-evolving-policy.v1",
        positive_outcome_rate: 1,
        calibration_gap: 0.2,
      }),
      expect.objectContaining({
        policy_version: "self-evolving-policy.v2",
        positive_outcome_rate: 0,
        calibration_gap: -0.3,
      }),
    ]);
  });

  it("TASK-13 TC-02 and TC-03 compute replay-backed regret and override attribution", () => {
    const routeDecisionA = buildRouteDecision({
      decisionId: "decision-a",
      candidateId: "cand-a",
      createdAt: "2026-03-11T00:00:00.000Z",
      policyVersion: "self-evolving-policy.v2",
      predictedPositiveImpact: 0.65,
    });
    const routeDecisionB = buildRouteDecision({
      decisionId: "decision-b",
      candidateId: "cand-b",
      createdAt: "2026-03-11T00:00:00.000Z",
      policyVersion: "self-evolving-policy.v2",
      predictedPositiveImpact: 0.45,
    });
    const explorationDecisions = [
      buildExplorationDecision({
        baseDecision: routeDecisionA,
        batchId: "batch-1",
        chosenAction: "prioritized",
        actionProbability: 0.62,
      }),
      buildExplorationDecision({
        baseDecision: routeDecisionB,
        batchId: "batch-1",
        chosenAction: "baseline_selected",
        actionProbability: 0.38,
      }),
    ];

    const dataset = buildPolicyEvaluationDataset({
      decisions: [routeDecisionA, routeDecisionB],
      queue_dispatches: [
        buildDispatch({
          dispatchId: "dispatch-a",
          decisionId: "decision-a",
          candidateId: "cand-a",
          createdAt: "2026-03-11T00:05:00.000Z",
          completedAt: "2026-03-12T00:00:00.000Z",
        }),
        buildDispatch({
          dispatchId: "dispatch-b",
          decisionId: "decision-b",
          candidateId: "cand-b",
          createdAt: "2026-03-11T00:05:00.000Z",
          completedAt: "2026-03-12T00:00:00.000Z",
        }),
      ],
      lifecycle_events: [
        buildOutcomeEvent({
          decisionId: "decision-a",
          dispatchId: "dispatch-a",
          candidateId: "cand-a",
          completedAt: "2026-03-12T00:00:00.000Z",
          positive: false,
        }),
        buildOutcomeEvent({
          decisionId: "decision-b",
          dispatchId: "dispatch-b",
          candidateId: "cand-b",
          completedAt: "2026-03-12T00:00:00.000Z",
          positive: true,
        }),
      ],
    });

    const audit = buildPolicyAuditTelemetry({
      decisions: [
        routeDecisionA,
        routeDecisionB,
        ...explorationDecisions,
        buildOverrideRecord(routeDecisionA),
      ],
      evaluation_dataset: dataset,
      generated_at: "2026-03-12T00:00:00.000Z",
    });

    expect(audit.policy_quality.exploration_regret).toEqual(
      expect.objectContaining({
        status: "measured",
        total_batches: 1,
        measured_batches: 1,
        total_regret: 1,
        average_regret: 1,
      }),
    );
    expect(audit.policy_quality.exploration_regret.batches[0]).toEqual(
      expect.objectContaining({
        exploration_batch_id: "batch-1",
        chosen_positive_count: 0,
        optimal_positive_count: 1,
        regret: 1,
      }),
    );
    expect(audit.operator_intervention.overrides).toEqual(
      expect.objectContaining({
        total_overrides: 1,
        overridden_candidates: 1,
        route_overrides: 1,
        overridden_outcomes: expect.objectContaining({
          sample_size: 1,
          positive_outcome_rate: 0,
        }),
        non_overridden_outcomes: expect.objectContaining({
          sample_size: 1,
          positive_outcome_rate: 1,
        }),
      }),
    );
    expect(audit.operator_intervention.overrides.reason_breakdown).toEqual([
      expect.objectContaining({
        reason_code: "hold_window_active",
        count: 1,
        source_layer: "route",
      }),
    ]);
  });
});
