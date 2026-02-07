/**
 * Statistical Classes - Online/streaming statistics and histograms
 *
 * Provides classes for computing statistics incrementally (one value at a time)
 * without storing all values. Essential for streaming data and memory-constrained
 * environments.
 *
 * Use cases:
 * - Real-time metrics collection (no need to store all values)
 * - Processing large datasets that don't fit in memory
 * - Aggregating statistics from distributed systems
 * - Distribution analysis with histograms
 */

/**
 * Serialized state of OnlineStats for persistence.
 */
export interface OnlineStatsState {
  count: number;
  mean: number;
  m2: number;
  min: number;
  max: number;
}

/**
 * Online/streaming statistics calculator using Welford's algorithm.
 *
 * Computes mean, variance, and standard deviation incrementally with O(1) time
 * and space per update. Numerically stable for large datasets.
 *
 * @example
 * ```typescript
 * const stats = new OnlineStats();
 *
 * stats.push(10);
 * stats.push(20);
 * stats.push(30);
 *
 * console.log(stats.mean); // 20
 * console.log(stats.variance); // 66.666...
 * console.log(stats.stddev); // 8.165...
 * console.log(stats.count); // 3
 * console.log(stats.min); // 10
 * console.log(stats.max); // 30
 * ```
 */
export class OnlineStats {
  private _count: number = 0;
  private _mean: number = 0;
  private _m2: number = 0; // Sum of squared differences from the mean
  private _min: number = Infinity;
  private _max: number = -Infinity;

  /**
   * Add a new value to the statistics.
   *
   * Uses Welford's algorithm for numerically stable variance computation:
   * - Update mean incrementally
   * - Update M2 (sum of squared deviations) incrementally
   *
   * @param value - The value to add
   *
   * @example
   * ```typescript
   * const stats = new OnlineStats();
   * stats.push(5);
   * stats.push(10);
   * stats.push(15);
   * ```
   */
  push(value: number): void {
    this._count++;

    // Welford's algorithm for online variance
    const delta = value - this._mean;
    this._mean += delta / this._count;
    const delta2 = value - this._mean;
    this._m2 += delta * delta2;

    // Update min/max
    if (value < this._min) this._min = value;
    if (value > this._max) this._max = value;
  }

  /**
   * Reset all statistics to initial state.
   *
   * After reset:
   * - count = 0
   * - mean = NaN
   * - variance = NaN
   * - stddev = NaN
   * - min = Infinity
   * - max = -Infinity
   */
  reset(): void {
    this._count = 0;
    this._mean = 0;
    this._m2 = 0;
    this._min = Infinity;
    this._max = -Infinity;
  }

  /**
   * Number of values added.
   */
  get count(): number {
    return this._count;
  }

  /**
   * Current mean (average) of all values.
   * Returns NaN if no values have been added.
   */
  get mean(): number {
    return this._count === 0 ? NaN : this._mean;
  }

  /**
   * Population variance of all values.
   * Returns NaN if no values have been added.
   * Returns 0 if only one value has been added.
   */
  get variance(): number {
    if (this._count === 0) return NaN;
    if (this._count === 1) return 0;
    return this._m2 / this._count;
  }

  /**
   * Population standard deviation of all values.
   * Returns NaN if no values have been added.
   * Returns 0 if only one value has been added.
   */
  get stddev(): number {
    return Math.sqrt(this.variance);
  }

  /**
   * Minimum value seen.
   * Returns Infinity if no values have been added.
   */
  get min(): number {
    return this._min;
  }

  /**
   * Maximum value seen.
   * Returns -Infinity if no values have been added.
   */
  get max(): number {
    return this._max;
  }

