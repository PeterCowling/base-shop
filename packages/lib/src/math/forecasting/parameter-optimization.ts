import {
  HoltWintersAdditive,
  HoltWintersMultiplicative,
} from "./holt-winters.js";
import { scoreModel } from "./utils.js";

/**
 * Options for parameter optimization.
 */
export interface OptimizationOptions {
  /**
   * Step size for coarse grid search.
   * @default 0.1
   */
  coarseStep?: number;

  /**
   * Step size for refined local search.
   * @default 0.02
   */
  refinedStep?: number;

  /**
   * Range for refined search around best coarse parameters.
   * @default 0.08
   */
  refinedRange?: number;

  /**
   * Skip the refinement stage (coarse search only).
   * @default false
   */
  skipRefinement?: boolean;
}

/**
 * Result of parameter optimization.
 */
export interface OptimizationResult {
  /** Optimized alpha parameter (level smoothing) */
  alpha: number;
  /** Optimized beta parameter (trend smoothing) */
  beta: number;
  /** Optimized gamma parameter (seasonal smoothing) */
  gamma: number;
  /** Sum of squared errors for the optimized parameters */
  sse: number;
  /** Akaike Information Criterion for the optimized parameters */
  aic: number;
  /** Total number of parameter combinations evaluated */
  evaluatedCandidates: number;
}

/**
 * Clamps a value to the range [0.01, 0.99].
 */
function clampParameter(value: number): number {
  return Math.max(0.01, Math.min(0.99, value));
}

/**
 * Validates that the seasonal period is valid (>= 2).
 */
function assertSeasonalPeriod(seasonalPeriod: number): void {
  if (seasonalPeriod < 2 || !Number.isInteger(seasonalPeriod)) {
    throw new Error(
      `Seasonal period must be an integer >= 2, got ${seasonalPeriod}`
    );
  }
}

/**
 * Validates that data is sufficient for the seasonal period.
 */
function assertDataLength(
  data: readonly number[],
  seasonalPeriod: number
): void {
  if (data.length < 2 * seasonalPeriod) {
    throw new Error(
      `Data length (${data.length}) must be at least 2 * seasonal period (${2 * seasonalPeriod})`
    );
  }
}

/**
 * Evaluates a single parameter combination and returns the score.
 */
function evaluateParameters(
  data: readonly number[],
  seasonalPeriod: number,
  modelType: "additive" | "multiplicative",
  alpha: number,
  beta: number,
  gamma: number
): { sse: number; aic: number } | null {
  try {
    let fittedValues: number[];
    let minResidualIndex: number;

    // Cast to mutable array for model fitting
    const mutableData = [...data];

    if (modelType === "additive") {
      const model = new HoltWintersAdditive(alpha, beta, gamma);
      model.fit(mutableData, seasonalPeriod);
      fittedValues = model.fittedValues;
      minResidualIndex = model.minResidualIndex;
    } else {
      const model = new HoltWintersMultiplicative({
        alpha,
        beta,
        gamma,
        seasonalPeriod,
      });
      model.fit(mutableData);
      fittedValues = model.fittedValues;
      minResidualIndex = model.minResidualIndex;
    }

    const residuals = data.map((y, i) => y - fittedValues[i]);
    const score = scoreModel(residuals, minResidualIndex, 3); // 3 parameters for HW

    return { sse: score.sse, aic: score.aic };
  } catch {
    // Skip invalid parameter combinations that cause numerical issues
    return null;
  }
}

/**
 * Performs a grid search over parameter space.
 */
function gridSearch(
  data: readonly number[],
  seasonalPeriod: number,
  modelType: "additive" | "multiplicative",
  alphaRange: number[],
  betaRange: number[],
  gammaRange: number[]
): {
  bestParams: { alpha: number; beta: number; gamma: number };
  bestScore: { sse: number; aic: number };
  evaluated: number;
} {
  let bestSSE = Infinity;
  let bestParams = { alpha: 0.3, beta: 0.1, gamma: 0.2 };
  let bestScore = { sse: Infinity, aic: Infinity };
  let evaluated = 0;

  for (const alpha of alphaRange) {
    for (const beta of betaRange) {
      for (const gamma of gammaRange) {
        evaluated++;
        const score = evaluateParameters(
          data,
          seasonalPeriod,
          modelType,
          alpha,
          beta,
          gamma
        );

        if (score && score.sse < bestSSE) {
          bestSSE = score.sse;
          bestParams = { alpha, beta, gamma };
          bestScore = score;
        }
      }
    }
  }

  return { bestParams, bestScore, evaluated };
}

/**
 * Optimizes Holt-Winters parameters using a two-stage grid search approach.
 *
 * Stage 1 (Coarse): Evaluates all combinations of alpha, beta, gamma in [0.1, 0.9] step 0.1.
 * Stage 2 (Refined): Searches around the best coarse point with finer granularity.
 *
 * @param data - Time series data
 * @param seasonalPeriod - Number of observations per seasonal cycle
 * @param modelType - "additive" or "multiplicative"
 * @param options - Optimization options
 * @returns Optimized parameters and quality metrics
 *
 * @example
 * ```typescript
 * const data = [10, 12, 15, 11, 13, 16, ...];
 * const result = optimizeParameters(data, 4, "additive");
 * console.log(result.alpha, result.beta, result.gamma);
 * ```
 */
export function optimizeParameters(
  data: readonly number[],
  seasonalPeriod: number,
  modelType: "additive" | "multiplicative",
  options: OptimizationOptions = {}
): OptimizationResult {
  assertSeasonalPeriod(seasonalPeriod);
  assertDataLength(data, seasonalPeriod);

  const {
    coarseStep = 0.1,
    refinedStep = 0.02,
    refinedRange = 0.08,
    skipRefinement = false,
  } = options;

  // Stage 1: Coarse grid search
  const coarseValues: number[] = [];
  for (let v = 0.1; v <= 0.9; v += coarseStep) {
    coarseValues.push(Math.round(v * 10) / 10); // Avoid floating point precision issues
  }

  const coarseResult = gridSearch(
    data,
    seasonalPeriod,
    modelType,
    coarseValues,
    coarseValues,
    coarseValues
  );

  let totalEvaluated = coarseResult.evaluated;
  let bestParams = coarseResult.bestParams;
  let bestScore = coarseResult.bestScore;

  // Stage 2: Refined local search (unless skipped)
  if (!skipRefinement) {
    const { alpha, beta, gamma } = bestParams;

    // Generate refined ranges around best coarse parameters
    const refineRange = (center: number): number[] => {
      const values: number[] = [];
      const min = clampParameter(center - refinedRange);
      const max = clampParameter(center + refinedRange);

      for (let v = min; v <= max; v += refinedStep) {
        const clamped = clampParameter(v);
        if (!values.includes(clamped)) {
          values.push(clamped);
        }
      }

      return values;
    };

    const alphaRefined = refineRange(alpha);
    const betaRefined = refineRange(beta);
    const gammaRefined = refineRange(gamma);

    const refinedResult = gridSearch(
      data,
      seasonalPeriod,
      modelType,
      alphaRefined,
      betaRefined,
      gammaRefined
    );

    totalEvaluated += refinedResult.evaluated;

    // Use refined result if it's better
    if (refinedResult.bestScore.sse < bestScore.sse) {
      bestParams = refinedResult.bestParams;
      bestScore = refinedResult.bestScore;
    }
  }

  return {
    alpha: bestParams.alpha,
    beta: bestParams.beta,
    gamma: bestParams.gamma,
    sse: bestScore.sse,
    aic: bestScore.aic,
    evaluatedCandidates: totalEvaluated,
  };
}
