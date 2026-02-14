import {
  buildThresholdSet,
  GROWTH_METRIC_CATALOG,
  growthLedgerSchema,
  thresholdSetSchema,
  validateGrowthCatalog,
} from "../schema.js";
import type { GrowthStageKey, StageThresholdDefinition } from "../types.js";

describe("growth schema", () => {
  test("TC-01: schema declares all 5 AARRR stages with required stage policy fields", () => {
    const stages = Object.keys(GROWTH_METRIC_CATALOG).sort();
    expect(stages).toEqual([
      "acquisition",
      "activation",
      "referral",
      "retention",
      "revenue",
    ]);

    for (const stage of Object.values(GROWTH_METRIC_CATALOG)) {
      expect(stage.stage_policy).toBeDefined();
      expect(stage.stage_policy.blocking_mode).toBeDefined();
      expect(stage.metrics.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("TC-02: integer-unit invariants are enforced for metrics and thresholds", () => {
    const validCatalog = validateGrowthCatalog();
    expect(validCatalog.valid).toBe(true);

    const invalidThresholdSet = thresholdSetSchema.safeParse({
      threshold_set_id: "gts_123456789abc",
      threshold_set_hash:
        "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      generated_at: "2026-02-13T00:00:00.000Z",
      stages: {
        acquisition: [
          {
            metric: "blended_cac_eur_cents",
            unit: "eur_cents",
            direction: "lower",
            green_threshold: 1300.5,
            red_threshold: 1500,
            validity_min_denominator: 1,
          },
        ],
        activation: [],
        revenue: [],
        retention: [],
        referral: [],
      },
    });

    expect(invalidThresholdSet.success).toBe(false);
  });

  test("TC-03: growth ledger runtime schema accepts deterministic integer snapshot", () => {
    const parsed = growthLedgerSchema.safeParse({
      schema_version: 1,
      ledger_revision: 0,
      business: "HEAD",
      period: {
        period_id: "2026-W07",
        start_date: "2026-02-09",
        end_date: "2026-02-15",
        forecast_id: "HEAD-FC-2026Q1",
      },
      threshold_set_id: "gts_123456789abc",
      threshold_set_hash:
        "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      threshold_locked_at: "2026-02-13T00:00:00.000Z",
      updated_at: "2026-02-13T00:00:00.000Z",
      stages: {
        acquisition: {
          status: "yellow",
          policy: { blocking_mode: "always" },
          metrics: { blended_cac_eur_cents: 1400 },
          reasons: [],
        },
        activation: {
          status: "green",
          policy: { blocking_mode: "always" },
          metrics: { sitewide_cvr_bps: 145 },
          reasons: [],
        },
        revenue: {
          status: "green",
          policy: { blocking_mode: "always" },
          metrics: { aov_eur_cents: 3300 },
          reasons: [],
        },
        retention: {
          status: "insufficient_data",
          policy: { blocking_mode: "after_valid" },
          metrics: { return_rate_30d_bps: null },
          reasons: ["orders_shipped_count < 25"],
        },
        referral: {
          status: "not_tracked",
          policy: { blocking_mode: "never" },
          metrics: { referral_conversion_rate_bps: null },
          reasons: ["tracking not enabled"],
        },
      },
    });

    expect(parsed.success).toBe(true);
  });

  test("TC-04: HEAD and PET guardrail thresholds map into content-addressed threshold set", () => {
    const stages: Record<GrowthStageKey, StageThresholdDefinition[]> = {
      acquisition: [
        {
          metric: "blended_cac_eur_cents",
          unit: "eur_cents",
          direction: "lower",
          green_threshold: 1300,
          red_threshold: 1500,
          validity_min_denominator: 1,
          denominator_metric: "new_customers_count",
        },
      ],
      activation: [
        {
          metric: "sitewide_cvr_bps",
          unit: "bps",
          direction: "higher",
          green_threshold: 140,
          red_threshold: 90,
          validity_min_denominator: 500,
          denominator_metric: "sessions_count",
        },
      ],
      revenue: [
        {
          metric: "payment_success_rate_bps",
          unit: "bps",
          direction: "higher",
          green_threshold: 9700,
          red_threshold: 9700,
          validity_min_denominator: 100,
          denominator_metric: "payment_attempts_count",
        },
      ],
      retention: [
        {
          metric: "return_rate_30d_bps",
          unit: "bps",
          direction: "lower",
          green_threshold: 700,
          red_threshold: 800,
          validity_min_denominator: 25,
          denominator_metric: "orders_shipped_count",
        },
      ],
      referral: [
        {
          metric: "referral_conversion_rate_bps",
          unit: "bps",
          direction: "higher",
          green_threshold: 120,
          red_threshold: 50,
          validity_min_denominator: 100,
          denominator_metric: "referral_sessions_count",
        },
      ],
    };

    const first = buildThresholdSet(stages, "2026-02-13T00:00:00.000Z");
    const second = buildThresholdSet(stages, "2026-02-13T00:00:00.000Z");

    expect(first.threshold_set_hash).toBe(second.threshold_set_hash);
    expect(first.threshold_set_id).toBe(second.threshold_set_id);
    expect(first.threshold_set_id).toMatch(/^gts_[a-f0-9]{12}$/);
    expect(first.threshold_set_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
