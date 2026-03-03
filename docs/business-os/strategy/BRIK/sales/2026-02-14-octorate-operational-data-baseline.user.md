---
Type: Data-Baseline
Status: Active
Business: BRIK
Date: 2026-02-14
Owner: Pete
Relates-to: docs/business-os/strategy/BRIK/plan.user.md
Review-trigger: After each completed build cycle touching this document.
---

# BRIK Octorate Operational Data Baseline (2026-02-14)

## 1) Objective

Document the second batch of Octorate data received 2026-02-14: operational calendar and inventory data that complements the historical booking performance baseline already documented in the startup loop.

## 2) Data Received

### A) Calendar Export (Excel)

**File**: `data/octorate/octorate-calendar-2026-02-14.xlsx` (460KB)

**Sheets**:
- **Price**: 612 rows × 41 columns
- **Availability**: 612 rows × 41 columns
- **Length of stay**: 612 rows × 41 columns
- **Real availability**: 612 rows × 41 columns

**Date Range**: March 1, 2025 → October 31, 2026 (18 months forward visibility)

**Column Structure**:
- First column: DATE
- Remaining 40 columns: Room/rate plan IDs (e.g., 434403, 433886, etc.)

### B) Room Inventory (JSON)

**File**: `data/octorate/room-inventory.json`

**Property**: Hostel Brikette Positano (Property ID: 45111)

**Total Rooms**: 11

**Room Breakdown**:

| Room ID | Name | Room Number | Type |
|---|---|---|---|
| 433940 | OTA, Refundable, Room 3 | 3 | Numbered |
| 434397 | OTA, Refundable, Room 4 | 4 | Numbered |
| 434401 | OTA, Refundable, Room 5 | 5 | Numbered |
| 434402 | OTA, Refundable, Room 6 | 6 | Numbered |
| 614929 | OTA, Refundable, Room 8 | 8 | Numbered |
| 434403 | OTA, Refundable, Room 9 | 9 | Numbered |
| 434404 | OTA, Refundable, Room 10 | 10 | Numbered |
| 434405 | OTA, Refundable, Room 11 | 11 | Numbered |
| 434406 | OTA, Refundable, Room 12 | 12 | Numbered |
| 434398 | OTA, Refundable, 2022-7 | — | Year-named |
| 614932 | OTA, Refundable, 2025-14 | — | Year-named |

**Observations**:
- All rooms are "OTA, Refundable" rate plan
- Numbered rooms: 3-6, 8-12 (Room 7 is absent)
- Two rooms use year-based naming: "2022-7" and "2025-14" (likely dorm beds or special inventory)
- Guest capacity data not included in this extract (needs room configuration page scrape)

### C) Calendar Export Summary (JSON)

**File**: `data/octorate/calendar-export-summary.json`

Metadata document describing the structure of the Excel export. Confirms 4 sheets × 612 rows, lists all 40 room/rate plan column headers.

## 3) Use Cases

### Revenue Forecasting
- Price sheet enables ADR analysis by date range and seasonality patterns
- Availability sheet shows current booking coverage and open inventory
- Length of stay requirements inform conversion modeling

### Inventory Planning
- 11-room inventory baseline documented for capacity planning
- Missing room numbers (e.g., Room 7) indicate potential operational or historical gaps
- Year-named rooms may require investigation for classification

### Direct Booking System Integration
- Room IDs map to Octorate API identifiers for confirm-link and availability checks
- Rate plan IDs enable non-refundable vs flexible pricing display
- Real availability sheet distinguishes sellable inventory from blocked dates

### Apartment Revenue Architecture
- Current extract is hostel-only; apartment room IDs will need to be added to Octorate
- When apartment is added, calendar export will include both hostel + apartment inventory
- Pricing structure (non-refundable vs flex) already established in hostel rooms

## 4) Complementary Data (Already Documented)

**Historical booking performance** (documented in startup loop):
- Trailing 90-day net booking value: EUR 28,927.79
- Trailing 90-day bookings: 100
- Direct booking share: 18%
- Window: 2025-11-16 to 2026-02-14

**Location**: `docs/business-os/strategy/BRIK/plan.user.md` lines 38-42

## 5) Data Extraction Method

**Automation Status**: ✅ Fully automated via Playwright browser automation (production-ready)

**Script**: `packages/mcp-server/octorate-export-final-working.mjs`

**Export Type**: Calendar/inventory operational data (Price, Availability, Length of stay, Real availability)

**Process**:
1. Opens browser with saved session (`.secrets/octorate/storage-state.json`)
2. Navigates to: `https://admin.octorate.com/octobook/user/reservation/export.xhtml`
3. Selects "Create time" filter from dropdown
4. Sets date range (default: last 90 days; customizable)
5. Clicks "Save as Excel"
6. Downloads to: `.tmp/octorate-downloads/` with timestamped filename
7. Processes with ExcelJS to extract room inventory and calendar structure

**Documentation**: `packages/mcp-server/OCTORATE_EXPORT_README.md`

**Session Management**:
- Session cookie stored in `.secrets/octorate/storage-state.json`
- Session expires after inactivity - use MCP tool `octorate_login_interactive` to refresh
- MCP tools available: `octorate_login_interactive`, `octorate_calendar_check`

**Usage**:
```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

**Recent Successful Runs** (2026-02-14):
- 10:15 - Calendar export (460KB) → processed to `data/octorate/octorate-calendar-2026-02-14.xlsx`
- 10:16 - Room inventory extracted → `data/octorate/room-inventory.json`
- 20:53 - Test run (3.3KB)
- 22:11 - Test run (16KB)

## 6) Next Actions

1. ✅ Document operational data baseline (this document)
2. Add apartment to Octorate with rate plan IDs (nr + flex)
3. Re-run calendar export after apartment is added to capture full property inventory
4. Extract guest capacity data from room configuration page (not in current export)
5. Establish weekly refresh cadence for operational data alongside GA4 metrics

## 7) Data Lineage

| Data Type | Source | Location | Date | Status |
|---|---|---|---|---|
| Historical bookings (90-day) | Octorate reservations export | Startup loop baseline | 2026-02-13 | Documented |
| Operational calendar (18-month) | Octorate calendar export | `data/octorate/octorate-calendar-2026-02-14.xlsx` | 2026-02-14 | Documented (this doc) |
| Room inventory | Octorate calendar page scrape | `data/octorate/room-inventory.json` | 2026-02-14 | Documented (this doc) |
| Room capacity | Octorate room config page | Not extracted | Pending | Open |
| Apartment inventory | Octorate (after setup) | Not yet added | Pending | Open |

## 8) Integration Points

### Business Plan
- Operational baseline now recorded in `docs/business-os/strategy/BRIK/plan.user.md` (lines 43-47)

### Apartment Revenue Architecture
- Room inventory establishes pattern for apartment rate plan structure
- Pricing seasonality informs apartment pricing calendar setup
- Reference: `docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md`

### Reception App
- Room IDs enable live availability integration
- Real availability sheet supports till booking flow

### Analytics
- Occupancy analysis requires joining calendar availability with GA4 booking events
- ADR calculation requires joining price sheet with completed bookings
