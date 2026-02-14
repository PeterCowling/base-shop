import { createHash } from "node:crypto";

import { z } from "zod";

import {
  BLOCKING_MODE_VALUES,
  GROWTH_LEDGER_STATUS_VALUES,
  GROWTH_METRIC_UNIT_VALUES,
  GROWTH_STAGE_KEYS,
  type GrowthLedger,
  type GrowthStageDefinition,
  type GrowthStageKey,
  METRIC_KIND_VALUES,
  type StageThresholdDefinition,
  THRESHOLD_DIRECTION_VALUES,
  type ThresholdSet,
} from "./types.js";

export const STAGE_POLICY_DEFAULTS: Record<GrowthStageKey, { blocking_mode: typeof BLOCKING_MODE_VALUES[number] }> = {
  acquisition: { blocking_mode: "always" },
  activation: { blocking_mode: "always" },
  revenue: { blocking_mode: "always" },
  retention: { blocking_mode: "after_valid" },
  referral: { blocking_mode: "never" },
};

const stagePolicySchema = z.object({
  blocking_mode: z.enum(BLOCKING_MODE_VALUES),
});

const metricDefinitionSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    unit: z.enum(GROWTH_METRIC_UNIT_VALUES),
    kind: z.enum(METRIC_KIND_VALUES),
    formula: z.string().optional(),
    required_metrics: z.array(z.string()).optional(),
    denominator_metric: z.string().optional(),
  })
  .superRefine((metric, ctx) => {
    if (metric.unit === "eur_cents" && !metric.key.endsWith("_eur_cents")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Metric ${metric.key} must end with _eur_cents for eur_cents unit`,
      });
    }

    if (metric.unit === "bps" && !metric.key.endsWith("_bps")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Metric ${metric.key} must end with _bps for bps unit`,
      });
    }
  });

const stageThresholdSchema = z
  .object({
    metric: z.string().min(1),
    unit: z.enum(GROWTH_METRIC_UNIT_VALUES),
    direction: z.enum(THRESHOLD_DIRECTION_VALUES),
    green_threshold: z.number().int(),
    red_threshold: z.number().int(),
    validity_min_denominator: z.number().int().nonnegative(),
    denominator_metric: z.string().optional(),
  })
  .superRefine((threshold, ctx) => {
    if (threshold.direction === "higher" && threshold.green_threshold < threshold.red_threshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${threshold.metric}: green_threshold must be >= red_threshold when direction=higher`,
      });
    }

    if (threshold.direction === "lower" && threshold.green_threshold > threshold.red_threshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${threshold.metric}: green_threshold must be <= red_threshold when direction=lower`,
      });
    }
  });

const growthStageStateSchema = z.object({
  status: z.enum(GROWTH_LEDGER_STATUS_VALUES),
  policy: stagePolicySchema,
  metrics: z.record(z.string(), z.number().int().nullable()),
  reasons: z.array(z.string()),
});

const growthLedgerStagesSchema = z.object({
  acquisition: growthStageStateSchema,
  activation: growthStageStateSchema,
  revenue: growthStageStateSchema,
  retention: growthStageStateSchema,
  referral: growthStageStateSchema,
});

export const growthStageDefinitionSchema = z.object({
  key: z.enum(GROWTH_STAGE_KEYS),
  label: z.string().min(1),
  stage_policy: stagePolicySchema,
  metrics: z.array(metricDefinitionSchema).min(2),
  thresholds: z.array(stageThresholdSchema),
});

