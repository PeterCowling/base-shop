import { mean, stddev } from "../statistics/descriptive.js";

/**
 * Standard deviation with zero fallback for empty/degenerate inputs.
 */
export function stddevOrZero(values: number[], sample = false): number {
  const result = stddev(values, sample);
  return Number.isFinite(result) ? result : 0;
}

/**
 * Z-score against a reference window.
 * Returns null when the window has zero variance or is empty.
 */
export function rollingZScore(value: number, window: number[]): number | null {
  if (window.length === 0) {
    return null;
  }

  const avg = mean(window);
  const sd = stddevOrZero(window);
  if (!Number.isFinite(avg) || sd === 0) {
    return null;
  }
  return (value - avg) / sd;
}

/**
 * Outlier test using absolute z-score threshold.
 */
export function isZScoreOutlier(
  value: number,
  window: number[],
  sigma = 2,
): boolean {
  const z = rollingZScore(value, window);
  return z !== null && Math.abs(z) > sigma;
}
