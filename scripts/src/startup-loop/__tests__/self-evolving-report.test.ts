import { describe, expect, it } from "@jest/globals";

import type { QueueDispatch } from "../ideas/lp-do-ideas-queue-state-file.js";
import type {
  MetaObservation,
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
  StartupState,
} from "../self-evolving/self-evolving-contracts.js";
import type { SelfEvolvingEvent } from "../self-evolving/self-evolving-events.js";
import { buildSelfEvolvingReportData } from "../self-evolving/self-evolving-report.js";

function buildObservation(): MetaObservation {
  return {
    schema_version: "meta-observation.v2",
    observation_id: "obs-1",
    observation_type: "execution_event",
    timestamp: "2026-03-09T00:00:00.000Z",
    business: "BRIK",
    actor_type: "automation",
    run_id: "run-1",
    session_id: "session-1",
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: ["docs/source.md"],
    context_path: "startup-loop/test",
    hard_signature: "sig-1",
    soft_cluster_id: null,
    fingerprint_version: "1",
    repeat_count_window: 3,
    operator_minutes_estimate: 10,
    quality_impact_estimate: 0.5,
    detector_confidence: 0.8,
    severity: 0.3,
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
    baseline_ref: "baseline",
    measurement_window: "7d",
    traffic_segment: "all",
    evidence_refs: ["docs/evidence.md"],
    evidence_grade: "measured",
    measurement_contract_status: "verified",
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
    authority_level: "shadow",
    active_constraint_profile: {
      schema_version: "constraint-profile.v1",
      wip_cap: 10,
      max_candidates_per_route: { "lp-do-plan": 5 },
      max_guarded_trial_blast_radius: "small",
      minimum_evidence_floor: "instrumented",
      hold_window_days: 7,
    },
    maturity_windows: {
      schema_version: "maturity-window-profile.v1",
      immediate_days: 0,
      short_days: 3,
      medium_days: 7,
      long_days: 14,
    },
    candidate_beliefs: {},
    last_decision_id: "decision-1",
    updated_at: "2026-03-09T00:00:00.000Z",
    updated_by: "agent",
  };
}

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
    updated_at: "2026-03-09T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildDecision(): PolicyDecisionRecord {
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
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.5,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [],
    },
    belief_state_id: "belief-1",
    belief_audit: {
      schema_version: "policy-belief-audit.v1",
      success_probability_mean: 0.72,
      positive_impact_probability_mean: 0.68,
      guardrail_breach_probability_mean: 0.08,
      evidence_weight: 0.9,
      evidence_floor_met: true,
    },
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
    created_at: "2026-03-09T00:00:00.000Z",
  };
}

function buildDispatch(): QueueDispatch {
  return {
    dispatch_id: "dispatch-1",
    queue_state: "completed",
    status: "completed",
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
      outcome: "Observed",
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
  };
}

function buildLifecycleEvent(): SelfEvolvingEvent {
  return {
    schema_version: "event.v2",
    event_id: "event-1",
    correlation_id: "cand-1",
    run_id: "run-1",
    session_id: "session-1",
    timestamp: "2026-03-10T00:00:00.000Z",
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
      candidate_id: "cand-1",
      dispatch_id: "dispatch-1",
      outcome: {
        schema_version: "outcome.v2",
        candidate_id: "cand-1",
        dispatch_id: "dispatch-1",
        decision_id: "decision-1",
        policy_version: "self-evolving-policy.v1",
        implementation_status: "success",
        promoted_at: null,
        maturity_status: "matured",
        measurement_status: "verified",
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
      },
    },
  };
}

describe("buildSelfEvolvingReportData", () => {
  it("TASK-16 TC-03 reports replay-ready evaluation summary without inventing missing data", () => {
    const report = buildSelfEvolvingReportData({
      business: "BRIK",
      generated_at: "2026-03-12T00:00:00.000Z",
      source_paths: {
        observations: "obs.jsonl",
        candidates: "candidates.json",
        startup_state: "startup-state.json",
        policy_state: "policy-state.json",
        policy_decisions: "policy-decisions.jsonl",
        queue_state: "queue-state.json",
        events: "events.jsonl",
      },
      warnings: [],
      observations: [buildObservation()],
      ranked_candidates: [],
      startup_state: buildStartupState(),
      policy_state: buildPolicyState(),
      policy_decisions: [buildDecision()],
      queue_dispatches: [buildDispatch()],
      lifecycle_events: [buildLifecycleEvent()],
    });

    expect(report).toEqual(
      expect.objectContaining({
        startup_state_present: true,
        policy_state_present: true,
        queue_dispatch_count: 1,
      }),
    );
    expect(report.policy_evaluation).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          total_decisions: 1,
          observed_decisions: 1,
          replay_ready_decisions: 1,
        }),
      }),
    );
    expect(report.policy_decisions).toEqual(
      expect.objectContaining({
        total: 1,
        exploration: expect.objectContaining({
          total: 0,
        }),
        promotion_gate: expect.objectContaining({
          total: 0,
        }),
      }),
    );
    expect(report.dashboard).toEqual(
      expect.objectContaining({
        evaluation: expect.objectContaining({
          total_decisions: 1,
          replay_ready_decisions: 1,
        }),
        audit: expect.objectContaining({
          calibration_status: "measured",
          calibration_sample_size: 1,
          override_count: 0,
        }),
        policy: expect.objectContaining({
          exploration_decisions: 0,
          promotion_gate_decisions: 0,
        }),
        graph: expect.objectContaining({
          node_count: expect.any(Number),
        }),
        survival: expect.objectContaining({
          total_records: 1,
        }),
      }),
    );
    expect(report.dependency_graph).toEqual(
      expect.objectContaining({
        status: "empty",
      }),
    );
    expect(report.survival_policy).toEqual(
      expect.objectContaining({
        total_records: 1,
      }),
    );
    expect(report.policy_audit).toEqual(
      expect.objectContaining({
        belief_quality: expect.objectContaining({
          calibration: expect.objectContaining({
            status: "measured",
            sample_size: 1,
            positive_outcome_count: 1,
          }),
        }),
        operator_intervention: expect.objectContaining({
          overrides: expect.objectContaining({
            total_overrides: 0,
          }),
        }),
      }),
    );
  });
});
