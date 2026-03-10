import type { PolicyDecisionRecord } from "./self-evolving-contracts.js";
import type {
  PolicyEvaluationDataset,
  PolicyEvaluationRecord,
} from "./self-evolving-evaluation.js";

type AuditMetricStatus = "measured" | "insufficient_data";

export interface PolicyCalibrationBin {
  lower_bound: number;
  upper_bound: number;
  sample_size: number;
  mean_predicted_positive_probability: number | null;
  observed_positive_rate: number | null;
  calibration_gap: number | null;
}

export interface PolicyCalibrationTelemetry {
  status: AuditMetricStatus;
  sample_size: number;
  positive_outcome_count: number;
  mean_predicted_positive_probability: number | null;
  observed_positive_rate: number | null;
  brier_score: number | null;
  mean_absolute_error: number | null;
  bins: PolicyCalibrationBin[];
  source: "candidate_route_belief_audit";
}

export interface ExplorationRegretBatchReplay {
  exploration_batch_id: string;
  policy_mode: "off" | "shadow" | "advisory";
  budget_slots: number;
  total_candidates: number;
  observed_candidates: number;
  measured: boolean;
  chosen_positive_count: number | null;
  optimal_positive_count: number | null;
  regret: number | null;
}

export interface PolicyRegretTelemetry {
  status: AuditMetricStatus;
  total_batches: number;
  measured_batches: number;
  sample_coverage_rate: number | null;
  total_regret: number | null;
  average_regret: number | null;
  max_regret: number | null;
  batches: ExplorationRegretBatchReplay[];
  source: "exploration_batch_positive_outcome_replay";
}

export interface OutcomeRateTelemetry {
  sample_size: number;
  positive_outcome_count: number;
  positive_outcome_rate: number | null;
  status: AuditMetricStatus;
}

export interface OverrideReasonBreakdown {
  reason_code: string;
  count: number;
  candidate_count: number;
  source_layer: "route" | "portfolio" | "exploration" | "promotion_gate" | "unknown";
}

export interface OverrideTelemetry {
  total_overrides: number;
  overridden_candidates: number;
  route_overrides: number;
  portfolio_overrides: number;
  exploration_overrides: number;
  promotion_gate_overrides: number;
  unknown_overrides: number;
  overridden_outcomes: OutcomeRateTelemetry;
  non_overridden_outcomes: OutcomeRateTelemetry;
  reason_breakdown: OverrideReasonBreakdown[];
}

export interface PolicyVersionComparison {
  policy_version: string;
  decision_count: number;
  observed_count: number;
  pending_count: number;
  censored_count: number;
  missing_count: number;
  positive_sample_size: number;
  positive_outcome_count: number;
  positive_outcome_rate: number | null;
  mean_predicted_positive_probability: number | null;
  calibration_gap: number | null;
}

export interface PolicyAuditTelemetry {
  schema_version: "policy-audit.v1";
  generated_at: string;
  belief_quality: {
    calibration: PolicyCalibrationTelemetry;
  };
  policy_quality: {
    exploration_regret: PolicyRegretTelemetry;
    policy_version_comparison: PolicyVersionComparison[];
  };
  operator_intervention: {
    overrides: OverrideTelemetry;
  };
}

