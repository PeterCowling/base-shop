import {
  validateHypothesis,
  validatePortfolioMetadata,
} from "../validation.js";

const baseHypothesis = {
  id: "BRIK-IDEA-0042",
  hypothesis_key: "BRIK-HYP-042",
  business: "BRIK",
  title: "Terrace breakfast upsell improves booking margin",
  hypothesis_type: "offer" as const,
  prior_confidence: 60,
  value_unit: "USD_GROSS_PROFIT",
  value_horizon_days: 90,
  upside_estimate: 15000,
  downside_estimate: 2000,
  detection_window_days: 14,
  required_spend: 500,
  required_effort_days: 2,
  dependency_hypothesis_ids: [],
  dependency_card_ids: [],
  stopping_rule: "Stop if attach rate remains below 2% after 7 days",
  status: "draft" as const,
  created_date: "2026-02-13T09:00:00.000Z",
  owner: "pete",
};

describe("hypothesis-portfolio validation", () => {
  describe("validateHypothesis", () => {
    it("passes for valid hypothesis input", () => {
      const result = validateHypothesis(baseHypothesis, {
        portfolioDefaults: { default_detection_window_days: 45 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.hypothesis_key).toBe("BRIK-HYP-042");
      }
    });

    it("fails for missing required field", () => {
      const { title: _title, ...input } = baseHypothesis;
      const result = validateHypothesis(input, {
        portfolioDefaults: { default_detection_window_days: 45 },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("schema_validation_failed");
        expect(result.error.message).toContain("Required");
      }
    });

    it("fails for out-of-range prior_confidence", () => {
      const result = validateHypothesis(
        { ...baseHypothesis, prior_confidence: 140 },
        { portfolioDefaults: { default_detection_window_days: 45 } },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("schema_validation_failed");
        expect(result.error.path).toEqual(["prior_confidence"]);
      }
    });

    it("fails for invalid dependency format", () => {
      const result = validateHypothesis(
        {
          ...baseHypothesis,
          dependency_hypothesis_ids: [""],
        },
        { portfolioDefaults: { default_detection_window_days: 45 } },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("schema_validation_failed");
        expect(result.error.path?.[0]).toBe("dependency_hypothesis_ids");
      }
    });

    it("accepts null detection window when fallback exists", () => {
      const result = validateHypothesis(
        { ...baseHypothesis, detection_window_days: null },
        { portfolioDefaults: { default_detection_window_days: 45 } },
      );

      expect(result.ok).toBe(true);
    });

    it("rejects non-monetary unit for EV-ranked set", () => {
      const result = validateHypothesis(
        { ...baseHypothesis, value_unit: "SIGNUPS" },
        {
          evRanked: true,
          portfolioDefaults: { default_detection_window_days: 45 },
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("non_monetary_unit_requires_conversion");
      }
    });

    it("rejects domain mismatch with portfolio defaults", () => {
      const result = validateHypothesis(baseHypothesis, {
        portfolioDefaults: { default_detection_window_days: 45 },
        portfolioDomain: {
          valueUnit: "USD_NET_CASHFLOW",
          valueHorizonDays: 30,
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("unit_horizon_mismatch");
      }
    });

    it("fails active status without activated_date", () => {
      const result = validateHypothesis(
        { ...baseHypothesis, status: "active" as const },
        { portfolioDefaults: { default_detection_window_days: 45 } },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("schema_validation_failed");
        expect(result.error.path).toEqual(["activated_date"]);
      }
    });

    it("fails forced activation without override reason metadata", () => {
      const result = validateHypothesis(
        {
          ...baseHypothesis,
          status: "active" as const,
          activated_date: "2026-02-13T10:00:00.000Z",
          activation_override: true,
          activation_override_at: "2026-02-13T10:00:00.000Z",
          activation_override_by: "pete",
        },
        { portfolioDefaults: { default_detection_window_days: 45 } },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("schema_validation_failed");
        expect(result.error.path).toEqual(["activation_override_reason"]);
      }
    });
  });

  describe("validatePortfolioMetadata", () => {
    it("passes for valid metadata", () => {
      const result = validatePortfolioMetadata({
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
      });

      expect(result.ok).toBe(true);
    });

    it("fails when weights do not sum to one", () => {
      const result = validatePortfolioMetadata({
        max_concurrent_experiments: 3,
        monthly_experiment_budget: 5000,
        budget_timezone: "Europe/Rome",
        default_value_unit: "USD_GROSS_PROFIT",
        default_value_horizon_days: 90,
        loaded_cost_per_person_day: 300,
        ev_score_weight: 0.6,
        time_score_weight: 0.3,
        cost_score_weight: 0.15,
        default_detection_window_days: 45,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("weight_sum_must_equal_one");
      }
    });
  });
});

