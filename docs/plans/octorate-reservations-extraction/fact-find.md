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
- **PII constraints**: Guest names, contact info, payment details MUST NOT be stored long-term

**Assumptions:**
- Octorate statistics export contains historical booking data (dates, revenue, channels)
- Export format is stable enough for reliable parsing
- Historical data goes back at least 12 months (enough for YoY analysis)
- Login session from calendar export is still valid (or can be refreshed)
- Reservations page structure is accessible with current session

### PII Policy & Data Retention

**MUST NOT store** (strip during transformation):
- Guest names (first/last)
- Guest contact information (email, phone)
- Payment details (card numbers, billing addresses)
- Passport/ID numbers
- Any free-text notes that may contain PII

**MAY store** (required for analysis):
- Booking reference ID (anonymized hash if Octorate ID is considered sensitive)
- Booking dates (check-in, check-out, booking date/time)
- Revenue amounts (aggregated, no payment method details)
- Channel name (OTA platform name, "Direct", etc.)
- Room/rate plan identifiers
- Booking status (confirmed, cancelled, no-show)

**Retention policy** (aspirational until scheduling/cleanup implemented):
- Raw Excel exports: 30 days (for debugging), then delete (requires cleanup script)
- Transformed JSONL: 24 months (for YoY analysis)
- Aggregated metrics: indefinite (no PII)
- **Note**: `data/octorate/*` and `.tmp/*` must be in `.gitignore` (verify)

### Required Data Contract (Independent of Excel Format)

**Minimum viable fields for success** (must be present in any export):

| Field | Type | Required | Description | Used For | Notes |
|-------|------|----------|-------------|----------|-------|
| `bookingDate` | ISO date-time | Yes | When booking was created | Booking velocity trends | Timezone: assume property-local (CET for BRIK), normalize to UTC |
| `checkIn` | ISO date | Yes | Guest arrival date | Occupancy calculation | — |
| `checkOut` | ISO date | Yes | Guest departure date | Occupancy calculation, LOS | — |
| `revenue` | Decimal + currency | Yes | Total booking value | Revenue analysis, optimization | Assume EUR for BRIK unless currency field exists |
| `channel` | String (enum) | Yes | Booking source | Channel attribution | — |
| `roomId` OR `roomName` | String | Preferred | Room/rate plan identifier | Room-level analysis | Fallback: `roomType` or aggregate if no stable ID |
| `status` | String (enum) | Yes | confirmed \| cancelled \| no-show | Cancellation rate, occupancy | — |
| `bookingId` | String (hash) | No | Anonymized booking ref | Deduplication only | Optional |

**Derived metrics** (calculated from above):
- **ADR** (Average Daily Rate): total revenue / room-nights sold ✅ (computable from bookings alone)
- **Cancellation rate**: cancelled bookings / total bookings ✅ (computable from bookings alone)
- **Lead time**: checkIn - bookingDate (days) ✅ (computable from bookings alone)
- **Occupancy rate**: (days with bookings) / (days available) ⚠️ (requires inventory/capacity source)
- **RevPAR** (Revenue Per Available Room): total revenue / room-nights available ⚠️ (requires inventory/capacity source)

**Note**: Occupancy rate and RevPAR require inventory source (room capacity × nights). Either:
- Extract from Octorate rooms configuration, or
- Use internal `room-inventory.json` (11 rooms for BRIK), or
- Defer occupancy/RevPAR until inventory source available

**Channel enumeration** (examples, actual list TBD):
- `Booking.com`, `Hostelworld`, `Direct`, `Airbnb`, `Expedia`, `Other`

**Status enumeration**:
- `confirmed` - paid and confirmed
- `cancelled` - cancelled after confirmation
- `no-show` - guest didn't arrive
- `pending` - not yet confirmed (exclude from occupancy if present)

---

## Verified Artifacts

**Evidence checkpoints** (updated as work progresses):

- [x] **Session storage**: `.secrets/octorate/storage-state.json`
  - Last refreshed: 2026-02-14 ~11:00 CET (login-octorate.mjs completed)
  - Contains valid session cookie (do not paste secrets here)
  - Validated: Successfully loaded `https://admin.octorate.com/` (dashboard)
  - Expiry: Session cookie (expires on browser close or inactivity timeout)

- [ ] **Reservations page state**: NOT YET CAPTURED
  - Need: Screenshot or HTML dump proving we land on reservations list page OR MFA screen
  - How: Open browser with saved session, navigate to `/octobook/user/reservation/list.xhtml`
  - Expected: Either reservations page (can proceed) or MFA redirect (must re-auth)

- [ ] **First Excel export**: NOT YET CAPTURED
  - Need: One successful export with actual data (redacted if needed)
  - File path: TBD (`data/octorate/octorate-reservations-YYYY-MM-DD.xlsx`)
  - Expected structure: Multiple sheets with booking records
  - Date range: TBD (ideally Jan 2024 - Feb 2026)

- [ ] **Column mapping**: NOT YET DOCUMENTED
  - Need: Map Excel columns → Required Data Contract fields
  - Format: `Excel column "Guest Check-in" → checkIn (ISO date)`
  - Missing fields: Document what's unavailable and impact

---

## Evidence Audit (Current State)

### Entry Points

**Octorate Login & Session Management**:
- `packages/mcp-server/login-octorate.mjs` — Interactive login script
  - Opens browser for manual login + MFA
  - Saves session to `.secrets/octorate/storage-state.json`
  - Session cookie: `octobooksessionid`
  - **Status**: ✅ Working (last verified: 2026-02-14 ~11:00 CET)

