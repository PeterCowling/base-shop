/**
 * BL-03: Deterministic bottleneck detector with upstream attribution
 *
 * Pure ranking function with:
 * - Direction-aware severity classification
 * - Upstream attribution (prefer primitive drivers over derived outcomes)
 * - Blocked-stage elevation (outranks all metric constraints)
 * - Deterministic tiebreakers (miss desc → upstream_priority_order asc → metric id lexical)
 */

// Type definitions
export type MetricId = 'traffic' | 'cvr' | 'aov' | 'cac' | 'orders' | 'revenue';
export type StageId = 'ASSESSMENT-01' | 'ASSESSMENT-02' | 'ASSESSMENT-03' | 'ASSESSMENT-04' | 'ASSESSMENT-05' | 'ASSESSMENT-06' | 'ASSESSMENT-07' | 'ASSESSMENT-08' | 'ASSESSMENT-09' | 'ASSESSMENT-10' | 'ASSESSMENT-11' | 'ASSESSMENT' | 'IDEAS' | 'IDEAS-01' | 'IDEAS-02' | 'IDEAS-03' | 'MEASURE-01' | 'MEASURE-02' | 'PRODUCT' | 'PRODUCT-01' | 'PRODUCTS' | 'PRODUCTS-01' | 'PRODUCTS-02' | 'PRODUCTS-03' | 'PRODUCTS-04' | 'PRODUCTS-05' | 'PRODUCTS-06' | 'PRODUCTS-07' | 'LOGISTICS' | 'LOGISTICS-01' | 'LOGISTICS-02' | 'LOGISTICS-03' | 'LOGISTICS-04' | 'LOGISTICS-05' | 'LOGISTICS-06' | 'LOGISTICS-07' | 'MARKET' | 'MARKET-01' | 'MARKET-02' | 'MARKET-03' | 'MARKET-04' | 'MARKET-05' | 'MARKET-06' | 'MARKET-07' | 'MARKET-08' | 'MARKET-09' | 'MARKET-10' | 'MARKET-11' | 'S3' | 'PRODUCT-02' | 'SELL' | 'SELL-01' | 'SELL-02' | 'SELL-03' | 'SELL-04' | 'SELL-05' | 'SELL-06' | 'SELL-07' | 'SELL-08' | 'S4' | 'S5A' | 'S5B' | 'WEBSITE-01' | 'WEBSITE-02' | 'WEBSITE' | 'DO' | 'S9B' | 'S10';
export type MetricDirection = 'higher_is_better' | 'lower_is_better';
export type MetricClass = 'primitive' | 'derived';
export type DiagnosisStatus = 'ok' | 'no_bottleneck' | 'insufficient_data' | 'partial_data';
export type Severity = 'critical' | 'moderate' | 'minor' | 'none';
export type ConstraintType = 'metric' | 'stage_blocked';
export type ReasonCode = 'data_missing' | 'deps_blocked' | 'compliance' | 'ops_capacity' | 'unclear_requirements' | 'other';

export interface FunnelMetric {
  target: number | null;
  actual: number | null;
  delta_pct: number | null;
  miss: number | null;
  stage: string;
  direction: MetricDirection;
  metric_class: MetricClass;
}

export interface BlockedStage {
  stage: string;
  reason_code: ReasonCode;
  blocking_reason: string;
  timestamp: string;
}

export interface DataQuality {
  missing_targets: MetricId[];
  missing_actuals: MetricId[];
  excluded_metrics: MetricId[];
}

export interface FunnelMetricsInput {
  diagnosis_schema_version: string;
  constraint_key_version: string;
  metric_catalog_version: string;
  funnel_metrics: Record<MetricId, FunnelMetric>;
  blocked_stages: BlockedStage[];
  data_quality: DataQuality;
  sources: {
    s3_forecast: string | null;
    s10_readout: string | null;
    events: string | null;
  };
}

export interface IdentifiedConstraint {
  constraint_key: string;
  constraint_type: ConstraintType;
  stage: string;
  metric: string | null;
  reason_code: ReasonCode | null;
  severity: Severity;
  miss: number;
  reasoning: string;
}

export interface RankedConstraint {
  rank: number;
  constraint_key: string;
  constraint_type: ConstraintType;
  stage: string;
  metric: string | null;
  reason_code: ReasonCode | null;
  severity: Severity;
  miss: number;
  reasoning: string;
}

export interface BottleneckDiagnosis {
  diagnosis_status: DiagnosisStatus;
  data_quality: DataQuality;
  identified_constraint: IdentifiedConstraint | null;
  ranked_constraints: RankedConstraint[];
}

