import path from "node:path";

import { persistOrchestratorResult } from "../ideas/lp-do-ideas-persistence.js";
import type {
  DeliverableFamily,
  TrialDispatchPacketV2,
} from "../ideas/lp-do-ideas-trial.js";
import { validateDispatchV2 } from "../ideas/lp-do-ideas-trial.js";

import {
  readBackboneQueue,
  resolveBackboneQueuePath,
  type SelfEvolvingBackboneQueueEntry,
  writeBackboneQueue,
} from "./self-evolving-backbone-queue.js";
import type { RankedCandidate } from "./self-evolving-candidates.js";
import { readCandidateLedger } from "./self-evolving-candidates.js";
import type { ImprovementCandidate, MetaObservation } from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { readMetaObservations } from "./self-evolving-events.js";

function normalizeDispatchKey(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.length > 0 ? normalized : "self-evolving";
}

function buildFollowupDispatchId(entry: SelfEvolvingBackboneQueueEntry): string {
  const timestamp = entry.queued_at.replace(/\D/g, "").slice(0, 14).padEnd(14, "0");
  const hash = stableHash(`${entry.business}|${entry.candidate_id}|self-evolving-followup`);
  const sequence = (parseInt(hash.slice(0, 8), 16) % 10000).toString().padStart(4, "0");
  return `IDEA-DISPATCH-${timestamp}-${sequence}`;
}

