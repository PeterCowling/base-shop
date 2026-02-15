---
Type: Plan
Status: Active
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
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: pending
---

# BRIK S2 Data Capture Automation Plan

## Summary
Close the S2 hospitality market-intelligence loop by generating three dated operator-captured CSVs (parity scenarios, bookings-by-channel, commission-by-channel) into `docs/business-os/market-research/BRIK/data/` before running `startup-loop:s2-market-intel-handoff`.

The work is intentionally split into two phases: (1) Octorate channel economics with deterministic month-range + dedupe rules and test coverage, and (2) parity capture scripts with a hybrid/manual mode that remains repeatable under Booking.com bot detection. A CHECKPOINT gate forces reassessment before layering additional automation beyond the MVP reliability contracts.

## Goals
- Produce populated dated CSVs (suffixes below) for any `--as-of`:
  - `YYYY-MM-DD-parity-scenarios.csv`
  - `YYYY-MM-DD-bookings-by-channel.csv`
  - `YYYY-MM-DD-commission-by-channel.csv`
- Ensure parity scenario dates are computed once and passed explicitly (no recompute drift).
- Keep `docs/business-os/strategy/BRIK/data/bookings_by_month.csv` and `net_value_by_month.csv` backward-compatible.
- Add durable tests for the pure processing seams (dedupe, attribution, aggregation, commission derivation) and for S2’s dated-file selector behavior.

## Non-goals
- E2E browser tests against live Booking.com/Hostelworld.
- Changing `buildOperatorCapturedDataBlock()` behavior (it remains a raw embed).
- Attempting “perfect” commission from unknown Octorate exports in MVP.

## Constraints & Assumptions
- Booking.com automation must support `--mode=hybrid|manual` (deterministic prompts + CSV writes) due to bot detection.
- Octorate export automation currently filters by **Create time** and last **90 days**; S2 economics needs last 12 complete **check-in months**, so export parameters must become configurable.
- Currency target is EUR; if not enforceable per run, the row must still be written with `currency_mismatch=true` in `notes`.

## Fact-Find Reference
- Related brief: `docs/plans/brik-s2-data-capture-automation/fact-find.md`
- Key findings:
  - Dated operator CSVs are discovered via `findLatestDatedMarketResearchDataFile()` and embedded verbatim via `buildOperatorCapturedDataBlock()` in `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`.
  - Current market-research CSVs are header-only or scaffold rows with empty values.
  - Octorate processing exists but uses room-name heuristic and create-time month; S2 requires per-channel attribution (Refer) and check-in month.

## Existing System Notes
- S2 discovery/embedding:
  - `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` (dated-file selector + embed; warns on header-only CSV).
- Octorate pipeline:
  - `packages/mcp-server/octorate-export-final-working.mjs` (currently selects "Create time" and exports 90 days).
  - `packages/mcp-server/octorate-process-bookings.mjs` (currently aggregates by create-time month; room-name Direct vs OTA).
  - `packages/mcp-server/octorate-full-pipeline.mjs` (glues export+process; outputs to `docs/business-os/strategy/BRIK/data`).

## Proposed Approach
- Option A (chosen): introduce an S2-specific operator-capture pipeline that is explicit about:
  - scenario inputs (computed once and passed as args)
  - month range (last 12 complete check-in months)
  - dedupe semantics (global by Refer; deterministic row selection)
  - outputs (atomic writes; overwrite only when replacing an empty scaffold)
  This keeps the existing strategy pipeline intact and reduces regression risk.

- Option B: mutate the existing Octorate pipeline in-place to become S2-aware.
  Trade-off: higher blast radius (strategy data consumers) and more chance of breaking `bookings_by_month.csv` assumptions.

