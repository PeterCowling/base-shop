import type {
  CutoverPhase,
  SuppressionReason,
} from "./lp-do-ideas-trial.js";
import type { QueueLane, QueueState } from "./lp-do-ideas-trial-queue.js";

export type TelemetrySourceMode = "shadow" | "enforced";

export interface IdeasCycleTelemetrySnapshot {
  cycle_id: string;
  phase: CutoverPhase;
  mode: TelemetrySourceMode;
  root_event_ids?: readonly string[];
  root_event_count?: number;
  candidate_count: number;
  admitted_cluster_count: number;
  suppression_reason_counts?: Partial<Record<SuppressionReason, number>>;
}

export interface QueueEntrySnapshot {
  dispatch_id: string;
  lane: QueueLane;
  queue_state: QueueState;
  event_timestamp: string;
  processing_timestamp: string;
}

export interface IdeasMetricsRollupInput {
  cycle_snapshots: readonly IdeasCycleTelemetrySnapshot[];
  queue_entries: readonly QueueEntrySnapshot[];
  now?: Date;
}

export type InvariantGroup =
  | "same_origin_attach"
  | "anti_self_trigger"
  | "lineage_cap"
  | "cooldown"
  | "materiality"
  | "projection_immunity"
  | "policy_gate";

export interface ReconciledCycleSnapshot {
  cycle_id: string;
  phase: CutoverPhase;
  selected_mode: TelemetrySourceMode;
  shadow_present: boolean;
  enforced_present: boolean;
  root_event_count: number;
  candidate_count: number;
  admitted_cluster_count: number;
  suppression_reason_counts: Partial<Record<SuppressionReason, number>>;
}

export interface CycleMetric {
  cycle_id: string;
  phase: CutoverPhase;
  fan_out_raw: number;
  fan_out_admitted: number;
  loop_incidence: number;
  root_event_count: number;
  candidate_count: number;
  admitted_cluster_count: number;
  loop_guard_suppressed_count: number;
  selected_mode: TelemetrySourceMode;
}

export interface MetricsActionRecord {
  action_id: string;
  metric: "fan_out_admitted" | "loop_incidence" | "queue_age_p95_days";
  cycle_ids: string[];
  lane?: QueueLane;
  observed_value: number;
  threshold: number;
  comparator: "gt";
  recommended_action: string;
  reason: string;
}

export interface IdeasMetricsRollup {
  generated_at: string;
  cycle_count: number;
  root_event_count: number;
  candidate_count: number;
  admitted_cluster_count: number;
  suppressed_by_loop_guards: number;
  fan_out_raw: number;
  fan_out_admitted: number;
  loop_incidence: number;
  queue_age_p95_days: Record<QueueLane, number>;
  throughput: number;
  lane_mix: {
    DO_completed: number;
    IMPROVE_completed: number;
    ratio: string;
  };
  suppression_by_invariant: Record<InvariantGroup, number>;
  suppression_reason_totals: Partial<Record<SuppressionReason, number>>;
  cycle_metrics: CycleMetric[];
  provenance: {
    shadow_cycle_count: number;
    enforced_cycle_count: number;
    reconciled_cycles: ReconciledCycleSnapshot[];
  };
  action_records: MetricsActionRecord[];
}

const LOOP_GUARD_REASON_TO_GROUP: Partial<Record<SuppressionReason, InvariantGroup>> = {
  duplicate_event: "same_origin_attach",
  anti_self_trigger_non_material: "anti_self_trigger",
  lineage_depth_cap_exceeded: "lineage_cap",
  cooldown_non_material: "cooldown",
  non_material_delta: "materiality",
  projection_immunity: "projection_immunity",
  unknown_artifact: "policy_gate",
  inactive_artifact: "policy_gate",
  trigger_policy_blocked: "policy_gate",
  missing_registry_for_source_primary: "policy_gate",
  pack_without_source_delta: "policy_gate",
};

const LOOP_GUARD_GROUPS = new Set<InvariantGroup>([
  "same_origin_attach",
  "anti_self_trigger",
  "lineage_cap",
  "cooldown",
  "materiality",
]);

