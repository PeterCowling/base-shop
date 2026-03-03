import { describe, expect, it } from "@jest/globals";

import {
  applyKillSwitch,
  checkOptionCGate,
  evaluateOptionCReadiness,
} from "../lp-do-ideas-autonomous-gate.js";
import type { IdeasMetricsRollup } from "../lp-do-ideas-metrics-rollup.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRollup(overrides: Partial<IdeasMetricsRollup> = {}): IdeasMetricsRollup {
  return {
    generated_at: new Date().toISOString(),
    cycle_count: 5,
    root_event_count: 10,
    candidate_count: 15,
    admitted_cluster_count: 50, // ≥40 to pass sample size check
    suppressed_by_loop_guards: 5,
    fan_out_raw: 2,
    fan_out_admitted: 1.5,
    loop_incidence: 0.1,
    queue_age_p95_days: { DO: 2, IMPROVE: 3 },
    throughput: 5,
    lane_mix: { DO_completed: 3, IMPROVE_completed: 2, ratio: "60:40" },
    suppression_by_invariant: {
      same_origin_attach: 0,
      anti_self_trigger: 0,
      lineage_cap: 0,
      cooldown: 0,
      materiality: 0,
      projection_immunity: 0,
      policy_gate: 0,
    },
    suppression_reason_totals: {},
    cycle_metrics: [],
    provenance: {
      shadow_cycle_count: 0,
      enforced_cycle_count: 5,
      reconciled_cycles: [],
    },
    action_records: [],
    ...overrides,
  };
}

/** Returns a fixed "now" date for deterministic tests. */
const NOW = new Date("2026-02-25T12:00:00.000Z");

/** Returns a fresh rollup with generated_at set to NOW (i.e. 0 days old). */
function freshRollup(overrides: Partial<IdeasMetricsRollup> = {}): IdeasMetricsRollup {
  return makeRollup({ generated_at: NOW.toISOString(), ...overrides });
}

/** All inputs that pass every threshold. */
function passingInputs() {
  return {
    rollup: freshRollup(),
    reviewPeriodDays: 14,
    routeAccuracy: 80,
    suppressionVariance: 10,
    now: NOW,
  };
}

// ---------------------------------------------------------------------------
// TC-09-A: Below-threshold data rejects Option C activation
// ---------------------------------------------------------------------------

