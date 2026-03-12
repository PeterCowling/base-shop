import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import yaml from "js-yaml";

import { appendJsonlRecords, readJsonlRecords } from "./ideas-jsonl.js";
import { IDEAS_TRIAL_TELEMETRY_PATH } from "./lp-do-ideas-paths.js";
import {
  resolveWorkflowRuntimeTokenUsage,
  type WorkflowRuntimeUsageMode,
  type WorkflowRuntimeUsageProvider,
} from "./workflow-runtime-token-usage.js";

export type WorkflowTelemetryStage =
  | "lp-do-ideas"
  | "lp-do-fact-find"
  | "lp-do-analysis"
  | "lp-do-plan"
  | "lp-do-build";

export type WorkflowTokenSource = "api_usage" | "operator_provided" | "unknown";

export interface CheckResultSummary {
  valid: boolean;
  error_count: number;
  warning_count: number;
}

export interface WorkflowStepTelemetryRecord {
  record_type: "workflow_step";
  recorded_at: string;
  telemetry_key: string;
  mode: "trial" | "live";
  business: string;
  feature_slug: string;
  stage: WorkflowTelemetryStage;
  artifact_path: string | null;
  artifact_exists: boolean;
  artifact_bytes: number;
  artifact_lines: number;
  context_paths: string[];
  missing_context_paths: string[];
  context_input_bytes: number;
  context_input_lines: number;
  modules_loaded: string[];
  module_count: number;
  deterministic_checks: string[];
  deterministic_check_count: number;
  execution_track: string | null;
  deliverable_type: string | null;
  dispatch_ids: string[];
  model_input_tokens: number | null;
  model_output_tokens: number | null;
  token_source: WorkflowTokenSource;
  runtime_usage_provider: WorkflowRuntimeUsageProvider | null;
  runtime_session_id: string | null;
  runtime_usage_mode: WorkflowRuntimeUsageMode | null;
  runtime_usage_snapshot_at: string | null;
  runtime_total_input_tokens: number | null;
  runtime_total_output_tokens: number | null;
  per_module_bytes?: Record<string, number>;
  deterministic_check_results?: Record<string, CheckResultSummary>;
  notes: string | null;
}

export interface WorkflowStepTelemetryOptions {
  stage: WorkflowTelemetryStage;
  featureSlug: string;
  business?: string;
  mode?: "trial" | "live";
  telemetryPath?: string;
  artifactPath?: string;
  inputPaths?: string[];
  modules?: string[];
  deterministicChecks?: string[];
  checkResults?: string[];
  dispatchIds?: string[];
  executionTrack?: string;
  deliverableType?: string;
  modelInputTokens?: number | null;
  modelOutputTokens?: number | null;
  tokenSource?: WorkflowTokenSource;
  notes?: string;
  rootDir?: string;
  runtimeTokenEnv?: NodeJS.ProcessEnv;
  claudeSessionId?: string;
  codexSessionsRoot?: string;
  claudeTelemetryRoot?: string;
  now?: () => Date;
}

export interface WorkflowStageTelemetrySummary {
  stage: WorkflowTelemetryStage;
  record_count: number;
  latest_recorded_at: string;
  total_context_input_bytes: number;
  average_context_input_bytes: number;
  max_context_input_bytes: number;
  total_artifact_bytes: number;
  average_artifact_bytes: number;
  max_artifact_bytes: number;
  total_module_count: number;
  average_module_count: number;
  total_deterministic_check_count: number;
  token_measurement_count: number;
  token_measurement_coverage: number;
  total_model_input_tokens: number;
  total_model_output_tokens: number;
}

export interface WorkflowTelemetrySummary {
  feature_slug?: string;
  business?: string;
  record_count: number;
  stages_covered: WorkflowTelemetryStage[];
  totals: {
    context_input_bytes: number;
    artifact_bytes: number;
    module_count: number;
    deterministic_check_count: number;
    model_input_tokens: number;
    model_output_tokens: number;
    token_measurement_count: number;
    token_measurement_coverage: number;
  };
  by_stage: WorkflowStageTelemetrySummary[];
  gaps: {
    stages_missing_records: WorkflowTelemetryStage[];
    stages_missing_token_measurement: WorkflowTelemetryStage[];
    records_with_missing_context_paths: number;
  };
  largest_context_record:
    | {
        stage: WorkflowTelemetryStage;
        feature_slug: string;
        context_input_bytes: number;
      }
    | null;
  largest_artifact_record:
    | {
        stage: WorkflowTelemetryStage;
        feature_slug: string;
        artifact_bytes: number;
      }
    | null;
}

