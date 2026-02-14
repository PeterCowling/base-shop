import { applyPortfolioConstraints } from "../constraints.js";
import type { Hypothesis, PortfolioMetadata } from "../types.js";

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
  max_loss_if_false_per_experiment: 4500,
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

describe("applyPortfolioConstraints", () => {
  it("blocks when max concurrent capacity is reached", () => {
    const active = [
      makeHypothesis({ id: "A1", status: "active" }),
      makeHypothesis({ id: "A2", status: "active" }),
      makeHypothesis({ id: "A3", status: "active" }),
    ];
    const candidate = makeHypothesis({ id: "C1", status: "draft" });

    const result = applyPortfolioConstraints({
      hypotheses: [candidate],
      metadata,
      activeHypotheses: active,
      candidateActivationDate: "2026-02-13T10:00:00.000Z",
    });

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0].reasons[0]).toContain("max concurrent");
  });

  it("blocks when monthly budget is exceeded", () => {
    const active = [
      makeHypothesis({
        id: "A1",
        status: "active",
        required_spend: 4800,
        activated_date: "2026-02-03T08:00:00.000Z",
      }),
    ];
    const candidate = makeHypothesis({ id: "C2", required_spend: 400 });

    const result = applyPortfolioConstraints({
      hypotheses: [candidate],
      metadata,
      activeHypotheses: active,
      candidateActivationDate: "2026-02-13T10:00:00.000Z",
    });

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked[0].reasons.join(" ")).toContain("Monthly budget exhausted");
  });

  it("blocks when risk cap is exceeded", () => {
    const candidate = makeHypothesis({
      id: "C3",
      downside_estimate: 3500,
      required_spend: 1200,
      required_effort_days: 3,
    });

    const result = applyPortfolioConstraints({
      hypotheses: [candidate],
      metadata,
      activeHypotheses: [],
      candidateActivationDate: "2026-02-13T10:00:00.000Z",
    });

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked[0].reasons.join(" ")).toContain("risk cap");
  });

  it("blocks unresolved dependencies", () => {
    const candidate = makeHypothesis({
      id: "C4",
      dependency_hypothesis_ids: ["UPSTREAM-HYP"],
      dependency_card_ids: ["BRIK-ENG-0001"],
    });

    const result = applyPortfolioConstraints({
      hypotheses: [candidate],
      metadata,
      activeHypotheses: [],
      allHypothesisStatuses: {
        "UPSTREAM-HYP": "draft",
      },
      dependencyCardStatuses: {
        "BRIK-ENG-0001": "in-progress",
      },
      candidateActivationDate: "2026-02-13T10:00:00.000Z",
    });

    expect(result.admissible).toHaveLength(0);
    expect(result.blocked[0].reasons.join(" ")).toContain("Unresolved dependencies");
  });

  it("admits hypothesis when all constraints pass", () => {
    const candidate = makeHypothesis({
      id: "C5",
      required_spend: 200,
      required_effort_days: 1,
      dependency_hypothesis_ids: ["UPSTREAM-HYP"],
      dependency_card_ids: ["BRIK-ENG-0002"],
    });

    const result = applyPortfolioConstraints({
      hypotheses: [candidate],
      metadata,
      activeHypotheses: [
        makeHypothesis({
          id: "A6",
          status: "active",
          required_spend: 1000,
          activated_date: "2026-02-01T12:00:00.000Z",
        }),
      ],
      allHypothesisStatuses: {
        "UPSTREAM-HYP": "completed",
      },
      dependencyCardStatuses: {
        "BRIK-ENG-0002": "done",
      },
      candidateActivationDate: "2026-02-13T10:00:00.000Z",
    });

    expect(result.blocked).toHaveLength(0);
    expect(result.admissible).toHaveLength(1);
    expect(result.admissible[0].id).toBe("C5");
  });
});

