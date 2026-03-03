import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  type ContainerContract,
  type ImprovementCandidate,
  type MetaObservation,
  type StartupState,
  validateContainerContract,
  validateImprovementCandidate,
  validateMetaObservation,
  validateStartupState,
} from "../self-evolving-contracts.js";
import {
  createStartupStateStore,
  readStartupState,
  writeStartupState,
} from "../self-evolving-startup-state.js";

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

describe("self-evolving contract validators", () => {
  it("TASK-01 TC-01 validates MetaObservation required fields", () => {
    const observation: MetaObservation = {
      schema_version: "meta-observation.v1",
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
    };
    expect(validateMetaObservation(observation)).toEqual([]);
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
