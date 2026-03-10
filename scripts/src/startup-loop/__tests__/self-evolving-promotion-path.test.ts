import { describe, expect, it } from "@jest/globals";

import type { RankedCandidate } from "../self-evolving/self-evolving-candidates.js";
import type {
  PolicyDecisionRecord,
  StartupState,
} from "../self-evolving/self-evolving-contracts.js";
import { validatePolicyDecisionRecord } from "../self-evolving/self-evolving-contracts.js";
import type { PolicyEvaluationDataset } from "../self-evolving/self-evolving-evaluation.js";
import {
  buildPromotionNominationDataset,
  buildPromotionNominationDecisions,
} from "../self-evolving/self-evolving-promotion-path.js";

function buildStartupState(input: { emptyBrandRules?: boolean } = {}): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "startup-state-1",
    business_id: "BRIK",
    stage: "traction",
    current_website_generation: 1,
    offer: {},
    icp: {},
    positioning: {},
    brand: {
      voice_tone: "clear",
      do_rules: input.emptyBrandRules ? [] : ["Keep claims factual and specific."],
      dont_rules: input.emptyBrandRules ? [] : ["Avoid unverified superlatives."],
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
    updated_at: "2026-03-10T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildRankedCandidate(input: {
  id: string;
  executorPath: string;
  maturity?: "proven" | "structured";
}): RankedCandidate {
  return {
    candidate: {
      schema_version: "candidate.v1",
      candidate_id: input.id,
      gap_case: {
        schema_version: "gap-case.v1",
        gap_case_id: `gap-${input.id}`,
        source_kind: "self_evolving",
        business_id: "BRIK",
        stage_id: "DO",
        capability_id: null,
        gap_type: "container_contract_missing",
        reason_code: "MISSING_PROMOTION_PATH",
        severity: 0.7,
        evidence_refs: ["docs/evidence.md"],
        recurrence_key: `gap:${input.id}`,
        runtime_binding: {
          binding_mode: "compiled_to_candidate",
          candidate_id: input.id,
        },
      },
      prescription: {
        schema_version: "prescription.v1",
        prescription_id: `prescription-${input.id}`,
        prescription_family: "website-contract-hardening",
        source: "self_evolving",
        gap_types_supported: ["container_contract_missing"],
        required_route: "lp-do-build",
        required_inputs: ["startup-state.json"],
        expected_artifacts: ["website-contract.md"],
        expected_signal_change: "Container contract becomes reusable and verified.",
        risk_class: "low",
        maturity: input.maturity ?? "proven",
      },
      requirement_posture: "relative_required",
      blocking_scope: "degrades_quality",
      prescription_maturity: input.maturity ?? "proven",
      candidate_type: "container_update",
      candidate_state: "validated",
      problem_statement: "test",
      trigger_observations: [`obs-${input.id}`],
      executor_path: input.executorPath,
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
      priority_score_v1: 2.4,
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
        belief_state_id: `belief-${input.id}`,
        structural_snapshot_id: `snapshot-${input.id}`,
        evidence_weight: 0.8,
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
    },
  };
}

