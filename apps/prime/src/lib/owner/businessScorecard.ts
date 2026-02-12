/**
 * businessScorecard.ts
 *
 * TASK-49: Cross-app business impact scorecard
 *
 * Unified scorecard that links guest UX engagement to reception efficiency
 * and owner-level business decisions, with KPI inputs sourced from TASK-47
 * aggregate nodes.
 *
 * CRITICAL: This module reads ONLY from DailyKpiRecord aggregates,
 * NEVER from raw booking data.
 */

import { type DailyKpiRecord } from './kpiAggregator';

/**
 * Metric status based on target comparison
 */
export type MetricStatus = 'success' | 'warning' | 'unknown';

/**
 * Individual metric with value and status
 */
export interface ScorecardMetric {
  value: number;
  status: MetricStatus;
  formattedValue: string;
}

/**
 * All scorecard metrics organized by category
 */
export interface ScorecardMetrics {
  readiness: ScorecardMetric;
  etaSubmission: ScorecardMetric;
  codeGeneration: ScorecardMetric;
  checkInLag: ScorecardMetric;
  supportLoad: ScorecardMetric;
}

/**
 * Target definition for a metric
 */
export interface ScorecardTarget {
  metric: string;
  target: number;
  unit: string;
  direction: 'higher' | 'lower'; // higher is better, or lower is better
  description: string;
}

/**
 * Operating review action item
 */
export interface OperatingReviewAction {
  metric: string;
  status: MetricStatus;
  currentValue: string;
  targetValue: string;
  suggestedAction: string;
  owner: string;
  expectedImpact: string;
}

/**
 * Complete business scorecard output
 */
export interface BusinessScorecardMetrics {
  // Summary metrics
  totalGuests: number;
  daysWithData: number;
  hasInsufficientData: boolean;

  // Guest engagement metrics
  avgReadinessPct: number;
  avgEtaSubmissionPct: number;

  // Staff efficiency metrics
  avgCodeGenerationPct: number;
  avgCheckInLagMinutes: number;

  // Business impact metrics
  totalSupportRequests: number;
  supportLoadPerGuest: number;

  // Metric status evaluations
  metrics: ScorecardMetrics;

  // Operating review actions
  reviewActions: OperatingReviewAction[];
}

/**
 * Scorecard targets for 9/10 usefulness + engagement
 *
 * These targets are designed to achieve high guest satisfaction
 * and operational efficiency.
 */
export const SCORECARD_TARGETS: Record<string, ScorecardTarget> = {
  readiness: {
    metric: 'Guest Readiness Completion',
    target: 90,
    unit: '%',
    direction: 'higher',
    description: 'Average pre-arrival readiness score across all guests',
  },
  etaSubmission: {
    metric: 'ETA Submission Rate',
    target: 90,
    unit: '%',
    direction: 'higher',
    description: 'Percentage of guests who submitted arrival ETA',
  },
  codeGeneration: {
    metric: 'Check-in Code Generation',
    target: 100,
    unit: '%',
    direction: 'higher',
    description: 'Percentage of bookings with automated check-in codes',
  },
  checkInLag: {
    metric: 'Check-in Lag Time',
    target: 15,
    unit: 'min',
    direction: 'lower',
    description: 'Median time between expected and actual check-in',
  },
  supportLoad: {
    metric: 'Support Load per Guest',
    target: 0.2,
    unit: 'requests',
    direction: 'lower',
    description: 'Average support requests (extensions + bag drops) per guest',
  },
};

/**
 * Minimum days of data required for reliable scorecard
 */
const MIN_DAYS_FOR_SCORECARD = 3;

/**
 * Evaluate metric status against target
 */
