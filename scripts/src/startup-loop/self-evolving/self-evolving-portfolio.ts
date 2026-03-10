import { solveBinaryPortfolio } from "@acme/lib/math/optimization";

import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  ConstraintProfile,
  PolicyDecisionRecord,
  PortfolioSelectionContext,
  PortfolioSelectionSignalSnapshot,
  UtilityBreakdown,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import type { SelfEvolvingDependencyGraphSnapshot } from "./self-evolving-dependency-graph.js";
import type { SurvivalPolicySignals } from "./self-evolving-survival.js";

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function blastRadiusRank(value: "small" | "medium" | "large"): number {
  if (value === "small") return 1;
  if (value === "medium") return 2;
  return 3;
}

function evidenceFloorRank(value: RankedCandidate["score"]["evidence"]["classification"]): number {
  if (value === "measured") return 3;
  if (value === "instrumented") return 2;
  if (value === "structural_only") return 1;
  return 0;
}

function requiredEvidenceFloorRank(value: ConstraintProfile["minimum_evidence_floor"]): number {
  return value === "measured" ? 3 : 2;
}

function buildConstraintBindings(input: {
  constraint_profile: ConstraintProfile;
  ranked_candidates: readonly RankedCandidate[];
  selected_candidate_ids: ReadonlySet<string>;
}): PortfolioSelectionContext["constraint_bindings"] {
  const routeCounts = new Map<string, number>();
  let totalSelected = 0;
  for (const rankedCandidate of input.ranked_candidates) {
    if (!input.selected_candidate_ids.has(rankedCandidate.candidate.candidate_id)) {
      continue;
    }
    totalSelected += 1;
    routeCounts.set(
      rankedCandidate.route.route,
      (routeCounts.get(rankedCandidate.route.route) ?? 0) + 1,
    );
  }

  const bindings: PortfolioSelectionContext["constraint_bindings"] = [
    {
      key: "wip_cap",
      max: input.constraint_profile.wip_cap,
      observed_value: totalSelected,
      binding: totalSelected === input.constraint_profile.wip_cap,
    },
  ];
  for (const route of ["lp-do-fact-find", "lp-do-plan", "lp-do-build"] as const) {
    const routeMax = input.constraint_profile.max_candidates_per_route[route];
    if (routeMax == null) {
      continue;
    }
    const observedValue = routeCounts.get(route) ?? 0;
    bindings.push({
      key: `route:${route}`,
      max: routeMax,
      observed_value: observedValue,
      binding: observedValue === routeMax,
    });
  }
  return bindings;
}

function toPortfolioUtility(
  utility: UtilityBreakdown,
  structuralPenalty: number,
  survivalPenalty: number,
): UtilityBreakdown {
  const instabilityPenalty = Number(
    (utility.instability_penalty + structuralPenalty + survivalPenalty).toFixed(4),
  );
  return {
    ...utility,
    instability_penalty: instabilityPenalty,
    net_utility: Number(
      (
        utility.expected_reward -
        utility.downside_penalty -
        utility.effort_penalty -
        utility.evidence_penalty -
        instabilityPenalty +
        utility.exploration_bonus
      ).toFixed(4),
    ),
  };
}

