/**
 * Smoothed Metrics - EWMA-based metric smoothing and forecasting
 *
 * Uses Exponentially Weighted Moving Average (EWMA) from @acme/lib for
 * smoothing noisy metrics and detecting anomalies. Ideal for dashboards,
 * monitoring, and trend detection.
 *
 * @example
 * ```typescript
 * const metric = new SmoothedMetric({ alpha: 0.3, name: "page-views" });
 *
 * // Update with raw values
 * metric.update(1250);
 * metric.update(1180);
 * metric.update(1420);
 *
 * // Get smoothed value (less noisy)
 * console.log(metric.smoothedValue);
 *
 * // Forecast future values
 * console.log(metric.forecast(5));
 * ```
 */

import {
  EWMA,
  HoltSmoothing,
  SimpleExponentialSmoothing,
} from "@acme/lib";

// ============================================================================
// SmoothedMetric - Simple EWMA wrapper
// ============================================================================

/**
 * Configuration for SmoothedMetric
 */
export interface SmoothedMetricConfig {
  /**
   * Smoothing factor (0-1).
   * - 0.1: Very smooth, slow to respond
   * - 0.3: Moderate smoothing (recommended)
   * - 0.5: Balanced
   * - 0.9: Very responsive, little smoothing
   */
  alpha?: number;
  /** Metric name/label */
  name?: string;
  /** Initial value (uses first observation if not set) */
  initialValue?: number;
}

/**
 * SmoothedMetric - Wrapper around EWMA for metric smoothing
 *
 * Provides a simple interface for smoothing noisy time-series data
 * with automatic anomaly detection thresholds.
 */
export class SmoothedMetric {
  private ewma: EWMA;
  private readonly name: string;
  private history: number[] = [];
  private readonly maxHistory: number = 100;

  constructor(config?: SmoothedMetricConfig) {
    this.ewma = new EWMA({
      alpha: config?.alpha ?? 0.3,
      initialValue: config?.initialValue,
    });
    this.name = config?.name ?? "metric";
  }

  /**
   * Update with a new raw value
   *
   * @param value Raw metric value
   * @returns Smoothed value after update
   */
  update(value: number): number {
    const smoothed = this.ewma.update(value);

    // Store in history for anomaly detection
    this.history.push(value);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return smoothed;
  }

  /**
   * Update with multiple values
   *
   * @param values Array of raw values (oldest first)
   * @returns Final smoothed value
   */
  updateAll(values: number[]): number {
    let last = this.ewma.value ?? 0;
    for (const value of values) {
      last = this.update(value);
    }
    return last;
  }

  /**
   * Current smoothed value
   */
  get smoothedValue(): number | null {
    return this.ewma.value;
  }

  /**
   * Raw value from last update
   */
  get lastRawValue(): number | undefined {
    return this.history[this.history.length - 1];
  }

  /**
   * Number of observations
   */
  get count(): number {
    return this.ewma.count;
  }

  /**
   * Metric name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if a value is anomalous (outside expected range)
   *
   * Uses a simple threshold based on historical standard deviation.
   *
   * @param value Value to check
   * @param sigmas Number of standard deviations for threshold (default: 2)
   * @returns True if value is anomalous
   */
  isAnomaly(value: number, sigmas: number = 2): boolean {
    if (this.history.length < 10 || this.ewma.value === null) {
      return false;
    }

    const mean = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    const variance =
      this.history.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      this.history.length;
    const std = Math.sqrt(variance);

    return Math.abs(value - mean) > sigmas * std;
  }

  /**
   * Forecast using current smoothed value (flat forecast)
   *
   * Note: For trend-aware forecasting, use TrendMetric instead.
   *
   * @param steps Number of steps to forecast
   * @returns Array of forecasted values (all same for simple EWMA)
   */
  forecast(steps: number): number[] {
    if (steps <= 0 || this.ewma.value === null) {
      return [];
    }
    return Array(steps).fill(this.ewma.value);
  }

  /**
   * Reset the metric
   */
  reset(): void {
    this.ewma.reset();
    this.history = [];
  }
}

// ============================================================================
// TrendMetric - Holt smoothing for trend-aware forecasting
// ============================================================================

/**
 * Configuration for TrendMetric
 */
export interface TrendMetricConfig {
  /** Level smoothing factor (default: 0.3) */
  alpha?: number;
  /** Trend smoothing factor (default: 0.1) */
  beta?: number;
  /** Metric name */
  name?: string;
}

