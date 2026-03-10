import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
  StartupState,
  UtilityBreakdown,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function routeRank(action: string): number {
  if (action === "lp-do-build") return 3;
  if (action === "lp-do-plan") return 2;
  if (action === "lp-do-fact-find") return 1;
  return 0;
}

function hasPrimaryKpi(startupState: StartupState): boolean {
  return startupState.kpi_definitions.some((definition) => definition.kind === "primary");
}

function hasGuardrailKpi(startupState: StartupState): boolean {
  return startupState.kpi_definitions.some((definition) => definition.kind === "guardrail");
}

function latestDecisionByCandidate(input: {
  decisions: readonly PolicyDecisionRecord[];
  decision_type: PolicyDecisionRecord["decision_type"];
}): Map<string, PolicyDecisionRecord> {
  const byCandidateId = new Map<string, PolicyDecisionRecord>();
  for (const decision of input.decisions) {
    if (decision.decision_type !== input.decision_type) {
      continue;
    }
    const prior = byCandidateId.get(decision.candidate_id);
    if (!prior || Date.parse(decision.created_at) >= Date.parse(prior.created_at)) {
      byCandidateId.set(decision.candidate_id, decision);
    }
  }
  return byCandidateId;
}

function recentDecisionByCandidate(input: {
  decisions: readonly PolicyDecisionRecord[];
  decision_type: PolicyDecisionRecord["decision_type"];
  created_at: string;
  hold_window_days: number;
}): Map<string, PolicyDecisionRecord> {
  if (input.hold_window_days <= 0) {
    return new Map<string, PolicyDecisionRecord>();
  }

  const nowMs = Date.parse(input.created_at);
  const holdWindowMs = input.hold_window_days * 24 * 60 * 60 * 1000;
  const latestByCandidateId = latestDecisionByCandidate({
    decisions: input.decisions,
    decision_type: input.decision_type,
  });

  return new Map(
    [...latestByCandidateId.entries()].filter(([, decision]) => {
      const decisionMs = Date.parse(decision.created_at);
      if (Number.isNaN(decisionMs) || Number.isNaN(nowMs)) {
        return false;
      }
      return nowMs - decisionMs <= holdWindowMs;
    }),
  );
}

function utilitiesDiffer(left: UtilityBreakdown, right: UtilityBreakdown): boolean {
  return JSON.stringify(left) !== JSON.stringify(right);
}

function addUtilityPenalty(
  utility: UtilityBreakdown,
  input: {
    downside?: number;
    evidence?: number;
    instability?: number;
  },
): UtilityBreakdown {
  const downsidePenalty = Number(
    (utility.downside_penalty + (input.downside ?? 0)).toFixed(6),
  );
  const evidencePenalty = Number(
    (utility.evidence_penalty + (input.evidence ?? 0)).toFixed(6),
  );
  const instabilityPenalty = Number(
    (utility.instability_penalty + (input.instability ?? 0)).toFixed(6),
  );
  return {
    ...utility,
    downside_penalty: downsidePenalty,
    evidence_penalty: evidencePenalty,
    instability_penalty: instabilityPenalty,
    net_utility: Number(
      (
        utility.expected_reward -
        downsidePenalty -
        utility.effort_penalty -
        evidencePenalty -
        instabilityPenalty +
        utility.exploration_bonus
      ).toFixed(6),
    ),
  };
}

function stripExplorationBonus(utility: UtilityBreakdown): UtilityBreakdown {
  return {
    ...utility,
    exploration_bonus: 0,
    net_utility: Number((utility.net_utility - utility.exploration_bonus).toFixed(6)),
  };
}

function adjustedObjective(decision: PolicyDecisionRecord): number {
  return (
    decision.portfolio_selection?.signal_snapshot.adjusted_utility ??
    decision.exploration_rank?.signal_snapshot.exploration_score ??
    decision.utility.net_utility
  );
}

