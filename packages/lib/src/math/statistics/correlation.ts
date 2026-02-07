/**
 * Correlation Statistics - Measures of relationship between variables
 *
 * Provides functions for analyzing relationships between two datasets.
 * All functions are pure and operate on arrays of numbers.
 *
 * Use cases:
 * - Feature correlation analysis (which metrics are related?)
 * - A/B test analysis (is there a relationship between variant and outcome?)
 * - Price elasticity analysis (how does price affect demand?)
 */

import { mean } from "./descriptive";

/**
 * Calculate the covariance between two arrays.
 *
 * Covariance measures how two variables change together.
 * Positive covariance: variables tend to increase together.
 * Negative covariance: one increases when the other decreases.
 *
 * @param xs - First array of values
 * @param ys - Second array of values (must have same length as xs)
 * @param sample - If true, use sample covariance (n-1 divisor), default false
 * @returns The covariance value, or NaN if arrays are empty or have different lengths
 *
 * @example
 * ```typescript
 * covariance([1, 2, 3], [1, 2, 3]); // 0.666... (positive, perfect relationship)
 * covariance([1, 2, 3], [3, 2, 1]); // -0.666... (negative relationship)
 * covariance([1, 2, 3], [5, 5, 5]); // 0 (no relationship)
 * ```
 */
export function covariance(xs: number[], ys: number[], sample = false): number {
  if (xs.length === 0 || ys.length === 0) return NaN;
  if (xs.length !== ys.length) return NaN;

  const n = xs.length;
  if (n === 1) return 0;

  const xMean = mean(xs);
  const yMean = mean(ys);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (xs[i] - xMean) * (ys[i] - yMean);
  }

  const divisor = sample ? n - 1 : n;
  return sum / divisor;
}

/**
 * Calculate Pearson correlation coefficient between two arrays.
 *
 * Measures the linear relationship between two variables.
 * - r = 1: perfect positive linear relationship
 * - r = -1: perfect negative linear relationship
 * - r = 0: no linear relationship
 *
 * @param xs - First array of values
 * @param ys - Second array of values (must have same length as xs)
 * @returns Pearson's r (-1 to 1), or NaN if arrays have zero variance or different lengths
 *
 * @example
 * ```typescript
 * pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]); // 1 (perfect positive)
 * pearson([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]); // -1 (perfect negative)
 * pearson([1, 1, 1], [1, 2, 3]); // NaN (constant array)
 * ```
 */
export function pearson(xs: number[], ys: number[]): number {
  if (xs.length === 0 || ys.length === 0) return NaN;
  if (xs.length !== ys.length) return NaN;

  const n = xs.length;
  const xMean = mean(xs);
  const yMean = mean(ys);

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  // Handle constant arrays (zero variance)
  if (sumX2 === 0 || sumY2 === 0) return NaN;

  return sumXY / Math.sqrt(sumX2 * sumY2);
}

/**
 * Calculate Spearman's rank correlation coefficient between two arrays.
 *
 * Measures the monotonic relationship between two variables using ranks.
 * More robust to outliers and non-linear relationships than Pearson.
 *
 * @param xs - First array of values
 * @param ys - Second array of values (must have same length as xs)
 * @returns Spearman's rho (-1 to 1), or NaN if arrays have different lengths
 *
 * @example
 * ```typescript
 * spearman([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]); // 1 (perfect monotonic)
 * spearman([1, 2, 3], [1, 8, 27]); // 1 (non-linear but monotonic)
 * spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]); // -1 (perfect negative monotonic)
 * ```
 */
export function spearman(xs: number[], ys: number[]): number {
  if (xs.length === 0 || ys.length === 0) return NaN;
  if (xs.length !== ys.length) return NaN;

  const xRanks = rankValues(xs);
  const yRanks = rankValues(ys);

  return pearson(xRanks, yRanks);
}

/**
 * Convert values to ranks (handling ties with average rank).
 *
 * @param values - Array of values to rank
 * @returns Array of ranks (1-based, with ties averaged)
 */
function rankValues(values: number[]): number[] {
  const n = values.length;

  // Create array of [value, originalIndex] pairs
  const indexed: Array<{ value: number; index: number }> = values.map(
    (value, index) => ({ value, index })
  );

  // Sort by value
  indexed.sort((a, b) => a.value - b.value);

  // Assign ranks, averaging ties
  const ranks = new Array<number>(n);
  let i = 0;

  while (i < n) {
    // Find all elements with the same value (ties)
    let j = i;
    while (j < n && indexed[j].value === indexed[i].value) {
      j++;
    }

    // Average rank for tied values (1-based ranks)
    const avgRank = (i + j + 1) / 2; // average of (i+1) and j

    // Assign average rank to all tied values
    for (let k = i; k < j; k++) {
      ranks[indexed[k].index] = avgRank;
    }

    i = j;
  }

  return ranks;
}