Chosen: Option A, while still refactoring shared logic into testable modules so both paths can reuse later without duplicating correctness-critical code.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define shared scenario inputs + parsing helpers (structured S1/S2/S3) | 82% | M | Complete | - | TASK-05 |
| TASK-02 | IMPLEMENT | Make Octorate export configurable for S2 (time filter + date range) | 80% | M | Complete | - | TASK-03 |
| TASK-03 | IMPLEMENT | Implement per-channel bookings aggregation (check-in month, 12-month window, deterministic dedupe) | 82% | L | Pending | TASK-02 | TASK-04, TASK-09 |
| TASK-04 | IMPLEMENT | Commission derivation from config (provenance + edge-case rules) | 84% | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Orchestrator: run export -> economics -> parity captures -> verify outputs (atomic, scaffold replace rules) | 80% | L | Pending | TASK-01, TASK-04, TASK-07, TASK-08 | TASK-09 |
| TASK-06 | IMPLEMENT | Parity capture: Direct (Octorate booking engine) with EUR and `--mode` plumbing | 80% | M | Pending | - | TASK-07, TASK-08 |
| TASK-07 | IMPLEMENT | Parity capture: Hostelworld (deposit + pay-at-property) with EUR + notes contract | 80% | M | Pending | TASK-06 | TASK-05 |
| TASK-08 | IMPLEMENT | Parity capture: Booking.com hybrid/manual mode (open URL + prompt + write row) | 82% | M | Pending | TASK-06 | TASK-05 |
| TASK-09 | IMPLEMENT | Tests: selector + embed fixtures + economics pure seams + notes formatting contracts | 81% | L | Pending | TASK-03, TASK-05 | TASK-10 |
| TASK-10 | CHECKPOINT | Horizon checkpoint: reassess auto-extraction ambitions (Booking.com/Hostelworld) and remaining risks | 95% | S | Pending | TASK-09 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-06 | - | Independent foundation tasks |
| 2 | TASK-03, TASK-07, TASK-08 | Wave 1: TASK-02, TASK-06 | Economics depends on export changes; parity surfaces depend on parity foundation |
| 3 | TASK-04 | Wave 2: TASK-03 | Commission depends on bookings-by-channel |
| 4 | TASK-05 | Wave 3: TASK-04; Wave 2: TASK-07, TASK-08; Wave 1: TASK-01 | Orchestrator ties scenarios + economics + parity scripts together |
| 5 | TASK-09 | Wave 4: TASK-05; Wave 2: TASK-03 | Tests cover both economics and operator-capture integration |
| 6 | TASK-10 | Wave 5: TASK-09 | Checkpoint |

**Max parallelism:** 3 (Wave 1)

**Critical path:** TASK-02 -> TASK-03 -> TASK-04 -> TASK-05 -> TASK-09 -> TASK-10 (6 waves)

**Total tasks:** 10

## Tasks

### TASK-01: Shared Scenario Inputs (Structured)
- **Type:** IMPLEMENT
- **Deliverable:** A small, importable module exposing structured scenario inputs for parity capture (check-in/out/pax) and formatted labels for prompt display.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
  - Primary: `scripts/src/startup-loop/hospitality-scenarios.ts` (new)
  - Primary: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — current `computeHospitalityScenarioDates()` exists; refactor is localized.
  - Approach: 85% — eliminates drift by centralizing scenario inputs.
  - Impact: 82% — small blast radius but must preserve existing prompt strings.
- **Acceptance:**
  - Scenario computation returns S1/S2/S3 structured `{ checkIn: YYYY-MM-DD, checkOut: YYYY-MM-DD, travellers: number }`.
  - Existing prompt output remains semantically identical (date range strings) for `hospitality_direct_booking_ota`.
- **Validation contract:**
  - TC-01: `as-of 2026-02-15` -> structured inputs match existing scaffold dates (S1=2026-07-17..2026-07-19, S2=2026-05-12..2026-05-14, S3=2026-02-24..2026-02-26).
  - TC-02: boundary months around year-rollover produce deterministic year selection.
  - Run/verify: `pnpm --filter ./scripts test -- scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` (add/adjust cases).
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: internal refactor only.
  - Rollback: revert to existing inline function in `s2-market-intelligence-handoff.ts`.