function canSelectPortfolioCandidate(input: {
  ranked_candidate: RankedCandidate;
  selected_candidate_ids: ReadonlySet<string>;
  ranked_by_candidate_id: ReadonlyMap<string, RankedCandidate>;
  policy_state: SelfEvolvingPolicyState;
}): boolean {
  if (input.ranked_candidate.route.route === "reject") {
    return false;
  }

  const selectedCandidates = [...input.selected_candidate_ids]
    .map((candidateId) => input.ranked_by_candidate_id.get(candidateId) ?? null)
    .filter((candidate): candidate is RankedCandidate => candidate != null);

  if (selectedCandidates.length >= input.policy_state.active_constraint_profile.wip_cap) {
    return false;
  }

  const routeMax =
    input.policy_state.active_constraint_profile.max_candidates_per_route[
      input.ranked_candidate.route.route
    ];
  if (routeMax == null) {
    return true;
  }

  const routeCount = selectedCandidates.filter(
    (candidate) => candidate.route.route === input.ranked_candidate.route.route,
  ).length;
  return routeCount < routeMax;
}

function buildPortfolioConstraintBindings(input: {
  policy_state: SelfEvolvingPolicyState;
  ranked_candidates: readonly RankedCandidate[];
  selected_candidate_ids: ReadonlySet<string>;
}): Array<{
  key: string;
  min?: number;
  max?: number;
  equal?: number;
  observed_value: number;
  binding: boolean;
}> {
  const routeCounts = new Map<string, number>();
  for (const rankedCandidate of input.ranked_candidates) {
    if (!input.selected_candidate_ids.has(rankedCandidate.candidate.candidate_id)) {
      continue;
    }
    routeCounts.set(
      rankedCandidate.route.route,
      (routeCounts.get(rankedCandidate.route.route) ?? 0) + 1,
    );
  }

  const bindings = [
    {
      key: "wip_cap",
      max: input.policy_state.active_constraint_profile.wip_cap,
      observed_value: input.selected_candidate_ids.size,
      binding:
        input.selected_candidate_ids.size ===
        input.policy_state.active_constraint_profile.wip_cap,
    },
  ];

  for (const route of ["lp-do-fact-find", "lp-do-plan", "lp-do-build"] as const) {
    const routeMax = input.policy_state.active_constraint_profile.max_candidates_per_route[route];
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

function createOverrideRecord(input: {
  base_decision: PolicyDecisionRecord;
  governed_decision: PolicyDecisionRecord;
  reason_code: string;
  created_at: string;
}): PolicyDecisionRecord {
  const decisionContextId = stableHash(
    `${input.governed_decision.decision_context_id}|override|${input.reason_code}`,
  ).slice(0, 16);

  return {
    ...input.governed_decision,
    decision_id: stableHash(
      `${input.governed_decision.decision_id}|override|${input.reason_code}`,
    ).slice(0, 16),
    decision_type: "override_record",
    decision_mode: "deterministic",
    decision_context_id: decisionContextId,
    eligible_actions: [
      `current:${input.base_decision.chosen_action}`,
      `governed:${input.governed_decision.chosen_action}`,
    ],
    chosen_action: `governed:${input.reason_code}:${input.governed_decision.chosen_action}`,
    action_probability: 1,
    portfolio_selection: null,
    exploration_rank: null,
    promotion_gate: null,
    created_at: input.created_at,
  };
}

export interface GovernRouteDecisionsResult {
  ranked_candidates: RankedCandidate[];
  decision_records: PolicyDecisionRecord[];
  override_records: PolicyDecisionRecord[];
}

export function governRouteDecisions(input: {
  ranked_candidates: readonly RankedCandidate[];
  route_decisions: readonly PolicyDecisionRecord[];
  prior_policy_decisions: readonly PolicyDecisionRecord[];
  policy_state: SelfEvolvingPolicyState;
  startup_state: StartupState;
  created_at: string;
}): GovernRouteDecisionsResult {
  const holdWindowDays = input.policy_state.active_constraint_profile.hold_window_days;
  const priorRouteDecisionByCandidateId = recentDecisionByCandidate({
    decisions: input.prior_policy_decisions,
    decision_type: "candidate_route",
    created_at: input.created_at,
    hold_window_days: holdWindowDays,
  });
  const recentOverrideByCandidateId = recentDecisionByCandidate({
    decisions: input.prior_policy_decisions,
    decision_type: "override_record",
    created_at: input.created_at,
    hold_window_days: holdWindowDays,
  });
  const routeDecisionByCandidateId = new Map(
    input.route_decisions.map((decision) => [decision.candidate_id, decision] as const),
  );

  const rankedCandidates: RankedCandidate[] = [];
  const decisionRecords: PolicyDecisionRecord[] = [];
  const overrideRecords: PolicyDecisionRecord[] = [];

  for (const rankedCandidate of input.ranked_candidates) {
    const baseDecision = routeDecisionByCandidateId.get(rankedCandidate.candidate.candidate_id);
    if (!baseDecision) {
      throw new Error(
        `route_governance_missing_route_decision:${rankedCandidate.candidate.candidate_id}`,
      );
    }

    const priorRouteDecision = priorRouteDecisionByCandidateId.get(
      rankedCandidate.candidate.candidate_id,
    );
    const recentOverride = recentOverrideByCandidateId.get(
      rankedCandidate.candidate.candidate_id,
    );

    let governedAction = baseDecision.chosen_action;
    let governedReason = rankedCandidate.route.reason;
    const governanceReasons: string[] = [];

    if (governedAction !== "lp-do-fact-find" && !hasPrimaryKpi(input.startup_state)) {
      governedAction = "lp-do-fact-find";
      governedReason = "missing_primary_kpi_fact_find_only";
      governanceReasons.push("missing_primary_kpi_fact_find_only");
    } else if (governedAction === "lp-do-build" && !hasGuardrailKpi(input.startup_state)) {
      governedAction = "lp-do-plan";
      governedReason = "missing_guardrail_kpi_plan_only";
      governanceReasons.push("missing_guardrail_kpi_plan_only");
    } else if (
      priorRouteDecision &&
      routeRank(governedAction) > routeRank(priorRouteDecision.chosen_action)
    ) {
      governedAction = priorRouteDecision.chosen_action;
      governedReason = `route_hold_window_preserve_${priorRouteDecision.chosen_action}`;
      governanceReasons.push(governedReason);
    }

    let governedUtility = baseDecision.utility;
    if (governedAction !== "lp-do-fact-find" && !hasPrimaryKpi(input.startup_state)) {
      governedUtility = addUtilityPenalty(governedUtility, { evidence: 0.4 });
    }
    if (
      (governedAction === "lp-do-plan" || governedAction === "lp-do-build") &&
      !hasGuardrailKpi(input.startup_state)
    ) {
      governedUtility = addUtilityPenalty(governedUtility, {
        downside: governedAction === "lp-do-build" ? 0.45 : 0.2,
      });
      governanceReasons.push("missing_guardrail_kpi_penalty");
    }
    if (recentOverride) {
      governedUtility = addUtilityPenalty(governedUtility, { instability: 0.15 });
      governanceReasons.push("recent_override_instability_penalty");
    }
    if (governedAction !== baseDecision.chosen_action) {
      governedUtility = addUtilityPenalty(governedUtility, { instability: 0.1 });
    }

    const governedDecision =
      governedAction === baseDecision.chosen_action &&
      !utilitiesDiffer(governedUtility, baseDecision.utility)
        ? baseDecision
        : {
            ...baseDecision,
            decision_id: stableHash(
              `${baseDecision.decision_id}|route-governed|${governedAction}|${governanceReasons.join("|")}`,
            ).slice(0, 16),
            decision_context_id: stableHash(
              `${baseDecision.decision_context_id}|route-governed|${governedAction}|${governanceReasons.join("|")}`,
            ).slice(0, 16),
            chosen_action: governedAction,
            structural_snapshot: {
              ...baseDecision.structural_snapshot,
              recommended_route_hint:
                governedAction === "lp-do-build" ||
                governedAction === "lp-do-plan" ||
                governedAction === "lp-do-fact-find"
                  ? governedAction
                  : baseDecision.structural_snapshot.recommended_route_hint,
            },
            utility: governedUtility,
            created_at: input.created_at,
          };

    if (
      governedDecision.decision_id !== baseDecision.decision_id ||
      governedDecision.chosen_action !== baseDecision.chosen_action ||
      utilitiesDiffer(governedDecision.utility, baseDecision.utility)
    ) {
      overrideRecords.push(
        createOverrideRecord({
          base_decision: baseDecision,
          governed_decision: governedDecision,
          reason_code: governanceReasons.join("__") || "route_governance_adjusted",
          created_at: input.created_at,
        }),
      );
    }

    decisionRecords.push(governedDecision);
    rankedCandidates.push({
      ...rankedCandidate,
      route:
        governedAction === "lp-do-build" ||
        governedAction === "lp-do-plan" ||
        governedAction === "lp-do-fact-find" ||
        governedAction === "reject"
          ? {
              route: governedAction,
              reason: governedReason,
            }
          : rankedCandidate.route,
      score: {
        ...rankedCandidate.score,
        reasons: [...new Set([...rankedCandidate.score.reasons, ...governanceReasons])],
        utility: governedUtility,
      },
      policy_context: rankedCandidate.policy_context
        ? {
            ...rankedCandidate.policy_context,
            decision_id: governedDecision.decision_id,
            decision_context_id: governedDecision.decision_context_id,
          }
        : rankedCandidate.policy_context,
    });
  }

  return {
    ranked_candidates: rankedCandidates,
    decision_records: decisionRecords,
    override_records: overrideRecords,
  };
}

export interface GovernPortfolioSelectionsResult {
  decision_records: PolicyDecisionRecord[];
  selected_candidate_ids: Set<string>;
  override_records: PolicyDecisionRecord[];
}

export function governPortfolioSelections(input: {
  ranked_candidates: readonly RankedCandidate[];
  decision_records: readonly PolicyDecisionRecord[];
  prior_policy_decisions: readonly PolicyDecisionRecord[];
  policy_state: SelfEvolvingPolicyState;
  created_at: string;
}): GovernPortfolioSelectionsResult {
  const holdWindowDays = input.policy_state.active_constraint_profile.hold_window_days;
  const priorPortfolioDecisionByCandidateId = recentDecisionByCandidate({
    decisions: input.prior_policy_decisions,
    decision_type: "portfolio_selection",
    created_at: input.created_at,
    hold_window_days: holdWindowDays,
  });
  const rankedByCandidateId = new Map(
    input.ranked_candidates.map((candidate) => [candidate.candidate.candidate_id, candidate] as const),
  );
  const decisionByCandidateId = new Map(
    input.decision_records.map((decision) => [decision.candidate_id, decision] as const),
  );

  const preserveSelectedIds = new Set<string>();
  const blockedAdditionIds = new Set<string>();

  for (const decision of input.decision_records) {
    const priorDecision = priorPortfolioDecisionByCandidateId.get(decision.candidate_id);
    if (!priorDecision) {
      continue;
    }
    if (
      priorDecision.chosen_action === "selected" &&
      decision.chosen_action === "deferred" &&
      decision.utility.net_utility >= 0
    ) {
      preserveSelectedIds.add(decision.candidate_id);
    }
    if (
      priorDecision.chosen_action === "deferred" &&
      decision.chosen_action === "selected"
    ) {
      blockedAdditionIds.add(decision.candidate_id);
    }
  }

  const selectedCandidateIds = new Set<string>();
  const sortedDecisions = [...input.decision_records].sort((left, right) => {
    const leftObjective = adjustedObjective(left);
    const rightObjective = adjustedObjective(right);
    if (leftObjective !== rightObjective) {
      return rightObjective - leftObjective;
    }
    return compareStrings(left.candidate_id, right.candidate_id);
  });

  for (const decision of sortedDecisions) {
    if (!preserveSelectedIds.has(decision.candidate_id)) {
      continue;
    }
    const rankedCandidate = rankedByCandidateId.get(decision.candidate_id);
    if (!rankedCandidate) {
      continue;
    }
    if (
      canSelectPortfolioCandidate({
        ranked_candidate: rankedCandidate,
        selected_candidate_ids: selectedCandidateIds,
        ranked_by_candidate_id: rankedByCandidateId,
        policy_state: input.policy_state,
      })
    ) {
      selectedCandidateIds.add(decision.candidate_id);
    }
  }

  for (const decision of sortedDecisions) {
    if (decision.chosen_action !== "selected") {
      continue;
    }
    if (selectedCandidateIds.has(decision.candidate_id)) {
      continue;
    }
    if (blockedAdditionIds.has(decision.candidate_id)) {
      continue;
    }
    const rankedCandidate = rankedByCandidateId.get(decision.candidate_id);
    if (!rankedCandidate) {
      continue;
    }
    if (
      canSelectPortfolioCandidate({
        ranked_candidate: rankedCandidate,
        selected_candidate_ids: selectedCandidateIds,
        ranked_by_candidate_id: rankedByCandidateId,
        policy_state: input.policy_state,
      })
    ) {
      selectedCandidateIds.add(decision.candidate_id);
    }
  }

  const currentSelectedIds = new Set(
    input.decision_records
      .filter((decision) => decision.chosen_action === "selected")
      .map((decision) => decision.candidate_id),
  );

  const selectionChanged =
    currentSelectedIds.size !== selectedCandidateIds.size ||
    [...currentSelectedIds].some((candidateId) => !selectedCandidateIds.has(candidateId));

  if (!selectionChanged) {
    return {
      decision_records: [...input.decision_records],
      selected_candidate_ids: currentSelectedIds,
      override_records: [],
    };
  }

  const firstContext = input.decision_records[0]?.portfolio_selection ?? null;
  const selectedIdList = [...selectedCandidateIds].sort(compareStrings);
  const portfolioId = stableHash(
    `${firstContext?.portfolio_id ?? "portfolio"}|governed|${selectedIdList.join(",")}`,
  ).slice(0, 16);
  const constraintBindings = buildPortfolioConstraintBindings({
    policy_state: input.policy_state,
    ranked_candidates: input.ranked_candidates,
    selected_candidate_ids: selectedCandidateIds,
  });
  const objectiveValue = Number(
    [...selectedCandidateIds]
      .map((candidateId) => adjustedObjective(decisionByCandidateId.get(candidateId)!))
      .reduce((sum, value) => sum + value, 0)
      .toFixed(6),
  );

  const overrideRecords: PolicyDecisionRecord[] = [];
  const decisionRecords = input.decision_records.map((decision) => {
    const selected = selectedCandidateIds.has(decision.candidate_id);
    const baseSelected = decision.chosen_action === "selected";
    const governanceReason = preserveSelectedIds.has(decision.candidate_id)
      ? "portfolio_hold_window_preserve_selected"
      : blockedAdditionIds.has(decision.candidate_id)
        ? "portfolio_hold_window_block_addition"
        : baseSelected !== selected
          ? "portfolio_delta_cap"
          : null;
    const utility =
      baseSelected === selected
        ? decision.utility
        : addUtilityPenalty(decision.utility, { instability: 0.1 });
    const nextDecision: PolicyDecisionRecord = {
      ...decision,
      decision_id: stableHash(
        `${decision.decision_id}|${portfolioId}|${selected ? "selected" : "deferred"}`,
      ).slice(0, 16),
      decision_context_id: portfolioId,
      chosen_action: selected ? "selected" : "deferred",
      utility,
      portfolio_selection: {
        ...decision.portfolio_selection!,
        portfolio_id: portfolioId,
        selected_candidate_ids: selectedIdList,
        solver_status: `governed_${decision.portfolio_selection?.solver_status ?? "optimal"}`,
        objective_value: objectiveValue,
        constraint_bindings: constraintBindings,
      },
      created_at: input.created_at,
    };

    if (governanceReason) {
      overrideRecords.push(
        createOverrideRecord({
          base_decision: decision,
          governed_decision: nextDecision,
          reason_code: governanceReason,
          created_at: input.created_at,
        }),
      );
    }
    return nextDecision;
  });

  return {
    decision_records: decisionRecords,
    selected_candidate_ids: selectedCandidateIds,
    override_records: overrideRecords,
  };
}

export interface GovernExplorationSelectionsResult {
  decision_records: PolicyDecisionRecord[];
  prioritized_candidate_ids: Set<string>;
  override_records: PolicyDecisionRecord[];
}

export function governExplorationSelections(input: {
  decision_records: readonly PolicyDecisionRecord[];
  prior_policy_decisions: readonly PolicyDecisionRecord[];
  policy_state: SelfEvolvingPolicyState;
  selected_candidate_ids: ReadonlySet<string>;
  created_at: string;
}): GovernExplorationSelectionsResult {
  const holdWindowDays = input.policy_state.active_constraint_profile.hold_window_days;
  const budgetSlots = input.policy_state.active_constraint_profile.exploration_budget_slots ?? 0;
  const priorExplorationDecisionByCandidateId = recentDecisionByCandidate({
    decisions: input.prior_policy_decisions,
    decision_type: "exploration_rank",
    created_at: input.created_at,
    hold_window_days: holdWindowDays,
  });

  const preservePrioritizedIds = new Set<string>();
  const blockedPrioritizationIds = new Set<string>();

  for (const decision of input.decision_records) {
    const priorDecision = priorExplorationDecisionByCandidateId.get(decision.candidate_id);
    if (!priorDecision) {
      continue;
    }
    if (
      priorDecision.chosen_action === "prioritized" &&
      decision.chosen_action === "baseline_selected" &&
      input.selected_candidate_ids.has(decision.candidate_id)
    ) {
      preservePrioritizedIds.add(decision.candidate_id);
    }
    if (
      priorDecision.chosen_action === "baseline_selected" &&
      decision.chosen_action === "prioritized"
    ) {
      blockedPrioritizationIds.add(decision.candidate_id);
    }
  }

  const prioritizedCandidateIds = new Set<string>();
  const sortedDecisions = [...input.decision_records].sort((left, right) => {
    const leftObjective = left.exploration_rank?.signal_snapshot.exploration_score ?? 0;
    const rightObjective = right.exploration_rank?.signal_snapshot.exploration_score ?? 0;
    if (leftObjective !== rightObjective) {
      return rightObjective - leftObjective;
    }
    return compareStrings(left.candidate_id, right.candidate_id);
  });

  for (const decision of sortedDecisions) {
    if (!preservePrioritizedIds.has(decision.candidate_id)) {
      continue;
    }
    if (prioritizedCandidateIds.size >= budgetSlots) {
      break;
    }
    prioritizedCandidateIds.add(decision.candidate_id);
  }

  for (const decision of sortedDecisions) {
    if (decision.chosen_action !== "prioritized") {
      continue;
    }
    if (prioritizedCandidateIds.has(decision.candidate_id)) {
      continue;
    }
    if (blockedPrioritizationIds.has(decision.candidate_id)) {
      continue;
    }
    if (!input.selected_candidate_ids.has(decision.candidate_id)) {
      continue;
    }
    if (prioritizedCandidateIds.size >= budgetSlots) {
      break;
    }
    prioritizedCandidateIds.add(decision.candidate_id);
  }

  const currentPrioritizedIds = new Set(
    input.decision_records
      .filter((decision) => decision.chosen_action === "prioritized")
      .map((decision) => decision.candidate_id),
  );
  const prioritizationChanged =
    currentPrioritizedIds.size !== prioritizedCandidateIds.size ||
    [...currentPrioritizedIds].some((candidateId) => !prioritizedCandidateIds.has(candidateId));

  if (!prioritizationChanged) {
    return {
      decision_records: [...input.decision_records],
      prioritized_candidate_ids: currentPrioritizedIds,
      override_records: [],
    };
  }

  const firstContext = input.decision_records[0]?.exploration_rank ?? null;
  const prioritizedIdList = [...prioritizedCandidateIds].sort(compareStrings);
  const explorationBatchId = stableHash(
    `${firstContext?.exploration_batch_id ?? "exploration"}|governed|${prioritizedIdList.join(",")}`,
  ).slice(0, 16);
  const overrideRecords: PolicyDecisionRecord[] = [];
  const decisionRecords = input.decision_records.map((decision) => {
    const prioritized = prioritizedCandidateIds.has(decision.candidate_id);
    const basePrioritized = decision.chosen_action === "prioritized";
    const governanceReason = preservePrioritizedIds.has(decision.candidate_id)
      ? "exploration_hold_window_preserve_prioritized"
      : blockedPrioritizationIds.has(decision.candidate_id)
        ? "exploration_hold_window_block_prioritization"
        : basePrioritized !== prioritized
          ? "exploration_delta_cap"
          : null;
    const utility =
      governanceReason && !prioritized
        ? addUtilityPenalty(stripExplorationBonus(decision.utility), { instability: 0.05 })
        : decision.utility;
    const nextDecision: PolicyDecisionRecord = {
      ...decision,
      decision_id: stableHash(
        `${decision.decision_id}|${explorationBatchId}|${prioritized ? "prioritized" : "baseline_selected"}`,
      ).slice(0, 16),
      decision_context_id: explorationBatchId,
      decision_mode: governanceReason ? "deterministic" : decision.decision_mode,
      chosen_action: prioritized ? "prioritized" : "baseline_selected",
      action_probability: governanceReason ? 1 : decision.action_probability,
      utility,
      exploration_rank: decision.exploration_rank
        ? {
            ...decision.exploration_rank,
            exploration_batch_id: explorationBatchId,
            prioritized_candidate_ids: prioritizedIdList,
          }
        : null,
      created_at: input.created_at,
    };

    if (governanceReason) {
      overrideRecords.push(
        createOverrideRecord({
          base_decision: decision,
          governed_decision: nextDecision,
          reason_code: governanceReason,
          created_at: input.created_at,
        }),
      );
    }
    return nextDecision;
  });

  return {
    decision_records: decisionRecords,
    prioritized_candidate_ids: prioritizedCandidateIds,
    override_records: overrideRecords,
  };
}