const ALERT_THRESHOLD_FAN_OUT_ADMITTED = 1.5;
const ALERT_THRESHOLD_LOOP_INCIDENCE = 0.25;
const ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS = 21;

function coerceCount(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value as number));
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function roundMetric(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function p95(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil(0.95 * sorted.length) - 1;
  const index = Math.min(sorted.length - 1, Math.max(0, rank));
  return sorted[index];
}

function ageDays(eventTimestamp: string, now: Date): number {
  const ts = Date.parse(eventTimestamp);
  if (Number.isNaN(ts)) {
    return 0;
  }
  const deltaMs = Math.max(0, now.getTime() - ts);
  return deltaMs / (24 * 60 * 60 * 1000);
}

function toActionId(metric: string, scope: string): string {
  return `${metric}:${scope}`;
}

function countRootEvents(snapshot: IdeasCycleTelemetrySnapshot): number {
  const ids = (snapshot.root_event_ids ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (ids.length > 0) {
    return new Set(ids).size;
  }
  return coerceCount(snapshot.root_event_count);
}

function normalizeSuppressionCounts(
  suppressionCounts: Partial<Record<SuppressionReason, number>> | undefined,
): Partial<Record<SuppressionReason, number>> {
  const normalized: Partial<Record<SuppressionReason, number>> = {};
  if (!suppressionCounts) {
    return normalized;
  }

  for (const [reason, count] of Object.entries(suppressionCounts)) {
    normalized[reason as SuppressionReason] = coerceCount(count);
  }
  return normalized;
}

function mergeSuppressionTotals(
  target: Partial<Record<SuppressionReason, number>>,
  source: Partial<Record<SuppressionReason, number>>,
): void {
  for (const [reason, count] of Object.entries(source)) {
    const key = reason as SuppressionReason;
    target[key] = (target[key] ?? 0) + coerceCount(count);
  }
}

function buildInvariantTotals(
  suppressionTotals: Partial<Record<SuppressionReason, number>>,
): Record<InvariantGroup, number> {
  const totals: Record<InvariantGroup, number> = {
    same_origin_attach: 0,
    anti_self_trigger: 0,
    lineage_cap: 0,
    cooldown: 0,
    materiality: 0,
    projection_immunity: 0,
    policy_gate: 0,
  };

  for (const [reason, count] of Object.entries(suppressionTotals)) {
    const group = LOOP_GUARD_REASON_TO_GROUP[reason as SuppressionReason];
    if (!group) {
      continue;
    }
    totals[group] += coerceCount(count);
  }

  return totals;
}

function reconcileCycles(
  snapshots: readonly IdeasCycleTelemetrySnapshot[],
): ReconciledCycleSnapshot[] {
  const grouped = new Map<string, IdeasCycleTelemetrySnapshot[]>();

  for (const snapshot of snapshots) {
    const key = `${snapshot.cycle_id}::${snapshot.phase}`;
    const existing = grouped.get(key) ?? [];
    existing.push(snapshot);
    grouped.set(key, existing);
  }

  const reconciled: ReconciledCycleSnapshot[] = [];
  for (const [key, group] of grouped.entries()) {
    const [cycleId, phase] = key.split("::");
    const enforced = group.find((snapshot) => snapshot.mode === "enforced");
    const shadow = group.find((snapshot) => snapshot.mode === "shadow");
    const selected = enforced ?? shadow;
    if (!selected) {
      continue;
    }

    reconciled.push({
      cycle_id: cycleId,
      phase: phase as CutoverPhase,
      selected_mode: selected.mode,
      shadow_present: Boolean(shadow),
      enforced_present: Boolean(enforced),
      root_event_count: countRootEvents(selected),
      candidate_count: coerceCount(selected.candidate_count),
      admitted_cluster_count: coerceCount(selected.admitted_cluster_count),
      suppression_reason_counts: normalizeSuppressionCounts(
        selected.suppression_reason_counts,
      ),
    });
  }

  reconciled.sort((left, right) => {
    const cycleCmp = left.cycle_id.localeCompare(right.cycle_id);
    if (cycleCmp !== 0) {
      return cycleCmp;
    }
    return left.phase.localeCompare(right.phase);
  });

  return reconciled;
}

function buildCycleMetrics(
  reconciled: readonly ReconciledCycleSnapshot[],
): CycleMetric[] {
  const metrics: CycleMetric[] = [];
  for (const cycle of reconciled) {
    const invariantTotals = buildInvariantTotals(cycle.suppression_reason_counts);
    const loopGuardSuppressedCount = Object.entries(invariantTotals)
      .filter(([group]) => LOOP_GUARD_GROUPS.has(group as InvariantGroup))
      .reduce((sum, [, count]) => sum + count, 0);

    metrics.push({
      cycle_id: cycle.cycle_id,
      phase: cycle.phase,
      fan_out_raw: roundMetric(
        safeRatio(cycle.candidate_count, cycle.root_event_count),
      ),
      fan_out_admitted: roundMetric(
        safeRatio(cycle.admitted_cluster_count, cycle.root_event_count),
      ),
      loop_incidence: roundMetric(
        safeRatio(loopGuardSuppressedCount, cycle.candidate_count),
      ),
      root_event_count: cycle.root_event_count,
      candidate_count: cycle.candidate_count,
      admitted_cluster_count: cycle.admitted_cluster_count,
      loop_guard_suppressed_count: loopGuardSuppressedCount,
      selected_mode: cycle.selected_mode,
    });
  }
  return metrics;
}

function buildConsecutiveBreachAlert(
  cycleMetrics: readonly CycleMetric[],
  metric: "fan_out_admitted" | "loop_incidence",
  threshold: number,
  recommendedAction: string,
): MetricsActionRecord[] {
  const alerts: MetricsActionRecord[] = [];
  let streak: CycleMetric[] = [];

  for (const cycle of cycleMetrics) {
    const value = cycle[metric];
    if (value > threshold) {
      streak.push(cycle);
      continue;
    }

    if (streak.length >= 2) {
      const cycleIds = streak.map((entry) => entry.cycle_id);
      alerts.push({
        action_id: toActionId(metric, cycleIds.join("+")),
        metric,
        cycle_ids: cycleIds,
        observed_value: streak[streak.length - 1][metric],
        threshold,
        comparator: "gt",
        recommended_action: recommendedAction,
        reason: `${metric} exceeded ${threshold} for ${streak.length} consecutive cycles`,
      });
    }
    streak = [];
  }

  if (streak.length >= 2) {
    const cycleIds = streak.map((entry) => entry.cycle_id);
    alerts.push({
      action_id: toActionId(metric, cycleIds.join("+")),
      metric,
      cycle_ids: cycleIds,
      observed_value: streak[streak.length - 1][metric],
      threshold,
      comparator: "gt",
      recommended_action: recommendedAction,
      reason: `${metric} exceeded ${threshold} for ${streak.length} consecutive cycles`,
    });
  }

  return alerts;
}

export function rollupIdeasMetrics(
  input: IdeasMetricsRollupInput,
): IdeasMetricsRollup {
  const now = input.now ?? new Date();
  const reconciledCycles = reconcileCycles(input.cycle_snapshots);
  const cycleMetrics = buildCycleMetrics(reconciledCycles);

  const suppressionReasonTotals: Partial<Record<SuppressionReason, number>> = {};
  for (const cycle of reconciledCycles) {
    mergeSuppressionTotals(suppressionReasonTotals, cycle.suppression_reason_counts);
  }
  const suppressionByInvariant = buildInvariantTotals(suppressionReasonTotals);

  const rootEventCount = reconciledCycles.reduce(
    (sum, cycle) => sum + cycle.root_event_count,
    0,
  );
  const candidateCount = reconciledCycles.reduce(
    (sum, cycle) => sum + cycle.candidate_count,
    0,
  );
  const admittedClusterCount = reconciledCycles.reduce(
    (sum, cycle) => sum + cycle.admitted_cluster_count,
    0,
  );
  const suppressedByLoopGuards = Object.entries(suppressionByInvariant)
    .filter(([group]) => LOOP_GUARD_GROUPS.has(group as InvariantGroup))
    .reduce((sum, [, count]) => sum + count, 0);

  const pendingEntries = input.queue_entries.filter((entry) => entry.queue_state === "enqueued");
  const pendingAgesByLane: Record<QueueLane, number[]> = {
    DO: [],
    IMPROVE: [],
  };
  for (const entry of pendingEntries) {
    pendingAgesByLane[entry.lane].push(ageDays(entry.event_timestamp, now));
  }

  const queueAgeP95Days: Record<QueueLane, number> = {
    DO: roundMetric(p95(pendingAgesByLane.DO)),
    IMPROVE: roundMetric(p95(pendingAgesByLane.IMPROVE)),
  };

  const processedEntries = input.queue_entries.filter((entry) => entry.queue_state === "processed");
  const doCompleted = processedEntries.filter((entry) => entry.lane === "DO").length;
  const improveCompleted = processedEntries.filter((entry) => entry.lane === "IMPROVE").length;
  const cycleCount = reconciledCycles.length;

  const throughput = roundMetric(safeRatio(processedEntries.length, cycleCount));
  const laneMixRatio = `${doCompleted}:${improveCompleted}`;

  const actionRecords: MetricsActionRecord[] = [];
  actionRecords.push(
    ...buildConsecutiveBreachAlert(
      cycleMetrics,
      "fan_out_admitted",
      ALERT_THRESHOLD_FAN_OUT_ADMITTED,
      "Investigate clustering quality and candidate clustering boundaries.",
    ),
  );
  actionRecords.push(
    ...buildConsecutiveBreachAlert(
      cycleMetrics,
      "loop_incidence",
      ALERT_THRESHOLD_LOOP_INCIDENCE,
      "Review invariant tuning (same-origin, cooldown, and materiality filters).",
    ),
  );

  if (queueAgeP95Days.DO > ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS) {
    actionRecords.push({
      action_id: toActionId("queue_age_p95_days", "DO"),
      metric: "queue_age_p95_days",
      cycle_ids: [],
      lane: "DO",
      observed_value: queueAgeP95Days.DO,
      threshold: ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS,
      comparator: "gt",
      recommended_action: "Rebalance WIP caps or reduce DO admissions.",
      reason: "queue_age_p95_days for DO exceeded threshold.",
    });
  }

  if (queueAgeP95Days.IMPROVE > ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS) {
    actionRecords.push({
      action_id: toActionId("queue_age_p95_days", "IMPROVE"),
      metric: "queue_age_p95_days",
      cycle_ids: [],
      lane: "IMPROVE",
      observed_value: queueAgeP95Days.IMPROVE,
      threshold: ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS,
      comparator: "gt",
      recommended_action: "Rebalance WIP caps or reduce IMPROVE admissions.",
      reason: "queue_age_p95_days for IMPROVE exceeded threshold.",
    });
  }

  return {
    generated_at: now.toISOString(),
    cycle_count: cycleCount,
    root_event_count: rootEventCount,
    candidate_count: candidateCount,
    admitted_cluster_count: admittedClusterCount,
    suppressed_by_loop_guards: suppressedByLoopGuards,
    fan_out_raw: roundMetric(safeRatio(candidateCount, rootEventCount)),
    fan_out_admitted: roundMetric(
      safeRatio(admittedClusterCount, rootEventCount),
    ),
    loop_incidence: roundMetric(
      safeRatio(suppressedByLoopGuards, candidateCount),
    ),
    queue_age_p95_days: queueAgeP95Days,
    throughput,
    lane_mix: {
      DO_completed: doCompleted,
      IMPROVE_completed: improveCompleted,
      ratio: laneMixRatio,
    },
    suppression_by_invariant: suppressionByInvariant,
    suppression_reason_totals: suppressionReasonTotals,
    cycle_metrics: cycleMetrics,
    provenance: {
      shadow_cycle_count: reconciledCycles.filter(
        (cycle) => cycle.selected_mode === "shadow",
      ).length,
      enforced_cycle_count: reconciledCycles.filter(
        (cycle) => cycle.selected_mode === "enforced",
      ).length,
      reconciled_cycles: reconciledCycles,
    },
    action_records: actionRecords,
  };
}