- **Documentation impact:** None.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commit:** 46940b08e1
- **Validation:**
  - Ran: `pnpm --filter ./scripts test -- scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2` — PASS
  - Ran: `pnpm exec eslint scripts/src/startup-loop/s2-market-intelligence-handoff.ts scripts/src/startup-loop/hospitality-scenarios.ts scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` — PASS
  - Ran: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` — PASS
- **Implementation notes:**
  - Extracted hospitality scenario math to `scripts/src/startup-loop/hospitality-scenarios.ts` so parity capture can share the same source of truth.
  - Updated `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` to consume labels via `computeHospitalityScenarioDateLabels()` and added a direct unit test for structured inputs.

### TASK-02: Configurable Octorate Export (S2 Window)
- **Type:** IMPLEMENT
- **Deliverable:** Extend export script to accept explicit filter and dates suitable for S2 month-range contract.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/octorate-export-final-working.mjs`
  - Primary: `packages/mcp-server/octorate-export-args.cjs` (new)
  - Primary: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
  - Secondary: `[readonly] packages/mcp-server/OCTORATE_EXPORT_README.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — existing BIC automation; parameterizing dropdown selection is straightforward.
  - Approach: 80% — keeps current defaults intact while enabling S2.
  - Impact: 80% — export UI is fragile; must not regress current pipeline.
- **Acceptance:**
  - Script supports `--time-filter=create_time|check_in` (default remains `create_time`).
  - Script supports explicit `--start YYYY-MM-DD --end YYYY-MM-DD` (default remains last 90 days).
  - No PII is logged beyond aggregate counts and file paths.
- **Validation contract:**
  - TC-01: CLI arg parsing selects correct option label in dropdown (unit test around mapping + selection predicate).
  - TC-02: date formatting remains DD/MM/YYYY.
  - Validation type: unit/contract tests only (no live site).
  - Run/verify: `pnpm --filter @acme/mcp-server test:startup-loop` (add tests for helpers extracted from `.mjs`).
- **Execution plan:** Red -> Green -> Refactor
- **What would make this ≥90%:** a manual local run confirming Octorate UI still exposes the same option label for "Check in".

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commit:** 11f8ef8166
- **Validation:**
  - Ran: `pnpm --filter @acme/mcp-server test:startup-loop` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
- **Implementation notes:**
  - Added `packages/mcp-server/octorate-export-args.cjs` to parse `--time-filter/--start/--end` with stable defaults (90-day range, create-time).
  - Updated `packages/mcp-server/octorate-export-final-working.mjs` to select the requested time filter and apply the date range.
  - Added contract tests for parsing + option label mapping in `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`.

### TASK-03: Per-Channel Bookings Aggregation (MVP Contract)
- **Type:** IMPLEMENT
- **Deliverable:** Generate `YYYY-MM-DD-bookings-by-channel.csv` into market-research data dir for last 12 complete check-in months.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/octorate-process-bookings.mjs`
  - Primary: `packages/mcp-server/src/startup-loop/octorate-bookings.ts` (new pure module)
  - Primary: `packages/mcp-server/src/startup-loop/__tests__/octorate-bookings.test.ts` (new)
  - Primary: `packages/mcp-server/src/startup-loop/__tests__/fixtures/octorate-reservations-sample.xlsx` (new, anonymized)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-09
- **Confidence:** 82%
  - Implementation: 82% — Excel parsing exists; biggest work is refactor + tests + month-range logic.
  - Approach: 85% — pure module + fixtures prevents future regressions.
  - Impact: 82% — must preserve existing `bookings_by_month.csv` outputs unchanged.
- **Acceptance:**
  - Outputs include channels `Direct`, `Booking.com`, `Hostelworld`, and `Unknown` only when encountered.
  - Month range = last 12 complete check-in months ending month prior to `--as-of` (example in fact-find).
  - Dedup rules match fact-find contract (global by Refer; latest create_time; tie-breakers).
  - `bookings_by_month.csv` and `net_value_by_month.csv` remain identical in schema and semantics.
- **Validation contract:**
  - TC-01: dedupe selector picks the correct canonical row for duplicated Refer.
  - TC-02: month attribution uses Check in (not Create time).
  - TC-03: unknown Refer patterns do not map to Hostelworld.
  - TC-04: month window selection for `--as-of 2026-02-15` yields `2025-02`..`2026-01`.
  - Run/verify: `pnpm --filter @acme/mcp-server test:startup-loop`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Evidence read: `packages/mcp-server/octorate-process-bookings.mjs`, `packages/mcp-server/OCTORATE_EXPORT_README.md`, and `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` parse expectations.
- **What would make this ≥90%:** fixture coverage for real-world Refer patterns observed in the latest export.

