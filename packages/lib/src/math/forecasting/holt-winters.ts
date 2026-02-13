/**
 * Holt-Winters Additive Seasonal Forecasting
 *
 * Triple exponential smoothing with additive seasonal component.
 * Suitable for time series with trend and seasonality where seasonal
 * variation is roughly constant over time.
 *
 * Use cases:
 * - Occupancy forecasting with weekly/monthly patterns
 * - Revenue forecasting with seasonal trends
 * - Demand forecasting for inventory planning
 */

import {
  assertSeasonalPeriod,
  normalizeSeasonalAdditive,
  seasonAtHorizon,
} from "./utils";

/**
 * Holt-Winters Additive Seasonal Model
 *
 * Model: Y_t = L_t + T_t + S_t + ε_t
 *
 * Where:
 * - L_t is the level component (smoothed deseasonalized value)
 * - T_t is the trend component (rate of change)
 * - S_t is the seasonal component (additive)
 * - ε_t is the error term
 *
 * Update equations:
 * - L_t = α(Y_t - S_{t-m}) + (1-α)(L_{t-1} + T_{t-1})
 * - T_t = β(L_t - L_{t-1}) + (1-β)T_{t-1}
 * - S_t = γ(Y_t - L_t) + (1-γ)S_{t-m}
 *
 * Initialization uses deterministic approach based on first 2m observations.
 *
 * @example
 * ```typescript
 * const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
 *
 * // Weekly sales data (52 weeks, 7-day seasonality)
 * const sales = [...]; // 364+ observations
 * hw.fit(sales, 7);
 *
 * // One-step-ahead fitted values
 * console.log(hw.fittedValues);
 *
 * // Forecast next 2 weeks
 * const forecast = hw.forecast(14);
 * ```
 */
export class HoltWintersAdditive {
  private readonly _alpha: number;
  private readonly _beta: number;
  private readonly _gamma: number;
  private _level: number | null = null;
  private _trend: number | null = null;
  private _seasonalIndices: number[] = [];
  private _fittedValues: number[] = [];
  private _seasonalPeriod: number = 0;
  private _fitted: boolean = false;

  /**
   * Creates a new Holt-Winters Additive model
   *
   * @param alpha Level smoothing factor (0, 1]
   * @param beta Trend smoothing factor (0, 1]
   * @param gamma Seasonal smoothing factor (0, 1]
   * @throws Error if any parameter is not in (0, 1]
   */
  constructor(alpha: number, beta: number, gamma: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error("Alpha must be in (0, 1]");
    }
    if (beta <= 0 || beta > 1) {
      throw new Error("Beta must be in (0, 1]");
    }
    if (gamma <= 0 || gamma > 1) {
      throw new Error("Gamma must be in (0, 1]");
    }

