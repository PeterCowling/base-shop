import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  type ContainerContract,
  type GapCase,
  type ImprovementCandidate,
  type ImprovementOutcome,
  type MetaObservation,
  type PolicyDecisionRecord,
  type Prescription,
  type SelfEvolvingPolicyState,
  type StartupState,
  validateContainerContract,
  validateGapCase,
  validateImprovementCandidate,
  validateMetaObservation,
  validatePolicyDecisionRecord,
  validatePolicyState,
  validatePrescription,
  validateStartupState,
  validateUnknownPrescriptionDiscoveryContract,
} from "../self-evolving/self-evolving-contracts.js";
import {
  appendSelfEvolvingEvent,
  createLifecycleEvent,
  readSelfEvolvingEvents,
} from "../self-evolving/self-evolving-events.js";
import {
  appendPolicyDecisionJournal,
  createStartupStateStore,
  readPolicyDecisionJournal,
  readPolicyState,
  readStartupState,
  writePolicyState,
  writeStartupState,
} from "../self-evolving/self-evolving-startup-state.js";

function buildValidStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "state-1",
    business_id: "BRIK",
    stage: "prelaunch",
    current_website_generation: 1,
    offer: { headline: "Offer" },
    icp: { segment: "SMB" },
    positioning: { angle: "Fast launch" },
    brand: {
      voice_tone: "clear",
      do_rules: ["be direct"],
      dont_rules: ["be vague"],
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
      { name: "activation_rate", unit: "ratio", aggregation_method: "rate", kind: "primary" },
    ],
    asset_refs: ["asset-1"],
    constraints: ["no unverified claims"],
    updated_at: "2026-03-02T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildValidImprovementOutcome(candidateId: string): ImprovementOutcome {
  return {
    schema_version: "outcome.v1",
    candidate_id: candidateId,
    implementation_status: "success",
    promoted_at: "2026-03-03T00:00:00.000Z",
    baseline_window: "2026-02-20/2026-02-27",
    post_window: "2026-02-28/2026-03-06",
    measured_impact: 0.18,
    impact_confidence: 0.86,
    regressions_detected: 0,
    rollback_executed_at: null,
    kept_or_reverted: "kept",
    root_cause_notes: "Manual routing delays dropped after adding the lifecycle seam.",
    follow_up_actions: ["watch next 14 days"],
  };
}

function buildValidPolicyState(): SelfEvolvingPolicyState {
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
      max_candidates_per_route: {
        "lp-do-fact-find": 6,
        "lp-do-plan": 4,
        "lp-do-build": 3,
      },
      max_guarded_trial_blast_radius: "medium",
      minimum_evidence_floor: "instrumented",
      hold_window_days: 7,
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
    updated_at: "2026-03-09T18:35:00.000Z",
    updated_by: "agent",
  };
}

function buildValidPolicyDecision(): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id: "decision-1",
    business_id: "BRIK",
    candidate_id: "cand-1",
    gap_case: {
      gap_case_id: "gap-1",
      candidate_id: "cand-1",
      binding_mode: "compiled_to_candidate",
    },
    prescription: {
      prescription_id: "prescription-1",
      prescription_family: "build-origin-bridge-fact-find",
      required_route: "lp-do-fact-find",
    },
    prescription_choice: {
      schema_version: "prescription-choice.v1",
      gap_case_id: "gap-1",
      prescription_id: "prescription-1",
      prescription_family: "build-origin-bridge-fact-find",
      required_route: "lp-do-fact-find",
      expected_signal_change: "Gap becomes structured enough for canonical queue admission.",
      maturity_at_choice: "structured",
    },
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id: "context-1",
    structural_snapshot: {
      snapshot_id: "snap-1",
      candidate_id: "cand-1",
      business_id: "BRIK",
      captured_at: "2026-03-09T18:35:00.000Z",
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-build",
      recurrence_count_window: 3,
      operator_minutes_estimate: 20,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: ["risk:low"],
    },
    belief_state_id: "belief-1",
    belief_audit: {
      schema_version: "policy-belief-audit.v1",
      success_probability_mean: 0.7,
      positive_impact_probability_mean: 0.65,
      guardrail_breach_probability_mean: 0.08,
      evidence_weight: 0.85,
      evidence_floor_met: true,
    },
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-build",
    action_probability: null,
    utility: {
      expected_reward: 3.2,
      downside_penalty: 0.8,
      effort_penalty: 1.1,
      evidence_penalty: 0,
      instability_penalty: 0,
      exploration_bonus: 0,
      net_utility: 1.3,
    },
    created_at: "2026-03-09T18:35:00.000Z",
  };
}

