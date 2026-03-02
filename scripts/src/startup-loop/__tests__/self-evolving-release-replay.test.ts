import { describe, expect, it } from "@jest/globals";

import { createDryRunOnlyAdapter } from "../self-evolving-actuator.js";
import { applyWebsiteV1BrandRulesAutoFix } from "../self-evolving-autofix.js";
import { getContainerContract } from "../self-evolving-containers.js";
import type { ImprovementCandidate, StartupState } from "../self-evolving-contracts.js";
import { evaluateCanaryOutcome } from "../self-evolving-release-controls.js";
import { runReplayFixture, summarizeReplay } from "../self-evolving-replay.js";

function buildStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "state-1",
    business_id: "BRIK",
    stage: "prelaunch",
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
      workspace_id: "w1",
      event_schema_ref: "schema-1",
    },
    channels_enabled: [{ channel: "seo", automation_allowed: true }],
    credential_refs: ["cred-1"],
    kpi_definitions: [
      { name: "activation_rate", unit: "ratio", aggregation_method: "rate", kind: "primary" },
    ],
    asset_refs: ["asset-1"],
    constraints: ["none"],
    updated_at: "2026-03-02T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildCanaryCandidate(): ImprovementCandidate {
  return {
    schema_version: "candidate.v1",
    candidate_id: "cand-1",
    candidate_type: "container_update",
    candidate_state: "canary",
    problem_statement: "test",
    trigger_observations: ["obs-1"],
    executor_path: "lp-do-build",
    change_scope: "business_only",
    applicability_predicates: ["business=BRIK"],
    expected_benefit: "benefit",
    risk_level: "low",
    blast_radius_tag: "small",
    autonomy_level_required: 2,
    estimated_effort: "M",
    recommended_action: "promote",
    owners: ["ops"],
    approvers: ["lead"],
    test_plan: "t",
    validation_contract: "v",
    rollout_plan: "r",
    rollback_contract: "rb",
    kill_switch: "k",
    blocked_reason_code: null,
    unblock_requirements: [],
    blocked_since: null,
    expiry_at: "2026-04-01T00:00:00.000Z",
  };
}

describe("self-evolving release controls + replay + auto-fix", () => {
  it("TASK-15 TC-01 applies website-v1 brand rules auto-fix", () => {
    const result = applyWebsiteV1BrandRulesAutoFix(buildStartupState());
    expect(result.applied).toBe(true);
    expect(result.patched_startup_state.brand.do_rules.length).toBeGreaterThan(0);
    expect(result.patched_startup_state.brand.dont_rules.length).toBeGreaterThan(0);
  });

  it("TASK-10 TC-01 reverts canary when guardrails breach", () => {
    const decision = evaluateCanaryOutcome(
      buildCanaryCandidate(),
      {
        max_error_rate: 0.02,
        max_guardrail_kpi_drop: 0.01,
        monitoring_window_minutes: 30,
      },
      {
        candidate_id: "cand-1",
        error_rate: 0.03,
        guardrail_kpi_delta: -0.02,
        elapsed_minutes: 60,
      },
    );
    expect(decision.action).toBe("revert");
  });

  it("TASK-09 TC-01 runs replay harness and summarizes pass/fail", () => {
    const contract = getContainerContract("website-v1");
    const results = [
      runReplayFixture(
        {
          fixture_id: "f1",
          container_name: "website-v1",
          startup_state: buildStartupState(),
          input_deltas: { site_scope_delta: "x" },
          expected_output_keys: ["website_build_contract"],
        },
        contract,
        { "site-repo-adapter": createDryRunOnlyAdapter("site-repo-adapter", "write_staging") },
      ),
    ];
    const summary = summarizeReplay(results);
    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(0);
  });
});