const WORKFLOW_STAGES: readonly WorkflowTelemetryStage[] = [
  "lp-do-ideas",
  "lp-do-fact-find",
  "lp-do-analysis",
  "lp-do-plan",
  "lp-do-build",
];

const STAGE_SKILL_PATH: Record<WorkflowTelemetryStage, string> = {
  "lp-do-ideas": ".claude/skills/lp-do-ideas/SKILL.md",
  "lp-do-fact-find": ".claude/skills/lp-do-fact-find/SKILL.md",
  "lp-do-analysis": ".claude/skills/lp-do-analysis/SKILL.md",
  "lp-do-plan": ".claude/skills/lp-do-plan/SKILL.md",
  "lp-do-build": ".claude/skills/lp-do-build/SKILL.md",
};

const STAGE_ARTIFACT_BASENAME: Partial<Record<WorkflowTelemetryStage, string>> = {
  "lp-do-fact-find": "fact-find.md",
  "lp-do-analysis": "analysis.md",
  "lp-do-plan": "plan.md",
  "lp-do-build": "build-record.user.md",
};

type FrontmatterRecord = Record<string, unknown>;

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

function resolveStageSkillPath(rootDir: string, stage: WorkflowTelemetryStage): string {
  return resolvePath(rootDir, STAGE_SKILL_PATH[stage]);
}

function resolveArtifactPath(
  rootDir: string,
  stage: WorkflowTelemetryStage,
  featureSlug: string,
  artifactPath?: string,
): string | null {
  if (artifactPath && artifactPath.trim().length > 0) {
    return resolvePath(rootDir, artifactPath);
  }
  const basename = STAGE_ARTIFACT_BASENAME[stage];
  if (!basename) {
    return null;
  }
  return resolvePath(rootDir, path.join("docs", "plans", featureSlug, basename));
}

function resolveModulePath(
  rootDir: string,
  stage: WorkflowTelemetryStage,
  modulePath: string,
): string {
  if (path.isAbsolute(modulePath)) {
    return modulePath;
  }

  const skillDir = path.dirname(resolveStageSkillPath(rootDir, stage));
  const fromSkillDir = path.resolve(skillDir, modulePath);
  if (existsSync(fromSkillDir)) {
    return fromSkillDir;
  }

  return resolvePath(rootDir, modulePath);
}

function parseFrontmatter(markdown: string): FrontmatterRecord {
  if (!markdown.startsWith("---\n")) {
    return {};
  }
  const closing = markdown.indexOf("\n---", 4);
  if (closing === -1) {
    return {};
  }

  const rawFrontmatter = markdown.slice(4, closing);
  try {
    const parsed = yaml.load(rawFrontmatter);
    return typeof parsed === "object" && parsed !== null ? (parsed as FrontmatterRecord) : {};
  } catch {
    return {};
  }
}

function getFrontmatterString(
  frontmatter: FrontmatterRecord,
  key: string,
): string | null {
  const value = frontmatter[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function countLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }
  return content.split("\n").length;
}

function readPathMetrics(filePath: string): {
  exists: boolean;
  bytes: number;
  lines: number;
} {
  if (!existsSync(filePath)) {
    return { exists: false, bytes: 0, lines: 0 };
  }
  const content = readFileSync(filePath, "utf-8");
  return {
    exists: true,
    bytes: Buffer.byteLength(content, "utf-8"),
    lines: countLines(content),
  };
}

