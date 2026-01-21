/**
 * Latency Tracker - Accurate percentile tracking with bounded memory
 *
 * Uses t-Digest from @acme/lib for accurate estimation of latency percentiles
 * (p50, p95, p99) without storing all values. Ideal for tracking API response
 * times, page load metrics, and other latency measurements.
 *
 * @example
 * ```typescript
 * const tracker = new LatencyTracker();
 *
 * // Record latencies
 * tracker.record(45);  // 45ms
 * tracker.record(120);
 * tracker.record(89);
 *
 * // Get percentiles
 * const stats = tracker.getStats();
 * console.log(stats.p50);  // Median latency
 * console.log(stats.p95);  // 95th percentile
 * console.log(stats.p99);  // 99th percentile
 * ```
 */

import { TDigest, type TDigestOptions } from "@acme/lib";

/**
 * Configuration for LatencyTracker
 */
export interface LatencyTrackerConfig {
  /**
   * t-Digest compression factor (default: 100).
   * Higher = more accuracy but more memory.
   */
  compression?: number;
  /**
   * Label for this tracker (e.g., "api-response", "page-load")
   */
  label?: string;
}

/**
 * Latency statistics snapshot
 */
export interface LatencyStats {
  /** Number of samples recorded */
  count: number;
  /** Minimum latency observed */
  min: number;
  /** Maximum latency observed */
  max: number;
  /** Mean latency */
  mean: number;
  /** Median (50th percentile) */
  p50: number;
  /** 75th percentile */
  p75: number;
  /** 90th percentile */
  p90: number;
  /** 95th percentile */
  p95: number;
  /** 99th percentile */
  p99: number;
  /** 99.9th percentile */
  p999: number;
}

/**
 * Latency Tracker using t-Digest for accurate percentile estimation
 *
 * Provides bounded-memory tracking of latency distributions with
 * highly accurate percentile estimates, especially at the extremes.
 */
export class LatencyTracker {
  private digest: TDigest;
  private readonly label: string;

  constructor(config?: LatencyTrackerConfig) {
    const tdigestOptions: TDigestOptions = {
      compression: config?.compression ?? 100,
    };
    this.digest = new TDigest(tdigestOptions);
    this.label = config?.label ?? "latency";
  }

  /**
   * Record a latency value
   *
   * @param latencyMs Latency in milliseconds
   */
  record(latencyMs: number): void {
    if (latencyMs >= 0 && Number.isFinite(latencyMs)) {
      this.digest.add(latencyMs);
    }
  }

  /**
   * Record multiple latency values
   *
   * @param latencies Array of latencies in milliseconds
   */
  recordAll(latencies: number[]): void {
    for (const latency of latencies) {
      this.record(latency);
    }
  }

  /**
   * Get a specific percentile
   *
   * @param percentile Percentile (0-100) or quantile (0-1)
   * @returns Estimated latency at that percentile
   */
  getPercentile(percentile: number): number {
    // Accept both 0-100 and 0-1 format
    const q = percentile > 1 ? percentile / 100 : percentile;
    return this.digest.quantile(q);
  }

  /**
   * Get the CDF value for a latency
   *
   * @param latencyMs Latency in milliseconds
   * @returns Proportion of requests faster than this (0-1)
   */
  getCdf(latencyMs: number): number {
    return this.digest.cdf(latencyMs);
  }

  /**
   * Get comprehensive latency statistics
   *
   * @returns Snapshot of all key metrics
   */
  getStats(): LatencyStats {
    return {
      count: this.digest.count,
      min: this.digest.min,
      max: this.digest.max,
      mean: this.digest.mean,
      p50: this.digest.quantile(0.5),
      p75: this.digest.quantile(0.75),
      p90: this.digest.quantile(0.9),
      p95: this.digest.quantile(0.95),
      p99: this.digest.quantile(0.99),
      p999: this.digest.quantile(0.999),
    };
  }

  /**
   * Get the tracker label
   */
  getLabel(): string {
    return this.label;
  }

  /**
   * Number of samples recorded
   */
  get count(): number {
    return this.digest.count;
  }

  /**
   * Merge with another tracker, returning a new combined tracker
   *
   * @param other Another LatencyTracker to merge with
   * @returns New combined tracker
   */
  merge(other: LatencyTracker): LatencyTracker {
    const merged = new LatencyTracker({
      compression: Math.max(
        this.digest.compression,
        other.digest.compression
      ),
      label: this.label,
    });
    // Access internal digest for merging
    (merged as unknown as { digest: TDigest }).digest = this.digest.merge(
      other.digest
    );
    return merged;
  }

  /**
   * Serialize for storage
   *
   * @returns Uint8Array that can be stored and restored
   */
  serialize(): Uint8Array {
    return this.digest.serialize();
  }

  /**
   * Restore from serialized data
   *
   * @param data Serialized tracker data
   * @param label Optional label for restored tracker
   * @returns Restored LatencyTracker
   */
  static deserialize(data: Uint8Array, label?: string): LatencyTracker {
    const tracker = new LatencyTracker({ label });
    (tracker as unknown as { digest: TDigest }).digest =
      TDigest.deserialize(data);
    return tracker;
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.digest = new TDigest({ compression: this.digest.compression });
  }
}

// ============================================================================
// Singleton for common use cases
// ============================================================================

const trackers = new Map<string, LatencyTracker>();

/**
 * Get or create a named latency tracker
 *
 * @param name Tracker name (e.g., "api", "render")
 * @param config Optional configuration
 * @returns Shared LatencyTracker instance
 *
 * @example
 * ```typescript
 * const apiTracker = getLatencyTracker("api");
 * apiTracker.record(responseTimeMs);
 *
 * // Later, get stats
 * const stats = apiTracker.getStats();
 * ```
 */
export function getLatencyTracker(
  name: string,
  config?: LatencyTrackerConfig
): LatencyTracker {
  let tracker = trackers.get(name);
  if (!tracker) {
    tracker = new LatencyTracker({ ...config, label: name });
    trackers.set(name, tracker);
  }
  return tracker;
}

/**
 * Record a latency to a named tracker
 *
 * @param name Tracker name
 * @param latencyMs Latency in milliseconds
 */
export function recordLatency(name: string, latencyMs: number): void {
  getLatencyTracker(name).record(latencyMs);
}

/**
 * Get stats from a named tracker
 *
 * @param name Tracker name
 * @returns Latency stats or null if tracker doesn't exist
 */
export function getLatencyStats(name: string): LatencyStats | null {
  const tracker = trackers.get(name);
  return tracker ? tracker.getStats() : null;
}

/**
 * Get all tracked latency stats
 *
 * @returns Map of tracker names to their stats
 */
export function getAllLatencyStats(): Map<string, LatencyStats> {
  const result = new Map<string, LatencyStats>();
  for (const [name, tracker] of trackers) {
    result.set(name, tracker.getStats());
  }
  return result;
}