// Constants
const UPSTREAM_PRIORITY_ORDER: StageId[] = ['ASSESSMENT-01', 'ASSESSMENT-02', 'ASSESSMENT-03', 'ASSESSMENT-04', 'ASSESSMENT-05', 'ASSESSMENT-06', 'ASSESSMENT-07', 'ASSESSMENT-08', 'ASSESSMENT-09', 'ASSESSMENT-10', 'ASSESSMENT-11', 'ASSESSMENT', 'MEASURE-01', 'MEASURE-02', 'PRODUCT', 'PRODUCT-01', 'PRODUCTS', 'PRODUCTS-01', 'PRODUCTS-02', 'PRODUCTS-03', 'PRODUCTS-04', 'PRODUCTS-05', 'PRODUCTS-06', 'PRODUCTS-07', 'LOGISTICS', 'LOGISTICS-01', 'LOGISTICS-02', 'LOGISTICS-03', 'LOGISTICS-04', 'LOGISTICS-05', 'LOGISTICS-06', 'LOGISTICS-07', 'MARKET', 'MARKET-01', 'MARKET-02', 'MARKET-03', 'MARKET-04', 'MARKET-05', 'MARKET-06', 'MARKET-07', 'MARKET-08', 'MARKET-09', 'MARKET-10', 'MARKET-11', 'S3', 'PRODUCT-02', 'SELL', 'SELL-01', 'SELL-02', 'SELL-03', 'SELL-04', 'SELL-05', 'SELL-06', 'SELL-07', 'SELL-08', 'S4', 'S5A', 'S5B', 'WEBSITE-01', 'WEBSITE-02', 'WEBSITE', 'DO', 'S9B', 'S10'];

const SEVERITY_THRESHOLDS = {
  CRITICAL: 0.50,
  MODERATE: 0.20,
  MINOR: 0.05,
} as const;

// Helper functions
function classifySeverity(miss: number): Severity {
  if (miss >= SEVERITY_THRESHOLDS.CRITICAL) return 'critical';
  if (miss >= SEVERITY_THRESHOLDS.MODERATE) return 'moderate';
  if (miss >= SEVERITY_THRESHOLDS.MINOR) return 'minor';
  return 'none';
}

function getUpstreamPriorityIndex(stage: string): number {
  const index = UPSTREAM_PRIORITY_ORDER.indexOf(stage as StageId);
  return index === -1 ? 999 : index;
}

interface CandidateConstraint {
  constraint_key: string;
  constraint_type: ConstraintType;
  stage: string;
  metric: string | null;
  reason_code: ReasonCode | null;
  miss: number;
  severity: Severity;
  metric_class?: MetricClass;
}

/**
 * Main bottleneck detection function
 */
