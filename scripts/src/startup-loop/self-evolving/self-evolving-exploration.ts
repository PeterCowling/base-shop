import { thompsonSampling } from "@acme/lib/math/experimentation";
import { SeededRandom } from "@acme/lib/math/random";

import {
  explorationActuationEnabled,
  resolveExplorationPolicyMode,
} from "./self-evolving-authority.js";
import type { RankedCandidate } from "./self-evolving-candidates.js";
import {
  type BetaPosterior,
  type ExplorationPolicyMode,
  type ExplorationRankContext,
  type PolicyDecisionRecord,
  type SelfEvolvingPolicyState,
  stableHash,
  type UtilityBreakdown,
} from "./self-evolving-contracts.js";

interface ExplorationArm {
  ranked_candidate: RankedCandidate;
  portfolio_decision: PolicyDecisionRecord;
  baseline_adjusted_utility: number;
  success_posterior: BetaPosterior;
  impact_posterior: BetaPosterior;
  uncertainty_width: number;
  context_weight: number;
  posterior_mean: number;
}

export interface ExplorationDecisionResult {
  exploration_batch_id: string;
  candidate_set_hash: string;
  prioritized_candidate_ids: Set<string>;
  decision_records: PolicyDecisionRecord[];
  applied: boolean;
  policy_mode: ExplorationPolicyMode;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function resolveBudgetSlots(policyState: SelfEvolvingPolicyState): number {
  return policyState.active_constraint_profile.exploration_budget_slots ?? 0;
}

function candidateSetHash(arms: readonly ExplorationArm[]): string {
  return stableHash(
    JSON.stringify(
      arms.map((arm) => ({
        candidate_id: arm.ranked_candidate.candidate.candidate_id,
        baseline_adjusted_utility: arm.baseline_adjusted_utility,
      })),
    ),
  ).slice(0, 16);
}

function seedFromHash(hash: string): number {
  return Number.parseInt(hash.slice(0, 8), 16) >>> 0;
}

function posteriorMean(posterior: BetaPosterior): number {
  return posterior.alpha / (posterior.alpha + posterior.beta);
}

function posteriorUncertaintyWidth(posterior: BetaPosterior): number {
  const total = posterior.alpha + posterior.beta;
  const variance =
    (posterior.alpha * posterior.beta) / (total * total * (total + 1));
  return Math.min(1, Math.sqrt(Math.max(variance, 0)) * 4);
}

function routeWeight(route: string): number {
  if (route === "lp-do-build") return 0.08;
  if (route === "lp-do-plan") return 0.05;
  return 0.02;
}

function evidenceWeight(classification: RankedCandidate["score"]["evidence"]["classification"]): number {
  if (classification === "structural_only") return 0.08;
  if (classification === "instrumented") return 0.04;
  if (classification === "measured") return -0.03;
  return 0;
}

function stageWeight(stage: PolicyDecisionRecord["structural_snapshot"]["startup_stage"]): number {
  if (stage === "traction") return 0.02;
  if (stage === "launched") return 0.01;
  return 0;
}

function createFallbackPosterior(): BetaPosterior {
  return {
    family: "beta_binomial",
    prior_alpha: 1,
    prior_beta: 1,
    alpha: 1,
    beta: 1,
    successes: 0,
    failures: 0,
    updated_through_event_id: null,
  };
}

function buildExplorationArms(input: {
  ranked_candidates: readonly RankedCandidate[];
  portfolio_decisions: readonly PolicyDecisionRecord[];
  policy_state: SelfEvolvingPolicyState;
}): ExplorationArm[] {
  const portfolioDecisionByCandidateId = new Map(
    input.portfolio_decisions
      .filter(
        (decision) =>
          decision.decision_type === "portfolio_selection" &&
          decision.chosen_action === "selected",
      )
      .map((decision) => [decision.candidate_id, decision] as const),
  );

  return input.ranked_candidates
    .filter((rankedCandidate) => portfolioDecisionByCandidateId.has(rankedCandidate.candidate.candidate_id))
    .map((rankedCandidate): ExplorationArm => {
      const portfolioDecision = portfolioDecisionByCandidateId.get(
        rankedCandidate.candidate.candidate_id,
      );
      if (!portfolioDecision) {
        throw new Error(
          `exploration_missing_portfolio_decision:${rankedCandidate.candidate.candidate_id}`,
        );
      }
      const belief =
        input.policy_state.candidate_beliefs[rankedCandidate.candidate.candidate_id] ?? null;
      const successPosterior = belief?.success_if_attempted ?? createFallbackPosterior();
      const impactPosterior = belief?.positive_impact_if_attempted ?? createFallbackPosterior();
      const portfolioSignal = portfolioDecision.portfolio_selection?.signal_snapshot ?? null;
      const contextWeight = Number(
        (
          routeWeight(rankedCandidate.route.route) +
          evidenceWeight(rankedCandidate.score.evidence.classification) +
          stageWeight(portfolioDecision.structural_snapshot.startup_stage) -
          (portfolioSignal?.graph_bottleneck_score ?? 0) * 0.05 -
          (portfolioSignal?.survival_penalty ?? 0) * 0.4
        ).toFixed(4),
      );

      return {
        ranked_candidate: rankedCandidate,
        portfolio_decision: portfolioDecision,
        baseline_adjusted_utility:
          portfolioSignal?.adjusted_utility ??
          rankedCandidate.policy_context?.portfolio_adjusted_utility ??
          rankedCandidate.score.utility.net_utility,
        success_posterior: successPosterior,
        impact_posterior: impactPosterior,
        uncertainty_width: Number(
          (
            (posteriorUncertaintyWidth(successPosterior) +
              posteriorUncertaintyWidth(impactPosterior)) /
            2
          ).toFixed(6),
        ),
        context_weight: contextWeight,
        posterior_mean: Number(
          (
            (posteriorMean(successPosterior) + posteriorMean(impactPosterior)) /
            2
          ).toFixed(6),
        ),
      };
    })
    .sort((left, right) =>
      compareStrings(left.ranked_candidate.candidate.candidate_id, right.ranked_candidate.candidate.candidate_id),
    );
}

function sampleExplorationSignals(
  arms: readonly ExplorationArm[],
  rng: SeededRandom,
): Array<{
  candidate_id: string;
  sampled_success_probability: number;
  sampled_impact_probability: number;
  exploration_bonus: number;
  exploration_score: number;
}> {
  const successSamples = thompsonSampling(
    arms.map((arm) => ({
      alpha: arm.success_posterior.alpha,
      beta: arm.success_posterior.beta,
    })),
    { rng },
  ).sampledProbabilities;
  const impactSamples = thompsonSampling(
    arms.map((arm) => ({
      alpha: arm.impact_posterior.alpha,
      beta: arm.impact_posterior.beta,
    })),
    { rng },
  ).sampledProbabilities;

  return arms.map((arm, index) => {
    const sampledSuccessProbability = successSamples[index] ?? posteriorMean(arm.success_posterior);
    const sampledImpactProbability = impactSamples[index] ?? posteriorMean(arm.impact_posterior);
    const sampledLift =
      ((sampledSuccessProbability + sampledImpactProbability) / 2 - arm.posterior_mean) * 0.35;
    const explorationBonus = Number(
      (
        arm.uncertainty_width * 0.75 +
        arm.context_weight +
        sampledLift
      ).toFixed(6),
    );
    return {
      candidate_id: arm.ranked_candidate.candidate.candidate_id,
      sampled_success_probability: Number(sampledSuccessProbability.toFixed(6)),
      sampled_impact_probability: Number(sampledImpactProbability.toFixed(6)),
      exploration_bonus: explorationBonus,
      exploration_score: Number(
        (arm.baseline_adjusted_utility + explorationBonus).toFixed(6),
      ),
    };
  });
}

function pickPrioritizedCandidateIds(input: {
  arms: readonly ExplorationArm[];
  sampled_signals: ReturnType<typeof sampleExplorationSignals>;
  budget_slots: number;
}): string[] {
  if (input.budget_slots <= 0) {
    return [];
  }
  return [...input.sampled_signals]
    .sort((left, right) => {
      if (left.exploration_score !== right.exploration_score) {
        return right.exploration_score - left.exploration_score;
      }
      return compareStrings(left.candidate_id, right.candidate_id);
    })
    .slice(0, Math.min(input.budget_slots, input.arms.length))
    .map((signal) => signal.candidate_id);
}

function estimatePrioritizationProbabilities(input: {
  arms: readonly ExplorationArm[];
  budget_slots: number;
  seed: number;
  simulation_trials: number;
}): Map<string, number> {
  const counts = new Map<string, number>();
  for (const arm of input.arms) {
    counts.set(arm.ranked_candidate.candidate.candidate_id, 0);
  }

  if (input.budget_slots <= 0) {
    return new Map(
      [...counts.keys()].map((candidateId) => [candidateId, 0] as const),
    );
  }

  for (let trial = 0; trial < input.simulation_trials; trial++) {
    const rng = new SeededRandom((input.seed + trial + 1) >>> 0);
    const sampledSignals = sampleExplorationSignals(input.arms, rng);
    const prioritizedIds = pickPrioritizedCandidateIds({
      arms: input.arms,
      sampled_signals: sampledSignals,
      budget_slots: input.budget_slots,
    });
    for (const candidateId of prioritizedIds) {
      counts.set(candidateId, (counts.get(candidateId) ?? 0) + 1);
    }
  }

  return new Map(
    [...counts.entries()].map(([candidateId, count]) => [
      candidateId,
      Number((count / input.simulation_trials).toFixed(6)),
    ]),
  );
}

function toExplorationUtility(
  utility: UtilityBreakdown,
  explorationBonus: number,
): UtilityBreakdown {
  return {
    ...utility,
    exploration_bonus: Number(explorationBonus.toFixed(6)),
    net_utility: Number(
      (
        utility.expected_reward -
        utility.downside_penalty -
        utility.effort_penalty -
        utility.evidence_penalty -
        utility.instability_penalty +
        explorationBonus
      ).toFixed(6),
    ),
  };
}

export function buildExplorationDecisionLayer(input: {
  business_id: string;
  ranked_candidates: readonly RankedCandidate[];
  portfolio_decisions: readonly PolicyDecisionRecord[];
  policy_state: SelfEvolvingPolicyState;
  created_at: string;
}): ExplorationDecisionResult {
  const arms = buildExplorationArms(input);
  const setHash = candidateSetHash(arms);
  const batchHash = stableHash(
    `${input.business_id}|${setHash}|${input.created_at}|exploration`,
  );
  const explorationBatchId = batchHash.slice(0, 16);
  const seed = seedFromHash(batchHash);
  const budgetSlots = resolveBudgetSlots(input.policy_state);
  const policyMode = resolveExplorationPolicyMode({
    authority_level: input.policy_state.authority_level,
    budget_slots: budgetSlots,
  });
  const applied = explorationActuationEnabled(policyMode);

  if (arms.length === 0) {
    return {
      exploration_batch_id: explorationBatchId,
      candidate_set_hash: setHash,
      prioritized_candidate_ids: new Set<string>(),
      decision_records: [],
      applied,
      policy_mode: policyMode,
    };
  }

  const deterministic =
    policyMode === "off" ||
    budgetSlots <= 0 ||
    arms.length === 1 ||
    budgetSlots >= arms.length;
  const effectiveBudget =
    deterministic && budgetSlots >= arms.length ? arms.length : Math.max(0, budgetSlots);
  const rng = new SeededRandom(seed);
  const sampledSignals = sampleExplorationSignals(arms, rng);
  const prioritizedCandidateIds = deterministic
    ? effectiveBudget >= arms.length
      ? arms.map((arm) => arm.ranked_candidate.candidate.candidate_id)
      : []
    : pickPrioritizedCandidateIds({
        arms,
        sampled_signals: sampledSignals,
        budget_slots: effectiveBudget,
      });
  const prioritizedSet = new Set(prioritizedCandidateIds);
  const prioritizationProbabilities = deterministic
    ? new Map(
        arms.map((arm) => {
          const candidateId = arm.ranked_candidate.candidate.candidate_id;
          return [candidateId, prioritizedSet.has(candidateId) ? 1 : 0] as const;
        }),
      )
    : estimatePrioritizationProbabilities({
        arms,
        budget_slots: effectiveBudget,
        seed,
        simulation_trials: 256,
      });
  const sampledSignalByCandidateId = new Map(
    sampledSignals.map((signal) => [signal.candidate_id, signal] as const),
  );

  const decisionRecords = arms.map((arm): PolicyDecisionRecord => {
    const candidateId = arm.ranked_candidate.candidate.candidate_id;
    const signal =
      sampledSignalByCandidateId.get(candidateId) ??
      {
        candidate_id: candidateId,
        sampled_success_probability: posteriorMean(arm.success_posterior),
        sampled_impact_probability: posteriorMean(arm.impact_posterior),
        exploration_bonus: 0,
        exploration_score: arm.baseline_adjusted_utility,
      };
    const prioritized = prioritizedSet.has(candidateId);
    const actionProbability = deterministic
      ? 1
      : prioritized
        ? prioritizationProbabilities.get(candidateId) ?? 0
        : Number((1 - (prioritizationProbabilities.get(candidateId) ?? 0)).toFixed(6));
    const context: ExplorationRankContext = {
      schema_version: "exploration-rank.v1",
      exploration_batch_id: explorationBatchId,
      candidate_set_hash: setHash,
      portfolio_id: arm.portfolio_decision.portfolio_selection?.portfolio_id ?? null,
      policy_mode: policyMode,
      budget_slots: effectiveBudget,
      seed,
      prioritized_candidate_ids: [...prioritizedSet].sort(compareStrings),
      signal_snapshot: {
        baseline_adjusted_utility: arm.baseline_adjusted_utility,
        sampled_success_probability: signal.sampled_success_probability,
        sampled_impact_probability: signal.sampled_impact_probability,
        uncertainty_width: arm.uncertainty_width,
        context_weight: arm.context_weight,
        exploration_bonus: signal.exploration_bonus,
        exploration_score: signal.exploration_score,
      },
    };

    return {
      ...arm.portfolio_decision,
      decision_id: stableHash(
        `${arm.portfolio_decision.decision_id}|${explorationBatchId}|${prioritized ? "prioritized" : "baseline"}`,
      ).slice(0, 16),
      decision_type: "exploration_rank",
      decision_mode: deterministic ? "deterministic" : "stochastic",
      decision_context_id: explorationBatchId,
      eligible_actions: ["prioritized", "baseline_selected"],
      chosen_action: prioritized ? "prioritized" : "baseline_selected",
      action_probability: actionProbability,
      utility: toExplorationUtility(
        arm.portfolio_decision.utility,
        signal.exploration_bonus,
      ),
      portfolio_selection: null,
      exploration_rank: context,
      promotion_gate: null,
      created_at: input.created_at,
    };
  });

  return {
    exploration_batch_id: explorationBatchId,
    candidate_set_hash: setHash,
    prioritized_candidate_ids: prioritizedSet,
    decision_records: decisionRecords,
    applied,
    policy_mode: policyMode,
  };
}
