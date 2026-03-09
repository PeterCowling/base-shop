import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  atomicWriteQueueState,
  buildCounts,
  type DispatchSelfEvolvingLink,
  type QueueDispatch,
  type QueueFileShape,
  readQueueStateFile,
} from "../ideas/lp-do-ideas-queue-state-file.js";
import type {
  DeliverableFamily,
  TrialDispatchPacketV2,
} from "../ideas/lp-do-ideas-trial.js";
import {
  statusForRecommendedRoute,
  validateDispatchV2,
} from "../ideas/lp-do-ideas-trial.js";

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
import {
  appendSelfEvolvingEvent,
  createLifecycleEvent,
  readMetaObservations,
} from "./self-evolving-events.js";

const DEFAULT_STALE_AFTER_MS = 60 * 60 * 1000;

export type SelfEvolvingBackboneClosureState =
  | "closed"
  | "stale-repairable"
  | "hard-failed";

interface FollowupDispatchRecord {
  candidate_id: string;
  dispatch_id: string;
  recommended_route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  self_evolving: DispatchSelfEvolvingLink;
}

interface TrialQueuePersistResult {
  ok: boolean;
  queue_entries_written: number;
  telemetry_records_written: number;
  error?: string;
}

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
    return `Run lp-do-build against this recurring gap using preserved executor path ${candidate.executor_path} and validate the change under guarded trial controls.`;
  }
  if (entry.route === "lp-do-plan") {
    return `Run lp-do-plan to turn this recurring gap into a guarded execution plan before build execution.`;
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
    rankedCandidate.score.utility?.net_utility ??
    rankedCandidate.score.priority_score_v2 ??
    rankedCandidate.score.priority_score_v1;
  const areaAnchor = deriveAreaAnchor(candidate, observations);
  const evidenceRefs = collectEvidenceRefs(business, candidate, entry, observations);
  const locationAnchors = collectLocationAnchors(business, observations);
  const recommendedRoute = entry.route;
  const status = statusForRecommendedRoute(recommendedRoute);
  const intendedOutcomeStatement =
    recommendedRoute === "lp-do-build"
      ? `Produce a guarded build-ready packet for ${areaAnchor} and preserve executor path ${candidate.executor_path}.`
      : recommendedRoute === "lp-do-plan"
        ? `Produce a planning-ready packet for ${areaAnchor} and preserve executor path ${candidate.executor_path}.`
        : `Produce a planning-ready fact-find for ${areaAnchor} with preserved executor path ${candidate.executor_path}.`;
  const selfEvolvingLink: DispatchSelfEvolvingLink = {
    candidate_id: candidate.candidate_id,
    decision_id:
      rankedCandidate.policy_context?.decision_id ??
      stableHash(`${business}|${candidate.candidate_id}|decision-fallback`).slice(0, 16),
    policy_version: rankedCandidate.policy_context?.policy_version ?? "self-evolving-policy.v1",
    recommended_route_origin: entry.route,
    executor_path: candidate.executor_path,
    handoff_emitted_at: entry.queued_at,
  };

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
    recommended_route: recommendedRoute,
    status,
    priority: mapPriority(priorityScore),
    confidence: mapConfidence(priorityScore),
    evidence_refs: evidenceRefs,
    created_at: entry.queued_at,
    queue_state: "enqueued",
    self_evolving: selfEvolvingLink,
    why: `${candidate.problem_statement} Route this validated self-evolving candidate back through the canonical workflow.`,
    intended_outcome: {
      type: "operational",
      statement: intendedOutcomeStatement,
      source: "auto",
    },
  };

  const validation = validateDispatchV2(
    packet as Partial<TrialDispatchPacketV2> & Record<string, unknown>,
  );
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  return packet;
}

function extractCandidateIdFromEvidenceRefs(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const ref of value) {
    if (
      typeof ref === "string" &&
      ref.startsWith("self-evolving-candidate:") &&
      ref.length > "self-evolving-candidate:".length
    ) {
      return ref.slice("self-evolving-candidate:".length);
    }
  }

  return null;
}

