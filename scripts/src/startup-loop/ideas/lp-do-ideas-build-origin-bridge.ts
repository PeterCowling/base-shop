import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  type BuildOriginStatus,
  detectRepoRoot,
  toRepoRelativePath,
} from "../build/build-origin-signal.js";
import type {
  PatternReflectionSidecar,
} from "../build/lp-do-build-pattern-reflection-extract.js";
import type {
  ResultsReviewSidecar,
  ResultsReviewSignalItem,
} from "../build/lp-do-build-results-review-extract.js";
import { MISSING_VALUE } from "../build/lp-do-build-results-review-parse.js";

import {
  classifyIdea,
  type IdeaClassification,
  type IdeaClassificationInput,
} from "./lp-do-ideas-classifier.js";
import { computeClusterFingerprint } from "./lp-do-ideas-fingerprint.js";
import { enqueueQueueDispatches } from "./lp-do-ideas-queue-admission.js";
import { routeDispatchV2 } from "./lp-do-ideas-routing-adapter.js";
import {
  buildDispatchId,
  type DispatchBuildOriginProvenance,
  type RecommendedRoute,
  statusForRecommendedRoute,
  type TrialDispatchPacketV2,
  validateDispatchV2,
} from "./lp-do-ideas-trial.js";

type PrimarySource = "pattern-reflection.entries.json" | "results-review.signals.json";
type MergeState = "single_source" | "merged_cross_sidecar";
type ReflectionRoutingTarget = "loop_update" | "skill_proposal" | "defer";

interface BuildOriginSignal {
  build_signal_id: string;
  recurrence_key: string;
  review_cycle_key: string;
  plan_slug: string;
  business: string;
  canonical_title: string;
  display_title: string;
  build_origin_status: BuildOriginStatus;
  merge_state: MergeState;
  primary_source: PrimarySource;
  source_presence: {
    results_review_signal: boolean;
    pattern_reflection_entry: boolean;
  };
  narrative_body: string | null;
  suggested_action: string | null;
  results_review_fields: {
    priority_tier?: string;
    urgency?: string;
    effort?: string;
    reason_code?: string;
  } | null;
  reflection_fields: {
    category: string | null;
    routing_target: ReflectionRoutingTarget | null;
    occurrence_count: number | null;
    evidence_refs: string[];
  } | null;
  provenance: {
    results_review_path: string | null;
    results_review_sidecar_path: string | null;
    pattern_reflection_path: string | null;
    pattern_reflection_sidecar_path: string | null;
    evidence_refs: string[];
  };
  created_at: string;
}

export interface BuildOriginSignalsBridgeOptions {
  rootDir?: string;
  planDir: string;
  business?: string;
  queueStatePath?: string;
  telemetryPath?: string;
  clock?: () => Date;
}

export interface BuildOriginSignalsBridgeResult {
  ok: boolean;
  signals_considered: number;
  signals_admitted: number;
  dispatches_enqueued: number;
  suppressed: number;
  noop: number;
  warnings: string[];
  error?: string;
}

export interface BuildOriginDispatchValidationResult {
  ok: boolean;
  code?: string;
  error?: string;
}

const DEFAULT_QUEUE_STATE_PATH = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
const DEFAULT_TELEMETRY_PATH = "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl";

function resolvePath(rootDir: string, relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(rootDir, relativeOrAbsolutePath);
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function normalizeKeyToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "build-origin";
}

function repoPathList(paths: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      paths
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  );
}

function buildLocationAnchors(signal: BuildOriginSignal): [string, ...string[]] {
  const anchors = repoPathList([
    signal.provenance.results_review_path,
    signal.provenance.results_review_sidecar_path,
    signal.provenance.pattern_reflection_path,
    signal.provenance.pattern_reflection_sidecar_path,
    ...signal.provenance.evidence_refs,
  ]);

  if (anchors.length === 0) {
    return [`docs/plans/${signal.plan_slug}`];
  }

  return anchors.slice(0, 8) as [string, ...string[]];
}

function buildEvidenceRefs(signal: BuildOriginSignal): [string, ...string[]] {
  const refs = repoPathList([
    signal.provenance.results_review_path,
    signal.provenance.results_review_sidecar_path,
    signal.provenance.pattern_reflection_path,
    signal.provenance.pattern_reflection_sidecar_path,
    ...signal.provenance.evidence_refs,
  ]);
  return (refs.length > 0 ? refs : [`docs/plans/${signal.plan_slug}`]) as [string, ...string[]];
}

