export interface MatureBoundarySignals {
  monthly_revenue: number;
  headcount: number;
  support_ticket_volume_per_week: number;
  multi_region_compliance_flag: boolean;
  operational_complexity_score: number;
}

export interface MatureBoundaryThresholds {
  monthly_revenue: number;
  headcount: number;
  support_ticket_volume_per_week: number;
  operational_complexity_score: number;
}

export interface BoundaryDecision {
  mature_stage_detected: boolean;
  autonomy_level_cap: 1 | 2 | 3 | 4;
  reasons: string[];
}

export const DEFAULT_MATURE_BOUNDARY_SIGNALS: MatureBoundarySignals = {
  monthly_revenue: 0,
  headcount: 1,
  support_ticket_volume_per_week: 0,
  multi_region_compliance_flag: false,
  operational_complexity_score: 1,
};

export const DEFAULT_MATURE_BOUNDARY_THRESHOLDS: MatureBoundaryThresholds = {
  monthly_revenue: 10000,
  headcount: 5,
  support_ticket_volume_per_week: 100,
  operational_complexity_score: 6,
};

export function evaluateMatureBoundary(
  signals: MatureBoundarySignals,
  thresholds: MatureBoundaryThresholds,
): BoundaryDecision {
  const reasons: string[] = [];
  if (signals.monthly_revenue >= thresholds.monthly_revenue) {
    reasons.push("monthly_revenue_threshold_met");
  }
  if (signals.headcount >= thresholds.headcount) {
    reasons.push("headcount_threshold_met");
  }
  if (
    signals.support_ticket_volume_per_week >=
    thresholds.support_ticket_volume_per_week
  ) {
    reasons.push("support_volume_threshold_met");
  }
  if (signals.multi_region_compliance_flag) {
    reasons.push("multi_region_compliance_flag");
  }
  if (
    signals.operational_complexity_score >= thresholds.operational_complexity_score
  ) {
    reasons.push("operational_complexity_threshold_met");
  }

  const matureStageDetected = reasons.length >= 2 || signals.multi_region_compliance_flag;
  return {
    mature_stage_detected: matureStageDetected,
    autonomy_level_cap: matureStageDetected ? 1 : 4,
    reasons,
  };
}