function toFollowupDispatchRecord(
  dispatch: QueueDispatch | TrialDispatchPacketV2,
): FollowupDispatchRecord | null {
  if (typeof dispatch.dispatch_id !== "string" || dispatch.dispatch_id.length === 0) {
    return null;
  }

  const directLink =
    typeof dispatch.self_evolving === "object" && dispatch.self_evolving !== null
      ? (dispatch.self_evolving as DispatchSelfEvolvingLink)
      : null;
  const candidateId =
    directLink?.candidate_id ?? extractCandidateIdFromEvidenceRefs(dispatch.evidence_refs);
  if (!candidateId) {
    return null;
  }

  if (
    dispatch.recommended_route !== "lp-do-fact-find" &&
    dispatch.recommended_route !== "lp-do-plan" &&
    dispatch.recommended_route !== "lp-do-build" &&
    dispatch.recommended_route !== "lp-do-briefing"
  ) {
    return null;
  }

  return {
    candidate_id: candidateId,
    dispatch_id: dispatch.dispatch_id,
    recommended_route: dispatch.recommended_route,
    self_evolving:
      directLink ??
      ({
        candidate_id: candidateId,
        decision_id: stableHash(`${candidateId}|dispatch-link-fallback`).slice(0, 16),
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin:
          dispatch.recommended_route === "lp-do-briefing"
            ? "lp-do-fact-find"
            : dispatch.recommended_route,
        executor_path: "unknown",
        handoff_emitted_at:
          typeof dispatch.created_at === "string" ? dispatch.created_at : new Date().toISOString(),
      } satisfies DispatchSelfEvolvingLink),
  };
}

function isStalePendingEntry(
  entry: SelfEvolvingBackboneQueueEntry,
  now: Date,
  staleAfterMs: number,
): boolean {
  const queuedAtMs = Date.parse(entry.queued_at);
  if (Number.isNaN(queuedAtMs)) {
    return true;
  }
  return now.getTime() - queuedAtMs >= staleAfterMs;
}

function persistFollowupDispatchesToTrialQueue(options: {
  queueStatePath: string;
  telemetryPath: string;
  business: string;
  dispatches: readonly TrialDispatchPacketV2[];
  recordedAt: string;
}): TrialQueuePersistResult {
  const queueResult = readQueueStateFile(options.queueStatePath);
  let queue: QueueFileShape;

  if (queueResult.ok) {
    queue = queueResult.queue;
  } else if (queueResult.reason === "file_not_found") {
    queue = { dispatches: [] };
  } else {
    return {
      ok: false,
      queue_entries_written: 0,
      telemetry_records_written: 0,
      error: `[self-evolving-backbone-consume] unable to read trial queue: ${queueResult.error ?? queueResult.reason}`,
    };
  }

  const seenDispatchIds = new Set(
    queue.dispatches
      .map((entry) => entry.dispatch_id)
      .filter((dispatchId): dispatchId is string => typeof dispatchId === "string"),
  );
  const seenClusters = new Set(
    queue.dispatches
      .map((entry) => {
        const clusterKey =
          typeof entry.cluster_key === "string" ? entry.cluster_key : null;
        const clusterFingerprint =
          typeof entry.cluster_fingerprint === "string" ? entry.cluster_fingerprint : null;
        if (!clusterKey || !clusterFingerprint) {
          return null;
        }
        return `${clusterKey}:${clusterFingerprint}`;
      })
      .filter((clusterKey): clusterKey is string => typeof clusterKey === "string"),
  );

  const appendedDispatches: TrialDispatchPacketV2[] = [];
  for (const dispatch of options.dispatches) {
    const clusterKey = `${dispatch.cluster_key}:${dispatch.cluster_fingerprint}`;
    if (seenDispatchIds.has(dispatch.dispatch_id) || seenClusters.has(clusterKey)) {
      continue;
    }
    queue.dispatches.push(dispatch as unknown as QueueDispatch);
    seenDispatchIds.add(dispatch.dispatch_id);
    seenClusters.add(clusterKey);
    appendedDispatches.push(dispatch);
  }

  if (appendedDispatches.length === 0) {
    return {
      ok: true,
      queue_entries_written: 0,
      telemetry_records_written: 0,
    };
  }

  queue.last_updated = options.recordedAt;
  queue.counts = buildCounts(queue.dispatches);
  const writeResult = atomicWriteQueueState(options.queueStatePath, queue);
  if (!writeResult.ok) {
    return {
      ok: false,
      queue_entries_written: 0,
      telemetry_records_written: 0,
      error: `[self-evolving-backbone-consume] unable to write trial queue: ${writeResult.error}`,
    };
  }

  const telemetryDir = path.dirname(options.telemetryPath);
  mkdirSync(telemetryDir, { recursive: true });
  const telemetryLines = appendedDispatches
    .map((dispatch) =>
      JSON.stringify({
        recorded_at: options.recordedAt,
        dispatch_id: dispatch.dispatch_id,
        mode: "trial",
        business: options.business,
        queue_state: "enqueued",
        kind: "enqueued",
        reason: "self_evolving_backbone_consume",
      }),
    )
    .join("\n");

  if (telemetryLines.length === 0) {
    return {
      ok: true,
      queue_entries_written: appendedDispatches.length,
      telemetry_records_written: 0,
    };
  }

  try {
    const prefix =
      existsSync(options.telemetryPath) &&
      readFileSync(options.telemetryPath, "utf-8").trim().length > 0
        ? "\n"
        : "";
    appendFileSync(options.telemetryPath, `${prefix}${telemetryLines}\n`, "utf-8");
  } catch (error) {
    return {
      ok: true,
      queue_entries_written: appendedDispatches.length,
      telemetry_records_written: 0,
      error:
        error instanceof Error
          ? `[self-evolving-backbone-consume] telemetry append failed: ${error.message}`
          : `[self-evolving-backbone-consume] telemetry append failed: ${String(error)}`,
    };
  }

  return {
    ok: true,
    queue_entries_written: appendedDispatches.length,
    telemetry_records_written: appendedDispatches.length,
  };
}

