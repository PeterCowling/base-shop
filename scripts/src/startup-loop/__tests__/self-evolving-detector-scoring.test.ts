import { describe, expect, it } from "@jest/globals";

import type { ImprovementCandidate, MetaObservation } from "../self-evolving/self-evolving-contracts.js";
import { buildDashboardSnapshot } from "../self-evolving/self-evolving-dashboard.js";
import {
  buildHardSignature,
  computeCooldownUntil,
  detectRepeatWorkCandidates,
} from "../self-evolving/self-evolving-detector.js";
import type { PolicyEvaluationSummary } from "../self-evolving/self-evolving-evaluation.js";
import { canUseScoringV2, computeScoreResult } from "../self-evolving/self-evolving-scoring.js";

function buildObservation(id: string, timestamp: string): MetaObservation {
  const signature = buildHardSignature({
    fingerprint_version: "1",
    source_component: "lp-do-build",
    step_id: "validate",
    normalized_path: "docs/plans",
    error_or_reason_code: "lint_failure",
    effect_class: "write_staging",
  });
  return {
    schema_version: "meta-observation.v2",
    observation_id: id,
    observation_type: "validation_failure",
    timestamp,
    business: "BRIK",
    actor_type: "agent",
    run_id: "run-1",
    session_id: "session-1",
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: ["docs/p.md"],
    context_path: "startup-loop/do",
    hard_signature: signature,
    soft_cluster_id: "cluster-1",
    fingerprint_version: "1",
    repeat_count_window: 0,
    operator_minutes_estimate: 20,
    quality_impact_estimate: 0.1,
    detector_confidence: 0.7,
    severity: 0.5,
    inputs_hash: "in",
    outputs_hash: "out",
    toolchain_version: "1",
    model_version: null,
    kpi_name: null,
    kpi_value: null,
    kpi_unit: null,
    aggregation_method: null,
    sample_size: null,
    data_quality_status: null,
    data_quality_reason_code: null,
    baseline_ref: null,
    measurement_window: null,
    traffic_segment: null,
    evidence_refs: ["docs/e.md"],
    evidence_grade: "exploratory",
    measurement_contract_status: "none",
  };
}

