/**
 * EWMA and Exponential Smoothing - Lightweight forecasting utilities
 *
 * Exponential smoothing methods for time series analysis, demand forecasting,
 * and anomaly detection baselines.
 *
 * Use cases:
 * - Demand smoothing for inventory alerts
 * - Anomaly detection baseline
 * - Moving averages for metrics dashboards
 * - Trend detection in sales data
 */

/**
 * Configuration options for EWMA
 */
export interface EWMAOptions {
  /**
   * Smoothing factor (0-1).
   * Higher values give more weight to recent observations.
   * - 0.1: Very smooth, slow to respond to changes
   * - 0.3: Moderate smoothing
   * - 0.5: Balanced
   * - 0.9: Very responsive, little smoothing
   */
  alpha: number;
  /** Initial value (default: first observation) */
  initialValue?: number;
}

/**
 * Exponentially Weighted Moving Average (EWMA)
 *
 * A type of moving average that places a greater weight and significance
 * on the most recent data points. O(1) time and space per update.
 *
 * Formula: S_t = α × X_t + (1 - α) × S_{t-1}
 *
 * @example
 * ```typescript
 * const ewma = new EWMA({ alpha: 0.3 });
 *
 * ewma.update(10);  // 10 (first value)
 * ewma.update(20);  // 13 (0.3 * 20 + 0.7 * 10)
 * ewma.update(15);  // 13.6 (0.3 * 15 + 0.7 * 13)
 *
 * console.log(ewma.value); // Current smoothed value
 * ```
 */
export class EWMA {
  private readonly _alpha: number;
  private _value: number | null = null;
  private _count: number = 0;

  /**
   * Creates a new EWMA instance
   *
   * @param options Configuration options
   * @throws Error if alpha is not in (0, 1]
   */
  constructor(options: EWMAOptions) {
    if (options.alpha <= 0 || options.alpha > 1) {
      throw new Error("Alpha must be in (0, 1]");
    }

    this._alpha = options.alpha;

    if (options.initialValue !== undefined) {
      this._value = options.initialValue;
    }
  }

  /**
   * Update the EWMA with a new observation
   *
   * @param value The new observation
   * @returns The new smoothed value
   */
  update(value: number): number {
    if (this._value === null) {
      this._value = value;
    } else {
      this._value = this._alpha * value + (1 - this._alpha) * this._value;
    }
    this._count++;
    return this._value;
  }

  /**
   * Current smoothed value (null if no observations yet)
   */
  get value(): number | null {
    return this._value;
  }

  /**
   * The smoothing factor
   */
  get alpha(): number {
    return this._alpha;
  }

  /**
   * Number of observations processed
   */
  get count(): number {
    return this._count;
  }

  /**
   * Reset the EWMA to initial state
   *
   * @param initialValue Optional new initial value
   */
  reset(initialValue?: number): void {
    this._value = initialValue ?? null;
    this._count = 0;
  }
}

/**
 * Simple Exponential Smoothing (SES)
 *
 * Single-parameter exponential smoothing for time series without trend
 * or seasonality. Best for relatively stable data.
 *
 * @example
 * ```typescript
 * const ses = new SimpleExponentialSmoothing(0.3);
 *
 * ses.fit([10, 12, 15, 14, 16, 18, 17, 19]);
 *
 * // Get fitted values (smoothed historical data)
 * console.log(ses.fittedValues);
 *
 * // Forecast future values (flat forecast for SES)
 * console.log(ses.forecast(3)); // [~18.5, ~18.5, ~18.5]
 * ```
 */
export class SimpleExponentialSmoothing {
  private readonly _alpha: number;
  private _fittedValues: number[] = [];
  private _level: number | null = null;
  private _fitted: boolean = false;

  /**
   * Creates a new Simple Exponential Smoothing model
   *
   * @param alpha Smoothing factor (0, 1]
   * @throws Error if alpha is not in (0, 1]
   */
  constructor(alpha: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error("Alpha must be in (0, 1]");
    }
    this._alpha = alpha;
  }

  /**
   * Fit the model to historical data
   *
   * @param data Array of observations (at least 1 element)
   * @throws Error if data is empty
   */
  fit(data: number[]): void {
    if (data.length === 0) {
      throw new Error("Data must not be empty");
    }

    this._fittedValues = [];
    this._level = data[0];
    this._fittedValues.push(this._level);

    for (let i = 1; i < data.length; i++) {
      this._level = this._alpha * data[i] + (1 - this._alpha) * this._level;
      this._fittedValues.push(this._level);
    }

    this._fitted = true;
  }

  /**
   * Forecast future values
   *
   * For SES, the forecast is flat (constant at the last level).
   *
   * @param steps Number of steps to forecast
   * @returns Array of forecasted values
   * @throws Error if model has not been fitted
   */
  forecast(steps: number): number[] {
    if (!this._fitted || this._level === null) {
      throw new Error("Model must be fitted before forecasting");
    }
    if (steps <= 0) {
      return [];
    }

    // SES forecast is constant (flat)
    return Array(steps).fill(this._level);
  }

  /**
   * Fitted (smoothed) values for the training data
   */
  get fittedValues(): number[] {
    return [...this._fittedValues];
  }

  /**
   * Current level estimate
   */
  get level(): number | null {
    return this._level;
  }

  /**
   * The smoothing factor
   */
  get alpha(): number {
    return this._alpha;
  }
}