function normalizeStringList(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function normalizeTokenSource(
  value: WorkflowTokenSource | undefined,
): WorkflowTokenSource {
  if (value === "api_usage" || value === "operator_provided") {
    return value;
  }
  return "unknown";
}

function parseCheckResults(
  raw: readonly string[],
): Record<string, CheckResultSummary> | undefined {
  if (raw.length === 0) {
    return undefined;
  }
  const results: Record<string, CheckResultSummary> = {};
  for (const entry of raw) {
    const lastColon = entry.lastIndexOf(":");
    if (lastColon === -1) continue;
    const beforeLast = entry.slice(0, lastColon);
    const warningStr = entry.slice(lastColon + 1);

    const secondLastColon = beforeLast.lastIndexOf(":");
    if (secondLastColon === -1) continue;
    const beforeSecond = beforeLast.slice(0, secondLastColon);
    const errorStr = beforeLast.slice(secondLastColon + 1);

    const thirdLastColon = beforeSecond.lastIndexOf(":");
    if (thirdLastColon === -1) continue;
    const name = beforeSecond.slice(0, thirdLastColon);
    const validStr = beforeSecond.slice(thirdLastColon + 1);

    if (!name || (validStr !== "pass" && validStr !== "fail")) continue;

    const errorCount = Number.parseInt(errorStr, 10);
    const warningCount = Number.parseInt(warningStr, 10);
    if (!Number.isFinite(errorCount) || !Number.isFinite(warningCount)) continue;

    results[name] = {
      valid: validStr === "pass",
      error_count: errorCount,
      warning_count: warningCount,
    };
  }
  return Object.keys(results).length > 0 ? results : undefined;
}

function computeTelemetryKey(
  record: Omit<WorkflowStepTelemetryRecord, "telemetry_key">,
): string {
  const payload = JSON.stringify({
    feature_slug: record.feature_slug,
    stage: record.stage,
    mode: record.mode,
    artifact_path: record.artifact_path,
    artifact_bytes: record.artifact_bytes,
    artifact_lines: record.artifact_lines,
    context_paths: record.context_paths,
    context_input_bytes: record.context_input_bytes,
    modules_loaded: record.modules_loaded,
    deterministic_checks: record.deterministic_checks,
    execution_track: record.execution_track,
    deliverable_type: record.deliverable_type,
    dispatch_ids: record.dispatch_ids,
    per_module_bytes: record.per_module_bytes,
    deterministic_check_results: record.deterministic_check_results,
  });
  return createHash("sha256").update(payload).digest("hex");
}

function isWorkflowStepTelemetryRecord(
  value: unknown,
): value is WorkflowStepTelemetryRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as WorkflowStepTelemetryRecord).record_type === "workflow_step" &&
    typeof (value as WorkflowStepTelemetryRecord).telemetry_key === "string" &&
    typeof (value as WorkflowStepTelemetryRecord).feature_slug === "string" &&
    typeof (value as WorkflowStepTelemetryRecord).stage === "string"
  );
}

function telemetryDedupeKey(record: WorkflowStepTelemetryRecord): string {
  return record.telemetry_key;
}

