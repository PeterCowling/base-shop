import type { IdeasMetricsRollup } from "./lp-do-ideas-metrics-rollup.js";

export interface OptionCInputs {
  /** IdeasMetricsRollup from runMetricsRollup() */
  rollup: IdeasMetricsRollup;
  /** Number of days since first dispatch (trial review period). */
  reviewPeriodDays: number;
  /**
   * Dispatch route accuracy (0–100%). Operator-annotated from trial review.
   * undefined = not yet measured → blocks activation.
   */
  routeAccuracy?: number;
  /**
   * Duplicate suppression rate variance (0–100%) across the two most recent
   * weekly snapshots. undefined = not yet measured → blocks activation.
   */
  suppressionVariance?: number;
  /** Must be explicitly true for Option C to be permitted. Default: false. */
  operatorEnable?: boolean;
  /** Injectable clock for deterministic tests. */
  now?: Date;
}

export interface BlockerItem {
  code: string;
  message: string;
}

export interface OptionCReadinessCheck {
  ready: boolean;
  blockers: BlockerItem[];
  thresholds: {
    reviewPeriodDays: { required: 14; actual: number; met: boolean };
    sampleSize: { required: 40; actual: number; met: boolean };
    routeAccuracy: { required: 80; actual: number | undefined; met: boolean };
    suppressionVariance: { required: 10; actual: number | undefined; met: boolean };
    kpiSnapshotAge: { maxDays: 7; actualDays: number; met: boolean };
  };
}

export interface GateDecision {
  permitted: boolean;
  mode: "advisory" | "option_c_ready";
  reason: string;
  readiness: OptionCReadinessCheck;
}

export interface KillSwitchResult {
  mode: "advisory";
  activationBlocked: true;
  reason: string;
}

const REVIEW_PERIOD_REQUIRED = 14;
const SAMPLE_SIZE_REQUIRED = 40;
const ROUTE_ACCURACY_REQUIRED = 80;
const SUPPRESSION_VARIANCE_MAX = 10;
const KPI_SNAPSHOT_MAX_AGE_DAYS = 7;

function computeSnapshotAgeDays(generatedAt: string, now: Date): number {
  const ts = Date.parse(generatedAt);
  if (Number.isNaN(ts)) {
    // Treat unparseable timestamps as maximally stale (fail-closed)
    return Number.MAX_SAFE_INTEGER;
  }
  const deltaMs = Math.max(0, now.getTime() - ts);
  return deltaMs / (24 * 60 * 60 * 1000);
}

/**
 * Evaluates all Option C threshold criteria against the provided inputs.
 * Never throws — all errors are returned as blockers.
 */
