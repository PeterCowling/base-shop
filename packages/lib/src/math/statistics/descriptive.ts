/**
 * Descriptive Statistics - Basic statistical calculations
 *
 * Provides common descriptive statistics functions for analyzing datasets.
 * All functions are pure and operate on arrays of numbers.
 *
 * Use cases:
 * - Analytics dashboards (averages, percentiles)
 * - Data quality checks (outlier detection via z-scores)
 * - Performance monitoring (mean response times, distributions)
 * - Business metrics (coefficient of variation for stability analysis)
 */

/**
 * Calculate the sum of an array of numbers.
 *
 * @param values - Array of numeric values
 * @returns Sum of all values, or 0 for empty array
 *
 * @example
 * ```typescript
 * sum([1, 2, 3, 4, 5]); // 15
 * sum([]); // 0
 * ```
 */
export function sum(values: number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    total += values[i];
  }
  return total;
}

/**
 * Calculate the arithmetic mean (average) of an array.
 *
 * @param values - Array of numeric values
 * @returns The mean value, or NaN for empty array
 *
 * @example
 * ```typescript
 * mean([1, 2, 3, 4, 5]); // 3
 * mean([10, 20, 30]); // 20
 * mean([]); // NaN
 * ```
 */
export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return sum(values) / values.length;
}

/**
 * Calculate the median (middle value) of an array.
 *
 * For arrays with an even number of elements, returns the average of the two middle values.
 *
 * @param values - Array of numeric values
 * @returns The median value, or NaN for empty array
 *
 * @example
 * ```typescript
 * median([1, 2, 3, 4, 5]); // 3
 * median([1, 2, 3, 4]); // 2.5
 * median([]); // NaN
 * ```
 */
export function median(values: number[]): number {
  if (values.length === 0) return NaN;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate the mode(s) of an array (most frequently occurring values).
 *
 * Returns all modes if there are multiple values with the same highest frequency.
 *
 * @param values - Array of numeric values
 * @returns Array of mode values (empty for empty input)
 *
 * @example
 * ```typescript
 * mode([1, 2, 2, 3, 3, 3]); // [3]
 * mode([1, 1, 2, 2]); // [1, 2]
 * mode([1, 2, 3]); // [1, 2, 3] (all equal frequency)
 * mode([]); // []
 * ```
 */
export function mode(values: number[]): number[] {
  if (values.length === 0) return [];

  const counts = new Map<number, number>();
  let maxCount = 0;

  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    if (count > maxCount) {
      maxCount = count;
    }
  }

  const modes: number[] = [];
  for (const [value, count] of counts) {
    if (count === maxCount) {
      modes.push(value);
    }
  }

  return modes.sort((a, b) => a - b);
}

/**
 * Calculate the variance of an array.
 *
 * Uses Bessel's correction for sample variance (divides by n-1) when sample=true.
 * Population variance (divides by n) is used when sample=false.
 *
 * @param values - Array of numeric values
 * @param sample - If true, calculate sample variance (default: false for population)
 * @returns The variance, or 0 for single-element arrays, or NaN for empty arrays
 *
 * @example
 * ```typescript
 * variance([2, 4, 4, 4, 5, 5, 7, 9]); // 4 (population)
 * variance([2, 4, 4, 4, 5, 5, 7, 9], true); // 4.571... (sample)
 * variance([5]); // 0
 * variance([]); // NaN
 * ```
 */
export function variance(values: number[], sample = false): number {
  if (values.length === 0) return NaN;
  if (values.length === 1) return 0;

  const avg = mean(values);
  let sumSquaredDiffs = 0;

  for (const value of values) {
    const diff = value - avg;
    sumSquaredDiffs += diff * diff;
  }

  const divisor = sample ? values.length - 1 : values.length;
  return sumSquaredDiffs / divisor;
}

/**
 * Calculate the standard deviation of an array.
 *
 * @param values - Array of numeric values
 * @param sample - If true, calculate sample standard deviation (default: false)
 * @returns The standard deviation, or 0 for single-element arrays, or NaN for empty arrays
 *
 * @example
 * ```typescript
 * stddev([2, 4, 4, 4, 5, 5, 7, 9]); // 2
 * stddev([5]); // 0
 * stddev([]); // NaN
 * ```
 */
export function stddev(values: number[], sample = false): number {
  return Math.sqrt(variance(values, sample));
}

