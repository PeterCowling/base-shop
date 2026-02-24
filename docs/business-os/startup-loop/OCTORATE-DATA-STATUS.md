---
Type: Status-Summary
Status: Active
Business: BRIK
Date: 2026-02-14
Owner: Pete
---

# Octorate Data Collection Status — Summary

## Quick Status

| Batch | Data Type | Automation Status | Script Location | Last Run |
|---|---|---|---|---|
| **Batch 1** | Calendar/inventory (price, availability, rooms) | ✅ Automated (new script) | `packages/mcp-server/octorate-calendar-export.mjs` | 2026-02-14 10:15 |
| **Batch 2** | Reservations export (90-day booking data) | ✅ Fully automated | `packages/mcp-server/octorate-export-final-working.mjs` | 2026-02-14 22:11 |

**Note**: Historical booking value data (EUR 28,927.79, 100 bookings) from Feb 12 was obtained via manual export + ad-hoc processing. Monthly refresh requires manual process until automated.

## Batch 1: Calendar/Inventory Operational Data

### What It Provides
- Price matrix by room/date (18 months forward)
- Availability by room/date
- Length of stay requirements
- Real availability (net of blocks)
- Room inventory (IDs, names, capacity)

### Current Process
**Fully automated via Playwright**

```bash
cd packages/mcp-server
node octorate-calendar-export.mjs
```

**Navigation Path**:
1. Calendar → Standard View (`/octobook/user/calendar/index.xhtml`)
2. Click "..." menu button
3. Select "Export calendar to Excel"
4. Set date range (default: 01/03/2025 to 31/10/2026)
5. Click "Save as Excel"
6. Download moves to `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`

### Last Run
- **Date**: 2026-02-14 10:15
- **Output**: `data/octorate/octorate-calendar-2026-02-14.xlsx` (460KB)
- **Data range**: Mar 2025 - Oct 2026 (18 months, 612 date rows)
- **Sheets**: Price, Availability, Length of stay, Real availability

### Automation Status
✅ **Production-ready** (new script created 2026-02-14)
- Script: `packages/mcp-server/octorate-calendar-export.mjs`
- Session management: `.secrets/octorate/storage-state.json`
- MCP tools: `octorate_login_interactive`, `octorate_calendar_check`

## Batch 2: Reservations Export (90-Day Window)

### What It Provides
- Reservation/booking records (90-day window)
- Create time filter
- Room assignments
- Booking status
- Raw export for further processing into booking value/channel attribution

### Current Process
**Fully automated via Playwright**

```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

**Navigation Path**:
1. Direct to: `/octobook/user/reservation/export.xhtml`
2. Select "Create time" filter
3. Set date range (default: last 90 days)
4. Click "Save as Excel"
5. Download moves to `.tmp/octorate-downloads/`

### Last Run
- **Date**: 2026-02-14 22:11
- **Output**: `.tmp/octorate-downloads/2026-02-14T21-11-05_1771103464860.xlsx` (16KB)
- **Data range**: Last 90 days (Nov 16, 2025 - Feb 14, 2026)

### Automation Status
✅ **Production-ready**
- Script: `packages/mcp-server/octorate-export-final-working.mjs`
- Documentation: `packages/mcp-server/OCTORATE_EXPORT_README.md`
- Session management: `.secrets/octorate/storage-state.json`

**Note**: Raw reservation data is now automatically processed into monthly aggregates via `octorate-process-bookings.mjs`.

## Documentation Updates (2026-02-14)

### Created
1. **`docs/business-os/startup-loop/octorate-data-collection-protocol.md`**
   - Comprehensive protocol for both batches
   - Integration points for S0-S10 stages
   - Operational runbook
   - Quality gates and failure recovery

2. **`docs/business-os/startup-loop/OCTORATE-DATA-STATUS.md`** (this file)
   - Quick status summary
   - Gaps and next steps

### Updated
1. **`docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md`**
   - Added automation method section
   - Added usage instructions
   - Added recent successful runs
   - Linked to protocol doc

2. **`docs/business-os/strategy/BRIK/plan.user.md`**
   - Added automation status to operational data baseline
   - Linked to protocol doc
   - Updated timestamp to 2026-02-14

3. **`docs/business-os/startup-loop-workflow.user.md`**
   - Added Octorate data collection to MEASURE-02 inputs
   - Updated BRIK MEASURE-02 gap status
   - Linked to protocol and baseline docs

## Startup Loop Integration

### S0: Readiness Check
- Verify Octorate session validity: `octorate_calendar_check`
- Refresh if expired: `octorate_login_interactive` (requires MFA)

### S1: Intake Packet
- Include most recent calendar/inventory baseline
- Trigger fresh extraction if >7 days old

### S3: 90-Day Forecast Baseline
**Required data:**
- ✅ Batch 1: Historical booking value (trailing 90 days)
- ✅ Batch 2: Calendar/inventory (forward 18 months)

**Validation:**
- Calendar/inventory: <7 days freshness
- Booking value: <30 days freshness

### SELL-01: Channel Strategy
- Use Batch 2 for pricing analysis, occupancy forecasting, rate optimization
- Weekly refresh during SELL-DO loop

### Post-DO: Post-Launch Monitoring
- Weekly: Batch 2 (calendar/inventory)
- Monthly: Batch 1 (booking value)
- Integration with GA4 baseline comparison

## Quick Reference

### Run Batch 1 Export (Calendar - Automated)
```bash
cd packages/mcp-server
node octorate-calendar-export.mjs
```

### Run Batch 2 Export + Processing (Full Pipeline - Automated)
```bash
cd packages/mcp-server
node octorate-full-pipeline.mjs
```

### Run Batch 2 Export Only (Reservations - Automated)
```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

### Process Existing Export
```bash
cd packages/mcp-server
node octorate-process-bookings.mjs /path/to/export.xls
```

### Refresh Session (When Expired)
Use MCP tool: `octorate_login_interactive` (requires MFA)

Or manual fallback:
1. Open https://admin.octorate.com/
2. Login with credentials
3. Complete MFA
4. Session saved to `.secrets/octorate/storage-state.json`

### Process Booking Value Aggregates (Automated)
```bash
# Full pipeline (export + process)
cd packages/mcp-server
node octorate-full-pipeline.mjs

# Or process existing export
node octorate-process-bookings.mjs /path/to/export.xls
```

**What it does**:
1. Reads Excel file from Octorate reservations export
2. Parses booking records (Create time, Refer, Room, Total Room)
3. Deduplicates by booking reference (Refer) per month
4. Aggregates by create time month
5. Calculates channel attribution (Direct vs OTA)
6. Updates CSVs in `docs/business-os/strategy/BRIK/data/`
   - `bookings_by_month.csv`
   - `net_value_by_month.csv`

**Status**: ✅ Production-ready (2026-02-15)
- Script: `packages/mcp-server/octorate-process-bookings.mjs`
- Pipeline: `packages/mcp-server/octorate-full-pipeline.mjs`
- Documentation: `packages/mcp-server/OCTORATE_EXPORT_README.md`

## Related Documentation

- Protocol: `docs/business-os/startup-loop/octorate-data-collection-protocol.md`
- Batch 2 baseline: `docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md`
- Batch 1 baseline: `docs/business-os/strategy/BRIK/2026-02-12-historical-performance.user.md`
- Business plan: `docs/business-os/strategy/BRIK/plan.user.md`
- Startup loop workflow: `docs/business-os/startup-loop-workflow.user.md`
- Automation script: `packages/mcp-server/octorate-export-final-working.mjs`
- README: `packages/mcp-server/OCTORATE_EXPORT_README.md`