export function evaluateOptionCReadiness(inputs: OptionCInputs): OptionCReadinessCheck {
  const now = inputs.now ?? new Date();
  const blockers: BlockerItem[] = [];

  // --- KPI snapshot age check ---
  let snapshotAgeDays = 0;
  try {
    snapshotAgeDays = computeSnapshotAgeDays(inputs.rollup.generated_at, now);
  } catch {
    snapshotAgeDays = Number.MAX_SAFE_INTEGER;
  }
  const kpiAgeMetDays = snapshotAgeDays <= KPI_SNAPSHOT_MAX_AGE_DAYS;
  if (!kpiAgeMetDays) {
    blockers.push({
      code: "stale_kpi_snapshot",
      message: `KPI snapshot is ${Math.round(snapshotAgeDays)} day(s) old (max allowed: ${KPI_SNAPSHOT_MAX_AGE_DAYS} days).`,
    });
  }

  // --- Review period check ---
  const reviewPeriodMet = inputs.reviewPeriodDays >= REVIEW_PERIOD_REQUIRED;
  if (!reviewPeriodMet) {
    blockers.push({
      code: "review_period_too_short",
      message: `Trial review period is ${inputs.reviewPeriodDays} day(s) (required: ${REVIEW_PERIOD_REQUIRED}).`,
    });
  }

  // --- Sample size check ---
  const sampleSize = inputs.rollup.admitted_cluster_count;
  const sampleSizeMet = sampleSize >= SAMPLE_SIZE_REQUIRED;
  if (!sampleSizeMet) {
    blockers.push({
      code: "sample_size_insufficient",
      message: `Sample size is ${sampleSize} dispatches (required: ${SAMPLE_SIZE_REQUIRED}).`,
    });
  }

  // --- Route accuracy check ---
  let routeAccuracyMet = false;
  if (inputs.routeAccuracy === undefined) {
    blockers.push({
      code: "route_accuracy_not_measured",
      message: "Route accuracy has not been measured. Operator annotation required.",
    });
  } else {
    routeAccuracyMet = inputs.routeAccuracy >= ROUTE_ACCURACY_REQUIRED;
    if (!routeAccuracyMet) {
      blockers.push({
        code: "route_accuracy_below_threshold",
        message: `Route accuracy is ${inputs.routeAccuracy}% (required: ${ROUTE_ACCURACY_REQUIRED}%).`,
      });
    }
  }

  // --- Suppression variance check ---
  let suppressionVarianceMet = false;
  if (inputs.suppressionVariance === undefined) {
    blockers.push({
      code: "suppression_variance_not_measured",
      message: "Suppression variance has not been measured. Two weekly snapshots required.",
    });
  } else {
    suppressionVarianceMet = inputs.suppressionVariance <= SUPPRESSION_VARIANCE_MAX;
    if (!suppressionVarianceMet) {
      blockers.push({
        code: "suppression_variance_too_high",
        message: `Suppression variance is ${inputs.suppressionVariance}% (max allowed: ${SUPPRESSION_VARIANCE_MAX}%).`,
      });
    }
  }

  const ready = blockers.length === 0;

  return {
    ready,
    blockers,
    thresholds: {
      reviewPeriodDays: {
        required: REVIEW_PERIOD_REQUIRED,
        actual: inputs.reviewPeriodDays,
        met: reviewPeriodMet,
      },
      sampleSize: {
        required: SAMPLE_SIZE_REQUIRED,
        actual: sampleSize,
        met: sampleSizeMet,
      },
      routeAccuracy: {
        required: ROUTE_ACCURACY_REQUIRED,
        actual: inputs.routeAccuracy,
        met: routeAccuracyMet,
      },
      suppressionVariance: {
        required: SUPPRESSION_VARIANCE_MAX,
        actual: inputs.suppressionVariance,
        met: suppressionVarianceMet,
      },
      kpiSnapshotAge: {
        maxDays: KPI_SNAPSHOT_MAX_AGE_DAYS,
        actualDays: snapshotAgeDays,
        met: kpiAgeMetDays,
      },
    },
  };
}

/**
 * Checks all Option C threshold criteria AND requires explicit operator enable.
 * Returns a GateDecision describing whether autonomous mode is permitted.
 * Never throws — all errors are returned in the decision.
 */
export function checkOptionCGate(inputs: OptionCInputs): GateDecision {
  const readiness = evaluateOptionCReadiness(inputs);

  if (!readiness.ready) {
    const blockerCodes = readiness.blockers.map((b) => b.code).join(", ");
    return {
      permitted: false,
      mode: "advisory",
      reason: `Threshold(s) not met: ${blockerCodes}`,
      readiness,
    };
  }

  if (inputs.operatorEnable !== true) {
    return {
      permitted: false,
      mode: "advisory",
      reason: "Operator enable flag is false — explicit activation required",
      readiness,
    };
  }

  return {
    permitted: true,
    mode: "option_c_ready",
    reason: "All Option C thresholds met and operator enable confirmed",
    readiness,
  };
}

/**
 * One-step fallback kill switch. Always returns advisory posture.
 * Performs no I/O. Never throws.
 */
export function applyKillSwitch(reason?: string): KillSwitchResult {
  const detail = reason !== undefined && reason.length > 0 ? reason : "no reason specified";
  return {
    mode: "advisory",
    activationBlocked: true,
    reason: `Kill switch applied: ${detail}`,
  };
}
