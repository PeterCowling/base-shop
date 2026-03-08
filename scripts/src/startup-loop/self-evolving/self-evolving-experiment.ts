import type { DataQualityStatus } from "./self-evolving-contracts.js";

export interface ExperimentDecisionPolicy {
  minimum_sample_size: number;
  minimum_runtime_hours: number;
  decision_method: "threshold" | "directional";
  target_kpi: string;
  target_delta_threshold: number;
  guardrail_kpis: Array<{
    name: string;
    min_allowed_delta: number;
  }>;
  stop_conditions: string[];
}

export interface ExperimentObservation {
  kpi_name: string;
  delta: number;
  sample_size: number;
  runtime_hours: number;
  data_quality_status: DataQualityStatus;
}

export interface ExperimentDecision {
  action: "keep" | "revert" | "hold";
  reason: string;
}

export function decideExperimentOutcome(
  policy: ExperimentDecisionPolicy,
  targetObservation: ExperimentObservation,
  guardrailObservations: ExperimentObservation[],
): ExperimentDecision {
  if (targetObservation.data_quality_status !== "ok") {
    return { action: "hold", reason: "data_quality_not_ok" };
  }
  if (targetObservation.sample_size < policy.minimum_sample_size) {
    return { action: "hold", reason: "minimum_sample_size_not_met" };
  }
  if (targetObservation.runtime_hours < policy.minimum_runtime_hours) {
    return { action: "hold", reason: "minimum_runtime_not_met" };
  }

  const breachedGuardrail = policy.guardrail_kpis.find((guardrail) => {
    const observation = guardrailObservations.find(
      (entry) => entry.kpi_name === guardrail.name,
    );
    if (!observation) return false;
    return observation.delta < guardrail.min_allowed_delta;
  });
  if (breachedGuardrail) {
    return { action: "revert", reason: `guardrail_breach:${breachedGuardrail.name}` };
  }

  if (policy.decision_method === "threshold") {
    return targetObservation.delta >= policy.target_delta_threshold
      ? { action: "keep", reason: "target_threshold_met" }
      : { action: "revert", reason: "target_threshold_not_met" };
  }

  return targetObservation.delta > 0
    ? { action: "keep", reason: "directional_improvement" }
    : { action: "revert", reason: "directional_regression" };
}