/**
 * Holt's Linear Exponential Smoothing (Double Exponential Smoothing)
 *
 * Two-parameter smoothing that captures both level and trend.
 * Best for data with a trend but no seasonality.
 *
 * @example
 * ```typescript
 * const holt = new HoltSmoothing(0.3, 0.1);
 *
 * holt.fit([10, 12, 15, 18, 22, 26, 31]);
 *
 * // Forecast with trend continuation
 * console.log(holt.forecast(3)); // [~36, ~41, ~46]
 * ```
 */
export class HoltSmoothing {
  private readonly _alpha: number;
  private readonly _beta: number;
  private _level: number | null = null;
  private _trend: number | null = null;
  private _fittedValues: number[] = [];
  private _fitted: boolean = false;

  /**
   * Creates a new Holt's Linear Smoothing model
   *
   * @param alpha Level smoothing factor (0, 1]
   * @param beta Trend smoothing factor (0, 1]
   * @throws Error if alpha or beta are not in (0, 1]
   */
  constructor(alpha: number, beta: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error("Alpha must be in (0, 1]");
    }
    if (beta <= 0 || beta > 1) {
      throw new Error("Beta must be in (0, 1]");
    }

    this._alpha = alpha;
    this._beta = beta;
  }

  /**
   * Fit the model to historical data
   *
   * @param data Array of observations (at least 2 elements for trend)
   * @throws Error if data has fewer than 2 elements
   */
  fit(data: number[]): void {
    if (data.length < 2) {
      throw new Error("Data must have at least 2 elements for Holt smoothing");
    }

    this._fittedValues = [];

    // Initialize level and trend
    this._level = data[0];
    this._trend = data[1] - data[0];
    this._fittedValues.push(this._level);

    for (let i = 1; i < data.length; i++) {
      const prevLevel: number = this._level;
      const prevTrend: number = this._trend;

      // Update level
      this._level =
        this._alpha * data[i] + (1 - this._alpha) * (prevLevel + prevTrend);

      // Update trend
      this._trend =
        this._beta * (this._level - prevLevel) + (1 - this._beta) * prevTrend;

      this._fittedValues.push(this._level);
    }

    this._fitted = true;
  }

  /**
   * Forecast future values
   *
   * Forecast includes trend projection.
   *
   * @param steps Number of steps to forecast
   * @returns Array of forecasted values
   * @throws Error if model has not been fitted
   */
  forecast(steps: number): number[] {
    if (!this._fitted || this._level === null || this._trend === null) {
      throw new Error("Model must be fitted before forecasting");
    }
    if (steps <= 0) {
      return [];
    }

    const forecasts: number[] = [];
    for (let h = 1; h <= steps; h++) {
      forecasts.push(this._level + h * this._trend);
    }
    return forecasts;
  }

  /**
   * Fitted (smoothed) values for the training data
   */
  get fittedValues(): number[] {
    return [...this._fittedValues];
  }

  /**
   * Current level estimate
   */
  get level(): number | null {
    return this._level;
  }

  /**
   * Current trend estimate
   */
  get trend(): number | null {
    return this._trend;
  }

  /**
   * The level smoothing factor
   */
  get alpha(): number {
    return this._alpha;
  }

  /**
   * The trend smoothing factor
   */
  get beta(): number {
    return this._beta;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate a simple moving average
 *
 * @param data Array of observations
 * @param window Window size for averaging
 * @returns Array of moving average values (length = data.length - window + 1)
 * @throws Error if window is larger than data length or <= 0
 *
 * @example
 * ```typescript
 * movingAverage([1, 2, 3, 4, 5], 3);
 * // Returns [2, 3, 4] (averages of [1,2,3], [2,3,4], [3,4,5])
 * ```
 */
export function movingAverage(data: number[], window: number): number[] {
  if (window <= 0 || !Number.isInteger(window)) {
    throw new Error("Window must be a positive integer");
  }
  if (data.length === 0) {
    return [];
  }
  if (window > data.length) {
    throw new Error("Window cannot be larger than data length");
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
 * Calculate a weighted moving average
 *
 * @param data Array of observations
 * @param weights Array of weights (must sum to > 0)
 * @returns Array of weighted average values (length = data.length - weights.length + 1)
 * @throws Error if weights array is larger than data or empty
 *
 * @example
 * ```typescript
 * // More weight to recent values
 * weightedMovingAverage([10, 20, 30, 40], [1, 2, 3]);
 * // Returns [23.33, 33.33] (weighted averages)
 * ```
 */
export function weightedMovingAverage(
  data: number[],
  weights: number[]
): number[] {
  if (weights.length === 0) {
    throw new Error("Weights array must not be empty");
  }
  if (data.length === 0) {
    return [];
  }
  if (weights.length > data.length) {
    throw new Error("Weights array cannot be larger than data length");
  }

  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) {
    throw new Error("Weights must sum to a non-zero value");
  }

  const result: number[] = [];
  const window = weights.length;

  for (let i = 0; i <= data.length - window; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i + j] * weights[j];
    }
    result.push(sum / weightSum);
  }

  return result;
}

/**
 * Calculate exponential moving average for an array (convenience function)
 *
 * @param data Array of observations
 * @param alpha Smoothing factor (0, 1]
 * @returns Array of EMA values (same length as input)
 *
 * @example
 * ```typescript
 * exponentialMovingAverage([10, 20, 15, 25, 30], 0.3);
 * // Returns smoothed series
 * ```
 */
export function exponentialMovingAverage(
  data: number[],
  alpha: number
): number[] {
  if (data.length === 0) {
    return [];
  }

  const ewma = new EWMA({ alpha });
  return data.map((value) => ewma.update(value));
}
