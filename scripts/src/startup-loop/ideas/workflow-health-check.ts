/**
 * Workflow queue health check CLI.
 *
 * Thin wrapper around `runMetricsRollup()` and `summarizeWorkflowStepTelemetry()`
 * that outputs structured JSON to stdout and uses exit codes for cron scheduling:
 *   0 = healthy or warning (no data to evaluate)
 *   1 = alert (threshold breaches detected)
 *   2 = error (missing source files)
 *
 * Source files (queue-state.json, telemetry.jsonl) are never mutated.
 */

import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import type { IdeasMetricsRollup, MetricsActionRecord } from "./lp-do-ideas-metrics-rollup.js";
import { runMetricsRollup } from "./lp-do-ideas-metrics-runner.js";
import { IDEAS_TRIAL_QUEUE_STATE_PATH, IDEAS_TRIAL_TELEMETRY_PATH } from "./lp-do-ideas-paths.js";
import {
  readWorkflowStepTelemetry,
  summarizeWorkflowStepTelemetry,
  type WorkflowTelemetrySummary,
} from "./lp-do-ideas-workflow-telemetry.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type HealthCheckStatus = "healthy" | "warning" | "alert" | "error";

export interface HealthCheckResult {
  status: HealthCheckStatus;
  timestamp: string;
  metrics_rollup_ready: boolean;
  metrics_rollup_reason: string | null;
  action_records: MetricsActionRecord[];
  rollup_summary: {
    cycle_count: number;
    queue_age_p95_days: IdeasMetricsRollup["queue_age_p95_days"];
    fan_out_admitted: number;
    loop_incidence: number;
  };
  workflow_step_summary: WorkflowTelemetrySummary | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CheckWorkflowHealthOptions {
  queueStatePath: string;
  telemetryPath: string;
  now?: Date;
}

export function checkWorkflowHealth(
  options: CheckWorkflowHealthOptions,
): HealthCheckResult {
  const { queueStatePath, telemetryPath, now } = options;
  const timestamp = (now ?? new Date()).toISOString();

  // Explicit file-existence checks — runMetricsRollup() and readWorkflowStepTelemetry()
  // silently return empty results on missing files, so we check first to surface errors.
  const missingFiles: string[] = [];
  if (!existsSync(queueStatePath)) {
    missingFiles.push(queueStatePath);
  }
  if (!existsSync(telemetryPath)) {
    missingFiles.push(telemetryPath);
  }

  if (missingFiles.length > 0) {
    return {
      status: "error",
      timestamp,
      metrics_rollup_ready: false,
      metrics_rollup_reason: null,
      action_records: [],
      rollup_summary: {
        cycle_count: 0,
        queue_age_p95_days: { DO: 0, IMPROVE: 0 },
        fan_out_admitted: 0,
        loop_incidence: 0,
      },
      workflow_step_summary: null,
      error: `Missing source files: ${missingFiles.join(", ")}`,
    };
  }

  // Run metrics rollup (queue/cycle health with alerts)
  const metricsResult = runMetricsRollup({
    telemetryPath,
    queueStatePath,
    now,
  });

  const rollup = metricsResult.rollup;

  // Read and summarize workflow-step telemetry
  const workflowStepRecords = readWorkflowStepTelemetry(telemetryPath);
  const workflowStepSummary = summarizeWorkflowStepTelemetry(workflowStepRecords);

  // Determine status
  let status: HealthCheckStatus;
  if (rollup.action_records.length > 0) {
    status = "alert";
  } else if (!metricsResult.ready) {
    // No cycle data to evaluate — warning, not error (files exist but lack cycle records)
    status = "warning";
  } else {
    status = "healthy";
  }

  return {
    status,
    timestamp,
    metrics_rollup_ready: metricsResult.ready,
    metrics_rollup_reason: metricsResult.ready ? null : metricsResult.reason,
    action_records: rollup.action_records,
    rollup_summary: {
      cycle_count: rollup.cycle_count,
      queue_age_p95_days: rollup.queue_age_p95_days,
      fan_out_admitted: rollup.fan_out_admitted,
      loop_incidence: rollup.loop_incidence,
    },
    workflow_step_summary: workflowStepSummary,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function resolveRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function resolvePath(rootDir: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

async function main(): Promise<void> {
  const cliArgs = process.argv.slice(2).filter((v) => v !== "--");
  const { values } = parseArgs({
    args: cliArgs,
    options: {
      "queue-state-path": { type: "string" },
      "telemetry-path": { type: "string" },
      output: { type: "string" },
    },
    strict: true,
  });

  const rootDir = resolveRootDir();
  const queueStatePath = resolvePath(
    rootDir,
    values["queue-state-path"] ?? IDEAS_TRIAL_QUEUE_STATE_PATH,
  );
  const telemetryPath = resolvePath(
    rootDir,
    values["telemetry-path"] ?? IDEAS_TRIAL_TELEMETRY_PATH,
  );

  const result = checkWorkflowHealth({ queueStatePath, telemetryPath });
  const json = JSON.stringify(result, null, 2);

  // Always output to stdout
  process.stdout.write(`${json}\n`);

  // Optional file output
  if (values["output"]) {
    try {
      writeFileSync(values["output"], `${json}\n`, "utf-8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Warning: could not write to ${values["output"]}: ${msg}\n`);
      // Still exit based on health status, not file write failure
    }
  }

  // Exit codes: 0 = healthy/warning, 1 = alert, 2 = error
  if (result.status === "error") {
    process.exitCode = 2;
  } else if (result.status === "alert") {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
  });
}
