import { estimateKaplanMeierCurve } from "@acme/lib/math/survival";

import type {
  PolicyEvaluationDataset,
  PolicyEvaluationRecord,
} from "./self-evolving-evaluation.js";

const MIN_ESTIMATED_ROUTE_OBSERVATIONS = 3;

export interface RouteSurvivalProfile {
  route: string;
  status: "empty" | "insufficient_data" | "estimated";
  total_records: number;
  verified_outcomes: number;
  missing_outcomes: number;
  censored_records: number;
  median_verified_days: number | null;
  unresolved_after_hold_probability: number | null;
  missing_outcome_rate: number | null;
  policy_penalty: number;
}

export interface SurvivalPolicySignals {
  schema_version: "survival-policy-signals.v1";
  snapshot_id: string;
  generated_at: string;
  total_records: number;
  verified_outcome_curve: ReturnType<typeof estimateKaplanMeierCurve>;
  closure_curve: ReturnType<typeof estimateKaplanMeierCurve>;
  route_profiles: RouteSurvivalProfile[];
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function daysBetween(start: string, end: string): number {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 0;
  }
  return Math.max(0, (endMs - startMs) / (24 * 60 * 60 * 1000));
}

function survivalProbabilityAtDays(
  curve: ReturnType<typeof estimateKaplanMeierCurve>,
  days: number,
): number | null {
  if (curve.status !== "estimated") {
    return null;
  }
  let latestProbability = 1;
  for (const point of curve.points) {
    if (point.time > days) {
      break;
    }
    latestProbability = point.survival_probability;
  }
  return latestProbability;
}

function classifyRouteStatus(recordCount: number): RouteSurvivalProfile["status"] {
  if (recordCount <= 0) {
    return "empty";
  }
  if (recordCount < MIN_ESTIMATED_ROUTE_OBSERVATIONS) {
    return "insufficient_data";
  }
  return "estimated";
}

function toVerifiedObservation(
  record: PolicyEvaluationRecord,
  generatedAt: string,
): { time: number; event: boolean } {
  const endAt = record.completed_at ?? generatedAt;
  return {
    time: daysBetween(record.decision_created_at, endAt),
    event: record.evaluation_status === "observed",
  };
}

function toClosureObservation(
  record: PolicyEvaluationRecord,
  generatedAt: string,
): { time: number; event: boolean } {
  const endAt = record.completed_at ?? generatedAt;
  return {
    time: daysBetween(record.decision_created_at, endAt),
    event: record.evaluation_status === "observed" || record.evaluation_status === "missing",
  };
}

export function buildSurvivalPolicySignals(input: {
  evaluation_dataset: PolicyEvaluationDataset;
  hold_window_days: number;
}): SurvivalPolicySignals {
  const records = input.evaluation_dataset.records;
  const generatedAt = input.evaluation_dataset.generated_at;
  const verifiedOutcomeCurve = estimateKaplanMeierCurve(
    records.map((record) => toVerifiedObservation(record, generatedAt)),
  );
  const closureCurve = estimateKaplanMeierCurve(
    records.map((record) => toClosureObservation(record, generatedAt)),
  );

  const routeProfiles = [...new Set(records.map((record) => record.chosen_action))]
    .sort(compareStrings)
    .map((route): RouteSurvivalProfile => {
      const routeRecords = records.filter((record) => record.chosen_action === route);
      const verifiedCurve = estimateKaplanMeierCurve(
        routeRecords.map((record) => toVerifiedObservation(record, generatedAt)),
      );
      const status = classifyRouteStatus(routeRecords.length);
      const verifiedOutcomes = routeRecords.filter(
        (record) => record.evaluation_status === "observed",
      ).length;
      const missingOutcomes = routeRecords.filter(
        (record) => record.evaluation_status === "missing",
      ).length;
      const censoredRecords = routeRecords.filter((record) =>
        record.evaluation_status === "pending" || record.evaluation_status === "censored",
      ).length;
      const unresolvedAfterHoldProbability =
        status === "estimated"
          ? survivalProbabilityAtDays(verifiedCurve, input.hold_window_days)
          : null;
      const missingOutcomeRate =
        routeRecords.length > 0 ? missingOutcomes / routeRecords.length : null;
      const policyPenalty =
        status === "estimated"
          ? Number(
              Math.min(
                0.75,
                (unresolvedAfterHoldProbability ?? 0) * 0.45 +
                  (missingOutcomeRate ?? 0) * 0.35,
              ).toFixed(4),
            )
          : 0;

      return {
        route,
        status,
        total_records: routeRecords.length,
        verified_outcomes: verifiedOutcomes,
        missing_outcomes: missingOutcomes,
        censored_records: censoredRecords,
        median_verified_days: verifiedCurve.median_survival_time,
        unresolved_after_hold_probability: unresolvedAfterHoldProbability,
        missing_outcome_rate: missingOutcomeRate,
        policy_penalty: policyPenalty,
      };
    });

  return {
    schema_version: "survival-policy-signals.v1",
    snapshot_id: input.evaluation_dataset.generated_at,
    generated_at: generatedAt,
    total_records: records.length,
    verified_outcome_curve: verifiedOutcomeCurve,
    closure_curve: closureCurve,
    route_profiles: routeProfiles,
  };
}
