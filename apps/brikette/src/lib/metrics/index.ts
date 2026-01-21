/**
 * Metrics Module
 *
 * Utilities for tracking and analyzing application metrics:
 * - Latency tracking with accurate percentiles (t-Digest)
 * - Metric smoothing with EWMA
 * - Trend detection and forecasting
 */

export {
  LatencyTracker,
  type LatencyTrackerConfig,
  type LatencyStats,
  getLatencyTracker,
  recordLatency,
  getLatencyStats,
  getAllLatencyStats,
} from "./latency-tracker";

export {
  SmoothedMetric,
  type SmoothedMetricConfig,
  TrendMetric,
  type TrendMetricConfig,
  movingAverage,
  detectTrend,
  getSmoothedMetric,
  getTrendMetric,
} from "./smoothed-metrics";
