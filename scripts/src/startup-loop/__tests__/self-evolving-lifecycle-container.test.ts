import { describe, expect, it } from "@jest/globals";

import {
  createDryRunOnlyAdapter,
  requiresExplicitHumanApproval,
} from "../self-evolving-actuator.js";
import { mapCandidateToBackboneRoute } from "../self-evolving-backbone.js";
import { evaluateMatureBoundary } from "../self-evolving-boundary.js";
import {
  executeContainer,
  getContainerContract,
} from "../self-evolving-containers.js";
import type { ImprovementCandidate, StartupState } from "../self-evolving-contracts.js";
import {
  canCreateCandidate,
  enforceBlockedSla,
  validateTransition,
} from "../self-evolving-lifecycle.js";
import { evaluatePilot0, evaluatePilot1 } from "../self-evolving-pilot.js";

function buildCandidate(id: string, state: ImprovementCandidate["candidate_state"]): ImprovementCandidate {
  return {
    schema_version: "candidate.v1",
    candidate_id: id,
    candidate_type: "container_update",
    candidate_state: state,
    problem_statement: "p",
    trigger_observations: ["o1"],
    executor_path: "lp-do-build",
    change_scope: "business_only",
    applicability_predicates: ["business=BRIK"],
    expected_benefit: "benefit",
    risk_level: "medium",
    blast_radius_tag: "small",
    autonomy_level_required: 2,
    estimated_effort: "M",
    recommended_action: "build",
    owners: ["ops"],
    approvers: ["lead"],
    test_plan: "t",
    validation_contract: "v",
    rollout_plan: "r",
    rollback_contract: "rb",
    kill_switch: "k",
    blocked_reason_code: state === "blocked" ? "deps" : null,
    unblock_requirements: state === "blocked" ? ["x"] : [],
    blocked_since: state === "blocked" ? "2026-01-01T00:00:00.000Z" : null,
    expiry_at: "2026-05-01T00:00:00.000Z",
  };
}

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
      do_rules: ["do"],
      dont_rules: ["dont"],
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

describe("self-evolving lifecycle + containers", () => {
  it("TASK-05 TC-01 enforces valid lifecycle transition and blocked SLA expiry", () => {
    expect(validateTransition("validated", "canary").allowed).toBe(true);
    expect(validateTransition("draft", "promoted").allowed).toBe(false);
    const updated = enforceBlockedSla(
      [buildCandidate("c-blocked", "blocked")],
      new Date("2026-03-02T00:00:00.000Z"),
      14,
    );
    expect(updated[0]?.candidate_state).toBe("expired");
  });

  it("TASK-05 TC-02 enforces WIP budget", () => {
    const budgetDecision = canCreateCandidate(
      [buildCandidate("c1", "draft"), buildCandidate("c2", "validated")],
      {
        max_active_candidates: 2,
        max_candidates_created_per_day: 4,
        blocked_sla_days: 14,
      },
      0,
    );
    expect(budgetDecision.allowed).toBe(false);
    expect(budgetDecision.reason).toBe("wip_cap_exceeded");
  });

  it("TASK-12/13 TC-01 executes analytics-v1 and website-v1 containers in dry run", () => {
    const startupState = buildStartupState();
    const analyticsContract = getContainerContract("analytics-v1");
    const websiteContract = getContainerContract("website-v1");
    const dryAdapter = createDryRunOnlyAdapter("site-repo-adapter", "write_staging");

    const analyticsResult = executeContainer({
      startup_state: startupState,
      contract: analyticsContract,
      input_deltas: {
        tracking_schema_delta: "x",
        dashboard_target_delta: "default",
      },
      actuators: {},
      approval_level: 2,
      dry_run: true,
    });
    expect(analyticsResult.ok).toBe(true);

    const websiteResult = executeContainer({
      startup_state: startupState,
      contract: websiteContract,
      input_deltas: { site_scope_delta: "x" },
      actuators: { "site-repo-adapter": dryAdapter },
      approval_level: 2,
      dry_run: true,
    });
    expect(websiteResult.ok).toBe(true);
  });

  it("TASK-04/TASK-25 TC-01 checks actuator approval + mature boundary cap", () => {
    const irreversibleAdapter = {
      ...createDryRunOnlyAdapter("mail-adapter", "external_side_effect"),
      effect_reversibility: "irreversible" as const,
    };
    expect(
      requiresExplicitHumanApproval(irreversibleAdapter, {
        action: "send",
        dry_run: true,
        payload: {},
        approval_level: 1,
      }),
    ).toBe(true);

    const boundary = evaluateMatureBoundary(
      {
        monthly_revenue: 20000,
        headcount: 6,
        support_ticket_volume_per_week: 120,
        multi_region_compliance_flag: false,
        operational_complexity_score: 7,
      },
      {
        monthly_revenue: 10000,
        headcount: 5,
        support_ticket_volume_per_week: 100,
        operational_complexity_score: 6,
      },
    );
    expect(boundary.mature_stage_detected).toBe(true);
    expect(boundary.autonomy_level_cap).toBe(1);
  });

  it("TASK-24 TC-01 evaluates pilot checkpoints and backbone mapping", () => {
    const pilot0 = evaluatePilot0({
      topKCandidateIds: ["c1", "c2", "c3"],
      labels: [
        { candidate_id: "c1", is_true_repeat_work: true },
        { candidate_id: "c2", is_true_repeat_work: true },
        { candidate_id: "c3", is_true_repeat_work: false },
      ],
      precisionThreshold: 0.6,
    });
    expect(pilot0.pass).toBe(true);

    const pilot1 = evaluatePilot1({
      beforeRecurrenceDensity: 1,
      afterRecurrenceDensity: 0.4,
      beforeCycleTimeHours: 10,
      afterCycleTimeHours: 7,
      targetKpiDelta: 0.05,
      rollbackDrillPassed: true,
    });
    expect(pilot1.pass).toBe(true);

    const route = mapCandidateToBackboneRoute(buildCandidate("c4", "validated"));
    expect(route.route).toBe("lp-do-build");
  });
});
