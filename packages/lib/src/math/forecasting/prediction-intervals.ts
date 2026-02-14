/**
 * Prediction Intervals for Forecasting Models
 *
 * Compute prediction intervals using naive (normal approximation) or
 * bootstrap methods. Intervals quantify forecast uncertainty and provide
 * confidence bounds for future observations.
 */

import { finiteResiduals } from "./utils.js";

/**
 * Configuration options for prediction intervals
 */
export interface IntervalOptions {
  /** Confidence level (0 < level < 1), default 0.95 */
  level?: number;
  /** Interval method: "naive" (normal quantile) or "bootstrap", default "naive" */
  method?: "naive" | "bootstrap";
  /** Number of bootstrap simulations, default 1000 */
  simulations?: number;
  /** Random seed for reproducibility, default 0 */
  seed?: number;
}

/**
 * Forecast with prediction intervals
 */
export interface ForecastInterval {
  /** Point forecast values */
  forecast: number[];
  /** Lower bound of prediction interval */
  lower: number[];
  /** Upper bound of prediction interval */
  upper: number[];
}

/**
 * Compute prediction intervals for a forecast
 *
 * Supports two methods:
 * 1. Naive: Normal quantile approximation with SE_h = sigma * sqrt(h)
 * 2. Bootstrap: Path simulation with empirical quantiles
 *
 * @param pointForecast - Array of point forecasts (from model.forecast(steps))
 * @param residuals - Array of residuals from fitted model (data[t] - fittedValues[t])
 * @param minResidualIndex - Start of valid residual window (e.g., model.minResidualIndex)
 * @param options - Interval configuration
 * @returns Forecast with lower and upper bounds
 * @throws Error if level is invalid, no finite residuals, or invalid parameters
 *
 * @example
 * ```typescript
 * const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
 * hw.fit(data, 7);
 *
 * const pointForecast = hw.forecast(14);
 * const residuals = data.map((y, i) => y - hw.fittedValues[i]);
 *
 * const interval = forecastWithInterval(
 *   pointForecast,
 *   residuals,
 *   hw.minResidualIndex,
 *   { method: "bootstrap", level: 0.95, seed: 42 }
 * );
 *
 * console.log(interval.lower);  // Lower bounds
 * console.log(interval.forecast); // Point forecast
 * console.log(interval.upper);  // Upper bounds
 * ```
 */
export function forecastWithInterval(
  pointForecast: number[],
  residuals: number[],
  minResidualIndex: number,
  options?: IntervalOptions
): ForecastInterval {
  // Default options
  const level = options?.level ?? 0.95;
  const method = options?.method ?? "naive";
  const simulations = options?.simulations ?? 1000;
  const seed = options?.seed ?? 0;

  // Validate level
  if (level <= 0 || level >= 1) {
    throw new Error("Confidence level must be in (0, 1)");
  }

  // Handle empty forecast
  if (pointForecast.length === 0) {
    return {
      forecast: [],
      lower: [],
      upper: [],
    };
  }

  // Extract finite residuals from scoring window
  const windowResiduals = residuals.slice(minResidualIndex);
  const finite = finiteResiduals(windowResiduals);

  if (finite.length === 0) {
    throw new Error("No finite residuals available for interval computation");
  }

  // Dispatch to method
  if (method === "naive") {
    return naiveInterval(pointForecast, finite, level);
  } else {
    return bootstrapInterval(pointForecast, finite, level, simulations, seed);
  }
}

/**
 * Compute prediction intervals using normal approximation
 *
 * Assumes residuals are normally distributed with constant variance.
 * Standard error grows with sqrt(h) where h is the forecast horizon.
 *
 * Formula:
 * - sigma = stddev(residuals)
 * - SE_h = sigma * sqrt(h)
 * - lower[h] = forecast[h] - z * SE_h
 * - upper[h] = forecast[h] + z * SE_h
 *
 * Where z is the normal quantile at (1 - (1-level)/2).
 */