interface CalibrationSample {
  predicted_probability: number;
  positive_outcome: boolean;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function candidateCreatedKey(candidateId: string, createdAt: string): string {
  return `${candidateId}|${createdAt}`;
}

function round(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildOutcomeRateTelemetry(records: readonly PolicyEvaluationRecord[]): OutcomeRateTelemetry {
  const validRecords = records.filter((record) => record.positive_outcome !== null);
  const positiveOutcomeCount = validRecords.filter(
    (record) => record.positive_outcome === true,
  ).length;
  return {
    sample_size: validRecords.length,
    positive_outcome_count: positiveOutcomeCount,
    positive_outcome_rate:
      validRecords.length > 0 ? round(positiveOutcomeCount / validRecords.length) : null,
    status: validRecords.length > 0 ? "measured" : "insufficient_data",
  };
}

function bucketIndex(probability: number): number {
  if (probability >= 0.8) return 4;
  if (probability >= 0.6) return 3;
  if (probability >= 0.4) return 2;
  if (probability >= 0.2) return 1;
  return 0;
}

function buildCalibrationBins(samples: readonly CalibrationSample[]): PolicyCalibrationBin[] {
  const buckets = [
    { lower_bound: 0, upper_bound: 0.2, values: [] as CalibrationSample[] },
    { lower_bound: 0.2, upper_bound: 0.4, values: [] as CalibrationSample[] },
    { lower_bound: 0.4, upper_bound: 0.6, values: [] as CalibrationSample[] },
    { lower_bound: 0.6, upper_bound: 0.8, values: [] as CalibrationSample[] },
    { lower_bound: 0.8, upper_bound: 1, values: [] as CalibrationSample[] },
  ];

  for (const sample of samples) {
    buckets[bucketIndex(sample.predicted_probability)]?.values.push(sample);
  }

  return buckets.map((bucket) => {
    const sampleSize = bucket.values.length;
    const meanPredicted =
      sampleSize > 0
        ? round(
            bucket.values.reduce(
              (sum, sample) => sum + sample.predicted_probability,
              0,
            ) / sampleSize,
          )
        : null;
    const observedPositiveRate =
      sampleSize > 0
        ? round(
            bucket.values.reduce(
              (sum, sample) => sum + (sample.positive_outcome ? 1 : 0),
              0,
            ) / sampleSize,
          )
        : null;
    return {
      lower_bound: bucket.lower_bound,
      upper_bound: bucket.upper_bound,
      sample_size: sampleSize,
      mean_predicted_positive_probability: meanPredicted,
      observed_positive_rate: observedPositiveRate,
      calibration_gap:
        meanPredicted != null && observedPositiveRate != null
          ? round(observedPositiveRate - meanPredicted)
          : null,
    };
  });
}

function buildCalibrationTelemetry(input: {
  decisions: readonly PolicyDecisionRecord[];
  evaluation_by_decision_id: ReadonlyMap<string, PolicyEvaluationRecord>;
}): PolicyCalibrationTelemetry {
  const samples = input.decisions
    .filter((decision) => decision.decision_type === "candidate_route")
    .flatMap((decision): CalibrationSample[] => {
      const predicted =
        decision.belief_audit?.positive_impact_probability_mean ?? null;
      const evaluation = input.evaluation_by_decision_id.get(decision.decision_id);
      if (predicted == null || evaluation?.positive_outcome == null) {
        return [];
      }
      return [
        {
          predicted_probability: predicted,
          positive_outcome: evaluation.positive_outcome,
        },
      ];
    });

  if (samples.length === 0) {
    return {
      status: "insufficient_data",
      sample_size: 0,
      positive_outcome_count: 0,
      mean_predicted_positive_probability: null,
      observed_positive_rate: null,
      brier_score: null,
      mean_absolute_error: null,
      bins: buildCalibrationBins([]),
      source: "candidate_route_belief_audit",
    };
  }

  const positiveOutcomeCount = samples.filter((sample) => sample.positive_outcome).length;
  const meanPredicted = mean(samples.map((sample) => sample.predicted_probability));
  const observedPositiveRate = round(positiveOutcomeCount / samples.length);
  const brierScore = round(
    samples.reduce((sum, sample) => {
      const actual = sample.positive_outcome ? 1 : 0;
      return sum + (sample.predicted_probability - actual) ** 2;
    }, 0) / samples.length,
  );
  const meanAbsoluteError = round(
    samples.reduce((sum, sample) => {
      const actual = sample.positive_outcome ? 1 : 0;
      return sum + Math.abs(sample.predicted_probability - actual);
    }, 0) / samples.length,
  );

  return {
    status: "measured",
    sample_size: samples.length,
    positive_outcome_count: positiveOutcomeCount,
    mean_predicted_positive_probability: meanPredicted,
    observed_positive_rate: observedPositiveRate,
    brier_score: brierScore,
    mean_absolute_error: meanAbsoluteError,
    bins: buildCalibrationBins(samples),
    source: "candidate_route_belief_audit",
  };
}

function buildExplorationRegretTelemetry(input: {
  decisions: readonly PolicyDecisionRecord[];
  evaluation_by_candidate_created_at: ReadonlyMap<string, PolicyEvaluationRecord>;
}): PolicyRegretTelemetry {
  const batches = new Map<string, PolicyDecisionRecord[]>();
  for (const decision of input.decisions) {
    if (decision.decision_type !== "exploration_rank") {
      continue;
    }
    const batchId = decision.exploration_rank?.exploration_batch_id;
    if (!batchId) {
      continue;
    }
    const existing = batches.get(batchId);
    if (existing) {
      existing.push(decision);
    } else {
      batches.set(batchId, [decision]);
    }
  }

  const replays = [...batches.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([batchId, decisions]): ExplorationRegretBatchReplay => {
      const orderedDecisions = [...decisions].sort((left, right) =>
        compareStrings(left.candidate_id, right.candidate_id),
      );
      const budgetSlots = orderedDecisions[0]?.exploration_rank?.budget_slots ?? 0;
      const policyMode = orderedDecisions[0]?.exploration_rank?.policy_mode ?? "off";
      const evaluations = orderedDecisions.map((decision) =>
        input.evaluation_by_candidate_created_at.get(
          candidateCreatedKey(decision.candidate_id, decision.created_at),
        ) ?? null,
      );
      const observedEvaluations = evaluations.filter(
        (record): record is PolicyEvaluationRecord => record?.positive_outcome != null,
      );
      const measured = observedEvaluations.length === orderedDecisions.length;

      if (!measured) {
        return {
          exploration_batch_id: batchId,
          policy_mode: policyMode,
          budget_slots: budgetSlots,
          total_candidates: orderedDecisions.length,
          observed_candidates: observedEvaluations.length,
          measured: false,
          chosen_positive_count: null,
          optimal_positive_count: null,
          regret: null,
        };
      }

      const chosenPositiveCount = orderedDecisions.reduce((sum, decision, index) => {
        const evaluation = evaluations[index];
        const positive = evaluation?.positive_outcome === true ? 1 : 0;
        return sum + (decision.chosen_action === "prioritized" ? positive : 0);
      }, 0);
      const totalPositiveCount = observedEvaluations.filter(
        (record) => record.positive_outcome === true,
      ).length;
      const optimalPositiveCount = Math.min(totalPositiveCount, budgetSlots);

      return {
        exploration_batch_id: batchId,
        policy_mode: policyMode,
        budget_slots: budgetSlots,
        total_candidates: orderedDecisions.length,
        observed_candidates: observedEvaluations.length,
        measured: true,
        chosen_positive_count: chosenPositiveCount,
        optimal_positive_count: optimalPositiveCount,
        regret: optimalPositiveCount - chosenPositiveCount,
      };
    });

  const measuredBatches = replays.filter((batch) => batch.measured);
  if (measuredBatches.length === 0) {
    return {
      status: "insufficient_data",
      total_batches: replays.length,
      measured_batches: 0,
      sample_coverage_rate: replays.length > 0 ? 0 : null,
      total_regret: null,
      average_regret: null,
      max_regret: null,
      batches: replays,
      source: "exploration_batch_positive_outcome_replay",
    };
  }

  const regrets = measuredBatches
    .map((batch) => batch.regret)
    .filter((value): value is number => value != null);

  return {
    status: "measured",
    total_batches: replays.length,
    measured_batches: measuredBatches.length,
    sample_coverage_rate:
      replays.length > 0 ? round(measuredBatches.length / replays.length) : null,
    total_regret: regrets.length > 0 ? round(regrets.reduce((sum, value) => sum + value, 0)) : null,
    average_regret: mean(regrets),
    max_regret: regrets.length > 0 ? Math.max(...regrets) : null,
    batches: replays,
    source: "exploration_batch_positive_outcome_replay",
  };
}

function parseOverrideDecision(input: string): {
  reason_code: string;
  source_layer: OverrideReasonBreakdown["source_layer"];
} {
  const match = /^governed:([^:]+):(.+)$/.exec(input);
  const reasonCode = match?.[1] ?? "unknown";
  const action = match?.[2] ?? "";
  if (action.startsWith("lp-do-")) {
    return { reason_code: reasonCode, source_layer: "route" };
  }
  if (action === "selected" || action === "deferred") {
    return { reason_code: reasonCode, source_layer: "portfolio" };
  }
  if (action === "prioritized" || action === "baseline_selected") {
    return { reason_code: reasonCode, source_layer: "exploration" };
  }
  if (action === "promote" || action === "revert" || action === "hold") {
    return { reason_code: reasonCode, source_layer: "promotion_gate" };
  }
  return { reason_code: reasonCode, source_layer: "unknown" };
}

function buildOverrideTelemetry(input: {
  decisions: readonly PolicyDecisionRecord[];
  evaluation_records: readonly PolicyEvaluationRecord[];
}): OverrideTelemetry {
  const overrideRecords = input.decisions.filter(
    (decision) => decision.decision_type === "override_record",
  );
  const overriddenKeys = new Set(
    overrideRecords.map((record) =>
      candidateCreatedKey(record.candidate_id, record.created_at),
    ),
  );
  const reasonMap = new Map<
    string,
    {
      count: number;
      candidate_ids: Set<string>;
      source_layer: OverrideReasonBreakdown["source_layer"];
    }
  >();
  let routeOverrides = 0;
  let portfolioOverrides = 0;
  let explorationOverrides = 0;
  let promotionGateOverrides = 0;
  let unknownOverrides = 0;

  for (const record of overrideRecords) {
    const parsed = parseOverrideDecision(record.chosen_action);
    if (parsed.source_layer === "route") routeOverrides += 1;
    if (parsed.source_layer === "portfolio") portfolioOverrides += 1;
    if (parsed.source_layer === "exploration") explorationOverrides += 1;
    if (parsed.source_layer === "promotion_gate") promotionGateOverrides += 1;
    if (parsed.source_layer === "unknown") unknownOverrides += 1;
    const existing = reasonMap.get(parsed.reason_code);
    if (existing) {
      existing.count += 1;
      existing.candidate_ids.add(record.candidate_id);
    } else {
      reasonMap.set(parsed.reason_code, {
        count: 1,
        candidate_ids: new Set([record.candidate_id]),
        source_layer: parsed.source_layer,
      });
    }
  }

  const overriddenEvaluations = input.evaluation_records.filter((record) =>
    overriddenKeys.has(candidateCreatedKey(record.candidate_id, record.decision_created_at)),
  );
  const nonOverriddenEvaluations = input.evaluation_records.filter(
    (record) =>
      !overriddenKeys.has(candidateCreatedKey(record.candidate_id, record.decision_created_at)),
  );

  return {
    total_overrides: overrideRecords.length,
    overridden_candidates: new Set(overrideRecords.map((record) => record.candidate_id)).size,
    route_overrides: routeOverrides,
    portfolio_overrides: portfolioOverrides,
    exploration_overrides: explorationOverrides,
    promotion_gate_overrides: promotionGateOverrides,
    unknown_overrides: unknownOverrides,
    overridden_outcomes: buildOutcomeRateTelemetry(overriddenEvaluations),
    non_overridden_outcomes: buildOutcomeRateTelemetry(nonOverriddenEvaluations),
    reason_breakdown: [...reasonMap.entries()]
      .map(([reasonCode, value]) => ({
        reason_code: reasonCode,
        count: value.count,
        candidate_count: value.candidate_ids.size,
        source_layer: value.source_layer,
      }))
      .sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count;
        }
        return compareStrings(left.reason_code, right.reason_code);
      }),
  };
}

