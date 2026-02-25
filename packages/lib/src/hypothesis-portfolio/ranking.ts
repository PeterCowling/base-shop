import { percentileNearestRank } from "../math/statistics/index.js";

import type { Hypothesis, PortfolioMetadata } from "./types.js";
import { validateHypothesis } from "./validation.js";

export type InadmissibleReason =
  | "negative_ev"
  | "unit_horizon_mismatch"
  | "non_monetary_unit_requires_conversion"
  | "invalid_frontmatter";

export interface RankedHypothesis extends Hypothesis {
  effort_cost: number;
  ev: number;
  ev_norm: number;
  time_norm: number;
  cost_norm: number;
  composite_score: number;
}

export interface BlockedHypothesis {
  hypothesis: Hypothesis;
  inadmissible_reason: InadmissibleReason;
  detail: string;
}

export interface RankHypothesesResult {
  admissible: RankedHypothesis[];
  blocked: BlockedHypothesis[];
}

function clampZeroToOne(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function normalizeWithPolicy(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const normalizedInput =
    values.length >= 10
      ? values.map((value) => {
          const p10 = percentileNearestRank(sortedValues, 0.1);
          const p90 = percentileNearestRank(sortedValues, 0.9);
          return Math.max(p10, Math.min(p90, value));
        })
      : [...values];

  const minValue = Math.min(...normalizedInput);
  const maxValue = Math.max(...normalizedInput);
  if (minValue === maxValue) {
    return normalizedInput.map(() => 1);
  }

  return normalizedInput.map((value) => clampZeroToOne((value - minValue) / (maxValue - minValue)));
}

function computeEffortCost(
  hypothesis: Hypothesis,
  metadata: PortfolioMetadata,
): number {
  return hypothesis.required_effort_days * metadata.loaded_cost_per_person_day;
}

function computeExpectedValue(
  hypothesis: Hypothesis,
  metadata: PortfolioMetadata,
): number {
  const successProbability = hypothesis.prior_confidence / 100;
  const failureProbability = 1 - successProbability;
  const effortCost = computeEffortCost(hypothesis, metadata);
  return (
    successProbability * hypothesis.upside_estimate -
    failureProbability * hypothesis.downside_estimate -
    hypothesis.required_spend -
    effortCost
  );
}

export function rankHypotheses(
  hypotheses: Hypothesis[],
  metadata: PortfolioMetadata,
): RankHypothesesResult {
  const blocked: BlockedHypothesis[] = [];
  const candidates: Array<{
    hypothesis: Hypothesis;
    effortCost: number;
    ev: number;
    detectionWindowDays: number;
  }> = [];

  for (const hypothesis of hypotheses) {
    const validation = validateHypothesis(hypothesis, {
      evRanked: true,
      portfolioDefaults: {
        default_detection_window_days: metadata.default_detection_window_days,
      },
      portfolioDomain: {
        valueUnit: metadata.default_value_unit,
        valueHorizonDays: metadata.default_value_horizon_days,
      },
    });

    if (validation.ok === false) {
      blocked.push({
        hypothesis,
        inadmissible_reason:
          validation.error.code === "unit_horizon_mismatch"
            ? "unit_horizon_mismatch"
            : validation.error.code === "non_monetary_unit_requires_conversion"
              ? "non_monetary_unit_requires_conversion"
              : "invalid_frontmatter",
        detail: validation.error.message,
      });
      continue;
    }

    const validHypothesis = validation.value;
    const effortCost = computeEffortCost(validHypothesis, metadata);
    const ev = computeExpectedValue(validHypothesis, metadata);
    if (ev <= 0) {
      blocked.push({
        hypothesis: validHypothesis,
        inadmissible_reason: "negative_ev",
        detail: "expected value is non-positive",
      });
      continue;
    }

    candidates.push({
      hypothesis: validHypothesis,
      effortCost,
      ev,
      detectionWindowDays:
        validHypothesis.detection_window_days ??
        metadata.default_detection_window_days,
    });
  }

  if (candidates.length === 0) {
    return { admissible: [], blocked };
  }

  const evNorm = normalizeWithPolicy(candidates.map((candidate) => candidate.ev));
  const spendNorm = normalizeWithPolicy(
    candidates.map((candidate) => candidate.hypothesis.required_spend),
  );

  const minWindow = Math.min(...candidates.map((candidate) => candidate.detectionWindowDays));
  const maxWindow = Math.max(...candidates.map((candidate) => candidate.detectionWindowDays));

  const timeNorm = candidates.map((candidate) => {
    if (minWindow === maxWindow) {
      return 1;
    }
    return clampZeroToOne((maxWindow - candidate.detectionWindowDays) / (maxWindow - minWindow));
  });

  const ranked: RankedHypothesis[] = candidates.map((candidate, index) => {
    const costNorm = 1 - spendNorm[index];
    const composite =
      metadata.ev_score_weight * evNorm[index] +
      metadata.time_score_weight * timeNorm[index] +
      metadata.cost_score_weight * costNorm;

    return {
      ...candidate.hypothesis,
      effort_cost: candidate.effortCost,
      ev: candidate.ev,
      ev_norm: evNorm[index],
      time_norm: timeNorm[index],
      cost_norm: costNorm,
      composite_score: composite,
    };
  });

  ranked.sort((left, right) => {
    if (right.composite_score !== left.composite_score) {
      return right.composite_score - left.composite_score;
    }
    if (right.ev !== left.ev) {
      return right.ev - left.ev;
    }
    return left.required_spend - right.required_spend;
  });

  return { admissible: ranked, blocked };
}
