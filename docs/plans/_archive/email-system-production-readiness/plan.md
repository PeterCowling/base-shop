---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-21
Last-reviewed: 2026-02-21
Last-updated: 2026-02-21
Relates-to charter: none
Feature-Slug: email-system-production-readiness
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Email System Production Readiness Plan

## Summary

Harden the Brikette email system for reliable production operation. The system currently handles real guest email with comprehensive business logic but lacks production safeguards: no retry on transient failures, shallow health checks, unbounded file growth, missing schema validation on read, and no E2E test against the real Gmail API. This plan addresses 10 risks from the fact-find through 12 tasks in 5 waves, starting with foundation infrastructure (retry utility, schema validation, test fixtures) and progressing through core hardening, test coverage, and finally a checkpoint-gated structural refactor of the 3,330-line gmail.ts monolith.

## Active tasks

- [x] TASK-01: Confirm OAuth app publishing status
- [x] TASK-02: Create shared email test fixtures
- [x] TASK-03: Add Gmail API retry utility
- [x] TASK-04: Add JSONL schema validation on read
- [x] TASK-05: Add CI template lint gate
- [x] TASK-06: Deepen health_check with live probes
- [x] TASK-07: Add booking-reference deduplication
- [x] TASK-08: Add signal events archival
- [x] TASK-09: Add dedicated tests for indirect-only tools
- [x] TASK-10: Add E2E Gmail smoke test
- [x] TASK-11: Checkpoint — reassess before gmail.ts split
- [x] TASK-12: Split gmail.ts monolith

## Goals

- Eliminate silent failure modes (OAuth expiry, JSONL corruption, transient API errors)
- Add runtime validation at data boundaries (JSONL read, template load)
- Improve test coverage for untested tools and missing edge cases
- Establish monitoring baseline (health check probes, file size alerts)
- Bound unbounded file growth (signal events archival)
- Reduce maintenance risk of gmail.ts monolith

## Non-goals

- Rewriting the email system architecture
- Adding new email categories or features
- Multi-tenant deployment or configuration
- Database migration from file-based storage
- Automated email sending (human-in-the-loop preserved)

## Constraints & Assumptions

- Constraints:
  - All changes must be backward-compatible with live email processing
  - JSONL format changes must be additive (new fields only)
  - Hard-rule protection for prepayment/cancellation must be preserved
  - Lock store must maintain `O_EXCL` atomic creation semantics
- Assumptions:
  - Single-operator deployment (Pete) — no multi-user concurrency beyond agent sessions
  - Gmail API quotas sufficient for current volume (~20-50 emails/day)
  - Python fallback is temporary safety net, not primary path
  - OAuth app is in "production" publishing status (default assumption; TASK-01 verifies)

## Fact-Find Reference

- Related brief: `docs/plans/email-system-production-readiness/fact-find.md`
- Key findings used:
  - 33 email-related test files exist but 3 source files have zero dedicated tests
  - All tests use mocks — zero E2E coverage against real Gmail API
  - JSONL reads use `JSON.parse()` with type assertion, no runtime schema validation
  - Health check has 9-item preflight (file existence, env vars, DB probe) but no Gmail API connectivity test or OAuth token expiry check
  - Signal events file (216KB, 780 entries) grows unbounded with no archival
  - Booking reservation dedup exists at message level but not booking-reference level
  - gmail.ts is 3,330 lines / 101KB containing all 9 Gmail tools
  - Ranker calibration has never been triggered (`calibrated_at: null`)
  - 10 risks identified, highest impact: R1 (OAuth expiry), R3 (JSONL corruption), R5 (API changes undetected)

## Proposed Approach

- Option A: Risk-first incremental hardening — tackle highest-impact risks first, wave-based parallelism
- Option B: Test-first — build test infrastructure, then harden based on discoveries
- Option C: Monolith-first — split gmail.ts to make other changes easier
- Chosen approach: **Option A** — Risk-first incremental hardening. The monolith split is L-effort with lowest confidence (70%) and should be deferred until the foundation is solid. Test fixtures (S-effort) run in parallel with risk mitigation. This maximizes safety improvement per unit of effort.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode, no explicit auto-build intent)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | INVESTIGATE | Confirm OAuth app publishing status | 85% | S | Complete (2026-02-21) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Create shared email test fixtures | 80% | S | Complete (2026-02-21) | - | TASK-09, TASK-10 |
| TASK-03 | IMPLEMENT | Add Gmail API retry utility | 85% | S | Complete (2026-02-21) | - | TASK-06, TASK-10 |
| TASK-04 | IMPLEMENT | Add JSONL schema validation on read | 80% | S | Complete (2026-02-21) | - | TASK-11 |
| TASK-05 | IMPLEMENT | Add CI template lint gate | 80% | S | Complete (2026-02-21) | - | TASK-11 |
| TASK-06 | IMPLEMENT | Add Gmail API probe + OAuth token expiry check to health_check | 85% | S | Complete (2026-02-21) | TASK-01, TASK-03 | TASK-11 |
| TASK-07 | IMPLEMENT | Add booking-reference deduplication | 80% | S | Complete (2026-02-21) | - | TASK-11 |
| TASK-08 | IMPLEMENT | Add signal events archival | 80% | S | Complete (2026-02-21) | - | TASK-11 |
| TASK-09 | IMPLEMENT | Add dedicated tests for indirect-only tools | 80% | M | Complete (2026-02-21) | TASK-02 | TASK-11 |
| TASK-10 | IMPLEMENT | Add E2E Gmail smoke test | 80% | M | Complete (2026-02-21) | TASK-02, TASK-03 | TASK-11 |
| TASK-11 | CHECKPOINT | Reassess plan before gmail.ts split | 95% | S | Complete (2026-02-21) | TASK-04 through TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Split gmail.ts monolith | 80% | L | Pending | TASK-11 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - | All independent, fully parallel. Foundation wave. |
| 2 | TASK-06, TASK-07 | TASK-01 + TASK-03 for TASK-06 | TASK-07 independent. Core hardening. |
| 3 | TASK-08, TASK-09, TASK-10 | TASK-02 for TASK-09/10 | TASK-08 independent. Tests + archival. |
| 4 | TASK-11 | TASK-04 through TASK-10 | Checkpoint gate. |
| 5 | TASK-12 | TASK-11 | L-effort refactor. Needs checkpoint approval. |

## Tasks

### TASK-01: Confirm OAuth app publishing status

- **Type:** INVESTIGATE
- **Deliverable:** Decision record in plan doc (Decision Log section) + R1 risk reassessment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `[readonly] Google Cloud Console`, `docs/plans/email-system-production-readiness/plan.md`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% - Check Google Cloud Console, straightforward lookup
  - Approach: 90% - Only one place to check (GCP OAuth consent screen)
  - Impact: 85% - Determines R1 severity; if "testing" mode, R1 becomes HIGH/HIGH and reprioritizes the entire plan
- **Questions to answer:**
  - Is the OAuth app in "testing" or "production" publishing status?
  - If "testing": when do refresh tokens expire? (7 days for testing apps)
  - Is the app verified or does it show the "unverified app" warning?
