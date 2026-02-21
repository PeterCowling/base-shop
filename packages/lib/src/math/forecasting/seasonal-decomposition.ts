/**
 * Seasonal Decomposition - Classical additive and multiplicative decomposition
 *
 * Decomposes time series into trend, seasonal, and remainder components.
 * Uses centered moving averages for trend extraction.
 *
 * Use cases:
 * - Understanding seasonal patterns in sales/occupancy data
 * - Detrending and deseasonalizing for analysis
 * - Initialization for Holt-Winters seasonal forecasting
 */

import {
  assertSeasonalPeriod,
  normalizeSeasonalAdditive,
  normalizeSeasonalMultiplicative,
} from "./utils.js";

/**
 * Decomposition result with trend, seasonal, and remainder components
 */
export interface DecompositionResult {
  /** Trend component (length n, NaN at edges where MA is undefined) */
  trend: number[];
  /** Seasonal component (length n, aligned with data) */
  seasonal: number[];
  /** Normalized seasonal indices (length m) */
  seasonalIndices: number[];
  /** Remainder component (length n, NaN where trend is NaN) */
  remainder: number[];
}

/**
 * Decompose time series using additive model
 *
 * Model: Y_t = T_t + S_t + R_t
 *
 * Where:
 * - T_t is the trend component
 * - S_t is the seasonal component
 * - R_t is the remainder (residual)
 *
 * Trend extraction:
 * - Odd m: centered moving average directly
 * - Even m: moving average of m, then moving average of 2 for centering
 *
 * Seasonal indices are normalized to mean 0.
 *
 * @param data Time series data (length n >= 2*m)
 * @param seasonalPeriod Seasonal period (m >= 2, integer)
 * @returns Decomposition result with all arrays length n
 * @throws Error if data length is insufficient or period is invalid
 *
 * @example
 * ```typescript
 * const data = [100, 110, 95, 105, 102, 112, ...]; // 2+ years monthly
 * const result = decomposeAdditive(data, 12);
 *
 * // Trend has NaN at edges
 * console.log(result.trend); // [NaN, NaN, ..., 103.5, ..., NaN, NaN]
 *
 * // Seasonal repeats with period 12
 * console.log(result.seasonalIndices); // [2.1, -3.5, 1.2, ...] (12 values)
 *
 * // Remainder is what's left
 * console.log(result.remainder); // [NaN, NaN, ..., 0.3, -0.1, ..., NaN]
 * ```
 */
export function decomposeAdditive(
  data: number[],
  seasonalPeriod: number
): DecompositionResult {
  const n = data.length;
  const m = seasonalPeriod;

  // Validate inputs
  assertSeasonalPeriod(m, n);

  // Step 1: Extract trend using centered moving average
  const trend = extractTrend(data, m);

  // Step 2: Detrend the data (Y_t - T_t)
  const detrended = data.map((y, t) =>
    Number.isFinite(trend[t]) ? y - trend[t] : NaN
  );

  // Step 3: Calculate seasonal indices (average by season position)
  const seasonalIndices = calculateSeasonalIndicesAdditive(detrended, m);

  // Step 4: Map seasonal indices to full series
  const seasonal = data.map((_, t) => seasonalIndices[t % m]);

  // Step 5: Calculate remainder (Y_t - T_t - S_t)
  const remainder = data.map((y, t) =>
    Number.isFinite(trend[t]) ? y - trend[t] - seasonal[t] : NaN
  );

  return {
    trend,
    seasonal,
    seasonalIndices,
    remainder,
  };
}

/**
 * Decompose time series using multiplicative model
 *
 * Model: Y_t = T_t × S_t × R_t
 *
 * Where:
 * - T_t is the trend component
 * - S_t is the seasonal component (multiplicative factor)
 * - R_t is the remainder (residual)
 *
 * Trend extraction:
 * - Odd m: centered moving average directly
 * - Even m: moving average of m, then moving average of 2 for centering
 *
 * Seasonal indices are normalized to mean 1.
 *
 * @param data Time series data (length n >= 2*m, all values must be > 0)
 * @param seasonalPeriod Seasonal period (m >= 2, integer)
 * @returns Decomposition result with all arrays length n
 * @throws Error if data contains values <= 0, or if inputs are invalid
 *
 * @example
 * ```typescript
 * const data = [100, 110, 95, 105, 102, 112, ...]; // 2+ years monthly
 * const result = decomposeMultiplicative(data, 12);
 *
 * // Trend has NaN at edges
 * console.log(result.trend); // [NaN, NaN, ..., 103.5, ..., NaN, NaN]
 *
 * // Seasonal factors average to 1
 * console.log(result.seasonalIndices); // [1.05, 0.92, 1.01, ...] (12 values)
 *
 * // Remainder is what's left
 * console.log(result.remainder); // [NaN, NaN, ..., 1.003, 0.998, ..., NaN]
 * ```
 */
