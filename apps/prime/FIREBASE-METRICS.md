# Firebase Metrics Tracking

## Overview

The Firebase metrics system tracks all Firebase Realtime Database queries to help identify performance issues and optimize data fetching patterns. Metrics are only collected in development mode.

## Features

- **Query Performance Tracking**: Measures duration of every Firebase query
- **Bandwidth Monitoring**: Tracks bytes transferred for each query
- **Slow Query Detection**: Automatically flags queries taking >500ms
- **Path Analysis**: Aggregates metrics by Firebase path to identify hotspots
- **Real-time Dev Panel**: Visual UI for monitoring queries during development
- **Console API**: Programmatic access to metrics via browser console

## Usage

### Visual Dev Panel

A floating metrics panel is automatically available in development mode:

1. **Open Panel**: Click the "📊 Firebase" button in the bottom-right corner
2. **View Metrics**: See total queries, bandwidth, average query time, and slow queries
3. **Top Paths**: View the most frequently accessed Firebase paths
4. **Auto-refresh**: Enable to update metrics every 2 seconds
5. **Clear**: Reset all metrics
6. **Console**: Print detailed metrics to browser console

### Console API

Access metrics programmatically in the browser console:

```javascript
// Print formatted summary
window.__firebaseMetrics.printSummary()

// Get raw metrics data
const summary = window.__firebaseMetrics.getSummary()
console.log(summary)

// Clear metrics
window.__firebaseMetrics.clear()
```

## Metrics Data Structure

### Query Metric
```typescript
interface FirebaseQueryMetric {
  type: 'get' | 'onValue' | 'subscription'
  path: string                // Firebase path
  timestamp: number           // Unix timestamp
  duration?: number           // Query duration in ms
  bytesTransferred: number    // Payload size in bytes
  error?: string              // Error message if query failed
}
```

### Summary
```typescript
interface FirebaseMetricsSummary {
  totalQueries: number
  totalBytes: number
  averageQueryTime: number
  slowQueries: FirebaseQueryMetric[]  // Queries >500ms
  byPath: Record<string, {
    count: number
    bytes: number
    avgDuration: number
  }>
  byType: Record<string, number>
}
```

## Query Types

- **`get`**: One-time Firebase read queries
- **`onValue`**: Real-time listener snapshot callbacks
- **`subscription`**: Initial listener registration (0 bytes)

## Performance Thresholds

- **Slow Query**: >500ms
- **Warning**: Automatically logged to console
- **Metrics Buffer**: Last 1000 queries retained

## Integration with React Query

Firebase metrics work seamlessly with React Query caching:

1. **First Query**: Firebase metrics track the initial network request
2. **Cache Hit**: React Query serves from cache (no Firebase metric)
3. **Stale Revalidation**: Firebase metrics track the background refetch

This helps identify which queries benefit most from React Query caching.

## Example Console Output

```
📊 Firebase Metrics Summary
  Total Queries: 47
  Total Bytes: 152.3 KB
  Average Query Time: 87.34ms

  Queries by Type
  ┌─────────────┬───────┐
  │   (index)   │ Value │
  ├─────────────┼───────┤
  │     get     │  42   │
  │   onValue   │   3   │
  │ subscription│   2   │
  └─────────────┴───────┘

  Queries by Path (Top 10)
  ┌─────┬───────────────────────────┬───────┬───────────┬──────────┐
  │ idx │           path            │ count │   bytes   │ avgTime  │
  ├─────┼───────────────────────────┼───────┼───────────┼──────────┤
  │  0  │ bookings?orderBy=...      │  12   │  45.2 KB  │ 125.50ms │
  │  1  │ preorder/abc123           │   8   │  18.9 KB  │  67.25ms │
  │  2  │ guestsDetails/XYZ/abc123  │   6   │  12.1 KB  │  45.10ms │
  └─────┴───────────────────────────┴───────┴───────────┴──────────┘

  ⚠️  Slow Queries (>500ms)
  ┌─────┬──────────────────┬──────────┬────────┬───────────┐
  │ idx │      path        │ duration │  bytes │   time    │
  ├─────┼──────────────────┼──────────┼────────┼───────────┤
  │  0  │ bookings         │ 1234.50ms│ 67.2 KB│ 10:23:45  │
  └─────┴──────────────────┴──────────┴────────┴───────────┘
```

## Files

- [`src/services/firebaseMetrics.ts`](./src/services/firebaseMetrics.ts) - Core metrics tracking
- [`src/services/firebase.ts`](./src/services/firebase.ts) - Instrumented Firebase SDK wrappers
- [`src/components/dev/FirebaseMetricsPanel.tsx`](./src/components/dev/FirebaseMetricsPanel.tsx) - Dev UI panel
- [`src/app/layout.tsx`](./src/app/layout.tsx) - Panel integration

## React Query Cache Configuration

All data hooks now use React Query with optimized cache settings:

| Hook | Stale Time | Cache Time | Rationale |
|------|-----------|-----------|-----------|
| useFetchBookingsData | 5 min | 10 min | Moderately dynamic |
| useFetchGuestDetails | 10 min | 30 min | Rarely changes |
| useFetchPreordersData | 2 min | 5 min | Frequently updated |
| useFetchLoans | 10 min | 30 min | Rarely changes |
| useFetchGuestByRoom | 10 min | 30 min | Rarely changes |
| useFetchFinancialsRoom | 5 min | 15 min | Moderately dynamic |
| useFetchCityTax | 10 min | 30 min | Rarely changes |
| useFetchBagStorageData | 10 min | 30 min | Rarely changes |

## Expected Impact

With React Query caching + Firebase metrics:

1. **60-70% reduction** in Firebase queries (from N+1 fix + initial React Query)
2. **Additional 30-40% reduction** from remaining hooks now cached
3. **Real-time visibility** into query patterns during development
4. **Proactive slow query detection** prevents performance regressions

## Production Behavior

- Metrics tracking is **completely disabled** in production
- Zero performance overhead in production builds
- Dev panel does not render in production
- Console API not available in production

## Troubleshooting

### High Query Counts
Check React Query DevTools to verify stale/cache times are appropriate for your data volatility.

### Slow Queries
1. Review Firebase indexes in `firebase-rules-update.json`
2. Consider denormalizing data to reduce query complexity
3. Check if data can be loaded lazily instead of upfront

### Large Payloads
1. Use Firebase query filters (orderByChild, limitToLast) to reduce data transfer
2. Consider pagination for large collections
3. Remove unused fields from Firebase schema

## See Also

- [FIREBASE.md](./FIREBASE.md) - Firebase architecture and optimization history
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