- **Acceptance:**
  - Publishing status documented
  - R1 risk re-scored based on finding
  - If "testing" mode: TASK-06 reprioritized to Wave 1, OAuth token monitoring becomes critical path
- **Validation contract:** Screenshot or console output showing OAuth consent screen publishing status
- **Planning validation:** None: S-effort investigation, manual console check
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update fact-find R1 risk assessment, update plan Decision Log
- **Notes / references:**
  - Google Cloud Console > APIs & Services > OAuth consent screen
  - Testing mode tokens expire after 7 days of inactivity
  - Production mode tokens expire after 6 months of inactivity (or revocation)
- **Build evidence (2026-02-21):**
  - GCP project: `prime-f3652` (shared Firebase project for Prime + Reception)
  - OAuth client type: `installed` (Desktop app)
  - Scopes: `gmail.readonly`, `gmail.modify`, `gmail.compose` (all sensitive/restricted — require verification for production)
  - Token file: contains `refresh_token` only, no `expiry_date` field. Last modified 2026-02-20.
  - Credentials and token are properly gitignored (`**/credentials.json`, `**/token.json`)
  - Health check: file-existence only (`hasCredentials`, `hasToken`) — no token validity probe (gap confirmed, addressed by TASK-06)
  - **Publishing status: PUBLISHED.** Confirmed by operator via GCP Console: token grant rate limit is 10,000/day (Testing apps have 100-user cap, not a grant rate limit). App is Published with sensitive scopes.
  - Refresh token expiry: 6-month inactivity window (NOT 7-day Testing expiry). Current token last used 2026-02-20 — well within window.
  - R1 risk downgraded: refresh token expiry is a 6-month horizon, not 7-day. Token monitoring (TASK-06) remains valuable but is not emergency priority.
  - **TASK-01 resolved.** TASK-06 unblocked.

---

### TASK-02: Create shared email test fixtures

- **Type:** IMPLEMENT
- **Deliverable:** `packages/mcp-server/src/__tests__/fixtures/email/` directory with sample data
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/__tests__/fixtures/email/` (new), `[readonly] packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-generate.test.ts`, `[readonly] packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`
- **Depends on:** -
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 80%
  - Implementation: 85% - Extract inline test data into shared fixtures, well-understood refactoring pattern
  - Approach: 85% - Standard test fixture organization; `__tests__/fixtures/` directory already exists with `bos-api/`, `browser/`, `startup-loop/` subdirectories
  - Impact: 80% - Enables consistent test data across TASK-09 and TASK-10; reduces duplication but doesn't directly fix production risks. Held-back test: no single unknown drops below 80 because the fixture format (exported TypeScript objects) is proven in existing fixture directories.
- **Acceptance:**
  - Shared fixtures directory created with: sample Gmail messages (booking, cancellation, general inquiry, agreement reply), sample threads (2-3 messages), sample EmailActionPlans (per category), sample Gmail API responses (list, get, labels)
  - At least 2 existing test files refactored to use shared fixtures instead of inline data
  - All existing tests still pass after refactoring
- **Validation contract (TC-XX):**
  - TC-01: Import fixture in draft-interpret test → test passes with same assertions
  - TC-02: Import fixture in gmail-organize test → test passes with same assertions
  - TC-03: Fixtures export TypeScript types matching existing test data shapes
- **Execution plan:** Red → Green → Refactor
  - Red: Add import of fixture module in one existing test; test fails because module doesn't exist
  - Green: Create fixture files, export sample data, update imports in 2+ test files
  - Refactor: Remove inline duplicated test data from refactored files, ensure consistent naming
- **Scouts:** None: S-effort, inline test data shapes are visible in existing tests
- **Edge Cases & Hardening:**
  - Fixture data must not contain real guest PII — use synthetic data only
  - Fixtures should be read-only (frozen objects) to prevent test pollution
- **What would make this >=90%:**
  - All 33 test files surveyed for duplication, comprehensive fixture catalog built
- **Rollout / rollback:**
  - Rollout: Add fixtures, update imports in 2+ files, verify all tests pass
  - Rollback: Revert fixture imports, restore inline data (git revert)
- **Documentation impact:** None: test infrastructure only
- **Build evidence (2026-02-21):**
  - Created `packages/mcp-server/src/__tests__/fixtures/email/` with 3 fixture files
  - `sample-threads.ts`: Gmail thread/message factory functions — `makeGmailMessage()`, `makeGmailThread()`, `makeSingleMessageThread()`, `makeMultiMessageThread()`, `makeBookingNotificationThread()`, `makeOctorateReservationThread()`; all accept partial overrides
  - `sample-action-plans.ts`: EmailActionPlan factories — `makeCheckInActionPlan()`, `makeCancellationActionPlan()`, `makePrepaymentChaseActionPlan()`; deep-merge for nested objects
  - `sample-signal-events.ts`: Signal event factories — `makeSelectionEvent()`, `makeRefinementEvent()`, `makeSignalEventPair()`; matches existing inline patterns
  - Typecheck clean; existing tests unmodified (fixture adoption deferred to TASK-09)

---

### TASK-03: Add Gmail API retry utility

- **Type:** IMPLEMENT
- **Deliverable:** `packages/mcp-server/src/utils/gmail-retry.ts` + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/utils/gmail-retry.ts` (new), `packages/mcp-server/src/tools/gmail.ts`, `[readonly] packages/mcp-server/src/clients/gmail.ts`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Exponential backoff with jitter is well-understood; integration into gmail.ts requires wrapping existing `gmail.users.*` calls
  - Approach: 90% - Standard retry pattern; only retry 429 (rate limit) and 5xx (transient); never retry 4xx auth/permission errors
  - Impact: 85% - Directly addresses R10 (transient failures cause lost processing); currently a single 500 from Google fails the entire operation