export function buildWorkflowStepTelemetryRecord(
  options: WorkflowStepTelemetryOptions,
): WorkflowStepTelemetryRecord {
  const rootDir = resolveRootDir(options.rootDir);
  const recordedAt = (options.now ?? (() => new Date()))().toISOString();
  const resolvedTelemetryPath = options.telemetryPath
    ? resolvePath(rootDir, options.telemetryPath)
    : null;
  const artifactPath = resolveArtifactPath(
    rootDir,
    options.stage,
    options.featureSlug,
    options.artifactPath,
  );
  const artifactMetrics =
    artifactPath !== null ? readPathMetrics(artifactPath) : { exists: false, bytes: 0, lines: 0 };

  const artifactFrontmatter =
    artifactPath !== null && artifactMetrics.exists
      ? parseFrontmatter(readFileSync(artifactPath, "utf-8"))
      : {};

  const resolvedModules = normalizeStringList(options.modules).map((modulePath) =>
    resolveModulePath(rootDir, options.stage, modulePath),
  );

  const resolvedContextPaths = normalizeStringList([
    resolveStageSkillPath(rootDir, options.stage),
    ...(options.inputPaths ?? []).map((inputPath) => resolvePath(rootDir, inputPath)),
    ...resolvedModules,
    ...(artifactPath ? [artifactPath] : []),
  ]);

  const moduleAbsolutePathSet = new Set(resolvedModules);
  const perModuleBytes: Record<string, number> = {};

  let contextInputBytes = 0;
  let contextInputLines = 0;
  const missingContextPaths: string[] = [];
  for (const contextPath of resolvedContextPaths) {
    const metrics = readPathMetrics(contextPath);
    if (!metrics.exists) {
      missingContextPaths.push(contextPath);
      continue;
    }
    contextInputBytes += metrics.bytes;
    contextInputLines += metrics.lines;
    if (moduleAbsolutePathSet.has(contextPath)) {
      perModuleBytes[path.relative(rootDir, contextPath).replace(/\\/g, "/")] = metrics.bytes;
    }
  }

  const executionTrack =
    options.executionTrack ??
    getFrontmatterString(artifactFrontmatter, "Execution-Track");
  const deliverableType =
    options.deliverableType ??
    getFrontmatterString(artifactFrontmatter, "Deliverable-Type");
  const business =
    options.business ??
    getFrontmatterString(artifactFrontmatter, "Business") ??
    "REPO";

  const dispatchIds = normalizeStringList(options.dispatchIds);
  const checkResultsParsed = parseCheckResults(options.checkResults ?? []);
  const deterministicChecks = normalizeStringList([
    ...(options.deterministicChecks ?? []),
    ...(checkResultsParsed ? Object.keys(checkResultsParsed) : []),
  ]);
  const modulesLoaded = normalizeStringList(options.modules);
  const existingRecords = resolvedTelemetryPath
    ? readWorkflowStepTelemetry(resolvedTelemetryPath)
    : [];
  const runtimeTokenEnv = {
    ...process.env,
    ...(options.runtimeTokenEnv ?? {}),
    ...(options.claudeSessionId
      ? { WORKFLOW_TELEMETRY_CLAUDE_SESSION_ID: options.claudeSessionId }
      : {}),
  };
  const runtimeUsage = resolveWorkflowRuntimeTokenUsage({
    existingRecords,
    featureSlug: options.featureSlug,
    env: runtimeTokenEnv,
    codexSessionsRoot: options.codexSessionsRoot,
    claudeTelemetryRoot: options.claudeTelemetryRoot,
  });
  const manualTokenUsageProvided =
    typeof options.modelInputTokens === "number" || typeof options.modelOutputTokens === "number";
  const tokenSource = manualTokenUsageProvided
    ? normalizeTokenSource(options.tokenSource ?? "operator_provided")
    : runtimeUsage.tokenSource === "api_usage"
      ? "api_usage"
      : normalizeTokenSource(options.tokenSource);
  const notes = [options.notes?.trim(), runtimeUsage.note].filter(Boolean).join(" ").trim();

  const baseRecord: Omit<WorkflowStepTelemetryRecord, "telemetry_key"> = {
    record_type: "workflow_step",
    recorded_at: recordedAt,
    mode: options.mode ?? "trial",
    business,
    feature_slug: options.featureSlug,
    stage: options.stage,
    artifact_path:
      artifactPath !== null ? path.relative(rootDir, artifactPath).replace(/\\/g, "/") : null,
    artifact_exists: artifactMetrics.exists,
    artifact_bytes: artifactMetrics.bytes,
    artifact_lines: artifactMetrics.lines,
    context_paths: resolvedContextPaths.map((contextPath) =>
      path.relative(rootDir, contextPath).replace(/\\/g, "/"),
    ),
    missing_context_paths: missingContextPaths.map((contextPath) =>
      path.relative(rootDir, contextPath).replace(/\\/g, "/"),
    ),
    context_input_bytes: contextInputBytes,
    context_input_lines: contextInputLines,
    modules_loaded: modulesLoaded,
    module_count: modulesLoaded.length,
    deterministic_checks: deterministicChecks,
    deterministic_check_count: deterministicChecks.length,
    execution_track: executionTrack,
    deliverable_type: deliverableType,
    dispatch_ids: dispatchIds,
    model_input_tokens:
      typeof options.modelInputTokens === "number"
        ? options.modelInputTokens
        : runtimeUsage.modelInputTokens,
    model_output_tokens:
      typeof options.modelOutputTokens === "number"
        ? options.modelOutputTokens
        : runtimeUsage.modelOutputTokens,
    token_source: tokenSource,
    runtime_usage_provider: runtimeUsage.runtimeUsageProvider,
    runtime_session_id: runtimeUsage.runtimeSessionId,
    runtime_usage_mode: runtimeUsage.runtimeUsageMode,
    runtime_usage_snapshot_at: runtimeUsage.runtimeUsageSnapshotAt,
    runtime_total_input_tokens: runtimeUsage.runtimeTotalInputTokens,
    runtime_total_output_tokens: runtimeUsage.runtimeTotalOutputTokens,
    per_module_bytes: perModuleBytes,
    deterministic_check_results: checkResultsParsed,
    notes: notes.length > 0 ? notes : null,
  };

  return {
    ...baseRecord,
    telemetry_key: computeTelemetryKey(baseRecord),
  };
}

export function appendWorkflowStepTelemetry(
  telemetryPath: string,
  records: readonly WorkflowStepTelemetryRecord[],
): number {
  return appendJsonlRecords(
    telemetryPath,
    records,
    telemetryDedupeKey,
    isWorkflowStepTelemetryRecord,
  );
}