function evaluateMetricStatus(
  value: number,
  target: number,
  direction: 'higher' | 'lower',
  hasInsufficientData: boolean,
): MetricStatus {
  if (hasInsufficientData) {
    return 'unknown';
  }

  if (direction === 'higher') {
    return value >= target ? 'success' : 'warning';
  } else {
    return value <= target ? 'success' : 'warning';
  }
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: number, unit: string): string {
  if (unit === '%') {
    return `${Math.round(value)}%`;
  }
  if (unit === 'min') {
    return `${Math.round(value)} min`;
  }
  return value.toFixed(2);
}

/**
 * Generate suggested action for a metric that missed target
 */
function generateSuggestedAction(
  targetKey: string,
  currentValue: number,
  target: number,
): string {
  const gap = Math.abs(currentValue - target);

  switch (targetKey) {
    case 'readiness':
      return `Improve pre-arrival communication to increase checklist completion by ${Math.round(gap)}%. Consider SMS reminders or in-app notifications.`;
    case 'etaSubmission':
      return `Increase ETA submission rate by ${Math.round(gap)}%. Simplify ETA input flow and add arrival-day reminders.`;
    case 'codeGeneration':
      return `Investigate why ${Math.round(gap)}% of bookings lack check-in codes. Review automated code generation pipeline.`;
    case 'checkInLag':
      return `Reduce check-in lag by ${Math.round(gap)} minutes. Improve arrival instructions clarity and staff availability during peak hours.`;
    case 'supportLoad':
      return `Reduce support load by ${gap.toFixed(2)} requests per guest. Identify common request patterns and provide proactive solutions.`;
    default:
      return 'Review metric and identify improvement opportunities.';
  }
}

/**
 * Determine expected impact category for an action
 */
function determineExpectedImpact(gap: number, direction: 'higher' | 'lower'): string {
  const normalizedGap = direction === 'higher' ? gap : -gap;

  if (normalizedGap <= -20 || normalizedGap >= 20) {
    return 'High - Critical gap requiring immediate attention';
  }
  if (normalizedGap <= -10 || normalizedGap >= 10) {
    return 'Medium - Significant opportunity for improvement';
  }
  return 'Low - Minor optimization opportunity';
}

/**
 * Compute business scorecard from daily KPI aggregates.
 *
 * This is a PURE function that reads from DailyKpiRecord[] only.
 * NEVER performs raw booking scans.
 *
 * @param dailyKpis - Array of daily KPI records from TASK-47 aggregates
 * @returns Complete business scorecard with metrics and review actions
 */