function buildSignalSnapshot(input: {
  ranked_candidate: RankedCandidate;
  dependency_graph: SelfEvolvingDependencyGraphSnapshot | null;
  survival_signals: SurvivalPolicySignals | null;
}): PortfolioSelectionSignalSnapshot {
  const candidateSignal =
    input.dependency_graph?.candidate_signals.find(
      (entry) => entry.candidate_id === input.ranked_candidate.candidate.candidate_id,
    ) ?? null;
  const structuralPenalty = Number(
    Math.min(
      0.35,
      (candidateSignal?.bottleneck_score ?? 0) * 0.2 +
        (candidateSignal?.shared_executor_candidate_count ?? 0) * 0.04 +
        (candidateSignal?.shared_constraint_candidate_count ?? 0) * 0.03,
    ).toFixed(4),
  );
  const survivalProfile =
    input.survival_signals?.route_profiles.find(
      (profile) => profile.route === input.ranked_candidate.route.route,
    ) ?? null;
  const survivalPenalty = survivalProfile?.policy_penalty ?? 0;
  const adjustedUtility = Number(
    (
      (input.ranked_candidate.score.utility?.net_utility ??
        input.ranked_candidate.score.priority_score_v2 ??
        input.ranked_candidate.score.priority_score_v1) -
      structuralPenalty -
      survivalPenalty
    ).toFixed(4),
  );

  return {
    graph_bottleneck_score: Number((candidateSignal?.bottleneck_score ?? 0).toFixed(6)),
    shared_executor_candidate_count: candidateSignal?.shared_executor_candidate_count ?? 0,
    shared_constraint_candidate_count: candidateSignal?.shared_constraint_candidate_count ?? 0,
    structural_penalty: structuralPenalty,
    survival_status: survivalProfile?.status ?? "empty",
    median_verified_days: survivalProfile?.median_verified_days ?? null,
    unresolved_after_hold_probability:
      survivalProfile?.unresolved_after_hold_probability ?? null,
    missing_outcome_rate: survivalProfile?.missing_outcome_rate ?? null,
    survival_penalty: survivalPenalty,
    adjusted_utility: adjustedUtility,
  };
}

function candidateAllowedByHardRules(
  rankedCandidate: RankedCandidate,
  constraintProfile: ConstraintProfile,
): boolean {
  if (rankedCandidate.route.route === "reject") {
    return false;
  }
  if (
    rankedCandidate.route.route === "lp-do-build" &&
    blastRadiusRank(rankedCandidate.candidate.blast_radius_tag) >
      blastRadiusRank(constraintProfile.max_guarded_trial_blast_radius)
  ) {
    return false;
  }
  if (
    rankedCandidate.route.route !== "lp-do-fact-find" &&
    evidenceFloorRank(rankedCandidate.score.evidence.classification) <
      requiredEvidenceFloorRank(constraintProfile.minimum_evidence_floor)
  ) {
    return false;
  }
  return true;
}

function postureSelectionBonus(decision: PolicyDecisionRecord | null): number {
  if (!decision || decision.decision_type !== "candidate_route") {
    return 0;
  }
  if (decision.requirement_posture === "absolute_required") {
    return 100;
  }
  return 0;
}

export interface PortfolioSelectionResult {
  portfolio_id: string;
  candidate_set_hash: string;
  selected_candidate_ids: Set<string>;
  decision_records: PolicyDecisionRecord[];
  solver_status: string;
  objective_value: number | null;
}

