<!-- docs/commerce/inventory-monitoring-guide.md -->

Type: Guide
Status: Active
Domain: Commerce / Inventory / Observability
Last-reviewed: 2026-01-12

# Inventory System Monitoring Guide

**Purpose:** Operational guide for monitoring the centralized inventory system in production

## Overview

The inventory system emits structured metrics for all critical operations. These metrics are logged via the platform logger and can be aggregated by your observability stack (Datadog, New Relic, CloudWatch, etc.).

---

## Key Metrics

### Hold Lifecycle Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `inventory_hold_created` | Counter | `shopId`, `status=success` | New hold successfully created |
| `inventory_hold_items` | Gauge | `shopId` | Number of items in a hold |
| `inventory_hold_committed` | Counter | `shopId`, `status=success` | Hold committed (payment succeeded) |
| `inventory_hold_released` | Counter | `shopId`, `status=success` | Hold released (payment failed/cancelled) |
| `inventory_hold_expired` | Counter | `shopId`, `status=success` | Holds expired by reaper (batch count) |

### Failure Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `inventory_hold_insufficient` | Counter | `shopId`, `status=failure` | Hold creation failed - insufficient stock |
| `inventory_hold_busy` | Counter | `shopId`, `status=failure` | Hold creation failed - database busy/locked |
| `inventory_hold_error` | Counter | `shopId`, `status=failure` | Hold creation failed - other error |

### Checkout Integration

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `checkout_inventory_validation` | Counter | `shopId`, `status` | Inventory validation at checkout |
| `checkout_rejected_stock` | Counter | `shopId`, `sku` | Checkout rejected due to insufficient stock |

---

## Recommended Dashboards

### 1. Hold Lifecycle Overview

**Widgets:**
- Line chart: `inventory_hold_created` over time (by shop)
- Line chart: `inventory_hold_committed` + `inventory_hold_released` + `inventory_hold_expired` (stacked)
- Gauge: Hold commit rate = `committed / (committed + released + expired)` (target: >80%)
- Gauge: Hold expiry rate = `expired / created` (target: <20%)

### 2. System Health

**Widgets:**
- Counter: Total holds created (last 24h)
- Counter: Failures (insufficient + busy + error) (last 24h)
- Line chart: `inventory_hold_busy` (spikes indicate contention)
- Line chart: `inventory_hold_error` (investigate spikes)
- Table: Top SKUs by `checkout_rejected_stock` (may need restocking)

### 3. Per-Shop Metrics

**Widgets:**
- Table: Holds created by shop (last 7d)
- Table: Commit rate by shop
- Table: Expiry rate by shop (high expiry = long checkout times or abandon)
- Table: Insufficient stock events by shop

---

## Alerts

### Critical Alerts (PagerDuty / Ops)

