import { promotionActuationEnabled } from "./self-evolving-authority.js";
import { applyWebsiteV1BrandRulesAutoFix } from "./self-evolving-autofix.js";
import type { RankedCandidate } from "./self-evolving-candidates.js";
import {
  type PolicyAuthorityLevel,
  type PolicyDecisionRecord,
  type PromotionNominationContext,
  type PromotionProofStatus,
  type PromotionSafetyStatus,
  type PromotionTargetSurface,
  stableHash,
  type StartupState,
} from "./self-evolving-contracts.js";
import type { PolicyEvaluationDataset } from "./self-evolving-evaluation.js";

interface PrescriptionProofSummary {
  observed_outcome_count: number;
  positive_outcome_count: number;
  positive_outcome_rate: number | null;
  latest_outcome_event_id: string | null;
  latest_outcome_source_path: string | null;
}

interface PromotionTarget {
  target_surface: PromotionTargetSurface;
  target_identifier: string | null;
  safety_status: PromotionSafetyStatus;
  reason_code: string;
}

export interface PromotionNominationBuildResult {
  decision_records: PolicyDecisionRecord[];
  startup_state: StartupState;
  startup_state_changed: boolean;
  applied_candidate_ids: string[];
}

export interface PromotionNominationDataset {
  total: number;
  proof_eligible: number;
  safety_eligible: number;
  advisory_only: number;
  nominated: number;
  applied: number;
  skipped: number;
  proven_but_unpromoted: number;
  target_surface_counts: Record<PromotionTargetSurface, number>;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function parseContainerName(executorPath: string): string | null {
  const prefix = "lp-do-build:container:";
  if (!executorPath.startsWith(prefix)) {
    return null;
  }
  const containerName = executorPath.slice(prefix.length).trim();
  return containerName.length > 0 ? containerName : null;
}

function buildProofSummaryByPrescriptionId(
  dataset: PolicyEvaluationDataset,
): Map<string, PrescriptionProofSummary> {
  const byPrescriptionId = new Map<
    string,
    {
      observed_outcome_count: number;
      positive_outcome_count: number;
      latest_outcome_event_id: string | null;
      latest_outcome_source_path: string | null;
      latest_timestamp: string;
    }
  >();

  for (const record of dataset.records) {
    if (!record.prescription_id || record.evaluation_status !== "observed") {
      continue;
    }

    const current = byPrescriptionId.get(record.prescription_id) ?? {
      observed_outcome_count: 0,
      positive_outcome_count: 0,
      latest_outcome_event_id: null,
      latest_outcome_source_path: null,
      latest_timestamp: "",
    };

    current.observed_outcome_count += 1;
    if (record.positive_outcome) {
      current.positive_outcome_count += 1;
    }

    const recordTimestamp = record.completed_at ?? record.recorded_at;
    if (
      current.latest_timestamp === "" ||
      Date.parse(recordTimestamp) >= Date.parse(current.latest_timestamp)
    ) {
      current.latest_timestamp = recordTimestamp;
      current.latest_outcome_event_id = record.outcome_event_id;
      current.latest_outcome_source_path = record.outcome_source_path;
    }

    byPrescriptionId.set(record.prescription_id, current);
  }

  return new Map(
    [...byPrescriptionId.entries()].map(([prescriptionId, summary]) => [
      prescriptionId,
      {
        observed_outcome_count: summary.observed_outcome_count,
        positive_outcome_count: summary.positive_outcome_count,
        positive_outcome_rate:
          summary.observed_outcome_count > 0
            ? Number(
                (
                  summary.positive_outcome_count / summary.observed_outcome_count
                ).toFixed(6),
              )
            : null,
        latest_outcome_event_id: summary.latest_outcome_event_id,
        latest_outcome_source_path: summary.latest_outcome_source_path,
      },
    ]),
  );
}

function classifyPromotionTarget(
  rankedCandidate: RankedCandidate,
): PromotionTarget {
  const candidate = rankedCandidate.candidate;
  const containerName = parseContainerName(candidate.executor_path);

  if (
    containerName === "website-v1" &&
    candidate.candidate_type === "container_update" &&
    candidate.risk_level === "low" &&
    candidate.blast_radius_tag === "small"
  ) {
    return {
      target_surface: "autofix_low_risk",
      target_identifier: "startup-state:brand_rules",
      safety_status: "eligible",
      reason_code: "website_v1_brand_rules_autofix",
    };
  }

  if (containerName) {
    return {
      target_surface: "prompt_contract",
      target_identifier: `container:${containerName}`,
      safety_status: "advisory_only",
      reason_code: "container_contract_requires_operator_promotion",
    };
  }

  return {
    target_surface: "prompt_contract",
    target_identifier: candidate.executor_path,
    safety_status: "advisory_only",
    reason_code: "prompt_contract_requires_operator_promotion",
  };
}

function classifyProof(input: {
  ranked_candidate: RankedCandidate;
  proof_summary: PrescriptionProofSummary | undefined;
}): {
  proof_status: PromotionProofStatus;
  reason_code: string;
} {
  const candidate = input.ranked_candidate.candidate;
  const maturity =
    candidate.prescription_maturity ?? candidate.prescription?.maturity ?? null;

  if (!candidate.prescription) {
    return {
      proof_status: "ineligible",
      reason_code: "promotion_missing_prescription",
    };
  }
  if (maturity !== "proven") {
    return {
      proof_status: "ineligible",
      reason_code: "promotion_requires_proven_prescription",
    };
  }
  if (!input.proof_summary || input.proof_summary.observed_outcome_count === 0) {
    return {
      proof_status: "insufficient_data",
      reason_code: "promotion_requires_observed_outcomes",
    };
  }
  if (input.proof_summary.positive_outcome_count <= 0) {
    return {
      proof_status: "ineligible",
      reason_code: "promotion_requires_positive_outcome",
    };
  }
  return {
    proof_status: "eligible",
    reason_code: "promotion_proof_threshold_met",
  };
}

export function buildPromotionNominationDecisions(input: {
  startup_state: StartupState;
  authority_level: PolicyAuthorityLevel;
  ranked_candidates: readonly RankedCandidate[];
  route_decisions: readonly PolicyDecisionRecord[];
  evaluation_dataset: PolicyEvaluationDataset;
  created_at: string;
}): PromotionNominationBuildResult {
  const routeDecisionByCandidateId = new Map(
    input.route_decisions
      .filter((decision) => decision.decision_type === "candidate_route")
      .map((decision) => [decision.candidate_id, decision] as const),
  );
  const proofSummaryByPrescriptionId = buildProofSummaryByPrescriptionId(
    input.evaluation_dataset,
  );

  const allowPromotionActuation = promotionActuationEnabled(input.authority_level);
  let nextStartupState = input.startup_state;
  let startupStateChanged = false;
  const appliedCandidateIds: string[] = [];

  const decisionRecords = input.ranked_candidates.map((rankedCandidate) => {
    const candidate = rankedCandidate.candidate;
    const baseDecision = routeDecisionByCandidateId.get(candidate.candidate_id);
    if (!baseDecision) {
      throw new Error(
        `promotion_nomination_missing_route_decision:${candidate.candidate_id}`,
      );
    }

    const proofSummary = candidate.prescription
      ? proofSummaryByPrescriptionId.get(candidate.prescription.prescription_id)
      : undefined;
    const proof = classifyProof({
      ranked_candidate: rankedCandidate,
      proof_summary: proofSummary,
    });
    const target = classifyPromotionTarget(rankedCandidate);

    let chosenAction = "hold";
    let actuationStatus: PromotionNominationContext["actuation_status"] = "skipped";
    let reasonCode = proof.reason_code;

    if (
      proof.proof_status === "eligible" &&
      target.safety_status !== "ineligible"
    ) {
      chosenAction = "nominate";
      actuationStatus = "nominated";
      reasonCode = target.reason_code;
    }

    if (
      proof.proof_status === "eligible" &&
      target.target_surface === "autofix_low_risk" &&
      target.safety_status === "eligible" &&
      allowPromotionActuation
    ) {
      const autoFix = applyWebsiteV1BrandRulesAutoFix(nextStartupState);
      if (autoFix.applied) {
        nextStartupState = autoFix.patched_startup_state;
        startupStateChanged = true;
        appliedCandidateIds.push(candidate.candidate_id);
        chosenAction = "apply";
        actuationStatus = "applied";
        reasonCode = autoFix.reason;
      } else {
        chosenAction = "hold";
        actuationStatus = "skipped";
        reasonCode = autoFix.reason;
      }
    }

    const context: PromotionNominationContext = {
      schema_version: "promotion-nomination.v1",
      target_surface: target.target_surface,
      target_identifier: target.target_identifier,
      proof_status: proof.proof_status,
      safety_status: target.safety_status,
      actuation_status: actuationStatus,
      observed_outcome_count: proofSummary?.observed_outcome_count ?? 0,
      positive_outcome_count: proofSummary?.positive_outcome_count ?? 0,
      positive_outcome_rate: proofSummary?.positive_outcome_rate ?? null,
      latest_outcome_event_id: proofSummary?.latest_outcome_event_id ?? null,
      latest_outcome_source_path: proofSummary?.latest_outcome_source_path ?? null,
      reason_code: reasonCode,
    };

    const eligibleActions = ["hold"];
    if (proof.proof_status === "eligible" && target.safety_status !== "ineligible") {
      eligibleActions.push("nominate");
    }
    if (
      target.target_surface === "autofix_low_risk" &&
      target.safety_status === "eligible" &&
      allowPromotionActuation
    ) {
      eligibleActions.push("apply");
    }

    return {
      ...baseDecision,
      decision_id: stableHash(
        `${baseDecision.decision_id}|promotion-nomination.v1|${chosenAction}|${context.target_surface}|${context.reason_code}`,
      ).slice(0, 16),
      decision_type: "promotion_nomination" as const,
      decision_mode: "deterministic" as const,
      eligible_actions: [...new Set(eligibleActions)].sort(compareStrings),
      chosen_action: chosenAction,
      action_probability: chosenAction === "hold" ? 0 : 1,
      portfolio_selection: null,
      exploration_rank: null,
      promotion_gate: null,
      promotion_nomination: context,
      created_at: input.created_at,
    };
  });

  return {
    decision_records: decisionRecords,
    startup_state: nextStartupState,
    startup_state_changed: startupStateChanged,
    applied_candidate_ids: appliedCandidateIds,
  };
}

export function buildPromotionNominationDataset(input: {
  decisions: readonly PolicyDecisionRecord[];
}): PromotionNominationDataset {
  const summary: PromotionNominationDataset = {
    total: 0,
    proof_eligible: 0,
    safety_eligible: 0,
    advisory_only: 0,
    nominated: 0,
    applied: 0,
    skipped: 0,
    proven_but_unpromoted: 0,
    target_surface_counts: {
      prompt_contract: 0,
      write_back: 0,
      autofix_low_risk: 0,
    },
  };

  for (const decision of input.decisions) {
    if (
      decision.decision_type !== "promotion_nomination" ||
      !decision.promotion_nomination
    ) {
      continue;
    }
    const nomination = decision.promotion_nomination;
    summary.total += 1;
    summary.target_surface_counts[nomination.target_surface] += 1;
    if (nomination.proof_status === "eligible") {
      summary.proof_eligible += 1;
    }
    if (nomination.safety_status === "eligible") {
      summary.safety_eligible += 1;
    }
    if (nomination.safety_status === "advisory_only") {
      summary.advisory_only += 1;
    }
    if (nomination.actuation_status === "nominated") {
      summary.nominated += 1;
    }
    if (nomination.actuation_status === "applied") {
      summary.applied += 1;
    }
    if (nomination.actuation_status === "skipped") {
      summary.skipped += 1;
    }
  }

  summary.proven_but_unpromoted =
    summary.proof_eligible - summary.applied;

  return summary;
}
