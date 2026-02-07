/**
 * t-Digest - Accurate quantile estimation with bounded memory
 *
 * A t-Digest is a probabilistic data structure for accurate estimation of
 * quantiles (percentiles) from a stream of data. It provides very accurate
 * estimates for extreme quantiles (p99, p999) while using bounded memory.
 *
 * Use cases:
 * - Latency percentile tracking (p50, p95, p99) without storing all values
 * - Order value distribution analysis
 * - Mergeable across services/time windows for distributed systems
 *
 * @see Dunning & Ertl, "Computing Extremely Accurate Quantiles Using t-Digests"
 */

/**
 * Configuration options for t-Digest
 */
export interface TDigestOptions {
  /**
   * Compression factor (default: 100).
   * Higher values = more accuracy but more memory.
   * - 50: ~1% error at median, ~0.5% at extremes
   * - 100: ~0.5% error at median, ~0.1% at extremes
   * - 200: ~0.25% error at median, ~0.05% at extremes
   */
  compression?: number;
}

/**
 * A centroid represents a cluster of values
 */
interface Centroid {
  mean: number;
  weight: number;
}

/**
 * t-Digest quantile estimator
 *
 * @example
 * ```typescript
 * const digest = new TDigest({ compression: 100 });
 *
 * // Add values
 * for (let i = 0; i < 10000; i++) {
 *   digest.add(Math.random() * 100);
 * }
 *
 * // Query quantiles
 * console.log(digest.quantile(0.5));   // Median (~50)
 * console.log(digest.quantile(0.95));  // 95th percentile (~95)
 * console.log(digest.quantile(0.99));  // 99th percentile (~99)
 *
 * // Query CDF
 * console.log(digest.cdf(50));  // ~0.5
 * ```
 */
export class TDigest {
  private readonly _compression: number;
  private centroids: Centroid[] = [];
  private _count: number = 0;
  private _min: number = Infinity;
  private _max: number = -Infinity;
  private _sum: number = 0;

  // Buffer for batching adds
  private buffer: number[] = [];
  private readonly bufferSize: number;

  /**
   * Creates a new t-Digest
   *
   * @param options Configuration options
   */
  constructor(options?: TDigestOptions) {
    this._compression = options?.compression ?? 100;

    if (this._compression <= 0) {
      throw new Error("Compression must be positive");
    }

    // Buffer size proportional to compression
    this.bufferSize = Math.max(1, Math.floor(this._compression / 2));
  }

