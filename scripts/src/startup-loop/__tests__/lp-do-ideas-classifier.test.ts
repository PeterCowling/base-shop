/**
 * Tests for the lp-do-ideas classifier module.
 *
 * TC-01: P0 — valid risk_vector + risk_ref → RULE_LEGAL_EXPOSURE, auto_demoted: false
 * TC-02: P0R — incident_id present → RULE_REVENUE_PATH_BROKEN
 * TC-03: P0R — failure_metric + baseline_value (no incident_id) → P0R
 * TC-04: P1+Direct — funnel_step + metric_name + baseline_value → RULE_P1_DIRECT_CAUSAL, proximity: Direct
 * TC-05: P1M — area_anchor "per-transaction margin leakage" → RULE_P1M_MARGIN_LEAKAGE
 * TC-06: P2 — area_anchor "operator exception volume reduction" → RULE_P2_OPERATOR_EXCEPTION
 * TC-07: P3 — area_anchor "measurement and attribution quality" → RULE_P3_MEASUREMENT
 * TC-08: P4 — area_anchor "startup-loop process throughput" → RULE_P4_PROCESS_QUALITY
 * TC-09: P5 — empty input → RULE_P5_DEFAULT
 * TC-10: Auto-demotion — P0 without risk_ref → P4, RULE_INSUFFICIENT_EVIDENCE, auto_demoted: true
 * TC-11: Invalid risk_vector ("unknown-vector") → treated as absent → falls through to P5
 * TC-12: incident_id present → urgency U0
 * TC-13: deadline_date within 72h → urgency U0
 * TC-14: deadline_date exactly 72h from now → urgency U0 (boundary inclusive)
 * TC-15: deadline_date within 14 days (>72h) → urgency U1
 * TC-16: first_observed_at within 7 days → urgency U1
 * TC-17: leakage_estimate_value >= threshold (defined) → urgency U0
 * TC-18: leakage_estimate_value >= threshold (undefined) → NOT U0
 * TC-19: evidence present but no urgency gates → urgency U2
 * TC-20: no evidence at all → urgency U3
 * TC-21: P0 → own_priority_rank: 1, effective_priority_rank: 1
 * TC-22: P0R → rank 2
 * TC-23: P1+Direct → rank 3
 * TC-24: P1M → rank 4
 * TC-25: P2 → rank 7, P3 → rank 8, P4 → rank 9, P5 → rank 10
 * TC-26: classified_by === "lp-do-ideas-classifier-v1"
 * TC-27: classified_at matches injectable now ISO string
 * TC-28: status === "open"
 * TC-29: effort === "M"
 * TC-30: proximity === null for non-P1 tiers
 * TC-31: is_prerequisite === false
 * TC-32: parent_idea_id === null
 * TC-33: OWN_PRIORITY_RANK map — all 10 values including aliases
 */

import { describe, expect, it } from "@jest/globals";

import {
  classifyIdea,
  OWN_PRIORITY_RANK,
} from "../lp-do-ideas-classifier.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_NOW = new Date("2026-02-26T12:00:00.000Z");

// ---------------------------------------------------------------------------
// describe("decision tree")
// ---------------------------------------------------------------------------