function buildValidGapCase(): GapCase {
  return {
    schema_version: "gap-case.v1",
    gap_case_id: "gap-1",
    source_kind: "build_origin",
    business_id: "BRIK",
    stage_id: "IDEAS",
    capability_id: null,
    gap_type: "queue_contract_missing",
    reason_code: "MISSING_CANONICAL_CONTRACT",
    severity: 0.7,
    evidence_refs: ["docs/plans/startup-loop-learned-prescription-system/fact-find.md"],
    recurrence_key: "build-origin:queue-contract-missing",
    requirement_posture: "relative_required",
    blocking_scope: "degrades_quality",
    structural_context: {
      source_path: "docs/plans/test/results-review.signals.json",
    },
    runtime_binding: {
      binding_mode: "compiled_to_candidate",
      candidate_id: "cand-1",
    },
  };
}

function buildValidPrescription(): Prescription {
  return {
    schema_version: "prescription.v1",
    prescription_id: "prescription-1",
    prescription_family: "build-origin-bridge-fact-find",
    source: "build_origin",
    gap_types_supported: ["queue_contract_missing"],
    required_route: "lp-do-fact-find",
    required_inputs: ["results-review.signals.json"],
    expected_artifacts: ["fact-find.md"],
    expected_signal_change: "Gap becomes structured enough for canonical queue admission.",
    risk_class: "low",
    maturity: "structured",
  };
}

function buildValidDiscoveryContract() {
  return {
    schema_version: "unknown-prescription-discovery.v1" as const,
    gap_case_id: "gap-1",
    discovery_reason: "prescription_unknown" as const,
    prescription_candidates: [
      {
        prescription_id: "prescription-1",
        prescription_family: "build-origin-bridge-fact-find",
        required_route: "lp-do-fact-find" as const,
        required_inputs: ["results-review.signals.json"],
        expected_artifacts: ["fact-find.md"],
        expected_signals: ["Gap becomes structured enough for canonical queue admission."],
      },
    ],
    recommended_first_prescription_id: "prescription-1",
    required_inputs: ["results-review.signals.json"],
    expected_artifacts: ["fact-find.md"],
    expected_signals: ["Gap becomes structured enough for canonical queue admission."],
  };
}