/**
 * TrendMetric - Double exponential smoothing for trending data
 *
 * Uses Holt's linear smoothing to capture both level and trend,
 * providing more accurate forecasts for data with consistent trends.
 *
 * @example
 * ```typescript
 * const metric = new TrendMetric({ alpha: 0.3, beta: 0.1 });
 *
 * // Update with growing values
 * metric.fit([100, 110, 125, 140, 160]);
 *
 * // Forecast with trend continuation
 * console.log(metric.forecast(3)); // [~180, ~200, ~220]
 * ```
 */
export class TrendMetric {
  private holt: HoltSmoothing | null = null;
  private readonly alpha: number;
  private readonly beta: number;
  private readonly name: string;
  private data: number[] = [];

  constructor(config?: TrendMetricConfig) {
    this.alpha = config?.alpha ?? 0.3;
    this.beta = config?.beta ?? 0.1;
    this.name = config?.name ?? "trend-metric";
  }

  /**
   * Add a new data point and refit the model
   *
   * @param value New metric value
   */
  update(value: number): void {
    this.data.push(value);
    this.fit(this.data);
  }

  /**
   * Fit the model to historical data
   *
   * @param data Array of observations (oldest first)
   */
  fit(data: number[]): void {
    if (data.length < 2) {
      this.data = data;
      this.holt = null;
      return;
    }

    this.data = data;
    this.holt = new HoltSmoothing(this.alpha, this.beta);
    this.holt.fit(data);
  }

  /**
   * Forecast future values with trend
   *
   * @param steps Number of steps to forecast
   * @returns Array of forecasted values
   */
  forecast(steps: number): number[] {
    if (!this.holt) {
      return [];
    }
    return this.holt.forecast(steps);
  }

  /**
   * Get smoothed historical values
   */
  get fittedValues(): number[] {
    return this.holt?.fittedValues ?? [];
  }

  /**
   * Current level estimate
   */
  get level(): number | null {
    return this.holt?.level ?? null;
  }

  /**
   * Current trend estimate (change per period)
   */
  get trend(): number | null {
    return this.holt?.trend ?? null;
  }

  /**
   * Metric name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Number of data points
   */
  get count(): number {
    return this.data.length;
  }

  /**
   * Reset the metric
   */
  reset(): void {
    this.data = [];
    this.holt = null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate a moving average for an array
 *
 * @param data Array of values
 * @param window Window size
 * @returns Array of moving averages
 */
export function movingAverage(data: number[], window: number): number[] {
  if (window <= 0 || window > data.length || data.length === 0) {
    return [];
  }

  const result: number[] = [];
  let sum = 0;

  // Initialize first window
  for (let i = 0; i < window; i++) {
    sum += data[i];
  }
  result.push(sum / window);

  // Slide window
  for (let i = window; i < data.length; i++) {
    sum += data[i] - data[i - window];
    result.push(sum / window);
  }

  return result;
}

/**
 * Detect trend direction from data
 *
 * @param data Array of values
 * @param minSamples Minimum samples for reliable detection (default: 5)
 * @returns "up", "down", "flat", or "insufficient"
 */
export function detectTrend(
  data: number[],
  minSamples: number = 5
): "up" | "down" | "flat" | "insufficient" {
  if (data.length < minSamples) {
    return "insufficient";
  }

  // Use simple linear regression slope
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const mean = sumY / n;

  // Threshold: slope is significant if it's > 5% of mean per period
  const threshold = Math.abs(mean) * 0.05;

  if (slope > threshold) {
    return "up";
  } else if (slope < -threshold) {
    return "down";
  } else {
    return "flat";
  }
}

// ============================================================================
// Singleton registry for named metrics
// ============================================================================

const smoothedMetrics = new Map<string, SmoothedMetric>();
const trendMetrics = new Map<string, TrendMetric>();

/**
 * Get or create a named smoothed metric
 */
export function getSmoothedMetric(
  name: string,
  config?: SmoothedMetricConfig
): SmoothedMetric {
  let metric = smoothedMetrics.get(name);
  if (!metric) {
    metric = new SmoothedMetric({ ...config, name });
    smoothedMetrics.set(name, metric);
  }
  return metric;
}

/**
 * Get or create a named trend metric
 */
export function getTrendMetric(
  name: string,
  config?: TrendMetricConfig
): TrendMetric {
  let metric = trendMetrics.get(name);
  if (!metric) {
    metric = new TrendMetric({ ...config, name });
    trendMetrics.set(name, metric);
  }
  return metric;
}
