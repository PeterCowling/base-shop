import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { IDEAS_TRIAL_TELEMETRY_PATH } from "./lp-do-ideas-paths.js";
import {
  readWorkflowStepTelemetry,
  summarizeWorkflowStepTelemetry,
  type WorkflowStepTelemetryRecord,
} from "./lp-do-ideas-workflow-telemetry.js";

type ReportFormat = "json" | "markdown";

function resolveRootDir(explicitRootDir?: string): string {
  if (explicitRootDir && explicitRootDir.trim().length > 0) {
    return path.resolve(explicitRootDir);
  }
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function resolvePath(rootDir: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

export function computePerModuleBreakdown(
  records: readonly WorkflowStepTelemetryRecord[],
  filters: { featureSlug?: string; business?: string } = {},
): { per_module_breakdown: Record<string, number>; per_module_record_count: number; total_record_count: number } {
  const filtered = records.filter((record) => {
    if (filters.featureSlug && record.feature_slug !== filters.featureSlug) return false;
    if (filters.business && record.business !== filters.business) return false;
    return true;
  });

  const breakdown: Record<string, number> = {};
  let perModuleRecordCount = 0;

  for (const record of filtered) {
    if (
      record.per_module_bytes != null &&
      typeof record.per_module_bytes === "object" &&
      Object.keys(record.per_module_bytes).length > 0
    ) {
      perModuleRecordCount++;
      for (const [modulePath, bytes] of Object.entries(record.per_module_bytes)) {
        breakdown[modulePath] = (breakdown[modulePath] ?? 0) + bytes;
      }
    }
  }

  return {
    per_module_breakdown: breakdown,
    per_module_record_count: perModuleRecordCount,
    total_record_count: filtered.length,
  };
}

function formatMarkdown(
  summary: ReturnType<typeof summarizeWorkflowStepTelemetry>,
  perModule?: { per_module_breakdown: Record<string, number>; per_module_record_count: number; total_record_count: number },
): string {
  const lines: string[] = [];
  lines.push(`# Workflow Telemetry Summary`);
  lines.push("");
  if (summary.feature_slug) {
    lines.push(`- Feature slug: \`${summary.feature_slug}\``);
  }
  if (summary.business) {
    lines.push(`- Business: \`${summary.business}\``);
  }
  lines.push(`- Records: ${summary.record_count}`);
  lines.push(
    `- Token measurement coverage: ${(summary.totals.token_measurement_coverage * 100).toFixed(1)}%`,
  );
  lines.push("");
  lines.push(`| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |`);
  lines.push(`|---|---:|---:|---:|---:|---:|`);
  for (const stage of summary.by_stage) {
    lines.push(
      `| ${stage.stage} | ${stage.record_count} | ${stage.average_module_count.toFixed(2)} | ${stage.average_context_input_bytes} | ${stage.average_artifact_bytes} | ${(stage.token_measurement_coverage * 100).toFixed(1)}% |`,
    );
  }
  lines.push("");
  lines.push(`## Totals`);
  lines.push("");
  lines.push(`- Context input bytes: ${summary.totals.context_input_bytes}`);
  lines.push(`- Artifact bytes: ${summary.totals.artifact_bytes}`);
  lines.push(`- Modules counted: ${summary.totals.module_count}`);
  lines.push(
    `- Deterministic checks counted: ${summary.totals.deterministic_check_count}`,
  );
  lines.push(`- Model input tokens captured: ${summary.totals.model_input_tokens}`);
  lines.push(`- Model output tokens captured: ${summary.totals.model_output_tokens}`);
  lines.push("");
  lines.push(`## Gaps`);
  lines.push("");
  lines.push(
    `- Stages missing records: ${
      summary.gaps.stages_missing_records.length > 0
        ? summary.gaps.stages_missing_records.join(", ")
        : "None"
    }`,
  );
  lines.push(
    `- Stages missing token measurement: ${
      summary.gaps.stages_missing_token_measurement.length > 0
        ? summary.gaps.stages_missing_token_measurement.join(", ")
        : "None"
    }`,
  );
  lines.push(
    `- Records with missing context paths: ${summary.gaps.records_with_missing_context_paths}`,
  );

  if (perModule && Object.keys(perModule.per_module_breakdown).length > 0) {
    lines.push("");
    lines.push(`## Per-Module Context Bytes`);
    lines.push("");
    lines.push(
      `Based on ${perModule.per_module_record_count} of ${perModule.total_record_count} records with per-module data.`,
    );
    lines.push("");
    lines.push(`| Module | Total Bytes |`);
    lines.push(`|---|---:|`);
    const sorted = Object.entries(perModule.per_module_breakdown).sort(
      ([, a], [, b]) => b - a,
    );
    for (const [modulePath, bytes] of sorted) {
      lines.push(`| ${modulePath} | ${bytes} |`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const cliArgs = process.argv.slice(2).filter((value) => value !== "--");
  const { values } = parseArgs({
    args: cliArgs,
    options: {
      "feature-slug": { type: "string" },
      business: { type: "string" },
      "telemetry-path": { type: "string" },
      format: { type: "string" },
      "root-dir": { type: "string" },
    },
    strict: true,
  });

  const rootDir = resolveRootDir(values["root-dir"]);
  const telemetryPath = resolvePath(
    rootDir,
    values["telemetry-path"] ?? IDEAS_TRIAL_TELEMETRY_PATH,
  );
  const format = (values["format"] ?? "json") as ReportFormat;
  if (format !== "json" && format !== "markdown") {
    throw new Error(`Invalid --format value "${values["format"]}". Use json or markdown.`);
  }

  const records = readWorkflowStepTelemetry(telemetryPath);
  const filters = {
    featureSlug: values["feature-slug"],
    business: values["business"],
  };
  const summary = summarizeWorkflowStepTelemetry(records, filters);
  const perModule = computePerModuleBreakdown(records, filters);

  if (format === "markdown") {
    process.stdout.write(formatMarkdown(summary, perModule));
    return;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        summary,
        per_module_breakdown: perModule.per_module_breakdown,
        per_module_record_count: perModule.per_module_record_count,
      },
      null,
      2,
    )}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