#### High Commit Failure Rate
- **Condition:** `inventory_hold_error` > 5 in 5 minutes
- **Severity:** Critical
- **Action:** Check database connectivity, inspect error logs
- **Runbook:** [Inventory Hold Failures](#runbook-hold-failures)

#### Database Lock Contention
- **Condition:** `inventory_hold_busy` > 10 in 5 minutes
- **Severity:** Critical
- **Action:** Check database load, inspect slow queries
- **Runbook:** [Database Contention](#runbook-database-contention)

### Warning Alerts (Slack / Email)

#### High Expiry Rate
- **Condition:** Hold expiry rate > 30% over 1 hour
- **Severity:** Warning
- **Action:** Investigate long checkout times, high cart abandonment
- **Possible Causes:**
  - Stripe checkout session taking too long
  - Users abandoning carts frequently
  - Hold TTL too short

#### High Rejection Rate
- **Condition:** `checkout_rejected_stock` > 20 in 1 hour for a single SKU
- **Severity:** Warning
- **Action:** Check stock levels, consider restocking
- **Possible Causes:**
  - Popular item with low stock
  - Concurrent purchases exceeding availability
  - Inventory data stale or incorrect

#### Low Commit Rate
- **Condition:** Hold commit rate < 60% over 6 hours
- **Severity:** Warning
- **Action:** Investigate payment failures, checkout flow issues
- **Possible Causes:**
  - Payment processor issues
  - High cart abandonment
  - Webhook delivery failures

---

## Runbooks

### Runbook: Hold Failures

**Symptoms:**
- `inventory_hold_error` spike
- Checkout failures reported by users
- 500 errors in logs

**Diagnosis:**
```bash
# Check recent error logs
grep "inventory_hold_error" /var/log/app.log | tail -50

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check for missing tables
psql $DATABASE_URL -c "\dt inventory*"
```

**Resolution:**
1. If database unreachable: Verify DATABASE_URL, check DB server status
2. If tables missing: Run Prisma migration (`prisma migrate deploy`)
3. If other errors: Check error details, may need code fix

**Temporary Mitigation:**
```bash
# Emergency bypass (use with caution)
export SKIP_INVENTORY_VALIDATION=1
```

### Runbook: Database Contention

**Symptoms:**
- `inventory_hold_busy` spike
- Slow checkout performance
- 409 errors with "Inventory busy" message

**Diagnosis:**
```bash
# Check active locks
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE NOT granted"

# Check long-running queries
psql $DATABASE_URL -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC"
```

**Resolution:**
1. Scale database (increase CPU/memory)
2. Optimize queries (add missing indexes)
3. Reduce hold TTL to decrease lock duration
4. Increase lock timeout: `INVENTORY_LOCK_TIMEOUT_MS=10000`

### Runbook: High Expiry Rate

**Symptoms:**
- `inventory_hold_expired` consistently high
- Low commit rate
- Users reporting cart items becoming unavailable

**Diagnosis:**
```bash
# Check average checkout duration
# Review Stripe checkout session analytics
# Check cart abandonment rate

# Query expired holds
psql $DATABASE_URL -c "SELECT COUNT(*), AVG(EXTRACT(EPOCH FROM (expiredAt - createdAt))) AS avg_lifetime_sec FROM \"InventoryHold\" WHERE status = 'expired' AND expiredAt > NOW() - INTERVAL '24 hours'"
```

**Resolution:**
1. If avg lifetime < 300s: Consider increasing TTL
2. If payment issues: Investigate Stripe integration
3. If abandonment: Optimize checkout UX, reduce friction
4. Increase TTL: `INVENTORY_HOLD_TTL_SECONDS=1800` (30 min)

---

## Log Queries

### Aggregating Metrics

Most observability platforms can aggregate structured logs into metrics.

**Datadog Example:**
```
# Create count metric from logs
source:app @metric:inventory_hold_created
measure: count
group by: shopId, status
```

**CloudWatch Insights Example:**
```
fields @timestamp, metric, shopId, status, value
| filter metric = "inventory_hold_created"
| stats sum(value) by shopId, bin(5m)
```

**New Relic NRQL Example:**
```sql
SELECT count(*) FROM Log
WHERE metric = 'inventory_hold_created'
FACET shopId
TIMESERIES 5 minutes
```

---

## Performance Targets

### Latency (p95)
- Hold creation: < 200ms
- Hold commit: < 100ms
- Hold release: < 100ms
- Validation: < 100ms
- Reaper (per shop): < 500ms

### Success Rates
- Hold creation success: > 98%
- Hold commit success: > 99%
- Validation success: > 99.5%

### Operational
- Hold commit rate: > 80%
- Hold expiry rate: < 20%
- Reaper execution: Every 5 minutes (no failures)

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | First Action |
|---------|--------------|--------------|
| High `inventory_hold_error` | Database down | Check DB connectivity |
| High `inventory_hold_busy` | Database contention | Scale DB or optimize queries |
| High `inventory_hold_expired` | Long checkout times | Investigate payment flow |
| High `inventory_hold_insufficient` | Stock issues | Check inventory levels |
| Low commit rate | Payment failures | Check Stripe status |
| Checkout rejections | Popular SKU low stock | Restock or adjust pricing |

---

## Integration Examples

### Datadog Dashboard JSON

See: `docs/observability/datadog-inventory-dashboard.json`

### Grafana Dashboard JSON

See: `docs/observability/grafana-inventory-dashboard.json`

### CloudWatch Dashboard Template

See: `docs/observability/cloudwatch-inventory-dashboard.yaml`

---

## References

- [Inventory Production Readiness](./inventory-production-readiness.md)
- [Metrics Implementation](../../packages/platform-core/src/utils/metrics.ts)
- [Hold Lifecycle](../../packages/platform-core/src/inventoryHolds.ts)

---

**Last Updated:** 2026-01-12
**Contact:** Platform Team | #inventory-system
