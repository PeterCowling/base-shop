---
Type: Reference
Status: Active
---
# Reconciliation Calibration Note — TASK-08

**Status:** Blocked — GA4 handoff events still zero (TASK-05A not yet deployed to production)
**Last run:** 2026-02-17
**Window attempted:** 2026-02-10..2026-02-17

---

## Investigation Summary

TASK-08 INVESTIGATE was attempted on 2026-02-17. The blocking condition identified in the
fact-find (GA4 handoff events = 0) persists. This note documents what was confirmed
and what is required to complete the calibration.

---

## Octorate data (non-zero ✓)

Octorate export for `2026-02-10..2026-02-17` is available and processed.

| Day | Raw rows | Deduped bookings | Deduped value (EUR) |
|---|---|---|---|
| 2026-02-10 | 12 | 8 | 2,354.74 |
| 2026-02-11 | 6 | 6 | 1,407.15 |
| 2026-02-12 | 2 | 2 | 570.13 |
| 2026-02-13 | 4 | 3 | 1,152.65 |
| 2026-02-14 | 6 | 6 | 1,591.48 |
| 2026-02-15 | 1 | 1 | 262.35 |
| 2026-02-16 | 3 | 3 | 862.71 |
| 2026-02-17 | 2 | 2 | 481.78 |
| **Total** | **36** | **31** | **8,682.99** |

---

## GA4 data (zero ✗)

GA4 Data API query on `properties/474488225` for `2026-02-10..2026-02-17`:

```
handoff_to_engine:    0
begin_checkout:       0
search_availability:  0
page_view:          266  ← confirms property is receiving data
click_check_availability: 0
```

Realtime query (2026-02-17, last 30 min): all booking-adjacent events = 0.

**Conclusion:** GA4 is functional (page_view = 266) but no booking-intent events have reached
the property. This is consistent with the pre-TASK-05A state where native instrumentation
was not yet deployed.

---

## Root cause: TASK-05A not yet deployed

TASK-05A (native `handoff_to_engine` emission) was committed to `dev` branch on 2026-02-17.
It has not yet been deployed to the production Cloudflare Worker. Without a production deploy,
the instrumentation code does not execute for real visitors.

**GA4 admin create rules** (added 2026-02-17) would convert `begin_checkout` →
`handoff_to_engine`, but since `begin_checkout` is also 0, the rules produce no events.

---

## Blocking condition

| Side | Status | Needed |
|---|---|---|
| Octorate bookings | ✓ Non-zero (31 in last 7 days) | None |
| GA4 handoff events | ✗ Zero | Deploy TASK-05A to production; wait for ≥1 booking session |

---

## Recommended next window

After TASK-05A production deployment, run:

```bash
# Adjust dates to cover ≥7 days post-deploy
pnpm exec tsx scripts/src/brikette/ga4-run-report.ts \
  --window <deploy-date>..<deploy-date+7> \
  --events handoff_to_engine,begin_checkout,search_availability,page_view

# Then download Octorate export for the same window and run:
pnpm exec node packages/mcp-server/octorate-process-bookings.mjs \
  --input .tmp/reconciliation-<window>/octorate-export.csv \
  --output .tmp/reconciliation-<window>/
```

Target window: first 7 days with `handoff_to_engine` count > 0 in GA4 Data API.

---

## What completion looks like

For TASK-08 to be marked Complete:

1. GA4 `handoff_to_engine` (or `begin_checkout` via create rule) count > 0 for same window as Octorate export.
2. `aggregate_explained_share = GA4_handoff_count / Octorate_deduped_bookings` computed and reported.
3. Dominant mismatch causes identified (e.g. no-JS, attribution gap, session fragmentation).
4. Recommended threshold adjustments documented.

---

## Evidence log

| Date | Event |
|---|---|
| 2026-02-17 | GA4 standard report run: `handoff_to_engine` = 0, `page_view` = 266 for 2026-02-10..2026-02-17 |
| 2026-02-17 | GA4 realtime query: all booking events = 0 |
| 2026-02-17 | Octorate data confirmed: 31 bookings, €8,682.99 value |
| 2026-02-17 | Root cause confirmed: TASK-05A not yet deployed to production |
