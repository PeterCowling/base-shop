---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Data | Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Feature-Slug: octorate-reservations-extraction
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/octorate-reservations-extraction/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: (to be assigned)
---

# Octorate Reservations Data Extraction Fact-Find Brief

## Scope

### Summary

Build automated extraction of historical booking/reservation data from Octorate admin panel to fill critical data gaps in the revenue optimization pipeline. Extract reservations statistics report (Excel format) containing booking dates, revenue, channel attribution, and transform into structured time-series data for forecasting validation and revenue impact measurement.

### Goals

- **Automate reservations export**: Build Playwright automation to extract reservations statistics from Octorate admin panel
- **Validate data completeness**: Verify exported data contains all required fields (booking dates, revenue, channels, room assignments)
- **Transform to structured format**: Convert Excel export to JSONL time-series for integration with analytics infrastructure
- **Enable forecasting validation**: Provide historical actual booking/occupancy data for backtesting Holt-Winters forecasts
- **Enable revenue measurement**: Provide historical revenue data for measuring optimization impact

### Non-goals

- Real-time booking data sync (batch extraction is acceptable)
- Integration beyond Octorate (focus on Octorate only)
- UI for manual data export (automation-only)
- Historical data migration beyond what's available in Octorate (work with available date range)

### Constraints & Assumptions

**Constraints:**
- Must use browser automation (Playwright) - no official Octorate API for reservations data
- Requires authenticated session with MFA handling (Gmail integration)
- Must respect Octorate server resources (human-like delays, no rapid-fire requests)
- Excel export format must be parsed reliably (handle format variations)
- Session cookies may expire - need session validation and re-authentication

**Assumptions:**
- Octorate statistics export contains historical booking data (dates, revenue, channels)
- Export format is stable enough for reliable parsing
- Historical data goes back at least 12 months (enough for YoY analysis)
- Login session from calendar export is still valid (or can be refreshed)
- Reservations page structure is accessible with current session

---

## Evidence Audit (Current State)

### Entry Points

**Octorate Login & Session Management**:
- `/Users/petercowling/base-shop/packages/mcp-server/login-octorate.mjs` — Interactive login script
  - Opens browser for manual login + MFA
  - Saves session to `.secrets/octorate/storage-state.json`
  - Session cookie: `octobooksessionid`
  - **Status**: ✅ Working (login completed successfully)

**Reservations Export Script** (In progress):
- `/Users/petercowling/base-shop/packages/mcp-server/export-octorate-reservations.mjs` — Automated reservations export
  - Target URL: `https://admin.octorate.com/octobook/user/reservation/list.xhtml`
  - **Status**: ⚠️ Failing at Step 4 (element selector timeout)
  - **Issue**: Can't find `p-select[formcontrolname="type"]` element (10-second timeout)

**Debug Script**:
- `/Users/petercowling/base-shop/packages/mcp-server/debug-reservations-page.mjs` — Page structure inspector
  - **Status**: ❌ Failed to save HTML (`.tmp` directory missing)
  - **Intent**: Capture actual page structure to fix selectors

**Calendar Export (Reference Implementation)**:
- `/Users/petercowling/base-shop/packages/mcp-server/export-via-navigation.mjs` — Working calendar export
  - Successfully navigates Octorate UI
  - Handles dynamic JavaScript rendering with appropriate waits
  - Downloads Excel file reliably
  - **Pattern to follow**: Navigate via UI menus, wait for JS rendering, use JavaScript evaluation for viewport-blocked elements

### Key Modules / Files

**Session Storage**:
- `.secrets/octorate/storage-state.json` — Playwright session state
  - Contains `octobooksessionid` cookie
  - Domain: `admin.octorate.com`
  - Expires: -1 (session cookie)
  - Evidence: File exists, login script completed successfully

**Automation Infrastructure** (from calendar export experience):
- Playwright-core browser automation
- Chrome executable path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Human-like delays: `slowMo: 1000ms`, `sleep()` functions (1-5 seconds)
- Download handling: `acceptDownloads: true`, `page.waitForEvent('download')`
- File saving: Copy from Playwright temp dir to `data/octorate/`

### Patterns & Conventions Observed

