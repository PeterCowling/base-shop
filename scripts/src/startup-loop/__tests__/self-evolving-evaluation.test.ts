import { describe, expect, it } from "@jest/globals";

import type { QueueDispatch } from "../ideas/lp-do-ideas-queue-state-file.js";
import type {
  ImprovementOutcome,
  PolicyDecisionRecord,
} from "../self-evolving/self-evolving-contracts.js";
import { buildPolicyEvaluationDataset } from "../self-evolving/self-evolving-evaluation.js";
import type { SelfEvolvingEvent } from "../self-evolving/self-evolving-events.js";

function buildDecision(overrides: Partial<PolicyDecisionRecord> = {}): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: "decision-1",
    business_id: "BRIK",
    candidate_id: "cand-1",
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: "context-1",
    structural_snapshot: {
      snapshot_id: "snapshot-1",
      candidate_id: "cand-1",
      business_id: "BRIK",
      captured_at: "2026-03-09T00:00:00.000Z",
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-plan",
      recurrence_count_window: 3,
      operator_minutes_estimate: 20,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [],
    },
    belief_state_id: "belief-1",
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-plan",
    action_probability: null,
    utility: {
      expected_reward: 3,
      downside_penalty: 0.2,
      effort_penalty: 0.5,
      evidence_penalty: 0,
      instability_penalty: 0.1,
      exploration_bonus: 0,
      net_utility: 2.2,
    },
    created_at: "2026-03-09T00:00:00.000Z",
    ...overrides,
  };
}

function buildDispatch(overrides: Partial<QueueDispatch> = {}): QueueDispatch {
  return {
    dispatch_id: "dispatch-1",
    business: "BRIK",
    status: "completed",
    queue_state: "completed",
    created_at: "2026-03-09T00:05:00.000Z",
    self_evolving: {
      candidate_id: "cand-1",
      decision_id: "decision-1",
      policy_version: "self-evolving-policy.v1",
      recommended_route_origin: "lp-do-plan",
      executor_path: "lp-do-build:container:website-v3",
      handoff_emitted_at: "2026-03-09T00:05:00.000Z",
    },
    completed_by: {
      completed_at: "2026-03-10T00:00:00.000Z",
      outcome: "Shipped",
      plan_path: "docs/plans/example/plan.md",
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        dispatch_id: "dispatch-1",
        maturity_due_at: "2026-03-10T00:00:00.000Z",
        maturity_status: "matured",
        measurement_status: "verified",
        outcome_event_id: "event-1",
        verified_observation_ids: ["obs-1"],
      },
    },
    ...overrides,
  };
}

function buildOutcomeEvent(input: {
  eventId: string;
  decisionId: string;
  dispatchId?: string;
  measurementStatus: NonNullable<ImprovementOutcome["measurement_status"]>;
  maturityStatus: NonNullable<ImprovementOutcome["maturity_status"]>;
  eventType?: "outcome_recorded" | "outcome_missing";
  reasonCode?: string;
}): SelfEvolvingEvent {
  const baseOutcome: ImprovementOutcome = {
    schema_version: "outcome.v2",
    candidate_id: "cand-1",
    dispatch_id: input.dispatchId ?? "dispatch-1",
    decision_id: input.decisionId,
    policy_version: "self-evolving-policy.v1",
    implementation_status: "success",
    promoted_at: null,
    maturity_status: input.maturityStatus,
    measurement_status: input.measurementStatus,
    baseline_window: "baseline",
    post_window: "2026-03-10T00:00:00.000Z",
    measured_impact: 0.2,
    impact_confidence: 0.8,
    regressions_detected: 0,
    rollback_executed_at: null,
    kept_or_reverted: "kept",
    measurement_observation_ids: ["obs-1"],
    outcome_source_path: "docs/plans/example/plan.md",
    root_cause_notes: "test",
    follow_up_actions: [],
  };

  return {
    schema_version: "event.v2",
    event_id: input.eventId,
    correlation_id: "cand-1",
    run_id: "run-1",
    session_id: "session-1",
    timestamp: "2026-03-10T00:00:00.000Z",
    source_component: "test",
    status: input.eventType === "outcome_missing" ? "blocked" : "ok",
    inputs_hash: "hash-1",
    outputs_hash: "hash-1",
    error_class: null,
    artifact_refs: ["docs/plans/example/plan.md"],
    effect_class: null,
    effect_reversibility: null,
    event_type: input.eventType ?? "outcome_recorded",
    lifecycle: {
      candidate_id: "cand-1",
      dispatch_id: input.dispatchId ?? "dispatch-1",
      outcome: input.eventType === "outcome_missing" ? null : baseOutcome,
      outcome_missing:
        input.eventType === "outcome_missing"
          ? {
              reason_code: input.reasonCode ?? "metric_not_available",
              detail: "missing metric",
              expected_artifact_ref: "docs/plans/example/plan.md",
            }
          : null,
    },
  };
}

