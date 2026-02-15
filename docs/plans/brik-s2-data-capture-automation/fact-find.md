---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: brik-s2-data-capture-automation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-s2-data-capture-automation/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: pending
---

# BRIK S2 Data Capture Automation — Fact-Find Brief

## Scope

### Summary

Automate the three "operator must fill" data captures that feed BRIK's S2 market intelligence deep research prompt. Currently, `s2-market-intelligence-handoff.ts` auto-discovers dated CSVs via `buildOperatorCapturedDataBlock()` but finds only empty scaffolds. This work builds the scripts that populate those CSVs, closing the loop from raw data sources through to the rendered prompt.

Three automation tracks:
1. **Parity price capture** — scrape all-in prices from BRIK direct, Booking.com, and Hostelworld for 3 seasonal scenarios
2. **Channel economics extraction** — enhance the Octorate reservation processor to output per-channel bookings and derive commission data
3. **Pipeline integration** — wire new scripts into the existing data pipeline so CSVs auto-populate before prompt generation

### Goals

- Populate `2026-02-15-parity-scenarios.csv` with all-in totals, policy terms, and real listing URLs for all 9 surface×scenario combinations
- Populate `2026-02-15-bookings-by-channel.csv` with per-channel (Booking.com / Hostelworld / Direct) monthly bookings and values
- Populate `2026-02-15-commission-by-channel.csv` with per-channel commission amounts and effective take rates
- Make all three captures repeatable (script-driven, not manual) so future S2 runs get populated data automatically
- Maintain the existing `buildOperatorCapturedDataBlock()` integration (no changes needed to s2 handoff script)

### Non-goals

