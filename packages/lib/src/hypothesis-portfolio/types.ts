export type HypothesisType =
  | "market"
  | "offer"
  | "channel"
  | "product"
  | "pricing"
  | "operations";

export type HypothesisStatus =
  | "draft"
  | "active"
  | "stopped"
  | "completed"
  | "archived";

export type HypothesisOutcome = "success" | "failure" | "inconclusive";

export interface Hypothesis {
  id: string;
  hypothesis_key: string;
  hypothesis_uuid?: string;
  business: string;
  title: string;
  hypothesis_type: HypothesisType;
  prior_confidence: number;
  value_unit: string;
  value_horizon_days: number;
  primary_metric_unit?: string;
  upside_estimate: number;
  downside_estimate: number;
  detection_window_days?: number | null;
  required_spend: number;
  required_effort_days: number;
  dependency_hypothesis_ids: string[];
  dependency_card_ids: string[];
  stopping_rule: string;
  status: HypothesisStatus;
  activated_date?: string;
  stopped_date?: string;
  completed_date?: string;
  outcome?: HypothesisOutcome;
  outcome_date?: string;
  result_summary?: string;
  observed_metric?: string;
  observed_uplift?: number;
  activation_override?: boolean;
  activation_override_reason?: string;
  activation_override_at?: string;
  activation_override_by?: string;
  created_date: string;
  owner: string;
}

export type RiskTolerance = "low" | "medium" | "high";

export interface PortfolioMetadata {
  max_concurrent_experiments: number;
  monthly_experiment_budget: number;
  budget_timezone: string;
  default_value_unit: string;
  default_value_horizon_days: number;
  loaded_cost_per_person_day: number;
  ev_score_weight: number;
  time_score_weight: number;
  cost_score_weight: number;
  risk_tolerance?: RiskTolerance;
  max_loss_if_false_per_experiment?: number;
  default_detection_window_days: number;
  ev_normalization?: "winsorized_p10_p90_nearest_rank";
  cost_normalization?: "winsorized_p10_p90_nearest_rank";
}

export interface PortfolioDomain {
  valueUnit: string;
  valueHorizonDays: number;
}

export interface HypothesisValidationOptions {
  evRanked?: boolean;
  portfolioDomain?: PortfolioDomain;
  portfolioDefaults?: Pick<PortfolioMetadata, "default_detection_window_days">;
}

export interface ValidationError {
  code:
    | "schema_validation_failed"
    | "non_monetary_unit_requires_conversion"
    | "unit_horizon_mismatch"
    | "detection_window_fallback_required"
    | "weight_sum_must_equal_one";
  message: string;
  path?: string[];
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ValidationError };