/**
 * Calculate the range (max - min) of an array.
 *
 * @param values - Array of numeric values
 * @returns The range, or NaN for empty array
 *
 * @example
 * ```typescript
 * range([1, 2, 3, 4, 5]); // 4
 * range([5]); // 0
 * range([]); // NaN
 * ```
 */
export function range(values: number[]): number {
  if (values.length === 0) return NaN;
  return max(values) - min(values);
}

/**
 * Find the minimum value in an array.
 *
 * @param values - Array of numeric values
 * @returns The minimum value, or Infinity for empty array
 *
 * @example
 * ```typescript
 * min([1, 2, 3, 4, 5]); // 1
 * min([-5, 0, 5]); // -5
 * min([]); // Infinity
 * ```
 */
export function min(values: number[]): number {
  if (values.length === 0) return Infinity;
  let minimum = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < minimum) {
      minimum = values[i];
    }
  }
  return minimum;
}

/**
 * Find the maximum value in an array.
 *
 * @param values - Array of numeric values
 * @returns The maximum value, or -Infinity for empty array
 *
 * @example
 * ```typescript
 * max([1, 2, 3, 4, 5]); // 5
 * max([-5, 0, 5]); // 5
 * max([]); // -Infinity
 * ```
 */
export function max(values: number[]): number {
  if (values.length === 0) return -Infinity;
  let maximum = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > maximum) {
      maximum = values[i];
    }
  }
  return maximum;
}

/**
 * Calculate a specific percentile of an array using the R-7 method.
 *
 * The R-7 method uses linear interpolation and is the default in Excel and NumPy.
 * For the pth percentile with n values (1-indexed):
 * - h = (n - 1) * p / 100 + 1
 * - percentile = x[floor(h)] + (h - floor(h)) * (x[ceil(h)] - x[floor(h)])
 *
 * @param values - Array of numeric values
 * @param p - Percentile to calculate (0-100)
 * @returns The percentile value
 * @throws RangeError if array is empty or p is out of range [0, 100]
 *
 * @example
 * ```typescript
 * percentile([1, 2, 3, 4, 5], 50); // 3 (median)
 * percentile([1, 2, 3, 4, 5], 25); // 2
 * percentile([1, 2, 3, 4, 5], 75); // 4
 * percentile([], 50); // throws RangeError
 * ```
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new RangeError("Cannot calculate percentile of empty array");
  }
  if (p < 0 || p > 100) {
    throw new RangeError("Percentile must be between 0 and 100");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  if (p === 0) return sorted[0];
  if (p === 100) return sorted[n - 1];

  // R-7 method (linear interpolation)
  const h = ((n - 1) * p) / 100;
  const lower = Math.floor(h);
  const upper = Math.ceil(h);
  const fraction = h - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/**
 * Calculate the quartiles (Q1, Q2, Q3) of an array.
 *
 * Uses the R-7 method for percentile calculation.
 *
 * @param values - Array of numeric values
 * @returns Tuple of [Q1, Q2 (median), Q3]
 * @throws RangeError if array is empty
 *
 * @example
 * ```typescript
 * quartiles([1, 2, 3, 4, 5, 6, 7]); // [2, 4, 6]
 * quartiles([1, 2, 3, 4, 5, 6, 7, 8]); // [2.5, 4.5, 6.5]
 * ```
 */
export function quartiles(values: number[]): [number, number, number] {
  if (values.length === 0) {
    throw new RangeError("Cannot calculate quartiles of empty array");
  }
  return [percentile(values, 25), percentile(values, 50), percentile(values, 75)];
}

/**
 * Calculate the interquartile range (IQR = Q3 - Q1).
 *
 * The IQR is a measure of statistical dispersion and is useful for identifying outliers.
 *
 * @param values - Array of numeric values
 * @returns The interquartile range
 * @throws RangeError if array is empty
 *
 * @example
 * ```typescript
 * iqr([1, 2, 3, 4, 5, 6, 7]); // 4 (6 - 2)
 * ```
 */
export function iqr(values: number[]): number {
  const [q1, , q3] = quartiles(values);
  return q3 - q1;
}