function looksLikePathRef(value: string): boolean {
  return (
    value.includes("/") &&
    !value.includes(":") &&
    !value.startsWith("#") &&
    !value.startsWith("http")
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function summarizeProblem(candidate: ImprovementCandidate): string {
  const firstSentence = candidate.problem_statement.split(".")[0]?.trim();
  if (firstSentence && firstSentence.length > 0) {
    return firstSentence.slice(0, 120);
  }
  return `Recurring workflow gap for candidate ${candidate.candidate_id}`;
}

function deriveAreaAnchor(
  candidate: ImprovementCandidate,
  observations: readonly MetaObservation[],
): string {
  const recurrenceKey = observations
    .map((observation) => observation.signal_hints?.recurrence_key)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (recurrenceKey) {
    return recurrenceKey.split("|").slice(0, 4).join(" / ");
  }
  return summarizeProblem(candidate);
}

function collectLocationAnchors(
  business: string,
  observations: readonly MetaObservation[],
): [string, ...string[]] {
  const refs = uniqueStrings(
    observations.flatMap((observation) => [...observation.artifact_refs, ...observation.evidence_refs]),
  ).filter(looksLikePathRef);

  if (refs.length > 0) {
    return refs.slice(0, 8) as [string, ...string[]];
  }

  return [
    path.join(
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      business,
      "candidates.json",
    ),
  ];
}

function collectEvidenceRefs(
  business: string,
  candidate: ImprovementCandidate,
  entry: SelfEvolvingBackboneQueueEntry,
  observations: readonly MetaObservation[],
): [string, ...string[]] {
  const refs = uniqueStrings([
    `self-evolving-candidate:${candidate.candidate_id}`,
    `self-evolving-backbone-route:${entry.route}`,
    path.join("docs", "business-os", "startup-loop", "self-evolving", business, "candidates.json"),
    path.join(
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      business,
      "backbone-queue.jsonl",
    ),
    ...observations.flatMap((observation) => observation.evidence_refs),
    ...observations.flatMap((observation) => observation.artifact_refs),
  ]);

  return (refs.length > 0 ? refs.slice(0, 12) : [candidate.candidate_id]) as [
    string,
    ...string[],
  ];
}

function mapDeliverableFamily(candidate: ImprovementCandidate): DeliverableFamily {
  switch (candidate.candidate_type) {
    case "new_skill":
    case "skill_refactor":
      return "doc";
    case "deterministic_extraction":
    case "container_update":
    default:
      return "code-change";
  }
}

function mapPriority(priorityScore: number): "P1" | "P2" | "P3" {
  if (priorityScore >= 4.5) return "P1";
  if (priorityScore >= 3) return "P2";
  return "P3";
}

function mapConfidence(priorityScore: number): number {
  if (priorityScore >= 4.5) return 0.92;
  if (priorityScore >= 3) return 0.85;
  return 0.75;
}

function buildNextScope(
  candidate: ImprovementCandidate,
  entry: SelfEvolvingBackboneQueueEntry,
): string {
  if (entry.route === "lp-do-build") {
    return `Run lp-do-fact-find to scope this recurring gap into a guarded plan that can progress to ${candidate.executor_path}.`;
  }
  if (entry.route === "lp-do-plan") {
    return `Run lp-do-fact-find to scope this recurring gap into a planning-ready packet before build execution.`;
  }
  return `Run lp-do-fact-find to validate whether this recurring gap should become a reusable skill or process improvement.`;
}

function buildFollowupDispatch(
  business: string,
  entry: SelfEvolvingBackboneQueueEntry,
  rankedCandidate: RankedCandidate,
  observations: readonly MetaObservation[],
): TrialDispatchPacketV2 {
  const candidate = rankedCandidate.candidate;
  const priorityScore =
    rankedCandidate.score.priority_score_v2 ?? rankedCandidate.score.priority_score_v1;
  const areaAnchor = deriveAreaAnchor(candidate, observations);
  const evidenceRefs = collectEvidenceRefs(business, candidate, entry, observations);
  const locationAnchors = collectLocationAnchors(business, observations);

  const packet: TrialDispatchPacketV2 = {
    schema_version: "dispatch.v2",
    dispatch_id: buildFollowupDispatchId(entry),
    mode: "trial",
    business,
    trigger: "operator_idea",
    artifact_id: `self-evolving.candidate.${candidate.candidate_id}`,
    before_sha: null,
    after_sha: stableHash(`self-evolving|${candidate.candidate_id}`).slice(0, 16),
    root_event_id: `self-evolving:candidate:${candidate.candidate_id}`,
    anchor_key: normalizeDispatchKey(areaAnchor),
    cluster_key: `self-evolving-${normalizeDispatchKey(areaAnchor)}`,
    cluster_fingerprint: stableHash(
      `${business}|${candidate.candidate_id}|${entry.route}|${candidate.executor_path}`,
    ),
    lineage_depth: 0,
    area_anchor: areaAnchor,
    location_anchors: locationAnchors,
    provisional_deliverable_family: mapDeliverableFamily(candidate),
    current_truth: candidate.problem_statement,
    next_scope_now: buildNextScope(candidate, entry),
    adjacent_later: [
      `Downstream self-evolving route hint: ${entry.route}`,
      `Suggested executor path: ${candidate.executor_path}`,
    ],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: mapPriority(priorityScore),
    confidence: mapConfidence(priorityScore),
    evidence_refs: evidenceRefs,
    created_at: entry.queued_at,
    queue_state: "enqueued",
    why: `${candidate.problem_statement} Route this validated self-evolving candidate back through the canonical workflow.`,
    intended_outcome: {
      type: "operational",
      statement:
        `Produce a planning-ready fact-find for ${areaAnchor} with downstream route hint ${entry.route} ` +
        `and executor path ${candidate.executor_path}.`,
      source: "auto",
    },
  };

  const validation = validateDispatchV2(packet);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  return packet;
}

function updateConsumedEntries(
  entries: readonly SelfEvolvingBackboneQueueEntry[],
  emittedDispatches: readonly TrialDispatchPacketV2[],
  consumeBy: string,
  consumedAt: string,
): SelfEvolvingBackboneQueueEntry[] {
  const dispatchByCandidate = new Map<string, TrialDispatchPacketV2>();
  for (const dispatch of emittedDispatches) {
    const marker = dispatch.evidence_refs.find((ref) => ref.startsWith("self-evolving-candidate:"));
    if (!marker) continue;
    dispatchByCandidate.set(marker.slice("self-evolving-candidate:".length), dispatch);
  }

  return entries.map((entry) => {
    const dispatch = dispatchByCandidate.get(entry.candidate_id);
    if (!dispatch) {
      return entry;
    }
    return {
      ...entry,
      consumed_at: consumedAt,
      consumed_by: consumeBy,
      followup_dispatch_id: dispatch.dispatch_id,
      followup_queue_state: "enqueued",
      followup_route: dispatch.recommended_route,
    };
  });
}

export interface SelfEvolvingBackboneConsumeOptions {
  rootDir: string;
  business: string;
  queueStatePath: string;
  telemetryPath: string;
  consumeBy?: string;
}

export interface SelfEvolvingBackboneConsumeResult {
  ok: boolean;
  backbone_queue_path: string;
  emitted_dispatches: number;
  dispatch_ids: string[];
  queue_entries_written: number;
  telemetry_records_written: number;
  warnings: string[];
  error?: string;
}

export function consumeBackboneQueueToIdeasWorkflow(
  options: SelfEvolvingBackboneConsumeOptions,
): SelfEvolvingBackboneConsumeResult {
  const backboneQueuePath = resolveBackboneQueuePath(options.rootDir, options.business);
  const backboneEntries = readBackboneQueue(options.rootDir, options.business);
  const pendingEntries = backboneEntries.filter(
    (entry) => entry.followup_dispatch_id == null && entry.consumed_at == null,
  );

  if (pendingEntries.length === 0) {
    return {
      ok: true,
      backbone_queue_path: backboneQueuePath,
      emitted_dispatches: 0,
      dispatch_ids: [],
      queue_entries_written: 0,
      telemetry_records_written: 0,
      warnings: [],
    };
  }

  const candidateLedger = readCandidateLedger(options.rootDir, options.business);
  const rankedByCandidateId = new Map(
    candidateLedger.candidates.map((item) => [item.candidate.candidate_id, item] as const),
  );
  const observations = readMetaObservations(options.rootDir, options.business);
  const warnings: string[] = [];
  const emitted: TrialDispatchPacketV2[] = [];

  for (const entry of pendingEntries) {
    const rankedCandidate = rankedByCandidateId.get(entry.candidate_id);
    if (!rankedCandidate) {
      warnings.push(`missing_candidate:${entry.candidate_id}`);
      continue;
    }

    const candidateObservations = observations.filter((observation) =>
      rankedCandidate.candidate.trigger_observations.includes(observation.observation_id),
    );

    emitted.push(
      buildFollowupDispatch(
        options.business,
        entry,
        rankedCandidate,
        candidateObservations,
      ),
    );
  }

  if (emitted.length === 0) {
    return {
      ok: true,
      backbone_queue_path: backboneQueuePath,
      emitted_dispatches: 0,
      dispatch_ids: [],
      queue_entries_written: 0,
      telemetry_records_written: 0,
      warnings,
    };
  }

  const persistence = persistOrchestratorResult({
    queueStatePath: options.queueStatePath,
    telemetryPath: options.telemetryPath,
    mode: "trial",
    business: options.business,
    dispatched: emitted,
    clock: () => new Date(emitted[0]?.created_at ?? new Date().toISOString()),
  });

  if (!persistence.ok) {
    return {
      ok: false,
      backbone_queue_path: backboneQueuePath,
      emitted_dispatches: 0,
      dispatch_ids: [],
      queue_entries_written: persistence.new_entries_written,
      telemetry_records_written: persistence.telemetry_records_written,
      warnings,
      error: persistence.error,
    };
  }

  const consumedAt = new Date().toISOString();
  const updatedEntries = updateConsumedEntries(
    backboneEntries,
    emitted,
    options.consumeBy ?? "self-evolving-backbone-consume",
    consumedAt,
  );
  writeBackboneQueue(options.rootDir, options.business, updatedEntries);

  return {
    ok: true,
    backbone_queue_path: backboneQueuePath,
    emitted_dispatches: emitted.length,
    dispatch_ids: emitted.map((dispatch) => dispatch.dispatch_id),
    queue_entries_written: persistence.new_entries_written,
    telemetry_records_written: persistence.telemetry_records_written,
    warnings: persistence.error ? [...warnings, persistence.error] : warnings,
  };
}

interface CliArgs {
  rootDir: string;
  business: string;
  queueStatePath: string;
  telemetryPath: string;
}

function defaultRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) continue;
    flags.set(token.slice(2), value);
    index += 1;
  }

  const rootDir = flags.get("root-dir") ?? defaultRootDir();
  const business = flags.get("business") ?? "BRIK";

  return {
    rootDir,
    business,
    queueStatePath:
      flags.get("queue-state-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    telemetryPath:
      flags.get("telemetry-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl"),
  };
}

function resolvePath(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const result = consumeBackboneQueueToIdeasWorkflow({
    rootDir: args.rootDir,
    business: args.business,
    queueStatePath: resolvePath(args.rootDir, args.queueStatePath),
    telemetryPath: resolvePath(args.rootDir, args.telemetryPath),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-backbone-consume")) {
  main();
}
