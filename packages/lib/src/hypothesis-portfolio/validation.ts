import { z } from "zod";

import type {
  Hypothesis,
  HypothesisValidationOptions,
  PortfolioMetadata,
  ValidationResult,
} from "./types";

const RATE_LIKE_TOKENS = ["MRR", "ARR", "ARPU", "RATE", "PCT", "PERCENT"];
const MONETARY_UNIT_PATTERN = /^USD_[A-Z0-9_]+$/;

const hypothesisSchema: z.ZodType<Hypothesis> = z
  .object({
    id: z.string().min(1),
    hypothesis_key: z
      .string()
      .min(1)
      .regex(/^[A-Z0-9]+-HYP-\d+$/, "hypothesis_key must match <BIZ>-HYP-<NNN>"),
    hypothesis_uuid: z.string().optional(),
    business: z.string().min(1),
    title: z.string().min(1),
    hypothesis_type: z.enum([
      "market",
      "offer",
      "channel",
      "product",
      "pricing",
      "operations",
    ]),
    prior_confidence: z.number().min(0).max(100),
    value_unit: z.string().min(1),
    value_horizon_days: z.number().int().positive(),
    primary_metric_unit: z.string().optional(),
    upside_estimate: z.number(),
    downside_estimate: z.number(),
    detection_window_days: z.number().int().positive().nullable().optional(),
    required_spend: z.number().min(0),
    required_effort_days: z.number().min(0),
    dependency_hypothesis_ids: z.array(z.string().min(1)),
    dependency_card_ids: z.array(z.string().min(1)),
    stopping_rule: z.string().min(1),
    status: z.enum(["draft", "active", "stopped", "completed", "archived"]),
    activated_date: z.string().datetime().optional(),
    stopped_date: z.string().datetime().optional(),
    completed_date: z.string().datetime().optional(),
    outcome: z.enum(["success", "failure", "inconclusive"]).optional(),
    outcome_date: z.string().datetime().optional(),
    result_summary: z.string().optional(),
    observed_metric: z.string().optional(),
    observed_uplift: z.number().optional(),
    activation_override: z.boolean().optional(),
    activation_override_reason: z.string().optional(),
    activation_override_at: z.string().datetime().optional(),
    activation_override_by: z.string().optional(),
    created_date: z.string().datetime(),
    owner: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.status === "active" && !value.activated_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activated_date"],
        message: "status=active requires activated_date",
      });
    }

    if (value.status === "stopped" && !value.stopped_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stopped_date"],
        message: "status=stopped requires stopped_date",
      });
    }

    if (value.status === "completed" && !value.completed_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completed_date"],
        message: "status=completed requires completed_date",
      });
    }

    if (value.activation_override) {
      if (!value.activation_override_reason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activation_override_reason"],
          message: "activation_override=true requires activation_override_reason",
        });
      }
      if (!value.activation_override_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activation_override_at"],
          message: "activation_override=true requires activation_override_at",
        });
      }
      if (!value.activation_override_by) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activation_override_by"],
          message: "activation_override=true requires activation_override_by",
        });
      }
    }
  });

const portfolioMetadataSchema = z.object({
  max_concurrent_experiments: z.number().int().positive().default(3),
  monthly_experiment_budget: z.number().nonnegative().default(5000),
  budget_timezone: z.string().min(1).default("Europe/Rome"),
  default_value_unit: z.string().min(1),
  default_value_horizon_days: z.number().int().positive(),
  loaded_cost_per_person_day: z.number().nonnegative(),
  ev_score_weight: z.number().min(0).max(1).default(0.6),
  time_score_weight: z.number().min(0).max(1).default(0.25),
  cost_score_weight: z.number().min(0).max(1).default(0.15),
  risk_tolerance: z.enum(["low", "medium", "high"]).optional(),
  max_loss_if_false_per_experiment: z.number().nonnegative().optional(),
  default_detection_window_days: z.number().int().positive(),
  ev_normalization: z.literal("winsorized_p10_p90_nearest_rank").optional(),
  cost_normalization: z.literal("winsorized_p10_p90_nearest_rank").optional(),
});

