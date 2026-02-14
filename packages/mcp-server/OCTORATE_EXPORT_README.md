# Octorate Reservations Export Automation

Fully automated system to export Octorate reservations data to Excel with ZERO manual steps.

## Quick Start

```bash
cd packages/mcp-server
node octorate-export-final-working.mjs
```

## What It Does

1. Opens browser with saved session (no login required)
2. Navigates to export page
3. Selects "Create time" filter from dropdown
4. Sets date range (last 90 days by default)
5. Clicks "Save as Excel"
6. Downloads file to `.tmp/octorate-downloads/`
7. Reports file details

## File Locations

- **Script:** `octorate-export-final-working.mjs`
- **Session:** `.secrets/octorate/storage-state.json`
- **Downloads:** `.tmp/octorate-downloads/`
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

## Success Metrics

**First run:** 16.22 KB Excel file with 90 days of reservation data
**Date range:** 16/11/2025 to 14/02/2026
**Automation:** 100% - zero manual steps

## Maintenance

If Octorate UI changes:
1. Run with `slowMoMs: 800` to watch browser actions
2. Check console output for affordances list
3. Update selectors in script if needed
4. BIC pattern should handle most changes automatically

## History

- **2026-02-14**: Initial implementation with download automation restored
- Fixed date format from MM/DD/YYYY to DD/MM/YYYY
- Fixed "Create time" selection to use first 10 options only
- Fixed date field indices to skip dropdown's hidden input
- Successfully exported 90 days of reservations

## Related Scripts

- `octorate-debug-page.mjs` - Page inspection helper
- `octorate-find-export.mjs` - Export button finder
