# Business Scorecard Metric Lineage

**TASK-49**: Cross-app business impact scorecard metric lineage documentation

This document defines the explicit data lineage for each scorecard metric, showing which TASK-47 aggregate nodes and events feed each KPI.

## Aggregate Node Dependencies

All scorecard metrics read from **pre-aggregated ownerKpis/{date} nodes** created by TASK-47.

**CRITICAL**: The scorecard NEVER performs raw booking scans. All data comes from daily KPI aggregates.

### Daily KPI Record Schema

```typescript
interface DailyKpiRecord {
  date: string; // YYYY-MM-DD
  guestCount: number;
  readinessCompletionPct: number;
  etaSubmissionPct: number;
  arrivalCodeGenPct: number;
  medianCheckInLagMinutes: number;
  extensionRequestCount: number;
  bagDropRequestCount: number;
  updatedAt: number;
}
```

### Budget Impact

- **7-day scorecard**: 7 Firebase reads (1 per day from ownerKpis/{date})
- **30-day scorecard**: 30 Firebase reads (1 per day from ownerKpis/{date})
- **Budget entry**: `owner_kpi_dashboard_7day` or `owner_kpi_dashboard_30day`

## Scorecard Metrics

### 1. Guest Readiness Completion (avgReadinessPct)

**Target**: 90% (higher is better)

**Data Flow**:
```
Raw Data (TASK-47 input):
  bookings/{bookingId}/occupants/{occupantId}/preArrival/checklistProgress
    → routePlanned (25%)
    → etaConfirmed (20%)
    → cashPrepared (25%)
    → rulesReviewed (15%)
    → locationSaved (15%)

TASK-47 Aggregation:
  1. Compute readiness score for each occupant (0-100)
  2. Average across all occupants for the day
  3. Store in ownerKpis/{date}/readinessCompletionPct

TASK-49 Scorecard:
  1. Read ownerKpis/{date} for date range
  2. Average readinessCompletionPct across days with data
  3. Compare to 90% target
```

**Metric Status**:
- Success: avgReadinessPct >= 90%
- Warning: avgReadinessPct < 90%
- Unknown: hasInsufficientData = true

---

### 2. ETA Submission Rate (avgEtaSubmissionPct)

**Target**: 90% (higher is better)

**Data Flow**:
```
Raw Data (TASK-47 input):
  bookings/{bookingId}/occupants/{occupantId}/preArrival/etaConfirmedAt

TASK-47 Aggregation:
  1. Count occupants with etaConfirmedAt != null and > 0
  2. Compute percentage: (occupantsWithEta / totalOccupants) * 100
  3. Store in ownerKpis/{date}/etaSubmissionPct

TASK-49 Scorecard:
  1. Read ownerKpis/{date} for date range
  2. Average etaSubmissionPct across days with data
  3. Compare to 90% target
```

**Metric Status**:
- Success: avgEtaSubmissionPct >= 90%
- Warning: avgEtaSubmissionPct < 90%
- Unknown: hasInsufficientData = true

---

### 3. Check-in Code Generation (avgCodeGenerationPct)

**Target**: 100% (higher is better)

**Data Flow**:
```
Raw Data (TASK-47 input):
  bookings/{bookingId}/checkInCode

TASK-47 Aggregation:
  1. Count bookings with checkInCode != null
  2. Compute percentage: (bookingsWithCode / totalBookings) * 100
  3. Store in ownerKpis/{date}/arrivalCodeGenPct

TASK-49 Scorecard:
  1. Read ownerKpis/{date} for date range
  2. Average arrivalCodeGenPct across days with data
  3. Compare to 100% target
```

**Metric Status**:
- Success: avgCodeGenerationPct >= 100%
- Warning: avgCodeGenerationPct < 100%
- Unknown: hasInsufficientData = true

---

### 4. Check-in Lag Time (avgCheckInLagMinutes)

**Target**: 15 minutes (lower is better)

**Data Flow**:
```
Raw Data (TASK-47 input):
  bookings/{bookingId}/checkInDate (expected check-in time: 15:00)
  bookings/{bookingId}/checkInAt (actual check-in timestamp)

TASK-47 Aggregation:
  1. For each booking with checkInAt:
     - Compute lag: (checkInAt - expectedCheckInTime) in minutes
     - Only count positive lags (early check-ins excluded)
  2. Compute median lag across all bookings
  3. Store in ownerKpis/{date}/medianCheckInLagMinutes

TASK-49 Scorecard:
  1. Read ownerKpis/{date} for date range
  2. Average medianCheckInLagMinutes across days with data
  3. Compare to 15-minute target
```

