import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { TrialDispatchPacket } from "../ideas/lp-do-ideas-trial.js";

import type { RankedCandidate } from "./self-evolving-candidates.js";
import type { MetaObservation, StartupState } from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import { buildHardSignature } from "./self-evolving-detector.js";
import {
  runSelfEvolvingOrchestrator,
  type SelfEvolvingOrchestratorResult,
} from "./self-evolving-orchestrator.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface SelfEvolvingBackboneQueueEntry {
  queued_at: string;
  business: string;
  candidate_id: string;
  route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  reason: string;
  executor_path: string;
  autonomy_cap: 1 | 2 | 3 | 4;
  priority: number;
}

function deriveObservationType(
  packet: TrialDispatchPacket,
): MetaObservation["observation_type"] {
  if (packet.status === "logged_no_action") return "routing_override";
  if (packet.status === "briefing_ready") return "operator_intervention";
  return "execution_event";
}

export function dispatchToMetaObservation(
  packet: TrialDispatchPacket,
  input: {
    business: string;
    run_id: string;
    session_id: string;
    index: number;
    now: Date;
  },
): MetaObservation {
  const location = packet.location_anchors[0] ?? packet.area_anchor;
  const hardSignature = buildHardSignature({
    fingerprint_version: "1",
    source_component: "lp-do-ideas",
    step_id: packet.status,
    normalized_path: location,
    error_or_reason_code: packet.artifact_id,
    effect_class: "read_only",
  });
  const timestamp = new Date(input.now.getTime() - input.index * 1000).toISOString();
  const intendedOutcome = packet.intended_outcome;
  const hasKpiHint =
    typeof intendedOutcome?.statement === "string" &&
    /(kpi|conversion|activation|retention|signup|lead)/i.test(intendedOutcome.statement);

  return {
    schema_version: "meta-observation.v1",
    observation_id: stableHash(`${packet.dispatch_id}|${timestamp}`).slice(0, 16),
    observation_type: deriveObservationType(packet),
    timestamp,
    business: input.business,
    actor_type: "automation",
    run_id: input.run_id,
    session_id: input.session_id,
    skill_id: "lp-do-ideas",
    container_id: null,
    artifact_refs: packet.evidence_refs,
    context_path: `lp-do-ideas/${packet.area_anchor}`,
    hard_signature: hardSignature,
    soft_cluster_id: packet.cluster_fingerprint,
    fingerprint_version: "1",
    repeat_count_window: 1,
    operator_minutes_estimate: packet.priority === "P1" ? 20 : 10,
    quality_impact_estimate: packet.priority === "P1" ? 0.8 : 0.3,
    detector_confidence: packet.confidence,
    severity: packet.priority === "P1" ? 0.8 : 0.4,
    inputs_hash: stableHash(`${packet.before_sha ?? "null"}|${packet.after_sha}`),
    outputs_hash: stableHash(
      `${packet.current_truth}|${packet.next_scope_now}|${packet.recommended_route}`,
    ),
    toolchain_version: "lp-do-ideas.v2",
    model_version: null,
    kpi_name: hasKpiHint ? "activation_rate" : null,
    kpi_value: null,
    kpi_unit: hasKpiHint ? "ratio" : null,
    aggregation_method: hasKpiHint ? "rate" : null,
    sample_size: null,
    data_quality_status: hasKpiHint ? "unknown" : null,
    data_quality_reason_code: hasKpiHint ? "dispatch_only_signal" : null,
    baseline_ref: null,
    measurement_window: hasKpiHint ? "7d" : null,
    traffic_segment: null,
    evidence_refs: packet.evidence_refs,
  };
}

function resolveBackboneQueuePath(rootDir: string, business: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, business, "backbone-queue.jsonl");
}

