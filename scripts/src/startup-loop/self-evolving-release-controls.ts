import type { ImprovementCandidate } from "./self-evolving-contracts.js";

export interface ReleaseGuardrails {
  max_error_rate: number;
  max_guardrail_kpi_drop: number;
  monitoring_window_minutes: number;
}

export interface CanaryOutcome {
  candidate_id: string;
  error_rate: number;
  guardrail_kpi_delta: number;
  elapsed_minutes: number;
}

export interface ReleaseDecision {
  action: "promote" | "revert" | "hold";
  reason: string;
}

export function evaluateCanaryOutcome(
  candidate: ImprovementCandidate,
  guardrails: ReleaseGuardrails,
  outcome: CanaryOutcome,
): ReleaseDecision {
  if (candidate.candidate_state !== "canary") {
    return { action: "hold", reason: "candidate_not_in_canary_state" };
  }
  if (outcome.elapsed_minutes < guardrails.monitoring_window_minutes) {
    return { action: "hold", reason: "monitoring_window_not_met" };
  }
  if (outcome.error_rate > guardrails.max_error_rate) {
    return { action: "revert", reason: "error_rate_guardrail_breached" };
  }
  if (outcome.guardrail_kpi_delta < -guardrails.max_guardrail_kpi_drop) {
    return { action: "revert", reason: "guardrail_kpi_drop_breached" };
  }
  return { action: "promote", reason: "canary_guardrails_passed" };
}
