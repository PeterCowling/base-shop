import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  type QueueDispatch,
  readQueueStateFile,
} from "../ideas/lp-do-ideas-queue-state-file.js";

import {
  DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  evaluateMatureBoundary,
} from "./self-evolving-boundary.js";
import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  MetaObservation,
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
  StartupState,
} from "./self-evolving-contracts.js";
import { buildDashboardSnapshot } from "./self-evolving-dashboard.js";
import { buildDependencyGraphSnapshot } from "./self-evolving-dependency-graph.js";
import { buildPolicyEvaluationDataset } from "./self-evolving-evaluation.js";
import type { SelfEvolvingEvent } from "./self-evolving-events.js";
import { buildPromotionGateDataset } from "./self-evolving-promotion-gate.js";
import { deriveBoundarySignalSnapshotFromStartupState } from "./self-evolving-signal-helpers.js";
import { buildSurvivalPolicySignals } from "./self-evolving-survival.js";

interface CliArgs {
  rootDir: string;
  observationsPath: string;
  candidatesPath: string;
  startupStatePath: string;
  policyStatePath: string;
  policyDecisionPath: string;
  queueStatePath: string;
  eventsPath: string;
  business: string;
}

function defaultRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function resolvePath(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    index += 1;
  }

  const rootDir = flags.get("root-dir") ?? defaultRootDir();
  const business = flags.get("business") ?? "BRIK";
  const defaultBusinessRoot = path.join(
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    business,
  );

  return {
    rootDir,
    business,
    observationsPath: resolvePath(
      rootDir,
      flags.get("observations") ?? path.join(defaultBusinessRoot, "observations.jsonl"),
    ),
    candidatesPath: resolvePath(
      rootDir,
      flags.get("candidates") ?? path.join(defaultBusinessRoot, "candidates.json"),
    ),
    startupStatePath: resolvePath(
      rootDir,
      flags.get("startup-state") ?? path.join(defaultBusinessRoot, "startup-state.json"),
    ),
    policyStatePath: resolvePath(
      rootDir,
      flags.get("policy-state") ?? path.join(defaultBusinessRoot, "policy-state.json"),
    ),
    policyDecisionPath: resolvePath(
      rootDir,
      flags.get("policy-decisions") ?? path.join(defaultBusinessRoot, "policy-decisions.jsonl"),
    ),
    queueStatePath: resolvePath(
      rootDir,
      flags.get("queue-state") ??
        path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    ),
    eventsPath: resolvePath(
      rootDir,
      flags.get("events") ?? path.join(defaultBusinessRoot, "events.jsonl"),
    ),
  };
}

