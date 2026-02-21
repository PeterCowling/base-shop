export const GROWTH_STAGE_KEYS = [
  "acquisition",
  "activation",
  "revenue",
  "retention",
  "referral",
] as const;

export type GrowthStageKey = (typeof GROWTH_STAGE_KEYS)[number];

export const GROWTH_LEDGER_STATUS_VALUES = [
  "green",
  "yellow",
  "red",
  "insufficient_data",
  "not_tracked",
] as const;

export type GrowthLedgerStatus = (typeof GROWTH_LEDGER_STATUS_VALUES)[number];

export const BLOCKING_MODE_VALUES = ["always", "after_valid", "never"] as const;
export type StageBlockingMode = (typeof BLOCKING_MODE_VALUES)[number];

export const THRESHOLD_DIRECTION_VALUES = ["higher", "lower"] as const;
export type ThresholdDirection = (typeof THRESHOLD_DIRECTION_VALUES)[number];

export const GROWTH_METRIC_UNIT_VALUES = ["eur_cents", "bps", "count"] as const;
export type GrowthMetricUnit = (typeof GROWTH_METRIC_UNIT_VALUES)[number];

export const METRIC_KIND_VALUES = ["primitive", "derived"] as const;
export type GrowthMetricKind = (typeof METRIC_KIND_VALUES)[number];

export interface StagePolicy {
  blocking_mode: StageBlockingMode;
}

export interface GrowthMetricDefinition {
  key: string;
  label: string;
  unit: GrowthMetricUnit;
  kind: GrowthMetricKind;
  formula?: string;
  required_metrics?: string[];
  denominator_metric?: string;
}

export interface StageThresholdDefinition {
  metric: string;
  unit: GrowthMetricUnit;
  direction: ThresholdDirection;
  green_threshold: number;
  red_threshold: number;
  validity_min_denominator: number;
  denominator_metric?: string;
}

export interface GrowthStageDefinition {
  key: GrowthStageKey;
  label: string;
  stage_policy: StagePolicy;
  metrics: GrowthMetricDefinition[];
  thresholds: StageThresholdDefinition[];
}

export interface ThresholdSet {
  threshold_set_id: string;
  threshold_set_hash: string;
  generated_at: string;
  stages: Record<GrowthStageKey, StageThresholdDefinition[]>;
}

export interface GrowthLedgerPeriod {
  period_id: string;
  start_date: string;
  end_date: string;
  forecast_id: string;
}

export interface GrowthStageState {
  status: GrowthLedgerStatus;
  policy: StagePolicy;
  metrics: Record<string, number | null>;
  reasons: string[];
}

export interface GrowthLedger {
  schema_version: 1;
  ledger_revision: number;
  business: string;
  period: GrowthLedgerPeriod;
  threshold_set_id: string;
  threshold_set_hash: string;
  threshold_locked_at: string;
  updated_at: string;
  stages: Record<GrowthStageKey, GrowthStageState>;
}