export function readWorkflowStepTelemetry(
  telemetryPath: string,
): WorkflowStepTelemetryRecord[] {
  return readJsonlRecords(telemetryPath, isWorkflowStepTelemetryRecord);
}

export function summarizeWorkflowStepTelemetry(
  records: readonly WorkflowStepTelemetryRecord[],
  filters: {
    featureSlug?: string;
    business?: string;
  } = {},
): WorkflowTelemetrySummary {
  const filtered = records.filter((record) => {
    if (filters.featureSlug && record.feature_slug !== filters.featureSlug) {
      return false;
    }
    if (filters.business && record.business !== filters.business) {
      return false;
    }
    return true;
  });

  const byStage = WORKFLOW_STAGES.flatMap((stage) => {
    const stageRecords = filtered.filter((record) => record.stage === stage);
    if (stageRecords.length === 0) {
      return [];
    }

    const contextInputValues = stageRecords.map((record) => record.context_input_bytes);
    const artifactValues = stageRecords.map((record) => record.artifact_bytes);
    const moduleValues = stageRecords.map((record) => record.module_count);
    const tokenMeasuredCount = stageRecords.filter(
      (record) =>
        record.model_input_tokens !== null || record.model_output_tokens !== null,
    ).length;

    return [
      {
        stage,
        record_count: stageRecords.length,
        latest_recorded_at: stageRecords[stageRecords.length - 1]?.recorded_at ?? "",
        total_context_input_bytes: contextInputValues.reduce((sum, value) => sum + value, 0),
        average_context_input_bytes: Math.round(
          contextInputValues.reduce((sum, value) => sum + value, 0) / stageRecords.length,
        ),
        max_context_input_bytes: Math.max(...contextInputValues),
        total_artifact_bytes: artifactValues.reduce((sum, value) => sum + value, 0),
        average_artifact_bytes: Math.round(
          artifactValues.reduce((sum, value) => sum + value, 0) / stageRecords.length,
        ),
        max_artifact_bytes: Math.max(...artifactValues),
        total_module_count: moduleValues.reduce((sum, value) => sum + value, 0),
        average_module_count:
          Math.round(
            (moduleValues.reduce((sum, value) => sum + value, 0) / stageRecords.length) * 100,
          ) / 100,
        total_deterministic_check_count: stageRecords.reduce(
          (sum, record) => sum + record.deterministic_check_count,
          0,
        ),
        token_measurement_count: tokenMeasuredCount,
        token_measurement_coverage:
          Math.round((tokenMeasuredCount / stageRecords.length) * 10000) / 10000,
        total_model_input_tokens: stageRecords.reduce(
          (sum, record) => sum + (record.model_input_tokens ?? 0),
          0,
        ),
        total_model_output_tokens: stageRecords.reduce(
          (sum, record) => sum + (record.model_output_tokens ?? 0),
          0,
        ),
      },
    ];
  });

  const totalContextBytes = filtered.reduce(
    (sum, record) => sum + record.context_input_bytes,
    0,
  );
  const totalArtifactBytes = filtered.reduce((sum, record) => sum + record.artifact_bytes, 0);
  const totalModuleCount = filtered.reduce((sum, record) => sum + record.module_count, 0);
  const totalDeterministicCheckCount = filtered.reduce(
    (sum, record) => sum + record.deterministic_check_count,
    0,
  );
  const totalModelInputTokens = filtered.reduce(
    (sum, record) => sum + (record.model_input_tokens ?? 0),
    0,
  );
  const totalModelOutputTokens = filtered.reduce(
    (sum, record) => sum + (record.model_output_tokens ?? 0),
    0,
  );
  const tokenMeasurementCount = filtered.filter(
    (record) => record.model_input_tokens !== null || record.model_output_tokens !== null,
  ).length;

  const largestContextRecord =
    filtered.length > 0
      ? filtered.reduce((largest, record) =>
          record.context_input_bytes > largest.context_input_bytes ? record : largest,
        )
      : null;
  const largestArtifactRecord =
    filtered.length > 0
      ? filtered.reduce((largest, record) =>
          record.artifact_bytes > largest.artifact_bytes ? record : largest,
        )
      : null;

  return {
    feature_slug: filters.featureSlug,
    business: filters.business,
    record_count: filtered.length,
    stages_covered: byStage.map((entry) => entry.stage),
    totals: {
      context_input_bytes: totalContextBytes,
      artifact_bytes: totalArtifactBytes,
      module_count: totalModuleCount,
      deterministic_check_count: totalDeterministicCheckCount,
      model_input_tokens: totalModelInputTokens,
      model_output_tokens: totalModelOutputTokens,
      token_measurement_count: tokenMeasurementCount,
      token_measurement_coverage:
        filtered.length === 0 ? 0 : Math.round((tokenMeasurementCount / filtered.length) * 10000) / 10000,
    },
    by_stage: byStage,
    gaps: {
      stages_missing_records: WORKFLOW_STAGES.filter(
        (stage) => !byStage.some((entry) => entry.stage === stage),
      ),
      stages_missing_token_measurement: byStage
        .filter((entry) => entry.token_measurement_count === 0)
        .map((entry) => entry.stage),
      records_with_missing_context_paths: filtered.filter(
        (record) => record.missing_context_paths.length > 0,
      ).length,
    },
    largest_context_record: largestContextRecord
      ? {
          stage: largestContextRecord.stage,
          feature_slug: largestContextRecord.feature_slug,
          context_input_bytes: largestContextRecord.context_input_bytes,
        }
      : null,
    largest_artifact_record: largestArtifactRecord
      ? {
          stage: largestArtifactRecord.stage,
          feature_slug: largestArtifactRecord.feature_slug,
          artifact_bytes: largestArtifactRecord.artifact_bytes,
        }
      : null,
  };
}