**Octorate UI Patterns** (from calendar export experience):
1. **Redirect behavior**: Direct URL access may redirect to dashboard - must navigate via menus
2. **JavaScript rendering delays**: Angular app requires 3-10 second waits after page load for elements to appear
3. **Dynamic element IDs**: IDs like `pn_id_10` are generated and may change between sessions
4. **Form control patterns**: Angular uses `formcontrolname` attributes for binding (e.g., `formcontrolname="type"`)
5. **PrimeNG components**: UI uses PrimeNG library (p-select, p-datepicker, p-treeselect, p-overlay)
6. **Viewport issues**: Some buttons require JavaScript evaluation to click: `.evaluate(el => el.click())`

Evidence: `export-via-navigation.mjs:48-63`, `export-octorate-reservations.mjs:88-92`

**Excel Processing Patterns**:
- ExcelJS library for parsing (`exceljs@4.4.0` in package.json)
- Workbook reading: `workbook.xlsx.readFile(path)`
- Sheet iteration and cell reading
- JSON summary generation
- Evidence: `analyze-calendar-export.mjs:15-124`

**JSONL Time-Series Pattern** (from analytics infrastructure):
- Newline-delimited JSON for event streams
- Append-only, one record per line
- Stored in `data/<shop>/analytics.jsonl`
- Repository pattern for reading: `listEvents()`, `readAggregates()`
- Evidence: `packages/platform-core/src/repositories/analytics.json.server.ts`

### Data & Contracts

**Expected Reservations Data Structure** (to be validated):

**Excel Export Format** (unknown until first successful export):
- Sheets: TBD (statistics report structure unknown)
- Columns: Expected to contain:
  - Booking/reservation ID
  - Guest name (may need anonymization)
  - Check-in date
  - Check-out date
  - Room/rate plan
  - Channel (OTA name, direct booking, etc.)
  - Price/revenue (actual paid amount)
  - Booking status (confirmed, cancelled, no-show)
  - Booking date/create time

**Target JSONL Format** (for integration with analytics):
```jsonl
{"date":"2025-03-15","bookingId":"12345","checkIn":"2025-06-01","checkOut":"2025-06-05","roomId":"434398","roomName":"Room 10","channel":"Booking.com","revenue":450.00,"status":"confirmed","bookedAt":"2025-03-15T14:32:00Z"}
{"date":"2025-03-16","bookingId":"12346","checkIn":"2025-06-10","checkOut":"2025-06-12","roomId":"434404","roomName":"Room 11","channel":"Direct","revenue":180.00,"status":"confirmed","bookedAt":"2025-03-16T09:15:00Z"}
```

**Storage Path**:
- Raw Excel: `data/octorate/octorate-reservations-YYYY-MM-DD.xlsx`
- Transformed JSONL: `data/octorate/reservations/YYYY-MM-DD.jsonl`
- Summary metadata: `data/octorate/reservations-summary.json`

### Dependency & Impact Map

**Upstream Dependencies**:
- **Octorate platform**: Reservations list page and statistics export must remain accessible
- **Session validity**: Stored session must be active (or re-authentication via Gmail MFA)
- **Playwright**: Browser automation library
- **ExcelJS**: Excel parsing library
- **Gmail API**: For MFA code retrieval (if session expired)

**Downstream Dependents**:
- **Revenue optimization pipeline** (primary consumer):
  - Forecasting validation (backtest Holt-Winters against actual occupancy)
  - Revenue impact measurement (baseline for optimization experiments)
  - Channel attribution analysis (OTA vs. direct bookings)
- **Startup loop metrics** (potential consumer):
  - Historical booking rate trends
  - Channel performance baselines

**Blast Radius**:
- **Low risk**: Net-new automation, no existing code depends on it
- **Medium risk**: If session handling fails, may need manual re-login intervention
- **Low risk**: Excel parsing failures would only affect new data extraction (historical data unaffected)

### Test Landscape

#### Test Infrastructure

**No formal tests exist yet** for Octorate automation scripts. Scripts are validated manually by:
1. Running script
2. Checking downloaded file exists
3. Verifying file structure visually

**Testing Strategy** (to be implemented):
- **Contract tests**: Validate Excel structure matches expected schema
- **Integration tests**: End-to-end export flow with mock Octorate (or recorded session)
- **Manual validation**: Visual inspection of exported data for accuracy

#### Coverage Gaps (Planning Inputs)

**Untested paths**:
- Login script (`login-octorate.mjs`) - no automated tests
- Calendar export (`export-via-navigation.mjs`) - no automated tests
- Reservations export (`export-octorate-reservations.mjs`) - no automated tests
- Excel parsing (`analyze-calendar-export.mjs`) - no automated tests