export function decomposeMultiplicative(
  data: number[],
  seasonalPeriod: number
): DecompositionResult {
  const n = data.length;
  const m = seasonalPeriod;

  // Validate inputs
  assertSeasonalPeriod(m, n);

  // Validate all data > 0 for multiplicative model
  for (let i = 0; i < n; i++) {
    if (data[i] <= 0) {
      throw new Error(
        "Multiplicative decomposition requires all data values > 0"
      );
    }
  }

  // Step 1: Extract trend using centered moving average
  const trend = extractTrend(data, m);

  // Step 2: Detrend the data (Y_t / T_t)
  const detrended = data.map((y, t) =>
    Number.isFinite(trend[t]) ? y / trend[t] : NaN
  );

  // Step 3: Calculate seasonal indices (average by season position)
  const seasonalIndices = calculateSeasonalIndicesMultiplicative(detrended, m);

  // Step 4: Map seasonal indices to full series
  const seasonal = data.map((_, t) => seasonalIndices[t % m]);

  // Step 5: Calculate remainder (Y_t / (T_t * S_t))
  const remainder = data.map((y, t) =>
    Number.isFinite(trend[t]) ? y / (trend[t] * seasonal[t]) : NaN
  );

  return {
    trend,
    seasonal,
    seasonalIndices,
    remainder,
  };
}

/**
 * Extract trend using centered moving average
 *
 * - Odd m: centered MA is straightforward
 * - Even m: MA of m, then MA of 2 for centering
 *
 * @param data Time series data
 * @param m Seasonal period
 * @returns Trend array (length n, NaN at edges)
 */
function extractTrend(data: number[], m: number): number[] {
  const n = data.length;
  const trend: number[] = new Array(n).fill(NaN);

  if (m % 2 === 1) {
    // Odd period: centered moving average directly
    const halfWindow = Math.floor(m / 2);

    for (let t = halfWindow; t < n - halfWindow; t++) {
      let sum = 0;
      for (let i = -halfWindow; i <= halfWindow; i++) {
        sum += data[t + i];
      }
      trend[t] = sum / m;
    }
  } else {
    // Even period: MA of m, then MA of 2 for centering
    const halfM = m / 2;

    // First pass: moving average of m
    // For m=12, we compute averages of windows [0..11], [1..12], [2..13], ...
    const ma1: number[] = [];

    for (let t = 0; t <= n - m; t++) {
      let sum = 0;
      for (let i = 0; i < m; i++) {
        sum += data[t + i];
      }
      ma1.push(sum / m);
    }

    // Second pass: moving average of 2 on ma1 for centering
    // For proper centering, we need to average consecutive MA values
    // ma1[0] is centered at t=5.5 (for m=12), ma1[1] at t=6.5, etc.
    // Average of ma1[i] and ma1[i+1] gives us centered value at t = halfM + i
    for (let i = 0; i < ma1.length - 1; i++) {
      const t = halfM + i;
      trend[t] = (ma1[i] + ma1[i + 1]) / 2;
    }
  }

  return trend;
}

/**
 * Calculate seasonal indices for additive model
 *
 * Average detrended values by season position, then normalize to mean 0.
 *
 * @param detrended Detrended data (Y_t - T_t)
 * @param m Seasonal period
 * @returns Normalized seasonal indices (length m)
 */
function calculateSeasonalIndicesAdditive(
  detrended: number[],
  m: number
): number[] {
  const n = detrended.length;
  const seasonalSums: number[] = new Array(m).fill(0);
  const seasonalCounts: number[] = new Array(m).fill(0);

  // Accumulate detrended values by season position
  for (let t = 0; t < n; t++) {
    if (Number.isFinite(detrended[t])) {
      const season = t % m;
      seasonalSums[season] += detrended[t];
      seasonalCounts[season]++;
    }
  }

  // Calculate raw seasonal indices (averages)
  const rawSeasonals = seasonalSums.map((sum, i) =>
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
  );

  // Normalize to mean 0
  return normalizeSeasonalAdditive(rawSeasonals);
}

/**
 * Calculate seasonal indices for multiplicative model
 *
 * Average detrended ratios by season position, then normalize to mean 1.
 *
 * @param detrended Detrended data (Y_t / T_t)
 * @param m Seasonal period
 * @returns Normalized seasonal indices (length m)
 */
function calculateSeasonalIndicesMultiplicative(
  detrended: number[],
  m: number
): number[] {
  const n = detrended.length;
  const seasonalSums: number[] = new Array(m).fill(0);
  const seasonalCounts: number[] = new Array(m).fill(0);

  // Accumulate detrended ratios by season position
  for (let t = 0; t < n; t++) {
    if (Number.isFinite(detrended[t])) {
      const season = t % m;
      seasonalSums[season] += detrended[t];
      seasonalCounts[season]++;
    }
  }

  // Calculate raw seasonal indices (averages)
  const rawSeasonals = seasonalSums.map((sum, i) =>
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 1
  );

  // Normalize to mean 1
  return normalizeSeasonalMultiplicative(rawSeasonals);
}
