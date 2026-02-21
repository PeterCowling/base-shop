# Octorate Reservations Export and Processing Automation

Fully automated system to export Octorate reservations data and process it into monthly aggregates with ZERO manual steps.

## Quick Start

### Full Pipeline (Export + Process) - Recommended

```bash
cd packages/mcp-server
node octorate-full-pipeline.mjs
```

This runs both export and processing in sequence, updating the CSV files automatically.

### Export Only

```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

### Process Existing Export

```bash
cd packages/mcp-server
node octorate-process-bookings.mjs /path/to/export.xls [output-dir]
```

## What It Does

### octorate-full-pipeline.mjs (Recommended)

1. Runs `octorate-export-final-working.mjs` to download raw reservations
2. Finds the latest downloaded Excel file
3. Runs `octorate-process-bookings.mjs` to process into monthly aggregates
4. Updates `docs/business-os/strategy/BRIK/data/bookings_by_month.csv`
5. Updates `docs/business-os/strategy/BRIK/data/net_value_by_month.csv`

### octorate-export-final-working.mjs

1. Opens browser with saved session (no login required)
2. Navigates to export page
3. Selects "Create time" filter from dropdown
4. Sets date range (last 90 days by default)
5. Clicks "Save as Excel"
6. Downloads file to `.tmp/octorate-downloads/`
7. Reports file details

### octorate-process-bookings.mjs

1. Reads Excel file from Octorate reservations export
2. Parses booking records (Create time, Refer, Room, Total Room columns)
3. Deduplicates by booking reference (Refer) per month
4. Aggregates by create time month
5. Calculates channel attribution (Direct vs OTA based on room name)
6. Outputs two CSV files:
   - `bookings_by_month.csv` - Monthly bookings count, gross value, channel split
   - `net_value_by_month.csv` - Monthly net booking value (net-of-cancellations)

## File Locations

- **Pipeline script:** `octorate-full-pipeline.mjs` (export + process)
- **Export script:** `octorate-export-final-working.mjs`
- **Process script:** `octorate-process-bookings.mjs`
- **Session:** `.secrets/octorate/storage-state.json`
- **Raw downloads:** `.tmp/octorate-downloads/`
- **CSV outputs:** `docs/business-os/strategy/BRIK/data/`
- **Login helper:** `octorate-login-with-code.mjs`
- **MFA helper:** `get-octorate-mfa-code.mjs`

## Session Management

Session is stored in `.secrets/octorate/storage-state.json` and persists across runs.

If session expires:
```bash
# Get MFA code from Gmail
node get-octorate-mfa-code.mjs

# Login with code
node octorate-login-with-code.mjs <code>
```

## Download Infrastructure

Built on restored MCP browser automation system:

### Core Files
- `src/tools/browser/driver.ts` - BrowserDriver interface with download methods
- `src/tools/browser/driver-playwright.ts` - Playwright implementation with download event handling
- `src/tools/browser.ts` - MCP tool definitions

### MCP Tools
- `browser_session_open` - Opens browser with storage state and download directory
- `browser_observe` - Observes page affordances (BIC pattern)
- `browser_act` - Executes actions (click, fill, navigate)
- `browser_get_downloads` - Returns all downloads for session
- `browser_wait_for_download` - Waits for new download with timeout
- `browser_session_close` - Closes browser session

### Download Features
- Automatic download detection via Playwright events
- Timestamped filenames: `YYYY-MM-DDTHH-MM-SS_originalname.ext`
- Download metadata: filename, path, size, mimeType, timestamp
- Configurable download directory
- Session persistence with cookies + localStorage

## Technical Details

### Date Format
Octorate requires **DD/MM/YYYY** (European format), not MM/DD/YYYY.

### BIC Pattern (Browser Interactive Candidate)
Uses accessibility tree to find elements robustly:
- Enumerates interactive affordances (buttons, textboxes, links)
- Each affordance gets stable actionId
- Selectors built from role + accessible name + DOM structure
- More resilient than CSS selectors for JSF/PrimeFaces apps

### Time Filter Selection
The export page has a selectonemenu dropdown that defaults to "Next 3 days arrivals".
Must change it to "Create time" to enable date range selection:

1. Click combobox to open dropdown
2. Find "Create time" in first 10 options (to avoid column selection menu)
3. Select "Create time"
4. Date fields appear
5. Fill dates in DD/MM/YYYY format
6. Click "Save as Excel"

### Known Issues
- Date textboxes have no accessible names (unnamed)
- First unnamed textbox is the dropdown's hidden input (skip it)
- Use textbox indices [1] and [2] for start/end dates
- Modal scope returns ALL menus - must filter to first 10 options

## Customization

### Change Date Range
Edit the script:
```javascript
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 90);  // Change 90 to desired days
```

### Change Download Directory
Pass `downloadDir` parameter:
```javascript
await handleToolCall('browser_session_open', {
  url: OCTORATE_EXPORT,
  downloadDir: '/path/to/custom/dir',
  // ...
});
```

## Output Data

### Raw Excel Export

**Columns:**
- Create time - When booking was created
- Check in - Guest arrival date
- Guest - Guest name
- Refer - Booking reference (used for deduplication)
- Guests - Number of guests
- Nights - Length of stay
- Room - Room/rate plan name (contains "OTA" for OTA bookings)
- Total Room - Booking value (EUR)
- Email - Guest email

### Processed CSV Files

#### bookings_by_month.csv
```csv
month,bookings_count,gross_booking_value,channel_source,notes
2024-02,66,17934.65,Direct:10; OTA:56,observed from export.xls; raw_rows=69; duplicate_refs_removed=3
```

#### net_value_by_month.csv
```csv
month,net_booking_value,method,notes
2024-02,17934.65,observed export marked net-of-cancellations; deduped by Refer per month,observed from export.xls; raw_rows=69; duplicate_refs_removed=3
```

## Success Metrics

**Export:**
- First run: 16.22 KB Excel file with 90 days of reservation data
- Date range: 16/11/2025 to 14/02/2026
- Automation: 100% - zero manual steps

**Processing:**
- Test run: 4332 rows → 4155 unique bookings (177 duplicates removed)
- Date range: 25 months (2024-02 to 2026-02)
- Channel split: 17.1% Direct, 82.9% OTA
- Total value: EUR 1,135,214.32

## Maintenance

If Octorate UI changes:
1. Run with `slowMoMs: 800` to watch browser actions
2. Check console output for affordances list
3. Update selectors in script if needed
4. BIC pattern should handle most changes automatically

## History

- **2026-02-15**: Added processing automation (`octorate-process-bookings.mjs`, `octorate-full-pipeline.mjs`)
- **2026-02-14**: Initial implementation with download automation restored
- Fixed date format from MM/DD/YYYY to DD/MM/YYYY
- Fixed "Create time" selection to use first 10 options only
- Fixed date field indices to skip dropdown's hidden input
- Successfully exported 90 days of reservations

## Related Scripts

- `octorate-calendar-export.mjs` - Calendar/inventory export (Batch 1)
- `octorate-process-bookings.mjs` - Process reservations into monthly aggregates
- `octorate-full-pipeline.mjs` - Full export + process pipeline
- `octorate-debug-page.mjs` - Page inspection helper
- `octorate-find-export.mjs` - Export button finder
