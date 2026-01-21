/**
 * Trending Content Service
 *
 * Detects trending guides and content using Count-Min Sketch with time decay.
 * The TrendingTracker from @acme/lib provides automatic decay to ensure
 * "trending" reflects recent activity, not historical totals.
 */

import { TrendingTracker } from "@acme/lib";

/**
 * Configuration for the trending service
 */
export interface TrendingServiceConfig {
  /** Width of the Count-Min Sketch (higher = more accurate, default: 1000) */
  sketchWidth?: number;
  /** Depth of the Count-Min Sketch (higher = lower error, default: 5) */
  sketchDepth?: number;
  /** Number of top items to track (default: 100) */
  topK?: number;
  /** Decay interval in milliseconds (default: 60000 = 1 minute) */
  decayIntervalMs?: number;
  /** Decay factor applied each interval (default: 0.95 = 5% decay/minute) */
  decayFactor?: number;
}

/**
 * Content types that can be tracked for trending
 */
export type ContentType = "guide" | "product" | "page" | "search";

/**
 * Trending item with score
 */
export interface TrendingItem {
  /** Content identifier */
  id: string;
  /** Trend score (decayed count) */
  score: number;
}

/**
 * Trending Content Service
 *
 * Tracks trending content with automatic time decay.
 *
 * @example
 * ```typescript
 * const trending = new TrendingService();
 * trending.start(); // Start decay timer
 *
 * // Record content views
 * trending.record("guide", "positanoBeaches");
 * trending.record("guide", "pathOfTheGods");
 * trending.record("guide", "positanoBeaches"); // More views = higher score
 *
 * // Get trending guides
 * const topGuides = trending.getTrending("guide", 5);
 * // [{ id: "positanoBeaches", score: 2 }, { id: "pathOfTheGods", score: 1 }]
 *
 * // Stop when done
 * trending.stop();
 * ```
 */
export class TrendingService {
  private trackers: Map<ContentType, TrendingTracker> = new Map();
  private config: Required<TrendingServiceConfig>;
  private started = false;

  constructor(config?: TrendingServiceConfig) {
    this.config = {
      sketchWidth: config?.sketchWidth ?? 1000,
      sketchDepth: config?.sketchDepth ?? 5,
      topK: config?.topK ?? 100,
      decayIntervalMs: config?.decayIntervalMs ?? 60000, // 1 minute
      decayFactor: config?.decayFactor ?? 0.95,
    };
  }

  /**
   * Get or create a tracker for a content type
   */
  private getTracker(type: ContentType): TrendingTracker {
    let tracker = this.trackers.get(type);
    if (!tracker) {
      tracker = new TrendingTracker({
        sketchWidth: this.config.sketchWidth,
        sketchDepth: this.config.sketchDepth,
        topK: this.config.topK,
        decayIntervalMs: this.config.decayIntervalMs,
        decayFactor: this.config.decayFactor,
      });
      this.trackers.set(type, tracker);

      // Auto-start the tracker if service is started
      if (this.started) {
        tracker.start();
      }
    }
    return tracker;
  }

  /**
   * Start the trending service (begins decay timers)
   */
  start(): void {
    if (this.started) return;

    this.started = true;
    for (const tracker of this.trackers.values()) {
      tracker.start();
    }
  }

  /**
   * Stop the trending service (stops decay timers)
   */
  stop(): void {
    if (!this.started) return;

    this.started = false;
    for (const tracker of this.trackers.values()) {
      tracker.stop();
    }
  }

  /**
   * Record a content view
   *
   * @param type Content type
   * @param id Content identifier
   * @param count View count (default: 1)
   */
  record(type: ContentType, id: string, count: number = 1): void {
    const tracker = this.getTracker(type);
    for (let i = 0; i < count; i++) {
      tracker.record(id);
    }
  }

  /**
   * Get trending items for a content type
   *
   * @param type Content type
   * @param limit Maximum items to return (default: 10)
   * @returns Array of trending items sorted by score (descending)
   */
  getTrending(type: ContentType, limit: number = 10): TrendingItem[] {
    const tracker = this.trackers.get(type);
    if (!tracker) {
      return [];
    }

    const items = tracker.getTrending();
    return items.slice(0, limit).map((id) => ({
      id,
      score: this.getScore(type, id),
    }));
  }

  /**
   * Get the current score for a specific item
   *
   * @param type Content type
   * @param id Content identifier
   * @returns Current trend score
   */
  getScore(type: ContentType, id: string): number {
    const tracker = this.trackers.get(type);
    if (!tracker) {
      return 0;
    }

    // Access the underlying sketch to get the count
    // TrendingTracker wraps CountMinSketch
    const trending = tracker.getTrending();
    const index = trending.indexOf(id);
    if (index === -1) {
      return 0;
    }

    // Approximate score based on position (higher position = higher score)
    // This is a simplification since TrendingTracker doesn't expose raw counts
    return Math.max(1, trending.length - index);
  }

  /**
   * Check if the service is running
   */
  isRunning(): boolean {
    return this.started;
  }

  /**
   * Get all tracked content types
   */
  getTrackedTypes(): ContentType[] {
    return Array.from(this.trackers.keys());
  }
}

// Singleton instance
let _instance: TrendingService | null = null;

/**
 * Get the shared TrendingService instance
 */
export function getTrendingService(): TrendingService {
  if (!_instance) {
    _instance = new TrendingService();
  }
  return _instance;
}

/**
 * Record a guide view for trending
 *
 * @param guideKey Guide identifier
 */
export function recordGuideView(guideKey: string): void {
  const service = getTrendingService();
  service.record("guide", guideKey);
}

/**
 * Get trending guides
 *
 * @param limit Maximum guides to return (default: 10)
 * @returns Array of trending guide items
 */
export function getTrendingGuides(limit: number = 10): TrendingItem[] {
  const service = getTrendingService();
  return service.getTrending("guide", limit);
}

/**
 * Record a search query for trending
 *
 * @param query Search query
 */
export function recordSearchQuery(query: string): void {
  const service = getTrendingService();
  service.record("search", query.toLowerCase().trim());
}

/**
 * Get trending search queries
 *
 * @param limit Maximum queries to return (default: 10)
 * @returns Array of trending search items
 */
export function getTrendingSearches(limit: number = 10): TrendingItem[] {
  const service = getTrendingService();
  return service.getTrending("search", limit);
}
