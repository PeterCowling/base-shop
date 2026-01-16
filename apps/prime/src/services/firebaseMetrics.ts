// src/services/firebaseMetrics.ts

/**
 * Firebase Realtime Database metrics tracking
 *
 * Tracks query performance and bandwidth usage for development monitoring.
 * Metrics are only collected in development mode to avoid performance overhead.
 */

export interface FirebaseQueryMetric {
  type: 'get' | 'onValue' | 'subscription';
  path: string;
  timestamp: number;
  duration?: number; // milliseconds
  bytesTransferred: number;
  cacheHit?: boolean;
  error?: string;
}

export interface FirebaseMetricsSummary {
  totalQueries: number;
  totalBytes: number;
  averageQueryTime: number;
  slowQueries: FirebaseQueryMetric[]; // queries > 500ms
  byPath: Record<string, {
    count: number;
    bytes: number;
    avgDuration: number;
  }>;
  byType: Record<string, number>;
}

class FirebaseMetricsTracker {
  private metrics: FirebaseQueryMetric[] = [];
  private enabled: boolean;
  private maxMetrics = 1000; // Keep last 1000 metrics
  private slowQueryThreshold = 500; // milliseconds

  constructor() {
    // Only enable in development
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Record the start of a query
   */
  startQuery(type: 'get' | 'onValue' | 'subscription', path: string): (bytesTransferred: number, error?: string) => void {
    if (!this.enabled) {
      return (_bytesTransferred: number, _error?: string) => {}; // No-op
    }

    const startTime = Date.now();
    const startTimestamp = performance.now();

    return (bytesTransferred: number, error?: string) => {
      const duration = performance.now() - startTimestamp;

      const metric: FirebaseQueryMetric = {
        type,
        path,
        timestamp: startTime,
        duration,
        bytesTransferred,
        error,
      };

      this.recordMetric(metric);
    };
  }

  /**
   * Record a completed query metric
   */
  private recordMetric(metric: FirebaseQueryMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow queries
    if (metric.duration && metric.duration > this.slowQueryThreshold) {
      console.warn(
        `[Firebase Metrics] Slow query detected (${metric.duration.toFixed(2)}ms): ${metric.path}`,
        metric
      );
    }

    // Log errors
    if (metric.error) {
      console.error(
        `[Firebase Metrics] Query error: ${metric.path}`,
        metric.error
      );
    }
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): FirebaseMetricsSummary {
    if (!this.enabled || this.metrics.length === 0) {
      return {
        totalQueries: 0,
        totalBytes: 0,
        averageQueryTime: 0,
        slowQueries: [],
        byPath: {},
        byType: {},
      };
    }

    const byPath: Record<string, { count: number; bytes: number; durations: number[] }> = {};
    const byType: Record<string, number> = {};
    let totalBytes = 0;
    let totalDuration = 0;
    let queriesWithDuration = 0;

    for (const metric of this.metrics) {
      // By path
      if (!byPath[metric.path]) {
        byPath[metric.path] = { count: 0, bytes: 0, durations: [] };
      }
      byPath[metric.path].count++;
      byPath[metric.path].bytes += metric.bytesTransferred;
      if (metric.duration !== undefined) {
        byPath[metric.path].durations.push(metric.duration);
      }

      // By type
      byType[metric.type] = (byType[metric.type] || 0) + 1;

      // Totals
      totalBytes += metric.bytesTransferred;
      if (metric.duration !== undefined) {
        totalDuration += metric.duration;
        queriesWithDuration++;
      }
    }

    // Calculate averages for byPath
    const byPathSummary: Record<string, { count: number; bytes: number; avgDuration: number }> = {};
    for (const [path, data] of Object.entries(byPath)) {
      byPathSummary[path] = {
        count: data.count,
        bytes: data.bytes,
        avgDuration: data.durations.length > 0
          ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
          : 0,
      };
    }

    const slowQueries = this.metrics
      .filter(m => m.duration && m.duration > this.slowQueryThreshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10); // Top 10 slowest

    return {
      totalQueries: this.metrics.length,
      totalBytes,
      averageQueryTime: queriesWithDuration > 0 ? totalDuration / queriesWithDuration : 0,
      slowQueries,
      byPath: byPathSummary,
      byType,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Print formatted summary to console
   */
  printSummary(): void {
    const summary = this.getSummary();

    console.group('📊 Firebase Metrics Summary');

    console.log(`Total Queries: ${summary.totalQueries}`);
    console.log(`Total Bytes: ${this.formatBytes(summary.totalBytes)}`);
    console.log(`Average Query Time: ${summary.averageQueryTime.toFixed(2)}ms`);

    console.groupCollapsed('Queries by Type');
    console.table(summary.byType);
    console.groupEnd();

    console.groupCollapsed('Queries by Path (Top 10)');
    const topPaths = Object.entries(summary.byPath)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        bytes: this.formatBytes(stats.bytes),
        avgTime: `${stats.avgDuration.toFixed(2)}ms`,
      }));
    console.table(topPaths);
    console.groupEnd();

    if (summary.slowQueries.length > 0) {
      console.groupCollapsed(`⚠️  Slow Queries (>${this.slowQueryThreshold}ms)`);
      const slowQueries = summary.slowQueries.map(q => ({
        path: q.path,
        duration: `${q.duration?.toFixed(2)}ms`,
        bytes: this.formatBytes(q.bytesTransferred),
        time: new Date(q.timestamp).toLocaleTimeString(),
      }));
      console.table(slowQueries);
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Check if metrics tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const firebaseMetrics = new FirebaseMetricsTracker();

// Expose to window in development for manual inspection
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__firebaseMetrics = {
    getSummary: () => firebaseMetrics.getSummary(),
    printSummary: () => firebaseMetrics.printSummary(),
    clear: () => firebaseMetrics.clear(),
  };

  console.log(
    '%c💡 Firebase Metrics Available',
    'color: #4CAF50; font-weight: bold',
    '\nAccess via: window.__firebaseMetrics'
  );
}