/**
 * Calculate the skewness of an array (measure of asymmetry).
 *
 * Positive skewness indicates a longer right tail.
 * Negative skewness indicates a longer left tail.
 * Uses Fisher's sample skewness formula (adjusted Fisher-Pearson).
 *
 * @param values - Array of numeric values (minimum 3 elements)
 * @returns The skewness value, or NaN for arrays with less than 3 elements or zero variance
 *
 * @example
 * ```typescript
 * skewness([1, 2, 3, 4, 5]); // ~0 (symmetric)
 * skewness([1, 1, 1, 1, 5]); // positive (right-skewed)
 * ```
 */
export function skewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return NaN;

  const avg = mean(values);
  const std = stddev(values);
  if (std === 0) return NaN;

  let sumCubed = 0;
  for (const value of values) {
    sumCubed += Math.pow((value - avg) / std, 3);
  }

  // Adjusted Fisher-Pearson coefficient
  const adjustment = (n * Math.sqrt(n - 1)) / (n - 2);
  return (sumCubed / n) * (n / ((n - 1) * (n - 2))) * adjustment;
}

/**
 * Calculate the kurtosis of an array (measure of tailedness).
 *
 * Uses excess kurtosis (subtracts 3 so normal distribution has kurtosis of 0).
 * - Positive kurtosis: heavy tails (leptokurtic)
 * - Negative kurtosis: light tails (platykurtic)
 * - Zero: similar to normal distribution (mesokurtic)
 *
 * @param values - Array of numeric values (minimum 4 elements)
 * @returns The excess kurtosis, or NaN for arrays with less than 4 elements or zero variance
 *
 * @example
 * ```typescript
 * kurtosis([1, 2, 3, 4, 5]); // ~-1.3 (platykurtic, uniform-like)
 * ```
 */
export function kurtosis(values: number[]): number {
  const n = values.length;
  if (n < 4) return NaN;

  const avg = mean(values);
  const std = stddev(values);
  if (std === 0) return NaN;

  let sumFourth = 0;
  for (const value of values) {
    sumFourth += Math.pow((value - avg) / std, 4);
  }

  // Excess kurtosis with bias correction
  const term1 = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourth;
  const term2 = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));

  return term1 - term2;
}

/**
 * Calculate the z-score (standard score) of a value.
 *
 * The z-score indicates how many standard deviations a value is from the mean.
 *
 * @param value - The value to calculate z-score for
 * @param avg - The mean of the distribution
 * @param std - The standard deviation of the distribution
 * @returns The z-score, or NaN if std is 0
 *
 * @example
 * ```typescript
 * zScore(100, 80, 10); // 2 (2 standard deviations above mean)
 * zScore(70, 80, 10); // -1 (1 standard deviation below mean)
 * ```
 */
export function zScore(value: number, avg: number, std: number): number {
  if (std === 0) return NaN;
  return (value - avg) / std;
}

/**
 * Normalize an array of values to the range [0, 1] using min-max normalization.
 *
 * @param values - Array of numeric values
 * @returns Array of normalized values in [0, 1]
 * @throws RangeError if array is empty
 *
 * @example
 * ```typescript
 * normalizeArray([0, 5, 10]); // [0, 0.5, 1]
 * normalizeArray([10, 20, 30, 40]); // [0, 0.333..., 0.666..., 1]
 * normalizeArray([5, 5, 5]); // [0, 0, 0] (all same value)
 * ```
 */
export function normalizeArray(values: number[]): number[] {
  if (values.length === 0) {
    throw new RangeError("Cannot normalize empty array");
  }

  const minVal = min(values);
  const maxVal = max(values);
  const rangeVal = maxVal - minVal;

  if (rangeVal === 0) {
    return values.map(() => 0);
  }

  return values.map((v) => (v - minVal) / rangeVal);
}

/**
 * Calculate the coefficient of variation (relative standard deviation).
 *
 * CV = stddev / mean, expressed as a ratio (not percentage).
 * Useful for comparing variability across datasets with different units or means.
 *
 * @param values - Array of numeric values
 * @returns The coefficient of variation, or NaN for empty array or zero mean
 *
 * @example
 * ```typescript
 * coefOfVariation([10, 20, 30]); // ~0.5 (50% relative variability)
 * coefOfVariation([100, 101, 99]); // ~0.01 (1% relative variability)
 * ```
 */
export function coefOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0 || Number.isNaN(avg)) return NaN;
  return stddev(values) / Math.abs(avg);
}
