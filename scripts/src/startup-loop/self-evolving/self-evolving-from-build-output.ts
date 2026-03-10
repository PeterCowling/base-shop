import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import yaml from "js-yaml";

import { isNonePlaceholderIdeaCandidate } from "../build/lp-do-build-results-review-parse.js";

import {
  consumeBackboneQueueToIdeasWorkflow,
} from "./self-evolving-backbone-consume.js";
import {
  enqueueBackboneCandidates,
} from "./self-evolving-backbone-queue.js";
import type {
  CandidateType,
  ExecutorDomainHint,
  MetaObservation,
  StartupState,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { buildHardSignature } from "./self-evolving-detector.js";
import {
  runSelfEvolvingOrchestrator,
  type SelfEvolvingOrchestratorResult,
} from "./self-evolving-orchestrator.js";
import {
  buildObservationSignalHints,
  isNonePlaceholderMetaObservation,
} from "./self-evolving-signal-helpers.js";

interface BridgeOptions {
  rootDir: string;
  business: string;
  planSlug: string;
  buildRecordPath: string;
  resultsReviewPath: string;
  patternReflectionPath: string;
  followupQueueStatePath: string;
  followupTelemetryPath: string;
  runId: string;
  sessionId: string;
}

interface BridgeResult {
  ok: boolean;
  observations_generated: number;
  backbone_queue_path?: string;
  backbone_queued?: number;
  followup_closure_state?: "closed" | "stale-repairable" | "hard-failed";
  followup_dispatches_emitted?: number;
  followup_pending_entries?: number;
  followup_consumed_entries?: number;
  followup_closed_candidate_ids?: string[];
  followup_stale_repairable_candidate_ids?: string[];
  followup_hard_failed_candidate_ids?: string[];
  followup_unresolved_candidate_ids?: string[];
  followup_queue_entries_written?: number;
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
    followupQueueStatePath:
      flags.get("followup-queue-state") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    followupTelemetryPath:
      flags.get("followup-telemetry") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl"),
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

export function extractBulletCandidates(markdown: string | null): string[] {
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
    if (
      match &&
      match[1].trim().length > 0 &&
      !isNonePlaceholderIdeaCandidate(match[1].trim())
    ) {
      candidates.push(match[1].trim());
    }
  }

  return candidates;
}

interface PatternReflectionFrontmatterEntry {
  pattern_summary?: string;
  category?: string;
  routing_target?: string;
  occurrence_count?: number;
  evidence_refs?: string[];
  idea_key?: string;
  classifier_input?: {
    title?: string;
    area_anchor?: string;
    evidence_refs?: string[];
  };
}

interface ObservationSeed {
  label: string;
  refs: string[];
  recurrenceKeyParts?: string[];
  texts?: string[];
  problemStatement?: string | null;
  candidateTypeHint?: CandidateType | null;
  executorDomainHint?: ExecutorDomainHint | null;
}

function parseFrontmatter(markdown: string): Record<string, unknown> | null {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match?.[1]) {
    return null;
  }

  const parsed = yaml.load(match[1]);
  if (parsed == null || typeof parsed !== "object") {
    return null;
  }
  return parsed as Record<string, unknown>;
}

function mapPatternRoutingToCandidateType(
  routingTarget: string | undefined,
): CandidateType | null {
  if (routingTarget === "skill_proposal") {
    return "new_skill";
  }
  if (routingTarget === "loop_update") {
    return "skill_refactor";
  }
  return null;
}