- Changing the s2 handoff template or prompt structure
- Adding schema validation to `buildOperatorCapturedDataBlock()` (improvement, but separate work)
- Scraping competitor properties (only BRIK's own listings on OTA platforms)
- Real-time price monitoring or alerting
- Apartment parity (hostel only for now — apartment is Booking.com-only, not yet on Hostelworld)

### Constraints & Assumptions

- Constraints:
  - Booking.com has aggressive bot detection; automation must support a deterministic hybrid/manual fallback mode (still script-driven, still writes CSV)
  - Octorate session expires every 24-48h; scripts must detect expiry and fail loudly with a single actionable remediation (refresh session)
  - Commission data is not in the Octorate reservation export; commission-by-channel must be derived from explicit rates config (contractual preferred, estimated allowed with provenance)
  - Scripts must run on macOS (developer machine) with Chrome installed
  - All S2 operator-captured output CSVs must land in `docs/business-os/market-research/BRIK/data/` with `YYYY-MM-DD-` date prefix

- Assumptions:
  - The Refer column format is a useful channel signal, but **unknown patterns must not be silently bucketed into Hostelworld**.
    - Mapping contract (current best evidence):
      - `^\d{10}$` -> `Booking.com`
      - `^7763-` -> `Hostelworld`
      - `^[A-Za-z0-9]{6}$` -> `Direct`
      - else -> `Unknown` (or `Other OTA`)
  - Commission rates are supplied via a small config file with provenance (rate, source, last-verified date)
  - **Scenario dates source-of-truth contract:** scenario dates are computed once by the S2 orchestrator for a given `--as-of`, then passed to each parity capture as explicit `--check-in/--check-out/--pax` arguments. Parity capture must not recompute dates independently (unless it imports the exact same function from a shared module).

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` — S2 prompt generator; calls `buildOperatorCapturedDataBlock()` at line 274 to discover and embed operator CSVs
- `packages/mcp-server/octorate-process-bookings.mjs` — current booking processor; binary Direct/OTA classification via `isDirectBooking()` at line 59
- `packages/mcp-server/octorate-full-pipeline.mjs` — orchestrator: runs export then processing
- `packages/mcp-server/src/tools/browser.ts` — MCP browser tool definitions (6 tools: session_open/close, observe, act, get_downloads, wait_for_download)

### Key Modules / Files

- `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` — `buildOperatorCapturedDataBlock()` (L274-320), `findLatestDatedMarketResearchDataFile()` (L231-264), `csvLooksEmptyOrHeaderOnly()` (L266-272), `computeHospitalityScenarioDates()` (L1008-1031)
- `packages/mcp-server/octorate-process-bookings.mjs` — standalone .mjs script, reads Excel via ExcelJS, deduplicates by Refer per month, classifies channel, outputs 2 CSVs
- `packages/mcp-server/src/tools/gmail.ts:1062-1066` — `deriveBookingSource()` function with reservation code format → channel mapping (must be ported)
- `packages/mcp-server/src/tools/browser/driver-playwright.ts` — Playwright browser driver (sessions, downloads, navigation)
- `packages/mcp-server/src/tools/browser/act.ts` — action execution (click, fill, navigate, evaluate)
- `packages/mcp-server/src/tools/browser/observe.ts` — page accessibility tree snapshot → interactive affordances
- `apps/brikette/src/context/modal/constants.ts` — `BOOKING_CODE = "45111"` (Octorate property code)
- `packages/ui/src/atoms/RatingsBar.tsx:23-31` — canonical Booking.com and Hostelworld URLs
- `apps/brikette/src/config/hotel.ts` — hostel metadata (URL, contact, ratings)
- `data/octorate/room-inventory.json` — room name patterns confirming generic "OTA" prefix (no channel detail)

### Patterns & Conventions Observed

- **Octorate script pattern**: standalone `.mjs` files in `packages/mcp-server/`, using `handleToolCall()` from the built MCP server to invoke browser tools programmatically — evidence: `octorate-export-final-working.mjs`, `octorate-calendar-export.mjs`
- **Browser automation pattern**: Open session → navigate → observe → act → wait for download → close session. Two targeting modes: BIC actionId (from observe) or direct JavaScript `evaluate` for complex SPAs — evidence: `octorate-calendar-export.mjs` uses `evaluate` for JSF menu clicks
- **CSV discovery pattern**: `findLatestDatedMarketResearchDataFile()` scans `docs/business-os/market-research/<BIZ>/data/` for files matching `YYYY-MM-DD-<suffix>.csv`, picks latest ≤ asOfDate — evidence: `s2-market-intelligence-handoff.ts:231-264`
- **Channel attribution pattern**: `deriveBookingSource()` uses reservation code format, not room name — evidence: `gmail.ts:1062-1066`
- **Sleep between actions**: Octorate scripts use 2-5s sleeps between steps for JSF hydration — evidence: throughout `octorate-export-final-working.mjs`
- **Session persistence**: `.secrets/octorate/storage-state.json` for Octorate; similar pattern would apply for Booking.com/Hostelworld if login needed

### Data & Contracts

- **Input: Octorate reservation export Excel**
  - Columns: Create time (1), Check in (2), Guest (3), Refer (4), Guests (5), Nights (6), Room (7), Total Room (8), Email (9)
  - Room column pattern: `"OTA, Refundable, Room N"` or `"Room N"` (Direct) — no per-channel OTA names
  - Refer column pattern: 10 digits (Booking.com), 6 chars (Direct), `7763-` prefix (Hostelworld)

- **Output: parity-scenarios.csv**
  - Schema: `scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes,evidence_url`
  - 9 data rows (3 scenarios × 3 surfaces)
  - **Scenario date parity requirement:** `check_in/check_out/travellers` in every row must exactly match the orchestrator-provided scenario inputs for the same `--as-of`.
  - **"All-in" semantics (to avoid apples-to-oranges):**
    - Direct (Octorate): the total payable shown for the stay in the booking engine summary step for the selected dates/pax, including mandatory fees shown by the engine; if city tax is excluded, record that in `taxes_fees_clarity`.
    - Booking.com: the stay total as displayed in the property availability/results summary for the selected dates/pax; separately record inclusion/exclusion signals in `taxes_fees_clarity` (e.g. "includes taxes", "excludes city tax", "taxes may apply").
    - Hostelworld: `total_price_all_in` must represent **deposit + pay-at-property** when both are shown; use `deposit_payment` to record the components and terms (not just yes/no).

- **Output: bookings-by-channel.csv**
  - Schema: `month,channel,bookings,gross_value,net_value,cancellations,refunds_or_adjustments,notes`
  - One row per month per channel (Direct, Booking.com, Hostelworld, plus `Unknown` if encountered)
  - **Month attribution (must be explicit):** default to **check-in month** for S2 unit-economics/seasonality. (Create-time month can be added later as a parallel view.)
  - **MVP field semantics given the current export:**
    - `bookings`: count of deduped bookings (by Refer) attributed to the channel
    - `gross_value`: sum of `Total Room` for those bookings
    - `net_value`: equals `gross_value` in MVP unless/until a true net definition is available from another report
    - `cancellations`, `refunds_or_adjustments`: set to `0` in MVP and encode `not_available_from_export=true` (or equivalent) in `notes`

- **Output: commission-by-channel.csv**
  - Schema: `month,channel,commission_amount,currency,effective_take_rate,notes`
  - One row per month per channel
  - **Derivation contract:** in MVP, commission is derived as `gross_value × rate` where `rate` comes from an explicit config file. `notes` must include structured provenance (e.g. `rate_source=contractual|estimated`, `rate_last_verified_at=YYYY-MM-DD`, and where it was found).

- **BRIK listing URLs (confirmed in codebase)**
  - Direct: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=...&checkout=...&pax=1`
  - Booking.com: `https://www.booking.com/hotel/it/hostel-brikette.en-gb.html`
  - Hostelworld: `https://www.hostelworld.com/hostels/p/7763/hostel-brikette/`

### Dependency & Impact Map

- **Upstream dependencies:**
  - Octorate admin session (`.secrets/octorate/storage-state.json`) — expires every 24-48h
  - Octorate reservation export Excel — produced by `octorate-export-final-working.mjs`
  - Booking.com / Hostelworld public pages — no authentication required for price lookup
  - BRIK direct booking engine at `book.octorate.com` — public, no auth needed
  - Chrome browser installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

- **Downstream dependents:**
  - `s2-market-intelligence-handoff.ts` — auto-discovers CSVs via `buildOperatorCapturedDataBlock()`
  - Deep Research prompt — embeds raw CSV content in `BEGIN_OPERATOR_CAPTURED_DATA` block
  - S2B Offer Design (`/lp-offer`) — consumes parity data for pricing decisions
  - S6B Channel Strategy (`/lp-channels`) — consumes channel economics for commission analysis
  - S3 Forecast (`/lp-forecast`) — consumes channel mix for scenario modeling

- **Likely blast radius:**
  - Contained to new scripts + enhanced processor. No changes to existing s2 handoff code needed.
  - Risk: changing `bookings_by_month.csv` `channel_source` keys beyond `Direct:N; OTA:N` would break `parseChannelSource()` in the s2 handoff. Mitigation: keep `bookings_by_month.csv` schema and `channel_source` format unchanged; emit per-channel detail only into the new dated `*-bookings-by-channel.csv` and `*-commission-by-channel.csv` artifacts.

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (via `run-governed-test.sh` wrapper with resource admission and telemetry)
- **Commands:** `pnpm --filter ./scripts test`, `pnpm --filter @acme/mcp-server test`
- **CI integration:** Nightly Package Quality Matrix (`test.yml`) discovers all workspaces and runs tests per workspace
- **Coverage:** Relaxed thresholds (`relaxCoverage: true`) for scripts workspace

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| s2 handoff (prompt generation) | integration | `s2-market-intelligence-handoff.test.ts` (624 lines, 4 scenarios) | Strong: covers YoY decomposition, scenario dates, profile selection, URL cascade, two-pass split. **Gap: does not test `buildOperatorCapturedDataBlock()` — no operator CSV fixtures.** |
| Browser observe/act | contract | 6 test files (BIC schema, CDP, observe, act, ranking, safety) | Strong: comprehensive contract tests against mock driver |
| Browser session/driver | unit | 2 test files | Adequate: mock driver conformance, session store |
| Market intel pack lint | unit | `market-intelligence-pack-lint.test.ts` (55 lines) | Adequate: clipboard artifacts, placeholders, missing URLs |
| Octorate process-bookings | **none** | -- | **Zero coverage.** Standalone .mjs script with no tests. |
| Octorate export/pipeline scripts | **none** | -- | **Zero coverage.** All 10 octorate-*.mjs scripts untested. |

#### Test Patterns & Conventions
- **Pattern A — Full mocking**: `jest.mock()` for fs and sibling modules; used by learning hook tests
- **Pattern B — Temp directory**: `fs.mkdtempSync()` + real filesystem; used by most startup loop tests including s2 handoff
- **Pattern C — Pure function**: Inline data structures, direct function calls; used by bottleneck detector, derive-state
- **Naming convention**: Verification criterion IDs (e.g., `VC-LC-06-01`, `TC-01`)

#### Coverage Gaps (Planning Inputs)
- **Untested paths:**
  - `octorate-process-bookings.mjs` — entire file untested; channel attribution logic (`isDirectBooking`) and dedup/aggregation pipeline have no test coverage
  - `buildOperatorCapturedDataBlock()` — no test fixtures include operator-captured CSVs
  - `findLatestDatedMarketResearchDataFile()` — no tests for date-prefix discovery, edge cases (multiple dates, future-dated files)
  - `csvLooksEmptyOrHeaderOnly()` — no tests; currently fails to detect partially-filled CSVs (has data rows but empty value columns)
- **Extinct tests:** None identified
- **Test seams needed:** The `octorate-process-bookings.mjs` processing logic needs extraction into a testable module (currently monolithic script with no exports)

#### Recommended Test Approach
- **Extract and unit test pure seams (minimum):** `deriveBookingSource(refer)`, `dedupeBookings(rows)`, `aggregateBookings(rows, { monthBy: "check_in" })`, `deriveCommission(bookingsByChannel, ratesConfig)`, and deterministic CSV serialization (ordering + formatting).
- **Add integration coverage:** extend `s2-market-intelligence-handoff.test.ts` with populated operator CSV fixtures and assert `buildOperatorCapturedDataBlock()` embeds them without warnings.
- **Add a selector edge-case test:** `findLatestDatedMarketResearchDataFile()` must pick the latest file with date <= `--as-of` and ignore future-dated files.
- **No E2E browser tests** for parity capture (would require live sites) — test the data processing, not the scraping.

### Recent Git History (Targeted)

- `packages/mcp-server/octorate-process-bookings.mjs` — created 2026-02-14, no subsequent changes
- `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` — actively developed through 2026-02-15; recent additions include hospitality template, operator-captured data block, scenario date computation
- `docs/business-os/market-research/BRIK/data/` — scaffold CSVs created 2026-02-15 by s2 handoff script
- `packages/mcp-server/src/tools/gmail.ts` — `deriveBookingSource()` has been stable; used in production email processing

## Questions

### Resolved

- **Q: Does the Octorate Room column contain specific OTA channel names?**
  - A: No. Room column uses generic "OTA" prefix only (e.g., "OTA, Refundable, Room 3"). No Booking.com/Hostelworld distinction.
  - Evidence: `data/octorate/room-inventory.json` — all rooms follow `"OTA, {policy}, {room}"` pattern

- **Q: Can per-channel attribution be derived from the reservation export?**
  - A: Yes, via the Refer column (reservation code format), but the mapping must treat unknown patterns as `Unknown` (not Hostelworld). Current best-evidence mapping:
    - `^\d{10}$` -> Booking.com
    - `^7763-` -> Hostelworld
    - `^[A-Za-z0-9]{6}$` -> Direct
    - else -> Unknown / Other OTA
  - Evidence: `packages/mcp-server/src/tools/gmail.ts:1062-1066` (existing logic), plus Hostelworld prefix evidence in `packages/mcp-server/src/tools/gmail.ts`.

- **Q: What are BRIK's listing URLs on the OTA platforms?**
  - A: Booking.com: `https://www.booking.com/hotel/it/hostel-brikette.en-gb.html`; Hostelworld: `https://www.hostelworld.com/hostels/p/7763/hostel-brikette/`
  - Evidence: `packages/ui/src/atoms/RatingsBar.tsx:23-31`

- **Q: How does the BRIK direct booking engine work?**
  - A: Redirect model — BRIK site redirects to `book.octorate.com` with query params (`codice=45111`, `checkin`, `checkout`, `pax`). Not an embedded widget.
  - Evidence: `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`, `apps/brikette/src/context/modal/constants.ts`

- **Q: Does `buildOperatorCapturedDataBlock()` need changes to consume populated CSVs?**
  - A: No. It reads raw CSV content and embeds verbatim. No schema validation. Populated CSVs will be auto-discovered and embedded as-is.
  - Evidence: `s2-market-intelligence-handoff.ts:274-320`

- **Q: Does the s2 handoff `parseChannelSource()` need changes for richer channel data in bookings_by_month.csv?**
  - A: If we enriched `bookings_by_month.csv` `channel_source` keys beyond `Direct:N; OTA:N` (e.g. `Booking.com`, `Hostelworld`), `parseChannelSource()` would break because it expects only `Direct` and `OTA`. Mitigation: keep `bookings_by_month.csv` backward-compatible and emit per-channel detail only to the new dated `*-bookings-by-channel.csv` / `*-commission-by-channel.csv` artifacts.
  - Evidence: `s2-market-intelligence-handoff.ts` — `parseChannelSource` function

### Open (User Input Needed)

- **Q: What are BRIK's actual OTA commission rates?**
  - Why it matters: The `commission-by-channel.csv` needs `commission_amount` and `effective_take_rate` per channel per month. Without contractual rates, we can only estimate (Booking.com ~15-18%, Hostelworld ~12-15%).
  - Decision impacted: Whether commission CSV uses actual rates or industry-standard estimates.
  - Decision owner: Pete
  - Default assumption + risk: Use industry-standard rates (Booking.com 15%, Hostelworld 12%) with `notes` column flagging "estimated — replace with contractual rate". Risk: inaccurate unit economics in S6B channel strategy. Medium impact — can be corrected later.

- **Q: Should parity capture use fully automated scraping or semi-automated (script opens pages, operator reads prices)?**
  - Why it matters: Booking.com anti-bot detection may block fully automated extraction.
  - Decision impacted: Script architecture and repeatability guarantees.
  - Decision owner: Pete
  - Default assumption + contract: Implement a single script interface with modes:
    - `--mode=auto`: attempt extraction; fail if blocked
    - `--mode=hybrid`: attempt extraction; if blocked, prompt for terminal inputs (price, optional policy text) and still write CSV
    - `--mode=manual`: always prompt, but still opens the exact URL (with check-in/out/pax) to ensure determinism
    - All modes must write `notes` including `capture_mode=...` and a timestamp; `evidence_url` should be the final navigated URL.

- **Q: Is there an Octorate Statistics/Reports page with channel-level commission data?**
  - Why it matters: If Octorate tracks commission per booking, we could extract actual commission amounts rather than estimating from contractual rates.
  - Decision impacted: Whether to build a new Octorate scraper for commission data or derive from rates × booking value.
  - Decision owner: Pete
  - Default assumption + risk: Octorate does not expose per-booking commission in the standard export. Derive commission as `gross_value × contractual_rate`. Risk: slight inaccuracy if commission varies by room type or season. Low impact.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 82%
  - Strong existing infrastructure: Playwright browser tools, Octorate script patterns, `deriveBookingSource()` logic already proven.
  - Main uncertainty: Booking.com anti-bot detection feasibility. Hostelworld and BRIK direct are high-confidence.
  - What would raise to ≥90%: Spike test of Booking.com scraping with real Chrome + slow navigation to confirm feasibility before committing to full automation.

- **Approach:** 85%
  - Clear architecture: enhance existing processor + add new scraper scripts + existing CSV discovery integration.
  - The "port deriveBookingSource to process-bookings" approach is proven (function already works in production email processing).
  - The backward-compatible strategy (keep `bookings_by_month.csv` format unchanged, output per-channel detail to separate `bookings-by-channel.csv`) avoids blast radius.
  - What would raise to ≥90%: Confirmation that Octorate commission data is not available from any export/report (avoiding building something that already exists).

- **Impact:** 90%
  - Blast radius is well-contained: new scripts + one enhanced existing script.
  - No changes to s2 handoff code — CSVs auto-discovered.
  - Only risk: `bookings_by_month.csv` `channel_source` column format change could break `parseChannelSource()` — mitigated by keeping existing format and outputting per-channel data to the new CSV only.

- **Delivery-Readiness:** 80%
  - Clear execution owner (agent), clear output paths, clear quality gates (CSV populated with non-empty values, s2 handoff embeds without "present-but-empty" warning).
  - What would raise to ≥90%: Define explicit acceptance criteria per CSV (minimum row count, required non-empty columns, spot-check values against manual capture).

- **Testability:** 75%
  - Octorate processing logic needs extraction from monolithic .mjs script into importable module for unit testing.
  - Parity capture output (CSV generation) is easily testable as pure function.
  - Browser scraping itself is not unit-testable (requires live sites) but processing layer is.
  - What would raise to ≥90%: Extract processing functions into `src/` module with exports; add test fixtures matching real Octorate export structure.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Booking.com blocks automated price scraping | Medium | Medium | Build with semi-automated fallback: script navigates to correct page, prompts operator if extraction fails. Hostelworld + BRIK direct still fully automated. |
| Octorate session expiry during pipeline run | Medium | Low | Scripts already handle this pattern (fail with clear "session expired" message). Operator runs `octorate_login_interactive` to refresh. |
| Refer column format doesn't cover all OTA channels | Low | Medium | If bookings come from Expedia or other OTAs not matching known patterns, they'd be classified as "Other OTA". Can add patterns as discovered. Current data shows only Booking.com + Hostelworld + Direct. |
| Commission rates vary by season/promotion | Medium | Low | Use flat contractual rates initially, flag as "estimated" in notes column. Refine with actual Octorate invoice data if available. |
| Parity prices unavailable for future dates (S1 is July 2026) | Low | Low | Both Booking.com and Hostelworld typically show prices 6+ months ahead for established properties. If a scenario date is unavailable, record "unavailable" with notes. |
| Enhanced processor breaks `bookings_by_month.csv` consumers | Low | High | Mitigated: keep `bookings_by_month.csv` format unchanged. Output per-channel detail only to the new `bookings-by-channel.csv`. |


## Operational Contracts (Prevent Rework)

- **Idempotency + atomic writes:** scripts must write `*.tmp` then rename to the final `YYYY-MM-DD-*.csv` filename (atomic). Default `--overwrite=false` (fail if target exists) unless explicitly opted in.
- **Partial failure behavior:** a failed surface/scenario capture must still produce a deterministic CSV row with `total_price_all_in=unavailable` (or equivalent) and a diagnostic `notes` entry (include `capture_mode=auto|hybrid|manual_input` and timestamp).
- **Artifact landing matrix (avoid path drift):**
  - S2 operator-captured artifacts consumed by `buildOperatorCapturedDataBlock()` live in `docs/business-os/market-research/BRIK/data/`.
  - Default mechanism: every script that produces S2 operator-captured artifacts must accept `--output-dir`, and the orchestrator must pass `docs/business-os/market-research/BRIK/data/` explicitly. Avoid copy steps unless an existing script interface cannot be changed.
- **Backward compatibility contract:** `bookings_by_month.csv` schema and `channel_source` format (`Direct:N; OTA:N`) must remain unchanged; per-channel detail goes only into the new dated `*-bookings-by-channel.csv` and `*-commission-by-channel.csv` files.
- **Data governance / privacy:** Octorate exports contain guest names and emails. Scripts must never log row-level PII, and any test fixtures must be anonymized. `.secrets/**` must remain untracked/ignored (session state, cookies).

## Definitions & Formats (MVP Contracts)

- **Enumerations (exact strings):**
  - `surface` in parity: `Direct`, `Booking.com`, `Hostelworld`
  - `scenario` in parity: `S1`, `S2`, `S3`
  - `channel` in channel economics: `Direct`, `Booking.com`, `Hostelworld`, `Unknown` (emit `Unknown` only when encountered; do not silently remap)
- **Month format:** `month` is `YYYY-MM` (no locale month names, no full dates).
- **Bookings month range (MVP):** last 12 complete **check-in months**, ending at the month prior to `--as-of`.
  - Example: `--as-of 2026-02-15` -> include `2025-02` through `2026-01` inclusive.
  - Do not include a partial current month in MVP.
- **Deduplication (MVP, deterministic):**
  - Dedup key: `Refer` **globally** (not per month).
  - If multiple rows share the same `Refer`, select the canonical row deterministically:
    - Prefer the row with the latest `Create time`
    - Tie-breaker: highest `Total Room`
    - Final tie-breaker: first row in stable input order
  - After deduplication, assign the booking month based on `Check in` (per month range contract above).
- **Currency + numeric formatting (MVP):**
  - Default target currency is `EUR`. Where a surface can be forced to EUR (params/settings), do so.
  - If a surface cannot be forced to EUR in a given run, still write the row with the displayed currency and set `notes` token `currency_mismatch=true`.
  - Numeric fields (`total_price_all_in`, `gross_value`, `commission_amount`) must be plain numbers with `.` decimal separator, no currency symbols, rounded to 2 decimals.
- **`taxes_fees_clarity` convention (prefix enum + optional detail):** must begin with one of `includes_taxes`, `excludes_city_tax`, `taxes_may_apply`, `unknown`, followed by optional human text.
- **`notes` convention (universal):** `notes` is a semicolon-separated list of `key=value` tokens. Free text is allowed only as `free_text=...`.
  - Minimum parity tokens: `capture_mode=auto|hybrid|manual_input`; `captured_at=YYYY-MM-DDThh:mm:ssZ`; `source=octorate|booking|hostelworld`
  - Minimum commission tokens: `rate=0.15`; `rate_source=estimated|contractual`; `rate_last_verified_at=YYYY-MM-DD`
- **Commission edge cases (MVP):**
  - Always emit `Direct` rows with `commission_amount=0` and `effective_take_rate=0`.
  - If `gross_value==0`, set `effective_take_rate=0` and add `notes` token `gross_zero=true` (avoid division-by-zero).

## Planning Constraints & Notes

- Must-follow patterns:
  - New scripts follow existing octorate-*.mjs convention (standalone .mjs in `packages/mcp-server/`, using `handleToolCall()`)
  - Processing logic extracted into `packages/mcp-server/src/` module for testability
  - CSV output follows existing date-prefix naming in `docs/business-os/market-research/BRIK/data/`
  - `deriveBookingSource()` logic ported from `gmail.ts`, not duplicated (extract to shared utility or copy with attribution)
  - Keep `bookings_by_month.csv` backward-compatible (existing `Direct:N; OTA:N` format unchanged)
- Rollout expectations:
  - Scripts are developer-machine tools, not CI/CD — no deployment needed
  - First run populates current-date CSVs; future runs use new as-of date prefix
- Observability expectations:
  - Scripts log progress to stdout (matching existing octorate script pattern)
  - Failed captures logged with clear error context (which surface, which scenario, what went wrong)
  - CSV "notes" column includes provenance (script name, timestamp, data source)

## Suggested Task Seeds (Non-binding)

1. **Extract `deriveBookingSource()` to shared utility** — Port from `gmail.ts` to a module importable by both gmail tools and booking processor
2. **Enhance `octorate-process-bookings.mjs` for per-channel attribution** — Use Refer column format instead of Room column; output new `bookings-by-channel.csv` alongside existing CSVs
3. **Build commission derivation** — Compute `commission-by-channel.csv` from bookings-by-channel gross values × contractual/estimated commission rates
4. **Build parity capture script for BRIK direct** — Navigate to `book.octorate.com` with scenario dates, extract all-in price
5. **Build parity capture script for Hostelworld** — Navigate to Hostelworld listing with scenario dates, extract all-in price + policy terms
6. **Build parity capture script for Booking.com** — Navigate to Booking.com listing with scenario dates, extract all-in price + policy terms; include semi-automated fallback
7. **Assemble parity pipeline** — Orchestrator script that runs all 3 surface captures and writes `parity-scenarios.csv`
8. **Add tests** — Unit tests for channel attribution, commission derivation, CSV generation; integration test for `buildOperatorCapturedDataBlock()` with populated fixtures
9. **Wire into full pipeline** — Create master script that runs: Octorate export → enhanced processor → channel economics → parity capture → verify CSVs populated

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `2026-02-15-parity-scenarios.csv` — all 9 rows have non-empty `total_price_all_in` values (or explicit "unavailable" with notes)
  - `2026-02-15-bookings-by-channel.csv` — per-channel rows for the last 12 complete check-in months ending at the month prior to `--as-of` (for `--as-of 2026-02-15`: `2025-02`..`2026-01`), with `month` formatted `YYYY-MM`
  - `2026-02-15-commission-by-channel.csv` — matching months and channels with deterministic commission values and take rates (including `gross_value==0` handling)
  - `bookings_by_month.csv` — unchanged format (backward compatibility verified)
  - Running `pnpm startup-loop:s2-market-intel-handoff --business BRIK --as-of 2026-02-15` embeds all 3 CSVs without "present-but-empty" warnings
  - Unit tests pass for extracted processing functions
- Post-delivery measurement plan:
  - Verify S2 deep research prompt contains populated data blocks (not "present-but-empty")
  - Compare automated parity prices against manual spot-check (1 scenario, 1 surface)
  - Verify channel attribution totals match existing `bookings_by_month.csv` aggregates (Direct + Booking.com + Hostelworld = total OTA + Direct)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open questions have safe defaults with documented risk)
- Recommended next step: Proceed to `/lp-plan`. The three open questions (commission rates, automation vs semi-auto, Octorate reports) can be resolved during build with the documented default assumptions.