describe("self-evolving detector + scoring", () => {
  it("TASK-06 TC-01 detects repeat-work on hard_signature recurrence", () => {
    const observations: MetaObservation[] = [
      buildObservation("o1", "2026-03-01T00:00:00.000Z"),
      buildObservation("o2", "2026-03-02T00:00:00.000Z"),
      buildObservation("o3", "2026-03-03T00:00:00.000Z"),
    ];
    const candidates = detectRepeatWorkCandidates(
      observations,
      {
        recurrence_threshold: 3,
        window_days: 7,
        time_density_threshold: 0.2,
        cooldown_days: 3,
      },
      { now: new Date("2026-03-03T12:00:00.000Z") },
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].recurrence_count).toBe(3);
  });

  it("TASK-06 TC-02 applies cooldown suppression on same hard signature", () => {
    const observations: MetaObservation[] = [
      buildObservation("o1", "2026-03-01T00:00:00.000Z"),
      buildObservation("o2", "2026-03-02T00:00:00.000Z"),
      buildObservation("o3", "2026-03-03T00:00:00.000Z"),
    ];
    const signature = observations[0].hard_signature;
    const suppressedUntil = computeCooldownUntil("2026-03-04T00:00:00.000Z", 2);
    const candidates = detectRepeatWorkCandidates(
      observations,
      {
        recurrence_threshold: 3,
        window_days: 7,
        time_density_threshold: 0.2,
        cooldown_days: 3,
      },
      {
        now: new Date("2026-03-03T12:00:00.000Z"),
        suppressedUntilBySignature: { [signature]: suppressedUntil },
      },
    );
    expect(candidates[0]?.dropped_by_cooldown).toBe(true);
  });

  it("TASK-08 TC-01 caps autonomy without KPI evidence and scoring v2 gate", () => {
    const candidate: ImprovementCandidate = {
      schema_version: "candidate.v1",
      candidate_id: "c-1",
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: ["o1"],
      executor_path: "lp-do-build",
      change_scope: "business_only",
      applicability_predicates: ["business=BRIK"],
      expected_benefit: "benefit",
      risk_level: "low",
      blast_radius_tag: "small",
      autonomy_level_required: 3,
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
    };

    const score = computeScoreResult(
      candidate,
      {
        frequency_score: 5,
        operator_time_score: 4,
        quality_risk_reduction_score: 3,
        token_savings_score: 2,
        implementation_effort_score: 2,
        blast_radius_risk_score: 1,
        outcome_impact_score: 5,
        time_to_impact_score: 4,
      },
      {
        w1: 1,
        w2: 1,
        w3: 1,
        w4: 1,
        w5: 1,
        w6: 1,
        w7: 1,
        w8: 1,
      },
      {
        has_kpi_baseline: false,
        has_impact_mechanism: true,
        has_measurement_plan: true,
        has_canary_path: true,
        data_quality_status: "ok",
        sample_size: 300,
        minimum_sample_size: 200,
      },
    );
    expect(canUseScoringV2({
      has_kpi_baseline: false,
      has_impact_mechanism: true,
      has_measurement_plan: true,
      has_canary_path: true,
      data_quality_status: "ok",
      sample_size: 300,
      minimum_sample_size: 200,
      observation_count: 3,
      quality_annotation_count: 2,
      ok_quality_count: 2,
      measurement_ready_observation_count: 0,
    })).toBe(false);
    expect(score.priority_score_v2).toBeNull();
    expect(score.autonomy_cap).toBe(2);
    expect(score.evidence.classification).toBe("structural_only");
    expect(score.evidence.missing_requirements).toContain("kpi_baseline");
  });

  it("TASK-08 TC-02 emits interval-based evidence metrics instead of fake zeros", () => {
    const candidate: ImprovementCandidate = {
      schema_version: "candidate.v1",
      candidate_id: "c-2",
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: ["o1"],
      executor_path: "lp-do-build",
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
    };

    const dashboard = buildDashboardSnapshot({
      observations: [buildObservation("o1", "2026-03-01T00:00:00.000Z")],
      ranked_candidates: [
        {
          candidate,
          score: computeScoreResult(
            candidate,
            {
              frequency_score: 5,
              operator_time_score: 4,
              quality_risk_reduction_score: 3,
              token_savings_score: 2,
              implementation_effort_score: 2,
              blast_radius_risk_score: 1,
              outcome_impact_score: 5,
              time_to_impact_score: 4,
            },
            {
              w1: 1,
              w2: 1,
              w3: 1,
              w4: 1,
              w5: 1,
              w6: 1,
              w7: 1,
              w8: 1,
            },
            {
              has_kpi_baseline: false,
              has_impact_mechanism: true,
              has_measurement_plan: false,
              has_canary_path: true,
              data_quality_status: null,
              sample_size: null,
              minimum_sample_size: 30,
              observation_count: 1,
              quality_annotation_count: 0,
              ok_quality_count: 0,
              measurement_ready_observation_count: 0,
            },
          ),
          route: {
            route: "lp-do-fact-find",
            reason: "evidence_structural_only_requires_fact_find",
          },
          source_hard_signature: "sig-1",
          generated_at: "2026-03-01T00:00:00.000Z",
        },
      ],
      wipCap: 10,
      evaluation_summary: {
        total_decisions: 4,
        observed_decisions: 1,
        pending_decisions: 1,
        censored_decisions: 1,
        missing_decisions: 1,
        replay_ready_decisions: 1,
        deterministic_decisions: 4,
        stochastic_decisions: 0,
        policy_version_counts: {
          "self-evolving-policy.v1": 4,
        },
      } satisfies PolicyEvaluationSummary,
    });

    expect(dashboard.quality.observation_annotation_coverage.observed_rate).toBe(0);
    expect(dashboard.quality.annotated_data_quality_ok_rate.status).toBe(
      "insufficient_data",
    );
    expect(dashboard.quality.measured_evidence_candidate_rate.observed_rate).toBe(0);
    expect(dashboard.posture.effective_grade_counts.exploratory).toBe(1);
    expect(dashboard.posture.declared_grade_counts.exploratory).toBe(1);
    expect(dashboard.posture.underlying_field_counts.measurement_ready).toBe(0);
    expect(dashboard.posture.policy_eligibility_counts.exploratory_fact_find_only).toBe(1);
    expect(dashboard.evaluation.total_decisions).toBe(4);
    expect(dashboard.evaluation.maturity_debt_decisions).toBe(2);
    expect(dashboard.evaluation.replay_ready_rate.observed_rate).toBe(0.25);
  });

  it("TASK-05 TC-02 emits explicit policy provenance and cold-start utility for sparse histories", () => {
    const candidate: ImprovementCandidate = {
      schema_version: "candidate.v1",
      candidate_id: "c-policy",
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: ["o1"],
      executor_path: "lp-do-build",
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
    };

    const score = computeScoreResult(
      candidate,
      {
        frequency_score: 2,
        operator_time_score: 2,
        quality_risk_reduction_score: 1,
        token_savings_score: 1,
        implementation_effort_score: 2,
        blast_radius_risk_score: 1,
        outcome_impact_score: 1,
        time_to_impact_score: 1,
      },
      {
        w1: 1,
        w2: 1,
        w3: 1,
        w4: 1,
        w5: 1,
        w6: 1,
        w7: 1,
        w8: 1,
      },
      {
        has_kpi_baseline: false,
        has_impact_mechanism: true,
        has_measurement_plan: false,
        has_canary_path: true,
        data_quality_status: null,
        sample_size: null,
        minimum_sample_size: 30,
        observation_count: 1,
        quality_annotation_count: 0,
        ok_quality_count: 0,
        measurement_ready_observation_count: 0,
      },
      {
        business_id: "BRIK",
        startup_stage: "prelaunch",
        route_hint: "lp-do-fact-find",
        captured_at: "2026-03-09T18:45:00.000Z",
      },
    );

    expect(score.policy.policy_version).toBe("self-evolving-policy.v1");
    expect(score.policy.utility_version).toBe("self-evolving-utility.v1");
    expect(score.policy.prior_family_version).toBe("self-evolving-priors.v1");
    expect(score.policy.belief_state_id).toHaveLength(16);
    expect(score.utility.net_utility).not.toBeNaN();
    expect(score.policy.fallback_reason).toBeNull();
  });
});
