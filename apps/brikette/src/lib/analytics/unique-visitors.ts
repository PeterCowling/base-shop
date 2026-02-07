/**
 * Unique Visitor Tracking using HyperLogLog
 *
 * Privacy-preserving unique visitor counting that doesn't store individual visitor IDs.
 * Uses HyperLogLog probabilistic data structure for memory-efficient cardinality estimation.
 */

import { HyperLogLog } from "@acme/lib";

/**
 * Unique visitor tracker for a single time period (typically a day)
 *
 * @example
 * ```typescript
 * const tracker = new UniqueVisitorTracker();
 *
 * // Track visitors (using session ID, fingerprint hash, etc.)
 * tracker.add("visitor-session-123");
 * tracker.add("visitor-session-456");
 * tracker.add("visitor-session-123"); // duplicate, won't affect count
 *
 * // Get estimated unique count
 * console.log(tracker.getCount()); // ~2
 *
 * // Serialize for storage
 * const data = tracker.serialize();
 * localStorage.setItem("visitors-2024-01-15", JSON.stringify(Array.from(data)));
 * ```
 */
export class UniqueVisitorTracker {
  private hll: HyperLogLog;

  /**
   * Create a new unique visitor tracker
   *
   * @param precision HyperLogLog precision (4-18, default 14 for ~0.8% error)
   */
  constructor(precision: number = 14) {
    this.hll = new HyperLogLog({ precision });
  }

  /**
   * Add a visitor ID to the tracker
   *
   * @param visitorId Unique visitor identifier (session ID, fingerprint, etc.)
   */
  add(visitorId: string): void {
    this.hll.add(visitorId);
  }

  /**
   * Get estimated unique visitor count
   *
   * @returns Estimated number of unique visitors
   */
  getCount(): number {
    return this.hll.count();
  }

  /**
   * Get the standard error for this tracker's precision
   *
   * @returns Standard error as a decimal (e.g., 0.008 for 0.8%)
   */
  getStandardError(): number {
    return this.hll.standardError;
  }

  /**
   * Merge another tracker into this one
   *
   * Useful for combining counts from different sources or time periods.
   *
   * @param other Another UniqueVisitorTracker to merge
   * @returns This tracker (for chaining)
   */
  merge(other: UniqueVisitorTracker): UniqueVisitorTracker {
    this.hll = this.hll.merge(other.hll);
    return this;
  }

  /**
   * Serialize the tracker state for persistence
   *
   * @returns Binary data representing the HyperLogLog state
   */
  serialize(): Uint8Array {
    return this.hll.serialize();
  }

  /**
   * Create a tracker from serialized data
   *
   * @param data Serialized tracker data
   * @returns Restored UniqueVisitorTracker
   */
  static deserialize(data: Uint8Array): UniqueVisitorTracker {
    const tracker = new UniqueVisitorTracker();
    tracker.hll = HyperLogLog.deserialize(data);
    return tracker;
  }

  /**
   * Merge multiple trackers into a new combined tracker
   *
   * @param trackers Array of trackers to merge
   * @returns New tracker with combined counts
   */
  static merge(trackers: UniqueVisitorTracker[]): UniqueVisitorTracker {
    if (trackers.length === 0) {
      return new UniqueVisitorTracker();
    }

    const hlls = trackers.map((t) => t.hll);
    const combined = HyperLogLog.union(hlls);

    const result = new UniqueVisitorTracker();
    result.hll = combined;
    return result;
  }
}

/**
 * Store interface for persisting unique visitor data
 */
export interface UniqueVisitorStore {
  /**
   * Get or create a tracker for a specific date
   */
  getOrCreate(date: string): Promise<UniqueVisitorTracker>;

  /**
   * Save a tracker for a specific date
   */
  save(date: string, tracker: UniqueVisitorTracker): Promise<void>;

  /**
   * Get trackers for a date range
   */
  getRange(startDate: string, endDate: string): Promise<UniqueVisitorTracker[]>;
}

/**
 * In-memory unique visitor store (for development/testing)
 */
export class InMemoryUniqueVisitorStore implements UniqueVisitorStore {
  private store = new Map<string, Uint8Array>();

  async getOrCreate(date: string): Promise<UniqueVisitorTracker> {
    const data = this.store.get(date);
    if (data) {
      return UniqueVisitorTracker.deserialize(data);
    }
    return new UniqueVisitorTracker();
  }

  async save(date: string, tracker: UniqueVisitorTracker): Promise<void> {
    this.store.set(date, tracker.serialize());
  }

  async getRange(startDate: string, endDate: string): Promise<UniqueVisitorTracker[]> {
    const trackers: UniqueVisitorTracker[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const data = this.store.get(dateStr);
      if (data) {
        trackers.push(UniqueVisitorTracker.deserialize(data));
      }
    }

    return trackers;
  }
}

// Singleton in-memory store for the app
let _memoryStore: InMemoryUniqueVisitorStore | null = null;

/**
 * Get the shared in-memory unique visitor store
 */
export function getUniqueVisitorStore(): UniqueVisitorStore {
  if (!_memoryStore) {
    _memoryStore = new InMemoryUniqueVisitorStore();
  }
  return _memoryStore;
}

/**
 * Track a unique visitor for today
 *
 * @param visitorId Unique visitor identifier
 */
export async function trackUniqueVisitor(visitorId: string): Promise<void> {
  const store = getUniqueVisitorStore();
  const today = new Date().toISOString().slice(0, 10);

  const tracker = await store.getOrCreate(today);
  tracker.add(visitorId);
  await store.save(today, tracker);
}

/**
 * Get unique visitor count for a specific date
 *
 * @param date Date string (YYYY-MM-DD)
 * @returns Estimated unique visitor count
 */
export async function getUniqueVisitorCount(date: string): Promise<number> {
  const store = getUniqueVisitorStore();
  const tracker = await store.getOrCreate(date);
  return tracker.getCount();
}

/**
 * Get unique visitor count for a date range
 *
 * @param startDate Start date (YYYY-MM-DD)
 * @param endDate End date (YYYY-MM-DD)
 * @returns Estimated unique visitor count for the entire range
 */
export async function getUniqueVisitorCountRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const store = getUniqueVisitorStore();
  const trackers = await store.getRange(startDate, endDate);

  if (trackers.length === 0) {
    return 0;
  }

  const combined = UniqueVisitorTracker.merge(trackers);
  return combined.getCount();
}
