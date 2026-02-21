/**
 * BL-04: Generate per-run diagnosis snapshot with deterministic prior comparison
 *
 * Orchestrates BL-02 (metrics extraction) and BL-03 (bottleneck detection),
 * compares to deterministic prior run, and writes atomic snapshot.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { type BottleneckDiagnosis,identifyBottleneck } from "./bottleneck-detector";
import { extractFunnelMetrics, type FunnelMetricsInput, type MetricId } from "./funnel-metrics-extractor";

// -- Type definitions --

export interface DiagnosisSnapshot {
  diagnosis_schema_version: "v1";
  constraint_key_version: "v1";
  metric_catalog_version: "v1";
  run_id: string;
  business: string;
  timestamp: string;
  diagnosis_status: "ok" | "no_bottleneck" | "insufficient_data" | "partial_data";
  data_quality: {
    missing_targets: MetricId[];
    missing_actuals: MetricId[];
    excluded_metrics: MetricId[];
  };
  funnel_metrics: FunnelMetricsInput["funnel_metrics"];
  identified_constraint: BottleneckDiagnosis["identified_constraint"];
  ranked_constraints: BottleneckDiagnosis["ranked_constraints"];
  comparison_to_prior_run: {
    prior_run_id: string;
    constraint_changed: boolean;
    prior_constraint_key: string | null;
    metric_trends: Record<MetricId, "improving" | "worsening" | "stable" | "new_data" | "no_prior_data">;
  } | null;
}

interface PriorRun {
  run_id: string;
  diagnosis_path: string;
}

// -- Prior run selection --

/**
 * Find the deterministic prior run:
 * 1. Scan runs directory for valid run IDs
 * 2. Filter to runs with an existing bottleneck-diagnosis.json
 * 3. Order by run_id lexicographically
 * 4. Select greatest run_id strictly less than current
 */
function findPriorRun(business: string, currentRunId: string, baseDir: string): PriorRun | null {
  const runsDir = path.join(baseDir, "docs/business-os/startup-baselines", business, "runs");

  if (!fs.existsSync(runsDir)) {
    return null;
  }

  const allRunDirs = fs.readdirSync(runsDir, { withFileTypes: true }).filter((dirent) => dirent.isDirectory());

  const validPriorRuns: PriorRun[] = [];

  for (const dirent of allRunDirs) {
    const runId = dirent.name;

    // Skip current run and any run >= current
    if (runId >= currentRunId) {
      continue;
    }

    // Check if diagnosis snapshot exists
    const diagnosisPath = path.join(runsDir, runId, "bottleneck-diagnosis.json");
    if (fs.existsSync(diagnosisPath)) {
      validPriorRuns.push({ run_id: runId, diagnosis_path: diagnosisPath });
    }
  }

  if (validPriorRuns.length === 0) {
    return null;
  }

  // Sort by run_id lexicographically and select the last (most recent prior)
  validPriorRuns.sort((a, b) => a.run_id.localeCompare(b.run_id));
  return validPriorRuns[validPriorRuns.length - 1];
}

// -- Comparison logic --

type MetricTrend = "improving" | "worsening" | "stable" | "new_data" | "no_prior_data";

function compareMetricTrend(currentMiss: number | null, priorMiss: number | null): MetricTrend {
  if (currentMiss === null && priorMiss === null) {
    return "no_prior_data";
  }
  if (currentMiss !== null && priorMiss === null) {
    return "new_data";
  }
  if (currentMiss === null && priorMiss !== null) {
    return "no_prior_data";
  }

  // Both are non-null
  const delta = currentMiss! - priorMiss!;
  const threshold = 0.02; // 2% absolute change threshold

  if (Math.abs(delta) < threshold) {
    return "stable";
  }

  return delta < 0 ? "improving" : "worsening";
}

function buildComparison(
  currentMetrics: FunnelMetricsInput["funnel_metrics"],
  currentConstraintKey: string | null,
  priorRun: PriorRun
): DiagnosisSnapshot["comparison_to_prior_run"] {
  const priorDiagnosis = JSON.parse(fs.readFileSync(priorRun.diagnosis_path, "utf8"));

  const priorConstraintKey = priorDiagnosis.identified_constraint?.constraint_key ?? null;
  const constraintChanged = currentConstraintKey !== priorConstraintKey;

  const metricTrends: Record<MetricId, MetricTrend> = {
    traffic: "stable",
    cvr: "stable",
    aov: "stable",
    cac: "stable",
    orders: "stable",
    revenue: "stable",
  };

  for (const metricId of Object.keys(metricTrends) as MetricId[]) {
    const currentMiss = currentMetrics[metricId]?.miss ?? null;
    const priorMiss = priorDiagnosis.funnel_metrics?.[metricId]?.miss ?? null;
    metricTrends[metricId] = compareMetricTrend(currentMiss, priorMiss);
  }

  return {
    prior_run_id: priorRun.run_id,
    constraint_changed: constraintChanged,
    prior_constraint_key: priorConstraintKey,
    metric_trends: metricTrends,
  };
}

// -- Atomic write helper --

function atomicWriteJSON(filePath: string, data: any): void {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

// -- Main function --

/**
 * Generate diagnosis snapshot for a run with deterministic prior comparison
 */
export function generateDiagnosisSnapshot(
  runId: string,
  business: string,
  baseDir?: string
): DiagnosisSnapshot {
  const root = baseDir ?? process.cwd();

  // Step 1: Extract funnel metrics (BL-02)
  const metricsInput = extractFunnelMetrics(runId, business, root);

  // Step 2: Identify bottleneck (BL-03)
  const diagnosis = identifyBottleneck(metricsInput);

  // Step 3: Find prior run
  const priorRun = findPriorRun(business, runId, root);

  // Step 4: Build comparison
  const currentConstraintKey = diagnosis.identified_constraint?.constraint_key ?? null;
  const comparison = priorRun ? buildComparison(metricsInput.funnel_metrics, currentConstraintKey, priorRun) : null;

  // Step 5: Build snapshot
  const snapshot: DiagnosisSnapshot = {
    diagnosis_schema_version: "v1",
    constraint_key_version: "v1",
    metric_catalog_version: "v1",
    run_id: runId,
    business,
    timestamp: new Date().toISOString(),
    diagnosis_status: diagnosis.diagnosis_status,
    data_quality: diagnosis.data_quality,
    funnel_metrics: metricsInput.funnel_metrics,
    identified_constraint: diagnosis.identified_constraint,
    ranked_constraints: diagnosis.ranked_constraints,
    comparison_to_prior_run: comparison,
  };

  // Step 6: Write snapshot atomically
  const snapshotPath = path.join(
    root,
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId,
    "bottleneck-diagnosis.json"
  );

  atomicWriteJSON(snapshotPath, snapshot);

  return snapshot;
}