function readObservations(filePath: string): MetaObservation[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) return [];
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as MetaObservation);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function readRankedCandidates(filePath: string): RankedCandidate[] {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { candidates?: RankedCandidate[] };
    if (Array.isArray(parsed.candidates)) {
      return parsed.candidates;
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function readStartupState(filePath: string): StartupState | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as StartupState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function readPolicyStateFile(filePath: string): SelfEvolvingPolicyState | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as SelfEvolvingPolicyState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function readPolicyDecisionFile(filePath: string): PolicyDecisionRecord[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as PolicyDecisionRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function readLifecycleEventsFile(filePath: string): SelfEvolvingEvent[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as SelfEvolvingEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function collectWarnings(args: CliArgs): string[] {
  const warnings: string[] = [];
  if (!existsSync(args.observationsPath)) {
    warnings.push(`Missing observations file: ${args.observationsPath}`);
  }
  if (!existsSync(args.candidatesPath)) {
    warnings.push(`Missing candidates file: ${args.candidatesPath}`);
  }
  if (!existsSync(args.startupStatePath)) {
    warnings.push(`Missing startup-state file: ${args.startupStatePath}`);
  }
  if (!existsSync(args.policyStatePath)) {
    warnings.push(`Missing policy-state file: ${args.policyStatePath}`);
  }
  if (!existsSync(args.policyDecisionPath)) {
    warnings.push(`Missing policy-decision log: ${args.policyDecisionPath}`);
  }
  if (!existsSync(args.queueStatePath)) {
    warnings.push(`Missing queue-state file: ${args.queueStatePath}`);
  }
  if (!existsSync(args.eventsPath)) {
    warnings.push(`Missing event log: ${args.eventsPath}`);
  }
  return warnings;
}

function summarizeExplorationDecisions(
  decisions: readonly PolicyDecisionRecord[],
): {
  total: number;
  stochastic: number;
  prioritized: number;
  applied: number;
  shadow: number;
} {
  let total = 0;
  let stochastic = 0;
  let prioritized = 0;
  let applied = 0;
  let shadow = 0;

  for (const decision of decisions) {
    if (decision.decision_type !== "exploration_rank") {
      continue;
    }
    total += 1;
    if (decision.decision_mode === "stochastic") {
      stochastic += 1;
    }
    if (decision.chosen_action === "prioritized") {
      prioritized += 1;
    }
    if (decision.exploration_rank?.policy_mode === "advisory") {
      applied += 1;
    }
    if (decision.exploration_rank?.policy_mode === "shadow") {
      shadow += 1;
    }
  }

  return { total, stochastic, prioritized, applied, shadow };
}

export function buildSelfEvolvingReportData(input: {
  business: string;
  generated_at: string;
  source_paths: {
    observations: string;
    candidates: string;
    startup_state: string;
    policy_state: string;
    policy_decisions: string;
    queue_state: string;
    events: string;
  };
  warnings: string[];
  observations: MetaObservation[];
  ranked_candidates: RankedCandidate[];
  startup_state: StartupState | null;
  policy_state: SelfEvolvingPolicyState | null;
  policy_decisions: PolicyDecisionRecord[];
  queue_dispatches: QueueDispatch[];
  lifecycle_events: SelfEvolvingEvent[];
}): Record<string, unknown> {
  const evaluation = buildPolicyEvaluationDataset({
    decisions: input.policy_decisions,
    queue_dispatches: input.queue_dispatches,
    lifecycle_events: input.lifecycle_events,
    now: new Date(input.generated_at),
  });
  const dependencyGraph = buildDependencyGraphSnapshot({
    business_id: input.business,
    ranked_candidates: input.ranked_candidates,
    policy_decisions: input.policy_decisions,
    generated_at: input.generated_at,
    snapshot_id: `report-${input.generated_at}`,
  });
  const survivalSignals = buildSurvivalPolicySignals({
    evaluation_dataset: evaluation,
    hold_window_days: input.policy_state?.active_constraint_profile.hold_window_days ?? 7,
  });

  const dashboard = buildDashboardSnapshot({
    observations: input.observations,
    ranked_candidates: input.ranked_candidates,
    wipCap: 10,
    policy_state: input.policy_state,
    decision_records_count: input.policy_decisions.length,
    policy_decisions: input.policy_decisions,
    evaluation_summary: evaluation.summary,
    dependency_graph: dependencyGraph,
    survival_signals: survivalSignals,
  });
  const explorationSummary = summarizeExplorationDecisions(input.policy_decisions);
  const promotionGateSummary = buildPromotionGateDataset({
    decisions: input.policy_decisions,
  });

  const boundarySnapshot = deriveBoundarySignalSnapshotFromStartupState(input.startup_state);
  const boundaryDecision = evaluateMatureBoundary(
    boundarySnapshot.signals,
    DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  );

  return {
    business: input.business,
    generated_at: input.generated_at,
    source_paths: input.source_paths,
    warnings: input.warnings,
    startup_state_present: input.startup_state != null,
    policy_state_present: input.policy_state != null,
    lifecycle_events_count: input.lifecycle_events.length,
    queue_dispatch_count: input.queue_dispatches.length,
    dashboard,
    dependency_graph:
      dependencyGraph == null
        ? {
            status: "empty",
            node_count: 0,
            edge_count: 0,
            top_candidate_bottlenecks: [],
          }
        : {
            status: "computed",
            snapshot_id: dependencyGraph.snapshot_id,
            node_count: dependencyGraph.node_count,
            edge_count: dependencyGraph.edge_count,
            top_candidate_bottlenecks: dependencyGraph.candidate_signals.slice(0, 5),
            critical_path: dependencyGraph.analysis.critical_path,
          },
    survival_policy: {
      snapshot_id: survivalSignals.snapshot_id,
      total_records: survivalSignals.total_records,
      verified_curve_status: survivalSignals.verified_outcome_curve.status,
      closure_curve_status: survivalSignals.closure_curve.status,
      route_profiles: survivalSignals.route_profiles,
    },
    policy_evaluation: {
      summary: evaluation.summary,
      sample_unready_records: evaluation.records
        .filter((record) => !record.evaluation_ready)
        .slice(0, 5)
        .map((record) => ({
          decision_id: record.decision_id,
          candidate_id: record.candidate_id,
          evaluation_status: record.evaluation_status,
          queue_state: record.queue_state,
          maturity_status: record.maturity_status,
          measurement_status: record.measurement_status,
          outcome_reason_code: record.outcome_reason_code,
        })),
    },
    policy_decisions: {
      total: input.policy_decisions.length,
      exploration: explorationSummary,
      promotion_gate: promotionGateSummary,
    },
    evidence_policy: {
      route_policy: {
        exploratory: "fact_find_only",
        structural: "fact_find_only",
        measured:
          "stronger_routes_allowed_only_when_declared_measured_posture_and_measurement_ready_fields_are_present",
      },
      write_back_policy:
        "write_back_requires_declared_measured_posture_with_verified_contract_fields",
      posture_summary: {
        effective_grade_counts: dashboard.posture.effective_grade_counts,
        declared_grade_counts: dashboard.posture.declared_grade_counts,
        measurement_contract_status_counts:
          dashboard.posture.measurement_contract_status_counts,
        source_counts: dashboard.posture.source_counts,
        underlying_field_counts: dashboard.posture.underlying_field_counts,
        policy_eligibility_counts: dashboard.posture.policy_eligibility_counts,
      },
    },
    boundary: {
      ...boundaryDecision,
      signals_used: boundarySnapshot.signals,
      signal_sources: boundarySnapshot.sources,
      thresholds: DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
    },
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const observations = readObservations(args.observationsPath);
  const rankedCandidates = readRankedCandidates(args.candidatesPath);
  const startupState = readStartupState(args.startupStatePath);
  const policyState = readPolicyStateFile(args.policyStatePath);
  const policyDecisions = readPolicyDecisionFile(args.policyDecisionPath);
  const queueResult = readQueueStateFile(args.queueStatePath);
  const queueDispatches = queueResult.ok ? queueResult.queue.dispatches : [];
  const lifecycleEvents = readLifecycleEventsFile(args.eventsPath);
  const warnings = collectWarnings(args);

  const report = buildSelfEvolvingReportData({
    business: args.business,
    generated_at: new Date().toISOString(),
    source_paths: {
      observations: args.observationsPath,
      candidates: args.candidatesPath,
      startup_state: args.startupStatePath,
      policy_state: args.policyStatePath,
      policy_decisions: args.policyDecisionPath,
      queue_state: args.queueStatePath,
      events: args.eventsPath,
    },
    warnings,
    observations,
    ranked_candidates: rankedCandidates,
    startup_state: startupState,
    policy_state: policyState,
    policy_decisions: policyDecisions,
    queue_dispatches: queueDispatches,
    lifecycle_events: lifecycleEvents,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-report")) {
  main();
}