function buildClassificationInput(signal: BuildOriginSignal): IdeaClassificationInput {
  const contentTags = [
    "build-origin",
    signal.reflection_fields?.category ?? null,
    signal.reflection_fields?.routing_target ?? null,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return {
    idea_id: signal.build_signal_id,
    title: signal.canonical_title,
    source_path:
      signal.provenance.results_review_path ??
      signal.provenance.pattern_reflection_path ??
      `docs/plans/${signal.plan_slug}`,
    source_excerpt: signal.narrative_body ?? signal.display_title,
    created_at: signal.created_at,
    trigger: "operator_idea",
    artifact_id: null,
    evidence_refs: buildEvidenceRefs(signal),
    area_anchor: signal.canonical_title,
    content_tags: contentTags,
  };
}

function dispatchPriorityFromClassification(classification: IdeaClassification): "P1" | "P2" | "P3" {
  if (
    classification.priority_tier === "P0" ||
    classification.priority_tier === "P0R" ||
    classification.priority_tier === "P1" ||
    classification.priority_tier === "P1M"
  ) {
    return "P1";
  }
  if (classification.priority_tier === "P2" || classification.priority_tier === "P3") {
    return "P2";
  }
  return "P3";
}

function dispatchConfidenceFromClassification(
  signal: BuildOriginSignal,
  classification: IdeaClassification,
): number {
  let base =
    classification.priority_tier === "P0" ||
    classification.priority_tier === "P0R" ||
    classification.priority_tier === "P1" ||
    classification.priority_tier === "P1M"
      ? 0.85
      : classification.priority_tier === "P2"
        ? 0.75
        : classification.priority_tier === "P3"
          ? 0.65
          : 0.55;

  if (signal.merge_state === "merged_cross_sidecar") {
    base += 0.05;
  }
  if (signal.primary_source === "pattern-reflection.entries.json") {
    base += 0.02;
  }
  return Math.max(0.4, Math.min(0.95, base));
}

function thresholdForRoutingTarget(target: ReflectionRoutingTarget | null): number {
  return target === "loop_update" ? 3 : target === "skill_proposal" ? 2 : Number.POSITIVE_INFINITY;
}

function isPlanReadySignal(signal: BuildOriginSignal, classification: IdeaClassification): boolean {
  const reflection = signal.reflection_fields;
  if (!reflection) {
    return false;
  }
  if (reflection.routing_target !== "loop_update" && reflection.routing_target !== "skill_proposal") {
    return false;
  }
  if ((reflection.occurrence_count ?? 0) < thresholdForRoutingTarget(reflection.routing_target)) {
    return false;
  }
  return classification.priority_tier !== "P5";
}

function buildAutoWhy(signal: BuildOriginSignal): string {
  if (signal.narrative_body) {
    return `Build review surfaced "${signal.canonical_title}" with supporting narrative: ${signal.narrative_body}`;
  }
  return `Build review surfaced recurring follow-up work: ${signal.canonical_title}`;
}

function buildAutoNextScope(
  signal: BuildOriginSignal,
  route: RecommendedRoute,
): string {
  if (signal.suggested_action) {
    return signal.suggested_action;
  }
  if (route === "lp-do-plan") {
    return `Produce a guarded implementation plan for ${signal.canonical_title}.`;
  }
  return `Fact-find the build-origin improvement candidate "${signal.canonical_title}" and validate the next action.`;
}

function buildCurrentTruth(signal: BuildOriginSignal): string {
  if (signal.narrative_body && signal.narrative_body !== MISSING_VALUE) {
    return signal.narrative_body;
  }
  return signal.canonical_title;
}

function buildBuildOriginProvenance(signal: BuildOriginSignal): DispatchBuildOriginProvenance {
  return {
    schema_version: "dispatch-build-origin.v1",
    build_signal_id: signal.build_signal_id,
    recurrence_key: signal.recurrence_key,
    review_cycle_key: signal.review_cycle_key,
    plan_slug: signal.plan_slug,
    canonical_title: signal.canonical_title,
    primary_source: signal.primary_source,
    merge_state: signal.merge_state,
    source_presence: signal.source_presence,
    results_review_path: signal.provenance.results_review_path,
    results_review_sidecar_path: signal.provenance.results_review_sidecar_path,
    pattern_reflection_path: signal.provenance.pattern_reflection_path,
    pattern_reflection_sidecar_path: signal.provenance.pattern_reflection_sidecar_path,
    reflection_fields: signal.reflection_fields
      ? {
          category: signal.reflection_fields.category,
          routing_target: signal.reflection_fields.routing_target,
          occurrence_count: signal.reflection_fields.occurrence_count,
        }
      : undefined,
  };
}

function validateBuildOriginDispatchPacket(
  packet: TrialDispatchPacketV2,
): BuildOriginDispatchValidationResult {
  const validation = validateDispatchV2(
    packet as Partial<TrialDispatchPacketV2> & Record<string, unknown>,
  );
  if (!validation.valid) {
    return {
      ok: false,
      code: "INVALID_DISPATCH_V2",
      error: validation.errors.join(" | "),
    };
  }

  const routeResult = routeDispatchV2(packet);
  if (!routeResult.ok) {
    return {
      ok: false,
      code: routeResult.code,
      error: routeResult.error,
    };
  }

  return { ok: true };
}

export { validateBuildOriginDispatchPacket };

function signalToDispatchPacket(
  signal: BuildOriginSignal,
  classification: IdeaClassification,
  now: Date,
  sequence: number,
): TrialDispatchPacketV2 {
  const recommendedRoute: RecommendedRoute = isPlanReadySignal(signal, classification)
    ? "lp-do-plan"
    : "lp-do-fact-find";
  const status = statusForRecommendedRoute(recommendedRoute);
  const locationAnchors = buildLocationAnchors(signal);
  const evidenceRefs = buildEvidenceRefs(signal);
  const rootEventId = `build-origin:${signal.review_cycle_key}:${signal.build_signal_id}`;
  const anchorKey = normalizeKeyToken(signal.canonical_title).slice(0, 80);
  const clusterKey = `build-origin:${normalizeKeyToken(signal.business)}:${signal.review_cycle_key}:${anchorKey}`;
  const clusterFingerprint = computeClusterFingerprint({
    root_event_id: rootEventId,
    anchor_key: anchorKey,
    evidence_ref_ids: [signal.build_signal_id, ...evidenceRefs],
    normalized_semantic_diff_hash: signal.build_signal_id,
  });

  return {
    schema_version: "dispatch.v2",
    dispatch_id: buildDispatchId(now, sequence),
    mode: "trial",
    business: signal.business,
    trigger: "operator_idea",
    artifact_id: null,
    before_sha: null,
    after_sha: signal.build_signal_id,
    root_event_id: rootEventId,
    anchor_key: anchorKey,
    cluster_key: clusterKey,
    cluster_fingerprint: clusterFingerprint,
    lineage_depth: 0,
    area_anchor: signal.canonical_title,
    location_anchors: locationAnchors,
    provisional_deliverable_family: "multi",
    current_truth: buildCurrentTruth(signal),
    next_scope_now: buildAutoNextScope(signal, recommendedRoute),
    adjacent_later: [],
    recommended_route: recommendedRoute,
    status,
    priority: dispatchPriorityFromClassification(classification),
    confidence: dispatchConfidenceFromClassification(signal, classification),
    evidence_refs: evidenceRefs,
    created_at: now.toISOString(),
    queue_state: "enqueued",
    why: buildAutoWhy(signal),
    intended_outcome: {
      type: "operational",
      statement:
        recommendedRoute === "lp-do-plan"
          ? `Produce a guarded plan for ${signal.canonical_title} using the canonical queue path.`
          : `Produce a validated fact-find and next action for ${signal.canonical_title}.`,
      source: "auto",
    },
    build_origin: buildBuildOriginProvenance(signal),
  };
}

function sidecarWarning(
  sidecarName: string,
  status: BuildOriginStatus | null,
  failures: Array<{ code: string; message: string }> | null,
): string | null {
  if (!status || status === "ready") {
    return null;
  }
  const detail =
    failures && failures.length > 0
      ? failures.map((failure) => `${failure.code}:${failure.message}`).join("; ")
      : "no failure details";
  return `${sidecarName} status=${status} (${detail})`;
}

function readResultsReviewSidecar(
  rootDir: string,
  planDir: string,
): { sidecar: ResultsReviewSidecar | null; warnings: string[]; sidecarPath: string } {
  const sidecarPath = path.join(planDir, "results-review.signals.json");
  const relativeSidecarPath = toRepoRelativePath(rootDir, sidecarPath);
  const sidecar = readJsonFile<ResultsReviewSidecar>(sidecarPath);
  if (!sidecar) {
    return {
      sidecar: null,
      warnings: [`Missing results-review sidecar: ${relativeSidecarPath}`],
      sidecarPath: relativeSidecarPath,
    };
  }
  const warning = sidecarWarning(
    "results-review sidecar",
    sidecar.build_origin_status ?? null,
    sidecar.failures ?? null,
  );
  return {
    sidecar,
    warnings: warning ? [warning] : [],
    sidecarPath: relativeSidecarPath,
  };
}

function readPatternReflectionSidecar(
  rootDir: string,
  planDir: string,
): { sidecar: PatternReflectionSidecar | null; warnings: string[]; sidecarPath: string } {
  const sidecarPath = path.join(planDir, "pattern-reflection.entries.json");
  const relativeSidecarPath = toRepoRelativePath(rootDir, sidecarPath);
  const sidecar = readJsonFile<PatternReflectionSidecar>(sidecarPath);
  if (!sidecar) {
    return {
      sidecar: null,
      warnings: [`Missing pattern-reflection sidecar: ${relativeSidecarPath}`],
      sidecarPath: relativeSidecarPath,
    };
  }
  const warning = sidecarWarning(
    "pattern-reflection sidecar",
    sidecar.build_origin_status ?? null,
    sidecar.failures ?? null,
  );
  return {
    sidecar,
    warnings: warning ? [warning] : [],
    sidecarPath: relativeSidecarPath,
  };
}

function mergeBuildOriginSignals(
  rootDir: string,
  planDir: string,
  businessOverride?: string,
): { signals: BuildOriginSignal[]; warnings: string[] } {
  const warnings: string[] = [];
  const planSlug = path.basename(planDir);
  const resultsData = readResultsReviewSidecar(rootDir, planDir);
  const reflectionData = readPatternReflectionSidecar(rootDir, planDir);
  warnings.push(...resultsData.warnings, ...reflectionData.warnings);

  const reviewItems = new Map<string, ResultsReviewSignalItem>();
  if (resultsData.sidecar?.build_origin_status === "ready") {
    for (const item of resultsData.sidecar.items) {
      reviewItems.set(item.build_signal_id, item);
    }
  }

  const reflectionEntries = new Map<
    string,
    PatternReflectionSidecar["entries"][number]
  >();
  if (reflectionData.sidecar?.build_origin_status === "ready") {
    for (const entry of reflectionData.sidecar.entries) {
      reflectionEntries.set(entry.build_signal_id, entry);
    }
  }

  const allSignalIds = new Set<string>([
    ...reviewItems.keys(),
    ...reflectionEntries.keys(),
  ]);

  const signals: BuildOriginSignal[] = [];
  for (const buildSignalId of [...allSignalIds].sort()) {
    const reviewItem = reviewItems.get(buildSignalId);
    const reflectionEntry = reflectionEntries.get(buildSignalId);
    if (!reviewItem && !reflectionEntry) {
      continue;
    }

    const primarySource: PrimarySource = reflectionEntry
      ? "pattern-reflection.entries.json"
      : "results-review.signals.json";
    const canonicalTitle = reflectionEntry?.canonical_title ?? reviewItem?.canonical_title;
    const recurrenceKey = reflectionEntry?.recurrence_key ?? reviewItem?.recurrence_key;
    const reviewCycleKey = reflectionEntry?.review_cycle_key ?? reviewItem?.review_cycle_key;
    if (!canonicalTitle || !recurrenceKey || !reviewCycleKey) {
      warnings.push(`Skipping build-origin signal ${buildSignalId}: missing canonical identity fields.`);
      continue;
    }

    const business =
      businessOverride ??
      reviewItem?.business ??
      "BOS";
    const evidenceRefs = repoPathList([
      ...(reflectionEntry?.evidence_refs ?? []),
    ]);
    const displayTitle = reflectionEntry?.pattern_summary ?? reviewItem?.title ?? canonicalTitle;
    const narrativeBody =
      reviewItem?.body && reviewItem.body !== MISSING_VALUE ? reviewItem.body : null;
    const suggestedAction =
      reviewItem?.suggested_action && reviewItem.suggested_action.trim().length > 0
        ? reviewItem.suggested_action
        : null;

    signals.push({
      build_signal_id: buildSignalId,
      recurrence_key: recurrenceKey,
      review_cycle_key: reviewCycleKey,
      plan_slug: planSlug,
      business,
      canonical_title: canonicalTitle,
      display_title: displayTitle,
      build_origin_status: "ready",
      merge_state: reviewItem && reflectionEntry ? "merged_cross_sidecar" : "single_source",
      primary_source: primarySource,
      source_presence: {
        results_review_signal: Boolean(reviewItem),
        pattern_reflection_entry: Boolean(reflectionEntry),
      },
      narrative_body: narrativeBody,
      suggested_action: suggestedAction,
      results_review_fields: reviewItem
        ? {
            priority_tier: reviewItem.priority_tier,
            urgency: reviewItem.urgency,
            effort: reviewItem.effort,
            reason_code: reviewItem.reason_code,
          }
        : null,
      reflection_fields: reflectionEntry
        ? {
            category: reflectionEntry.category,
            routing_target: reflectionEntry.routing_target,
            occurrence_count: reflectionEntry.occurrence_count,
            evidence_refs: evidenceRefs,
          }
        : null,
      provenance: {
        results_review_path: resultsData.sidecar?.source_path ?? null,
        results_review_sidecar_path: reviewItem ? resultsData.sidecarPath : null,
        pattern_reflection_path: reflectionData.sidecar?.source_path ?? null,
        pattern_reflection_sidecar_path: reflectionEntry ? reflectionData.sidecarPath : null,
        evidence_refs: evidenceRefs,
      },
      created_at:
        resultsData.sidecar?.generated_at ??
        reflectionData.sidecar?.generated_at ??
        new Date().toISOString(),
    });
  }

  return { signals, warnings };
}

export function runBuildOriginSignalsBridge(
  options: BuildOriginSignalsBridgeOptions,
): BuildOriginSignalsBridgeResult {
  const rootDir =
    options.rootDir ??
    detectRepoRoot(process.cwd());
  const planDir = resolvePath(rootDir, options.planDir);
  const queueStatePath = resolvePath(rootDir, options.queueStatePath ?? DEFAULT_QUEUE_STATE_PATH);
  const telemetryPath = resolvePath(rootDir, options.telemetryPath ?? DEFAULT_TELEMETRY_PATH);
  const clock = options.clock ?? (() => new Date());
  const now = clock();

  const merged = mergeBuildOriginSignals(rootDir, planDir, options.business);
  if (merged.signals.length === 0) {
    return {
      ok: true,
      signals_considered: 0,
      signals_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings:
        merged.warnings.length > 0
          ? merged.warnings
          : [`No build-origin signals ready for queue admission in ${options.planDir}.`],
    };
  }

  const packets: TrialDispatchPacketV2[] = [];
  const warnings = [...merged.warnings];
  let admitted = 0;

  for (const [index, signal] of merged.signals.entries()) {
    const classification = classifyIdea(buildClassificationInput(signal), { now });
    const packet = signalToDispatchPacket(signal, classification, now, index + 1);
    const validation = validateBuildOriginDispatchPacket(packet);
    if (!validation.ok) {
      warnings.push(
        `Rejected build-origin signal ${signal.build_signal_id}: ${validation.code ?? "UNKNOWN"} ${validation.error ?? ""}`.trim(),
      );
      continue;
    }
    packets.push(packet);
    admitted += 1;
  }

  if (packets.length === 0) {
    return {
      ok: true,
      signals_considered: merged.signals.length,
      signals_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: merged.signals.length,
      warnings,
    };
  }

  try {
    const enqueueResult = enqueueQueueDispatches({
      queueStatePath,
      telemetryPath,
      telemetryReason: "build_origin_signal_bridge",
      packets,
      clock,
    });
    return {
      ok: true,
      signals_considered: merged.signals.length,
      signals_admitted: admitted,
      dispatches_enqueued: enqueueResult.appended,
      suppressed: enqueueResult.suppressed,
      noop: merged.signals.length - admitted,
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      signals_considered: merged.signals.length,
      signals_admitted: admitted,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseArgs(argv: string[]): BuildOriginSignalsBridgeOptions {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (!token?.startsWith("--") || !value || value.startsWith("--")) {
      continue;
    }
    flags.set(token.slice(2), value);
    index += 1;
  }

  return {
    rootDir: flags.get("root-dir"),
    planDir: flags.get("plan-dir") ?? "",
    business: flags.get("business"),
    queueStatePath: flags.get("queue-state-path") ?? DEFAULT_QUEUE_STATE_PATH,
    telemetryPath: flags.get("telemetry-path") ?? DEFAULT_TELEMETRY_PATH,
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  if (!options.planDir) {
    process.stderr.write("[build-origin-bridge] error: --plan-dir is required\n");
    process.exitCode = 2;
    return;
  }
  const result = runBuildOriginSignalsBridge(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("lp-do-ideas-build-origin-bridge")) {
  main();
}