**Metric Status**:
- Success: avgCheckInLagMinutes <= 15
- Warning: avgCheckInLagMinutes > 15
- Unknown: hasInsufficientData = true

---

### 5. Support Load per Guest (supportLoadPerGuest)

**Target**: 0.2 requests per guest (lower is better)

**Data Flow**:
```
Raw Data (TASK-47 input):
  bookings/{bookingId}/occupants/{occupantId}/extensionRequests
  bookings/{bookingId}/occupants/{occupantId}/bagDropRequests

TASK-47 Aggregation:
  1. Count all extension requests across occupants
  2. Count all bag drop requests across occupants
  3. Store in ownerKpis/{date}/extensionRequestCount
  4. Store in ownerKpis/{date}/bagDropRequestCount

TASK-49 Scorecard:
  1. Read ownerKpis/{date} for date range
  2. Sum extensionRequestCount + bagDropRequestCount across all days
  3. Sum guestCount across all days
  4. Compute: totalSupportRequests / totalGuests
  5. Compare to 0.2 target
```

**Metric Status**:
- Success: supportLoadPerGuest <= 0.2
- Warning: supportLoadPerGuest > 0.2
- Unknown: hasInsufficientData = true

---

## Data Freshness

- **KPI Aggregates**: Updated daily by scheduled job (TASK-47)
- **Scorecard**: Reflects data as of most recent aggregation run
- **Lag**: Up to 24 hours between guest action and scorecard reflection

## Insufficient Data Threshold

- **Minimum Days**: 3 days with guestCount > 0
- **Behavior**: When daysWithData < 3:
  - hasInsufficientData = true
  - All metric statuses = "unknown"
  - Operating review actions = empty

## Cross-App Dependencies

### Guest Portal → Reception → Owner Scorecard

1. **Guest completes checklist** (Prime Portal)
   - Updates: `preArrival/checklistProgress`
   - Feeds: Guest Readiness metric

2. **Guest submits ETA** (Prime Portal)
   - Updates: `preArrival/etaConfirmedAt`
   - Feeds: ETA Submission metric

3. **System generates check-in code** (Prime Backend)
   - Updates: `checkInCode`
   - Feeds: Code Generation metric

4. **Guest checks in** (Prime Portal / Reception)
   - Updates: `checkInAt`
   - Feeds: Check-in Lag metric

5. **Guest requests extension/bag drop** (Prime Portal)
   - Updates: `extensionRequests`, `bagDropRequests`
   - Feeds: Support Load metric

### Reception → Owner Scorecard

All guest interactions and system-generated data flow through TASK-47 aggregation before reaching the scorecard.

**No direct reads** from reception data to scorecard - always via ownerKpis/{date} aggregate nodes.

---

## Operating Review Template

When metrics miss targets, the scorecard generates operating review actions with:

- **Metric**: Name of the metric
- **Status**: "warning" (needs attention)
- **Current Value**: Actual measured value
- **Target Value**: Expected target value
- **Suggested Action**: AI-generated improvement recommendation
- **Owner**: "Operations Manager" (default)
- **Expected Impact**: High/Medium/Low based on gap size

### Example Action

```typescript
{
  metric: "Guest Readiness Completion",
  status: "warning",
  currentValue: "75%",
  targetValue: "90%",
  suggestedAction: "Improve pre-arrival communication to increase checklist completion by 15%. Consider SMS reminders or in-app notifications.",
  owner: "Operations Manager",
  expectedImpact: "Medium - Significant opportunity for improvement"
}
```

---

## Test Coverage

### Unit Tests (businessScorecard.test.ts)

- TC-01: Scorecard computes metrics accurately from TASK-47 aggregate fixtures
- TC-02: Missing data windows return safe defaults and explicit flags
- Target threshold evaluation for all metrics

### Integration Tests (scorecard-page.test.tsx)

- TC-03: Scorecard UI renders KPI status states and target thresholds
- Success/warning status display
- Insufficient data handling
- Operating review template generation
- Data lineage documentation display

---

## Related Documentation

- **TASK-47**: `apps/prime/src/lib/owner/kpiAggregator.ts` - KPI aggregation logic
- **TASK-48**: `apps/prime/src/app/owner/page.tsx` - Owner dashboard (separate from scorecard)
- **Budget Baselines**: `apps/prime/src/lib/firebase/budgetBaselines.ts` - Firebase read budgets
- **Testing Policy**: `docs/testing-policy.md` - Test-driven development approach
