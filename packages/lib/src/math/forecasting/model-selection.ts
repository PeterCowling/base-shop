/**
 * Model-selection helpers for forecasting
 *
 * Provides utilities for comparing multiple forecasting models using
 * information criteria (AIC, BIC) on aligned comparison windows.
 */

import type { ModelScore } from "./utils.js";
import { scoreModel } from "./utils.js";

/**
 * Model candidate for comparison
 */
export interface ModelCandidate {
  /** Model name */
  name: string;
  /** Residuals (may contain NaN for warm-up period) */
  residuals: number[];
  /** Number of free parameters */
  numParams: number;
  /** Minimum index for valid residuals (warm-up cutoff) */
  minResidualIndex: number;
}

/**
 * Model comparison result
 */
export interface ModelComparisonResult {
  /** Shared comparison window start index */
  sharedStart: number;
  /** Rankings sorted by AIC ascending (lower is better) */
  rankings: Array<{
    /** Rank (1-based) */
    rank: number;
    /** Model name */
    name: string;
    /** Model score */
    score: ModelScore;
  }>;
}

/**
 * Compare multiple models using aligned scoring window
 *
 * Computes AIC/BIC for each model on a shared comparison window
 * (starting from the maximum minResidualIndex across all models).
 * Results are sorted by AIC ascending (lower AIC = better fit).
 *
 * @param models Array of model candidates to compare
 * @returns Comparison result with rankings
 *
 * @example
 * ```typescript
 * const ses = new SimpleExponentialSmoothing(0.3);
 * ses.fit(data);
 *
 * const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
 * hw.fit(data, 7);
 *
 * const result = compareModels([
 *   {
 *     name: "SES",
 *     residuals: data.map((y, i) => y - ses.fittedValues[i]),
 *     numParams: 1,
 *     minResidualIndex: 0
 *   },
 *   {
 *     name: "HW",
 *     residuals: data.map((y, i) => y - hw.fittedValues[i]),
 *     numParams: 3,
 *     minResidualIndex: hw.minResidualIndex
 *   }
 * ]);
 *
 * console.log(result.rankings[0].name); // Best model
 * ```
 */
export function compareModels(
  models: ModelCandidate[]
): ModelComparisonResult {
  if (models.length === 0) {
    return {
      sharedStart: 0,
      rankings: [],
    };
  }

  // Compute shared comparison window start
  const sharedStart = Math.max(...models.map((m) => m.minResidualIndex));

  // Score each model on the shared window
  const scored = models.map((model) => ({
    name: model.name,
    score: scoreModel(model.residuals, sharedStart, model.numParams),
  }));

  // Sort by AIC ascending (lower is better)
  scored.sort((a, b) => a.score.aic - b.score.aic);

  // Assign ranks
  const rankings = scored.map((item, index) => ({
    rank: index + 1,
    name: item.name,
    score: item.score,
  }));

  return {
    sharedStart,
    rankings,
  };
}

/**
 * Select the best model from a set of candidates
 *
 * Convenience wrapper around compareModels that returns the
 * best-ranked model (lowest AIC).
 *
 * @param models Array of model candidates to compare
 * @returns Best model selection result
 * @throws Error if models array is empty
 *
 * @example
 * ```typescript
 * const { bestModel, scores } = selectBestModel([
 *   { name: "SES", residuals: sesResiduals, numParams: 1, minResidualIndex: 0 },
 *   { name: "Holt", residuals: holtResiduals, numParams: 2, minResidualIndex: 0 },
 *   { name: "HW", residuals: hwResiduals, numParams: 3, minResidualIndex: 8 }
 * ]);
 *
 * console.log(`Best model: ${bestModel}`);
 * console.log(`AIC: ${scores[0].aic}`);
 * ```
 */
export function selectBestModel(models: ModelCandidate[]): {
  bestModel: string;
  scores: ModelScore[];
  sharedStart: number;
} {
  if (models.length === 0) {
    throw new Error("Cannot select best model from empty array");
  }

  const result = compareModels(models);

  return {
    bestModel: result.rankings[0].name,
    scores: result.rankings.map((r) => r.score),
    sharedStart: result.sharedStart,
  };
}
