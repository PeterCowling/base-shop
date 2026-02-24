---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21
Audit-Ref: bd83190757 (working-tree for fact-find doc itself)
Feature-Slug: email-system-production-readiness
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/email-system-production-readiness/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Email System Production Readiness Fact-Find Brief

## Scope

### Summary

Audit the Brikette email system (MCP server tools, Gmail integration, draft pipeline, self-improvement loop, operational workflows) for production readiness. The system handles real guest email for Hostel Brikette and processes live Gmail data. This brief identifies testing gaps, missing verification/validation, and production hardening needs.

### Goals

- Catalog all testing gaps across the 6 subsystems
- Identify missing verification/validation that could cause silent failures
- Assess production readiness against basic operational standards (monitoring, recovery, data safety)
- Produce actionable task seeds for a hardening plan

### Non-goals

- Rewriting the email system architecture
- Adding new features or email categories
- Changing the human-in-the-loop design (no auto-send)
- Multi-tenant/configurable deployment (hard-coded hostel content is acceptable for single-business use)

### Constraints & Assumptions

- Constraints:
  - System is actively processing real guest email -- changes must be backward-compatible
  - File-based storage (JSONL, JSON) is the current persistence layer -- no database migration in scope
  - MCP server runs as a local process attached to Claude Code sessions