function defaultTelemetryPath(rootDir: string, override?: string): string {
  return resolvePath(rootDir, override ?? IDEAS_TRIAL_TELEMETRY_PATH);
}

function parseOptionalInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main(): Promise<void> {
  const cliArgs = process.argv.slice(2).filter((value) => value !== "--");
  const { values } = parseArgs({
    args: cliArgs,
    options: {
      stage: { type: "string" },
      "feature-slug": { type: "string" },
      business: { type: "string" },
      mode: { type: "string" },
      "telemetry-path": { type: "string" },
      "artifact-path": { type: "string" },
      "input-path": { type: "string", multiple: true },
      module: { type: "string", multiple: true },
      "deterministic-check": { type: "string", multiple: true },
      "check-result": { type: "string", multiple: true },
      "dispatch-id": { type: "string", multiple: true },
      "execution-track": { type: "string" },
      "deliverable-type": { type: "string" },
      "model-input-tokens": { type: "string" },
      "model-output-tokens": { type: "string" },
      "token-source": { type: "string" },
      notes: { type: "string" },
      "claude-session-id": { type: "string" },
      "codex-sessions-root": { type: "string" },
      "claude-telemetry-root": { type: "string" },
      "root-dir": { type: "string" },
    },
    strict: true,
  });

  const stage = values["stage"];
  const featureSlug = values["feature-slug"];
  if (
    !stage ||
    !featureSlug ||
    !WORKFLOW_STAGES.includes(stage as WorkflowTelemetryStage)
  ) {
    throw new Error(
      `Usage: --stage <${WORKFLOW_STAGES.join(" | ")}> --feature-slug <slug> [telemetry options...]`,
    );
  }

  const rootDir = resolveRootDir(values["root-dir"]);
  const telemetryPath = defaultTelemetryPath(rootDir, values["telemetry-path"]);
  const record = buildWorkflowStepTelemetryRecord({
    stage: stage as WorkflowTelemetryStage,
    featureSlug,
    business: values["business"],
    mode: values["mode"] === "live" ? "live" : "trial",
    telemetryPath,
    artifactPath: values["artifact-path"],
    inputPaths: values["input-path"] ?? [],
    modules: values["module"] ?? [],
    deterministicChecks: values["deterministic-check"] ?? [],
    checkResults: values["check-result"] ?? [],
    dispatchIds: values["dispatch-id"] ?? [],
    executionTrack: values["execution-track"],
    deliverableType: values["deliverable-type"],
    modelInputTokens: parseOptionalInteger(values["model-input-tokens"]) ?? undefined,
    modelOutputTokens: parseOptionalInteger(values["model-output-tokens"]) ?? undefined,
    tokenSource: (values["token-source"] as WorkflowTokenSource | undefined) ?? "unknown",
    notes: values["notes"],
    claudeSessionId: values["claude-session-id"],
    codexSessionsRoot: values["codex-sessions-root"],
    claudeTelemetryRoot: values["claude-telemetry-root"],
    rootDir,
  });
  const appended = appendWorkflowStepTelemetry(telemetryPath, [record]);

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      appended,
      telemetry_path: path.relative(rootDir, telemetryPath).replace(/\\/g, "/"),
      record,
    })}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