describe("buildPolicyEvaluationDataset", () => {
  it("TASK-16 TC-01 classifies observed, pending, missing, and censored records", () => {
    const decisions = [
      buildDecision({ decision_id: "decision-observed", candidate_id: "cand-observed" }),
      buildDecision({ decision_id: "decision-pending", candidate_id: "cand-pending" }),
      buildDecision({
        decision_id: "decision-missing",
        candidate_id: "cand-missing",
        action_probability: 0.35,
        decision_mode: "stochastic",
      }),
      buildDecision({ decision_id: "decision-censored", candidate_id: "cand-censored" }),
      buildDecision({
        decision_id: "decision-portfolio",
        candidate_id: "cand-observed",
        decision_type: "portfolio_selection",
        chosen_action: "selected",
        eligible_actions: ["selected", "deferred"],
        portfolio_selection: {
          schema_version: "portfolio-selection.v1",
          portfolio_id: "portfolio-1",
          candidate_set_hash: "set-1",
          candidate_count: 4,
          selected_candidate_ids: ["cand-observed"],
          solver_status: "optimal",
          objective_value: 2.2,
          constraint_bindings: [
            {
              key: "wip_cap",
              max: 2,
              observed_value: 1,
              binding: false,
            },
          ],
          graph_snapshot_id: "graph-1",
          survival_snapshot_id: "survival-1",
          signal_snapshot: {
            graph_bottleneck_score: 0.1,
            shared_executor_candidate_count: 0,
            shared_constraint_candidate_count: 0,
            structural_penalty: 0.02,
            survival_status: "estimated",
            median_verified_days: 7,
            unresolved_after_hold_probability: 0.4,
            missing_outcome_rate: 0.1,
            survival_penalty: 0.15,
            adjusted_utility: 2.03,
          },
        },
      }),
    ];

    const dispatches: QueueDispatch[] = [
      buildDispatch({
        dispatch_id: "dispatch-observed",
        self_evolving: {
          candidate_id: "cand-observed",
          decision_id: "decision-observed",
          policy_version: "self-evolving-policy.v1",
          recommended_route_origin: "lp-do-plan",
          executor_path: "lp-do-build:container:website-v3",
          handoff_emitted_at: "2026-03-09T00:05:00.000Z",
        },
        completed_by: {
          completed_at: "2026-03-10T00:00:00.000Z",
          outcome: "observed",
          plan_path: "docs/plans/example/plan.md",
          self_evolving: {
            candidate_id: "cand-observed",
            decision_id: "decision-observed",
            dispatch_id: "dispatch-observed",
            maturity_due_at: "2026-03-10T00:00:00.000Z",
            maturity_status: "matured",
            measurement_status: "verified",
            outcome_event_id: "event-observed",
            verified_observation_ids: ["obs-1"],
          },
        },
      }),
      buildDispatch({
        dispatch_id: "dispatch-pending",
        self_evolving: {
          candidate_id: "cand-pending",
          decision_id: "decision-pending",
          policy_version: "self-evolving-policy.v1",
          recommended_route_origin: "lp-do-plan",
          executor_path: "lp-do-build:container:website-v3",
          handoff_emitted_at: "2026-03-09T00:05:00.000Z",
        },
        completed_by: {
          completed_at: "2026-03-10T00:00:00.000Z",
          outcome: "pending",
          plan_path: "docs/plans/example/plan.md",
          self_evolving: {
            candidate_id: "cand-pending",
            decision_id: "decision-pending",
            dispatch_id: "dispatch-pending",
            maturity_due_at: "2026-03-12T00:00:00.000Z",
            maturity_status: "pending",
            measurement_status: "pending",
            outcome_event_id: null,
            verified_observation_ids: [],
          },
        },
      }),
      buildDispatch({
        dispatch_id: "dispatch-missing",
        self_evolving: {
          candidate_id: "cand-missing",
          decision_id: "decision-missing",
          policy_version: "self-evolving-policy.v1",
          recommended_route_origin: "lp-do-build",
          executor_path: "lp-do-build:container:website-v3",
          handoff_emitted_at: "2026-03-09T00:05:00.000Z",
        },
        completed_by: {
          completed_at: "2026-03-11T00:00:00.000Z",
          outcome: "missing",
          plan_path: "docs/plans/example/plan.md",
          self_evolving: {
            candidate_id: "cand-missing",
            decision_id: "decision-missing",
            dispatch_id: "dispatch-missing",
            maturity_due_at: "2026-03-11T00:00:00.000Z",
            maturity_status: "matured",
            measurement_status: "missing",
            outcome_event_id: "event-missing",
            verified_observation_ids: [],
          },
        },
      }),
    ];

    const dataset = buildPolicyEvaluationDataset({
      decisions,
      queue_dispatches: dispatches,
      lifecycle_events: [
        buildOutcomeEvent({
          eventId: "event-observed",
          decisionId: "decision-observed",
          dispatchId: "dispatch-observed",
          measurementStatus: "verified",
          maturityStatus: "matured",
        }),
        buildOutcomeEvent({
          eventId: "event-missing",
          decisionId: "decision-missing",
          dispatchId: "dispatch-missing",
          measurementStatus: "missing",
          maturityStatus: "matured",
          eventType: "outcome_missing",
          reasonCode: "metric_not_available",
        }),
      ],
      now: new Date("2026-03-12T00:00:00.000Z"),
    });

    expect(dataset.summary).toEqual(
      expect.objectContaining({
        total_decisions: 4,
        observed_decisions: 1,
        pending_decisions: 1,
        missing_decisions: 1,
        censored_decisions: 1,
        replay_ready_decisions: 1,
        deterministic_decisions: 3,
        stochastic_decisions: 1,
      }),
    );

    const missingRecord = dataset.records.find(
      (record) => record.decision_id === "decision-missing",
    );
    expect(missingRecord?.evaluation_status).toBe("missing");
    expect(missingRecord?.outcome_reason_code).toBe("metric_not_available");

    const observedRecord = dataset.records.find(
      (record) => record.decision_id === "decision-observed",
    );
    expect(observedRecord).toEqual(
      expect.objectContaining({
        evaluation_status: "observed",
        implementation_status: "success",
        positive_outcome: true,
        measured_impact: 0.2,
      }),
    );

    const censoredRecord = dataset.records.find(
      (record) => record.decision_id === "decision-censored",
    );
    expect(censoredRecord?.evaluation_status).toBe("censored");
    expect(censoredRecord?.queue_state).toBeNull();
  });

  it("TASK-16 TC-02 falls back to lifecycle outcomes when queue completion state is absent", () => {
    const dataset = buildPolicyEvaluationDataset({
      decisions: [
        buildDecision({
          decision_id: "decision-observed",
          candidate_id: "cand-observed",
        }),
      ],
      queue_dispatches: [],
      lifecycle_events: [
        buildOutcomeEvent({
          eventId: "event-observed",
          decisionId: "decision-observed",
          dispatchId: "dispatch-observed",
          measurementStatus: "verified_degraded",
          maturityStatus: "matured",
        }),
      ],
      now: new Date("2026-03-12T00:00:00.000Z"),
    });

    expect(dataset.records[0]).toEqual(
      expect.objectContaining({
        decision_id: "decision-observed",
        dispatch_id: "dispatch-observed",
        evaluation_status: "observed",
        evaluation_ready: true,
        measurement_status: "verified_degraded",
        outcome_source_path: "docs/plans/example/plan.md",
        positive_outcome: true,
      }),
    );
  });
});
