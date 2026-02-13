import { describe, expect, it } from "@jest/globals";

import type { Hypothesis, PortfolioMetadata } from "@acme/lib";

import {
  injectPortfolioScores,
  type PrioritizeCandidate,
} from "../prioritize-bridge";

const portfolioMetadataFixture: PortfolioMetadata = {
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

function makeHypothesis(
  id: string,
  overrides: Partial<Hypothesis> = {},
): Hypothesis {
  return {
    id,
    hypothesis_key: `BRIK-HYP-${id.replace("H", "")}`,
    business: "BRIK",
    title: `Hypothesis ${id}`,
    hypothesis_type: "offer",
    prior_confidence: 60,
    value_unit: "USD_GROSS_PROFIT",
    value_horizon_days: 90,
    upside_estimate: 12000,
    downside_estimate: 2500,
    detection_window_days: 21,
    required_spend: 600,
    required_effort_days: 2,
    dependency_hypothesis_ids: [],
    dependency_card_ids: [],
    stopping_rule: "Stop if signal does not improve after 10 days",
    status: "draft",
    created_date: "2026-02-13T10:00:00.000Z",
    owner: "pete",
    ...overrides,
  };
}

function findItem(
  items: Array<{ id: string }>,
  id: string,
): { id: string } & Record<string, unknown> {
  const found = items.find((item) => item.id === id);
  expect(found).toBeDefined();
  return found as { id: string } & Record<string, unknown>;
}

describe("injectPortfolioScores", () => {
  it("TC-01: linked items receive deterministic portfolio-normalized scores", () => {
    const hypotheses = [
      makeHypothesis("H1", {
        upside_estimate: 24000,
        downside_estimate: 800,
        required_spend: 300,
      }),
      makeHypothesis("H2", {
        upside_estimate: 7000,
        downside_estimate: 4500,
        required_spend: 1200,
      }),
    ];

    const candidates: PrioritizeCandidate[] = [
      {
        id: "C1",
        title: "High EV linked candidate",
        effort: 3,
        impact: 4,
        learning_value: 3,
        hypothesis_id: "H1",
      },
      {
        id: "C2",
        title: "Lower EV linked candidate",
        effort: 3,
        impact: 4,
        learning_value: 3,
        tags: ["hypothesis:H2"],
      },
    ];

    const result = injectPortfolioScores(
      candidates,
      hypotheses,
      portfolioMetadataFixture,
    );

    const first = findItem(result.items, "C1");
    const second = findItem(result.items, "C2");

    expect(first.portfolio_status).toBe("applied");
    expect(second.portfolio_status).toBe("applied");
    expect(first.final_score).toBeGreaterThan(second.final_score);
    expect(first.final_score).toBe(5);
    expect(second.final_score).toBe(1);
  });

  it("TC-02: unlinked items retain baseline prioritize score", () => {
    const candidates: PrioritizeCandidate[] = [
      {
        id: "C3",
        title: "Unlinked candidate",
        effort: 2,
        impact: 4,
        learning_value: 2,
      },
    ];

    const result = injectPortfolioScores(
      candidates,
      [makeHypothesis("H3")],
      portfolioMetadataFixture,
    );

    const item = findItem(result.items, "C3");
    expect(item.portfolio_status).toBe("unlinked");
    expect(item.baseline_score).toBe(3);
    expect(item.final_score).toBe(3);
    expect(item.portfolio_score_normalized).toBeNull();
  });

  it("TC-03: missing metadata gracefully skips injection", () => {
    const candidates: PrioritizeCandidate[] = [
      {
        id: "C4",
        title: "Linked candidate without metadata",
        effort: 2,
        impact: 5,
        learning_value: 3,
        hypothesis_id: "H4",
      },
    ];

    const result = injectPortfolioScores(candidates, [makeHypothesis("H4")], null);
    const item = findItem(result.items, "C4");

    expect(result.metadata_applied).toBe(false);
    expect(item.portfolio_status).toBe("metadata_missing");
    expect(item.final_score).toBe(item.baseline_score);
    expect(item.portfolio_score_normalized).toBeNull();
  });

  it("TC-04: blocked linked hypotheses return explicit reason with zero injection", () => {
    const blockedHypothesis = makeHypothesis("H5", {
      value_unit: "CLICK_RATE",
      upside_estimate: 100,
      downside_estimate: 50,
    });

    const candidates: PrioritizeCandidate[] = [
      {
        id: "C5",
        title: "Blocked linked candidate",
        effort: 3,
        impact: 4,
        learning_value: 4,
        hypothesis_id: "H5",
      },
    ];

    const result = injectPortfolioScores(
      candidates,
      [blockedHypothesis],
      portfolioMetadataFixture,
    );

    const item = findItem(result.items, "C5");
    expect(item.portfolio_status).toBe("blocked");
    expect(item.blocked_reason).toBe("non_monetary_unit_requires_conversion");
    expect(item.portfolio_score_normalized).toBe(0);
    expect(item.final_score).toBe(0);
  });
});
