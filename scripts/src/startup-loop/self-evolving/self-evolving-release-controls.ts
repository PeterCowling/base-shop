import type { ImprovementCandidate } from "./self-evolving-contracts.js";

export interface ReleaseGuardrails {
  max_error_rate: number;
  max_guardrail_kpi_drop: number;
  monitoring_window_minutes: number;
  required_confirmation_windows?: number;
}

export interface CanaryOutcome {
  candidate_id: string;
  error_rate: number;
  guardrail_kpi_delta: number;
  elapsed_minutes: number;
  confirmed_healthy_windows?: number;
  confirmed_unhealthy_windows?: number;
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
  const requiredConfirmationWindows = Math.max(
    1,
    guardrails.required_confirmation_windows ?? 1,
  );
  if (candidate.candidate_state !== "canary") {
    return { action: "hold", reason: "candidate_not_in_canary_state" };
  }
  if (outcome.elapsed_minutes < guardrails.monitoring_window_minutes) {
    return { action: "hold", reason: "monitoring_window_not_met" };
  }
  if (outcome.error_rate > guardrails.max_error_rate) {
    if ((outcome.confirmed_unhealthy_windows ?? 1) < requiredConfirmationWindows) {
      return { action: "hold", reason: "error_rate_guardrail_confirmation_pending" };
    }
    return { action: "revert", reason: "error_rate_guardrail_breached" };
  }
  if (outcome.guardrail_kpi_delta < -guardrails.max_guardrail_kpi_drop) {
    if ((outcome.confirmed_unhealthy_windows ?? 1) < requiredConfirmationWindows) {
      return { action: "hold", reason: "guardrail_kpi_drop_confirmation_pending" };
    }
    return { action: "revert", reason: "guardrail_kpi_drop_breached" };
  }
  if ((outcome.confirmed_healthy_windows ?? 1) < requiredConfirmationWindows) {
    return { action: "hold", reason: "healthy_window_confirmation_pending" };
  }
  return { action: "promote", reason: "canary_guardrails_passed" };
}
