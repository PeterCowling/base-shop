import {
  type Hypothesis,
  type PortfolioMetadata,
  rankHypotheses,
} from "@acme/lib";

export interface PrioritizeCandidate {
  id: string;
  title: string;
  effort: number;
  impact: number;
  learning_value: number;
  hypothesis_id?: string;
  tags?: string[];
}

export type PortfolioInjectionStatus =
  | "applied"
  | "unlinked"
  | "metadata_missing"
  | "blocked"
  | "hypothesis_not_found";

export interface PrioritizeBridgeItem extends PrioritizeCandidate {
  linked_hypothesis_id?: string;
  baseline_score: number;
  portfolio_score_normalized: number | null;
  final_score: number;
  portfolio_status: PortfolioInjectionStatus;
  blocked_reason?: string;
}

export interface PrioritizeBridgeResult {
  metadata_applied: boolean;
  ranked_hypotheses_count: number;
  blocked_hypotheses_count: number;
  items: PrioritizeBridgeItem[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestRank(sortedValues: number[], percentile: number): number {
  const rank = Math.ceil(percentile * sortedValues.length);
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, rank - 1))];
}

function mapToPrioritizeScale(compositeScores: number[]): number[] {
  if (compositeScores.length === 0) {
    return [];
  }

  if (compositeScores.length === 1) {
    return [3];
  }

  if (compositeScores.length < 10) {
    const minValue = Math.min(...compositeScores);
    const maxValue = Math.max(...compositeScores);
    if (minValue === maxValue) {
      return compositeScores.map(() => 3);
    }

    return compositeScores.map((value) =>
      1 + 4 * ((value - minValue) / (maxValue - minValue))
    );
  }

  const sorted = [...compositeScores].sort((left, right) => left - right);
  const p10 = nearestRank(sorted, 0.1);
  const p90 = nearestRank(sorted, 0.9);
  if (p10 === p90) {
    return compositeScores.map(() => 3);
  }

  return compositeScores.map((value) => {
    const normalized = 1 + 4 * ((value - p10) / (p90 - p10));
    return clamp(normalized, 1, 5);
  });
}

function resolveLinkedHypothesisId(candidate: PrioritizeCandidate): string | undefined {
  const explicit = candidate.hypothesis_id?.trim();
  if (explicit) {
    return explicit;
  }

  for (const tag of candidate.tags ?? []) {
    if (!tag.startsWith("hypothesis:")) {
      continue;
    }
    const parsed = tag.slice("hypothesis:".length).trim();
    if (parsed) {
      return parsed;
    }
  }

  return undefined;
}

function computeBaselineScore(candidate: PrioritizeCandidate): number {
  return (candidate.impact + candidate.learning_value) / candidate.effort;
}

export function injectPortfolioScores(
  candidates: PrioritizeCandidate[],
  hypotheses: Hypothesis[],
  metadata: PortfolioMetadata | null,
): PrioritizeBridgeResult {
  if (!metadata) {
    return {
      metadata_applied: false,
      ranked_hypotheses_count: 0,
      blocked_hypotheses_count: 0,
      items: candidates.map((candidate) => {
        const baseline = computeBaselineScore(candidate);
        const linkedHypothesisId = resolveLinkedHypothesisId(candidate);
        return {
          ...candidate,
          linked_hypothesis_id: linkedHypothesisId,
          baseline_score: baseline,
          portfolio_score_normalized: null,
          final_score: baseline,
          portfolio_status: linkedHypothesisId ? "metadata_missing" : "unlinked",
        };
      }),
    };
  }

  const rankResult = rankHypotheses(hypotheses, metadata);
  const mappedScores = mapToPrioritizeScale(
    rankResult.admissible.map((hypothesis) => hypothesis.composite_score),
  );

  const admissibleScores = new Map<string, number>();
  for (let index = 0; index < rankResult.admissible.length; index += 1) {
    admissibleScores.set(rankResult.admissible[index].id, mappedScores[index]);
  }

  const blockedReasons = new Map<string, string>();
  for (const blocked of rankResult.blocked) {
    blockedReasons.set(blocked.hypothesis.id, blocked.inadmissible_reason);
  }

  const items = candidates.map((candidate) => {
    const baseline = computeBaselineScore(candidate);
    const linkedHypothesisId = resolveLinkedHypothesisId(candidate);

    if (!linkedHypothesisId) {
      return {
        ...candidate,
        baseline_score: baseline,
        portfolio_score_normalized: null,
        final_score: baseline,
        portfolio_status: "unlinked" as const,
      };
    }

    if (blockedReasons.has(linkedHypothesisId)) {
      return {
        ...candidate,
        linked_hypothesis_id: linkedHypothesisId,
        baseline_score: baseline,
        portfolio_score_normalized: 0,
        final_score: 0,
        portfolio_status: "blocked" as const,
        blocked_reason: blockedReasons.get(linkedHypothesisId),
      };
    }

    if (!admissibleScores.has(linkedHypothesisId)) {
      return {
        ...candidate,
        linked_hypothesis_id: linkedHypothesisId,
        baseline_score: baseline,
        portfolio_score_normalized: 0,
        final_score: 0,
        portfolio_status: "hypothesis_not_found" as const,
        blocked_reason: "hypothesis_not_found",
      };
    }

    const normalized = admissibleScores.get(linkedHypothesisId) ?? 0;
    return {
      ...candidate,
      linked_hypothesis_id: linkedHypothesisId,
      baseline_score: baseline,
      portfolio_score_normalized: normalized,
      final_score: normalized,
      portfolio_status: "applied" as const,
    };
  });

  return {
    metadata_applied: true,
    ranked_hypotheses_count: rankResult.admissible.length,
    blocked_hypotheses_count: rankResult.blocked.length,
    items,
  };
}
