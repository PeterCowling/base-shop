import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  runMilestoneSignalsBridge,
  validateMilestoneDispatchPacket,
} from "../ideas/lp-do-ideas-milestone-bridge.js";
import { parseQueueState } from "../ideas/lp-do-ideas-queue-state-file.js";
import type { TrialDispatchPacketV2 } from "../ideas/lp-do-ideas-trial.js";

function makeTmpDir(): string {
  const dir = path.join(tmpdir(), `milestone-bridge-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function writeText(filePath: string, value: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, value, "utf8");
}

function readQueue(queueStatePath: string) {
  const parsed = parseQueueState(readFileSync(queueStatePath, "utf8"));
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}

function buildGrowthLedger() {
  return {
    schema_version: 1,
    ledger_revision: 1,
    business: "BRIK",
    period: {
      period_id: "2026-W10",
      start_date: "2026-03-02",
      end_date: "2026-03-08",
      forecast_id: "BRIK-FC-001",
    },
    threshold_set_id: "growth-thresholds.v1",
    threshold_set_hash: "hash-1",
    threshold_locked_at: "2026-03-10T08:00:00.000Z",
    updated_at: "2026-03-10T08:00:00.000Z",
    stages: {
      acquisition: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          new_customers_count: 5,
          spend_eur_cents: 12000,
          blended_cac_eur_cents: 2400,
        },
        reasons: [],
      },
      activation: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          sessions_count: 420,
          orders_count: 3,
          sitewide_cvr_bps: 71,
        },
        reasons: [],
      },
      revenue: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          orders_count: 3,
          gross_revenue_eur_cents: 54000,
          aov_eur_cents: 18000,
        },
        reasons: [],
      },
      retention: {
        status: "insufficient_data",
        policy: { blocking_mode: "never" },
        metrics: {
          return_rate_30d_bps: null,
          orders_shipped_count: null,
          returned_orders_count: null,
        },
        reasons: [],
      },
      referral: {
        status: "insufficient_data",
        policy: { blocking_mode: "never" },
        metrics: {
          referral_conversion_rate_bps: null,
          referral_sessions_count: null,
          referral_orders_count: null,
        },
        reasons: [],
      },
    },
  };
}

describe("lp-do-ideas-milestone-bridge", () => {
  it("TC-01: emits a metric-backed milestone_event dispatch when transaction data is available", async () => {
    const rootDir = makeTmpDir();
    writeJson(
      path.join(rootDir, "data", "shops", "BRIK", "growth-ledger.json"),
      buildGrowthLedger(),
    );

    const queueStatePath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const telemetryPath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );

    const result = await runMilestoneSignalsBridge({
      rootDir,
      business: "BRIK",
      queueStatePath,
      telemetryPath,
      clock: () => new Date("2026-03-10T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.roots_detected).toBe(1);
    expect(result.dispatches_enqueued).toBe(1);

    const queue = readQueue(queueStatePath);
    expect(queue.dispatches).toHaveLength(1);
    const dispatch = queue.dispatches[0] as TrialDispatchPacketV2;
    expect(dispatch.trigger).toBe("milestone_event");
    expect(dispatch.recommended_route).toBe("lp-do-fact-find");
    expect(dispatch.status).toBe("fact_find_ready");
    expect(dispatch.milestone_origin?.root_id).toBe("transaction_data_available");
    expect(dispatch.milestone_origin?.producer_kind).toBe("metric");
    expect(dispatch.milestone_origin?.gap_case?.source_kind).toBe("milestone");
    expect(dispatch.milestone_origin?.prescription?.source).toBe("milestone_bundle");
  });

  it("TC-02: artifact-backed milestone roots emit bounded lateral bundles", async () => {
    const rootDir = makeTmpDir();
    writeText(
      path.join(rootDir, "docs", "business-os", "strategy", "BRIK", "sales-ops.user.md"),
      [
        "# Sales Ops",
        "",
        "## Weekly Denominator Check",
        "",
        "| Metric | Minimum denominator | Current denominator | PASS / FAIL |",
        "| --- | --- | --- | --- |",
        "| Lead response rate | ≥20 leads in trailing 4 weeks | 7 | PASS |",
      ].join("\n"),
    );
    writeText(
      path.join(rootDir, "docs", "business-os", "strategy", "BRIK", "retention.user.md"),
      [
        "# Retention",
        "",
        "## Retention Metrics Denominators",
        "",
        "| Metric | Minimum denominator | Current denominator | Stage gate | PASS / FAIL / Pre-PMF |",
        "| --- | --- | --- | --- | --- |",
        "| Repeat rate (product) OR Re-booking rate (hospitality) | ≥20 customers/guests with ≥1 completed purchase/stay | 3 | PMF entry | Below floor — pre-PMF |",
      ].join("\n"),
    );

    const queueStatePath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const telemetryPath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );

    const result = await runMilestoneSignalsBridge({
      rootDir,
      business: "BRIK",
      queueStatePath,
      telemetryPath,
      clock: () => new Date("2026-03-10T11:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.roots_detected).toBe(2);
    expect(result.dispatches_enqueued).toBe(3);

    const queue = readQueue(queueStatePath);
    const dispatches = queue.dispatches as TrialDispatchPacketV2[];
    expect(dispatches).toHaveLength(3);
    expect(dispatches.map((dispatch) => dispatch.trigger)).toEqual([
      "milestone_event",
      "milestone_event",
      "milestone_event",
    ]);
    expect(
      dispatches.filter(
        (dispatch) =>
          dispatch.milestone_origin?.root_id === "qualified_lead_or_enquiry_flow_present",
      ),
    ).toHaveLength(1);
    expect(
      dispatches.filter((dispatch) => dispatch.milestone_origin?.root_id === "repeat_signal_present"),
    ).toHaveLength(2);
    expect(
      dispatches.some(
        (dispatch) =>
          dispatch.milestone_origin?.root_id === "qualified_lead_or_enquiry_flow_present" &&
          dispatch.recommended_route === "lp-do-plan",
      ),
    ).toBe(true);
    expect(
      dispatches.some(
        (dispatch) =>
          dispatch.milestone_origin?.root_id === "repeat_signal_present" &&
          dispatch.recommended_route === "lp-do-fact-find",
      ),
    ).toBe(true);
  });

  it("TC-03: not-yet-active artifact roots do not emit milestone events", async () => {
    const rootDir = makeTmpDir();
    writeText(
      path.join(rootDir, "docs", "business-os", "strategy", "BRIK", "sales-ops.user.md"),
      [
        "# Sales Ops",
        "",
        "Status: Not-yet-active",
        "",
        "No lead flow yet.",
      ].join("\n"),
    );
    writeText(
      path.join(rootDir, "docs", "business-os", "strategy", "BRIK", "retention.user.md"),
      [
        "# Retention",
        "",
        "Status: Not-yet-active",
        "",
        "cap-06-not-yet-active",
      ].join("\n"),
    );

    const result = await runMilestoneSignalsBridge({
      rootDir,
      business: "BRIK",
      clock: () => new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.roots_detected).toBe(0);
    expect(result.dispatches_enqueued).toBe(0);
    expect(result.noop).toBe(1);
  });

  it("TC-04: rejects milestone packets whose route no longer matches provenance", () => {
    const packet: TrialDispatchPacketV2 = {
      schema_version: "dispatch.v2",
      dispatch_id: "IDEA-DISPATCH-20260310120000-0001",
      mode: "trial",
      business: "BRIK",
      trigger: "milestone_event",
      artifact_id: null,
      before_sha: null,
      after_sha: "milestone-1",
      root_event_id: "milestone:BRIK:milestone-1",
      anchor_key: "cap05-sales-ops-activation",
      cluster_key: "milestone:BRIK:qualified_lead:cap05",
      cluster_fingerprint: "fingerprint-1",
      lineage_depth: 0,
      area_anchor: "sales-ops",
      location_anchors: ["docs/business-os/strategy/BRIK/sales-ops.user.md"],
      provisional_deliverable_family: "business-artifact",
      current_truth: "Qualified lead flow is present.",
      next_scope_now: "Run lp-do-plan to shape sales ops follow-through.",
      adjacent_later: [],
      recommended_route: "lp-do-fact-find",
      status: "fact_find_ready",
      priority: "P2",
      confidence: 0.7,
      evidence_refs: ["docs/business-os/strategy/BRIK/sales-ops.user.md"],
      created_at: "2026-03-10T12:00:00.000Z",
      queue_state: "enqueued",
      milestone_origin: {
        schema_version: "dispatch-milestone.v1",
        milestone_event_id: "milestone-1",
        root_id: "qualified_lead_or_enquiry_flow_present",
        producer_kind: "artifact",
        source_ref: "docs/business-os/strategy/BRIK/sales-ops.user.md",
        observed_at: "2026-03-10T12:00:00.000Z",
        bundle_key: "cap05-sales-ops-activation",
        bundle_title: "Shape sales-ops follow-through for live qualified lead flow",
        bundle_size: 1,
        bundle_index: 0,
        gap_case: {
          schema_version: "gap-case.v1",
          gap_case_id: "gap-1",
          source_kind: "milestone",
          business_id: "BRIK",
          stage_id: null,
          capability_id: "CAP-05",
          gap_type: "milestone_cap05_sales_ops_activation",
          reason_code: "qualified_lead_or_enquiry_flow_present",
          severity: 0.7,
          evidence_refs: ["docs/business-os/strategy/BRIK/sales-ops.user.md"],
          recurrence_key: "qualified_lead_or_enquiry_flow_present:cap05-sales-ops-activation",
          requirement_posture: "relative_required",
          blocking_scope: "degrades_quality",
          structural_context: {
            milestone_root_id: "qualified_lead_or_enquiry_flow_present",
          },
          runtime_binding: {
            binding_mode: "compiled_to_candidate",
            candidate_id: "cand-1",
          },
        },
        prescription: {
          schema_version: "prescription.v1",
          prescription_id: "rx-1",
          prescription_family: "milestone_qualified_lead_or_enquiry_flow_present_cap05_sales_ops_activation",
          source: "milestone_bundle",
          gap_types_supported: ["milestone_cap05_sales_ops_activation"],
          required_route: "lp-do-plan",
          required_inputs: ["docs/business-os/strategy/BRIK/sales-ops.user.md"],
          expected_artifacts: ["plan.md"],
          expected_signal_change:
            "Sales-ops pipeline, SLA, and follow-up loop become plan-ready for live qualified lead flow.",
          risk_class: "medium",
          maturity: "structured",
        },
      },
      why:
        "Qualified lead or enquiry flow is now present, so CAP-05 sales ops is no longer purely deferred and needs a bounded follow-through path.",
      intended_outcome: {
        type: "operational",
        statement:
          "Sales-ops pipeline, SLA, and follow-up loop become plan-ready for live qualified lead flow.",
        source: "auto",
      },
    };

    const validation = validateMilestoneDispatchPacket(packet);
    expect(validation.ok).toBe(false);
    expect(validation.code).toBe("INVALID_DISPATCH_V2");
  });
});
