import * as fs from "node:fs";
import * as path from "node:path";

/**
 * BL-02: Funnel metrics extraction into canonical diagnosis input shape
 *
 * Reads S3 forecast targets, S10 readout actuals, and events ledger to produce
 * a canonical FunnelMetricsInput object with direction-aware miss computation
 * and data quality tracking.
 */

// -- Type definitions --

export type MetricId = "traffic" | "cvr" | "aov" | "cac" | "orders" | "revenue";

export type MetricDirection = "higher_is_better" | "lower_is_better";

export type MetricClass = "primitive" | "derived";

export type ReasonCode = "data_missing" | "deps_blocked" | "compliance" | "ops_capacity" | "unclear_requirements" | "other";

export interface MetricCatalogEntry {
  class: MetricClass;
  direction: MetricDirection;
  stage: string;
  priority: "primary" | "secondary";
}

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
  diagnosis_schema_version: "v1";
  constraint_key_version: "v1";
  metric_catalog_version: "v1";
  funnel_metrics: Record<MetricId, FunnelMetric>;
  blocked_stages: BlockedStage[];
  data_quality: DataQuality;
  sources: {
    s3_forecast: string | null;
    s10_readout: string | null;
    events: string | null;
  };
}

interface RunEvent {
  schema_version: number;
  event: string;
  run_id: string;
  stage: string;
  timestamp: string;
  loop_spec_version: string;
  artifacts: Record<string, string> | null;
  blocking_reason: string | null;
}

// -- Metric catalog (canonical) --

const METRIC_CATALOG: Record<MetricId, MetricCatalogEntry> = {
  traffic: {
    class: "primitive",
    direction: "higher_is_better",
    stage: "S6B",
    priority: "primary",
  },
  cvr: {
    class: "primitive",
    direction: "higher_is_better",
    stage: "S3",
    priority: "primary",
  },
  aov: {
    class: "primitive",
    direction: "higher_is_better",
    stage: "S2B",
    priority: "primary",
  },
  cac: {
    class: "primitive",
    direction: "lower_is_better",
    stage: "S6B",
    priority: "primary",
  },
  orders: {
    class: "derived",
    direction: "higher_is_better",
    stage: "S10",
    priority: "secondary",
  },
  revenue: {
    class: "derived",
    direction: "higher_is_better",
    stage: "S10",
    priority: "secondary",
  },
};

// -- Blocked reason normalization --

const REASON_CODE_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  // Order matters: check for deps_blocked before data_missing
  { pattern: /depend|upstream|prerequisite/i, code: "deps_blocked" },
  { pattern: /missing|not found|unavailable/i, code: "data_missing" },
  { pattern: /complian|regulat|legal/i, code: "compliance" },
  { pattern: /capacity|bandwidth|resource/i, code: "ops_capacity" },
  { pattern: /unclear|undefined|ambiguous/i, code: "unclear_requirements" },
];

function normalizeReasonCode(blockingReason: string): ReasonCode {
  for (const { pattern, code } of REASON_CODE_PATTERNS) {
    if (pattern.test(blockingReason)) {
      return code as ReasonCode;
    }
  }
  return "other";
}

// -- Miss computation --

function computeMiss(
  target: number | null,
  actual: number | null,
  direction: MetricDirection
): number | null {
  if (target === null || target <= 0 || actual === null) {
    return null;
  }

  if (direction === "higher_is_better") {
    // miss = max(0, (target - actual) / target)
    return Math.max(0, (target - actual) / target);
  } else {
    // lower_is_better: miss = max(0, (actual - target) / target)
    return Math.max(0, (actual - target) / target);
  }
}

function computeDeltaPct(target: number | null, actual: number | null): number | null {
  if (target === null || target === 0 || actual === null) {
    return null;
  }
  return ((actual - target) / target) * 100;
}

// -- Main extraction function --

