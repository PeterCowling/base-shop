/**
 * Statistics Module - Descriptive statistics, correlation, and streaming statistics
 *
 * Provides comprehensive statistical analysis tools for data analysis,
 * performance monitoring, and analytics dashboards.
 *
 * @example
 * ```typescript
 * import {
 *   mean, median, percentile, stddev,
 *   pearson, covariance,
 *   OnlineStats, Histogram
 * } from '@acme/lib/math/statistics';
 *
 * // Basic statistics
 * const avg = mean([1, 2, 3, 4, 5]); // 3
 * const p95 = percentile(responseTimes, 95);
 *
 * // Correlation
 * const r = pearson(prices, sales);
 *
 * // Streaming statistics
 * const stats = new OnlineStats();
 * for (const value of largeDataStream) {
 *   stats.push(value);
 * }
 * console.log(stats.mean, stats.stddev);
 * ```
 */

// Descriptive statistics
export {
  coefOfVariation,
  iqr,
  kurtosis,
  max,
  mean,
  median,
  min,
  mode,
  normalizeArray,
  percentile,
  quartiles,
  range,
  skewness,
  stddev,
  sum,
  variance,
  zScore,
} from "./descriptive";

// Correlation functions
export { covariance, pearson, spearman } from "./correlation";

// Classes for streaming/online statistics
export {
  Histogram,
  type HistogramBin,
  OnlineStats,
  type OnlineStatsState,
} from "./classes";