describe("self-evolving contract validators", () => {
  it("TASK-01 TC-01 validates canonical gap-case and prescription contracts", () => {
    expect(validateGapCase(buildValidGapCase())).toEqual([]);
    expect(validatePrescription(buildValidPrescription())).toEqual([]);
    expect(validateUnknownPrescriptionDiscoveryContract(buildValidDiscoveryContract())).toEqual(
      [],
    );
  });

  it("rejects invalid posture and maturity enum values", () => {
    expect(
      validateGapCase({
        ...buildValidGapCase(),
        requirement_posture: "maybe" as never,
      }),
    ).toContain("requirement_posture");
    expect(
      validatePrescription({
        ...buildValidPrescription(),
        maturity: "eventually" as never,
      }),
    ).toContain("maturity");
  });

  it("rejects prescription-choice references that drift from the chosen prescription", () => {
    expect(
      validatePolicyDecisionRecord({
        ...buildValidPolicyDecision(),
        prescription_choice: {
          ...buildValidPolicyDecision().prescription_choice!,
          prescription_id: "prescription-other",
        },
      }),
    ).toContain("prescription_choice.prescription_id_mismatch");
  });

  it("TASK-01 TC-01 validates MetaObservation required fields", () => {
    const observation: MetaObservation = {
      schema_version: "meta-observation.v2",
      observation_id: "obs-1",
      observation_type: "execution_event",
      timestamp: "2026-03-02T00:00:00.000Z",
      business: "BRIK",
      actor_type: "agent",
      run_id: "run-1",
      session_id: "session-1",
      skill_id: "lp-do-build",
      container_id: null,
      artifact_refs: ["docs/a.md"],
      context_path: "startup-loop/do",
      hard_signature: "abc",
      soft_cluster_id: null,
      fingerprint_version: "1",
      repeat_count_window: 3,
      operator_minutes_estimate: 15,
      quality_impact_estimate: 0.2,
      detector_confidence: 0.9,
      severity: 0.3,
      inputs_hash: "in",
      outputs_hash: "out",
      toolchain_version: "v1",
      model_version: null,
      kpi_name: "activation_rate",
      kpi_value: 0.12,
      kpi_unit: "ratio",
      aggregation_method: "rate",
      sample_size: 250,
      data_quality_status: "ok",
      data_quality_reason_code: null,
      baseline_ref: "base-1",
      measurement_window: "7d",
      traffic_segment: "all",
      evidence_refs: ["docs/e.md"],
      evidence_grade: "measured",
      measurement_contract_status: "verified",
    };
    expect(validateMetaObservation(observation)).toEqual([]);
  });

  it("TASK-10 TC-03 validates exploration_rank policy decisions", () => {
    const decision = {
      ...buildValidPolicyDecision(),
      decision_type: "exploration_rank" as const,
      decision_mode: "stochastic" as const,
      chosen_action: "prioritized",
      action_probability: 0.42,
      exploration_rank: {
        schema_version: "exploration-rank.v1" as const,
        exploration_batch_id: "explore-1",
        candidate_set_hash: "hash-1",
        portfolio_id: "portfolio-1",
        policy_mode: "guarded_trial" as const,
        budget_slots: 1,
        seed: 42,
        prioritized_candidate_ids: ["cand-1"],
        signal_snapshot: {
          baseline_adjusted_utility: 1.3,
          sampled_success_probability: 0.61,
          sampled_impact_probability: 0.58,
          uncertainty_width: 0.4,
          context_weight: 0.05,
          exploration_bonus: 0.22,
          exploration_score: 1.52,
        },
      },
    };
    expect(validatePolicyDecisionRecord(decision)).toEqual([]);
  });

  it("TASK-11 TC-03 validates promotion_gate policy decisions", () => {
    const decision = {
      ...buildValidPolicyDecision(),
      decision_type: "promotion_gate" as const,
      chosen_action: "hold",
      action_probability: 1,
      promotion_gate: {
        schema_version: "promotion-gate.v1" as const,
        estimator_version: "promotion-gate.v1",
        container_name: "website-v3",
        experiment_hook_contract: "website_upgrade_variants",
        causal_status: "insufficient_data" as const,
        evaluation_status: "pending" as const,
        outcome_event_id: null,
        verified_observation_ids: [],
        target_kpi: "activation_rate",
        measured_impact: null,
        sample_size: null,
        runtime_hours: null,
        reason_code: "evaluation_status_pending",
      },
    };
    expect(validatePolicyDecisionRecord(decision)).toEqual([]);
  });

  it("TASK-09 TC-01 validates promotion_nomination policy decisions", () => {
    const decision = {
      ...buildValidPolicyDecision(),
      decision_type: "promotion_nomination" as const,
      eligible_actions: ["hold", "nominate"],
      chosen_action: "nominate",
      action_probability: 1,
      promotion_nomination: {
        schema_version: "promotion-nomination.v1" as const,
        target_surface: "prompt_contract" as const,
        target_identifier: "container:website-v3",
        proof_status: "eligible" as const,
        safety_status: "advisory_only" as const,
        actuation_status: "nominated" as const,
        observed_outcome_count: 2,
        positive_outcome_count: 2,
        positive_outcome_rate: 1,
        latest_outcome_event_id: "event-1",
        latest_outcome_source_path: "docs/plans/example/plan.md",
        reason_code: "container_contract_requires_operator_promotion",
      },
    };
    expect(validatePolicyDecisionRecord(decision)).toEqual([]);
  });

  it("TASK-01 TC-02 accepts legacy v1 observations without admission metadata", () => {
    const legacyObservation: MetaObservation = {
      schema_version: "meta-observation.v1",
      observation_id: "obs-legacy",
      observation_type: "execution_event",
      timestamp: "2026-03-02T00:00:00.000Z",
      business: "BRIK",
      actor_type: "agent",
      run_id: "run-1",
      session_id: "session-1",
      skill_id: "lp-do-build",
      container_id: null,
      artifact_refs: ["docs/a.md"],
      context_path: "startup-loop/do",
      hard_signature: "abc",
      soft_cluster_id: null,
      fingerprint_version: "1",
      repeat_count_window: 3,
      operator_minutes_estimate: 15,
      quality_impact_estimate: 0.2,
      detector_confidence: 0.9,
      severity: 0.3,
      inputs_hash: "in",
      outputs_hash: "out",
      toolchain_version: "v1",
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
      traffic_segment: "all",
      evidence_refs: ["docs/e.md"],
    };
    expect(validateMetaObservation(legacyObservation)).toEqual([]);
  });

  it("TASK-01 TC-03 rejects v2 observations missing admission metadata", () => {
    const incompleteObservation: MetaObservation = {
      schema_version: "meta-observation.v2",
      observation_id: "obs-missing",
      observation_type: "execution_event",
      timestamp: "2026-03-02T00:00:00.000Z",
      business: "BRIK",
      actor_type: "agent",
      run_id: "run-1",
      session_id: "session-1",
      skill_id: "lp-do-build",
      container_id: null,
      artifact_refs: ["docs/a.md"],
      context_path: "startup-loop/do",
      hard_signature: "abc",
      soft_cluster_id: null,
      fingerprint_version: "1",
      repeat_count_window: 3,
      operator_minutes_estimate: 15,
      quality_impact_estimate: 0.2,
      detector_confidence: 0.9,
      severity: 0.3,
      inputs_hash: "in",
      outputs_hash: "out",
      toolchain_version: "v1",
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
      traffic_segment: "all",
      evidence_refs: ["docs/e.md"],
    };
    expect(validateMetaObservation(incompleteObservation)).toContain(
      "evidence_grade_required_v2",
    );
    expect(validateMetaObservation(incompleteObservation)).toContain(
      "measurement_contract_status_required_v2",
    );
  });

  it("TASK-01 TC-04 persists lifecycle events with linked candidate, dispatch, and outcome payloads", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-events-"));
    const businessId = "BRIK";
    const candidateId = "cand-1";
    const dispatchId = "IDEA-DISPATCH-20260309-0001";

    appendSelfEvolvingEvent(
      tempRoot,
      businessId,
      createLifecycleEvent({
        correlation_id: candidateId,
        event_type: "followup_dispatch_handoff",
        lifecycle: {
          candidate_id: candidateId,
          dispatch_id: dispatchId,
          plan_slug: "startup-loop-self-evolving-lifecycle-ledger",
        },
        run_id: "run-1",
        session_id: "session-1",
        source_component: "self-evolving-backbone-consume",
        timestamp: "2026-03-09T18:15:00.000Z",
      }),
    );
    appendSelfEvolvingEvent(
      tempRoot,
      businessId,
      createLifecycleEvent({
        artifact_refs: ["docs/plans/startup-loop-self-evolving-lifecycle-ledger/plan.md"],
        correlation_id: candidateId,
        event_type: "outcome_recorded",
        lifecycle: {
          candidate_id: candidateId,
          dispatch_id: dispatchId,
          plan_slug: "startup-loop-self-evolving-lifecycle-ledger",
          outcome: buildValidImprovementOutcome(candidateId),
        },
        run_id: "run-1",
        session_id: "session-1",
        source_component: "lp-do-build-completion",
        timestamp: "2026-03-09T18:20:00.000Z",
      }),
    );

    const events = readSelfEvolvingEvents(tempRoot, businessId);
    expect(events).toHaveLength(2);
    expect(events[0]?.schema_version).toBe("event.v2");
    expect(events[0]?.event_type).toBe("followup_dispatch_handoff");
    expect(events[0]?.lifecycle?.dispatch_id).toBe(dispatchId);
    expect(events[1]?.event_type).toBe("outcome_recorded");
    expect(events[1]?.lifecycle?.outcome?.candidate_id).toBe(candidateId);
    expect(events[1]?.lifecycle?.outcome?.kept_or_reverted).toBe("kept");

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-01 TC-05 rejects lifecycle events that omit required stage payloads", () => {
    expect(() =>
      createLifecycleEvent({
        correlation_id: "cand-2",
        event_type: "followup_dispatch_handoff",
        lifecycle: {
          candidate_id: "cand-2",
        },
        run_id: "run-1",
        session_id: "session-1",
        source_component: "self-evolving-backbone-consume",
        timestamp: "2026-03-09T18:25:00.000Z",
      }),
    ).toThrow("self_evolving_event_invalid:lifecycle.dispatch_id_required_for_handoff");
  });

  it("TASK-01 TC-06 reads legacy v1 event logs without lifecycle payloads", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-events-legacy-"));
    const businessId = "BRIK";

    appendSelfEvolvingEvent(tempRoot, businessId, {
      schema_version: "event.v1",
      event_id: "event-legacy-1",
      correlation_id: "obs-legacy",
      run_id: "run-1",
      session_id: "session-1",
      timestamp: "2026-03-09T18:30:00.000Z",
      source_component: "startup-loop/do",
      status: "ok",
      inputs_hash: "in",
      outputs_hash: "out",
      error_class: null,
      artifact_refs: ["docs/a.md"],
      effect_class: null,
      effect_reversibility: null,
      event_type: "execution_end",
    });

    const events = readSelfEvolvingEvents(tempRoot, businessId);
    expect(events).toEqual([
      expect.objectContaining({
        schema_version: "event.v1",
        correlation_id: "obs-legacy",
        event_type: "execution_end",
      }),
    ]);
    expect(events[0]?.lifecycle).toBeUndefined();

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-02 TC-01 validates and persists StartupState", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-state-"));
    const store = createStartupStateStore(tempRoot);
    const state = buildValidStartupState();
    const outputPath = writeStartupState(store, state);
    const readBack = readStartupState(store, state.business_id);
    expect(outputPath).toContain("startup-state");
    expect(readBack?.business_id).toBe("BRIK");
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-05 TC-01 validates and persists policy state plus decision journal", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-policy-state-"));
    const store = createStartupStateStore(tempRoot);
    const state = buildValidPolicyState();
    const decision = buildValidPolicyDecision();

    expect(validatePolicyState(state)).toEqual([]);
    expect(validatePolicyDecisionRecord(decision)).toEqual([]);

    const policyPath = writePolicyState(store, state);
    const decisionPath = appendPolicyDecisionJournal(store, state.business_id, [decision]);

    expect(policyPath).toContain("policy-state");
    expect(readPolicyState(store, state.business_id)?.policy_version).toBe(
      "self-evolving-policy.v1",
    );
    expect(decisionPath).toContain("policy-decisions");
    expect(readPolicyDecisionJournal(store, state.business_id)[0]?.decision_id).toBe(
      "decision-1",
    );

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-13 TC-01 rejects invalid belief audit snapshots on policy decisions", () => {
    expect(
      validatePolicyDecisionRecord({
        ...buildValidPolicyDecision(),
        belief_audit: {
          schema_version: "policy-belief-audit.v1",
          success_probability_mean: 1.2,
          positive_impact_probability_mean: 0.4,
          guardrail_breach_probability_mean: 0.1,
          evidence_weight: 0.8,
          evidence_floor_met: true,
        },
      }),
    ).toContain("belief_audit.success_probability_mean");
  });

  it("TASK-07 TC-01 requires portfolio payloads on portfolio-selection decisions", () => {
    const portfolioDecision: PolicyDecisionRecord = {
      ...buildValidPolicyDecision(),
      decision_id: "decision-portfolio-1",
      decision_type: "portfolio_selection",
      chosen_action: "selected",
      eligible_actions: ["selected", "deferred"],
      portfolio_selection: {
        schema_version: "portfolio-selection.v1",
        portfolio_id: "portfolio-1",
        candidate_set_hash: "set-1",
        candidate_count: 1,
        selected_candidate_ids: ["cand-1"],
        solver_status: "optimal",
        objective_value: 1.3,
        constraint_bindings: [
          {
            key: "wip_cap",
            max: 1,
            observed_value: 1,
            binding: true,
          },
        ],
        graph_snapshot_id: "graph-1",
        survival_snapshot_id: "survival-1",
        signal_snapshot: {
          graph_bottleneck_score: 0.12,
          shared_executor_candidate_count: 0,
          shared_constraint_candidate_count: 0,
          structural_penalty: 0.02,
          survival_status: "estimated",
          median_verified_days: 7,
          unresolved_after_hold_probability: 0.4,
          missing_outcome_rate: 0.1,
          survival_penalty: 0.15,
          adjusted_utility: 1.13,
        },
      },
    };

    expect(validatePolicyDecisionRecord(portfolioDecision)).toEqual([]);
    expect(
      validatePolicyDecisionRecord({
        ...portfolioDecision,
        portfolio_selection: null,
      }),
    ).toContain("portfolio_selection");
  });

  it("TASK-05 TC-01 requires blocked metadata when candidate_state is blocked", () => {
    const blockedCandidate: ImprovementCandidate = {
      schema_version: "candidate.v1",
      candidate_id: "c-1",
      candidate_type: "container_update",
      candidate_state: "blocked",
      problem_statement: "blocked test",
      trigger_observations: ["obs-1"],
      executor_path: "lp-do-build",
      change_scope: "business_only",
      applicability_predicates: ["business=BRIK"],
      expected_benefit: "reduce recurrence",
      risk_level: "medium",
      blast_radius_tag: "small",
      autonomy_level_required: 2,
      estimated_effort: "M",
      recommended_action: "wait",
      owners: ["ops"],
      approvers: ["lead"],
      test_plan: "tests",
      validation_contract: "validation",
      rollout_plan: "rollout",
      rollback_contract: "rollback",
      kill_switch: "kill",
      blocked_reason_code: null,
      unblock_requirements: [],
      blocked_since: null,
      expiry_at: "2026-04-01T00:00:00.000Z",
    };
    expect(validateImprovementCandidate(blockedCandidate)).toContain(
      "blocked_reason_code_required",
    );
  });

  it("TASK-01 TC-03 rejects gap-case bindings that drift from candidate identity", () => {
    const candidate: ImprovementCandidate = {
      schema_version: "candidate.v1",
      candidate_id: "cand-1",
      gap_case: buildValidGapCase(),
      prescription: buildValidPrescription(),
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "Queue contract missing",
      trigger_observations: ["obs-1"],
      executor_path: "lp-do-build",
      change_scope: "business_only",
      applicability_predicates: ["business=BRIK"],
      expected_benefit: "Reduce fragmented prescription reasoning",
      risk_level: "low",
      blast_radius_tag: "small",
      autonomy_level_required: 2,
      estimated_effort: "M",
      recommended_action: "Define the canonical contracts first",
      owners: ["ops"],
      approvers: ["lead"],
      test_plan: "contract tests",
      validation_contract: "TC-01",
      rollout_plan: "shadow only",
      rollback_contract: "revert the contract fields together",
      kill_switch: "disable contract consumers",
      blocked_reason_code: null,
      unblock_requirements: [],
      blocked_since: null,
      expiry_at: "2026-04-01T00:00:00.000Z",
    };

    expect(validateImprovementCandidate(candidate)).toEqual([]);
    expect(
      validateImprovementCandidate({
        ...candidate,
        gap_case: {
          ...candidate.gap_case!,
          runtime_binding: {
            ...candidate.gap_case!.runtime_binding,
            candidate_id: "cand-other",
          },
        },
      }),
    ).toContain("gap_case.runtime_binding.candidate_id_mismatch");
  });

  it("TASK-17 TC-01 validates container contract structure", () => {
    const contract: ContainerContract = {
      container_name: "website-v1",
      container_version: "1.0.0",
      maturity_level: "M1",
      idempotency_key_strategy: "business+run",
      startup_state_ref: "required",
      required_inputs: ["site_delta"],
      preflight_checks: ["check"],
      steps: [
        {
          step_id: "s1",
          step_type: "validator",
          description: "check",
          required: true,
          actor: "system",
        },
      ],
      state_store_contract: "state",
      outputs: ["artifact"],
      acceptance_checks: ["pass"],
      blocked_reason_enum: ["missing"],
      rollback_plan: "rollback",
      kpi_contract: "kpi",
      experiment_hook_contract: "none",
      actuator_refs: [],
    };
    expect(validateContainerContract(contract)).toEqual([]);
  });
});