describe("TC-09-A: evaluateOptionCReadiness — below-threshold inputs produce blockers", () => {
  it("TC-09-A-01: reviewPeriodDays < 14 → blocker 'review_period_too_short'", () => {
    const result = evaluateOptionCReadiness({
      ...passingInputs(),
      reviewPeriodDays: 10,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("review_period_too_short");
    expect(result.thresholds.reviewPeriodDays.met).toBe(false);
    expect(result.thresholds.reviewPeriodDays.actual).toBe(10);
  });

  it("TC-09-A-02: sampleSize < 40 → blocker 'sample_size_insufficient'", () => {
    const result = evaluateOptionCReadiness({
      ...passingInputs(),
      rollup: freshRollup({ admitted_cluster_count: 20 }),
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("sample_size_insufficient");
    expect(result.thresholds.sampleSize.met).toBe(false);
    expect(result.thresholds.sampleSize.actual).toBe(20);
  });

  it("TC-09-A-03: routeAccuracy = 70 (< 80) → blocker 'route_accuracy_below_threshold'", () => {
    const result = evaluateOptionCReadiness({
      ...passingInputs(),
      routeAccuracy: 70,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("route_accuracy_below_threshold");
    expect(result.thresholds.routeAccuracy.met).toBe(false);
    expect(result.thresholds.routeAccuracy.actual).toBe(70);
  });

  it("TC-09-A-04: suppressionVariance = 15 (> 10) → blocker 'suppression_variance_too_high'", () => {
    const result = evaluateOptionCReadiness({
      ...passingInputs(),
      suppressionVariance: 15,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("suppression_variance_too_high");
    expect(result.thresholds.suppressionVariance.met).toBe(false);
    expect(result.thresholds.suppressionVariance.actual).toBe(15);
  });

  it("TC-09-A-05: routeAccuracy = undefined → blocker 'route_accuracy_not_measured'", () => {
    const inputs = passingInputs();
    const result = evaluateOptionCReadiness({
      ...inputs,
      routeAccuracy: undefined,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("route_accuracy_not_measured");
    expect(result.thresholds.routeAccuracy.actual).toBeUndefined();
    expect(result.thresholds.routeAccuracy.met).toBe(false);
  });

  it("TC-09-A-06: suppressionVariance = undefined → blocker 'suppression_variance_not_measured'", () => {
    const inputs = passingInputs();
    const result = evaluateOptionCReadiness({
      ...inputs,
      suppressionVariance: undefined,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("suppression_variance_not_measured");
    expect(result.thresholds.suppressionVariance.actual).toBeUndefined();
    expect(result.thresholds.suppressionVariance.met).toBe(false);
  });

  it("TC-09-A-07: stale KPI snapshot (generated_at > 7 days ago) → blocker 'stale_kpi_snapshot'", () => {
    const staleDate = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const result = evaluateOptionCReadiness({
      ...passingInputs(),
      rollup: makeRollup({
        generated_at: staleDate.toISOString(),
        admitted_cluster_count: 50,
      }),
    });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain("stale_kpi_snapshot");
    expect(result.thresholds.kpiSnapshotAge.met).toBe(false);
    expect(result.thresholds.kpiSnapshotAge.actualDays).toBeGreaterThan(7);
  });

  it("TC-09-A-08: checkOptionCGate — all thresholds pass but operatorEnable = false → permitted: false", () => {
    const result = checkOptionCGate({
      ...passingInputs(),
      operatorEnable: false,
    });

    expect(result.permitted).toBe(false);
    expect(result.mode).toBe("advisory");
    expect(result.reason).toMatch(/Operator enable/);
  });

  it("TC-09-A-09: checkOptionCGate — all thresholds pass but operatorEnable omitted → permitted: false", () => {
    const inputs = passingInputs();
    // operatorEnable not set (undefined)
    const result = checkOptionCGate(inputs);

    expect(result.permitted).toBe(false);
    expect(result.mode).toBe("advisory");
    expect(result.reason).toMatch(/Operator enable/);
  });
});

// ---------------------------------------------------------------------------
// TC-09-B: Thresholds met + explicit enable permits Option C readiness
// ---------------------------------------------------------------------------

describe("TC-09-B: checkOptionCGate — all thresholds met + operatorEnable: true", () => {
  it("TC-09-B-01: returns permitted: true and mode: option_c_ready", () => {
    const result = checkOptionCGate({
      ...passingInputs(),
      operatorEnable: true,
    });

    expect(result.permitted).toBe(true);
    expect(result.mode).toBe("option_c_ready");
    expect(result.reason).toContain("All Option C thresholds met");
    expect(result.readiness.ready).toBe(true);
    expect(result.readiness.blockers).toHaveLength(0);
  });

  it("TC-09-B-02: boundary values exactly at threshold limits pass", () => {
    // reviewPeriodDays = 14 (exactly), sampleSize = 40 (exactly),
    // routeAccuracy = 80 (exactly), suppressionVariance = 10 (exactly)
    const result = checkOptionCGate({
      rollup: freshRollup({ admitted_cluster_count: 40 }),
      reviewPeriodDays: 14,
      routeAccuracy: 80,
      suppressionVariance: 10,
      operatorEnable: true,
      now: NOW,
    });

    expect(result.permitted).toBe(true);
    expect(result.mode).toBe("option_c_ready");
    expect(result.readiness.thresholds.reviewPeriodDays.met).toBe(true);
    expect(result.readiness.thresholds.sampleSize.met).toBe(true);
    expect(result.readiness.thresholds.routeAccuracy.met).toBe(true);
    expect(result.readiness.thresholds.suppressionVariance.met).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-09-C: Kill switch immediately returns advisory posture
// ---------------------------------------------------------------------------

describe("TC-09-C: applyKillSwitch", () => {
  it("TC-09-C-01: returns advisory posture with activationBlocked: true", () => {
    const result = applyKillSwitch();

    expect(result.mode).toBe("advisory");
    expect(result.activationBlocked).toBe(true);
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("TC-09-C-02: custom reason is included in the result", () => {
    const result = applyKillSwitch("manual override");

    expect(result.mode).toBe("advisory");
    expect(result.activationBlocked).toBe(true);
    expect(result.reason).toContain("manual override");
  });
});

// ---------------------------------------------------------------------------
// Additional: multi-blocker scenario
// ---------------------------------------------------------------------------

describe("evaluateOptionCReadiness — multiple blockers accumulate", () => {
  it("returns all applicable blockers when multiple checks fail", () => {
    const staleDate = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = evaluateOptionCReadiness({
      rollup: makeRollup({
        generated_at: staleDate.toISOString(),
        admitted_cluster_count: 5,
      }),
      reviewPeriodDays: 7,
      routeAccuracy: undefined,
      suppressionVariance: undefined,
      now: NOW,
    });

    expect(result.ready).toBe(false);
    const codes = result.blockers.map((b) => b.code);
    expect(codes).toContain("stale_kpi_snapshot");
    expect(codes).toContain("review_period_too_short");
    expect(codes).toContain("sample_size_insufficient");
    expect(codes).toContain("route_accuracy_not_measured");
    expect(codes).toContain("suppression_variance_not_measured");
    expect(result.blockers.length).toBe(5);
  });
});