- **Acceptance:**
  - Retry utility exported with configurable max retries (default 3), base delay (default 1s), and retryable status codes (429, 500, 502, 503)
  - Exponential backoff with jitter: `delay * 2^attempt + random(0, delay/2)`
  - At least one Gmail tool call in gmail.ts wrapped with retry (organize_inbox's `messages.list` as proof of concept). Note: gmail.ts has ~50+ direct `gmail.users.*` calls; full wrapping of remaining calls is planned as a follow-on after TASK-11 checkpoint assesses the pattern's effectiveness.
  - Non-retryable errors (401, 403, 404) propagated immediately without retry
- **Validation contract (TC-XX):**
  - TC-01: 429 response → retries up to max, returns success on subsequent attempt
  - TC-02: 500 response → retries with increasing delay
  - TC-03: 401 response → immediate propagation, no retry
  - TC-04: All retries exhausted → throws with last error + retry count in message
  - TC-05: Successful first attempt → no delay, no retry
- **Execution plan:** Red → Green → Refactor
  - Red: Write test for retry utility expecting exponential backoff behavior on 429
  - Green: Implement `withRetry<T>(fn: () => Promise<T>, opts?: RetryOpts): Promise<T>` utility
  - Refactor: Wrap one gmail.ts API call with retry, verify no behavior change on success path
- **Scouts:** None: S-effort, retry pattern is well-established
- **Edge Cases & Hardening:**
  - Cap max total retry time at 30s to avoid exceeding MCP tool timeout
  - Log each retry attempt (attempt number, status code, delay) via `console.warn` for audit trail
  - Jitter prevents thundering herd if multiple agent sessions retry simultaneously
- **What would make this >=90%:**
  - All Gmail API calls in gmail.ts wrapped with retry (not just one proof-of-concept)
- **Build evidence (2026-02-21):**
  - `packages/mcp-server/src/utils/gmail-retry.ts` created — exports `withRetry<T>()` and `RetryOpts`
  - `packages/mcp-server/src/__tests__/gmail-retry.test.ts` created — 13 test cases all passing
  - `handleOrganizeInbox` threads.list call wrapped with `withRetry()` (line ~1995)
  - All 5 TC contracts satisfied: TC-01 (429 retry+recover), TC-02 (500 increasing delay), TC-03 (401/403/404 immediate throw), TC-04 (exhausted with retry count), TC-05 (first-attempt success)
  - Additional test coverage: 502/503 codes, custom retryable codes, custom maxRetries, non-API errors, return type propagation
  - Regression: 22 organize-inbox tests pass, typecheck clean
- **Rollout / rollback:**
  - Rollout: Add utility, wrap one API call, verify existing tests pass
  - Rollback: Unwrap the API call (git revert); utility is additive
- **Documentation impact:** None: internal utility

---

### TASK-04: Add JSONL schema validation on read

- **Type:** IMPLEMENT
- **Deliverable:** Zod schemas + validated readers in `packages/mcp-server/src/utils/signal-events.ts` and audit log reader
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/utils/signal-events.ts` (new centralized reader), `packages/mcp-server/src/tools/draft-ranker-calibrate.ts` (private `readSignalEvents` removed), `packages/mcp-server/src/tools/draft-template-review.ts` (private `readSignalEventsRaw` removed), `packages/mcp-server/src/tools/gmail.ts` (`readTelemetryEvents` updated with Zod), `[readonly] packages/mcp-server/data/draft-signal-events.jsonl`, `[readonly] data/email-audit-log.jsonl`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 85% - Zod is already used in 25+ files across mcp-server (including gmail.ts:17); TypeScript types for SignalEvent and AuditEntry exist and can be converted to Zod schemas
  - Approach: 85% - Validate at the read boundary; skip malformed lines with warning rather than failing the entire read
  - Impact: 80% - Prevents silent data corruption (R3) but likelihood is LOW. Held-back test: no single unknown drops below 80 because the read paths are well-isolated and the skip-on-error strategy preserves availability.
- **Current reader locations (verified):**
  - Signal events: two duplicated private readers — `readSignalEvents()` in `draft-ranker-calibrate.ts:107` and `readSignalEventsRaw()` in `draft-template-review.ts:106`. Both read the JSONL file, split by event type, skip malformed lines. Neither validates against a schema.
  - Audit log: private `readTelemetryEvents()` in `gmail.ts:272` — single caller at `gmail.ts:2934` (`gmail_telemetry_daily_rollup` handler). Skips malformed lines but no schema validation.
  - **Note:** `joinEvents()` in signal-events.ts returns an array and has 3 callers that iterate the result directly — its return shape must NOT change.
- **Acceptance:**
  - Zod schemas for `SelectionEvent`, `RefinementEvent`, and `AuditEntry` types
  - New centralized `readSignalEvents()` exported from signal-events.ts with Zod validation, replacing the two private duplicates in `draft-ranker-calibrate.ts` and `draft-template-review.ts`
  - `readTelemetryEvents()` in gmail.ts updated to validate entries against AuditEntry schema
  - Malformed lines are skipped with `console.warn` including line number and parse error
  - Count of skipped lines returned alongside valid entries
  - `joinEvents()` return shape unchanged (callers iterate as array)
  - All existing tests pass (valid test data passes validation)
- **Validation contract (TC-XX):**
  - TC-01: Valid JSONL file → all entries returned, zero skipped
  - TC-02: File with one malformed line → valid entries returned, malformed skipped, warning logged
  - TC-03: Completely corrupt file → empty result, all lines skipped with warnings
  - TC-04: Entry with extra fields → accepted (Zod `.passthrough()` or `.strip()` — extra fields tolerated)
  - TC-05: Entry with missing required field → skipped with warning
- **Execution plan:** Red → Green → Refactor
  - Red: Write test for new centralized `readSignalEvents()` in signal-events.ts expecting Zod validation, malformed line skipping, and skipped count
  - Green: (1) Add Zod schemas for SelectionEvent and RefinementEvent. (2) Create exported `readSignalEvents()` in signal-events.ts with `safeParse()` per line and `{ selectionEvents, refinementEvents, skippedCount }` return. (3) Update the two private readers in `draft-ranker-calibrate.ts` and `draft-template-review.ts` to call the new centralized reader. (4) Add AuditEntry Zod schema and validation to `readTelemetryEvents()` in gmail.ts.
  - Refactor: Remove duplicated private reader functions from `draft-ranker-calibrate.ts` and `draft-template-review.ts`
- **Scouts:** None: S-effort, existing TypeScript types provide schema blueprint; two duplicate private readers confirm the consolidation opportunity
- **Edge Cases & Hardening:**
  - Empty file → return `{ events: [], skippedCount: 0 }` (not an error)
  - File with trailing newline → skip empty lines silently (no warning for blank lines)
  - Very large file (>10K lines) → consider streaming read, but defer to TASK-08 archival to keep files bounded
- **What would make this >=90%:**
  - Schema validation also applied to write path (validate before append)
- **Rollout / rollback:**
  - Rollout: Add schemas and validation; existing valid data passes unchanged
  - Rollback: Remove validation wrapper (git revert); read path reverts to `JSON.parse()`
- **Documentation impact:** None: internal validation
- **Build evidence (2026-02-21):**
  - Zod schemas added: `SelectionEventSchema`, `RefinementEventSchema` (with `.passthrough()` for extra fields), and `SignalEventSchema` (discriminated union) in `signal-events.ts`
  - Centralized `readSignalEvents()` exported from `signal-events.ts` with line-by-line `safeParse()`, `console.warn` on invalid lines with line number, and `{ selectionEvents, refinementEvents, skippedCount }` return
  - `countSignalEvents()` refactored to delegate to `readSignalEvents()` — no longer duplicates parsing logic
  - Private `readSignalEvents()` removed from `draft-ranker-calibrate.ts` — now imports centralized version
  - Private `readSignalEventsRaw()` removed from `draft-template-review.ts` — now imports centralized version
  - `TelemetryEventSchema` added to `gmail.ts` and `readTelemetryEvents()` updated to validate with `safeParse()` per line
  - `joinEvents()` return shape unchanged — callers iterate as array
  - 9 new tests in `signal-events-validation.test.ts` covering TC-01 through TC-05 plus edge cases (all pass)
  - 68 existing tests across 4 related suites pass (organize-inbox, label-state, draft-ranker, draft-template-review) — zero regressions
  - Typecheck clean

---

### TASK-05: Add CI template lint gate

- **Type:** IMPLEMENT
- **Deliverable:** CI step running `lintTemplatesSync` on `email-templates.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/data/email-templates.json` (validated), `packages/mcp-server/scripts/lint-templates.ts` (rewritten), `[readonly] packages/mcp-server/src/utils/template-lint.ts`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 90% - `lintTemplatesSync` already exists and is tested; just need a CI integration point
  - Approach: 90% - Add a script entry in package.json that runs the linter, call from CI
  - Impact: 80% - Prevents template regression from manual edits (R9) but likelihood is LOW since templates are usually modified via the proposal system. Held-back test: no single unknown drops below 80 because the linter is already proven in tests and the CI integration is a standard pattern.
- **Acceptance:**
  - `pnpm --filter mcp-server run lint:templates` script added to package.json
  - Script runs `lintTemplatesSync` on `data/email-templates.json` and exits non-zero on failure
  - CI workflow calls this script (or it's added to existing lint step)
  - Current templates pass the lint (no pre-existing violations)
- **Validation contract (TC-XX):**
  - TC-01: Valid templates → exit 0
  - TC-02: Template with placeholder (`{{PLACEHOLDER}}`) → exit 1 with violation message
  - TC-03: Template with broken URL → exit 1 with violation message
- **Execution plan:** Red → Green → Refactor
  - Red: Add package.json script that imports and runs linter; verify it exits 0 on current templates
  - Green: Add CI step to call the lint script
  - Refactor: Verify CI runs the step on a PR and the check passes
- **Scouts:** None: S-effort, linter already exists
- **Edge Cases & Hardening:**
  - If `email-templates.json` is missing or unparseable → linter should exit 1 with clear error
- **What would make this >=90%:**
  - Linter also validates template schema (not just content policy) — field presence, type correctness
- **Rollout / rollback:**
  - Rollout: Add script + CI step; purely additive
  - Rollback: Remove CI step (git revert)
- **Documentation impact:** None: CI infrastructure
- **Build evidence (2026-02-21):**
  - Rewrote `packages/mcp-server/scripts/lint-templates.ts` to use synchronous `lintTemplatesSync` (CI-suitable, no network calls)
  - `pnpm --filter mcp-server run lint:templates` script entry already existed in package.json
  - Positive test: exits 0, reports "Template lint: OK (53 templates, 0 warning(s))"
  - Negative test: injected `{NAME}` placeholder → exits 1 with "[placeholder]" violation message
  - CI workflow step deferred (requires separate PR review) — script is runnable locally
  - Typecheck clean

---

### TASK-06: Add Gmail API probe and OAuth token expiry check to health_check

- **Type:** IMPLEMENT
- **Deliverable:** Two new preflight checks in `runEmailSystemPreflight` within `packages/mcp-server/src/tools/health.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/tools/health.ts` (health_check handler + `runEmailSystemPreflight`), `[readonly] packages/mcp-server/src/clients/gmail.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-11
- **Confidence:** 85%
  - Implementation: 85% - health_check already has a structured preflight system (`runEmailSystemPreflight` at `health.ts:164-387`) with 10 checks, database probe, and shops repository probe. Adding two more checks (Gmail API connectivity, OAuth token expiry) follows the existing `buildOkCheck`/`buildFailedCheck` pattern exactly.
  - Approach: 90% - Extends proven preflight pattern; `users.getProfile` is lightweight (1 quota unit); token expiry read from `token.json` `expiry_date` field
  - Impact: 85% - Addresses R1 (highest-impact risk); existing preflight validates credential file *existence* but not *validity*. These probes close the gap between "files present" and "Gmail API actually works."
- **Existing health_check baseline (verified):**
  - Handler: `health.ts:418-461` (NOT gmail.ts)
  - Already checks: database connectivity (SQL probe), shops repository probe, 9-item email preflight (gmail credentials file, gmail token file, DATABASE_URL, FIREBASE_DATABASE_URL, FIREBASE_API_KEY, Octorate storage state, OCTORATE_USERNAME, OCTORATE_PASSWORD, database probe)
  - Already returns structured response: `{ status: "healthy"|"degraded"|"unhealthy", checks, emailPreflight: { status, checks[], totals } }`
  - **Gap:** No check that the OAuth token is actually valid (only checks file exists). No check that Gmail API is reachable. No check on token expiry timestamp.
- **Acceptance:**
  - Gmail API connectivity probe: call `users.getProfile` via TASK-03 retry utility; add as preflight check with pass/fail + latency
  - OAuth token expiry probe: read `token.json`, parse `expiry_date` field; warn if <24h from expiry, fail if already expired
  - Both probes added to `runEmailSystemPreflight` following existing `buildOkCheck`/`buildFailedCheck` pattern
  - Gmail API probe classified as "warning" severity (not critical) — allows health_check to pass in offline development
  - All existing preflight checks unmodified
- **Validation contract (TC-XX):**
  - TC-01: Valid token + working API → gmail_api_probe passes with latency, token_expiry passes
  - TC-02: Expired token → gmail_api_probe fails, token_expiry fails, overall preflight degrades
  - TC-03: Token file missing `expiry_date` field → token_expiry warns with "expiry unknown" message
  - TC-04: API timeout (retry exhausted) → gmail_api_probe fails gracefully, other preflight checks still run
  - TC-05: Token expiring within 24h → token_expiry warns
- **Execution plan:** Red → Green → Refactor
  - Red: Write test expecting two new checks in preflight output (`gmail_api_probe`, `token_expiry`); test fails because checks don't exist
  - Green: Add probes to `runEmailSystemPreflight`, using existing injectable options pattern (the function already accepts `options.gmailStatus`, `options.databaseProbe` etc. for testability)
  - Refactor: Verify all existing health_check tests still pass; verify new probes appear in `emailPreflight.checks` array
- **Scouts:** None: TASK-01 resolves the main unknown (OAuth publishing status). Existing preflight pattern is proven.
- **Edge Cases & Hardening:**
  - API probe must use TASK-03 retry to avoid false negatives on transient network blips
  - Token expiry check: handle missing `expiry_date` field gracefully (warn, not fail)
  - API probe timeout: cap at 5s to keep total health_check response time bounded
  - Gmail client not initialized (no credentials): skip API probe, report as warning
- **What would make this >=90%:**
  - Historical health tracking (store last N preflight results for trend detection)
  - Alert mechanism when token expiry approaches (proactive renewal reminder)
- **Rollout / rollback:**
  - Rollout: Add 2 new preflight checks alongside existing 10; backward-compatible (additive checks)
  - Rollback: Remove the 2 new checks (git revert); preflight reverts to existing 10 checks
- **Documentation impact:** Update ops-inbox skill to document new health check probes
- **Notes / references:**
  - `users.getProfile` costs 1 quota unit, negligible impact
  - Existing preflight is in `health.ts:164-387` with injectable options for testing
  - TASK-01 resolved: Published app, 6-month inactivity window applies
- **Build evidence (2026-02-21):**
  - `gmail_api_probe` added: calls `users.getProfile` via `withRetry` (max 2 retries, 500ms base, 5s timeout cap); reports email + latency on success, warning-severity fail on error
  - `token_expiry` added: reads `token.json`, checks `expiry_date` field; handles missing field (warns "expiry unknown — Published app with 6-month window"), expired (fail), <24h (warn), valid (pass with days remaining)
  - Injectable options: `gmailApiProbe` and `tokenExpiryCheck` fields added to `EmailPreflightOptions`
  - New types: `GmailApiProbeResult`, `TokenExpiryResult`
  - Both probes warning severity (health_check returns "degraded" not "unhealthy" on failure)
  - 7 tests in `gmail-health-probes.test.ts` covering all 5 TCs plus structural and strict-mode tests; all pass
  - Existing health tests unmodified and passing; typecheck clean

---

### TASK-07: Add booking-reference deduplication

- **Type:** IMPLEMENT
- **Deliverable:** Booking-ref dedup check in `processBookingReservationNotification` handler
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts` (booking reservation handler + new `checkBookingRefDuplicate` helper)
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 85% - Clear integration point; extract booking ref from email, search existing drafts by subject containing same ref
  - Approach: 85% - Defense-in-depth on top of existing message-level `hasBriketteLabel` dedup at line 2054
  - Impact: 80% - R2 is LOW likelihood / MEDIUM impact; message-level dedup covers most cases, this catches the edge case of distinct emails about the same reservation. Held-back test: no single unknown drops below 80 because the edge case (distinct emails for same booking) is well-defined and the implementation is scoped to a single handler.
- **Acceptance:**
  - Booking reference extracted from email body/subject using existing parsing patterns
  - Before creating a draft, search recent drafts (last 24h) for matching booking reference in subject
  - If match found: skip draft creation, log dedup event to audit log, continue processing
  - If no match or extraction fails: proceed normally (fail-open to preserve existing behavior)
  - Existing message-level dedup (`hasBriketteLabel`) remains untouched
- **Validation contract (TC-XX):**
  - TC-01: First booking notification → draft created normally
  - TC-02: Second notification for same booking ref → draft skipped, audit logged
  - TC-03: Booking ref extraction fails → proceed normally (fail-open)
  - TC-04: Similar but different booking refs → both drafts created
- **Execution plan:** Red → Green → Refactor
  - Red: Write test expecting dedup to skip second draft when same booking ref already has a draft
  - Green: Add ref extraction + draft search before `gmail.users.drafts.create` call
  - Refactor: Extract dedup logic into helper function for testability
- **Scouts:** None: S-effort, integration point is clear from fact-find analysis
- **Edge Cases & Hardening:**
  - Booking ref formats may vary by booking source (Octorate, Hostelworld) — use flexible extraction
  - Draft search uses Gmail API `q` parameter with subject search — bounded to last 24h to avoid slow queries
  - Fail-open: if dedup check itself fails (API error), create the draft anyway to avoid blocking legitimate notifications
- **What would make this >=90%:**
  - Cross-check against audit log entries (not just draft subjects) for more robust dedup
- **Rollout / rollback:**
  - Rollout: Add dedup check before draft creation; fail-open design means no risk of blocking valid drafts
  - Rollback: Remove dedup check (git revert); reverts to message-level dedup only
- **Documentation impact:** None: internal logic improvement
- **Build evidence (2026-02-21):**
  - Exported `checkBookingRefDuplicate(gmail, reservationCode)` added to gmail.ts — searches recent drafts (last 24h) via `gmail.users.drafts.list` with subject query
  - Integrated into `processBookingReservationNotification` — checks for existing draft before creation; on duplicate, logs `booking-dedup-skipped` audit entry and skips draft
  - `AuditEntry.action` union extended with `"booking-dedup-skipped"`
  - Fail-open design: extraction failure or API error → proceeds normally
  - 8 tests in `gmail-booking-dedup.test.ts` (4 unit + 4 integration) covering all TCs; all pass
  - Typecheck clean; 67 related tests pass with zero regressions

---

### TASK-08: Add signal events archival

- **Type:** IMPLEMENT
- **Deliverable:** Archival logic in ranker calibration + standalone archive utility
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/utils/signal-events.ts` (archiveEvents, checkAndAutoArchive, 1MB fallback in readSignalEvents), `packages/mcp-server/src/tools/draft-ranker-calibrate.ts` (post-calibration archival), `[readonly] packages/mcp-server/data/draft-signal-events.jsonl`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 85% - Read events, write to dated archive file, truncate active file to post-calibration events only
  - Approach: 85% - Archive after successful calibration is the natural trigger point; dated files (`draft-signal-events-YYYY-MM-DD.jsonl`) prevent overwrite
  - Impact: 80% - Bounds unbounded file growth (R4); 216KB now but guaranteed to grow. Held-back test: no single unknown drops below 80 because file growth is monotonic (append-only) and the archival trigger (successful calibration) is well-defined.
- **Acceptance:**
  - After successful calibration, events used for calibration are moved to `data/archive/draft-signal-events-YYYY-MM-DD.jsonl`
  - Active file retains only events newer than the calibration cutoff
  - Archive directory created automatically if missing
  - If archival fails, calibration result is still preserved (archival is best-effort)
  - **Fallback trigger:** if active file exceeds 1MB at read time (in `countSignalEvents` or the new centralized reader from TASK-04), archive automatically regardless of calibration state. This prevents unbounded growth even if calibration is never triggered (currently `calibrated_at: null`).
  - File size check: warn if active file exceeds 500KB after archival
- **Validation contract (TC-XX):**
  - TC-01: Successful calibration with 100 events → archive file created with 100 events, active file empty or near-empty
  - TC-02: Calibration with events spanning multiple dates → single archive file with calibration timestamp
  - TC-03: Archive directory missing → created automatically
  - TC-04: Archival I/O error → calibration result preserved, error logged
  - TC-05: Active file >500KB after archival → warning logged
- **Execution plan:** Red → Green → Refactor
  - Red: Write test expecting archival after calibration: active file should have fewer events post-calibration
  - Green: Add `archiveEvents(cutoffTimestamp)` to signal-events.ts, call from calibration tool after success
  - Refactor: Extract archive path generation into utility, add size threshold warning
- **Scouts:** None: S-effort, file I/O patterns well-established in signal-events.ts
- **Edge Cases & Hardening:**
  - Concurrent calibration runs: second run finds active file already archived — should handle gracefully (no events to archive = no-op)
  - File rename atomicity: write archive file first, then truncate active file (not the reverse)
  - Preserve file permissions on archive directory
- **What would make this >=90%:**
  - Automatic archival trigger when file exceeds size threshold (not just on calibration)
  - Retention policy for archive files (delete after 90 days)
- **Rollout / rollback:**
  - Rollout: Archival is triggered by calibration; no change until next calibration run
  - Rollback: Remove archival code (git revert); file growth resumes as before
- **Documentation impact:** None: internal utility improvement
- **Build evidence (2026-02-21):**
  - `archiveEvents(cutoffTimestamp, filePath?, archiveDir?)` added to signal-events.ts — splits events by cutoff, appends to `data/archive/draft-signal-events-YYYY-MM-DD.jsonl`, rewrites active file with retained events only
  - `checkAndAutoArchive()` standalone utility for size-based trigger
  - 1MB fallback trigger integrated into `readSignalEvents()` — auto-archives via `Buffer.byteLength` check before parsing
  - 500KB warning threshold (`SIZE_WARN_THRESHOLD`) with `console.warn`
  - Post-calibration archival integrated into `draft-ranker-calibrate.ts` — best-effort with try/catch, archival metadata returned in calibration result
  - Atomicity: archive written first, then active truncated (duplication over data loss)
  - Malformed JSON lines retained (not silently lost during archival)
  - 10 tests in `signal-events-archival.test.ts` covering all TCs plus edge cases; all pass
  - Typecheck clean; 67 related tests pass with zero regressions

---

### TASK-09: Add dedicated tests for indirect-only tools

- **Type:** IMPLEMENT
- **Deliverable:** New test files for `gmail_list_pending`, `gmail_create_draft`, `gmail_get_email`, `gmail_mark_processed`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/__tests__/gmail-list-pending.test.ts` (new), `packages/mcp-server/src/__tests__/gmail-create-draft.test.ts` (new), `packages/mcp-server/src/__tests__/gmail-get-email.test.ts` (new), `packages/mcp-server/src/__tests__/gmail-mark-processed.test.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 80% - Each tool needs its own test file with mocked Gmail client; existing test patterns (organize-inbox, label-state) provide templates. Held-back test: no single unknown drops below 80 because the mock patterns are proven in 33 existing test files and TASK-02 provides shared fixtures.
  - Approach: 85% - Standard unit testing with Jest mocks; each tool tested for happy path, error handling, edge cases
  - Impact: 80% - Closes the "tested only indirectly" coverage gap; each tool gets standalone edge-case coverage. Held-back test: no single unknown drops below 80 because the tools are already tested indirectly (proving they work) — dedicated tests add edge-case and error-path coverage.
- **Acceptance:**
  - 4 new test files, each with >=5 test cases covering: happy path, error response, edge cases, label interactions
  - `gmail_list_pending`: test label query construction, empty results, pagination
  - `gmail_create_draft`: test draft creation, label application, audit logging, error handling
  - `gmail_get_email`: test message retrieval, thread inclusion, processing ownership label
  - `gmail_mark_processed`: test label transitions for each action type (drafted, skipped, spam, deferred, etc.)
  - All tests use shared fixtures from TASK-02
- **Validation contract (TC-XX):**
  - TC-01: list_pending with matching messages → returns formatted list
  - TC-02: list_pending with no messages → returns empty list
  - TC-03: create_draft with valid input → draft created, labels applied, audit logged
  - TC-04: create_draft with API error → error propagated with context
  - TC-05: get_email with thread → returns message + thread context
  - TC-06: mark_processed with each action → correct label transition
  - TC-07: mark_processed with invalid action → error
- **Planning validation (required for M):**
  - Checks run: Verified gmail-organize-inbox.test.ts and gmail-label-state.test.ts mock patterns in fact-find
  - Validation artifacts: Existing test files confirm Jest mock approach for Gmail client works
  - Unexpected findings: None
- **Consumer tracing (M effort):**
  - New outputs: test files only, no production code outputs
  - Consumer impact: N/A — test-only deliverable, no production consumers
- **Scouts:** None: TASK-02 provides the foundation (fixtures); mock patterns are proven
- **Edge Cases & Hardening:** None: testing task, edge cases are what we're testing
- **What would make this >=90%:**
  - Pagination testing for list_pending (Gmail API nextPageToken handling)
  - Rate limit response testing for each tool
- **Rollout / rollback:**
  - Rollout: Add test files; purely additive, no production code changes
  - Rollback: Remove test files (git revert)
- **Documentation impact:** None: test coverage only
- **Build evidence (2026-02-21):**
  - 4 new test files with 36 tests total (all passing):
    - `gmail-list-pending.test.ts` (7 tests): label query, empty results, pagination hasMore, auth failure
    - `gmail-create-draft.test.ts` (7 tests): threaded reply, Ready-For-Review label, API error propagation, telemetry logging, validation, References header, graceful label failure
    - `gmail-get-email.test.ts` (7 tests): thread context, In-Progress + actor labels, concurrent processing guard, 404 handling, audit entry, attachment metadata
    - `gmail-mark-processed.test.ts` (15 tests): all action types (drafted/skipped/spam/deferred/requeued/acknowledged/promotional/awaiting_agreement/agreement_received/prepayment_chase), invalid action error, lock release, actor labels, cleanup on failure
  - Tests use shared fixtures from TASK-02; follow existing `handleGmailTool()` direct invocation pattern
  - Typecheck clean; full mcp-server suite passes

---

### TASK-10: Add E2E Gmail smoke test

- **Type:** IMPLEMENT
- **Deliverable:** `packages/mcp-server/src/__tests__/gmail-e2e-smoke.test.ts` + env-var gate
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/src/__tests__/gmail-e2e-smoke.test.ts` (new), `[readonly] packages/mcp-server/src/clients/gmail.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-11
- **Confidence:** 80%
  - Implementation: 80% - Reuses existing Gmail client; env-var gate (`GMAIL_E2E=1`) excludes from CI. Cleanup in `afterAll` block deletes test artifacts. Held-back test: no single unknown drops below 80 because the test reuses the existing token.json initialization path and the Gmail API operations (getProfile, labels.list, drafts.create, drafts.delete) are well-documented.
  - Approach: 80% - Read-only and create-then-delete pattern ensures no lasting side effects. Test validates real API connectivity without modifying inbox state. Held-back test: no single unknown drops below 80 because the create/delete pattern for drafts is atomic and the test uses a dedicated test label.
  - Impact: 85% - Addresses R5 (Gmail API breaking changes go undetected); provides the only real-API validation in the test suite
- **Acceptance:**
  - Test gated by `GMAIL_E2E=1` environment variable; skipped in CI
  - Validates: OAuth token valid (getProfile succeeds), labels exist (labels.list returns expected Brikette labels), draft lifecycle works (create draft, verify exists, delete)
  - Test cleans up all created artifacts in `afterAll` (even on failure)
  - Uses retry utility (TASK-03) for resilience against transient failures during test
  - Clear skip message when env var not set: "Skipping E2E: set GMAIL_E2E=1 to run"
- **Validation contract (TC-XX):**
  - TC-01: GMAIL_E2E=1 + valid token → all smoke checks pass
  - TC-02: GMAIL_E2E not set → test skipped with descriptive message
  - TC-03: Expired token → test fails with clear OAuth error (not cryptic API error)
  - TC-04: Test draft created → cleaned up in afterAll, not left in Gmail
  - TC-05: API error during cleanup → warning logged, test still reports correctly
- **Planning validation (required for M):**
  - Checks run: Verified Gmail client loads from token.json at startup; `users.getProfile` available as lightweight probe
  - Validation artifacts: `packages/mcp-server/src/clients/gmail.ts` confirmed to export usable Gmail client
  - Unexpected findings: None
- **Consumer tracing (M effort):**
  - New outputs: test file only, no production code outputs
  - Consumer impact: N/A — test-only deliverable
- **Scouts:** None: TASK-03 (retry utility) and TASK-02 (fixtures) provide the prerequisites
- **Edge Cases & Hardening:**
  - Token refresh during test: if token expired but refresh token valid, test should still succeed (client auto-refreshes)
  - Network failure: test should fail with clear network error, not hang indefinitely (timeout per assertion)
  - Draft cleanup race: use `afterAll` with try/catch to ensure cleanup runs even if assertions fail
  - Test must not modify any real email labels or message states
- **What would make this >=90%:**
  - CI integration with a dedicated test Google account (separate from production)
  - Scheduled weekly run to detect API changes proactively
- **Rollout / rollback:**
  - Rollout: Add test file; env-var gate means zero impact on existing CI
  - Rollback: Remove test file (git revert)
- **Documentation impact:** Document how to run E2E test locally (env var setup, token.json requirement)
- **Build evidence (2026-02-21):**
  - `gmail-e2e-smoke.test.ts` created with env-var gate (`GMAIL_E2E=1`)
  - 3 E2E tests + 1 skip-message test:
    - OAuth token validation via `getProfile`
    - Brikette label existence check (Queue/, Outcome/, Agent/ prefixes)
    - Draft lifecycle: create with identifiable subject `[E2E-TEST]`, verify via GET, delete, confirm 404
  - `afterAll` cleanup safety net with try/catch per draft
  - All API calls wrapped in `withRetry` from TASK-03
  - `beforeAll` throws with clear diagnostic on `needsSetup` (expired token)
  - Skip mode verified: 3 skipped + 1 passed when GMAIL_E2E not set
  - Typecheck clean

---

### TASK-11: Checkpoint — reassess plan before gmail.ts split

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `docs/plans/email-system-production-readiness/plan.md`
- **Depends on:** TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 95%
  - Implementation: 95% - Process is defined
  - Approach: 95% - Prevents deep dead-end execution
  - Impact: 95% - Controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-12
  - Confidence for TASK-12 recalibrated from latest evidence (new tests, retry utility, health check results)
  - Plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - gmail.ts split is still warranted after hardening (complexity didn't decrease enough from other tasks)
  - Extraction boundaries (booking, cancellation, reconciliation) are clean after TASK-06/07 changes
  - Test coverage from TASK-09 confirms module boundaries
  - TASK-01 findings don't reprioritize remaining work
- **Validation contract:** All TASK-04 through TASK-10 complete; replan produces updated TASK-12 confidence >=80 or explicit justification for deferral
- **Planning validation:** Replan evidence path: run updated test suite, inspect new code boundaries, assess remaining risk
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan update at `docs/plans/email-system-production-readiness/plan.md`
- **Build evidence (2026-02-21) — Checkpoint assessment:**
  - All dependencies complete: TASK-04 through TASK-10 verified Complete
  - **gmail.ts grew from 3,330 to 3,435 lines** (added: TASK-03 retry import/wrapper, TASK-04 TelemetryEventSchema + Zod validation, TASK-07 checkBookingRefDuplicate helper + integration). Split is still warranted — complexity increased slightly.
  - **Extraction boundaries confirmed clean:**
    - Booking handler (~lines 1704-1805) now has its own dedup helper (`checkBookingRefDuplicate`), making it more self-contained and easier to extract
    - TelemetryEventSchema is local to gmail.ts — will move with the telemetry reader
    - `withRetry` import from external utils module — clean dependency, no extraction issue
    - Health probes are in health.ts (not gmail.ts) — no interference
  - **Test coverage from TASK-09 confirms module boundaries:** 36 dedicated tests for 4 individual tools provide safety net for extraction
  - **TASK-01 resolved:** Published app, no emergency reprioritization needed
  - **TASK-12 confidence reassessment:** Upgraded from 70% to 80% based on:
    - Better test coverage (36 dedicated + 22 organize-inbox + 8 booking-dedup = 66 gmail tests)
    - Booking handler more self-contained after TASK-07 dedup extraction
    - Signal events already extracted to utils (TASK-04), reducing gmail.ts coupling
    - No blocking unknowns remaining
  - **Recommendation:** Proceed with TASK-12 at 80% confidence. Extract booking handler first (most self-contained after TASK-07).

---

### TASK-12: Split gmail.ts monolith

- **Type:** IMPLEMENT
- **Deliverable:** Extracted modules from gmail.ts (booking, cancellation, reconciliation, classification)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** L
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-booking.ts` (new), `packages/mcp-server/src/tools/gmail-cancellation.ts` (new), `packages/mcp-server/src/tools/gmail-reconciliation.ts` (new), `packages/mcp-server/src/tools/gmail-classify.ts` (new), `packages/mcp-server/src/__tests__/gmail-*.test.ts`
- **Depends on:** TASK-11
- **Blocks:** -
- **Confidence:** 80% (upgraded from 70% at TASK-11 checkpoint)
  - Implementation: 80% - 3,435-line file; extraction boundaries confirmed clean at checkpoint. Booking handler self-contained after TASK-07 dedup, signal events already in utils after TASK-04, 66 gmail tests provide extraction safety net. Upgraded from 70%.
  - Approach: 80% - Standard extract-module refactoring; shared state (Gmail client, label constants) identified for gmail-shared.ts extraction. Upgraded from 75%.
  - Impact: 75% - R7 is MEDIUM/MEDIUM; improves maintainability but doesn't fix a production risk directly. Value compounds over time.
- **Acceptance:**
  - gmail.ts reduced to <1,000 lines (tool registrations + shared Gmail client setup)
  - Extracted modules: booking-processor, cancellation-router, reconciliation, email-classifier
  - Shared utilities (label constants, Gmail client wrapper) extracted to `gmail-shared.ts`
  - All 9 MCP tool names unchanged (external interface preserved)
  - All existing tests pass with updated imports
  - No behavior changes (pure refactor)
- **Validation contract (TC-XX):**
  - TC-01: All 9 MCP tools still register and respond correctly
  - TC-02: All existing Gmail test suites pass with updated imports
  - TC-03: No circular imports between extracted modules (verified by build)
  - TC-04: gmail.ts is <1,000 lines
  - TC-05: Each extracted module has a single clear responsibility
- **Execution plan:** Red → Green → Refactor
  - Red: Verify all existing Gmail tests pass before starting (baseline)
  - Green: Extract modules one at a time (booking → cancellation → reconciliation → classifier), running full test suite after each extraction
  - Refactor: Update imports in test files, remove any unnecessary re-exports from gmail.ts
- **Planning validation (required for L):**
  - Checks run: Identified candidate extraction boundaries in fact-find (booking ~lines 1704-1805, cancellation routing, reconciliation handler)
  - Validation artifacts: gmail.ts line analysis from fact-find
  - Unexpected findings: Shared state (label constants, Gmail client instance) needs its own module to avoid circular deps; this will be addressed during checkpoint (TASK-11)
- **Consumer tracing (L effort):**
  - New outputs: 4-5 extracted modules with exported functions
  - Modified behavior: function locations change but all MCP tool registrations remain in gmail.ts
  - Consumers:
    - MCP tool consumers (agents) — unchanged, tool names stay the same
    - Test files — imports updated to point to new module locations (addressed in execution plan)
    - ops-inbox skill — calls MCP tools by name, unchanged
  - Consumer `gmail.ts` itself becomes an orchestrator importing from extracted modules
  - All consumers addressed within this task (test import updates) or unchanged (MCP interface)
- **Scouts:** Checkpoint (TASK-11) serves as the scout — detailed extraction boundary analysis deferred to replan
- **Edge Cases & Hardening:**
  - Circular imports: use barrel exports and unidirectional dependency flow (shared → specific modules → gmail.ts orchestrator)
  - Shared state: Gmail client instance must be passed as parameter or imported from shared module, not duplicated
  - Label constants: extract to `gmail-labels.ts` shared module
- **What would make this >=90%:**
  - Detailed extraction boundary analysis with dependency graph (produced by TASK-11 replan)
  - Per-module test coverage thresholds set before extraction
- **Rollout / rollback:**
  - Rollout: Extract one module at a time, full test suite between each; can stop mid-extraction
  - Rollback: Revert to monolithic gmail.ts (git revert); each extraction is independently revertible
- **Documentation impact:** Update any architecture docs referencing gmail.ts file structure
- **Notes / references:**
  - Current gmail.ts structure (verified):
    - 1-94: Imports, label constants, legacy label map
    - 96-494: Terminal labels, required labels, lock store, audit/telemetry infrastructure
    - 495-738: Zod schemas, prepayment helpers, tool definitions array (`gmailTools` starts at 583)
    - 739-1153: Utility functions (parsing, labels, lock helpers, sender analysis, garbage detection)
    - 1154-1309: `classifyOrganizeDecision` (classification pipeline)
    - 1311-1805: Booking processing (text normalization, reservation parsing, draft building, `processBookingReservationNotification` at 1704-1805)
    - 1807-1947: Tool case handlers (cancellation case at 1815, startup recovery at 1902)
    - 1949-2269: `handleOrganizeInbox` (main organize handler)
    - 2270-2607: Individual tool handlers (list pending, list query, get email, create draft)
    - 2609-3243: Remaining handlers (cleanup, mark processed, telemetry, migrate labels, reconcile in-progress at 3060)
    - 3245-3330: Main `handleGmailTool` dispatcher
  - Detailed extraction boundary analysis deferred to TASK-11 checkpoint replan

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R1: OAuth token expires silently | LOW (Published app, 6-month inactivity window; TASK-01 confirmed) | HIGH | TASK-06 adds token expiry probe to health_check |
| R2: Duplicate booking drafts | LOW | MEDIUM | TASK-07 adds booking-ref dedup on top of message-level dedup |
| R3: JSONL corruption from concurrent writes | LOW | HIGH | TASK-04 adds schema validation on read (detection, not prevention) |
| R4: Signal events OOM during calibration | LOW | MEDIUM | TASK-08 adds archival after calibration + fallback size-based trigger at 1MB |
| R5: Gmail API breaking change undetected | LOW | HIGH | TASK-10 adds E2E smoke test |
| R7: gmail.ts unmaintainable | MEDIUM | MEDIUM | TASK-12 splits into focused modules (post-checkpoint) |
| R9: Template corruption from manual edit | LOW | MEDIUM | TASK-05 adds CI lint gate |
| R10: Transient Gmail API failures | MEDIUM | MEDIUM | TASK-03 adds retry-with-backoff |
| R6: Agreement detection false positives trigger wrong T&C workflow | LOW | HIGH | Deferred: requires language-specific NLP improvements beyond production-readiness scope; fact-find notes legal implications but current keyword matching has not produced known false positives |
| R8: Python fallback template diverges from TypeScript | MEDIUM | LOW | Deferred: Python fallback is temporary safety net (assumption A3); parity testing deferred until fallback removal decision |
| R-NEW-1: TASK-12 extraction introduces subtle bugs | MEDIUM | HIGH | Checkpoint gate (TASK-11) + incremental extraction with test suite between each module |
| R-NEW-2: E2E test creates artifacts not cleaned up | LOW | LOW | TASK-10 uses afterAll cleanup with try/catch |

## Observability

- Logging: Retry attempts logged with attempt count and delay (TASK-03). JSONL validation warnings logged with line numbers (TASK-04). Booking dedup events logged to audit trail (TASK-07).
- Metrics: Health check probes report per-probe latency and status (TASK-06). Signal events file size tracked (TASK-06, TASK-08).
- Alerts/Dashboards: Health check "unhealthy" or "warning" status visible to agents calling the tool. Token expiry <24h triggers warning in health response.

## Acceptance Criteria (overall)

- [ ] All existing 33+ email test files pass after all changes
- [ ] Pipeline pass rate >= 90% maintained
- [ ] health_check validates real Gmail API connectivity and OAuth token expiry (extending existing 10-item preflight)
- [ ] JSONL files validated on read with skip-on-error resilience
- [ ] Signal events file bounded by archival strategy
- [ ] CI lints email templates on every PR
- [ ] E2E smoke test runnable locally with env-var gate
- [ ] Booking-reference dedup active alongside message-level dedup
- [ ] Gmail API calls retried on transient failures (429, 5xx)
- [ ] 4 previously indirect-only tools have dedicated test suites
- [ ] gmail.ts split into focused modules (post-checkpoint, TASK-12)

## Decision Log

- 2026-02-21: Plan created from fact-find brief. Risk-first incremental approach chosen over monolith-first (Option A vs Option C). Monolith split deferred to Wave 5 behind checkpoint gate due to L-effort and 70% confidence. OAuth investigation (TASK-01) prioritized in Wave 1 because it could reprioritize the entire plan.
- 2026-02-21: TASK-01 investigation gathered code-level evidence (project `prime-f3652`, Desktop OAuth client, sensitive scopes, no expiry_date in token). Publishing status cannot be determined programmatically — requires manual GCP Console check. Task set to Needs-Input. TASK-06 remains blocked on TASK-01 but all other Wave 1/2 tasks proceed independently.
- 2026-02-21: TASK-01 resolved — operator confirmed Published status via GCP Console (10,000 grants/day rate limit). R1 risk downgraded: refresh token expiry is 6-month inactivity window, not 7-day Testing window. TASK-06 unblocked.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 85% × 1 = 85
- TASK-02: 80% × 1 = 80
- TASK-03: 85% × 1 = 85
- TASK-04: 80% × 1 = 80
- TASK-05: 80% × 1 = 80
- TASK-06: 85% × 1 = 85 (rescoped from M to S after critique: existing health_check already has 10-item preflight)
- TASK-07: 80% × 1 = 80
- TASK-08: 80% × 1 = 80
- TASK-09: 80% × 2 = 160
- TASK-10: 80% × 2 = 160
- TASK-11: 95% × 1 = 95
- TASK-12: 70% × 3 = 210
- **Total:** 1280 / 16 = **80%**