### TASK-04: Commission Derivation (Config + Provenance)
- **Type:** IMPLEMENT
- **Deliverable:** Generate `YYYY-MM-DD-commission-by-channel.csv` derived from bookings-by-channel + rates config.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/src/startup-loop/commission.ts` (new)
  - Primary: `packages/mcp-server/src/startup-loop/commission-rates.json` (new)
  - Primary: `packages/mcp-server/src/startup-loop/__tests__/commission.test.ts` (new)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 84%
  - Implementation: 90% — pure math + formatting.
  - Approach: 85% — config-driven with provenance is durable.
  - Impact: 84% — downstream prompt consumers may treat as authoritative; notes must be structured.
- **Acceptance:**
  - `notes` contains `rate`, `rate_source`, `rate_last_verified_at`.
  - Direct rows always `commission_amount=0` and `effective_take_rate=0`.
  - `gross_value==0` handled with `gross_zero=true` and take rate = 0.
- **Validation contract:**
  - TC-01: commission computed from gross * rate with 2dp rounding.
  - TC-02: missing rate for channel fails loudly with actionable error.
  - Run/verify: `pnpm --filter @acme/mcp-server test:startup-loop`.
- **Execution plan:** Red -> Green -> Refactor

### TASK-05: S2 Operator Capture Orchestrator
- **Type:** IMPLEMENT
- **Deliverable:** One CLI entrypoint that writes the three dated CSV artifacts for a given `--as-of` and output dir.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-operator-capture.ts` (new)
  - Secondary: `[readonly] packages/mcp-server/octorate-full-pipeline.mjs`
- **Depends on:** TASK-01, TASK-04, TASK-07, TASK-08
- **Blocks:** TASK-09
- **Confidence:** 80%
  - Implementation: 82% — mostly orchestration + file IO + error handling.
  - Approach: 82% — keeps S2-specific behavior out of the strategy pipeline.
  - Impact: 80% — must be careful about overwrite semantics because scaffold CSVs already exist.
- **Acceptance:**
  - Computes scenario inputs once and passes `--check-in/--check-out/--pax` to all parity capture steps.
  - Writes outputs atomically (`*.tmp` then rename).
  - Overwrite behavior: default no overwrite; allow overwrite only when target is header-only or scaffold-empty (replace-empty-scaffold semantics).
  - On partial capture, writes deterministic rows with `total_price_all_in=unavailable` and diagnostic notes.
- **Validation contract:**
  - TC-01: running S2 handoff after orchestrator embeds all 3 CSVs without "present-but-empty" warnings.
  - TC-02: idempotency: a second run without overwrite fails fast; a run with replace-empty-scaffold only replaces header-only/scaffold outputs.
  - Run/verify: `pnpm --filter ./scripts test -- scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` (extend with fixtures).
- **Execution plan:** Red -> Green -> Refactor

### TASK-06: Parity Capture (Direct)
- **Type:** IMPLEMENT
- **Deliverable:** Script to capture Direct booking-engine price/policy for given scenario args; writes row into parity CSV.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/octorate-parity-direct.mjs` (new)
  - Secondary: `[readonly] packages/mcp-server/src/tools/browser.ts`
- **Depends on:** -
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 80%
  - Implementation: 80% — direct engine is a SPA/redirect; may require careful selector strategy.
  - Approach: 80% — consistent `--mode` plumbing aligns with Booking.com fallback.
  - Impact: 80% — contained to new script outputs.
- **Acceptance:**
  - Supports `--mode=auto|hybrid|manual` and always produces a deterministic output row.
  - Attempts to force EUR; records mismatch in notes.
- **Validation contract:**
  - TC-01: CSV row matches formatting rules (currency, decimals, notes tokens).
  - TC-02: `--mode=manual` prompts and writes row without attempting extraction.
  - Validation type: unit tests for row serialization helpers (no live browsing).

### TASK-07: Parity Capture (Hostelworld)
- **Type:** IMPLEMENT
- **Deliverable:** Script to capture Hostelworld total with deposit + pay-at-property mapping.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/hostelworld-parity.mjs` (new)
- **Depends on:** TASK-06
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 82% — MVP uses hybrid/manual as a first-class path, so bot/DOM variance cannot prevent row creation.
  - Approach: 82% — deposit mapping contract is explicit.
  - Impact: 80% — future-date availability can still be unavailable, but remains deterministic via `unavailable` rows.
- **Acceptance:**
  - `total_price_all_in` represents deposit + pay-at-property when both exist.
  - `deposit_payment` captures the components and terms.