  /**
   * Merge another OnlineStats instance into this one.
   *
   * Combines statistics from two separate OnlineStats instances using
   * parallel Welford's algorithm. Useful for aggregating stats from
   * distributed systems or worker threads.
   *
   * @param other - Another OnlineStats instance to merge
   * @returns A new OnlineStats instance with combined statistics
   *
   * @example
   * ```typescript
   * const stats1 = new OnlineStats();
   * stats1.push(1); stats1.push(2); stats1.push(3);
   *
   * const stats2 = new OnlineStats();
   * stats2.push(4); stats2.push(5); stats2.push(6);
   *
   * const combined = stats1.merge(stats2);
   * console.log(combined.mean); // 3.5
   * console.log(combined.count); // 6
   * ```
   */
  merge(other: OnlineStats): OnlineStats {
    const result = new OnlineStats();

    if (this._count === 0) {
      result._count = other._count;
      result._mean = other._mean;
      result._m2 = other._m2;
      result._min = other._min;
      result._max = other._max;
      return result;
    }

    if (other._count === 0) {
      result._count = this._count;
      result._mean = this._mean;
      result._m2 = this._m2;
      result._min = this._min;
      result._max = this._max;
      return result;
    }

    // Parallel Welford's algorithm
    const combinedCount = this._count + other._count;
    const delta = other._mean - this._mean;

    result._count = combinedCount;
    result._mean =
      (this._count * this._mean + other._count * other._mean) / combinedCount;
    result._m2 =
      this._m2 +
      other._m2 +
      (delta * delta * this._count * other._count) / combinedCount;
    result._min = Math.min(this._min, other._min);
    result._max = Math.max(this._max, other._max);

    return result;
  }

  /**
   * Serialize the statistics state for persistence.
   *
   * @returns Serializable state object
   *
   * @example
   * ```typescript
   * const stats = new OnlineStats();
   * stats.push(1); stats.push(2); stats.push(3);
   *
   * const state = stats.serialize();
   * localStorage.setItem('stats', JSON.stringify(state));
   *
   * // Later...
   * const restored = OnlineStats.deserialize(JSON.parse(localStorage.getItem('stats')));
   * ```
   */
  serialize(): OnlineStatsState {
    return {
      count: this._count,
      mean: this._mean,
      m2: this._m2,
      min: this._min,
      max: this._max,
    };
  }

  /**
   * Deserialize a previously serialized OnlineStats.
   *
   * @param state - State object from serialize()
   * @returns Restored OnlineStats instance
   */
  static deserialize(state: OnlineStatsState): OnlineStats {
    const stats = new OnlineStats();
    stats._count = state.count;
    stats._mean = state.mean;
    stats._m2 = state.m2;
    stats._min = state.min;
    stats._max = state.max;
    return stats;
  }
}

/**
 * A single histogram bin with its range and count.
 */
export interface HistogramBin {
  /** Lower bound of the bin (inclusive) */
  min: number;
  /** Upper bound of the bin (exclusive, except for last bin) */
  max: number;
  /** Number of values in this bin */
  count: number;
}

/**
 * Fixed-bin histogram for distribution analysis.
 *
 * Creates a histogram with evenly-spaced bins for analyzing the distribution
 * of numeric values. Values outside the specified range are clamped to the
 * boundary bins and tracked separately.
 *
 * @example
 * ```typescript
 * const hist = new Histogram(5, 0, 100); // 5 bins from 0 to 100
 *
 * hist.add(10);  // bin 0 [0, 20)
 * hist.add(25);  // bin 1 [20, 40)
 * hist.add(50);  // bin 2 [40, 60)
 * hist.add(75);  // bin 3 [60, 80)
 * hist.add(95);  // bin 4 [80, 100]
 * hist.add(-5);  // clamped to bin 0, underflowCount++
 * hist.add(150); // clamped to bin 4, overflowCount++
 *
 * console.log(hist.bins);
 * // [
 * //   { min: 0, max: 20, count: 2 },
 * //   { min: 20, max: 40, count: 1 },
 * //   { min: 40, max: 60, count: 1 },
 * //   { min: 60, max: 80, count: 1 },
 * //   { min: 80, max: 100, count: 2 }
 * // ]
 *
 * console.log(hist.underflowCount); // 1
 * console.log(hist.overflowCount); // 1
 * ```
 */
export class Histogram {
  private readonly _binCounts: number[];
  private readonly _binCount: number;
  private readonly _min: number;
  private readonly _max: number;
  private readonly _binWidth: number;
  private _underflowCount: number = 0;
  private _overflowCount: number = 0;
  private _totalCount: number = 0;

  /**
   * Create a new histogram with fixed bins.
   *
   * @param binCount - Number of bins (must be at least 1)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive for last bin)
   * @throws Error if binCount is less than 1 or min >= max
   */
  constructor(binCount: number, min: number, max: number) {
    if (binCount < 1 || !Number.isInteger(binCount)) {
      throw new Error("binCount must be a positive integer");
    }
    if (min >= max) {
      throw new Error("min must be less than max");
    }

    this._binCount = binCount;
    this._min = min;
    this._max = max;
    this._binWidth = (max - min) / binCount;
    this._binCounts = new Array(binCount).fill(0);
  }

