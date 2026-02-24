/**
 * Forecasting utilities - Shared helpers for Holt-Winters and seasonal forecasting
 *
 * Validation helpers, seasonal normalization, residual scoring, and
 * model-selection alignment utilities.
 */
import { mean as libMean } from "../statistics/descriptive.js";

/**
 * Assert that all elements in an array are finite
 *
 * @param data Array to validate
 * @throws Error if any element is not finite
 */
export function assertFiniteArray(data: number[]): void {
  for (let i = 0; i < data.length; i++) {
    if (!Number.isFinite(data[i])) {
      throw new Error("Data contains non-finite values");
    }
  }
}

/**
 * Assert that seasonal period is valid and data length is sufficient
 *
 * @param m Seasonal period
 * @param n Data length
 * @throws Error if m is not an integer, m < 2, or n < 2*m
 */
export function assertSeasonalPeriod(m: number, n: number): void {
  if (!Number.isInteger(m)) {
    throw new Error("Seasonal period must be an integer");
  }
  if (m < 2) {
    throw new Error("Seasonal period must be at least 2");
  }
  if (n < 2 * m) {
    throw new Error(
      `Data length (${n}) must be at least 2 * seasonal period (${m})`
    );
  }
}

/**
 * Normalize seasonal indices to mean 0 (additive seasonality)
 *
 * @param seasonals Array of seasonal indices
 * @returns Normalized seasonal indices with mean approximately 0
 */
export function normalizeSeasonalAdditive(seasonals: number[]): number[] {
  if (seasonals.length === 0) {
    return [];
  }

  const mean = libMean(seasonals);
  return seasonals.map((s) => s - mean);
}

/**
 * Normalize seasonal indices to mean 1 (multiplicative seasonality)
 *
 * @param seasonals Array of seasonal indices
 * @returns Normalized seasonal indices with mean approximately 1
 */
export function normalizeSeasonalMultiplicative(seasonals: number[]): number[] {
  if (seasonals.length === 0) {
    return [];
  }

  const mean = libMean(seasonals);
  return seasonals.map((s) => s / mean);
}

/**
 * Get seasonal index with modulo wrapping
 *
 * @param offset Time offset (0-based)
 * @param m Seasonal period
 * @returns Seasonal index (0 to m-1)
 */
export function seasonIndex(offset: number, m: number): number {
  return offset % m;
}

/**
 * Get seasonal index at forecast horizon
 *
 * @param lastIndex Last observation index (0-based)
 * @param h Forecast horizon (steps ahead, 1-based)
 * @param m Seasonal period
 * @returns Seasonal index for the forecast horizon
 */
export function seasonAtHorizon(
  lastIndex: number,
  h: number,
  m: number
): number {
  return (lastIndex + h) % m;
}

/**
 * Filter to finite residuals only
 *
 * @param values Array of residuals (may contain NaN/Infinity)
 * @returns Array containing only finite values
 */
export function finiteResiduals(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

/**
 * Calculate sum of squared errors for finite values only
 *
 * @param values Array of residuals
 * @returns SSE of finite values
 */
export function sumSquaredError(values: number[]): number {
  let sse = 0;
  for (const v of values) {
    if (Number.isFinite(v)) {
      sse += v * v;
    }
  }
  return sse;
}

/**
 * Model scoring result
 */
export interface ModelScore {
  /** Total number of observations */
  n: number;
  /** Effective sample size (finite residuals from startIndex) */
  nEffective: number;
  /** Sum of squared errors (finite residuals from startIndex) */
  sse: number;
  /** MLE estimate of error variance (floored to Number.EPSILON) */
  sigma2MLE: number;
  /** Log-likelihood (Gaussian) */
  logLik: number;
  /** Akaike Information Criterion */
  aic: number;
  /** Bayesian Information Criterion */
  bic: number;
}

/**
 * Score a model using aligned scoring window
 *
 * Calculates log-likelihood, AIC, and BIC for model comparison.
 * Uses only finite residuals from startIndex onward.
 *
 * @param residuals Full residual array (may contain NaN for warm-up period)
 * @param startIndex Index to start scoring window (typically minResidualIndex)
 * @param numParams Number of free parameters in the model
 * @returns Model scoring metrics
 */
export function scoreModel(
  residuals: number[],
  startIndex: number,
  numParams: number
): ModelScore {
  const n = residuals.length;

  // Extract finite residuals from the comparison window
  const windowResiduals = residuals.slice(startIndex);
  const finite = finiteResiduals(windowResiduals);
  const nEffective = finite.length;
  const sse = sumSquaredError(finite);

  // Floor sigma2 to avoid log(0)
  const sigma2MLE = nEffective > 0 ? Math.max(sse / nEffective, Number.EPSILON) : Number.EPSILON;

  // Gaussian log-likelihood
  const logLik =
    nEffective > 0
      ? (-nEffective / 2) * (Math.log(2 * Math.PI) + Math.log(sigma2MLE) + 1)
      : 0;

  // AIC = -2*logLik + 2*k
  const aic = -2 * logLik + 2 * numParams;

  // BIC = -2*logLik + k*log(n_effective)
  const bic = nEffective > 0 ? -2 * logLik + numParams * Math.log(nEffective) : 0;

  return {
    n,
    nEffective,
    sse,
    sigma2MLE,
    logLik,
    aic,
    bic,
  };
}