function buildPolicyVersionComparison(input: {
  decisions: readonly PolicyDecisionRecord[];
  evaluation_by_decision_id: ReadonlyMap<string, PolicyEvaluationRecord>;
}): PolicyVersionComparison[] {
  const grouped = new Map<
    string,
    {
      decision_count: number;
      observed_count: number;
      pending_count: number;
      censored_count: number;
      missing_count: number;
      positive_sample_size: number;
      positive_outcome_count: number;
      predicted_sum: number;
      calibration_sample_size: number;
    }
  >();

  for (const decision of input.decisions) {
    if (decision.decision_type !== "candidate_route") {
      continue;
    }
    const existing =
      grouped.get(decision.policy_version) ??
      {
        decision_count: 0,
        observed_count: 0,
        pending_count: 0,
        censored_count: 0,
        missing_count: 0,
        positive_sample_size: 0,
        positive_outcome_count: 0,
        predicted_sum: 0,
        calibration_sample_size: 0,
      };
    existing.decision_count += 1;
    const evaluation = input.evaluation_by_decision_id.get(decision.decision_id) ?? null;
    if (evaluation?.evaluation_status === "observed") existing.observed_count += 1;
    if (evaluation?.evaluation_status === "pending") existing.pending_count += 1;
    if (evaluation?.evaluation_status === "censored") existing.censored_count += 1;
    if (evaluation?.evaluation_status === "missing") existing.missing_count += 1;
    if (evaluation?.positive_outcome != null) {
      existing.positive_sample_size += 1;
      if (evaluation.positive_outcome) {
        existing.positive_outcome_count += 1;
      }
      const predicted =
        decision.belief_audit?.positive_impact_probability_mean ?? null;
      if (predicted != null) {
        existing.predicted_sum += predicted;
        existing.calibration_sample_size += 1;
      }
    }
    grouped.set(decision.policy_version, existing);
  }

  return [...grouped.entries()]
    .map(([policyVersion, value]) => {
      const positiveOutcomeRate =
        value.positive_sample_size > 0
          ? round(value.positive_outcome_count / value.positive_sample_size)
          : null;
      const meanPredicted =
        value.calibration_sample_size > 0
          ? round(value.predicted_sum / value.calibration_sample_size)
          : null;
      return {
        policy_version: policyVersion,
        decision_count: value.decision_count,
        observed_count: value.observed_count,
        pending_count: value.pending_count,
        censored_count: value.censored_count,
        missing_count: value.missing_count,
        positive_sample_size: value.positive_sample_size,
        positive_outcome_count: value.positive_outcome_count,
        positive_outcome_rate: positiveOutcomeRate,
        mean_predicted_positive_probability: meanPredicted,
        calibration_gap:
          positiveOutcomeRate != null && meanPredicted != null
            ? round(positiveOutcomeRate - meanPredicted)
            : null,
      };
    })
    .sort((left, right) => compareStrings(left.policy_version, right.policy_version));
}