**Testability Assessment**:
- **Hard to test**: Browser automation requires running Chromium, external service (Octorate), valid credentials
- **Easy to test**: Excel parsing logic can use fixture files
- **Easy to test**: Data transformation (Excel → JSONL) can use property-based tests

**Test seams needed**:
- Excel structure contract test (validate expected sheets, columns, data types)
- JSONL transformation invariant tests (all dates present, no nulls, monotonic booking dates)
- Session validation test (detect expired sessions before starting export)

#### Recommended Test Approach

**Contract tests for**:
- Excel export structure (expected sheets, columns, date formats)
- JSONL output format (required fields, data types, date formats)
- Session validity (check cookie expiration before export)

**Property-based tests for**:
- Transformation invariants: all booking dates in valid range, revenue always positive, channel never null
- Date consistency: check-in always before check-out, booking date before check-in

**Manual tests for** (initially):
- Full export flow (login → navigate → export → download → verify)
- Data accuracy (spot-check exported bookings against Octorate UI)

### Recent Git History (Targeted)

Recent commits related to Octorate automation:

```
a667b107c4 feat(mcp-server): add octorate interactive tools
- Added Octorate MCP tools for calendar export
- Implemented Gmail MFA automation
- Session storage pattern established
```

**Implications**:
- Octorate automation infrastructure is actively developed
- MFA automation pattern exists (can be reused for reservations export)
- Session storage pattern is proven (can be reused)

No conflicts expected with reservations extraction work.

---

## External Research

**Not needed currently**: Standard browser automation patterns with Playwright. Excel parsing with ExcelJS is well-documented. No external APIs beyond Octorate UI.

**If needed later**: PrimeNG component documentation (for understanding Angular component selectors if current approach fails).

---

## Questions

### Resolved

**Q1: Can we reuse the existing Octorate session from calendar export?**
- A: Yes, session storage is saved to `.secrets/octorate/storage-state.json` and can be reused across scripts
- Evidence: Login script completed, storage state file exists with valid cookie

**Q2: What automation patterns should we follow?**
- A: Follow calendar export patterns: UI navigation (not direct URLs), 3-10 second waits for JS rendering, JavaScript evaluation for viewport-blocked elements
- Evidence: `export-via-navigation.mjs` (working implementation)

**Q3: How should we store extracted reservation data?**
- A: Follow existing analytics pattern: raw Excel in `data/octorate/`, transformed JSONL in `data/octorate/reservations/`, use repository pattern for reading
- Evidence: `packages/platform-core/src/repositories/analytics.json.server.ts`

### Open (User Input Needed)

**Q4: What is the actual structure of the reservations statistics export?**
- **Why it matters**: Need to know what sheets/columns exist to design transformation logic and validate data completeness
- **Decision impacted**: Excel parsing logic, JSONL schema design, data validation rules
- **Decision owner**: Pete (can be discovered by successful export or manual inspection)
- **How to resolve**:
  1. Fix element selectors in export script (identify correct selectors from actual page)
  2. Run successful export once
  3. Analyze Excel structure to document schema
- **Blocking**: Yes - cannot design transformation logic without knowing source structure

**Q5: Are we currently on the reservations page or redirected to MFA/login?**
- **Why it matters**: Export script reaches the reservations URL but can't find expected elements - could be session expired or page structure different
- **Decision impacted**: Whether we need to re-authenticate or just fix selectors
- **Decision owner**: Pete (requires manual inspection or debug script success)
- **How to resolve**:
  1. Open browser with saved session manually
  2. Check if we land on reservations page or MFA screen
  3. If MFA: complete MFA and save new session
  4. If reservations page: inspect actual element structure
- **Blocking**: Yes - cannot fix export script without knowing current state

**Q6: What is the historical date range available in Octorate reservations?**
- **Why it matters**: Need to know how far back we can extract data (affects YoY analysis feasibility)
- **Decision impacted**: Date range selection in export script, backtesting strategy for forecasting validation
- **Decision owner**: Pete (can be discovered after first successful export or from Octorate UI)
- **Default assumption**: At least 12 months of history available (Jan 2024 - present)
- **Risk if wrong**: May have insufficient data for YoY seasonal analysis

