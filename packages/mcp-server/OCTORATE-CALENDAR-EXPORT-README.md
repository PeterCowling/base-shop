
# Octorate Calendar Export Automation (Batch 1)

Fully automated calendar/inventory data export from Octorate with ZERO manual steps.

## Quick Start

```bash
cd packages/mcp-server
node octorate-calendar-export.mjs
```

## What It Does

1. Opens browser with saved session (no login required)
2. Navigates to Calendar → Standard View (using JavaScript)
3. Clicks "..." menu button and "Export calendar to Excel" (using JavaScript)
4. Sets date range (default: 01/03/2025 to 31/10/2026)
5. Clicks "Save as Excel"
6. Downloads file and moves to `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`

**Note**: Uses JavaScript evaluation for navigation to avoid BIC selector issues. Direct navigation to export URL doesn't work (redirects to dashboard).

## File Locations

- **Script:** `octorate-calendar-export.mjs`
- **Session:** `.secrets/octorate/storage-state.json`
- **Output:** `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`
- **Login helper:** Use MCP tool `octorate_login_interactive`
- **Session validator:** Use MCP tool `octorate_calendar_check`

## Data Sheets Exported

The Excel file contains 4 sheets:

1. **Price**: Daily pricing by room/date (612 rows × 40 room columns)
2. **Availability**: Availability status by room/date
3. **Length of stay**: Minimum stay requirements by room/date
4. **Real availability**: Net availability (accounting for blocks) by room/date

## Session Management

Session is stored in `.secrets/octorate/storage-state.json` and persists across runs.

If session expires:
```bash
# Use MCP tool (interactive)
# octorate_login_interactive

# Or manual fallback:
# 1. Open https://admin.octorate.com/
# 2. Login with OCTORATE_USERNAME / OCTORATE_PASSWORD
# 3. Complete email MFA
# 4. Session saved automatically
```

## Customization

### Change Date Range

Set environment variables:
```bash
export OCTORATE_START_DATE="01/01/2025"
export OCTORATE_END_DATE="31/12/2026"
node octorate-calendar-export.mjs
```

Or edit the script defaults:
```javascript
const DEFAULT_START_DATE = "01/03/2025";
const DEFAULT_END_DATE = "31/10/2026";
```

**Important**: Dates must be in DD/MM/YYYY format (European).

## Success Metrics

**Production runs (2026-02-14)**:
- 10:15 - Calendar export: 460KB (Mar 2025 - Oct 2026, 18 months)
- Automation: 100% - zero manual steps
- Data sheets: 4 × 612 rows × 40 columns

## Navigation Path (UI Reference)

The script automates this exact UI path using JavaScript evaluation:

1. **Start**: Dashboard → Click "Calendar" menu → Click "Standard View"

2. **Open export menu**: Click `<button id="formDays:j_idt573_button">...</button>`

3. **Select export**: Click link with text "Export calendar to Excel"

4. **Date fields**:
   ```html
   <input id="j_idt412:j_idt424_input" value="01/03/2025" />
   <input id="j_idt412:dateEnd_input" value="31/10/2026" />
   ```

5. **Export button**:
   ```html
   <button class="ui-button">
     <span class="fa fa-file-excel-o"></span>
     <span>Save as Excel</span>
   </button>
   ```

**Why JavaScript?** BIC selectors were matching wrong elements (sidebar toggles instead of menu buttons). JavaScript evaluation provides more reliable element selection.

## Troubleshooting

### Session expired
**Error**: Script fails with "redirected to login"

**Fix**: Run `octorate_login_interactive` MCP tool and complete MFA

### Element selectors changed
**Error**: Script times out waiting for affordances

**Fix**: Use `browser_observe` to inspect new page structure, update selectors in script

### Download times out
**Error**: No file appears after 60s

**Fix**:
- Increase timeout in script
- Check Octorate server status
- Verify date range is not too large (max ~2 years)

### Empty or invalid data
**Error**: Excel file is empty or has wrong format

**Fix**:
- Verify date range is correct (DD/MM/YYYY)
- Check Octorate UI manually to confirm data exists
- Inspect downloaded file structure

## Related Scripts

- **Reservations export**: `octorate-export-final-working.mjs` (Batch 2)
- **Session management**: Use MCP tools in `src/tools/octorate.ts`
- **Browser automation**: MCP browser tools in `src/tools/browser.ts`

## History

- **2026-02-14**: Initial implementation with BIC pattern automation
- Successfully exported 460KB calendar file with 18 months of data
- Date range: Mar 2025 - Oct 2026 (612 days × 40 rooms)

## Integration

This export is **Batch 1** in the BRIK startup loop data collection protocol.

See: `docs/business-os/startup-loop/octorate-data-collection-protocol.md`

Used for:
- S3 forecasting (pricing analysis, occupancy patterns)
- S6 channel strategy (rate optimization)
- S9 post-launch monitoring (weekly refresh)