function extractPatternSectionFallback(markdown: string): ObservationSeed[] {
  const lines = markdown.split("\n");
  const seeds: ObservationSeed[] = [];
  let inPatterns = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+Patterns\b/i.test(trimmed)) {
      inPatterns = true;
      continue;
    }
    if (inPatterns && /^##\s+/.test(trimmed)) {
      break;
    }
    if (!inPatterns || trimmed.length === 0 || /^None identified\.?$/i.test(trimmed)) {
      continue;
    }

    const listMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (!listMatch?.[1]) {
      continue;
    }

    const summary = listMatch[1]
      .replace(/\*\*/g, "")
      .split("|")[0]
      ?.replace(/^Pattern:\s*/i, "")
      .trim();
    if (!summary) {
      continue;
    }

    seeds.push({
      label: `pattern:${summary.slice(0, 80)}`,
      refs: [],
      recurrenceKeyParts: [summary],
      texts: [summary, listMatch[1]],
      problemStatement: `${summary} Observed in build reflection output.`,
    });
  }

  return seeds;
}

export function extractPatternReflectionSeeds(markdown: string | null): ObservationSeed[] {
  if (!markdown) {
    return [];
  }

  const frontmatter = parseFrontmatter(markdown);
  const entries = Array.isArray(frontmatter?.entries)
    ? (frontmatter?.entries as PatternReflectionFrontmatterEntry[])
    : [];

  if (entries.length === 0) {
    return extractPatternSectionFallback(markdown);
  }

  return entries
    .map((entry): ObservationSeed | null => {
      const summary = entry.pattern_summary?.trim();
      if (!summary) {
        return null;
      }
      const supportingTexts = [
        summary,
        entry.classifier_input?.title ?? "",
        entry.classifier_input?.area_anchor ?? "",
        entry.category ?? "",
        entry.routing_target ?? "",
      ].filter((value) => value.trim().length > 0);
      const occurrenceCount =
        typeof entry.occurrence_count === "number" ? entry.occurrence_count : null;

      const seed: ObservationSeed = {
        label: `pattern:${summary.slice(0, 80)}`,
        refs: uniqueRefs([
          ...(entry.evidence_refs ?? []),
          ...(entry.classifier_input?.evidence_refs ?? []),
        ]),
        recurrenceKeyParts: [summary],
        texts: supportingTexts,
        problemStatement:
          occurrenceCount != null
            ? `${summary} Observed ${occurrenceCount} times in pattern reflection output.`
            : `${summary} Observed in pattern reflection output.`,
        candidateTypeHint: mapPatternRoutingToCandidateType(entry.routing_target),
      };
      return seed;
    })
    .filter((seed): seed is ObservationSeed => seed != null);
}

function uniqueRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function buildObservation(
  options: BridgeOptions,
  seed: ObservationSeed,
): MetaObservation {
  const contextPath = `lp-do-build/${options.planSlug}/${seed.label}`;
  const ideaLabel = seed.label.startsWith("idea:") ? seed.label.slice("idea:".length).trim() : null;
  const observationTexts = seed.texts ?? (ideaLabel ? [ideaLabel] : [seed.label]);
  const signalHints =
    ideaLabel || seed.problemStatement || observationTexts.length > 0
    ? buildObservationSignalHints({
        recurrenceKeyParts:
          seed.recurrenceKeyParts ?? (ideaLabel ? [ideaLabel] : observationTexts),
        problemStatement:
          seed.problemStatement ??
          (ideaLabel ? `Reduce recurring build-output idea work for ${ideaLabel}.` : null),
        texts: observationTexts,
        candidateTypeHint: seed.candidateTypeHint ?? null,
        executorDomainHint: seed.executorDomainHint ?? null,
      })
    : null;
  const hardSignature = buildHardSignature({
    fingerprint_version: signalHints?.recurrence_key ? "2" : "1",
    source_component: "lp-do-build",
    step_id: ideaLabel || seed.label.startsWith("pattern:") ? "build-output-idea" : "build-output-bridge",
    normalized_path: signalHints?.recurrence_key ?? contextPath,
    error_or_reason_code:
      ideaLabel || seed.label.startsWith("pattern:")
        ? "build_output_idea"
        : "build_output_signal",
    effect_class: "read_only",
  });
  const timestamp = new Date().toISOString();
  const inputsHash = stableHash(`${options.planSlug}|${seed.label}|${seed.refs.join("|")}`);
  const observationId = stableHash(
    `${options.planSlug}|${seed.label}|${seed.refs.join("|")}|${signalHints?.recurrence_key ?? ""}`,
  ).slice(0, 16);

  return {
    schema_version: "meta-observation.v2",
    observation_id: observationId,
    observation_type: "execution_event",
    timestamp,
    business: options.business,
    actor_type: "automation",
    run_id: options.runId,
    session_id: options.sessionId,
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: seed.refs,
    context_path: contextPath,
    hard_signature: hardSignature,
    soft_cluster_id: stableHash(signalHints?.recurrence_key ?? options.planSlug).slice(0, 16),
    fingerprint_version: signalHints?.recurrence_key ? "2" : "1",
    repeat_count_window: 1,
    operator_minutes_estimate: 8,
    quality_impact_estimate: 0.35,
    detector_confidence: 0.7,
    severity: 0.35,
    inputs_hash: inputsHash,
    outputs_hash: stableHash(`${seed.label}|${timestamp}`),
    toolchain_version: "lp-do-build.bridge.v2",
    model_version: null,
    kpi_name: null,
    kpi_value: null,
    kpi_unit: null,
    aggregation_method: null,
    sample_size: null,
    data_quality_status: null,
    data_quality_reason_code: null,
    baseline_ref: null,
    measurement_window: "next_build_cycle",
    traffic_segment: null,
    evidence_refs: seed.refs,
    evidence_grade: "structural",
    measurement_contract_status: "declared",
    signal_hints: signalHints,
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

  const buildRecordAbs = resolvePath(options.rootDir, options.buildRecordPath);

  const buildRecord = safeRead(buildRecordAbs);

  if (!buildRecord) warnings.push(`Missing build-record artifact: ${options.buildRecordPath}`);

  const observationSeeds: ObservationSeed[] = [];
  if (buildRecord) {
    observationSeeds.push({
      label: "build-record",
      refs: [options.buildRecordPath],
      texts: [options.planSlug, buildRecord],
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

  const observations = observationSeeds
    .map((seed) => buildObservation(options, seed))
    .filter((observation) => !isNonePlaceholderMetaObservation(observation));

  const orchestrator = runSelfEvolvingOrchestrator({
    rootDir: options.rootDir,
    business: options.business,
    run_id: options.runId,
    session_id: options.sessionId,
    startup_state: startupState,
    observations,
    now: new Date(),
  });
  const queueWrite = enqueueBackboneCandidates(
    options.rootDir,
    options.business,
    orchestrator.ranked_candidates,
  );
  const followupConsume = consumeBackboneQueueToIdeasWorkflow({
    rootDir: options.rootDir,
    business: options.business,
    queueStatePath: resolvePath(options.rootDir, options.followupQueueStatePath),
    telemetryPath: resolvePath(options.rootDir, options.followupTelemetryPath),
  });
  if (followupConsume.error) {
    warnings.push(followupConsume.error);
  }
  warnings.push(...followupConsume.warnings);

  return {
    ok: true,
    observations_generated: observations.length,
    backbone_queue_path: queueWrite.path,
    backbone_queued: queueWrite.queued,
    followup_closure_state: followupConsume.closure_state,
    followup_dispatches_emitted: followupConsume.emitted_dispatches,
    followup_pending_entries: followupConsume.pending_entries,
    followup_consumed_entries: followupConsume.consumed_entries_marked,
    followup_closed_candidate_ids: followupConsume.closed_candidate_ids,
    followup_stale_repairable_candidate_ids: followupConsume.stale_repairable_candidate_ids,
    followup_hard_failed_candidate_ids: followupConsume.hard_failed_candidate_ids,
    followup_unresolved_candidate_ids: followupConsume.unresolved_candidate_ids,
    followup_queue_entries_written: followupConsume.queue_entries_written,
    source_artifacts: [...(buildRecord ? [options.buildRecordPath] : [])],
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