  /**
   * Add a value to the histogram.
   *
   * Values below min are clamped to the first bin and counted as underflow.
   * Values above max are clamped to the last bin and counted as overflow.
   *
   * @param value - The value to add
   */
  add(value: number): void {
    this._totalCount++;

    let binIndex: number;

    if (value < this._min) {
      binIndex = 0;
      this._underflowCount++;
    } else if (value >= this._max) {
      binIndex = this._binCount - 1;
      if (value > this._max) {
        this._overflowCount++;
      }
    } else {
      binIndex = Math.floor((value - this._min) / this._binWidth);
      // Handle edge case where value equals bin boundary
      if (binIndex >= this._binCount) {
        binIndex = this._binCount - 1;
      }
    }

    this._binCounts[binIndex]++;
  }

  /**
   * Reset the histogram, clearing all bin counts.
   */
  reset(): void {
    this._binCounts.fill(0);
    this._underflowCount = 0;
    this._overflowCount = 0;
    this._totalCount = 0;
  }

  /**
   * Get the bin information with counts.
   */
  get bins(): HistogramBin[] {
    const result: HistogramBin[] = [];
    for (let i = 0; i < this._binCount; i++) {
      result.push({
        min: this._min + i * this._binWidth,
        max: this._min + (i + 1) * this._binWidth,
        count: this._binCounts[i],
      });
    }
    return result;
  }

  /**
   * Number of values that were below the minimum (clamped to first bin).
   */
  get underflowCount(): number {
    return this._underflowCount;
  }

  /**
   * Number of values that were above the maximum (clamped to last bin).
   */
  get overflowCount(): number {
    return this._overflowCount;
  }

  /**
   * Total number of values added to the histogram.
   */
  get totalCount(): number {
    return this._totalCount;
  }

  /**
   * Calculate the Probability Density Function (PDF) at a given value.
   *
   * Returns the density (proportion of values in the bin containing the value,
   * normalized by bin width) for the bin containing the given value.
   *
   * @param value - The value to query
   * @returns The PDF value (proportion/binWidth), or 0 if outside range or no data
   *
   * @example
   * ```typescript
   * const hist = new Histogram(10, 0, 100);
   * // Add 100 values uniformly distributed
   * for (let i = 0; i < 100; i++) hist.add(i);
   *
   * hist.pdf(50); // ~0.01 (10 values in bin / 100 total / 10 width)
   * ```
   */
  pdf(value: number): number {
    if (this._totalCount === 0) return 0;
    if (value < this._min || value > this._max) return 0;

    let binIndex = Math.floor((value - this._min) / this._binWidth);
    if (binIndex >= this._binCount) {
      binIndex = this._binCount - 1;
    }

    return this._binCounts[binIndex] / this._totalCount / this._binWidth;
  }

  /**
   * Calculate the Cumulative Distribution Function (CDF) at a given value.
   *
   * Returns the proportion of values less than or equal to the given value.
   *
   * @param value - The value to query
   * @returns The CDF value (0 to 1)
   *
   * @example
   * ```typescript
   * const hist = new Histogram(10, 0, 100);
   * // Add 100 values uniformly distributed
   * for (let i = 0; i < 100; i++) hist.add(i);
   *
   * hist.cdf(50); // ~0.5 (half the values are <= 50)
   * hist.cdf(0); // ~0.1 (first bin)
   * hist.cdf(100); // 1.0 (all values)
   * ```
   */
  cdf(value: number): number {
    if (this._totalCount === 0) return 0;
    if (value < this._min) return 0;
    if (value >= this._max) return 1;

    let binIndex = Math.floor((value - this._min) / this._binWidth);
    if (binIndex >= this._binCount) {
      binIndex = this._binCount - 1;
    }

    // Sum counts of all bins up to and including the current bin
    let cumulativeCount = 0;
    for (let i = 0; i <= binIndex; i++) {
      cumulativeCount += this._binCounts[i];
    }

    // For partial bin, interpolate based on position within bin
    const binStart = this._min + binIndex * this._binWidth;
    const binFraction = (value - binStart) / this._binWidth;

    // Adjust for the partial current bin
    const currentBinCount = this._binCounts[binIndex];
    const previousBinsCount = cumulativeCount - currentBinCount;
    const partialBinCount = currentBinCount * binFraction;

    return (previousBinsCount + partialBinCount) / this._totalCount;
  }
}