**Reservations Export Script** (In progress):
- `packages/mcp-server/export-octorate-reservations.mjs` — Automated reservations export
  - Target URL: `https://admin.octorate.com/octobook/user/reservation/list.xhtml`
  - **Status**: ⚠️ Failing at Step 4 (element selector timeout)
  - **Issue**: Can't find `p-select[formcontrolname="type"]` element (10-second timeout)
  - **Last attempted**: 2026-02-14

**Debug Script**:
- `packages/mcp-server/debug-reservations-page.mjs` — Page structure inspector
  - **Status**: ❌ Failed to save HTML (`.tmp` directory missing)
  - **Intent**: Capture actual page structure to fix selectors
  - **Last attempted**: 2026-02-14

**Calendar Export (Reference Implementation)**:
- `packages/mcp-server/export-via-navigation.mjs` — Working calendar export
  - Successfully navigates Octorate UI
  - Handles dynamic JavaScript rendering with appropriate waits
  - Downloads Excel file reliably
  - **Status**: ✅ Working (proven pattern)
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

**Priority 1 (must-have before production)**:
- **Fixture-based parsing tests**: Use 1-2 real exported XLSX files (redacted/synthetic)
  - Assert required columns exist
  - Parse sample rows successfully
  - Fail loudly with diff-like message when schema changes
- **Schema drift detector**: Automated test that validates Excel structure matches documented contract
  - Run on every new export
  - Alert if columns added/removed/renamed

**Priority 2 (once schema stable)**:
- **Transformation tests**: Excel → JSONL with known inputs/outputs
  - Date parsing correctness (timezone handling)
  - Revenue decimal precision
  - Channel enum validation
  - PII stripping (guest names removed)

**Priority 3 (future hardening)**:
- **Integration tests**: End-to-end with mock/recorded Octorate session (manual/local only, not CI)
- **Property-based tests**: Only after transformation logic stabilizes (overkill until then)

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

## Unblockers (Next 60 Minutes)

**Two critical artifacts needed before planning can proceed:**

### Artifact 1: Reservations Page State Capture

**Goal**: Prove whether saved session lands on reservations page or redirects to MFA

**Script**: `packages/mcp-server/capture-reservations-page-state.mjs` (to be created)

**Reproducible commands**:
```bash
cd packages/mcp-server
mkdir -p .tmp  # Ensure directory exists (previous failure mode)
node capture-reservations-page-state.mjs
```

**Script behavior**:
1. Open browser with saved session from `.secrets/octorate/storage-state.json`
2. Navigate to `https://admin.octorate.com/octobook/user/reservation/list.xhtml`
3. Wait 10 seconds for page to load/redirect
4. Capture:
   - Screenshot: `.tmp/reservations-page-state.png`
   - Page HTML: `.tmp/reservations-page-state.html`
   - Current URL → log to console
   - Page title → log to console
5. Exit (leave browser open for 5s for manual inspection)

**Success criteria**: Screenshot + HTML saved, console shows current URL and title

**Interpretation**:
- URL contains `/mfa.xhtml` OR title contains "MFA"/"Authentication" → **Session expired**, run `login-octorate.mjs`
- URL contains `/reservation/list` OR title contains "Reservations"/"Prenotazioni" → **Session valid**, proceed to Artifact 2

---

### Artifact 2: First Excel Export + Column Map

**Goal**: Get one successful export with actual booking data to validate Required Data Contract

**Recommended path**: **Manual export first** (fastest way to answer Q4 and unblock transformation work)

**Manual export procedure** (execute immediately):
1. Open browser, navigate to Octorate admin
2. Go to: Reservations → List
3. Configure filters:
   - Sort: Create time
   - Date range: 01/01/2024 → 14/02/2026 (or current date)
   - Channels: All channels
   - Status: Confirmed
   - Rooms: All rooms
4. Click **Statistics** button (chart icon)
5. Select **Download to Excel**
6. Save file as: `data/octorate/octorate-reservations-manual-2026-02-14.xlsx`

**Analysis procedure** (after manual export succeeds):
1. Open Excel file (Excel or LibreOffice)
2. Document structure:
   - Sheet names (list all)
   - Column headers (for each sheet)
   - Sample row (redact guest name if present)
   - Row count and date range
3. Create `data/octorate/reservations-column-mapping.md`:
   ```markdown
   # Octorate Reservations Export Schema

   **File**: octorate-reservations-manual-2026-02-14.xlsx
   **Date range**: YYYY-MM-DD to YYYY-MM-DD
   **Total bookings**: NNN

   ## Sheet: [actual name]

   | Excel Column | Required Field | Type | Notes |
   |--------------|----------------|------|-------|
   | "Booking Date" | bookingDate | ISO datetime | Timezone: CET → UTC |
   | "Check-in" | checkIn | ISO date | — |
   | "Check-out" | checkOut | ISO date | — |
   | "Total" | revenue | Decimal | Currency: EUR (assumed) |
   | "Channel" | channel | String | — |
   | "Room Name" | roomName | String | (no stable roomId, use name) |
   | "Status" | status | String | — |

   **Missing fields**: bookingId (not present, use row number)
   **Currency**: EUR (no currency field, BRIK assumption valid)
   ```

**Success criteria**:
- Excel file downloaded and openable ✅
- Required fields present (or documented as missing with workaround) ✅
- Column mapping documented in `reservations-column-mapping.md` ✅
- Date range validated (≥12 months for YoY analysis) ✅

**Automation path** (optional, after manual export proves structure):
- If manual export successful and schema documented:
  - Update `export-octorate-reservations.mjs` with correct selectors (from Artifact 1 HTML)
  - Test automation using known-good manual export as fixture
  - Automation becomes "nice-to-have" enhancement, not blocker

**Decision point**: Manual export + documented schema = sufficient to proceed to `/lp-plan`

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