export function buildPortfolioSelection(input: {
  business_id: string;
  ranked_candidates: readonly RankedCandidate[];
  candidate_route_decisions: readonly PolicyDecisionRecord[];
  constraint_profile: ConstraintProfile;
  dependency_graph: SelfEvolvingDependencyGraphSnapshot | null;
  survival_signals: SurvivalPolicySignals | null;
  created_at: string;
}): PortfolioSelectionResult {
  const orderedCandidates = [...input.ranked_candidates].sort((left, right) =>
    compareStrings(left.candidate.candidate_id, right.candidate.candidate_id),
  );
  const candidateSetHash = stableHash(
    JSON.stringify(
      orderedCandidates.map((rankedCandidate) => ({
        candidate_id: rankedCandidate.candidate.candidate_id,
        route: rankedCandidate.route.route,
        utility:
          rankedCandidate.score.utility?.net_utility ??
          rankedCandidate.score.priority_score_v2 ??
          rankedCandidate.score.priority_score_v1,
      })),
    ),
  ).slice(0, 16);
  const portfolioId = stableHash(
    `${input.business_id}|${candidateSetHash}|${input.created_at}|portfolio`,
  ).slice(0, 16);
  const routeDecisionByCandidateId = new Map(
    input.candidate_route_decisions.map((decision) => [decision.candidate_id, decision] as const),
  );

  const signalSnapshotByCandidateId = new Map<string, PortfolioSelectionSignalSnapshot>();
  const selectableCandidates = orderedCandidates.filter((rankedCandidate) => {
    const signalSnapshot = buildSignalSnapshot({
      ranked_candidate: rankedCandidate,
      dependency_graph: input.dependency_graph,
      survival_signals: input.survival_signals,
    });
    signalSnapshotByCandidateId.set(rankedCandidate.candidate.candidate_id, signalSnapshot);
    return candidateAllowedByHardRules(rankedCandidate, input.constraint_profile);
  });

  const solverResult =
    selectableCandidates.length === 0
      ? {
          status: "infeasible",
          objective_value: null,
          selected_option_ids: [],
        }
      : solveBinaryPortfolio({
          options: selectableCandidates.map((rankedCandidate) => ({
            id: rankedCandidate.candidate.candidate_id,
            utility:
              (signalSnapshotByCandidateId.get(rankedCandidate.candidate.candidate_id)
                ?.adjusted_utility ??
                0) +
              postureSelectionBonus(
                routeDecisionByCandidateId.get(rankedCandidate.candidate.candidate_id) ?? null,
              ),
            coefficients: {
              wip_cap: 1,
              [`route:${rankedCandidate.route.route}`]: 1,
            },
          })),
          constraints: [
            {
              key: "wip_cap",
              max: input.constraint_profile.wip_cap,
            },
            ...Object.entries(input.constraint_profile.max_candidates_per_route)
              .filter(([, max]) => typeof max === "number")
              .map(([route, max]) => ({
                key: `route:${route}`,
                max,
              })),
          ],
        });

  const selectedCandidateIds = new Set(solverResult.selected_option_ids);
  const constraintBindings = buildConstraintBindings({
    constraint_profile: input.constraint_profile,
    ranked_candidates: orderedCandidates,
    selected_candidate_ids: selectedCandidateIds,
  });

  const decisionRecords = orderedCandidates.map((rankedCandidate): PolicyDecisionRecord => {
    const routeDecision = routeDecisionByCandidateId.get(rankedCandidate.candidate.candidate_id);
    if (!routeDecision) {
      throw new Error(
        `portfolio_selection_missing_route_decision:${rankedCandidate.candidate.candidate_id}`,
      );
    }
    const signalSnapshot =
      signalSnapshotByCandidateId.get(rankedCandidate.candidate.candidate_id) ??
      buildSignalSnapshot({
        ranked_candidate: rankedCandidate,
        dependency_graph: input.dependency_graph,
        survival_signals: input.survival_signals,
      });
    const selected = selectedCandidateIds.has(rankedCandidate.candidate.candidate_id);

    return {
      ...routeDecision,
      decision_id: stableHash(
        `${routeDecision.decision_id}|${portfolioId}|${selected ? "selected" : "deferred"}`,
      ).slice(0, 16),
      decision_type: "portfolio_selection",
      decision_context_id: portfolioId,
      eligible_actions: ["selected", "deferred"],
      chosen_action: selected ? "selected" : "deferred",
      action_probability: null,
      utility: toPortfolioUtility(
        rankedCandidate.score.utility,
        signalSnapshot.structural_penalty,
        signalSnapshot.survival_penalty,
      ),
      portfolio_selection: {
        schema_version: "portfolio-selection.v1",
        portfolio_id: portfolioId,
        candidate_set_hash: candidateSetHash,
        candidate_count: orderedCandidates.length,
        selected_candidate_ids: [...selectedCandidateIds].sort(compareStrings),
        solver_status: solverResult.status,
        objective_value: solverResult.objective_value,
        constraint_bindings: constraintBindings,
        graph_snapshot_id: input.dependency_graph?.snapshot_id ?? null,
        survival_snapshot_id: input.survival_signals?.snapshot_id ?? null,
        signal_snapshot: signalSnapshot,
      },
      created_at: input.created_at,
    };
  });

  return {
    portfolio_id: portfolioId,
    candidate_set_hash: candidateSetHash,
    selected_candidate_ids: selectedCandidateIds,
    decision_records: decisionRecords,
    solver_status: solverResult.status,
    objective_value: solverResult.objective_value,
  };
}