function updateConsumedEntries(
  entries: readonly SelfEvolvingBackboneQueueEntry[],
  resolvedDispatches: ReadonlyMap<string, FollowupDispatchRecord>,
  consumeBy: string,
  consumedAt: string,
): SelfEvolvingBackboneQueueEntry[] {
  return entries.map((entry) => {
    const dispatch = resolvedDispatches.get(entry.candidate_id);
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

function emitHandoffLifecycleEvents(options: {
  rootDir: string;
  business: string;
  consumeBy: string;
  consumedAt: string;
  resolvedDispatches: ReadonlyMap<string, FollowupDispatchRecord>;
}): void {
  const runId = stableHash(
    `${options.business}|${options.consumeBy}|${options.consumedAt}|handoff-run`,
  ).slice(0, 16);
  const sessionId = stableHash(
    `${options.business}|${options.consumeBy}|${options.consumedAt}|handoff-session`,
  ).slice(0, 16);

  for (const dispatch of options.resolvedDispatches.values()) {
    appendSelfEvolvingEvent(
      options.rootDir,
      options.business,
      createLifecycleEvent({
        correlation_id: dispatch.candidate_id,
        event_type: "followup_dispatch_handoff",
        lifecycle: {
          candidate_id: dispatch.candidate_id,
          dispatch_id: dispatch.dispatch_id,
        },
        run_id: runId,
        session_id: sessionId,
        source_component: "self-evolving-backbone-consume",
        timestamp: options.consumedAt,
        artifact_refs: [
          "docs/business-os/startup-loop/ideas/trial/queue-state.json",
        ],
      }),
    );
  }
}

export interface SelfEvolvingBackboneConsumeOptions {
  rootDir: string;
  business: string;
  queueStatePath: string;
  telemetryPath: string;
  consumeBy?: string;
  staleAfterMs?: number;
  staleOnly?: boolean;
}

export interface SelfEvolvingBackboneConsumeResult {
  ok: boolean;
  closure_state: SelfEvolvingBackboneClosureState;
  backbone_queue_path: string;
  pending_entries: number;
  emitted_dispatches: number;
  dispatch_ids: string[];
  resolved_candidate_ids: string[];
  unresolved_candidate_ids: string[];
  closed_candidate_ids: string[];
  stale_repairable_candidate_ids: string[];
  hard_failed_candidate_ids: string[];
  closure_counts: Record<SelfEvolvingBackboneClosureState, number>;
  consumed_entries_marked: number;
  queue_entries_written: number;
  telemetry_records_written: number;
  warnings: string[];
  error?: string;
}

export function consumeBackboneQueueToIdeasWorkflow(
  options: SelfEvolvingBackboneConsumeOptions,
): SelfEvolvingBackboneConsumeResult {
  const now = new Date();
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  const backboneQueuePath = resolveBackboneQueuePath(options.rootDir, options.business);
  const backboneEntries = readBackboneQueue(options.rootDir, options.business);
  const pendingEntries = backboneEntries.filter(
    (entry) =>
      entry.followup_dispatch_id == null &&
      entry.consumed_at == null &&
      (!options.staleOnly || isStalePendingEntry(entry, now, staleAfterMs)),
  );

  if (pendingEntries.length === 0) {
    return {
      ok: true,
      closure_state: "closed",
      backbone_queue_path: backboneQueuePath,
      pending_entries: 0,
      emitted_dispatches: 0,
      dispatch_ids: [],
      resolved_candidate_ids: [],
      unresolved_candidate_ids: [],
      closed_candidate_ids: [],
      stale_repairable_candidate_ids: [],
      hard_failed_candidate_ids: [],
      closure_counts: {
        closed: 0,
        "stale-repairable": 0,
        "hard-failed": 0,
      },
      consumed_entries_marked: 0,
      queue_entries_written: 0,
      telemetry_records_written: 0,
      warnings: [],
    };
  }

  const staleCandidateIds = new Set(
    pendingEntries
      .filter((entry) => isStalePendingEntry(entry, now, staleAfterMs))
      .map((entry) => entry.candidate_id),
  );
  const candidateLedger = readCandidateLedger(options.rootDir, options.business);
  const rankedByCandidateId = new Map(
    candidateLedger.candidates.map((item) => [item.candidate.candidate_id, item] as const),
  );
  const observations = readMetaObservations(options.rootDir, options.business);
  const warnings: string[] = [];
  const resolvedDispatches = new Map<string, FollowupDispatchRecord>();
  const matchedExistingCandidateIds = new Set<string>();
  const emitted: TrialDispatchPacketV2[] = [];
  const hardFailedCandidateIds = new Set<string>();

  const queueStateResult = readQueueStateFile(options.queueStatePath);
  if (!queueStateResult.ok && queueStateResult.reason !== "file_not_found") {
    const unresolvedCandidateIds = pendingEntries.map((entry) => entry.candidate_id);
    return {
      ok: false,
      closure_state: "hard-failed",
      backbone_queue_path: backboneQueuePath,
      pending_entries: pendingEntries.length,
      emitted_dispatches: 0,
      dispatch_ids: [],
      resolved_candidate_ids: [],
      unresolved_candidate_ids: unresolvedCandidateIds,
      closed_candidate_ids: [],
      stale_repairable_candidate_ids: [],
      hard_failed_candidate_ids: unresolvedCandidateIds,
      closure_counts: {
        closed: 0,
        "stale-repairable": 0,
        "hard-failed": unresolvedCandidateIds.length,
      },
      consumed_entries_marked: 0,
      queue_entries_written: 0,
      telemetry_records_written: 0,
      warnings,
      error: `[self-evolving-backbone-consume] unable to read trial queue: ${queueStateResult.error ?? queueStateResult.reason}`,
    };
  }

  const existingDispatchByCandidateId = new Map<string, FollowupDispatchRecord>();
  if (queueStateResult.ok) {
    for (const dispatch of queueStateResult.queue.dispatches) {
      const record = toFollowupDispatchRecord(dispatch);
      if (!record || existingDispatchByCandidateId.has(record.candidate_id)) {
        continue;
      }
      existingDispatchByCandidateId.set(record.candidate_id, record);
    }
  }

  for (const entry of pendingEntries) {
    const existingDispatch = existingDispatchByCandidateId.get(entry.candidate_id);
    if (existingDispatch) {
      resolvedDispatches.set(entry.candidate_id, existingDispatch);
      matchedExistingCandidateIds.add(entry.candidate_id);
      staleCandidateIds.add(entry.candidate_id);
      warnings.push(`stale_entry_repaired_from_existing_dispatch:${entry.candidate_id}`);
      continue;
    }

    const rankedCandidate = rankedByCandidateId.get(entry.candidate_id);
    if (!rankedCandidate) {
      warnings.push(`missing_candidate:${entry.candidate_id}`);
      hardFailedCandidateIds.add(entry.candidate_id);
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

  let queueEntriesWritten = 0;
  let telemetryRecordsWritten = 0;
  if (emitted.length > 0) {
    const persistence = persistFollowupDispatchesToTrialQueue({
      queueStatePath: options.queueStatePath,
      telemetryPath: options.telemetryPath,
      business: options.business,
      dispatches: emitted,
      recordedAt: now.toISOString(),
    });
    queueEntriesWritten = persistence.queue_entries_written;
    telemetryRecordsWritten = persistence.telemetry_records_written;
    if (persistence.error) {
      warnings.push(persistence.error);
    }
    if (!persistence.ok) {
      for (const dispatch of emitted) {
        const record = toFollowupDispatchRecord(dispatch);
        if (record) {
          hardFailedCandidateIds.add(record.candidate_id);
        }
      }
    } else {
      for (const dispatch of emitted) {
        const record = toFollowupDispatchRecord(dispatch);
        if (!record) {
          continue;
        }
        resolvedDispatches.set(record.candidate_id, record);
      }
    }
  }

  if (resolvedDispatches.size === 0) {
    const unresolvedCandidateIds = pendingEntries
      .map((entry) => entry.candidate_id)
      .filter((candidateId) => hardFailedCandidateIds.has(candidateId));
    return {
      ok: false,
      closure_state: "hard-failed",
      backbone_queue_path: backboneQueuePath,
      pending_entries: pendingEntries.length,
      emitted_dispatches: emitted.length,
      dispatch_ids: emitted.map((dispatch) => dispatch.dispatch_id),
      resolved_candidate_ids: [],
      unresolved_candidate_ids: unresolvedCandidateIds,
      closed_candidate_ids: [],
      stale_repairable_candidate_ids: [],
      hard_failed_candidate_ids: unresolvedCandidateIds,
      closure_counts: {
        closed: 0,
        "stale-repairable": 0,
        "hard-failed": unresolvedCandidateIds.length,
      },
      consumed_entries_marked: 0,
      queue_entries_written: queueEntriesWritten,
      telemetry_records_written: telemetryRecordsWritten,
      warnings,
      error: "unresolved_pending_backbone_entries",
    };
  }

  const consumedAt = now.toISOString();
  const updatedEntries = updateConsumedEntries(
    backboneEntries,
    resolvedDispatches,
    options.consumeBy ?? "self-evolving-backbone-consume",
    consumedAt,
  );
  writeBackboneQueue(options.rootDir, options.business, updatedEntries);
  emitHandoffLifecycleEvents({
    rootDir: options.rootDir,
    business: options.business,
    consumeBy: options.consumeBy ?? "self-evolving-backbone-consume",
    consumedAt,
    resolvedDispatches,
  });

  const resolvedCandidateIdSet = new Set(resolvedDispatches.keys());
  const resolvedCandidateIds = updatedEntries
    .filter(
      (entry) =>
        resolvedCandidateIdSet.has(entry.candidate_id) &&
        entry.followup_dispatch_id != null &&
        entry.consumed_at != null,
    )
    .map((entry) => entry.candidate_id);
  const unresolvedCandidateIds = pendingEntries
    .map((entry) => entry.candidate_id)
    .filter((candidateId) => !resolvedCandidateIds.includes(candidateId));
  const consumedEntriesMarked = resolvedCandidateIds.length;
  const staleRepairableCandidateIds = resolvedCandidateIds.filter((candidateId) =>
    staleCandidateIds.has(candidateId),
  );
  const closedCandidateIds = resolvedCandidateIds.filter(
    (candidateId) => !staleCandidateIds.has(candidateId),
  );
  const hardFailedCandidateIdsList = unresolvedCandidateIds.filter((candidateId) =>
    hardFailedCandidateIds.has(candidateId) || !resolvedCandidateIdSet.has(candidateId),
  );

  if (matchedExistingCandidateIds.size === 0 && staleRepairableCandidateIds.length > 0) {
    for (const candidateId of staleRepairableCandidateIds) {
      warnings.push(`stale_entry_replayed:${candidateId}`);
    }
  }

  if (unresolvedCandidateIds.length > 0) {
    return {
      ok: false,
      closure_state: "hard-failed",
      backbone_queue_path: backboneQueuePath,
      pending_entries: pendingEntries.length,
      emitted_dispatches: emitted.length,
      dispatch_ids: emitted.map((dispatch) => dispatch.dispatch_id),
      resolved_candidate_ids: resolvedCandidateIds,
      unresolved_candidate_ids: unresolvedCandidateIds,
      closed_candidate_ids: closedCandidateIds,
      stale_repairable_candidate_ids: staleRepairableCandidateIds,
      hard_failed_candidate_ids: hardFailedCandidateIdsList,
      closure_counts: {
        closed: closedCandidateIds.length,
        "stale-repairable": staleRepairableCandidateIds.length,
        "hard-failed": hardFailedCandidateIdsList.length,
      },
      consumed_entries_marked: consumedEntriesMarked,
      queue_entries_written: queueEntriesWritten,
      telemetry_records_written: telemetryRecordsWritten,
      warnings,
      error: "unresolved_pending_backbone_entries",
    };
  }

  return {
    ok: true,
    closure_state: staleRepairableCandidateIds.length > 0 ? "stale-repairable" : "closed",
    backbone_queue_path: backboneQueuePath,
    pending_entries: pendingEntries.length,
    emitted_dispatches: emitted.length,
    dispatch_ids: emitted.map((dispatch) => dispatch.dispatch_id),
    resolved_candidate_ids: resolvedCandidateIds,
    unresolved_candidate_ids: [],
    closed_candidate_ids: closedCandidateIds,
    stale_repairable_candidate_ids: staleRepairableCandidateIds,
    hard_failed_candidate_ids: [],
    closure_counts: {
      closed: closedCandidateIds.length,
      "stale-repairable": staleRepairableCandidateIds.length,
      "hard-failed": 0,
    },
    consumed_entries_marked: consumedEntriesMarked,
    queue_entries_written: queueEntriesWritten,
    telemetry_records_written: telemetryRecordsWritten,
    warnings,
  };
}

interface CliArgs {
  rootDir: string;
  business: string;
  queueStatePath: string;
  telemetryPath: string;
  staleAfterHours: number;
  staleOnly: boolean;
}

function defaultRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  const bareArgs = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      bareArgs.add(token);
      continue;
    }
    flags.set(token.slice(2), value);
    index += 1;
  }

  const rootDir = flags.get("root-dir") ?? defaultRootDir();
  const business = flags.get("business") ?? "BRIK";
  const staleAfterHoursRaw = Number(flags.get("stale-after-hours") ?? "1");
  const staleAfterHours =
    Number.isFinite(staleAfterHoursRaw) && staleAfterHoursRaw >= 0 ? staleAfterHoursRaw : 1;

  return {
    rootDir,
    business,
    queueStatePath:
      flags.get("queue-state-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    telemetryPath:
      flags.get("telemetry-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl"),
    staleAfterHours,
    staleOnly: bareArgs.has("--stale-only"),
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
    staleAfterMs: args.staleAfterHours * 60 * 60 * 1000,
    staleOnly: args.staleOnly,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-backbone-consume")) {
  main();
}