function buildRouteDecision(candidate: RankedCandidate): PolicyDecisionRecord {
  return {
    schema_version: "policy-decision.v1",
    decision_id:
      candidate.policy_context?.decision_id ?? `route-${candidate.candidate.candidate_id}`,
    business_id: "BRIK",
    candidate_id: candidate.candidate.candidate_id,
    gap_case: {
      gap_case_id: candidate.candidate.gap_case?.gap_case_id ?? "gap-1",
      candidate_id: candidate.candidate.candidate_id,
      binding_mode: "compiled_to_candidate",
    },
    prescription: {
      prescription_id:
        candidate.candidate.prescription?.prescription_id ?? "prescription-1",
      prescription_family:
        candidate.candidate.prescription?.prescription_family ??
        "website-contract-hardening",
      required_route:
        candidate.candidate.prescription?.required_route ?? "lp-do-build",
    },
    prescription_choice: {
      schema_version: "prescription-choice.v1",
      gap_case_id: candidate.candidate.gap_case?.gap_case_id ?? null,
      prescription_id:
        candidate.candidate.prescription?.prescription_id ?? "prescription-1",
      prescription_family:
        candidate.candidate.prescription?.prescription_family ??
        "website-contract-hardening",
      required_route:
        candidate.candidate.prescription?.required_route ?? "lp-do-build",
      expected_signal_change:
        candidate.candidate.prescription?.expected_signal_change ??
        "Container contract becomes reusable and verified.",
      maturity_at_choice: candidate.candidate.prescription_maturity ?? null,
    },
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: "self-evolving-policy.v1",
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
    decision_context_id:
      candidate.policy_context?.decision_context_id ??
      `context-${candidate.candidate.candidate_id}`,
    structural_snapshot: {
      snapshot_id:
        candidate.policy_context?.structural_snapshot_id ??
        `snapshot-${candidate.candidate.candidate_id}`,
      candidate_id: candidate.candidate.candidate_id,
      business_id: "BRIK",
      captured_at: "2026-03-10T00:00:00.000Z",
      startup_stage: "traction",
      candidate_type: "container_update",
      recommended_route_hint: "lp-do-build",
      recurrence_count_window: 3,
      operator_minutes_estimate: 10,
      quality_impact_estimate: 0.4,
      evidence_grade: "measured",
      evidence_classification: "measured",
      blast_radius_tag: "small",
      risk_level: "low",
      estimated_effort: "M",
      constraint_refs: [],
    },
    belief_state_id:
      candidate.policy_context?.belief_state_id ??
      `belief-${candidate.candidate.candidate_id}`,
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: "lp-do-build",
    action_probability: null,
    utility: candidate.score.utility,
    created_at: "2026-03-10T00:00:00.000Z",
  };
}

function buildEvaluationDataset(candidate: RankedCandidate): PolicyEvaluationDataset {
  const prescriptionId = candidate.candidate.prescription?.prescription_id ?? "prescription-1";
  const prescriptionFamily =
    candidate.candidate.prescription?.prescription_family ??
    "website-contract-hardening";

  return {
    schema_version: "policy-evaluation-dataset.v1",
    generated_at: "2026-03-12T00:00:00.000Z",
    summary: {
      total_decisions: 1,
      observed_decisions: 1,
      pending_decisions: 0,
      censored_decisions: 0,
      missing_decisions: 0,
      replay_ready_decisions: 1,
      prescription_attributed_decisions: 1,
      replay_ready_prescription_decisions: 1,
      observed_prescription_decisions: 1,
      shadow_handoff_decisions: 0,
      pending_shadow_handoffs: 0,
      matured_shadow_handoffs: 0,
      deterministic_decisions: 1,
      stochastic_decisions: 0,
      policy_version_counts: { "self-evolving-policy.v1": 1 },
      prescription_family_counts: { [prescriptionFamily]: 1 },
    },
    records: [
      {
        schema_version: "policy-evaluation.v1",
        decision_id: `route-${candidate.candidate.candidate_id}`,
        decision_context_id: `context-${candidate.candidate.candidate_id}`,
        business_id: "BRIK",
        candidate_id: candidate.candidate.candidate_id,
        gap_case_id: candidate.candidate.gap_case?.gap_case_id ?? null,
        prescription_id: prescriptionId,
        prescription_family: prescriptionFamily,
        prescription_required_route: "lp-do-build",
        prescription_choice_present: true,
        chosen_action: "lp-do-build",
        policy_version: "self-evolving-policy.v1",
        utility_version: "self-evolving-utility.v1",
        decision_mode: "deterministic",
        eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
        action_probability: null,
        decision_created_at: "2026-03-10T00:00:00.000Z",
        dispatch_id: "dispatch-1",
        queue_state: "completed",
        handoff_state: "canonical_queue",
        completed_at: "2026-03-11T00:00:00.000Z",
        maturity_due_at: "2026-03-11T00:00:00.000Z",
        maturity_status: "matured",
        measurement_status: "verified",
        evaluation_status: "observed",
        evaluation_ready: true,
        outcome_event_id: "event-1",
        verified_observation_ids: ["obs-1"],
        outcome_reason_code: null,
        outcome_source_path: "docs/plans/example/plan.md",
        implementation_status: "success",
        kept_or_reverted: "kept",
        measured_impact: 0.22,
        impact_confidence: 0.84,
        regressions_detected: 0,
        positive_outcome: true,
        linked_dispatch_count: 1,
        recorded_at: "2026-03-12T00:00:00.000Z",
      },
    ],
  };
}