    this._alpha = alpha;
    this._beta = beta;
    this._gamma = gamma;
  }

  /**
   * Fit the model to historical data
   *
   * Uses deterministic initialization:
   * - L0 = mean(first m observations)
   * - T0 = mean((Y[m+i] - Y[i]) / m) for i=0..m-1
   * - Seasonal: detrend first 2m observations, average by position, normalize
   *
   * @param data Time series data (length >= 2*seasonalPeriod)
   * @param seasonalPeriod Seasonal period m (integer >= 2)
   * @throws Error if seasonal period is invalid or data length insufficient
   */
  fit(data: number[], seasonalPeriod: number): void {
    const n = data.length;
    const m = seasonalPeriod;

    // Validate inputs
    assertSeasonalPeriod(m, n);

    this._seasonalPeriod = m;
    this._fittedValues = new Array(n);

    // Initialize level: mean of first m observations
    let sum = 0;
    for (let i = 0; i < m; i++) {
      sum += data[i];
    }
    this._level = sum / m;

    // Initialize trend: mean of (Y[m+i] - Y[i]) / m for i=0..m-1
    let trendSum = 0;
    for (let i = 0; i < m; i++) {
      trendSum += (data[m + i] - data[i]) / m;
    }
    this._trend = trendSum / m;

    // Initialize seasonal indices from first 2m observations
    this._seasonalIndices = this._initializeSeasonalIndices(data, m);

    // First fitted value is NaN (no one-step-ahead prediction for t=0)
    this._fittedValues[0] = NaN;

    // Compute one-step-ahead fitted values and update state
    for (let t = 1; t < n; t++) {
      const prevLevel: number = this._level;
      const prevTrend: number = this._trend;

      // One-step-ahead prediction for Y_t using state at t-1
      // fittedValues[t] = L_{t-1} + T_{t-1} + S_{t-m}
      const seasonalIndex = t >= m ? (t - m) % m : t % m;
      const seasonal = this._seasonalIndices[seasonalIndex];
      this._fittedValues[t] = prevLevel + prevTrend + seasonal;

      // Update state using Y_t
      const currentSeasonalIndex = t % m;
      const currentSeasonal = this._seasonalIndices[currentSeasonalIndex];

      // Update level
      this._level =
        this._alpha * (data[t] - currentSeasonal) +
        (1 - this._alpha) * (prevLevel + prevTrend);

      // Update trend
      this._trend =
        this._beta * (this._level - prevLevel) + (1 - this._beta) * prevTrend;

      // Update seasonal
      this._seasonalIndices[currentSeasonalIndex] =
        this._gamma * (data[t] - this._level) +
        (1 - this._gamma) * currentSeasonal;
    }

    this._fitted = true;
  }

  /**
   * Initialize seasonal indices from first 2m observations
   *
   * Deterministic approach:
   * 1. Compute baseline B_t = L0 + T0*t for t=0..2m-1
   * 2. Seasonal raw term: Y_t - B_t by season position
   * 3. Normalize to mean 0
   *
   * @param data Time series data
   * @param m Seasonal period
   * @returns Normalized seasonal indices (length m)
   */
  private _initializeSeasonalIndices(data: number[], m: number): number[] {
    const L0 = this._level!;
    const T0 = this._trend!;

    // Accumulate detrended values by season position
    const seasonalSums: number[] = new Array(m).fill(0);
    const seasonalCounts: number[] = new Array(m).fill(0);

    for (let t = 0; t < 2 * m; t++) {
      const baseline = L0 + T0 * t;
      const detrended = data[t] - baseline;
      const season = t % m;

      seasonalSums[season] += detrended;
      seasonalCounts[season]++;
    }

    // Calculate raw seasonal indices (averages)
    const rawSeasonals = seasonalSums.map((sum, i) =>
      seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
    );

    // Normalize to mean 0
    return normalizeSeasonalAdditive(rawSeasonals);
  }

  /**
   * Forecast future values
   *
   * Forecast formula: Y_{n+h} = L_n + h*T_n + S_{season_at_horizon(n-1, h, m)}
   *
   * Seasonal component wraps around using modulo arithmetic.
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
    const n = this._fittedValues.length;
    const m = this._seasonalPeriod;

    for (let h = 1; h <= steps; h++) {
      const seasonalIndex = seasonAtHorizon(n - 1, h, m);
      const seasonal = this._seasonalIndices[seasonalIndex];
      forecasts.push(this._level + h * this._trend + seasonal);
    }

    return forecasts;
  }

  /**
   * One-step-ahead fitted values
   *
   * fittedValues[0] = NaN (no prediction for first observation)
   * fittedValues[t] = prediction for Y_t from state at t-1 (for t >= 1)
   */
  get fittedValues(): number[] {
    return [...this._fittedValues];
  }

  /**
   * Minimum residual index for scoring/comparison
   *
   * Set to seasonalPeriod to ensure fair comparison across models
   * (all seasonal components have been seen at least once)
   */
  get minResidualIndex(): number {
    return this._seasonalPeriod;
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
   * Current seasonal indices (length m)
   */
  get seasonalIndices(): number[] {
    return [...this._seasonalIndices];
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

  /**
   * The seasonal smoothing factor
   */
  get gamma(): number {
    return this._gamma;
  }
}
