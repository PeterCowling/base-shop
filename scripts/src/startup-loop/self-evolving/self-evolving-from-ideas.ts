import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  consumeBackboneQueueToIdeasWorkflow,
} from "./self-evolving-backbone-consume.js";
import {
  enqueueBackboneCandidates,
} from "./self-evolving-backbone-queue.js";
import type { MetaObservation, StartupState } from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { buildHardSignature } from "./self-evolving-detector.js";
import {
  runSelfEvolvingOrchestrator,
  type SelfEvolvingOrchestratorResult,
} from "./self-evolving-orchestrator.js";
import { buildObservationSignalHints } from "./self-evolving-signal-helpers.js";

export interface IdeasDispatchPacket {
  schema_version: "dispatch.v1" | "dispatch.v2";
  dispatch_id: string;
  mode: "trial" | "live";
  business: string;
  trigger: "artifact_delta" | "operator_idea";
  artifact_id?: string;
  before_sha: string | null;
  after_sha: string;
  root_event_id: string;
  anchor_key: string;
  cluster_key: string;
  cluster_fingerprint: string;
  lineage_depth: number;
  area_anchor: string;
  location_anchors: [string, ...string[]];
  provisional_deliverable_family:
    | "code-change"
    | "doc"
    | "multi"
    | "business-artifact"
    | "design"
    | "infra";
  current_truth: string;
  next_scope_now: string;
  adjacent_later: string[];
  recommended_route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  status:
    | "fact_find_ready"
    | "plan_ready"
    | "micro_build_ready"
    | "briefing_ready"
    | "auto_executed"
    | "logged_no_action";
  priority: "P1" | "P2" | "P3";
  confidence: number;
  evidence_refs: [string, ...string[]];
  created_at: string;
  queue_state: "enqueued" | "processed" | "skipped" | "error";
  why?: string;
  intended_outcome?:
    | {
        type: "measurable" | "operational";
        statement: string;
        source: "operator" | "auto";
      }
    | string;
}

function deriveObservationType(
  packet: IdeasDispatchPacket,
): MetaObservation["observation_type"] {
  if (packet.status === "logged_no_action") return "routing_override";
  if (packet.status === "briefing_ready") return "operator_intervention";
  return "execution_event";
}

