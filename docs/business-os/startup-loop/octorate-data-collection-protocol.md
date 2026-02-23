---
Type: Startup-Loop-Protocol
Status: Active
Business: BRIK
Created: 2026-02-14
Owner: Pete
Stage: S0-S3 (Baseline Collection)
---

# Octorate Data Collection Protocol — Startup Loop Integration

## Purpose

Establish repeatable data collection from Octorate to support BRIK startup loop baseline measurement, forecasting validation, and weekly decision cadence.

## Data Collection Schedule

| Data Type | Frequency | Trigger | Script | Output |
|---|---|---|---|---|
| **Historical booking value** | One-time + monthly refresh | S0/S3 baseline establishment | Manual export + processing (script TBD) | `docs/business-os/strategy/BRIK/data/net_value_by_month.csv` |
| **Calendar/inventory** | Weekly | S3-DO operational monitoring | `packages/mcp-server/octorate-export-final-working.mjs` | `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx` |

## Batch 1: Historical Booking Value Data

### What It Provides
- Monthly net booking value (EUR)
- Booking counts by month
- Channel attribution (Direct vs OTA)
- Trailing 90-day baseline for forecasting

### Current State
**Status**: ✅ Fully automated and production-ready (2026-02-15)

**Scripts**:
- Export: `packages/mcp-server/octorate-export-final-working.mjs`
- Processing: `packages/mcp-server/octorate-process-bookings.mjs`
- Full pipeline: `packages/mcp-server/octorate-full-pipeline.mjs`

**Data Location**:
- Raw export: `.tmp/octorate-downloads/`
- Processed CSVs: `docs/business-os/strategy/BRIK/data/bookings_by_month.csv`
- Processed CSVs: `docs/business-os/strategy/BRIK/data/net_value_by_month.csv`

**Documented In**:
- `packages/mcp-server/OCTORATE_EXPORT_README.md`
- `docs/business-os/strategy/BRIK/2026-02-12-historical-performance.user.md`
- Baseline values promoted to `docs/business-os/strategy/BRIK/plan.user.md` (lines 38-47)

### Extraction Method (Automated)
```bash
# Full pipeline (export + process)
cd packages/mcp-server
node octorate-full-pipeline.mjs
```

**Process**:
1. **Export** (via `octorate-export-final-working.mjs`):
   - Opens browser with saved session
   - Navigates to export page
   - Selects "Create time" filter
   - Sets date range (last 90 days by default)
   - Downloads Excel to `.tmp/octorate-downloads/`

2. **Processing** (via `octorate-process-bookings.mjs`):
   - Reads Excel file (columns: Create time, Refer, Room, Total Room)
   - Parses booking records
   - Deduplicates by booking reference (Refer) per month
   - Aggregates by create time month (YYYY-MM)
   - Calculates channel attribution (Direct vs OTA from room name)
   - Outputs CSV files to `docs/business-os/strategy/BRIK/data/`

**Status**: ✅ All gaps closed (2026-02-15)
- ✅ Committed extraction automation
- ✅ Committed processing script
- ✅ Automated download
- ✅ Repeatable processing method

## Batch 2: Calendar/Inventory Operational Data

### What It Provides
- Price matrix by room/date (next 18 months)
- Availability by room/date
- Length of stay requirements
- Real availability (net of blocks)
- Room inventory (IDs, names, capacity)

### Current State
**Status**: ✅ Fully automated and production-ready

**Script**: `packages/mcp-server/octorate-export-final-working.mjs`

**Last Successful Run**: 2026-02-14 10:15 (460KB export, Mar 2025 - Oct 2026)

**Data Location**:
- `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`
- `data/octorate/calendar-export-summary.json`
- `data/octorate/room-inventory.json`

**Documented In**:
- `docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md`
- Baseline values promoted to `docs/business-os/strategy/BRIK/plan.user.md` (lines 43-47)

### Extraction Method (Automated)
```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

**Process**:
1. Opens browser with saved session (`.secrets/octorate/storage-state.json`)
2. Navigates to: `https://admin.octorate.com/octobook/user/reservation/export.xhtml`
3. Selects "Create time" filter from dropdown
4. Sets date range (default: last 90 days; customizable in script)
5. Clicks "Save as Excel"
6. Downloads to: `.tmp/octorate-downloads/` with timestamped filename
7. Copies to: `data/octorate/` with canonical date-stamped name

**Dependencies**:
- MCP browser automation tools (built and available)
- Chrome browser installed
- Valid Octorate session in `.secrets/octorate/storage-state.json`

**Session Management**:
- Session expires after inactivity (typically 24-48 hours)
- Refresh via MCP tool: `octorate_login_interactive` (requires MFA completion)
- Validate session: `octorate_calendar_check`

## Startup Loop Integration Points

### S0: Readiness Check
- **Gate**: Verify Octorate session is valid
- **Action**: Run `octorate_calendar_check` MCP tool
- **If expired**: Run `octorate_login_interactive` (user completes MFA)

### S1: Intake Packet Assembly
- **Include**: Last available calendar/inventory baseline
- **Source**: Most recent `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`
- **Fallback**: If >7 days old, trigger fresh extraction