describe("self-evolving promotion path", () => {
  it("TASK-09 TC-01 records an auditable prompt/contract nomination from prescription outcomes", () => {
    const candidate = buildRankedCandidate({
      id: "cand-1",
      executorPath: "lp-do-build:container:website-v3",
    });

    const result = buildPromotionNominationDecisions({
      startup_state: buildStartupState(),
      authority_level: "shadow",
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      evaluation_dataset: buildEvaluationDataset(candidate),
      created_at: "2026-03-12T00:00:00.000Z",
    });

    expect(result.startup_state_changed).toBe(false);
    expect(result.decision_records).toHaveLength(1);
    expect(validatePolicyDecisionRecord(result.decision_records[0] ?? ({} as never))).toEqual([]);
    expect(result.decision_records[0]?.decision_type).toBe("promotion_nomination");
    expect(result.decision_records[0]?.chosen_action).toBe("nominate");
    expect(result.decision_records[0]?.promotion_nomination).toMatchObject({
      proof_status: "eligible",
      safety_status: "advisory_only",
      actuation_status: "nominated",
      target_surface: "prompt_contract",
    });
  });

  it("TASK-09 TC-02 applies the low-risk website-v1 autofix only in guarded trial", () => {
    const candidate = buildRankedCandidate({
      id: "cand-2",
      executorPath: "lp-do-build:container:website-v1",
    });

    const result = buildPromotionNominationDecisions({
      startup_state: buildStartupState({ emptyBrandRules: true }),
      authority_level: "guarded_trial",
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      evaluation_dataset: buildEvaluationDataset(candidate),
      created_at: "2026-03-12T00:00:00.000Z",
    });

    expect(result.startup_state_changed).toBe(true);
    expect(result.applied_candidate_ids).toEqual(["cand-2"]);
    expect(result.startup_state.brand.do_rules.length).toBeGreaterThan(0);
    expect(result.startup_state.brand.dont_rules.length).toBeGreaterThan(0);
    expect(result.decision_records[0]?.chosen_action).toBe("apply");
    expect(result.decision_records[0]?.promotion_nomination).toMatchObject({
      proof_status: "eligible",
      safety_status: "eligible",
      actuation_status: "applied",
      target_surface: "autofix_low_risk",
    });
  });

  it("TASK-09 TC-03 keeps proof and safety distinct in the nomination summary", () => {
    const candidate = buildRankedCandidate({
      id: "cand-3",
      executorPath: "lp-do-build:container:website-v3",
    });
    const decisions = buildPromotionNominationDecisions({
      startup_state: buildStartupState(),
      authority_level: "shadow",
      ranked_candidates: [candidate],
      route_decisions: [buildRouteDecision(candidate)],
      evaluation_dataset: buildEvaluationDataset(candidate),
      created_at: "2026-03-12T00:00:00.000Z",
    }).decision_records;

    expect(buildPromotionNominationDataset({ decisions })).toEqual({
      total: 1,
      proof_eligible: 1,
      safety_eligible: 0,
      advisory_only: 1,
      nominated: 1,
      applied: 0,
      skipped: 0,
      proven_but_unpromoted: 1,
      target_surface_counts: {
        prompt_contract: 1,
        write_back: 0,
        autofix_low_risk: 0,
      },
    });
  });
});