**Q7: Does the statistics export include cancelled bookings separately, or only confirmed?**
- **Why it matters**: Need to understand occupancy vs. cancellations for accurate forecasting
- **Decision impacted**: Data filtering logic, occupancy calculation, cancellation rate analysis
- **Decision owner**: Pete (can be discovered after first successful export)
- **Default assumption**: Export includes status field (confirmed/cancelled/no-show), can filter in transformation
- **Risk if wrong**: May overcount or undercount actual occupancy if cancellations not tracked

---

## Confidence Inputs (for /lp-plan)

**Implementation**: 60%
- **Why**:
  - ✅ Session management pattern proven (login script works)
  - ✅ Browser automation pattern proven (calendar export works)
  - ✅ Excel parsing infrastructure exists (ExcelJS)
  - ❌ Element selectors failing (don't match actual page structure)
  - ❌ Unknown Excel export structure (haven't seen successful export yet)
- **What's missing**:
  - Correct element selectors for reservations page
  - Excel export structure schema
  - Session validation before export attempt
- **What would raise to ≥80%**:
  - Complete one successful manual export to see Excel structure
  - Inspect actual page HTML to identify correct selectors
  - Add session validation check before export
- **What would raise to ≥90%**:
  - Implement and test full pipeline (export → parse → transform → validate)
  - Add contract tests for Excel structure validation
  - Add retry logic with exponential backoff for element waits

**Approach**: 75%
- **Why**:
  - ✅ Following proven patterns (calendar export, analytics JSONL storage)
  - ✅ Using established tools (Playwright, ExcelJS)
  - ⚠️ Assuming PrimeNG components are accessible with standard selectors (may need custom handling)
- **What's missing**:
  - Validation that approach works for reservations page (different UI than calendar)
  - Confirmation that statistics export contains all required data
- **What would raise to ≥80%**:
  - Document exact page navigation flow (dashboard → menu → submenu path)
  - Identify all required filter configurations (date range, channels, status, rooms)
- **What would raise to ≥90%**:
  - Build page object model for reservations page (reusable selectors)
  - Add health checks for page state before attempting interactions
  - Document fallback strategies for common failure modes

**Impact**: 80%
- **Why**:
  - ✅ Net-new automation, no existing dependencies
  - ✅ Isolated from production systems (read-only export)
  - ✅ Failure only affects new data extraction (no data loss risk)
  - ⚠️ May require manual intervention if session expires during export
- **What's missing**:
  - Unknown operational impact of repeated exports on Octorate server (rate limiting risk)
  - Unknown session duration (how often re-authentication needed)
- **What would raise to ≥90%**:
  - Add monitoring for export success/failure rates
  - Implement circuit breaker for repeated failures (stop after 3 consecutive failures)
  - Document manual fallback procedure (how to export manually if automation fails)

**Delivery-Readiness**: 50%
- **Why**:
  - ✅ Clear execution owner (Pete)
  - ✅ Target storage location identified (`data/octorate/`)
  - ❌ Export script not working yet (element selector failures)
  - ❌ Unknown Excel structure (can't design transformation until first export succeeds)
  - ❌ No scheduling infrastructure (manual execution only)
- **What's missing**:
  - Working export script (fix element selectors)
  - Excel structure documentation
  - Transformation logic (Excel → JSONL)
  - Data validation rules
  - Scheduling/automation trigger (manual vs. cron vs. on-demand)
- **What would raise to ≥80%**:
  - Complete first successful export
  - Document Excel structure schema
  - Implement and test transformation script
  - Define quality gates (what makes an export "valid"?)
- **What would raise to ≥90%**:
  - Implement scheduling (daily/weekly automated runs)
  - Add alerting for export failures
  - Document operational runbook (how to diagnose and fix common issues)
  - Build validation dashboard (show last successful export, data quality metrics)

**Testability**: 65%
- **Why**:
  - ✅ Excel parsing is easily testable with fixture files
  - ✅ Data transformation has clear input/output contracts
  - ❌ Browser automation hard to test (requires real browser, external service, credentials)
  - ❌ No mock Octorate service for testing
- **What's missing**:
  - Contract tests for Excel structure
  - Property-based tests for transformation invariants
  - Integration tests for full pipeline
- **What would improve testability**:
  - Record successful export session for replay testing
  - Create fixture Excel files with known structure for transformation tests
  - Add mock Octorate responses for login/navigation tests
- **What would raise to ≥80%**:
  - Implement contract tests for expected Excel structure
  - Add property-based tests for transformation (all dates valid, revenue positive, etc.)
  - Create integration test with recorded session
- **What would raise to ≥90%**:
  - Build mock Octorate service for full E2E testing without real credentials
  - Add CI pipeline for contract tests (runs on every commit)
  - Implement chaos testing (what happens when Excel format changes?)

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| **Element selectors fail due to dynamic IDs** | High | High | Inspect actual page HTML to identify stable selectors (use `formcontrolname`, `data-*` attributes, or aria labels instead of dynamic IDs). Add retry logic with multiple selector fallbacks. |
| **Session expires during export** | Medium | Medium | Add session validation before export. Implement re-authentication flow using Gmail MFA automation (pattern exists from calendar export). |
| **Excel export format changes** | Low | High | Add contract tests to detect format changes early. Implement version compatibility layer. Maintain manual fallback option. |
| **Reservations page requires different navigation than calendar** | High | Medium | **BLOCKING Q5**: Must inspect actual page to confirm navigation path. May need to discover menu structure via trial or debug script. |
| **Statistics export missing required data fields** | Medium | High | **BLOCKING Q4**: Must analyze first successful export to validate data completeness. If fields missing, may need to export from different Octorate report. |
| **Historical data insufficient for YoY analysis** | Low | Medium | **Q6**: Validate available date range after first export. If <12 months, document limitation and adjust forecasting approach. |
| **Octorate rate limiting or IP blocking** | Low | Medium | Use human-like delays (1-5s between actions). Add exponential backoff on failures. Monitor for 429 status codes. Document Octorate's acceptable use policy. |
| **Page structure too dynamic for reliable automation** | Medium | High | If standard selectors fail consistently, consider: (1) building visual recognition (screenshot comparison), (2) manual export workflow with assisted data entry, or (3) requesting official Octorate API access. |
| **Data privacy concerns with storing booking data** | Low | Medium | Anonymize guest names in transformation. Store only booking metadata (dates, revenue, channel) not PII. Document data retention policy. |

---

## Planning Constraints & Notes

**Must-follow patterns**:
- Human-like delays for browser automation (slowMo: 1000ms, sleep 1-5s between actions)
- JSONL format for time-series data (newline-delimited JSON, append-only)
- Session storage for Playwright (`.secrets/octorate/storage-state.json`)
- JavaScript evaluation for viewport-blocked elements (`.evaluate(el => el.click())`)
- Navigate via UI menus (not direct URLs) - Octorate redirects dashboard to home

**Rollout/rollback expectations**:
- **Phase 1**: Fix element selectors, achieve first successful export
- **Phase 2**: Analyze Excel structure, document schema
- **Phase 3**: Build transformation script (Excel → JSONL)
- **Phase 4**: Add validation rules and quality gates
- **Phase 5**: Schedule automated runs (manual → daily)
- **Rollback**: Each phase has manual fallback - if automation fails, manual export still possible

**Observability expectations**:
- Log all export attempts (success/failure, timing, file size)
- Track data quality metrics (row count, missing fields, date range coverage)
- Alert on consecutive failures (>3 in a row)
- Dashboard showing: last successful export date, data freshness, quality score

---

## Suggested Task Seeds (Non-binding)

### Phase 1: Unblock Export (Critical)

**Task 1.1**: Diagnose current export failure
- Open browser with saved session, manually navigate to reservations page
- Check if session valid or expired (on reservations page vs. MFA screen)
- If expired: complete MFA, save new session
- If valid: inspect page HTML, identify actual element structure
- Document findings: current selectors vs. actual selectors needed

**Task 1.2**: Fix element selectors in export script
- Update `p-select[formcontrolname="type"]` selector to match actual page
- Use stable attributes (aria labels, data-cy, formcontrolname) over dynamic IDs
- Add fallback selectors in case primary selector fails
- Increase wait times if needed (5s → 10s for Angular rendering)
- Test: achieve first successful export, download Excel file

### Phase 2: Validate Data Structure

**Task 2.1**: Analyze Excel export structure
- Read downloaded Excel file with ExcelJS
- Document all sheets, columns, data types
- Identify required fields: booking dates, revenue, channel, room, status
- Check for missing fields or unexpected structure
- Validate date range coverage (how far back does data go?)

**Task 2.2**: Document Excel schema
- Create formal schema documentation (sheet names, column names, types, constraints)
- Add example rows showing typical data
- Identify edge cases (cancelled bookings, no-shows, multi-room bookings)
- Document any data quality issues (missing values, format inconsistencies)

### Phase 3: Build Transformation Pipeline

**Task 3.1**: Implement Excel → JSONL transformation
- Read Excel file with ExcelJS
- Extract booking records from appropriate sheet(s)
- Map columns to JSONL schema (bookingId, checkIn, checkOut, roomId, channel, revenue, status, bookedAt)
- Handle missing values and data type conversions
- Write to JSONL: `data/octorate/reservations/YYYY-MM-DD.jsonl`
- Add contract tests for expected Excel structure

**Task 3.2**: Implement data validation rules
- Validate required fields present (dates, revenue, channel)
- Check date consistency (checkOut > checkIn, bookedAt <= checkIn)
- Validate revenue always positive
- Check channel values against known list (Booking.com, Hostelworld, Direct, etc.)
- Flag suspicious records for review (extreme prices, invalid dates)

### Phase 4: Operational Hardening

**Task 4.1**: Add session validation and re-authentication
- Check session cookie expiration before export
- Validate session by attempting to load dashboard page
- If session invalid: trigger Gmail MFA flow, save new session
- Add retry logic (3 attempts with exponential backoff)

**Task 4.2**: Implement error handling and logging
- Log export attempts with timestamps, success/failure, error messages
- Save failed page screenshots for debugging
- Add circuit breaker (stop after 3 consecutive failures)
- Implement manual fallback documentation (how to export manually)

**Task 4.3**: Add monitoring and alerting
- Track export success rate (last 7 days, last 30 days)
- Monitor data quality metrics (row count, missing fields, coverage)
- Alert on: consecutive failures (>3), stale data (>7 days old), quality degradation
- Build simple dashboard showing export health

### Phase 5: Automation & Scheduling

**Task 5.1**: Design scheduling strategy
- Decide frequency: daily, weekly, or on-demand?
- Choose infrastructure: GitHub Actions, cron, manual invocation?
- Document operational requirements (credentials, environment)

**Task 5.2**: Implement scheduled execution (if needed)
- Configure GitHub Actions workflow (or cron job)
- Add retry logic for transient failures
- Implement notification on success/failure (email, Slack, etc.)

---

## Execution Routing Packet

**Primary execution skill**: `/lp-build`

**Supporting skills**: None (pure code automation)

**Deliverable acceptance package** (what must exist before task can be marked complete):

**Phase 1 (Unblock)**:
- Working export script that successfully downloads reservations Excel file
- Documented navigation flow (dashboard → menu → submenu → export)
- Saved session validation logic

**Phase 2 (Validate)**:
- Excel structure schema documentation (sheets, columns, types, constraints)
- Data quality assessment report (coverage, completeness, edge cases)

**Phase 3 (Transform)**:
- Transformation script (Excel → JSONL)
- Contract tests for Excel structure validation
- Property-based tests for transformation invariants

**Phase 4 (Harden)**:
- Session validation and re-authentication flow
- Error handling and logging
- Circuit breaker and manual fallback documentation

**Phase 5 (Automate)**:
- Scheduling infrastructure (if needed)
- Monitoring and alerting
- Operational runbook

**Post-delivery measurement plan**:
- **Export success rate**: % successful exports over time
- **Data quality score**: % records with all required fields, no validation errors
- **Data freshness**: Days since last successful export
- **Coverage**: Date range of available historical data

---

## Planning Readiness

**Status**: Needs-input

**Blocking items**:
- **Q5 (Critical)**: Are we on the reservations page or redirected to MFA? Need to inspect actual page state.
- **Q4 (Critical)**: What is the Excel export structure? Need first successful export to analyze.

**Recommended next steps**:

1. **Immediate** (unblock export):
   - Manually open browser with saved session
   - Check if session valid (on reservations page) or expired (on MFA screen)
   - If expired: complete MFA, save new session
   - If valid: inspect page HTML, save to file, identify correct selectors

2. **Once unblocked**:
   - Fix export script with correct selectors
   - Run successful export, download Excel file
   - Analyze Excel structure, document schema
   - Answer Q4-Q7 based on actual data

3. **Then proceed to `/lp-plan`**:
   - With validated Excel structure
   - With working export script
   - With clear transformation requirements

**Note**: This fact-find documents what we know so far. It will be updated after Q4-Q5 are resolved with actual evidence from successful export.