export function buildPolicyAuditTelemetry(input: {
  decisions: readonly PolicyDecisionRecord[];
  evaluation_dataset: PolicyEvaluationDataset;
  generated_at: string;
}): PolicyAuditTelemetry {
  const evaluationByDecisionId = new Map(
    input.evaluation_dataset.records.map((record) => [record.decision_id, record] as const),
  );
  const evaluationByCandidateCreatedAt = new Map(
    input.evaluation_dataset.records.map((record) => [
      candidateCreatedKey(record.candidate_id, record.decision_created_at),
      record,
    ] as const),
  );

  return {
    schema_version: "policy-audit.v1",
    generated_at: input.generated_at,
    belief_quality: {
      calibration: buildCalibrationTelemetry({
        decisions: input.decisions,
        evaluation_by_decision_id: evaluationByDecisionId,
      }),
    },
    policy_quality: {
      exploration_regret: buildExplorationRegretTelemetry({
        decisions: input.decisions,
        evaluation_by_candidate_created_at: evaluationByCandidateCreatedAt,
      }),
      policy_version_comparison: buildPolicyVersionComparison({
        decisions: input.decisions,
        evaluation_by_decision_id: evaluationByDecisionId,
      }),
    },
    operator_intervention: {
      overrides: buildOverrideTelemetry({
        decisions: input.decisions,
        evaluation_records: input.evaluation_dataset.records,
      }),
    },
  };
}