describe("decision tree", () => {
  it("TC-01: risk_vector=security + risk_ref → P0, RULE_LEGAL_EXPOSURE, auto_demoted: false", () => {
    const result = classifyIdea(
      { risk_vector: "security", risk_ref: "CVE-2026-001" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P0");
    expect(result.reason_code).toBe("RULE_LEGAL_EXPOSURE");
    expect(result.auto_demoted).toBe(false);
  });

  it("TC-02: incident_id present → P0R, RULE_REVENUE_PATH_BROKEN", () => {
    const result = classifyIdea(
      { incident_id: "INC-001" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P0R");
    expect(result.reason_code).toBe("RULE_REVENUE_PATH_BROKEN");
  });

  it("TC-03: failure_metric + baseline_value (no incident_id) → P0R", () => {
    const result = classifyIdea(
      {
        incident_id: undefined,
        failure_metric: "checkout_cr",
        baseline_value: 0.45,
      },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P0R");
    expect(result.reason_code).toBe("RULE_REVENUE_PATH_BROKEN");
  });

  it("TC-04: funnel_step + metric_name + baseline_value → P1, proximity: Direct, RULE_P1_DIRECT_CAUSAL", () => {
    const result = classifyIdea(
      {
        funnel_step: "checkout_start",
        metric_name: "checkout_cr",
        baseline_value: 0.45,
      },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P1");
    expect(result.proximity).toBe("Direct");
    expect(result.reason_code).toBe("RULE_P1_DIRECT_CAUSAL");
  });

  it("TC-05: area_anchor 'per-transaction margin leakage' → P1M, RULE_P1M_MARGIN_LEAKAGE", () => {
    const result = classifyIdea(
      { area_anchor: "per-transaction margin leakage" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P1M");
    expect(result.reason_code).toBe("RULE_P1M_MARGIN_LEAKAGE");
  });

  it("TC-06: area_anchor 'operator exception volume reduction' → P2, RULE_P2_OPERATOR_EXCEPTION", () => {
    const result = classifyIdea(
      { area_anchor: "operator exception volume reduction" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P2");
    expect(result.reason_code).toBe("RULE_P2_OPERATOR_EXCEPTION");
  });

  it("TC-07: area_anchor 'measurement and attribution quality' → P3, RULE_P3_MEASUREMENT", () => {
    const result = classifyIdea(
      { area_anchor: "measurement and attribution quality" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P3");
    expect(result.reason_code).toBe("RULE_P3_MEASUREMENT");
  });

  it("TC-08: area_anchor 'startup-loop process throughput' → P4, RULE_P4_PROCESS_QUALITY", () => {
    const result = classifyIdea(
      { area_anchor: "startup-loop process throughput" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P4");
    expect(result.reason_code).toBe("RULE_P4_PROCESS_QUALITY");
  });

  it("TC-09: empty input → P5, RULE_P5_DEFAULT", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.priority_tier).toBe("P5");
    expect(result.reason_code).toBe("RULE_P5_DEFAULT");
  });
});

// ---------------------------------------------------------------------------
// describe("auto-demotion")
// ---------------------------------------------------------------------------

describe("auto-demotion", () => {
  it("TC-10: P0 without risk_ref → auto-demoted to P4, RULE_INSUFFICIENT_EVIDENCE, auto_demotion_reason non-empty", () => {
    const result = classifyIdea(
      { risk_vector: "security" },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P4");
    expect(result.reason_code).toBe("RULE_INSUFFICIENT_EVIDENCE");
    expect(result.auto_demoted).toBe(true);
    expect(typeof result.auto_demotion_reason).toBe("string");
    expect((result.auto_demotion_reason ?? "").length).toBeGreaterThan(0);
  });

  it("TC-11: invalid risk_vector ('unknown-vector') → treated as absent → falls through to P5", () => {
    const result = classifyIdea(
      { risk_vector: "unknown-vector" as unknown as import("../lp-do-ideas-classifier.js").RiskVector },
      { now: FIXED_NOW },
    );
    expect(result.priority_tier).toBe("P5");
    expect(result.reason_code).toBe("RULE_P5_DEFAULT");
    expect(result.auto_demoted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// describe("urgency admission")
// ---------------------------------------------------------------------------

describe("urgency admission", () => {
  it("TC-12: incident_id present → urgency U0", () => {
    const result = classifyIdea(
      { incident_id: "INC-001" },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U0");
  });

  it("TC-13: deadline_date within 72h → urgency U0", () => {
    const deadline = new Date(FIXED_NOW.getTime() + 48 * 60 * 60 * 1000);
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        deadline_date: deadline.toISOString(),
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U0");
  });

  it("TC-14: deadline_date exactly 72h from now → urgency U0 (boundary inclusive)", () => {
    const deadline = new Date(FIXED_NOW.getTime() + 72 * 60 * 60 * 1000);
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        deadline_date: deadline.toISOString(),
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U0");
  });

  it("TC-15: deadline_date within 14 days (>72h) → urgency U1", () => {
    const deadline = new Date(FIXED_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        deadline_date: deadline.toISOString(),
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U1");
  });

  it("TC-16: first_observed_at within 7 days → urgency U1", () => {
    const firstObserved = new Date(FIXED_NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        first_observed_at: firstObserved.toISOString(),
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U1");
  });

  it("TC-17: leakage_estimate_value >= threshold (defined) → urgency U0", () => {
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        leakage_estimate_value: 500,
        leakage_estimate_unit: "USD/day",
      },
      { now: FIXED_NOW, u0_leakage_threshold: 100 },
    );
    expect(result.urgency).toBe("U0");
  });

  it("TC-18: leakage_estimate_value >= threshold (undefined) → NOT U0 (leakage gate disabled)", () => {
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        leakage_estimate_value: 999999,
        leakage_estimate_unit: "USD/day",
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).not.toBe("U0");
  });

  it("TC-19: evidence present but no urgency gates → urgency U2", () => {
    const result = classifyIdea(
      {
        area_anchor: "some unrelated anchor",
        repro_ref: "logs/trace-001.txt",
      },
      { now: FIXED_NOW },
    );
    expect(result.urgency).toBe("U2");
  });

  it("TC-20: no evidence at all → urgency U3", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.urgency).toBe("U3");
  });
});

// ---------------------------------------------------------------------------
// describe("rank computation")
// ---------------------------------------------------------------------------

describe("rank computation", () => {
  it("TC-21: P0 → own_priority_rank: 1, effective_priority_rank: 1", () => {
    const result = classifyIdea(
      { risk_vector: "security", risk_ref: "CVE-2026-001" },
      { now: FIXED_NOW },
    );
    expect(result.own_priority_rank).toBe(1);
    expect(result.effective_priority_rank).toBe(1);
  });

  it("TC-22: P0R → own_priority_rank: 2, effective_priority_rank: 2", () => {
    const result = classifyIdea(
      { incident_id: "INC-001" },
      { now: FIXED_NOW },
    );
    expect(result.own_priority_rank).toBe(2);
    expect(result.effective_priority_rank).toBe(2);
  });

  it("TC-23: P1+Direct → own_priority_rank: 3, effective_priority_rank: 3", () => {
    const result = classifyIdea(
      {
        funnel_step: "checkout_start",
        metric_name: "checkout_cr",
        baseline_value: 0.45,
      },
      { now: FIXED_NOW },
    );
    expect(result.own_priority_rank).toBe(3);
    expect(result.effective_priority_rank).toBe(3);
  });

  it("TC-24: P1M → own_priority_rank: 4, effective_priority_rank: 4", () => {
    const result = classifyIdea(
      { area_anchor: "per-transaction margin leakage" },
      { now: FIXED_NOW },
    );
    expect(result.own_priority_rank).toBe(4);
    expect(result.effective_priority_rank).toBe(4);
  });

  it("TC-25: P2 → rank 7, P3 → rank 8, P4 → rank 9, P5 → rank 10", () => {
    const p2 = classifyIdea(
      { area_anchor: "operator exception volume reduction" },
      { now: FIXED_NOW },
    );
    expect(p2.own_priority_rank).toBe(7);
    expect(p2.effective_priority_rank).toBe(7);

    const p3 = classifyIdea(
      { area_anchor: "measurement and attribution quality" },
      { now: FIXED_NOW },
    );
    expect(p3.own_priority_rank).toBe(8);
    expect(p3.effective_priority_rank).toBe(8);

    const p4 = classifyIdea(
      { area_anchor: "startup-loop process throughput" },
      { now: FIXED_NOW },
    );
    expect(p4.own_priority_rank).toBe(9);
    expect(p4.effective_priority_rank).toBe(9);

    const p5 = classifyIdea({}, { now: FIXED_NOW });
    expect(p5.own_priority_rank).toBe(10);
    expect(p5.effective_priority_rank).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// describe("Phase 1 defaults")
// ---------------------------------------------------------------------------

describe("Phase 1 defaults", () => {
  it("TC-26: classified_by === 'lp-do-ideas-classifier-v1' always", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.classified_by).toBe("lp-do-ideas-classifier-v1");
  });

  it("TC-27: classified_at matches injectable now ISO string", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.classified_at).toBe(FIXED_NOW.toISOString());
  });

  it("TC-28: status === 'open' always", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.status).toBe("open");
  });

  it("TC-29: effort === 'M' always", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.effort).toBe("M");
  });

  it("TC-30: proximity === null for P0, P0R, P1M, P2, P3, P4, P5 tiers", () => {
    const p0 = classifyIdea(
      { risk_vector: "security", risk_ref: "CVE-2026-001" },
      { now: FIXED_NOW },
    );
    expect(p0.proximity).toBeNull();

    const p0r = classifyIdea(
      { incident_id: "INC-001" },
      { now: FIXED_NOW },
    );
    expect(p0r.proximity).toBeNull();

    const p1m = classifyIdea(
      { area_anchor: "per-transaction margin leakage" },
      { now: FIXED_NOW },
    );
    expect(p1m.proximity).toBeNull();

    const p2 = classifyIdea(
      { area_anchor: "operator exception volume reduction" },
      { now: FIXED_NOW },
    );
    expect(p2.proximity).toBeNull();

    const p3 = classifyIdea(
      { area_anchor: "measurement and attribution quality" },
      { now: FIXED_NOW },
    );
    expect(p3.proximity).toBeNull();

    const p4 = classifyIdea(
      { area_anchor: "startup-loop process throughput" },
      { now: FIXED_NOW },
    );
    expect(p4.proximity).toBeNull();

    const p5 = classifyIdea({}, { now: FIXED_NOW });
    expect(p5.proximity).toBeNull();
  });

  it("TC-31: is_prerequisite === false always in Phase 1", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.is_prerequisite).toBe(false);
  });

  it("TC-32: parent_idea_id === null always in Phase 1", () => {
    const result = classifyIdea({}, { now: FIXED_NOW });
    expect(result.parent_idea_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe("OWN_PRIORITY_RANK")
// ---------------------------------------------------------------------------

describe("OWN_PRIORITY_RANK", () => {
  it("TC-33: verify all 10 rank values including P1 proximity aliases", () => {
    expect(OWN_PRIORITY_RANK["P0"]).toBe(1);
    expect(OWN_PRIORITY_RANK["P0R"]).toBe(2);
    expect(OWN_PRIORITY_RANK["P1:Direct"]).toBe(3);
    expect(OWN_PRIORITY_RANK["P1_Direct"]).toBe(3);
    expect(OWN_PRIORITY_RANK["P1M"]).toBe(4);
    expect(OWN_PRIORITY_RANK["P1:Near"]).toBe(5);
    expect(OWN_PRIORITY_RANK["P1_Near"]).toBe(5);
    expect(OWN_PRIORITY_RANK["P1:Indirect"]).toBe(6);
    expect(OWN_PRIORITY_RANK["P1_Indirect"]).toBe(6);
    expect(OWN_PRIORITY_RANK["P2"]).toBe(7);
    expect(OWN_PRIORITY_RANK["P3"]).toBe(8);
    expect(OWN_PRIORITY_RANK["P4"]).toBe(9);
    expect(OWN_PRIORITY_RANK["P5"]).toBe(10);
  });
});