- Assumptions:
  - Single-operator deployment (Pete) -- no multi-user concurrency beyond multiple agent sessions
  - Gmail API quotas are sufficient for current volume (~20-50 emails/day)
  - The Python fallback is a temporary safety net, not a primary path

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/gmail.ts:1` -- All 9 Gmail MCP tools (organize_inbox, list_pending, list_query, get_email, create_draft, mark_processed, reconcile_in_progress, telemetry_daily_rollup, migrate_labels)
- `packages/mcp-server/src/tools/draft-interpret.ts:1` -- Email classification and action plan creation
- `packages/mcp-server/src/tools/draft-generate.ts:1` -- Template selection, knowledge augmentation, draft assembly
- `packages/mcp-server/src/tools/draft-quality-check.ts:1` -- Deterministic quality validation
- `packages/mcp-server/src/tools/draft-refine.ts:1` -- LLM refinement attestation layer
- `packages/mcp-server/src/tools/draft-ranker-calibrate.ts:1` -- Ranker prior calibration from signal events
- `packages/mcp-server/src/tools/draft-template-review.ts:1` -- Template improvement proposals
- `packages/mcp-server/src/tools/draft-signal-stats.ts:1` -- Signal event statistics
- `packages/mcp-server/src/tools/booking-email.ts:1` -- Booking app-link email drafts
- `packages/mcp-server/src/tools/outbound-drafts.ts:1` -- Prime Firebase outbound draft processing
- `.claude/skills/ops-inbox/SKILL.md` -- Operational workflow definition (719 lines)
- `scripts/ops/create-brikette-drafts.py` -- Python fallback CLI (510 lines)

### Key Modules / Files

- `packages/mcp-server/src/tools/gmail.ts` (3,330 lines, 101KB) -- Gmail tool monolith: classification, label state machine, booking processing, cancellation routing, reconciliation
- `packages/mcp-server/src/tools/draft-generate.ts` (1,421 lines) -- Largest draft tool: template ranking, knowledge augmentation, policy evaluation, composite assembly
- `packages/mcp-server/src/tools/draft-interpret.ts` (764 lines) -- Deterministic email classification with 20 rules across 19 unique categories
- `packages/mcp-server/src/utils/template-ranker.ts` -- BM25 ranking with synonym expansion, field boosts, ranker priors
- `packages/mcp-server/src/utils/lock-store.ts` -- File-backed processing locks with `O_EXCL` atomic creation
- `packages/mcp-server/src/utils/signal-events.ts` (273 lines) -- JSONL event append/read/join/count
- `packages/mcp-server/src/utils/coverage.ts` -- Stemmed question coverage evaluation
- `packages/mcp-server/src/utils/email-template.ts` -- Branded HTML email generation
- `packages/mcp-server/src/clients/gmail.ts` -- OAuth2 Gmail API client
- `packages/mcp-server/data/email-templates.json` (49KB, 53 templates) -- Template storage

### Data & Contracts

- Types/schemas/events:
  - `EmailActionPlan` -- Structured output of `draft_interpret` (Zod-validated input, but output is a plain object)
  - `SignalEvent` = `SelectionEvent | RefinementEvent` -- JSONL event types (TypeScript types only, no runtime validation on read)
  - `AuditEntry` / `TelemetryEvent` -- Audit log entry types (TypeScript types only)
  - `LockEntry` = `{ lockedAt: number, owner: string }` -- Lock file schema
  - Template schema: `{ subject, body, category, template_id, reference_scope, canonical_reference_url, normalization_batch }`
- Persistence:
  - `data/email-audit-log.jsonl` (321 lines, 55KB) -- Append-only audit trail
  - `packages/mcp-server/data/draft-signal-events.jsonl` (780 lines, 216KB) -- Selection/refinement signal events
  - `packages/mcp-server/data/ranker-template-priors.json` -- Calibrated priors (currently empty: `{"calibrated_at": null, "priors": {}}`)
  - `packages/mcp-server/data/template-proposals.jsonl` -- Template improvement proposals
  - `packages/mcp-server/data/reviewed-learning-ledger.jsonl` -- Unknown question ingestion
  - `data/locks/*.json` -- Per-message processing locks
  - Gmail labels -- Persistent state store (24 labels in hierarchical taxonomy)
- API/contracts:
  - Gmail API v1 (users.messages, users.labels, users.drafts) via `googleapis`
  - Firebase Realtime Database REST API (Prime outbound drafts)
  - MCP resources (8 total; 4 used by draft-generate for knowledge augmentation): `brikette://faq`, `brikette://rooms`, `brikette://pricing/menu`, `brikette://policies`. Additional resources: `schema://prisma`, `brikette://draft-guide`, `brikette://voice-examples`, `brikette://email-examples`

### Dependency & Impact Map

- Upstream dependencies:
  - Google Gmail API (OAuth2 user credentials, rate limits, API changes)
  - Google Cloud OAuth app (token lifecycle, consent screen, app verification status)
  - Firebase Realtime Database (Prime outbound drafts)
  - `@acme/lib` BM25Index + stemmedTokenizer (template ranking)
  - Octorate SMTP notifications (booking/cancellation source emails)
- Downstream dependents:
  - `/ops-inbox` skill (primary consumer of all email MCP tools)
  - `/draft-email` skill (standalone email drafting)
  - Reception app booking email API route
  - Pete (human operator reviewing all drafts before sending)
- Likely blast radius:
  - Gmail label corruption could strand emails in wrong states
  - Template file corruption would break all draft generation
  - Signal events corruption would break calibration and template proposals
  - Lock store failure would allow concurrent processing of same email

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (via governed test runner for pipeline integration tests)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern>`; standard `jest` for unit tests
- CI integration: Pipeline pass rate >= 90% gate

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Draft interpret | Unit | `draft-interpret.test.ts` (531 lines, 37 tests) | Strong: classification, escalation, agreement, multi-scenario, thread summary |
| Draft generate | Unit | `draft-generate.test.ts` (1,521 lines, 28 tests) | Strong: template selection, composite, knowledge, gap-fill, policy |
| Draft quality | Unit | `draft-quality-check.test.ts` (563 lines, 24 tests) | Strong: all check types, reference policy, coverage evaluation |
| Draft refine | Unit | `draft-refine.test.ts` (321 lines, 10 tests) | Good: hard-rule protection, identity check, old schema guard |
| Draft pipeline | Integration | `draft-pipeline.integration.test.ts` (425 lines, 10 fixtures) | Good but mocks knowledge resources |
| Gmail organize | Unit | `gmail-organize-inbox.test.ts` (~20 tests) | Good: classification, booking, cancellation, startup recovery |
| Gmail labels | Unit | `gmail-label-state.test.ts` (~14 tests) | Good: concurrency prevention, stale lock, workflow transitions |
| Gmail audit | Unit | `gmail-audit-log.test.ts` (5 tests) | Adequate: entry format, JSONL, append-only, telemetry rollup |
| Ranker calibrate | Unit | `draft-ranker-calibrate.test.ts` (9 tests) | Good: minimum gate, delta computation, clamping |
| Template review | Unit | `draft-template-review.test.ts` (3+ tests) | Partial: PII redaction, optimistic concurrency |
| Signal events | Unit | `signal-events.test.ts` (10 tests) | Good: UUID, append, join, edit distance, counting |
| Template ranker | Unit | `template-ranker.test.ts` (several tests) | Adequate: hard rules, category hint |
| Template lint | Unit | `template-lint.test.ts` (4+ tests) | Adequate: placeholders, links, policy keywords |
| Lock store | Unit | `lock-store.test.ts` | Good: acquire/release/stale/list, wx-flag atomic |
| Booking email | Unit | `booking-email.test.ts` | Adequate: draft creation, labels, audit |
| Outbound drafts | Unit | `outbound-drafts.test.ts` (4 tests) | Adequate: label attribution, actor param |
| Cancellation | Unit | `cancellation-email-parser.test.ts` (5+ tests), `process-cancellation-email.test.ts` | Good: parsing, workflow, failure paths |
| Email template HTML | Unit | `email-template.test.ts` (6+ tests) | Adequate: layout, signatures, greeting |
| Slot resolver | Unit | `slot-resolver.test.ts` (6 tests) | Good: all slot types |

**Total: 33 email-related test files in `packages/mcp-server/src/__tests__/`** (additional email tests exist in `apps/reception/`, `apps/prime/`, `apps/cms/`, and `packages/mcp-server/data/__tests__/`)

#### Coverage Gaps

- **Untested source files:**
  - `email-mime.ts` -- MIME encoding/decoding utility, zero tests
  - `clients/gmail.ts` -- OAuth client, token refresh, connection handling, zero dedicated tests
  - `draft-signal-stats.ts` -- MCP tool wrapper, zero dedicated tests
- **Tools tested only indirectly:**
  - `gmail_list_pending` -- tested as side effect of organize-inbox, not standalone
  - `gmail_create_draft` -- tested as side effect of booking reservation handling, not standalone
  - `gmail_get_email` -- tested via label-state tests, not standalone edge cases
  - `gmail_mark_processed` -- tested via label-state tests, not standalone transitions
  - Note: `gmail_list_query` has a dedicated test file (`gmail-list-query.test.ts`, 4 tests) and is not in this gap category
- **Missing scenario categories:**
  - Gmail API pagination (`nextPageToken` handling) -- never tested
  - Gmail API rate limiting (429 response) -- handler exists but never tested
  - Gmail API transient failures (500/503) -- no retry logic exists, not tested
  - Concurrent JSONL writers (audit log, signal events) -- `appendFileSync` used but concurrent interleaving untested
  - Non-UTF8 email content, large bodies, deeply nested MIME -- untested
  - Malformed Gmail API responses (missing fields, null payloads) -- untested
  - Template file corruption / parse failure -- untested
  - Ranker priors file corruption -- only "missing file" tested
- **No E2E/smoke tests:**
  - Zero tests exercise real Gmail API (all mocked)
  - No smoke test validates OAuth token still works
  - No test validates end-to-end email processing with real data
- **No shared test fixtures:**
  - `__tests__/fixtures/` has no email fixtures; sample emails, threads, action plans duplicated inline across test files

#### Testability Assessment

- Easy to test:
  - Draft pipeline (interpret/generate/quality/refine) -- all deterministic, pure functions or well-mocked
  - Template ranker -- pure BM25 with injectable templates
  - Signal events -- file I/O with temp directory isolation
  - Lock store -- file I/O with injectable path
- Hard to test:
  - Gmail API integration -- requires real OAuth token and live API
  - Concurrent agent processing -- requires multiple MCP server instances
  - Token expiry and refresh -- requires waiting for real expiry or mocking Google's token endpoint
  - JSONL concurrent write safety -- requires parallel process coordination
- Test seams needed:
  - Gmail API client needs a proper mock/stub interface (currently uses ad-hoc jest.mock)
  - JSONL reader needs schema validation to catch structural corruption
  - Health check needs pluggable probes (currently hard-coded checks)

#### Recommended Test Approach

- Unit tests for: `email-mime.ts`, `draft-signal-stats` tool, individual Gmail tool handlers
- Integration tests for: Full pipeline with real knowledge resources (not mocked), booking reservation deduplication
- E2E tests for: Gmail API smoke test (token valid, can list labels, can create draft)
- Contract tests for: JSONL event schema validation on read, template file schema validation on load

### Recent Git History (Targeted)

- `a08384f8` -- Wave 3: signal data files, ranker, slot test, refine (TASK-04/05/07) -- self-improvement loop completion
- `a9f726ce` -- Wave 1: pipeline bug fixes, signal capture, slot system (TASK-01/02/03) -- draft pipeline hardening
- `d90d119d` -- i18n alias removal, email tests, MCP gmail, prime tokens -- cross-cutting maintenance
- `a15eb130` -- Harden stdin lifecycle, fix draft HTML branding -- stability fix
- `f7d33c9d` -- TASK-07 reviewed-ledger, TASK-10 routing hardening -- knowledge loop completion
- `c7cbdb63` -- Lazy-load gmail auth, close draft coverage gaps -- auth improvement
- `d368273a` -- TASK-09 label attribution harmonization -- agent tracking
- `b1a16edf` -- TASK-03 email telemetry instrumentation -- observability addition
- `88cf0c2e` -- TASK-06/08 label-absence query replaces is:unread -- classify reliability improvement
- `a4026eeb` -- TASK-03 durable file-backed lock store -- concurrency safety

Pattern: Active development with systematic task-based improvements. Self-improvement loop (Waves 1-3) was the most recent major effort. No recent hardening or production-readiness work.

## Questions

### Resolved

- Q: Does the lock store actually delete files on release?
  - A: Yes -- `release()` calls `fs.unlinkSync()`, performing actual file deletion.
  - Evidence: `packages/mcp-server/src/utils/lock-store.ts:100-106`
- Q: Are the regex patterns in draft-interpret.ts vulnerable to ReDoS?
  - A: No -- patterns use simple alternation with word boundaries, no nested quantifiers or overlapping alternations.
  - Evidence: `packages/mcp-server/src/tools/draft-interpret.ts:165-563`
- Q: Does booking reservation processing have any deduplication?
  - A: Partial -- `hasBriketteLabel` at `gmail.ts:2054` provides message-level dedup (already-labeled emails are skipped). No booking-reference-level dedup exists.
  - Evidence: `packages/mcp-server/src/tools/gmail.ts:2054`, `gmail.ts:1704-1805`

### Open (User Input Needed)

- Q: Is the Google Cloud OAuth app in "production" or "testing" publishing status?
  - Why it matters: In "testing" mode, refresh tokens expire after 7 days. This would make R1 (OAuth token expiry) a HIGH likelihood / HIGH impact risk rather than MEDIUM/HIGH. The entire email system would silently stop working weekly.
  - Decision impacted: Priority of task seed 2 (deepen health_check) and whether R1 is the single most urgent fix.
  - Decision owner: Pete
  - Default assumption: Production mode (MEDIUM likelihood for R1). Risk: if wrong, email processing could fail without warning within 7 days of any token refresh.
- Q: What is the actual daily email throughput?
  - Why it matters: The ~20-50 emails/day estimate is unverified. Actual volume affects Gmail API quota risk assessment and whether rate limiting is needed.
  - Decision impacted: Priority of task seed 1 (retry-with-backoff) and R10 severity.
  - Decision owner: Pete
  - Default assumption: ~20-50/day based on hostel size. Risk: if volume is higher during peak season, rate limiting gaps become more critical.

## Confidence Inputs

- **Implementation: 85%** -- System is well-architected with clear separation of concerns, deterministic pipeline, and thorough business logic. Gaps are in hardening, not core design.
  - To 90%: Add retry logic for Gmail API, schema validation on JSONL reads, booking reservation deduplication
- **Approach: 80%** -- The issues are well-understood and the fixes are straightforward engineering. No architectural redesign needed.
  - To 90%: Confirm Gmail API quota headroom, validate OAuth app verification status (test vs production app)
- **Impact: 90%** -- System handles real guest communication. Silent failures (corrupt JSONL, stuck emails, duplicate drafts) directly impact guest experience.
  - Already at 90%: Every issue identified has a concrete user-facing consequence
- **Delivery-Readiness: 75%** -- Issues are well-cataloged but some (monitoring, E2E tests, concurrent write safety) require infrastructure decisions.
  - To 80%: Decide on monitoring approach (structured logs vs external service), decide on E2E test strategy (CI vs manual)
  - To 90%: Implement monitoring baseline, add shared test fixtures
- **Testability: 80%** -- Existing test infrastructure is good. Main gaps are in Gmail API mocking quality and missing dedicated test files.
  - To 90%: Create shared email fixtures, add proper Gmail client stub interface

## Risks

| # | Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|---|
| R1 | OAuth token expires silently, all email processing fails | MEDIUM | HIGH | Add token expiry check to health_check, proactive renewal alerting |
| R2 | Duplicate booking drafts from distinct notification emails for the same reservation (message-level dedup exists via `hasBriketteLabel` label check, but no booking-ref-level dedup) | LOW | MEDIUM | Add booking-reference deduplication check before draft creation |
| R3 | JSONL file corruption from concurrent agent sessions | LOW | HIGH | Add line-level integrity checks, or switch to exclusive file locking |
| R4 | Unbounded signal events file causes OOM during calibration | LOW | MEDIUM | Add archival/pruning strategy (rotate after calibration) |
| R5 | Gmail API breaking change undetected (all tests use mocks) | LOW | HIGH | Add minimal E2E smoke test that runs against real API |
| R6 | Agreement detection false positive triggers wrong T&C workflow | LOW | HIGH | Tighten agreement detection: require explicit confirmation language, not just "ok"/"yes" |
| R7 | gmail.ts monolith (3,330 lines) becomes unmaintainable | MEDIUM | MEDIUM | Split into per-tool modules with shared Gmail client |
| R8 | Python fallback template diverges from TypeScript version | MEDIUM | LOW | Add cross-implementation parity test or deduplicate HTML template |
| R9 | Template file corrupted by manual edit, no periodic linting | LOW | MEDIUM | Add CI-time template lint check |
| R10 | No retry on transient Gmail API failures causes lost processing | MEDIUM | MEDIUM | Add retry-with-backoff for 5xx and 429 responses |

## Planning Constraints & Notes

- Must-follow patterns:
  - All email tools must remain backward-compatible (label taxonomy, audit log format, signal event schema)
  - Hard-rule protection for prepayment/cancellation categories must be preserved
  - Human-in-the-loop design must be preserved (no auto-send)
  - Lock store must maintain `O_EXCL` atomic creation semantics
- Rollout/rollback expectations:
  - Changes can be deployed incrementally (per-tool, per-utility)
  - JSONL format changes must be additive (new fields only, existing fields preserved)
  - Template schema changes must be backward-compatible
- Observability expectations:
  - Health check should report more than file existence
  - Audit log should capture failure reasons, not just success
  - Signal event stats should be queryable by date range

## Suggested Task Seeds (Non-binding)

1. **Add Gmail API retry-with-backoff** -- Wrap Gmail API calls in a retry utility with exponential backoff for 429/5xx. Impact: R10.
2. **Deepen health_check** -- Add OAuth token validity probe (call `users.getProfile`), template file parse check, signal events file size check. Impact: R1.
3. **Add booking-reference deduplication** -- Check for existing draft by booking ref before creating new draft in `processBookingReservationNotification`. Note: message-level dedup already exists via `hasBriketteLabel` at `gmail.ts:2054`; this task adds booking-reference-level dedup for distinct emails about the same reservation. Impact: R2.
4. **Add JSONL schema validation on read** -- Validate signal events and audit log entries against Zod schemas when reading. Impact: R3.
5. **Add signal events archival** -- After successful calibration, archive processed events to a dated file, keeping only un-calibrated events in the active file. Impact: R4.
6. **Create shared email test fixtures** -- Extract inline test data into `__tests__/fixtures/email/` with sample messages, threads, action plans. Impact: testability.
7. **Add dedicated tests for indirect-only tools** -- Write standalone test suites for `gmail_list_pending`, `gmail_create_draft`, `gmail_get_email`, `gmail_mark_processed`. Impact: test coverage.
8. **Add E2E Gmail smoke test** -- A minimal test that validates OAuth token, lists labels, and creates/deletes a test draft. Gated by env var, excluded from CI. Impact: R5.
9. **Split gmail.ts monolith** -- Extract booking processing, cancellation routing, and reconciliation into separate modules. Impact: R7, maintainability.
10. **Add CI template lint gate** -- Run `lintTemplatesSync` on `email-templates.json` in CI. Impact: R9.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - All existing tests still pass
  - New tests added for each task seed
  - No regression in pipeline integration test pass rate (>= 90%)
  - Health check reports Gmail API connectivity
- Post-delivery measurement plan:
  - Track: stuck email count (emails in In-Progress > 2 hours)
  - Track: duplicate draft incidents (manual count, monthly)
  - Track: signal events file size growth rate
  - Track: calibration frequency (should be triggered monthly)

## Evidence Gap Review

### Gaps Addressed

- [x] ReDoS risk in draft-interpret.ts -- VERIFIED LOW: reviewed all regex patterns, no nested quantifiers or overlapping alternations found
- [x] Lock file cleanup -- VERIFIED: `release()` uses `unlinkSync` (actual deletion), but no automated sweeper exists for orphaned files
- [x] Health check depth -- VERIFIED: Gmail check is file-existence only (no API call); database check is real (SQL query)
- [x] Ranker priors state -- VERIFIED: `calibrated_at: null` confirmed in actual file
- [x] JSONL schema validation -- VERIFIED: `JSON.parse()` with type assertion, no Zod validation on read
- [x] Booking deduplication -- VERIFIED: no dedup check before `gmail.users.drafts.create` in reservation handler

### Confidence Adjustments

- Testability raised from 75% to 80%: ReDoS risk is lower than initially assumed (simple alternation patterns with word boundaries)
- Delivery-Readiness kept at 75%: monitoring approach and E2E strategy still need decisions

### Remaining Assumptions

- Gmail API quota (~250 units/second for modify, ~50/second for drafts) is sufficient for current volume -- see Open Questions for verification path
- Single-operator assumption holds (no plans for multi-user deployment) -- assumed from operational context
- `appendFileSync` is atomic for JSONL writes at current entry sizes (entries are well under POSIX PIPE_BUF of 4KB)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None -- all issues are actionable with existing context
- Recommended next step:
  - `/lp-do-plan` to sequence the 10 task seeds into an implementation plan, prioritized by risk impact
