'use client';

/**
 * Development-only Firebase metrics panel
 *
 * Shows real-time Firebase query metrics in a collapsible panel.
 * Only renders in development mode.
 *
 * Uses the live firebaseMetrics singleton from @/services/firebase —
 * the same singleton wired to the instrumented get() and onValue() wrappers,
 * so all reads tracked by useBudgetWatcher appear here too.
 */

import { useEffect, useState } from 'react';

import { firebaseMetrics } from '@/services/firebase';

interface MetricsData {
  totalQueries: number;
  totalBytes: number;
  averageQueryTime: number;
  slowQueriesCount: number;
  topPaths: Array<{
    path: string;
    count: number;
    bytes: string;
    avgTime: string;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function deriveMetricsData(raw: ReturnType<typeof firebaseMetrics.getMetrics>): MetricsData {
  // Aggregate per-path counts and durations from recentQueries ring buffer
  const byPath: Record<string, { count: number; totalBytes: number; totalDuration: number; durationCount: number }> = {};
  for (const q of raw.recentQueries) {
    if (!byPath[q.path]) {
      byPath[q.path] = { count: 0, totalBytes: 0, totalDuration: 0, durationCount: 0 };
    }
    byPath[q.path].count++;
    byPath[q.path].totalBytes += q.sizeBytes;
    if (q.durationMs > 0) {
      byPath[q.path].totalDuration += q.durationMs;
      byPath[q.path].durationCount++;
    }
  }

  // Estimate average query time from recentQueries (best effort; ring buffer capped at 50)
  let totalDuration = 0;
  let durationCount = 0;
  for (const q of raw.recentQueries) {
    if (q.durationMs > 0) {
      totalDuration += q.durationMs;
      durationCount++;
    }
  }
  const averageQueryTime = durationCount > 0 ? totalDuration / durationCount : 0;

  const topPaths = Object.entries(byPath)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([path, stats]) => ({
      path: path.length > 50 ? `...${path.slice(-47)}` : path,
      count: stats.count,
      bytes: formatBytes(stats.totalBytes),
      avgTime: stats.durationCount > 0
        ? `${(stats.totalDuration / stats.durationCount).toFixed(1)}ms`
        : 'n/a',
    }));

  return {
    totalQueries: raw.queryCount,
    totalBytes: raw.totalBytes,
    averageQueryTime,
    slowQueriesCount: raw.slowQueries.length,
    topPaths,
  };
}

export function FirebaseMetricsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Only render in development — must check after hooks
  const isDevelopment = process.env.NODE_ENV === 'development';

  const refreshMetrics = () => {
    setMetrics(deriveMetricsData(firebaseMetrics.getMetrics()));
  };

  const handleClear = () => {
    firebaseMetrics.reset();
    refreshMetrics();
  };

  const handlePrintToConsole = () => {
    const raw = firebaseMetrics.getMetrics();
    console.info('[Firebase Metrics] Summary', { // i18n-exempt -- PRIME-101 developer diagnostic [ttl=2026-12-31]
      queryCount: raw.queryCount,
      totalBytes: formatBytes(raw.totalBytes),
      activeListeners: raw.activeListeners,
      slowQueries: raw.slowQueries.length,
      recentPaths: raw.recentQueries.map((q) => q.path),
    });
  };

  useEffect(() => {
    if (isOpen) {
      refreshMetrics();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(refreshMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen]);

  // Early return after all hooks
  if (!isDevelopment) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
          }}
          title="Open Firebase Metrics"
        >
          Firebase
        </button>
      ) : (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '400px',
            maxHeight: '600px',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Firebase Metrics</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 5px',
              }}
            >
              x
            </button>
          </div>

          {/* Controls */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={refreshMetrics}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Refresh
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Clear
            </button>
            <button
              onClick={handlePrintToConsole}
              style={{
                padding: '6px 12px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Console
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                marginLeft: 'auto',
              }}
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>

          {/* Metrics Display */}
          {metrics && (
            <div style={{ padding: '12px' }}>
              {/* Summary Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: '#666', fontSize: '10px' }}>
                    Total Queries
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {metrics.totalQueries}
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: '#666', fontSize: '10px' }}>
                    Total Data
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {formatBytes(metrics.totalBytes)}
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: '#666', fontSize: '10px' }}>
                    Avg Query Time
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {metrics.averageQueryTime.toFixed(1)}ms
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: metrics.slowQueriesCount > 0 ? '#fff3cd' : '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: '#666', fontSize: '10px' }}>
                    Slow Queries
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {metrics.slowQueriesCount}
                  </div>
                </div>
              </div>

              {/* Top Paths */}
              <div>
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    fontSize: '11px',
                    color: '#666',
                  }}
                >
                  TOP PATHS
                </div>
                {metrics.topPaths.length > 0 ? (
                  <div style={{ fontSize: '10px' }}>
                    {metrics.topPaths.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '6px',
                          backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white',
                          borderRadius: '3px',
                          marginBottom: '2px',
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px',
                          }}
                          title={item.path}
                        >
                          {item.path}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#666',
                          }}
                        >
                          <span>Count: {item.count}</span>
                          <span>Size: {item.bytes}</span>
                          <span>Avg: {item.avgTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999', fontSize: '11px' }}>
                    No queries tracked yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
