import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { MetaObservation, StartupState } from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { buildHardSignature } from "./self-evolving-detector.js";
import {
  runSelfEvolvingOrchestrator,
  type SelfEvolvingOrchestratorResult,
} from "./self-evolving-orchestrator.js";

interface BridgeOptions {
  rootDir: string;
  business: string;
  planSlug: string;
  buildRecordPath: string;
  resultsReviewPath: string;
  patternReflectionPath: string;
  runId: string;
  sessionId: string;
}

interface BridgeResult {
  ok: boolean;
  observations_generated: number;
  source_artifacts: string[];
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

function parseArgs(argv: string[]): BridgeOptions {
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
  const runId = flags.get("run-id") ?? `run-${new Date().toISOString().slice(0, 10)}`;

  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

  return {
    rootDir: flags.get("root-dir") ?? defaultRootDir,
    business: flags.get("business") ?? "BRIK",
    planSlug,
    buildRecordPath:
      flags.get("build-record") ?? path.join("docs", "plans", planSlug, "build-record.user.md"),
    resultsReviewPath:
      flags.get("results-review") ??
      path.join("docs", "plans", planSlug, "results-review.user.md"),
    patternReflectionPath:
      flags.get("pattern-reflection") ??
      path.join("docs", "plans", planSlug, "pattern-reflection.user.md"),
    runId,
    sessionId: flags.get("session-id") ?? `${runId}-session`,
  };
}

function resolvePath(rootDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(rootDir, inputPath);
}

function safeRead(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, "utf-8");
}

function extractBulletCandidates(markdown: string | null): string[] {
  if (!markdown) {
    return [];
  }
  const lines = markdown.split("\n");
  const candidates: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (/^##\s+New Idea Candidates\b/i.test(line.trim())) {
      inSection = true;
      continue;
    }
    if (inSection && /^##\s+/.test(line.trim())) {
      break;
    }
    if (!inSection) {
      continue;
    }
    const match = line.match(/^[-*]\s+(.*)$/);
    if (match && match[1].trim().length > 0 && !/^none$/i.test(match[1].trim())) {
      candidates.push(match[1].trim());
    }
  }

  return candidates;
}

function buildObservation(
  options: BridgeOptions,
  now: Date,
  index: number,
  label: string,
  refs: string[],
): MetaObservation {
  const contextPath = `lp-do-build/${options.planSlug}/${label}`;
  const hardSignature = buildHardSignature({
    fingerprint_version: "1",
    source_component: "lp-do-build",
    step_id: "build-output-bridge",
    normalized_path: contextPath,
    error_or_reason_code: "build_output_signal",
    effect_class: "read_only",
  });

  const timestamp = new Date(now.getTime() - index * 1000).toISOString();
  const inputsHash = stableHash(`${options.planSlug}|${label}|${refs.join("|")}`);

  return {
    schema_version: "meta-observation.v1",
    observation_id: stableHash(`${options.planSlug}|${timestamp}|${index}`).slice(0, 16),
    observation_type: "execution_event",
    timestamp,
    business: options.business,
    actor_type: "automation",
    run_id: options.runId,
    session_id: options.sessionId,
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: refs,
    context_path: contextPath,
    hard_signature: hardSignature,
    soft_cluster_id: stableHash(options.planSlug).slice(0, 16),
    fingerprint_version: "1",
    repeat_count_window: 1,
    operator_minutes_estimate: 8,
    quality_impact_estimate: 0.35,
    detector_confidence: 0.7,
    severity: 0.35,
    inputs_hash: inputsHash,
    outputs_hash: stableHash(`${label}|${timestamp}`),
    toolchain_version: "lp-do-build.bridge.v1",
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
    evidence_refs: refs,
  };
}

function loadStartupState(rootDir: string, business: string): StartupState | null {
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

export function runSelfEvolvingFromBuildOutput(options: BridgeOptions): BridgeResult {
  const warnings: string[] = [];
  const startupState = loadStartupState(options.rootDir, options.business);
  if (!startupState) {
    return {
      ok: false,
      observations_generated: 0,
      source_artifacts: [],
      warnings,
      error: `startup-state.json not found for business ${options.business}`,
    };
  }

  const resultsReviewAbs = resolvePath(options.rootDir, options.resultsReviewPath);
  const patternReflectionAbs = resolvePath(options.rootDir, options.patternReflectionPath);
  const buildRecordAbs = resolvePath(options.rootDir, options.buildRecordPath);

  const resultsReview = safeRead(resultsReviewAbs);
  const patternReflection = safeRead(patternReflectionAbs);
  const buildRecord = safeRead(buildRecordAbs);

  if (!resultsReview) warnings.push(`Missing results-review artifact: ${options.resultsReviewPath}`);
  if (!patternReflection)
    warnings.push(`Missing pattern-reflection artifact: ${options.patternReflectionPath}`);
  if (!buildRecord) warnings.push(`Missing build-record artifact: ${options.buildRecordPath}`);

  const candidateBullets = extractBulletCandidates(resultsReview);

  const observationSeeds: Array<{ label: string; refs: string[] }> = [];
  if (buildRecord) {
    observationSeeds.push({
      label: "build-record",
      refs: [options.buildRecordPath],
    });
  }
  if (patternReflection) {
    observationSeeds.push({
      label: "pattern-reflection",
      refs: [options.patternReflectionPath],
    });
  }
  for (const bullet of candidateBullets.slice(0, 3)) {
    observationSeeds.push({
      label: `idea:${bullet.slice(0, 80)}`,
      refs: [options.resultsReviewPath],
    });
  }

  if (observationSeeds.length === 0) {
    return {
      ok: true,
      observations_generated: 0,
      source_artifacts: [],
      warnings: [...warnings, "No build-output observation seeds found."],
    };
  }

  const now = new Date();
  const observations = observationSeeds.map((seed, index) =>
    buildObservation(options, now, index, seed.label, seed.refs),
  );

  const orchestrator = runSelfEvolvingOrchestrator({
    rootDir: options.rootDir,
    business: options.business,
    run_id: options.runId,
    session_id: options.sessionId,
    startup_state: startupState,
    observations,
    now,
  });

  return {
    ok: true,
    observations_generated: observations.length,
    source_artifacts: [
      ...(buildRecord ? [options.buildRecordPath] : []),
      ...(patternReflection ? [options.patternReflectionPath] : []),
      ...(resultsReview ? [options.resultsReviewPath] : []),
    ],
    warnings,
    orchestrator: {
      observations_count: orchestrator.observations_count,
      repeat_candidates_detected: orchestrator.repeat_candidates_detected,
      candidates_generated: orchestrator.candidates_generated,
      candidate_path: orchestrator.candidate_path,
    },
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const result = runSelfEvolvingFromBuildOutput(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-from-build-output")) {
  main();
}