### S3: 90-Day Forecast Baseline
- **Required Data**:
  - ✅ Historical booking value (trailing 90 days) — from Batch 1
  - ✅ Calendar/inventory (forward 18 months) — from Batch 2
- **Extraction Timing**: Run both before entering S3 workflow
- **Validation**: Confirm data freshness (<7 days for calendar, <30 days for bookings)

### S6: Channel Strategy
- **Use Case**: Pricing analysis, occupancy forecasting, rate optimization
- **Data Source**: Batch 2 (price matrix, availability)
- **Refresh**: Weekly during active S6-DO loop

### Post-DO: Post-Launch Monitoring
- **Weekly Refresh**: Calendar/inventory data (Batch 2)
- **Monthly Refresh**: Booking value data (Batch 1)
- **Integration**: Feed into GA4 baseline comparison (sessions vs bookings vs occupancy)

## Operational Runbook

### Weekly Calendar Export (Automated)
```bash
# 1. Validate session (optional - will fail loudly if expired)
cd packages/mcp-server
pnpm build  # if MCP tools changed

# Use MCP tools via mcp-cli or Claude Desktop
# octorate_calendar_check

# 2. Run export
node octorate-export-final-working.mjs

# 3. Verify output
ls -lh .tmp/octorate-downloads/
ls -lh ../../data/octorate/

# 4. Process/analyze (optional)
# Scripts TBD for occupancy analysis, ADR calculation, etc.
```

### Session Refresh (When Expired)
```bash
# Via MCP tools (interactive)
# octorate_login_interactive

# Manual fallback:
# 1. Open https://admin.octorate.com/
# 2. Login with OCTORATE_USERNAME / OCTORATE_PASSWORD
# 3. Complete email MFA
# 4. Session will be saved to .secrets/octorate/storage-state.json
```

### Monthly Booking Value Refresh (Manual)
1. Login to Octorate admin: https://admin.octorate.com/
2. Navigate: Reservations → List → Statistics
3. Configure filters:
   - Time filter: "Create time"
   - Date range: Last 90 days (or full history for annual refresh)
   - Channels: All
   - Status: Confirmed (exclude cancelled)
4. Export: "Download to Excel"
5. Save to: `/Users/petercowling/Downloads/export_<timestamp>.xls`
6. Process with ad-hoc script (or manually update CSVs)
7. Commit updated CSVs to: `docs/business-os/strategy/BRIK/data/`
8. Update baseline docs: `2026-02-12-historical-performance.user.md`

## Quality Gates

### Batch 1 (Booking Value)
- ✅ Date range covers trailing 90 days minimum
- ✅ No duplicate booking references
- ✅ Monthly aggregates match raw export row counts
- ✅ Channel split (Direct vs OTA) is non-zero
- ✅ Net value is net-of-cancellations (operator confirmed)

### Batch 2 (Calendar/Inventory)
- ✅ Date range covers forward 18 months minimum
- ✅ All 4 sheets present: Price, Availability, Length of stay, Real availability
- ✅ Room count matches known inventory (11 rooms for BRIK hostel)
- ✅ No missing dates (612 rows = 18 months daily)
- ✅ Price values are numeric and non-zero for in-season dates

## Failure Modes & Recovery

| Failure | Symptom | Recovery |
|---|---|---|
| **Session expired** | `octorate-export-final-working.mjs` fails with "redirected to login" | Run `octorate_login_interactive` MCP tool, complete MFA |
| **Element selectors changed** | Script times out waiting for affordances | Update selectors in script; use `browser_observe` to inspect new page structure |
| **Download times out** | No file appears in `.tmp/octorate-downloads/` after 60s | Increase timeout, check Octorate server status, verify date range is not too large |
| **Excel format changed** | Processing fails with parse errors | Inspect new Excel structure, update column mappings, add schema version detection |
| **No bookings in date range** | Empty export or zero revenue | Verify date range is correct (DD/MM/YYYY format), check Octorate UI manually |

## Future Enhancements

1. **Automate Batch 1 extraction** (booking value data)
   - Extend `octorate-export-final-working.mjs` with reservations mode
   - Add Excel → CSV transformation script
   - Commit to repo for repeatability

2. **Add data validation layer**
   - Contract tests for Excel structure
   - Anomaly detection (e.g., zero bookings, price spikes)
   - Automated baseline freshness checks

3. **Integrate with analytics pipeline**
   - Join calendar occupancy with GA4 booking events
   - Calculate ADR (average daily rate) and RevPAR automatically
   - Feed into startup loop dashboard

4. **Schedule automated runs**
   - Weekly calendar export via cron/GitHub Actions
   - Monthly booking value refresh
   - Slack/email notifications on success/failure

## References

- Calendar automation: `packages/mcp-server/octorate-export-final-working.mjs`
- MCP tools: `packages/mcp-server/src/tools/octorate.ts`
- Documentation: `packages/mcp-server/OCTORATE_EXPORT_README.md`
- Baseline docs: `docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md`
- Historical baseline: `docs/business-os/strategy/BRIK/2026-02-12-historical-performance.user.md`
- Business plan: `docs/business-os/strategy/BRIK/plan.user.md`
