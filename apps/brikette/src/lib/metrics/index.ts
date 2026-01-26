/**
 * Metrics Module
 *
 * Utilities for tracking and analyzing application metrics:
 * - Latency tracking with accurate percentiles (t-Digest)
 * - Metric smoothing with EWMA
 * - Trend detection and forecasting
 */

export {
  getAllLatencyStats,
  getLatencyStats,
  getLatencyTracker,
  type LatencyStats,
  LatencyTracker,
  type LatencyTrackerConfig,
  recordLatency,
} from "./latency-tracker";
export {
  detectTrend,
  getSmoothedMetric,
  getTrendMetric,
  movingAverage,
  SmoothedMetric,
  type SmoothedMetricConfig,
  TrendMetric,
  type TrendMetricConfig,
} from "./smoothed-metrics";
