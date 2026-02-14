import { rankHypotheses } from "../ranking";
import type { Hypothesis, PortfolioMetadata } from "../types";

const metadata: PortfolioMetadata = {
  max_concurrent_experiments: 3,
  monthly_experiment_budget: 5000,
  budget_timezone: "Europe/Rome",
  default_value_unit: "USD_GROSS_PROFIT",
  default_value_horizon_days: 90,
  loaded_cost_per_person_day: 300,
  ev_score_weight: 0.6,
  time_score_weight: 0.25,
  cost_score_weight: 0.15,
  default_detection_window_days: 45,
};

function makeHypothesis(overrides: Partial<Hypothesis>): Hypothesis {
  return {
    id: "HYP-1",
    hypothesis_key: "BRIK-HYP-001",
    business: "BRIK",
    title: "Default hypothesis",
    hypothesis_type: "offer",
    prior_confidence: 60,
    value_unit: "USD_GROSS_PROFIT",
    value_horizon_days: 90,
    upside_estimate: 10000,
    downside_estimate: 2000,
    detection_window_days: 14,
    required_spend: 500,
    required_effort_days: 2,
    dependency_hypothesis_ids: [],
    dependency_card_ids: [],
    stopping_rule: "Stop if no lift",
    status: "draft",
    created_date: "2026-02-13T09:00:00.000Z",
    owner: "pete",
    ...overrides,
  };
}

describe("rankHypotheses", () => {
  it("ranks high EV + short detection ahead of same EV + long detection", () => {
    const fast = makeHypothesis({
      id: "FAST",
      hypothesis_key: "BRIK-HYP-001",
      detection_window_days: 7,
      upside_estimate: 15000,
      downside_estimate: 2000,
    });
    const slow = makeHypothesis({
      id: "SLOW",
      hypothesis_key: "BRIK-HYP-002",
      detection_window_days: 90,
      upside_estimate: 15000,
      downside_estimate: 2000,
    });

    const result = rankHypotheses([slow, fast], metadata);

    expect(result.admissible).toHaveLength(2);
    expect(result.admissible[0].id).toBe("FAST");
    expect(result.admissible[1].id).toBe("SLOW");
  });

  it("marks negative EV hypothesis as inadmissible", () => {
    const negative = makeHypothesis({
      id: "NEG",
      hypothesis_key: "BRIK-HYP-003",
      prior_confidence: 40,
      upside_estimate: 8000,
      downside_estimate: 6000,
      required_spend: 2200,
      required_effort_days: 4,
    });

    const result = rankHypotheses([negative], metadata);

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0].inadmissible_reason).toBe("negative_ev");
  });

  it("uses default detection window when value is null", () => {
    const withFallback = makeHypothesis({
      id: "FALLBACK",
      hypothesis_key: "BRIK-HYP-004",
      detection_window_days: null,
    });
    const normal = makeHypothesis({
      id: "NORMAL",
      hypothesis_key: "BRIK-HYP-005",
      detection_window_days: 10,
    });

    const result = rankHypotheses([withFallback, normal], metadata);

    expect(result.admissible).toHaveLength(2);
    const fallback = result.admissible.find((item) => item.id === "FALLBACK");
    expect(fallback?.time_norm).toBeDefined();
    expect(fallback?.time_norm).toBeGreaterThanOrEqual(0);
    expect(fallback?.time_norm).toBeLessThanOrEqual(1);
  });

  it("blocks domain mismatch hypothesis", () => {
    const mismatch = makeHypothesis({
      id: "MISMATCH",
      hypothesis_key: "BRIK-HYP-006",
      value_horizon_days: 30,
    });

    const result = rankHypotheses([mismatch], metadata);

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked[0].inadmissible_reason).toBe("unit_horizon_mismatch");
  });

  it("blocks non-monetary unit hypothesis", () => {
    const nonMonetary = makeHypothesis({
      id: "NONMON",
      hypothesis_key: "BRIK-HYP-007",
      value_unit: "SIGNUPS",
    });

    const result = rankHypotheses([nonMonetary], metadata);

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked[0].inadmissible_reason).toBe(
      "non_monetary_unit_requires_conversion",
    );
  });

  it("keeps deterministic order with ties by EV then spend", () => {
    const a = makeHypothesis({
      id: "A",
      hypothesis_key: "BRIK-HYP-008",
      required_spend: 400,
      detection_window_days: 20,
    });
    const b = makeHypothesis({
      id: "B",
      hypothesis_key: "BRIK-HYP-009",
      required_spend: 500,
      detection_window_days: 20,
    });
    const c = makeHypothesis({
      id: "C",
      hypothesis_key: "BRIK-HYP-010",
      required_spend: 500,
      detection_window_days: 20,
      upside_estimate: 12000,
    });

    const result = rankHypotheses([b, c, a], metadata);

    expect(result.admissible[0].id).toBe("C");
    expect(result.admissible[1].id).toBe("A");
    expect(result.admissible[2].id).toBe("B");
  });
});