function naiveInterval(
  pointForecast: number[],
  residuals: number[],
  level: number
): ForecastInterval {
  const steps = pointForecast.length;

  // Compute standard deviation of residuals
  const n = residuals.length;
  const mean = residuals.reduce((a, b) => a + b, 0) / n;
  const variance = residuals.reduce((sum, r) => sum + (r - mean) ** 2, 0) / n;
  const sigma = Math.sqrt(variance);

  // Get normal quantile for two-tailed interval
  const alpha = 1 - level;
  const z = normalQuantile(1 - alpha / 2);

  // Compute intervals
  const lower: number[] = [];
  const upper: number[] = [];

  for (let h = 0; h < steps; h++) {
    // Standard error grows with sqrt(h+1) (h is 0-indexed, horizon is 1-indexed)
    const se = sigma * Math.sqrt(h + 1);
    lower.push(pointForecast[h] - z * se);
    upper.push(pointForecast[h] + z * se);
  }

  return {
    forecast: [...pointForecast],
    lower,
    upper,
  };
}

/**
 * Compute prediction intervals using bootstrap simulation
 *
 * Generates multiple forecast paths by resampling residuals with replacement,
 * then computes empirical quantiles.
 *
 * @param pointForecast - Point forecast
 * @param residuals - Finite residuals from scoring window
 * @param level - Confidence level
 * @param simulations - Number of bootstrap paths
 * @param seed - Random seed
 */
function bootstrapInterval(
  pointForecast: number[],
  residuals: number[],
  level: number,
  simulations: number,
  seed: number
): ForecastInterval {
  const steps = pointForecast.length;
  const n = residuals.length;

  // Initialize RNG
  const rng = new SeededRNG(seed);

  // Generate simulations
  const paths: number[][] = [];
  for (let sim = 0; sim < simulations; sim++) {
    const path: number[] = [];
    for (let h = 0; h < steps; h++) {
      // Sample a residual with replacement
      const idx = Math.floor(rng.next() * n);
      const sampledResidual = residuals[idx];
      path.push(pointForecast[h] + sampledResidual);
    }
    paths.push(path);
  }

  // Compute empirical quantiles
  const alpha = 1 - level;
  const lowerQuantile = alpha / 2;
  const upperQuantile = 1 - alpha / 2;

  const lower: number[] = [];
  const upper: number[] = [];

  for (let h = 0; h < steps; h++) {
    const values = paths.map((path) => path[h]).sort((a, b) => a - b);
    lower.push(quantile(values, lowerQuantile));
    upper.push(quantile(values, upperQuantile));
  }

  return {
    forecast: [...pointForecast],
    lower,
    upper,
  };
}

/**
 * Normal quantile function (inverse CDF)
 *
 * Uses Abramowitz & Stegun rational approximation (26.2.23).
 * Accurate to ~3 decimal places for common confidence levels.
 *
 * @param p - Probability (0 < p < 1)
 * @returns z-score such that P(Z <= z) = p
 */
function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error("Probability must be in (0, 1)");
  }

  // Handle symmetry: use lower tail and negate for upper tail
  if (p > 0.5) {
    return -normalQuantile(1 - p);
  }

  // Rational approximation constants (Abramowitz & Stegun 26.2.23)
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  const t = Math.sqrt(-2 * Math.log(p));
  const numerator = c0 + c1 * t + c2 * t * t;
  const denominator = 1 + d1 * t + d2 * t * t + d3 * t * t * t;

  return -(t - numerator / denominator);
}

/**
 * Compute empirical quantile from sorted array
 *
 * Uses linear interpolation between order statistics.
 *
 * @param sortedValues - Array of values (must be sorted)
 * @param p - Quantile probability (0 < p < 1)
 * @returns Quantile value
 */
function quantile(sortedValues: number[], p: number): number {
  const n = sortedValues.length;
  if (n === 0) {
    return NaN;
  }
  if (n === 1) {
    return sortedValues[0];
  }

  // Linear interpolation between order statistics
  const h = (n - 1) * p;
  const hFloor = Math.floor(h);
  const hCeil = Math.ceil(h);

  if (hFloor === hCeil) {
    return sortedValues[hFloor];
  }

  const lower = sortedValues[hFloor];
  const upper = sortedValues[hCeil];
  return lower + (upper - lower) * (h - hFloor);
}

/**
 * Seeded Linear Congruential Generator (LCG)
 *
 * Simple deterministic PRNG for reproducible bootstrap sampling.
 * Uses parameters from Numerical Recipes (glibc).
 */
class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is positive and non-zero
    this.state = seed === 0 ? 1 : Math.abs(seed);
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    // LCG formula: state = (a * state + c) mod m
    // Using parameters from glibc
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648; // 2^31

    this.state = (a * this.state + c) % m;
    return this.state / m;
  }
}