- **Validation contract:**
  - TC-01: output row follows notes/taxes conventions.
  - TC-02: hybrid/manual path produces deterministic row.
- **What would make this ≥90%:** one real run confirming the page exposes deposit+remaining consistently for the listing.

### TASK-08: Parity Capture (Booking.com Hybrid/Manual)
- **Type:** IMPLEMENT
- **Deliverable:** Script that navigates to Booking.com with scenario dates and prompts operator if extraction is blocked.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `packages/mcp-server/bookingcom-parity.mjs` (new)
- **Depends on:** TASK-06
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — hybrid/manual path avoids bot-detection reliance.
  - Approach: 85% — repeatable interface with capture provenance tokens.
  - Impact: 82% — must ensure it still writes output under block conditions.
- **Acceptance:**
  - `--mode=hybrid` attempts auto extraction; on failure, prompts for numeric price + optional policy text and still writes CSV row.
  - Writes `evidence_url` as the final navigated URL.
- **Validation contract:**
  - TC-01: when auto fails, manual prompt path still produces a row with required `notes` tokens.

### TASK-09: Tests and Fixtures (Reliability Gate)
- **Type:** IMPLEMENT
- **Deliverable:** Unit + integration coverage for the seams that will otherwise cause rework.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - Primary: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` (extend)
  - Primary: `scripts/src/startup-loop/__tests__/operator-captured-data.test.ts` (new)
  - Primary: `packages/mcp-server/src/startup-loop/__tests__/octorate-bookings.test.ts` (from TASK-03)
  - Primary: `packages/mcp-server/src/startup-loop/__tests__/commission.test.ts` (from TASK-04)
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-10
- **Confidence:** 81%
  - Implementation: 85% — test patterns exist (temp dir, fixtures).
  - Approach: 82% — focuses on deterministic behavior, not live scraping.
  - Impact: 81% — prevents silent drift in dated-file selection and embed warnings.
- **Acceptance:**
  - `findLatestDatedMarketResearchDataFile()` tested for “latest <= as-of” and “ignore future-dated”.
  - `buildOperatorCapturedDataBlock()` integration test embeds non-empty fixtures without warning.
  - Economics pure seams have unit coverage for dedupe/month-range/channel mapping.
- **Validation contract:**
  - TC-01: tests pass under `JEST_FORCE_CJS=1` presets.
  - Run/verify:
    - `pnpm --filter ./scripts test -- scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
    - `pnpm --filter @acme/mcp-server test:startup-loop`

### TASK-10: Horizon Checkpoint
- **Type:** CHECKPOINT
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 95%
- **Acceptance:**
  - Reassess whether to invest in fully automated extraction for Booking.com/Hostelworld beyond hybrid/manual.
  - Confirm Octorate export filter choice (check-in vs create-time) is producing the intended economics window.
  - If gaps exist, run `/lp-replan` on any remaining or newly added tasks.

## Risks & Mitigations
- Booking.com bot detection blocks automation.
  - Mitigation: hybrid/manual mode is first-class and still writes deterministic CSV rows.
- Octorate export filter/window mismatch causes incorrect month aggregation.
  - Mitigation: make export configurable and enforce month-range contract via tests.
- Existing scaffold CSVs already exist for an `--as-of` date.
  - Mitigation: orchestrator supports replace-empty-scaffold semantics; default remains no overwrite.

## Observability
- Scripts log progress without PII.
- Every written row includes `captured_at` and `capture_mode` tokens.

## Acceptance Criteria (overall)
- [ ] Running the operator capture orchestrator for `--as-of 2026-02-15` produces non-empty economics CSVs and parity rows (or explicit `unavailable`) in `docs/business-os/market-research/BRIK/data/`.
- [ ] Running `pnpm startup-loop:s2-market-intel-handoff --business BRIK --as-of 2026-02-15` embeds the three CSVs without `present-but-empty` warnings.
- [ ] `bookings_by_month.csv` and `net_value_by_month.csv` remain backward-compatible.
- [ ] Targeted tests pass for `./scripts` and `@acme/mcp-server`.

## Decision Log
- 2026-02-15: Chose S2-specific operator capture orchestrator (Option A) to minimize blast radius on existing strategy pipeline outputs.