  /**
   * Add a value to the digest
   *
   * @param value The value to add
   * @param weight Optional weight (default: 1)
   */
  add(value: number, weight: number = 1): void {
    if (weight <= 0) return;
    if (!Number.isFinite(value)) return;

    this._min = Math.min(this._min, value);
    this._max = Math.max(this._max, value);
    this._sum += value * weight;
    this._count += weight;

    // Add to buffer
    for (let i = 0; i < weight; i++) {
      this.buffer.push(value);
    }

    // Flush buffer when full
    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Add multiple values to the digest
   *
   * @param values Array of values to add
   */
  addAll(values: number[]): void {
    for (const value of values) {
      this.add(value);
    }
  }

  /**
   * Estimate the value at a given quantile
   *
   * @param q Quantile (0-1), e.g., 0.5 for median, 0.95 for p95
   * @returns Estimated value at the quantile
   */
  quantile(q: number): number {
    if (q < 0 || q > 1) {
      throw new Error("Quantile must be between 0 and 1");
    }

    this.flushBuffer();

    if (this.centroids.length === 0) {
      return NaN;
    }

    if (q === 0) return this._min;
    if (q === 1) return this._max;

    // Target weight position
    const targetWeight = q * this._count;

    let cumulativeWeight = 0;

    for (let i = 0; i < this.centroids.length; i++) {
      const centroid = this.centroids[i];
      const nextCumulativeWeight = cumulativeWeight + centroid.weight;

      if (nextCumulativeWeight >= targetWeight) {
        // Found the centroid containing the target
        if (i === 0) {
          // First centroid - interpolate from min
          const fraction =
            (targetWeight - cumulativeWeight) / centroid.weight;
          return this._min + fraction * (centroid.mean - this._min);
        }

        if (i === this.centroids.length - 1) {
          // Last centroid - interpolate to max
          const fraction =
            (targetWeight - cumulativeWeight) / centroid.weight;
          return centroid.mean + fraction * (this._max - centroid.mean);
        }

        // Middle centroid - interpolate between centroids
        const prevCentroid = this.centroids[i - 1];
        const fraction = (targetWeight - cumulativeWeight) / centroid.weight;

        // Interpolate between previous centroid mean and current
        const lowerBound =
          (prevCentroid.mean + centroid.mean) / 2;
        const upperBound =
          i < this.centroids.length - 1
            ? (centroid.mean + this.centroids[i + 1].mean) / 2
            : this._max;

        return lowerBound + fraction * (upperBound - lowerBound);
      }

      cumulativeWeight = nextCumulativeWeight;
    }

    return this._max;
  }

  /**
   * Estimate the CDF (cumulative distribution function) at a given value
   *
   * @param value The value to query
   * @returns Estimated proportion of values <= the given value (0-1)
   */
  cdf(value: number): number {
    this.flushBuffer();

    if (this.centroids.length === 0) {
      return NaN;
    }

    if (value <= this._min) return 0;
    if (value >= this._max) return 1;

    let cumulativeWeight = 0;

    for (let i = 0; i < this.centroids.length; i++) {
      const centroid = this.centroids[i];

      // Determine the range this centroid covers
      const lowerBound =
        i === 0
          ? this._min
          : (this.centroids[i - 1].mean + centroid.mean) / 2;
      const upperBound =
        i === this.centroids.length - 1
          ? this._max
          : (centroid.mean + this.centroids[i + 1].mean) / 2;

      if (value < lowerBound) {
        // Value is before this centroid
        return cumulativeWeight / this._count;
      }

      if (value <= upperBound) {
        // Value is within this centroid's range
        const fraction = (value - lowerBound) / (upperBound - lowerBound);
        return (cumulativeWeight + fraction * centroid.weight) / this._count;
      }

      cumulativeWeight += centroid.weight;
    }

    return 1;
  }

  /**
   * Merge another t-Digest into this one, returning a new digest
   *
   * @param other The t-Digest to merge with
   * @returns A new t-Digest containing all values from both
   */
  merge(other: TDigest): TDigest {
    const result = new TDigest({
      compression: Math.max(this._compression, other._compression),
    });

    // Flush both buffers
    this.flushBuffer();
    other.flushBuffer();

    // Combine centroids
    const allCentroids = [...this.centroids, ...other.centroids];

    // Sort by mean
    allCentroids.sort((a, b) => a.mean - b.mean);

    // Add to result (which will compress)
    for (const centroid of allCentroids) {
      result.addCentroid(centroid.mean, centroid.weight);
    }

    // Update stats from both digests
    result._count = this._count + other._count;
    result._sum = this._sum + other._sum;
    result._min = Math.min(this._min, other._min);
    result._max = Math.max(this._max, other._max);

    return result;
  }

  /**
   * Merge multiple t-Digests into one
   *
   * @param digests Array of t-Digests to merge
   * @returns A new t-Digest containing all values
   */
  static merge(digests: TDigest[]): TDigest {
    if (digests.length === 0) {
      return new TDigest();
    }

    let result = digests[0];
    for (let i = 1; i < digests.length; i++) {
      result = result.merge(digests[i]);
    }
    return result;
  }

  /**
   * Serialize the t-Digest to a Uint8Array
   *
   * Format:
   * - Bytes 0-7: compression (float64 LE)
   * - Bytes 8-15: count (float64 LE)
   * - Bytes 16-23: min (float64 LE)
   * - Bytes 24-31: max (float64 LE)
   * - Bytes 32-35: centroid count (uint32 LE)
   * - Bytes 36+: centroids (16 bytes each: mean float64 + weight float64)
   */
  serialize(): Uint8Array {
    this.flushBuffer();

    const headerSize = 36;
    const centroidBytes = this.centroids.length * 16;
    const result = new Uint8Array(headerSize + centroidBytes);
    const view = new DataView(result.buffer);

    view.setFloat64(0, this._compression, true);
    view.setFloat64(8, this._count, true);
    view.setFloat64(16, this._min, true);
    view.setFloat64(24, this._max, true);
    view.setUint32(32, this.centroids.length, true);

    let offset = headerSize;
    for (const centroid of this.centroids) {
      view.setFloat64(offset, centroid.mean, true);
      view.setFloat64(offset + 8, centroid.weight, true);
      offset += 16;
    }

    return result;
  }

  /**
   * Deserialize a t-Digest from a Uint8Array
   *
   * @param data Serialized data from serialize()
   * @returns Restored TDigest instance
   */
  static deserialize(data: Uint8Array): TDigest {
    if (data.length < 36) {
      throw new Error("Invalid serialized data: too short");
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const compression = view.getFloat64(0, true);
    const count = view.getFloat64(8, true);
    const min = view.getFloat64(16, true);
    const max = view.getFloat64(24, true);
    const centroidCount = view.getUint32(32, true);

    const expectedLength = 36 + centroidCount * 16;
    if (data.length !== expectedLength) {
      throw new Error(
        `Invalid serialized data length: expected ${expectedLength}, got ${data.length}`
      );
    }

    const digest = new TDigest({ compression });
    (digest as unknown as { _count: number })._count = count;
    (digest as unknown as { _min: number })._min = min;
    (digest as unknown as { _max: number })._max = max;
    (digest as unknown as { _sum: number })._sum = 0; // Will be approximated

    let offset = 36;
    for (let i = 0; i < centroidCount; i++) {
      const mean = view.getFloat64(offset, true);
      const weight = view.getFloat64(offset + 8, true);
      digest.centroids.push({ mean, weight });
      (digest as unknown as { _sum: number })._sum += mean * weight;
      offset += 16;
    }

    return digest;
  }

  /** Total count of values added */
  get count(): number {
    return this._count;
  }

  /** Minimum value seen */
  get min(): number {
    return this._count === 0 ? NaN : this._min;
  }

  /** Maximum value seen */
  get max(): number {
    return this._count === 0 ? NaN : this._max;
  }

  /** Mean of all values */
  get mean(): number {
    return this._count === 0 ? NaN : this._sum / this._count;
  }

  /** Compression parameter */
  get compression(): number {
    return this._compression;
  }

  /** Number of centroids currently stored */
  get centroidCount(): number {
    this.flushBuffer();
    return this.centroids.length;
  }

  /**
   * Flush the buffer and compress centroids
   */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;

    // Sort buffer values
    this.buffer.sort((a, b) => a - b);

    // Add each value as a centroid
    for (const value of this.buffer) {
      this.addCentroid(value, 1);
    }

    this.buffer = [];

    // Compress if needed
    this.compress();
  }

  /**
   * Add a centroid (used internally and during merge)
   */
  private addCentroid(mean: number, weight: number): void {
    // Find insertion point to maintain sorted order
    let insertIndex = this.centroids.length;
    for (let i = 0; i < this.centroids.length; i++) {
      if (this.centroids[i].mean > mean) {
        insertIndex = i;
        break;
      }
    }

    this.centroids.splice(insertIndex, 0, { mean, weight });
  }

  /**
   * Compress centroids to maintain bounded memory
   */
  private compress(): void {
    if (this.centroids.length <= 1) return;

    const maxCentroids = Math.ceil(this._compression * 2);

    while (this.centroids.length > maxCentroids) {
      // Find the pair of adjacent centroids with smallest combined weight
      // that can be merged without violating the size bound
      let bestIndex = -1;
      let bestScore = Infinity;

      for (let i = 0; i < this.centroids.length - 1; i++) {
        const c1 = this.centroids[i];
        const c2 = this.centroids[i + 1];

        // Calculate the quantile at this position
        let cumulativeWeight = 0;
        for (let j = 0; j < i; j++) {
          cumulativeWeight += this.centroids[j].weight;
        }
        const q = (cumulativeWeight + c1.weight / 2) / this._count;

        // Size limit based on quantile (tighter at extremes)
        const kLimit = this.kSize(q);
        const combinedWeight = c1.weight + c2.weight;

        if (combinedWeight <= kLimit) {
          // Score prefers merging smaller centroids
          const score = combinedWeight;
          if (score < bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }
      }

      if (bestIndex === -1) {
        // No valid merge found, stop compressing
        break;
      }

      // Merge the best pair
      const c1 = this.centroids[bestIndex];
      const c2 = this.centroids[bestIndex + 1];
      const totalWeight = c1.weight + c2.weight;
      const mergedMean =
        (c1.mean * c1.weight + c2.mean * c2.weight) / totalWeight;

      this.centroids.splice(bestIndex, 2, {
        mean: mergedMean,
        weight: totalWeight,
      });
    }
  }

  /**
   * Calculate the maximum centroid size at a given quantile
   * Uses the k-function from the t-Digest paper
   */
  private kSize(q: number): number {
    // Scale function that allows larger centroids near median
    // and smaller centroids at extremes
    const k = this._compression / 2;
    return (
      (4 * this._count * k * q * (1 - q)) / this._compression +
      this._count / this._compression
    );
  }
}