export const growthCatalogSchema = z
  .record(z.enum(GROWTH_STAGE_KEYS), growthStageDefinitionSchema)
  .superRefine((catalog, ctx) => {
    for (const stage of GROWTH_STAGE_KEYS) {
      const definition = catalog[stage];
      if (!definition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing stage definition: ${stage}`,
        });
        continue;
      }

      if (definition.stage_policy.blocking_mode !== STAGE_POLICY_DEFAULTS[stage].blocking_mode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${stage} blocking mode must be ${STAGE_POLICY_DEFAULTS[stage].blocking_mode}`,
        });
      }

      const metricKeys = new Set(definition.metrics.map((metric) => metric.key));
      for (const metric of definition.metrics) {
        for (const requiredMetric of metric.required_metrics ?? []) {
          if (!metricKeys.has(requiredMetric)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${stage}.${metric.key} requires unknown metric ${requiredMetric}`,
            });
          }
        }
      }

      for (const threshold of definition.thresholds) {
        if (!metricKeys.has(threshold.metric)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${stage} threshold references unknown metric ${threshold.metric}`,
          });
        }

        if (threshold.unit === "bps" && threshold.validity_min_denominator <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${stage}.${threshold.metric} must declare a positive validity_min_denominator`,
          });
        }
      }
    }
  });

export const thresholdSetSchema = z.object({
  threshold_set_id: z.string().regex(/^gts_[a-f0-9]{12}$/),
  threshold_set_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  generated_at: z.string().datetime({ offset: true }),
  stages: z.object({
    acquisition: z.array(stageThresholdSchema),
    activation: z.array(stageThresholdSchema),
    revenue: z.array(stageThresholdSchema),
    retention: z.array(stageThresholdSchema),
    referral: z.array(stageThresholdSchema),
  }),
});

export const growthLedgerSchema: z.ZodType<GrowthLedger> = z.object({
  schema_version: z.literal(1),
  ledger_revision: z.number().int().nonnegative(),
  business: z.string().min(1),
  period: z.object({
    period_id: z.string().min(1),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    forecast_id: z.string().min(1),
  }),
  threshold_set_id: z.string().regex(/^gts_[a-f0-9]{12}$/),
  threshold_set_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  threshold_locked_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  stages: growthLedgerStagesSchema,
});

export const GROWTH_METRIC_CATALOG: Record<GrowthStageKey, GrowthStageDefinition> = {
  acquisition: {
    key: "acquisition",
    label: "Acquisition",
    stage_policy: STAGE_POLICY_DEFAULTS.acquisition,
    metrics: [
      { key: "spend_eur_cents", label: "Spend", unit: "eur_cents", kind: "primitive" },
      { key: "new_customers_count", label: "New customers", unit: "count", kind: "primitive" },
      {
        key: "blended_cac_eur_cents",
        label: "Blended CAC",
        unit: "eur_cents",
        kind: "derived",
        formula: "spend_eur_cents / new_customers_count",
        required_metrics: ["spend_eur_cents", "new_customers_count"],
        denominator_metric: "new_customers_count",
      },
    ],
    thresholds: [
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
  },
  activation: {
    key: "activation",
    label: "Activation",
    stage_policy: STAGE_POLICY_DEFAULTS.activation,
    metrics: [
      { key: "sessions_count", label: "Sessions", unit: "count", kind: "primitive" },
      { key: "orders_count", label: "Orders", unit: "count", kind: "primitive" },
      {
        key: "sitewide_cvr_bps",
        label: "Sitewide CVR",
        unit: "bps",
        kind: "derived",
        formula: "orders_count * 10000 / sessions_count",
        required_metrics: ["orders_count", "sessions_count"],
        denominator_metric: "sessions_count",
      },
    ],
    thresholds: [
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
  },
  revenue: {
    key: "revenue",
    label: "Revenue",
    stage_policy: STAGE_POLICY_DEFAULTS.revenue,
    metrics: [
      { key: "gross_revenue_eur_cents", label: "Gross revenue", unit: "eur_cents", kind: "primitive" },
      { key: "orders_count", label: "Orders", unit: "count", kind: "primitive" },
      {
        key: "aov_eur_cents",
        label: "AOV",
        unit: "eur_cents",
        kind: "derived",
        formula: "gross_revenue_eur_cents / orders_count",
        required_metrics: ["gross_revenue_eur_cents", "orders_count"],
        denominator_metric: "orders_count",
      },
    ],
    thresholds: [
      {
        metric: "aov_eur_cents",
        unit: "eur_cents",
        direction: "higher",
        green_threshold: 3300,
        red_threshold: 3100,
        validity_min_denominator: 10,
        denominator_metric: "orders_count",
      },
    ],
  },
  retention: {
    key: "retention",
    label: "Retention",
    stage_policy: STAGE_POLICY_DEFAULTS.retention,
    metrics: [
      { key: "orders_shipped_count", label: "Orders shipped", unit: "count", kind: "primitive" },
      { key: "returned_orders_count", label: "Returned orders", unit: "count", kind: "primitive" },
      {
        key: "return_rate_30d_bps",
        label: "Return rate",
        unit: "bps",
        kind: "derived",
        formula: "returned_orders_count * 10000 / orders_shipped_count",
        required_metrics: ["returned_orders_count", "orders_shipped_count"],
        denominator_metric: "orders_shipped_count",
      },
    ],
    thresholds: [
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
  },
  referral: {
    key: "referral",
    label: "Referral",
    stage_policy: STAGE_POLICY_DEFAULTS.referral,
    metrics: [
      { key: "referral_sessions_count", label: "Referral sessions", unit: "count", kind: "primitive" },
      { key: "referral_orders_count", label: "Referral orders", unit: "count", kind: "primitive" },
      {
        key: "referral_conversion_rate_bps",
        label: "Referral conversion",
        unit: "bps",
        kind: "derived",
        formula: "referral_orders_count * 10000 / referral_sessions_count",
        required_metrics: ["referral_orders_count", "referral_sessions_count"],
        denominator_metric: "referral_sessions_count",
      },
    ],
    thresholds: [
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
  },
};

export function validateGrowthCatalog(
  catalog: Record<GrowthStageKey, GrowthStageDefinition> = GROWTH_METRIC_CATALOG
): { valid: boolean; errors: string[] } {
  const result = growthCatalogSchema.safeParse(catalog);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalizeJson(entry));
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};

    for (const key of Object.keys(record).sort()) {
      next[key] = canonicalizeJson(record[key]);
    }

    return next;
  }

  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalizeJson(value));
}

export function createThresholdSetHash(stages: Record<GrowthStageKey, StageThresholdDefinition[]>): string {
  const canonicalPayload = canonicalStringify(stages);
  const digest = createHash("sha256").update(canonicalPayload).digest("hex");
  return `sha256:${digest}`;
}

export function createThresholdSetId(thresholdSetHash: string): string {
  const [, digest] = thresholdSetHash.split(":", 2);
  return `gts_${digest.slice(0, 12)}`;
}

export function buildThresholdSet(
  stages: Record<GrowthStageKey, StageThresholdDefinition[]>,
  generatedAt: string
): ThresholdSet {
  const thresholdSetHash = createThresholdSetHash(stages);
  const thresholdSetId = createThresholdSetId(thresholdSetHash);

  return {
    threshold_set_id: thresholdSetId,
    threshold_set_hash: thresholdSetHash,
    generated_at: generatedAt,
    stages,
  };
}

export type GrowthCatalog = z.infer<typeof growthCatalogSchema>;
export type GrowthLedgerRecord = z.infer<typeof growthLedgerSchema>;
export type ThresholdSetRecord = z.infer<typeof thresholdSetSchema>;