export function extractFunnelMetrics(
  runId: string,
  business: string,
  baseDir?: string
): FunnelMetricsInput {
  const root = baseDir ?? process.cwd();
  const runDir = path.join(
    root,
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId
  );

  // Initialize sources
  const sources = {
    s3_forecast: null as string | null,
    s10_readout: null as string | null,
    events: null as string | null,
  };

  // Initialize data quality
  const dataQuality: DataQuality = {
    missing_targets: [],
    missing_actuals: [],
    excluded_metrics: [],
  };

  // Read S3 forecast targets (primitive metrics only)
  let s3Targets: Record<string, number> = {};
  try {
    const s3StageResultPath = path.join(runDir, "stage-result-S3.json");
    if (fs.existsSync(s3StageResultPath)) {
      const s3StageResult = JSON.parse(fs.readFileSync(s3StageResultPath, "utf8"));
      const forecastRelPath = s3StageResult.artifacts?.forecast;
      if (forecastRelPath) {
        const forecastPath = path.join(runDir, forecastRelPath);
        if (fs.existsSync(forecastPath)) {
          const forecastData = JSON.parse(fs.readFileSync(forecastPath, "utf8"));
          s3Targets = forecastData.targets ?? {};
          sources.s3_forecast = forecastRelPath;
        }
      }
    }
  } catch (error) {
    console.warn(`[extractFunnelMetrics] Failed to read S3 forecast: ${error}`);
    sources.s3_forecast = null;
  }

  // Read S10 readout (contains both actuals AND derived metric targets)
  let actuals: Record<string, number> = {};
  let s10Targets: Record<string, number> = {};
  try {
    const s10StageResultPath = path.join(runDir, "stage-result-S10.json");
    if (fs.existsSync(s10StageResultPath)) {
      const s10StageResult = JSON.parse(fs.readFileSync(s10StageResultPath, "utf8"));
      const readoutRelPath = s10StageResult.artifacts?.readout;
      if (readoutRelPath) {
        const readoutPath = path.join(runDir, readoutRelPath);
        if (fs.existsSync(readoutPath)) {
          const readoutData = JSON.parse(fs.readFileSync(readoutPath, "utf8"));
          actuals = readoutData.actuals ?? {};
          s10Targets = readoutData.targets ?? {};
          sources.s10_readout = readoutRelPath;
        }
      }
    }
  } catch (error) {
    console.warn(`[extractFunnelMetrics] Failed to read S10 readout: ${error}`);
    sources.s10_readout = null;
  }

  // Merge targets: S3 provides primitive targets, S10 provides derived targets
  const targets: Record<string, number> = { ...s3Targets, ...s10Targets };

  // Read events ledger for blocked stages
  const blockedStages: BlockedStage[] = [];
  try {
    const eventsPath = path.join(runDir, "events.jsonl");
    if (fs.existsSync(eventsPath)) {
      const eventsContent = fs.readFileSync(eventsPath, "utf8");
      sources.events = "events.jsonl";

      const lines = eventsContent.split("\n").filter((line) => line.trim());
      for (const line of lines) {
        try {
          const event: RunEvent = JSON.parse(line);
          if (event.event === "stage_blocked" && event.blocking_reason) {
            blockedStages.push({
              stage: event.stage,
              reason_code: normalizeReasonCode(event.blocking_reason),
              blocking_reason: event.blocking_reason,
              timestamp: event.timestamp,
            });
          }
        } catch (err) {
          console.warn(`[extractFunnelMetrics] Failed to parse event line: ${err}`);
        }
      }
    }
  } catch (error) {
    console.warn(`[extractFunnelMetrics] Failed to read events ledger: ${error}`);
    sources.events = null;
  }

  // Build funnel_metrics
  const funnelMetrics: Record<MetricId, FunnelMetric> = {} as Record<MetricId, FunnelMetric>;

  for (const [metricId, catalogEntry] of Object.entries(METRIC_CATALOG)) {
    const mid = metricId as MetricId;
    const target = targets[mid] ?? null;
    const actual = actuals[mid] ?? null;
    const deltaPct = computeDeltaPct(target, actual);
    const miss = computeMiss(target, actual, catalogEntry.direction);

    funnelMetrics[mid] = {
      target,
      actual,
      delta_pct: deltaPct,
      miss,
      stage: catalogEntry.stage,
      direction: catalogEntry.direction,
      metric_class: catalogEntry.class,
    };

    // Track data quality
    if (target === null) {
      dataQuality.missing_targets.push(mid);
    }
    if (actual === null) {
      dataQuality.missing_actuals.push(mid);
    }
    if (miss === null && (target !== null || actual !== null)) {
      // Metric excluded due to invalid target or missing data
      if (!dataQuality.excluded_metrics.includes(mid)) {
        dataQuality.excluded_metrics.push(mid);
      }
    }
  }

  return {
    diagnosis_schema_version: "v1",
    constraint_key_version: "v1",
    metric_catalog_version: "v1",
    funnel_metrics: funnelMetrics,
    blocked_stages: blockedStages,
    data_quality: dataQuality,
    sources,
  };
}
