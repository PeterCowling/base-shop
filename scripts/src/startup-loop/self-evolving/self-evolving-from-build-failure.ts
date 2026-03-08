import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type {
  MetaObservation,
  ObservationType,
  StartupState,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { buildHardSignature } from "./self-evolving-detector.js";
import {
  runSelfEvolvingOrchestrator,
  type SelfEvolvingOrchestratorResult,
} from "./self-evolving-orchestrator.js";

// --- Types ---

export type FailureType =
  | "infeasible_declaration"
  | "replan_exhaustion"
  | "confidence_regression"
  | "gate_block";

export interface FailureBridgeOptions {
  rootDir: string;
  business: string;
  planSlug: string;
  failureType: FailureType;
  taskId?: string;
  runId: string;
  sessionId: string;
}

export interface FailureBridgeResult {
  ok: boolean;
  observations_generated: number;
  failure_type: FailureType;
  warnings: string[];
  orchestrator?: Pick<
    SelfEvolvingOrchestratorResult,
    | "observations_count"
    | "repeat_candidates_detected"
    | "candidates_generated"
    | "candidate_path"
  >;
  error?: string;
}

// --- Failure type configuration ---

interface FailureTypeConfig {
  observation_type: ObservationType;
  severity: number;
  detector_confidence: number;
  step_id: string;
}

const FAILURE_TYPE_CONFIG: Record<FailureType, FailureTypeConfig> = {
  infeasible_declaration: {
    observation_type: "execution_event",
    severity: 0.9,
    detector_confidence: 0.9,
    step_id: "build-failure-infeasible",
  },
  replan_exhaustion: {
    observation_type: "validation_failure",
    severity: 0.8,
    detector_confidence: 0.85,
    step_id: "build-failure-replan-exhaustion",
  },
  confidence_regression: {
    observation_type: "validation_failure",
    severity: 0.6,
    detector_confidence: 0.7,
    step_id: "build-failure-confidence-regression",
  },
  gate_block: {
    observation_type: "validation_failure",
    severity: 0.5,
    detector_confidence: 0.65,
    step_id: "build-failure-gate-block",
  },
};

const VALID_FAILURE_TYPES = new Set<string>(Object.keys(FAILURE_TYPE_CONFIG));

// --- Helper functions ---

function loadStartupState(
  rootDir: string,
  business: string,
): StartupState | null {
  const startupStatePath = path.join(
    rootDir,
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    business,
    "startup-state.json",
  );

  if (!existsSync(startupStatePath)) {
    return null;
  }

  return JSON.parse(readFileSync(startupStatePath, "utf-8")) as StartupState;
}

export function extractFailureContext(
  rootDir: string,
  planSlug: string,
  failureType: FailureType,
  taskId?: string,
): { contextDetail: string; artifactRefs: string[] } {
  const planPath = path.join("docs", "plans", planSlug, "plan.md");
  const planAbsPath = path.join(rootDir, planPath);
  const artifactRefs: string[] = [planPath];

  if (!existsSync(planAbsPath)) {
    return { contextDetail: "plan file not found", artifactRefs };
  }

  const planContent = readFileSync(planAbsPath, "utf-8");
  let contextDetail = "";

  if (failureType === "infeasible_declaration") {
    const infeasibleMatch = planContent.match(/Status:\s*Infeasible/i);
    contextDetail = infeasibleMatch
      ? "Plan or task declared infeasible"
      : "Infeasible declaration (status not confirmed in plan)";
  } else if (failureType === "replan_exhaustion") {
    const replanPath = path.join(
      "docs",
      "plans",
      planSlug,
      "replan-notes.md",
    );
    const replanAbsPath = path.join(rootDir, replanPath);
    if (existsSync(replanAbsPath)) {
      const replanContent = readFileSync(replanAbsPath, "utf-8");
      const roundMatches = replanContent.match(/Replan-round:\s*(\d+)/gi);
      const maxRound = roundMatches
        ? Math.max(
            ...roundMatches.map((m) =>
              parseInt(m.replace(/\D/g, ""), 10),
            ),
          )
        : 0;
      contextDetail = `Replan exhaustion after ${maxRound} round(s)`;
      artifactRefs.push(replanPath);
    } else {
      contextDetail = "Replan exhaustion (replan-notes not found)";
    }
  } else if (failureType === "confidence_regression") {
    contextDetail = taskId
      ? `Confidence regression on ${taskId}`
      : "Confidence regression during build";
  } else if (failureType === "gate_block") {
    contextDetail = taskId
      ? `Gate block on ${taskId}`
      : "Gate block during build";
  }

  return { contextDetail, artifactRefs };
}

export function buildFailureObservation(
  options: FailureBridgeOptions,
  config: FailureTypeConfig,
  contextDetail: string,
  artifactRefs: string[],
): MetaObservation {
  const taskSuffix = options.taskId ? `/${options.taskId}` : "";
  const contextPath = `lp-do-build/${options.planSlug}/${options.failureType}${taskSuffix}`;

  const hardSignature = buildHardSignature({
    fingerprint_version: "1",
    source_component: "lp-do-build",
    step_id: config.step_id,
    normalized_path: `lp-do-build/${options.planSlug}`,
    error_or_reason_code: options.failureType,
    effect_class: "read_only",
  });

  const timestamp = new Date().toISOString();

  return {
    schema_version: "meta-observation.v1",
    observation_id: stableHash(
      `${options.planSlug}|${timestamp}|${options.failureType}|${Date.now()}`,
    ).slice(0, 16),
    observation_type: config.observation_type,
    timestamp,
    business: options.business,
    actor_type: "automation",
    run_id: options.runId,
    session_id: options.sessionId,
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: artifactRefs,
    context_path: contextPath,
    hard_signature: hardSignature,
    soft_cluster_id: stableHash(
      `${options.business}|${contextPath}|${config.observation_type}`,
    ).slice(0, 16),
    fingerprint_version: "1",
    repeat_count_window: 1,
    operator_minutes_estimate: 15,
    quality_impact_estimate: config.severity * 0.8,
    detector_confidence: config.detector_confidence,
    severity: config.severity,
    inputs_hash: stableHash(
      `${options.planSlug}|${options.failureType}|${options.taskId ?? ""}`,
    ),
    outputs_hash: stableHash(`${options.failureType}|${timestamp}`),
    toolchain_version: "lp-do-build.failure-bridge.v1",
    model_version: null,
    kpi_name: null,
    kpi_value: null,
    kpi_unit: null,
    aggregation_method: null,
    sample_size: null,
    data_quality_status: null,
    data_quality_reason_code: null,
    baseline_ref: null,
    measurement_window: null,
    traffic_segment: null,
    evidence_refs: [`context: ${contextDetail}`, ...artifactRefs],
  };
}

// --- Main bridge function ---

export function runSelfEvolvingFromBuildFailure(
  options: FailureBridgeOptions,
): FailureBridgeResult {
  const warnings: string[] = [];

  if (!VALID_FAILURE_TYPES.has(options.failureType)) {
    return {
      ok: false,
      observations_generated: 0,
      failure_type: options.failureType,
      warnings,
      error: `Unknown failure type: ${options.failureType}`,
    };
  }

  const config = FAILURE_TYPE_CONFIG[options.failureType];

  const startupState = loadStartupState(options.rootDir, options.business);
  if (!startupState) {
    return {
      ok: false,
      observations_generated: 0,
      failure_type: options.failureType,
      warnings,
      error: `startup-state.json not found for business ${options.business}`,
    };
  }

  const { contextDetail, artifactRefs } = extractFailureContext(
    options.rootDir,
    options.planSlug,
    options.failureType,
    options.taskId,
  );

  if (!contextDetail) {
    warnings.push(
      "No failure context could be extracted from plan artifacts",
    );
  }

  const observation = buildFailureObservation(
    options,
    config,
    contextDetail,
    artifactRefs,
  );

  const orchestrator = runSelfEvolvingOrchestrator({
    rootDir: options.rootDir,
    business: options.business,
    run_id: options.runId,
    session_id: options.sessionId,
    startup_state: startupState,
    observations: [observation],
    now: new Date(),
  });

  return {
    ok: true,
    observations_generated: 1,
    failure_type: options.failureType,
    warnings,
    orchestrator: {
      observations_count: orchestrator.observations_count,
      repeat_candidates_detected: orchestrator.repeat_candidates_detected,
      candidates_generated: orchestrator.candidates_generated,
      candidate_path: orchestrator.candidate_path,
    },
  };
}

// --- CLI ---

function parseArgs(argv: string[]): FailureBridgeOptions {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(token.slice(2), value);
    i += 1;
  }

  const planSlug = flags.get("plan-slug") ?? "unknown-plan";
  const runId =
    flags.get("run-id") ?? `run-${new Date().toISOString().slice(0, 10)}`;
  const failureType = (flags.get("failure-type") ?? "gate_block") as FailureType;

  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

  return {
    rootDir: flags.get("root-dir") ?? defaultRootDir,
    business: flags.get("business") ?? "BRIK",
    planSlug,
    failureType,
    taskId: flags.get("task-id"),
    runId,
    sessionId: flags.get("session-id") ?? `${runId}-session`,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const result = runSelfEvolvingFromBuildFailure(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-from-build-failure")) {
  main();
}