function firstNonEmptyText(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

function resolveIntendedOutcomeStatement(packet: IdeasDispatchPacket): string {
  const intendedOutcome =
    typeof packet.intended_outcome === "string"
      ? packet.intended_outcome
      : packet.intended_outcome?.statement;
  return (
    firstNonEmptyText(
      intendedOutcome,
      packet.next_scope_now,
      packet.current_truth,
      packet.why,
      packet.area_anchor,
      packet.cluster_key,
      packet.dispatch_id,
    ) ?? "Route recurring startup-loop work into a reusable path."
  );
}

export function dispatchToMetaObservation(
  packet: IdeasDispatchPacket,
  input: {
    business: string;
    run_id: string;
    session_id: string;
    index: number;
    now: Date;
  },
): MetaObservation {
  const areaAnchor =
    firstNonEmptyText(packet.area_anchor, packet.cluster_key, packet.dispatch_id) ?? "unknown";
  const intendedOutcomeStatement = resolveIntendedOutcomeStatement(packet);
  const signalHints = buildObservationSignalHints({
    recurrenceKeyParts: [areaAnchor, intendedOutcomeStatement, packet.why ?? ""],
    problemStatement: `Reduce recurring ${areaAnchor} work and route it into a reusable lp-do-build path for ${packet.business}.`,
    texts: [
      areaAnchor,
      packet.current_truth,
      packet.next_scope_now,
      packet.why ?? "",
      intendedOutcomeStatement,
    ],
  });
  const hardSignature = buildHardSignature({
    fingerprint_version: "2",
    source_component: "lp-do-ideas",
    step_id: "dispatch-observation",
    normalized_path: signalHints.recurrence_key ?? packet.area_anchor,
    error_or_reason_code: packet.trigger,
    effect_class: "read_only",
  });
  const timestamp =
    Number.isNaN(Date.parse(packet.created_at))
      ? new Date(input.now.getTime() - input.index * 1000).toISOString()
      : new Date(packet.created_at).toISOString();
  const hasKpiHint =
    /(kpi|conversion|activation|retention|signup|lead)/i.test(intendedOutcomeStatement);
  const observationSeed = packet.root_event_id?.trim().length
    ? packet.root_event_id
    : packet.dispatch_id;

  return {
    schema_version: "meta-observation.v2",
    observation_id: stableHash(`lp-do-ideas|${packet.dispatch_id}|${observationSeed}`).slice(
      0,
      16,
    ),
    observation_type: deriveObservationType(packet),
    timestamp,
    business: input.business,
    actor_type: "automation",
    run_id: input.run_id,
    session_id: input.session_id,
    skill_id: "lp-do-ideas",
    container_id: null,
    artifact_refs: packet.evidence_refs,
    context_path: `lp-do-ideas/${areaAnchor}`,
    hard_signature: hardSignature,
    soft_cluster_id: stableHash(signalHints.recurrence_key ?? packet.cluster_fingerprint).slice(
      0,
      16,
    ),
    fingerprint_version: "2",
    repeat_count_window: 1,
    operator_minutes_estimate: packet.priority === "P1" ? 20 : 10,
    quality_impact_estimate: packet.priority === "P1" ? 0.8 : 0.3,
    detector_confidence: packet.confidence,
    severity: packet.priority === "P1" ? 0.8 : 0.4,
    inputs_hash: stableHash(`${packet.before_sha ?? "null"}|${packet.after_sha}`),
    outputs_hash: stableHash(
      `${packet.current_truth}|${packet.next_scope_now}|${packet.recommended_route}`,
    ),
    toolchain_version: "lp-do-ideas.v3",
    model_version: null,
    kpi_name: null,
    kpi_value: null,
    kpi_unit: null,
    aggregation_method: null,
    sample_size: null,
    data_quality_status: hasKpiHint ? "unknown" : null,
    data_quality_reason_code: hasKpiHint ? "dispatch_only_signal" : null,
    baseline_ref: null,
    measurement_window: hasKpiHint ? "7d" : null,
    traffic_segment: null,
    evidence_refs: packet.evidence_refs,
    evidence_grade: hasKpiHint ? "structural" : "exploratory",
    measurement_contract_status: hasKpiHint ? "declared" : "none",
    signal_hints: signalHints,
  };
}

export interface SelfEvolvingFromIdeasInput {
  rootDir: string;
  business: string;
  run_id: string;
  session_id: string;
  startup_state: StartupState;
  dispatches: IdeasDispatchPacket[];
  followupConsumeMode?: "consume" | "skip";
  followupQueueStatePath?: string;
  followupTelemetryPath?: string;
  now?: Date;
}

export interface SelfEvolvingFromIdeasResult {
  business: string;
  run_id: string;
  session_id: string;
  generation_source: "self-evolving-from-ideas";
  observations_generated: number;
  backbone_queue_path: string;
  backbone_queued: number;
  followup_consume_mode: "consume" | "skip";
  followup_closure_state: "closed" | "stale-repairable" | "hard-failed";
  followup_dispatches_emitted: number;
  followup_pending_entries: number;
  followup_consumed_entries: number;
  followup_closed_candidate_ids: string[];
  followup_stale_repairable_candidate_ids: string[];
  followup_hard_failed_candidate_ids: string[];
  followup_unresolved_candidate_ids: string[];
  followup_queue_entries_written: number;
  warnings: string[];
  orchestrator: SelfEvolvingOrchestratorResult;
}

export function runSelfEvolvingFromIdeas(
  input: SelfEvolvingFromIdeasInput,
): SelfEvolvingFromIdeasResult {
  const now = input.now ?? new Date();
  const followupConsumeMode = input.followupConsumeMode ?? "consume";
  const observations = input.dispatches.map((packet, index) =>
    dispatchToMetaObservation(packet, {
      business: input.business,
      run_id: input.run_id,
      session_id: input.session_id,
      index,
      now,
    }),
  );

  const orchestrator = runSelfEvolvingOrchestrator({
    rootDir: input.rootDir,
    business: input.business,
    run_id: input.run_id,
    session_id: input.session_id,
    startup_state: input.startup_state,
    observations,
    now,
  });

  const queueWrite = enqueueBackboneCandidates(
    input.rootDir,
    input.business,
    orchestrator.ranked_candidates,
    now,
  );
  if (followupConsumeMode === "skip") {
    return {
      business: input.business,
      run_id: input.run_id,
      session_id: input.session_id,
      generation_source: "self-evolving-from-ideas",
      observations_generated: observations.length,
      backbone_queue_path: queueWrite.path,
      backbone_queued: queueWrite.queued,
      followup_consume_mode: followupConsumeMode,
      followup_closure_state: "closed",
      followup_dispatches_emitted: 0,
      followup_pending_entries: 0,
      followup_consumed_entries: 0,
      followup_closed_candidate_ids: [],
      followup_stale_repairable_candidate_ids: [],
      followup_hard_failed_candidate_ids: [],
      followup_unresolved_candidate_ids: [],
      followup_queue_entries_written: 0,
      warnings: [],
      orchestrator,
    };
  }

  const followupQueueStatePath =
    input.followupQueueStatePath ??
    path.join(
      input.rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
  const followupTelemetryPath =
    input.followupTelemetryPath ??
    path.join(
      input.rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );
  const followupConsume = consumeBackboneQueueToIdeasWorkflow({
    rootDir: input.rootDir,
    business: input.business,
    queueStatePath: followupQueueStatePath,
    telemetryPath: followupTelemetryPath,
  });

  return {
    business: input.business,
    run_id: input.run_id,
    session_id: input.session_id,
    generation_source: "self-evolving-from-ideas",
    observations_generated: observations.length,
    backbone_queue_path: queueWrite.path,
    backbone_queued: queueWrite.queued,
    followup_consume_mode: followupConsumeMode,
    followup_closure_state: followupConsume.closure_state,
    followup_dispatches_emitted: followupConsume.emitted_dispatches,
    followup_pending_entries: followupConsume.pending_entries,
    followup_consumed_entries: followupConsume.consumed_entries_marked,
    followup_closed_candidate_ids: followupConsume.closed_candidate_ids,
    followup_stale_repairable_candidate_ids: followupConsume.stale_repairable_candidate_ids,
    followup_hard_failed_candidate_ids: followupConsume.hard_failed_candidate_ids,
    followup_unresolved_candidate_ids: followupConsume.unresolved_candidate_ids,
    followup_queue_entries_written: followupConsume.queue_entries_written,
    warnings: [
      ...followupConsume.warnings,
      ...(followupConsume.error ? [followupConsume.error] : []),
    ],
    orchestrator,
  };
}

interface CliArgs {
  rootDir: string;
  business: string;
  dispatchesPath: string;
  startupStatePath: string;
  followupConsumeMode: "consume" | "skip";
  followupQueueStatePath: string;
  followupTelemetryPath: string;
  runId: string;
  sessionId: string;
  outputPath: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key?.startsWith("--")) continue;
    const value = argv[i + 1];
    if (value == null || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    i += 1;
  }
  const runId = flags.get("run-id") ?? `run-${new Date().toISOString().slice(0, 10)}`;
  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
  const rootDir = flags.get("root-dir") ?? defaultRootDir;
  const business = flags.get("business") ?? "BRIK";
  const followupConsumeMode = flags.get("followup-consume-mode");
  return {
    rootDir,
    business,
    dispatchesPath:
      flags.get("dispatches") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
    startupStatePath:
      flags.get("startup-state") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        business,
        "startup-state.json",
      ),
    followupConsumeMode:
      followupConsumeMode === "skip" || followupConsumeMode === "consume"
        ? followupConsumeMode
        : "consume",
    followupQueueStatePath:
      flags.get("followup-queue-state") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
    followupTelemetryPath:
      flags.get("followup-telemetry") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
    runId,
    sessionId: flags.get("session-id") ?? `${runId}-session`,
    outputPath: flags.get("output") ?? null,
  };
}