function isEvEligibleMonetaryUnit(valueUnit: string): boolean {
  if (!MONETARY_UNIT_PATTERN.test(valueUnit)) {
    return false;
  }

  return !RATE_LIKE_TOKENS.some((token) => valueUnit.includes(token));
}

function makeSchemaError(message: string, path?: string[]): ValidationResult<never> {
  return {
    ok: false,
    error: {
      code: "schema_validation_failed",
      message,
      path,
    },
  };
}

export function validateHypothesis(
  hypothesisInput: unknown,
  options: HypothesisValidationOptions = {},
): ValidationResult<Hypothesis> {
  const parsed = hypothesisSchema.safeParse(hypothesisInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return makeSchemaError(firstIssue?.message ?? "Invalid hypothesis", firstIssue?.path.map(String));
  }

  const hypothesis = { ...parsed.data };

  if (!hypothesis.outcome_date) {
    if (hypothesis.status === "completed" && hypothesis.completed_date) {
      hypothesis.outcome_date = hypothesis.completed_date;
    } else if (hypothesis.status === "stopped" && hypothesis.stopped_date) {
      hypothesis.outcome_date = hypothesis.stopped_date;
    }
  }

  if (
    (hypothesis.detection_window_days == null || hypothesis.detection_window_days === undefined) &&
    !options.portfolioDefaults?.default_detection_window_days
  ) {
    return {
      ok: false,
      error: {
        code: "detection_window_fallback_required",
        message:
          "detection_window_days is null but no portfolio default_detection_window_days was provided",
        path: ["detection_window_days"],
      },
    };
  }

  if (options.evRanked && !isEvEligibleMonetaryUnit(hypothesis.value_unit)) {
    return {
      ok: false,
      error: {
        code: "non_monetary_unit_requires_conversion",
        message:
          "value_unit must be a USD integrated monetary unit for EV ranking (rate-like units are not allowed)",
        path: ["value_unit"],
      },
    };
  }

  if (
    options.portfolioDomain &&
    (hypothesis.value_unit !== options.portfolioDomain.valueUnit ||
      hypothesis.value_horizon_days !== options.portfolioDomain.valueHorizonDays)
  ) {
    return {
      ok: false,
      error: {
        code: "unit_horizon_mismatch",
        message:
          "hypothesis unit/horizon does not match portfolio default ranking domain",
        path: ["value_unit", "value_horizon_days"],
      },
    };
  }

  return { ok: true, value: hypothesis };
}

export function validatePortfolioMetadata(
  metadataInput: unknown,
): ValidationResult<PortfolioMetadata> {
  const parsed = portfolioMetadataSchema.safeParse(metadataInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return makeSchemaError(
      firstIssue?.message ?? "Invalid portfolio metadata",
      firstIssue?.path.map(String),
    );
  }

  const metadata = parsed.data;
  const weightSum =
    metadata.ev_score_weight + metadata.time_score_weight + metadata.cost_score_weight;
  const epsilon = 1e-9;
  if (Math.abs(weightSum - 1) > epsilon) {
    return {
      ok: false,
      error: {
        code: "weight_sum_must_equal_one",
        message:
          "portfolio score weights must sum to exactly 1 (ev_score_weight + time_score_weight + cost_score_weight)",
        path: ["ev_score_weight", "time_score_weight", "cost_score_weight"],
      },
    };
  }

  if (!isEvEligibleMonetaryUnit(metadata.default_value_unit)) {
    return {
      ok: false,
      error: {
        code: "non_monetary_unit_requires_conversion",
        message:
          "default_value_unit must be EV-eligible monetary unit (USD integrated unit, not rate-like)",
        path: ["default_value_unit"],
      },
    };
  }

  return { ok: true, value: metadata };
}
