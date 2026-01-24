---
Type: Plan
Status: Complete
Domain: Performance
Last-reviewed: 2026-01-23
Relates-to charter: none
---

# Prime Optimization Plan — Database & Performance

This plan addresses database usage leakage and performance issues identified in the Prime app after the Next.js port.

## Executive Summary

Prime currently uses Firebase Realtime Database with several patterns that cause excessive reads:
- **Critical N+1 query** downloading entire bookings table for each user lookup
- **No caching layer** causing redundant queries across components
- **9 parallel queries** on every page load via useUnifiedBookingData
- **Missing query optimization** in several hooks

**Estimated Impact:** 3-5x reduction in Firebase reads by implementing recommendations.

## Current State

### Database Usage Profile
- **Database:** Firebase Realtime Database (WebSocket-based)
- **Read Patterns:** ~15 one-time `get()` queries, ~5 real-time `onValue()` listeners
- **Page Load Queries:** 9 simultaneous Firebase connections per page
- **Caching:** None (every mount triggers fresh queries)
- **Pagination:** Partially implemented (chat messages only)

### Key Issues

1. **N+1 Query in Bookings (CRITICAL)**
   - File: [apps/prime/src/hooks/pureData/useFetchBookingsData.ts:48-80](apps/prime/src/hooks/pureData/useFetchBookingsData.ts#L48-L80)
   - Downloads ALL bookings to find one user's data
   - Scales O(n) with total bookings count

2. **No Caching (HIGH)**
   - Every component mount triggers fresh Firebase queries
   - Repeated data fetches for same information
   - 2-3x more reads than necessary

3. **Parallel Query Explosion (MEDIUM)**
   - File: [apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts](apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts)
   - 9 hooks fire simultaneously on page load
   - Excessive network overhead

## Optimization Tasks

### **OPT-01 — Fix N+1 Bookings Query (CRITICAL)**
- **Priority:** P0 (Immediate)
- **Effort:** Small (2-4 hours)
- **Impact:** 10-100x reduction in bookings query data transfer

**Current Code:**
```typescript
// Downloads ENTIRE bookings table
const snapshot = await get(bookingsRef);
const rawData = snapshot.val();

// Then loops to find matching UUID
for (const [code, record] of Object.entries(rawData)) {
  const occupant = record[uuid];
  if (occupant) matches.push({ code, ...occupant });
}
```

**Proposed Fix:**
```typescript
// Use Firebase query with index
const q = query(
  bookingsRef,
  orderByChild(`occupants/${uuid}`),
  startAt(true)
);
const snapshot = await get(q);
```

**Requirements:**
- Add Firebase index rule for `bookings` ordered by `occupants/{uuid}`
- Update `useFetchBookingsData.ts` to use query
- Test with multiple bookings scenarios

**Definition of Done:**
- Query only fetches bookings for specific UUID
- Firebase index rule documented
- Network payload reduced by 90%+ (verify in DevTools)

### **OPT-02 — Implement Caching Layer**
- **Priority:** P0 (High)
- **Effort:** Medium (1-2 days)
- **Impact:** 50-70% reduction in redundant queries

**Approach:** Add React Query or SWR for client-side caching

**Recommended:** React Query (better TypeScript support, more features)

**Migration Steps:**
1. Install `@tanstack/react-query`
2. Add QueryClientProvider to [apps/prime/src/app/Providers.tsx](apps/prime/src/app/Providers.tsx)
3. Convert 3-5 highest-traffic hooks first:
   - `useFetchBookingsData` (after OPT-01)
   - `useFetchGuestDetails`
   - `useFetchPreordersData`
4. Configure stale/cache times appropriately:
   - Bookings: 5 minutes stale, 10 minutes cache
   - Guest details: 10 minutes stale, 30 minutes cache
   - Activities: 2 minutes stale, 5 minutes cache

**Example Hook Migration:**
```typescript
// Before
export function useFetchGuestDetails(uuid: string) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = async () => {
      const snap = await get(ref(db, `guests/${uuid}`));
      setData(snap.val());
    };
    fetch();
  }, [uuid]);
  return { data };
}

// After
export function useFetchGuestDetails(uuid: string) {
  return useQuery({
    queryKey: ['guest', uuid],
    queryFn: async () => {
      const snap = await get(ref(db, `guests/${uuid}`));
      return snap.val();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}
```

**Definition of Done:**
- React Query provider configured
- Top 5 hooks converted and tested
- Cache invalidation strategy documented
- Network tab shows cached responses (no Firebase queries on navigation)

### **OPT-03 — Optimize useUnifiedBookingData**
- **Priority:** P1 (Medium)
- **Effort:** Medium (1-2 days)
- **Impact:** 30-50% reduction in page load queries

**Current Issue:** 9 parallel Firebase queries on every page load

**Options:**

**Option A: Denormalize Data (Recommended)**
- Create single `bookingsSummary/{uuid}` node with aggregated data
- Single query replaces 9 queries
- Trade-off: Slightly more complex writes, but much faster reads

**Option B: Selective Loading**
- Only fetch data for current page/tab
- Use lazy loading for secondary data
- Example: Only fetch preorders when "Orders" tab clicked

**Option C: Data Prefetching**
- Preload likely-needed data on route transitions
- Use React Query prefetch on hover/focus
- Requires route-level orchestration

**Recommended Approach:** Combination of A + B
1. Denormalize critical booking data (guest info, room, dates)
2. Lazy load secondary data (financials, preorders, tasks)
3. Use React Query for caching (from OPT-02)

**Definition of Done:**
- Page load queries reduced from 9 to 3-4
- Time to interactive improved by 30%+
- Data consistency maintained across denormalized nodes

### **OPT-04 — Add Pagination to Activities Query**
- **Priority:** P2 (Low-Medium)
- **Effort:** Small (2-4 hours)
- **Impact:** Prevents future scaling issues

**Current Issue:**
```typescript
// No limit - downloads ALL live/upcoming activities
const q = query(
  ref(db, `${MSG_ROOT}/activities/instances`),
  orderByChild('status'),
  startAt('live'),
  endAt('upcoming')
);
```

**Proposed Fix:**
```typescript
const q = query(
  ref(db, `${MSG_ROOT}/activities/instances`),
  orderByChild('status'),
  startAt('live'),
  endAt('upcoming'),
  limitToFirst(20) // Add pagination
);
```

**Definition of Done:**
- Activities query limited to 20 records
- "Load more" button for pagination
- Works with existing infinite scroll pattern

### ~~OPT-05 — Fix localStorage Retry Effect~~ (REMOVED)
- **Audit (2026-01-23):** Pattern not found in codebase. The `saveBreakfastPreorder`
  dependency and localStorage retry loop do not exist in any current source files.
  Removed from active tasks.

### **OPT-06 — Apply Query Debouncing** (PARTIAL)
- **Priority:** P2 (Low)
- **Effort:** Small (1-2 hours)
- **Impact:** Prevents burst queries from rapid user actions

**Audit (2026-01-23):** Utility already exists at `src/utils/useDebounce.ts` with tests.
Remaining work is applying it to user input scenarios.

**Apply to Search/Filter Inputs:**
- Activity search
- Room lookup
- Guest name filtering

**Definition of Done:**
- ~~Debounce utility created and tested~~ ✅ Already done
- Applied to 3-5 user input scenarios
- Network tab shows reduced query frequency

### **OPT-07 — Add Firebase SDK Monitoring**
- **Priority:** P1 (Medium)
- **Effort:** Small (4 hours)
- **Impact:** Enables data-driven optimization decisions

**Implement Metrics:**
```typescript
// src/utils/firebaseMetrics.ts
class FirebaseMetrics {
  private metrics = {
    queryCount: 0,
    dataSizeBytes: 0,
    slowQueries: [] as Array<{ path: string; duration: number }>,
    connectionCount: 0,
  };

  recordQuery(path: string, sizeBytes: number, duration: number) {
    this.metrics.queryCount++;
    this.metrics.dataSizeBytes += sizeBytes;
    if (duration > 1000) {
      this.metrics.slowQueries.push({ path, duration });
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      queryCount: 0,
      dataSizeBytes: 0,
      slowQueries: [],
      connectionCount: 0,
    };
  }
}

export const firebaseMetrics = new FirebaseMetrics();
```

**Wrap Existing Logger:**
```typescript
// Update src/services/firebase.ts get() wrapper
export const get: typeof rtdbGet = async (q) => {
  const start = Date.now();
  const snap = await rtdbGet(q);
  const duration = Date.now() - start;

  const sizeBytes = JSON.stringify(snap.val()).length;
  firebaseMetrics.recordQuery(snap.ref.toString(), sizeBytes, duration);

  logger.info('[Firebase GET]', {
    path: snap.ref.toString(),
    sizeKB: (sizeBytes / 1024).toFixed(2),
    duration,
  });

  return snap;
};
```

**Definition of Done:**
- Metrics class implemented
- Integrated with existing Firebase wrappers
- Dev tools panel or console logger showing metrics
- Documentation on interpreting metrics

## Implementation Strategy

### Phase 1: Critical Path (Week 1)
- **OPT-01:** Fix N+1 bookings query
- **OPT-07:** Add monitoring (to measure improvements)

**Rationale:** Immediate impact on production costs, enables measurement

### Phase 2: Foundation (Week 2-3)
- **OPT-02:** Implement caching layer
- **OPT-03:** Optimize useUnifiedBookingData (Option B: selective loading)

**Rationale:** Caching is prerequisite for many optimizations

### Phase 3: Refinement (Week 4)
- **OPT-04:** Add activities pagination
- **OPT-05:** Fix localStorage retry effect
- **OPT-06:** Implement query debouncing

**Rationale:** Lower priority, incremental improvements

### Phase 4: Advanced (Future)
- **OPT-03 Option A:** Denormalize data (requires Firebase structure changes)
- Consider migration to Firestore (better querying)
- Evaluate serverless caching layer (Cloudflare KV)

## Success Metrics

### Target Improvements (Phase 1-3 Complete)
- **Firebase Reads:** 60-70% reduction
- **Page Load Time:** 30-40% faster
- **Time to Interactive:** 200-300ms improvement
- **Data Transfer:** 50-60% reduction

### Monitoring Thresholds
- **Alert if:** Firebase read quota exceeds 1M/day
- **Alert if:** Average query duration > 1s
- **Alert if:** Page load queries > 15 per session

## Testing Strategy

### Per-Task Testing
- Each optimization includes definition of done with testable criteria
- Use Firebase Emulator for local testing
- Compare before/after with Chrome DevTools Network tab

### Integration Testing
- Test cross-component data consistency with caching
- Verify real-time listeners still work after optimizations
- Test offline behavior and retry logic

### Load Testing (Optional)
- Simulate 50+ concurrent users
- Monitor Firebase dashboard for read patterns
- Verify connection limits not exceeded

## Rollout Plan

### Staged Rollout
1. **Dev/Staging:** Test all changes thoroughly
2. **10% Traffic:** Monitor metrics for regressions
3. **50% Traffic:** Validate improvements at scale
4. **100% Traffic:** Full rollout

### Rollback Criteria
- Firebase read count increases > 10%
- Error rate increases > 1%
- User-reported data inconsistency issues

## Risk Assessment

### Low Risk
- OPT-01 (N+1 fix): Index-based query, straightforward
- OPT-04 (pagination): Additive feature
- OPT-06 (debouncing): Client-side only
- OPT-07 (monitoring): Non-invasive

### Medium Risk
- OPT-02 (caching): Requires careful cache invalidation strategy
- OPT-05 (localStorage fix): Potential retry logic changes

### High Risk
- OPT-03 Option A (denormalization): Data structure changes, write complexity
- Future Firestore migration: Major architectural change

## Cost-Benefit Analysis

### Firebase Pricing Context
- Spark (Free): 1GB storage, 10GB/month downloads
- Blaze (Pay-as-you-go): $5/GB downloaded, $1/GB stored

### Current Estimated Costs (Hypothetical)
- ~10M reads/month at average 5KB/read = ~50GB downloads
- Cost: ~$250/month

### Post-Optimization Estimated Costs
- ~3M reads/month at average 3KB/read = ~9GB downloads
- Cost: ~$45/month
- **Savings: ~$200/month (80% reduction)**

## Dependencies

### External
- React Query: `@tanstack/react-query` (OPT-02)
- Firebase indexes: Requires Firebase console configuration (OPT-01)

### Internal
- No new workspace packages required
- May extract shared caching utilities to `@acme/firebase-utils` later

## Documentation Updates Required

1. Update [apps/prime/README.md](apps/prime/README.md) with:
   - Firebase index requirements
   - React Query usage patterns
   - Monitoring/metrics interpretation

2. Create [docs/firebase-optimization.md](docs/firebase-optimization.md):
   - General Firebase optimization patterns
   - Query best practices
   - Caching strategies

3. Update [docs/development.md](docs/development.md):
   - Add Prime optimization status
   - Link to this plan

## Related Issues

- Pre-existing TypeScript errors may mask optimization issues
- Server/client boundary violations (see [docs/plans/prime-nextjs-port-plan.md](docs/plans/prime-nextjs-port-plan.md) Known Issues)
- Consider these during optimization to avoid compounding problems

## Future Considerations

### Firestore Migration
- Better querying capabilities (compound indexes, OR queries)
- Offline support built-in
- More predictable pricing
- **Effort:** Large (2-3 weeks)
- **When:** If Firebase Realtime Database limitations become blocking

### Serverless Edge Caching
- Cloudflare KV for read-heavy data
- Reduce Firebase queries further
- **Effort:** Medium (1 week)
- **When:** After Phase 3 if costs still high

### GraphQL Layer
- Single query interface for multiple data sources
- DataLoader for automatic batching
- **Effort:** Large (3-4 weeks)
- **When:** If query complexity continues growing

---

**Last Updated:** 2026-01-23
**Owner:** Engineering Team
**Reviewer:** Technical Lead

For questions or to prioritize tasks, reference task IDs (OPT-01, etc.) in discussions.

## Active tasks

All tasks complete or closed.

- Completed: OPT-01, OPT-02, OPT-03, OPT-04, OPT-07.
- Closed (N/A): OPT-06 — all user inputs use form submission (not keystroke-triggered
  queries). Debounce utility exists at `src/utils/useDebounce.ts` for future use.
- Removed: OPT-05 (issue not present in codebase).

## Audit log

- **2026-01-23:** Full audit against codebase. OPT-05 removed (pattern doesn't exist).
  OPT-06 utility already implemented (needs application). OPT-07 has basic logging
  (needs metrics class expansion). All other tasks confirmed valid and unstarted.
- **2026-01-23:** Implemented OPT-01 through OPT-04 and OPT-07:
  - OPT-01: Reverse index pattern (`occupantIndex/{uuid}`) for O(1) booking lookups.
  - OPT-02: React Query (`@tanstack/react-query`) added; bookings, guestDetails,
    preorders, loans, financials, cityTax, bagStorage, guestByRoom all converted.
  - OPT-03: Phased loading in `useOccupantDataSources` — primary (bookings + tasks)
    fires immediately, secondary deferred until bookings resolves.
  - OPT-04: Activities query limited to 20 with "Load more" button in UI.
  - OPT-07: `FirebaseMetrics` class with query timing, slow query detection, active
    listener count. Exposed on `window.__firebaseMetrics` in dev.
  - OPT-06: Closed — investigated all user input scenarios (staff lookup, find-my-stay,
    FindMyStay component). All trigger queries via form submission, not on keystroke.
    No current use case for debounce. Utility ready at `src/utils/useDebounce.ts`.