export function computeBusinessScorecard(
  dailyKpis: DailyKpiRecord[],
): BusinessScorecardMetrics {
  // Filter to days with actual guest data
  const daysWithGuests = dailyKpis.filter((day) => day.guestCount > 0);
  const daysWithData = daysWithGuests.length;
  const hasInsufficientData = daysWithData < MIN_DAYS_FOR_SCORECARD;

  // Compute summary metrics
  const totalGuests = daysWithGuests.reduce((sum, day) => sum + day.guestCount, 0);

  // Compute averages (only from days with guests)
  const avgReadinessPct =
    daysWithData > 0
      ? daysWithGuests.reduce((sum, day) => sum + day.readinessCompletionPct, 0) / daysWithData
      : 0;

  const avgEtaSubmissionPct =
    daysWithData > 0
      ? daysWithGuests.reduce((sum, day) => sum + day.etaSubmissionPct, 0) / daysWithData
      : 0;

  const avgCodeGenerationPct =
    daysWithData > 0
      ? daysWithGuests.reduce((sum, day) => sum + day.arrivalCodeGenPct, 0) / daysWithData
      : 0;

  const avgCheckInLagMinutes =
    daysWithData > 0
      ? daysWithGuests.reduce((sum, day) => sum + day.medianCheckInLagMinutes, 0) / daysWithData
      : 0;

  // Compute support load
  const totalSupportRequests = daysWithGuests.reduce(
    (sum, day) => sum + day.extensionRequestCount + day.bagDropRequestCount,
    0,
  );

  const supportLoadPerGuest = totalGuests > 0 ? totalSupportRequests / totalGuests : 0;

  // Evaluate metric statuses
  const readinessStatus = evaluateMetricStatus(
    avgReadinessPct,
    SCORECARD_TARGETS.readiness.target,
    SCORECARD_TARGETS.readiness.direction,
    hasInsufficientData,
  );

  const etaSubmissionStatus = evaluateMetricStatus(
    avgEtaSubmissionPct,
    SCORECARD_TARGETS.etaSubmission.target,
    SCORECARD_TARGETS.etaSubmission.direction,
    hasInsufficientData,
  );

  const codeGenerationStatus = evaluateMetricStatus(
    avgCodeGenerationPct,
    SCORECARD_TARGETS.codeGeneration.target,
    SCORECARD_TARGETS.codeGeneration.direction,
    hasInsufficientData,
  );

  const checkInLagStatus = evaluateMetricStatus(
    avgCheckInLagMinutes,
    SCORECARD_TARGETS.checkInLag.target,
    SCORECARD_TARGETS.checkInLag.direction,
    hasInsufficientData,
  );

  const supportLoadStatus = evaluateMetricStatus(
    supportLoadPerGuest,
    SCORECARD_TARGETS.supportLoad.target,
    SCORECARD_TARGETS.supportLoad.direction,
    hasInsufficientData,
  );

  // Build metrics object
  const metrics: ScorecardMetrics = {
    readiness: {
      value: avgReadinessPct,
      status: readinessStatus,
      formattedValue: formatMetricValue(avgReadinessPct, '%'),
    },
    etaSubmission: {
      value: avgEtaSubmissionPct,
      status: etaSubmissionStatus,
      formattedValue: formatMetricValue(avgEtaSubmissionPct, '%'),
    },
    codeGeneration: {
      value: avgCodeGenerationPct,
      status: codeGenerationStatus,
      formattedValue: formatMetricValue(avgCodeGenerationPct, '%'),
    },
    checkInLag: {
      value: avgCheckInLagMinutes,
      status: checkInLagStatus,
      formattedValue: formatMetricValue(avgCheckInLagMinutes, 'min'),
    },
    supportLoad: {
      value: supportLoadPerGuest,
      status: supportLoadStatus,
      formattedValue: supportLoadPerGuest.toFixed(2),
    },
  };

  // Generate operating review actions for metrics that missed targets
  const reviewActions: OperatingReviewAction[] = [];

  if (!hasInsufficientData) {
    const metricMap: Record<string, { metric: ScorecardMetric; key: string }> = {
      readiness: { metric: metrics.readiness, key: 'readiness' },
      etaSubmission: { metric: metrics.etaSubmission, key: 'etaSubmission' },
      codeGeneration: { metric: metrics.codeGeneration, key: 'codeGeneration' },
      checkInLag: { metric: metrics.checkInLag, key: 'checkInLag' },
      supportLoad: { metric: metrics.supportLoad, key: 'supportLoad' },
    };

    for (const [targetKey, { metric, key }] of Object.entries(metricMap)) {
      if (metric.status === 'warning') {
        const target = SCORECARD_TARGETS[targetKey];
        reviewActions.push({
          metric: target.metric,
          status: metric.status,
          currentValue: metric.formattedValue,
          targetValue: formatMetricValue(target.target, target.unit),
          suggestedAction: generateSuggestedAction(key, metric.value, target.target),
          owner: 'Operations Manager',
          expectedImpact: determineExpectedImpact(
            metric.value - target.target,
            target.direction,
          ),
        });
      }
    }
  }

  return {
    totalGuests,
    daysWithData,
    hasInsufficientData,
    avgReadinessPct,
    avgEtaSubmissionPct,
    avgCodeGenerationPct,
    avgCheckInLagMinutes,
    totalSupportRequests,
    supportLoadPerGuest,
    metrics,
    reviewActions,
  };
}