function resolvePath(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

function readDispatches(
  dispatchesPath: string,
  business: string,
): IdeasDispatchPacket[] {
  const raw = readFileSync(dispatchesPath, "utf-8");
  const parsed = JSON.parse(raw) as
    | IdeasDispatchPacket[]
    | {
        dispatches?: IdeasDispatchPacket[];
        entries?: Array<{ packet: IdeasDispatchPacket }>;
      };
  const packets = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.dispatches)
      ? parsed.dispatches
      : Array.isArray(parsed.entries)
        ? parsed.entries.map((entry) => entry.packet)
        : [];
  return packets.filter(
    (packet) => {
      const rootEventId =
        typeof packet.root_event_id === "string" ? packet.root_event_id : "";
      return (
        packet.business === business &&
        !rootEventId.startsWith("self-evolving:candidate:") &&
        !packet.evidence_refs.some((ref) => ref.startsWith("self-evolving-candidate:"))
      );
    },
  );
}

function readStartupState(startupStatePath: string): StartupState {
  const raw = readFileSync(startupStatePath, "utf-8");
  return JSON.parse(raw) as StartupState;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const dispatchesPath = resolvePath(args.rootDir, args.dispatchesPath);
  const startupStatePath = resolvePath(args.rootDir, args.startupStatePath);
  const followupQueueStatePath = resolvePath(args.rootDir, args.followupQueueStatePath);
  const followupTelemetryPath = resolvePath(args.rootDir, args.followupTelemetryPath);
  const outputPath = args.outputPath ? resolvePath(args.rootDir, args.outputPath) : null;
  const dispatches = readDispatches(dispatchesPath, args.business);
  const startupState = readStartupState(startupStatePath);
  const result = runSelfEvolvingFromIdeas({
    rootDir: args.rootDir,
    business: args.business,
    run_id: args.runId,
    session_id: args.sessionId,
    startup_state: startupState,
    dispatches,
    followupConsumeMode: args.followupConsumeMode,
    followupQueueStatePath,
    followupTelemetryPath,
  });
  const body = `${JSON.stringify(
    {
      ...result,
      source_paths: {
        dispatches: dispatchesPath,
        startup_state: startupStatePath,
        followup_queue_state: followupQueueStatePath,
        followup_telemetry: followupTelemetryPath,
      },
    },
    null,
    2,
  )}\n`;
  if (outputPath) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, body, "utf-8");
  }
  process.stdout.write(body);
}

if (process.argv[1]?.includes("self-evolving-from-ideas")) {
  main();
}
