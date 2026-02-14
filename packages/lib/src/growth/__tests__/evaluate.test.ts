import type { GrowthEvaluationInput } from "../evaluate.js";
import { evaluateGrowthLedger, evaluateThresholdStatus } from "../evaluate.js";
import type { StageThresholdDefinition } from "../types.js";

function createGreenInput(): GrowthEvaluationInput {
  return {
    metrics: {
      acquisition: {
        blended_cac_eur_cents: 1200,
        new_customers_count: 10,
      },
      activation: {
        sitewide_cvr_bps: 150,
        sessions_count: 1000,
      },
      revenue: {
        aov_eur_cents: 3400,
        orders_count: 40,
      },
      retention: {
        return_rate_30d_bps: 650,
        orders_shipped_count: 30,
      },
      referral: {
        referral_conversion_rate_bps: 130,
        referral_sessions_count: 200,
      },
    },
  };
}

describe("evaluateGrowthLedger", () => {
  test("TC-01: threshold direction logic supports higher/lower green/red outcomes", () => {
    const higherThreshold: StageThresholdDefinition = {
      metric: "metric_bps",
      unit: "bps",
      direction: "higher",
      green_threshold: 140,
      red_threshold: 90,
      validity_min_denominator: 1,
      denominator_metric: "sessions_count",
    };

    const lowerThreshold: StageThresholdDefinition = {
      metric: "metric_eur_cents",
      unit: "eur_cents",
      direction: "lower",
      green_threshold: 1300,
      red_threshold: 1500,
      validity_min_denominator: 1,
      denominator_metric: "new_customers_count",
    };

    expect(
      evaluateThresholdStatus(higherThreshold, {
        metric_bps: 150,
        sessions_count: 1000,
      }).status,
    ).toBe("green");

    expect(
      evaluateThresholdStatus(higherThreshold, {
        metric_bps: 80,
        sessions_count: 1000,
      }).status,
    ).toBe("red");

    expect(
      evaluateThresholdStatus(lowerThreshold, {
        metric_eur_cents: 1200,
        new_customers_count: 10,
      }).status,
    ).toBe("green");

    expect(
      evaluateThresholdStatus(lowerThreshold, {
        metric_eur_cents: 1600,
        new_customers_count: 10,
      }).status,
    ).toBe("red");
  });

  test("TC-02: validity denominator gaps emit insufficient_data", () => {
    const result = evaluateGrowthLedger({
      metrics: {
        ...createGreenInput().metrics,
        activation: {
          sitewide_cvr_bps: 120,
          sessions_count: 200,
        },
      },
    });

    expect(result.stageEvaluations.activation.status).toBe("insufficient_data");
    expect(result.overallStatus).toBe("yellow");
  });

  test("TC-03: after_valid stage transitions from non-blocking to blocking after denominator minimum", () => {
    const insufficient = evaluateGrowthLedger({
      metrics: {
        ...createGreenInput().metrics,
        retention: {
          return_rate_30d_bps: 900,
          orders_shipped_count: 20,
        },
      },
    });

    expect(insufficient.stageEvaluations.retention.status).toBe(
      "insufficient_data",
    );
    expect(insufficient.stageEvaluations.retention.is_blocking).toBe(false);
    expect(insufficient.overallStatus).toBe("green");

    const blocking = evaluateGrowthLedger({
      metrics: {
        ...createGreenInput().metrics,
        retention: {
          return_rate_30d_bps: 900,
          orders_shipped_count: 30,
        },
      },
    });

    expect(blocking.stageEvaluations.retention.status).toBe("red");
    expect(blocking.stageEvaluations.retention.is_blocking).toBe(true);
    expect(blocking.overallStatus).toBe("red");
    expect(blocking.guardrailSignal).toBe("kill");
    expect(blocking.actions).toContain(
      "Retention red: pause expansion and remediate product/service quality before re-scaling.",
    );
  });

  test("TC-04: evaluation is deterministic for identical input", () => {
    const input = createGreenInput();
    const first = evaluateGrowthLedger(input);
    const second = evaluateGrowthLedger(input);

    expect(first).toEqual(second);
  });

  test("TC-05: referral-only red does not force overall red", () => {
    const result = evaluateGrowthLedger({
      metrics: {
        ...createGreenInput().metrics,
        referral: {
          referral_conversion_rate_bps: 30,
          referral_sessions_count: 300,
        },
      },
    });

    expect(result.stageEvaluations.referral.status).toBe("red");
    expect(result.stageEvaluations.referral.is_blocking).toBe(false);
    expect(result.overallStatus).toBe("green");
    expect(result.guardrailSignal).toBe("scale");
  });
});