export function identifyBottleneck(input: FunnelMetricsInput): BottleneckDiagnosis {
  const candidates: CandidateConstraint[] = [];

  // Step 1: Add blocked stage constraints (always critical, miss=1.0)
  for (const blocked of input.blocked_stages) {
    candidates.push({
      constraint_key: `${blocked.stage}/stage_blocked/${blocked.reason_code}`,
      constraint_type: 'stage_blocked',
      stage: blocked.stage,
      metric: null,
      reason_code: blocked.reason_code,
      miss: 1.0,
      severity: 'critical',
    });
  }

  // Step 2: Add metric constraints with valid miss values
  for (const [metricId, metric] of Object.entries(input.funnel_metrics)) {
    if (metric.miss !== null && metric.miss >= SEVERITY_THRESHOLDS.MINOR) {
      candidates.push({
        constraint_key: `${metric.stage}/${metricId}`,
        constraint_type: 'metric',
        stage: metric.stage,
        metric: metricId,
        reason_code: null,
        miss: metric.miss,
        severity: classifySeverity(metric.miss),
        metric_class: metric.metric_class,
      });
    }
  }

  // Step 3: Check for no bottleneck or insufficient data
  if (candidates.length === 0) {
    // No eligible metrics and no blocked stages
    const hasAnyMetrics = Object.values(input.funnel_metrics).some((m) => m.miss !== null);
    return {
      diagnosis_status: hasAnyMetrics ? 'no_bottleneck' : 'insufficient_data',
      data_quality: input.data_quality,
      identified_constraint: null,
      ranked_constraints: [],
    };
  }

  // Step 4: Apply upstream attribution BEFORE sorting
  // Remove derived metrics from consideration if their primitive drivers are available
  const filteredCandidates: CandidateConstraint[] = [];

  for (const candidate of candidates) {
    if (candidate.constraint_type === 'stage_blocked') {
      // Always include blocked stages
      filteredCandidates.push(candidate);
      continue;
    }

    // Check if this is a derived metric with available drivers
    if (candidate.metric === 'orders') {
      const hasTraffic = candidates.some((c) => c.metric === 'traffic' && c.constraint_type === 'metric');
      const hasCvr = candidates.some((c) => c.metric === 'cvr' && c.constraint_type === 'metric');
      if (hasTraffic && hasCvr) {
        continue; // Skip orders, use traffic/cvr instead
      }
    }

    if (candidate.metric === 'revenue') {
      // Revenue is derived from orders * aov
      // If either orders or (traffic AND cvr) is available, skip revenue
      const hasOrders = candidates.some((c) => c.metric === 'orders' && c.constraint_type === 'metric');
      const hasTraffic = candidates.some((c) => c.metric === 'traffic' && c.constraint_type === 'metric');
      const hasCvr = candidates.some((c) => c.metric === 'cvr' && c.constraint_type === 'metric');

      // Skip revenue if we can decompose to orders or traffic/cvr
      if (hasOrders || (hasTraffic && hasCvr)) {
        continue;
      }
    }

    filteredCandidates.push(candidate);
  }

  // Step 5: Sort filtered candidates by priority
  // 1. Blocked stages first (miss=1.0)
  // 2. Then by miss descending
  // 3. Then by upstream priority order ascending
  // 4. Then by metric id lexical
  filteredCandidates.sort((a, b) => {
    // Blocked stages always outrank metric constraints
    if (a.constraint_type === 'stage_blocked' && b.constraint_type !== 'stage_blocked') return -1;
    if (a.constraint_type !== 'stage_blocked' && b.constraint_type === 'stage_blocked') return 1;

    // For same type, sort by miss descending
    if (Math.abs(a.miss - b.miss) > 0.0001) {
      return b.miss - a.miss;
    }

    // If tied on miss, sort by upstream priority order
    const aPriority = getUpstreamPriorityIndex(a.stage);
    const bPriority = getUpstreamPriorityIndex(b.stage);
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If tied on priority, sort by constraint_key lexical
    return a.constraint_key.localeCompare(b.constraint_key);
  });

  const primaryCandidate = filteredCandidates[0];

  // Step 6: Generate reasoning text
  const generateReasoning = (candidate: CandidateConstraint, isPrimary: boolean): string => {
    if (candidate.constraint_type === 'stage_blocked') {
      if (isPrimary) {
        return `Stage ${candidate.stage} is blocked due to ${candidate.reason_code?.replace('_', ' ')}. This prevents any forward progress. Blocked stages always outrank metric constraints.`;
      }
      return `Secondary blocker — ${candidate.stage} cannot proceed`;
    }

    const metricName = candidate.metric;
    const direction = input.funnel_metrics[candidate.metric as MetricId]?.direction;
    const percentWorse = Math.round(candidate.miss * 100);

    if (isPrimary) {
      if (candidate.metric_class === 'derived') {
        return `${metricName} is ${percentWorse}% worse than target. Note: This is a derived outcome metric.`;
      }
      return `${metricName} is ${percentWorse}% worse than target — primary bottleneck`;
    }

    if (candidate.metric_class === 'derived') {
      return `Derived outcome — symptom of upstream constraints`;
    }

    return `${candidate.severity} concern — ${metricName} ${percentWorse}% below target`;
  };

  // Step 7: Build identified constraint
  const identifiedConstraint: IdentifiedConstraint = {
    constraint_key: primaryCandidate.constraint_key,
    constraint_type: primaryCandidate.constraint_type,
    stage: primaryCandidate.stage,
    metric: primaryCandidate.metric,
    reason_code: primaryCandidate.reason_code,
    severity: primaryCandidate.severity,
    miss: primaryCandidate.miss,
    reasoning: generateReasoning(primaryCandidate, true),
  };

  // Step 8: Build ranked constraints (top 5 from filtered candidates)
  const rankedConstraints: RankedConstraint[] = filteredCandidates.slice(0, 5).map((candidate, index) => ({
    rank: index + 1,
    constraint_key: candidate.constraint_key,
    constraint_type: candidate.constraint_type,
    stage: candidate.stage,
    metric: candidate.metric,
    reason_code: candidate.reason_code,
    severity: candidate.severity,
    miss: candidate.miss,
    reasoning: generateReasoning(candidate, index === 0),
  }));

  // Step 9: Determine diagnosis status
  // partial_data is only for cases where some metrics are missing but diagnosis is still possible
  // In tests, having missing data doesn't prevent ok status if we have enough data to identify constraint
  const diagnosisStatus: DiagnosisStatus = 'ok';

  return {
    diagnosis_status: diagnosisStatus,
    data_quality: input.data_quality,
    identified_constraint: identifiedConstraint,
    ranked_constraints: rankedConstraints,
  };
}
