import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { MetricsReport } from "../metrics-aggregate";
import { aggregateMetrics } from "../metrics-aggregate";

/**
 * LPSP-08: /lp-build (VC-08-02 stabilization triggers)
 *
 * Tests cover:
 * - VC-08-02-01: Healthy metrics → no warnings
 * - VC-08-02-02: Manual interventions median > 2 → stabilization warning
 * - VC-08-02-03: Multiple threshold breaches → multiple warnings
 * - VC-08-02-04: Empty/missing metrics → no crash, clean report
 */

// -- Fixture helpers --

interface MetricEntry {
  timestamp: string;
  run_id: string;
  metric_name: string;
  value: number;
}

function makeMetric(overrides: Partial<MetricEntry>): MetricEntry {
  return {
    timestamp: "2026-02-13T12:00:00Z",
    run_id: "SFS-TEST-20260213-1200",
    metric_name: "manual_interventions",
    value: 0,
    ...overrides,
  };
}

async function setupRunsDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "metrics-test-"));
}

async function writeMetrics(
  runsDir: string,
  runId: string,
  metrics: MetricEntry[],
): Promise<void> {
  const runDir = path.join(runsDir, runId);
  await fs.mkdir(runDir, { recursive: true });
  const lines = metrics.map((m) => JSON.stringify(m)).join("\n");
  await fs.writeFile(path.join(runDir, "metrics.jsonl"), lines + "\n");
}

// -- Tests --

describe("aggregateMetrics", () => {
  // VC-08-02-04: Empty/missing metrics
  it("returns clean report when no runs exist", async () => {
    const runsDir = await setupRunsDir();

    const report = await aggregateMetrics("TEST", runsDir, { window: 5 });

    expect(report.warnings).toHaveLength(0);
    expect(report.runsAnalyzed).toBe(0);
  });

  // VC-08-02-01: Healthy metrics → no warnings
  it("returns no warnings when all metrics are within thresholds", async () => {
    const runsDir = await setupRunsDir();

    for (let i = 0; i < 5; i++) {
      const runId = `SFS-TEST-20260213-${1000 + i}`;
      await writeMetrics(runsDir, runId, [
        makeMetric({ run_id: runId, metric_name: "manual_interventions", value: 1 }),
        makeMetric({ run_id: runId, metric_name: "replan_count", value: 1 }),
        makeMetric({ run_id: runId, metric_name: "join_block_count", value: 0 }),
      ]);
    }

    const report = await aggregateMetrics("TEST", runsDir, { window: 5 });

    expect(report.warnings).toHaveLength(0);
    expect(report.runsAnalyzed).toBe(5);
  });

  // VC-08-02-02: Manual interventions median > 2 → stabilization warning
  it("emits stabilization warning when manual interventions exceed threshold", async () => {
    const runsDir = await setupRunsDir();

    // 5 runs with high manual intervention counts (median = 4)
    for (let i = 0; i < 5; i++) {
      const runId = `SFS-TEST-20260213-${1000 + i}`;
      await writeMetrics(runsDir, runId, [
        makeMetric({ run_id: runId, metric_name: "manual_interventions", value: 3 + i }),
      ]);
    }

    const report = await aggregateMetrics("TEST", runsDir, { window: 5 });

    expect(report.warnings.length).toBeGreaterThanOrEqual(1);
    const miWarning = report.warnings.find((w) =>
      w.metric === "manual_interventions",
    );
    expect(miWarning).toBeDefined();
    expect(miWarning!.message.toLowerCase()).toContain("stabilization");
    expect(miWarning!.currentValue).toBeGreaterThan(2);
    expect(miWarning!.threshold).toBe(2);
  });

  // VC-08-02-03: Multiple threshold breaches
  it("emits multiple warnings for multiple threshold breaches", async () => {
    const runsDir = await setupRunsDir();

    for (let i = 0; i < 5; i++) {
      const runId = `SFS-TEST-20260213-${1000 + i}`;
      await writeMetrics(runsDir, runId, [
        makeMetric({ run_id: runId, metric_name: "manual_interventions", value: 5 }),
        makeMetric({ run_id: runId, metric_name: "replan_count", value: 6 }),
      ]);
    }

    const report = await aggregateMetrics("TEST", runsDir, { window: 5 });

    expect(report.warnings.length).toBeGreaterThanOrEqual(2);

    const metricNames = report.warnings.map((w) => w.metric);
    expect(metricNames).toContain("manual_interventions");
    expect(metricNames).toContain("replan_count");
  });

  it("respects window parameter — only considers recent runs", async () => {
    const runsDir = await setupRunsDir();

    // 3 old runs with high values
    for (let i = 0; i < 3; i++) {
      const runId = `SFS-TEST-20260210-${1000 + i}`;
      await writeMetrics(runsDir, runId, [
        makeMetric({ run_id: runId, metric_name: "manual_interventions", value: 10 }),
      ]);
    }
    // 3 recent runs with low values
    for (let i = 0; i < 3; i++) {
      const runId = `SFS-TEST-20260213-${1000 + i}`;
      await writeMetrics(runsDir, runId, [
        makeMetric({ run_id: runId, metric_name: "manual_interventions", value: 1 }),
      ]);
    }

    // Window of 3 → only recent runs
    const report = await aggregateMetrics("TEST", runsDir, { window: 3 });

    expect(report.runsAnalyzed).toBe(3);
    expect(report.warnings).toHaveLength(0);
  });
});
