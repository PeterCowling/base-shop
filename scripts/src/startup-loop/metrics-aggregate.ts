/**
 * Metrics aggregation — controlled-velocity stabilization triggers (LPSP-08).
 *
 * Reads per-run metrics.jsonl files across a rolling window of runs,
 * computes medians, and emits stabilization warnings when thresholds
 * are breached.
 *
 * @see docs/plans/lp-skill-system-sequencing-plan.md#LPSP-08
 */

import { promises as fs } from "fs";
import path from "path";

import { median as libMedian } from "@acme/lib";

// -- Types --

export interface MetricEntry {
  timestamp: string;
  run_id: string;
  metric_name: string;
  value: number;
}

export interface MetricWarning {
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
}

export interface MetricsReport {
  business: string;
  window: number;
  runsAnalyzed: number;
  metrics: Record<string, { median: number; values: number[] }>;
  warnings: MetricWarning[];
}

export interface AggregateOptions {
  window: number;
}

// -- Thresholds --

const STABILIZATION_THRESHOLDS: Record<string, number> = {
  manual_interventions: 2,
  replan_count: 4,
  join_block_count: 3,
  lint_failure_count: 2,
  resume_failure_count: 1,
};

// -- Main --

export async function aggregateMetrics(
  business: string,
  runsDir: string,
  options: AggregateOptions,
): Promise<MetricsReport> {
  const { window } = options;

  // 1. Discover run directories for this business
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    return emptyReport(business, window);
  }

  // Filter to runs matching the business prefix and sort by name (lexicographic = chronological for our ID format)
  const businessPrefix = `SFS-${business}-`;
  const matchingRuns = entries
    .filter((e) => e.startsWith(businessPrefix))
    .sort();

  // Take only the most recent `window` runs
  const recentRuns = matchingRuns.slice(-window);

  if (recentRuns.length === 0) {
    return emptyReport(business, window);
  }

  // 2. Read metrics from each run
  const allMetrics: MetricEntry[] = [];
  for (const runId of recentRuns) {
    const metricsPath = path.join(runsDir, runId, "metrics.jsonl");
    try {
      const content = await fs.readFile(metricsPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        allMetrics.push(JSON.parse(line) as MetricEntry);
      }
    } catch {
      // Run has no metrics file — skip
    }
  }

  // 3. Group by metric name and compute per-run aggregates
  const perRunMetrics = new Map<string, Map<string, number>>();
  for (const entry of allMetrics) {
    let runMap = perRunMetrics.get(entry.metric_name);
    if (!runMap) {
      runMap = new Map();
      perRunMetrics.set(entry.metric_name, runMap);
    }
    // Sum metrics within a run (in case of multiple entries)
    const current = runMap.get(entry.run_id) ?? 0;
    runMap.set(entry.run_id, current + entry.value);
  }

  // 4. Compute medians and check thresholds
  const metrics: Record<string, { median: number; values: number[] }> = {};
  const warnings: MetricWarning[] = [];

  for (const [metricName, runMap] of perRunMetrics) {
    const values = [...runMap.values()].sort((a, b) => a - b);
    const median = computeMedian(values);

    metrics[metricName] = { median, values };

    const threshold = STABILIZATION_THRESHOLDS[metricName];
    if (threshold !== undefined && median > threshold) {
      warnings.push({
        metric: metricName,
        currentValue: median,
        threshold,
        message: `Stabilization warning: ${metricName} median (${median}) exceeds threshold (${threshold}) over ${recentRuns.length} runs`,
      });
    }
  }

  return {
    business,
    window,
    runsAnalyzed: recentRuns.length,
    metrics,
    warnings,
  };
}

// -- Helpers --

function computeMedian(sortedValues: number[]): number {
  const result = libMedian(sortedValues);
  return Number.isNaN(result) ? 0 : result;
}

function emptyReport(business: string, window: number): MetricsReport {
  return {
    business,
    window,
    runsAnalyzed: 0,
    metrics: {},
    warnings: [],
  };
}