export function writeBackboneQueue(
  rootDir: string,
  business: string,
  candidates: RankedCandidate[],
): { path: string; queued: number } {
  const queuePath = resolveBackboneQueuePath(rootDir, business);
  mkdirSync(path.dirname(queuePath), { recursive: true });
  const existingEntries: SelfEvolvingBackboneQueueEntry[] = [];
  try {
    const raw = readFileSync(queuePath, "utf-8").trim();
    if (raw.length > 0) {
      for (const line of raw.split("\n")) {
        if (line.trim().length === 0) continue;
        existingEntries.push(JSON.parse(line) as SelfEvolvingBackboneQueueEntry);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const existingIds = new Set(existingEntries.map((entry) => entry.candidate_id));
  const incoming: SelfEvolvingBackboneQueueEntry[] = [];
  for (const candidate of candidates) {
    if (candidate.route.route === "reject") {
      continue;
    }
    if (existingIds.has(candidate.candidate.candidate_id)) {
      continue;
    }
    const priority = candidate.score.priority_score_v2 ?? candidate.score.priority_score_v1;
    incoming.push({
      queued_at: new Date().toISOString(),
      business,
      candidate_id: candidate.candidate.candidate_id,
      route: candidate.route.route,
      reason: candidate.route.reason,
      executor_path: candidate.candidate.executor_path,
      autonomy_cap: candidate.score.autonomy_cap,
      priority,
    });
  }

  const all = [...existingEntries, ...incoming];
  const body = all.map((entry) => JSON.stringify(entry)).join("\n");
  writeFileSync(queuePath, body.length > 0 ? `${body}\n` : "", "utf-8");
  return { path: queuePath, queued: incoming.length };
}

export interface SelfEvolvingFromIdeasInput {
  rootDir: string;
  business: string;
  run_id: string;
  session_id: string;
  startup_state: StartupState;
  dispatches: TrialDispatchPacket[];
  now?: Date;
}

export interface SelfEvolvingFromIdeasResult {
  observations_generated: number;
  backbone_queue_path: string;
  backbone_queued: number;
  orchestrator: SelfEvolvingOrchestratorResult;
}

export function runSelfEvolvingFromIdeas(
  input: SelfEvolvingFromIdeasInput,
): SelfEvolvingFromIdeasResult {
  const now = input.now ?? new Date();
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

  const queueWrite = writeBackboneQueue(
    input.rootDir,
    input.business,
    orchestrator.ranked_candidates,
  );

  return {
    observations_generated: observations.length,
    backbone_queue_path: queueWrite.path,
    backbone_queued: queueWrite.queued,
    orchestrator,
  };
}

interface CliArgs {
  rootDir: string;
  business: string;
  dispatchesPath: string;
  startupStatePath: string;
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
  return {
    rootDir: flags.get("root-dir") ?? process.cwd(),
    business: flags.get("business") ?? "BRIK",
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
        "BRIK",
        "startup-state.json",
      ),
    runId,
    sessionId: flags.get("session-id") ?? `${runId}-session`,
    outputPath: flags.get("output") ?? null,
  };
}

function readDispatches(dispatchesPath: string): TrialDispatchPacket[] {
  const raw = readFileSync(dispatchesPath, "utf-8");
  const parsed = JSON.parse(raw) as
    | TrialDispatchPacket[]
    | { entries?: Array<{ packet: TrialDispatchPacket }> };
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.entries)) {
    return parsed.entries.map((entry) => entry.packet);
  }
  return [];
}

function readStartupState(startupStatePath: string): StartupState {
  const raw = readFileSync(startupStatePath, "utf-8");
  return JSON.parse(raw) as StartupState;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const dispatches = readDispatches(args.dispatchesPath);
  const startupState = readStartupState(args.startupStatePath);
  const result = runSelfEvolvingFromIdeas({
    rootDir: args.rootDir,
    business: args.business,
    run_id: args.runId,
    session_id: args.sessionId,
    startup_state: startupState,
    dispatches,
  });

  const body = `${JSON.stringify(result, null, 2)}\n`;
  if (args.outputPath) {
    mkdirSync(path.dirname(args.outputPath), { recursive: true });
    writeFileSync(args.outputPath, body, "utf-8");
  }
  process.stdout.write(body);
}

if (process.argv[1]?.includes("self-evolving-from-ideas")) {
  main();
}
