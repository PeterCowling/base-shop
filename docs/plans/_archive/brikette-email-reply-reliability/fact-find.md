---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brikette-email-reply-reliability
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/brikette-email-reply-reliability/analysis.md
Trigger-Source: direct-inject
Trigger-Why: Three P1 reliability gaps in the Brikette guest email reply pipeline — stuck emails, duplicate replies, and overconfident AI drafts — risk wrong or missing information reaching guests and damaging hostel reputation.
Trigger-Intended-Outcome: type: operational | statement: All three failure modes have code-level fixes deployed; stuck emails surface as manual-draft flags within 2 hours; duplicate sends are prevented by idempotency checks; AI uncertainty is surfaced as a review flag rather than a confident hallucination.
---

# Brikette Email Reply Reliability — Fact-Find Brief

## Outcome Contract

- **Why:** Three confirmed failure modes in the guest email pipeline risk silent failures (no reply ever sent), duplicate guest replies, and confidently wrong AI responses reaching guests. These directly harm guest experience and hostel reputation, and are surfaced by operational observation with >85% confidence estimates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Code fixes deployed for stuck emails, duplicate replies, and AI overconfidence; stuck admitted threads surface for manual action within 2 hours; duplicate sends prevented at the send route level; AI uncertainty routes to manual-review flag rather than confident-guess delivery.
- **Source:** auto

## Scope

### Summary

Three P1 problems in the Brikette guest email pipeline are bundled as one work package because they share infrastructure (the reception inbox sync → draft → send flow) and can be addressed by code changes within the same subsystem.

**Problem 1 — Stuck emails (P1, 85%):** Guest emails admitted to the pipeline can stall in `pending` status indefinitely if draft generation fails and no staff alert fires. The recovery cron runs every 30 minutes and handles threads without drafts, but threads with `needs_manual_draft = 1` are excluded from recovery. There is no proactive staff notification when a thread reaches this state.

**Problem 2 — Duplicate replies (P1, 88%):** The send route (`/api/mcp/inbox/[threadId]/send/route.ts`) calls `createGmailDraft()` then `sendGmailDraft()` sequentially. If the process crashes between those two calls (after the Gmail draft is created but before the thread status is updated), a retry will create a second Gmail draft and attempt to send it. The `createDraftIfNotExists()` guard exists in the sync pipeline but is absent from the send route. The correct fix ordering: (1) check if `currentDraft.gmail_draft_id` is already set; (2) if not, call `createGmailDraft()`; (3) write `gmailDraftId` to D1 (update draft with `gmailDraftId`) before calling `sendGmailDraft()` — this is the critical ordering inversion; (4) if `gmail_draft_id` is already set, call `sendGmailDraft(currentDraft.gmail_draft_id)` directly. The current code at `send/route.ts:149` writes `gmailDraftId` only after `sendGmailDraft()` completes — this ordering must be inverted.

**Problem 3 — AI overconfidence (P1, 90%):** When `generateDraftCandidate()` cannot answer a question, it appends `ESCALATION_FALLBACK_SENTENCE` to the draft body but still passes the draft to `runQualityChecks()` and, if other checks pass, the draft is marked `qualityResult.passed = true` and delivered as-is. The presence of the escalation sentence alongside real content creates a mixed-confidence draft that bypasses the `needs_manual_draft` flag and lands in the operator review queue without a visible confidence warning. The `deliveryStatus: "needs_follow_up"` field is computed in `generateDraftCandidate()` but is not propagated into the D1 thread record or surfaced in the UI.

### Goals
- Ensure admitted threads that fail draft generation or require follow-up are surfaced to staff within 2 hours.
- Prevent the same email being sent twice to a guest when a retry occurs during the send sequence.
- Surface AI uncertainty at the draft review stage so operators can identify low-confidence drafts before sending.

### Non-goals
- Rebuilding the admission/classification pipeline (out of scope).
- Changing the AI model or prompt architecture.
- Adding external alerting (e.g., SMS, PagerDuty) beyond the existing inbox UI.

### Constraints & Assumptions
- Constraints:
  - D1 (Cloudflare) — no `SELECT FOR UPDATE` / advisory locks; must use idempotency via unique constraints or conditional updates.
  - Reception app deploys as a Cloudflare Worker via OpenNext — no persistent in-memory state.
  - Cron triggers fire once per minute (inbox-sync) and once per 30 minutes (inbox-recovery); cannot reliably run faster.
  - Tests run in CI only per `docs/testing-policy.md`.
- Assumptions:
  - `deliveryStatus: "needs_follow_up"` from `generateDraftCandidate` accurately identifies drafts where at least one question could not be answered.
  - The `needs_manual_draft` flag is checked by the inbox UI and marks threads visibly.
  - Gmail draft API is idempotent on creation (same content, different ID) — no built-in server-side dedup.

## Current Process Map

- Trigger: Cloudflare cron every minute → `POST /api/internal/inbox-sync` → `syncInbox()` → Gmail history API → per-thread processing
- End condition: Thread reaches `sent` status after operator sends the draft from the reception inbox UI.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| **Inbox sync (triage)** | Cron fires every minute → `inbox-sync/route.ts` → `syncInbox()` → Gmail history API (incremental) or rescan → `processThread()` per thread → `classifyForAdmission()` → `admit` / `auto-archive` / `review-later` | `apps/reception/worker-entry.ts:42`, `apps/reception/src/app/api/internal/inbox-sync/route.ts`, `apps/reception/src/lib/inbox/sync.server.ts` | Thread errors are caught and logged; `threadErrors` count incremented; checkpoint NOT advanced if any thread errors (`!hasErrors`) |
| **Draft generation** | `generateAgentDraft()` → `interpretDraftMessage()` → `generateDraftCandidate()` → `runQualityChecks()` → if `qualityResult.passed`: create draft in D1; else: `needs_manual_draft = true` | `apps/reception/src/lib/inbox/draft-pipeline.server.ts`, `draft-core/generate.ts`, `draft-core/quality-check.ts` | `needs_follow_up` status computed but not stored in D1 or used to route thread; ESCALATION_FALLBACK_SENTENCE appended but quality gate may still pass |
| **Draft upsert guard** | `createDraftIfNotExists()` in sync pipeline uses `INSERT ... ON CONFLICT` guard against concurrent sync runs creating duplicate D1 drafts | `apps/reception/src/lib/inbox/sync.server.ts:325`, `repositories.server.ts` | Guard covers D1 dedup but not Gmail send dedup |
| **Recovery cron** | Fires every 30 minutes → `recoverStaleThreads()` → `findStaleAdmittedThreads()` queries: `status = 'pending' AND updated_at < staleThreshold AND EXISTS(admit decision) AND NOT EXISTS(draft) AND needs_manual_draft IS NULL OR != 1` → retry draft generation up to `maxRetries=3` | `apps/reception/src/lib/inbox/recovery.server.ts`, `apps/reception/src/app/api/internal/inbox-recovery/route.ts` | Threads with `needs_manual_draft = 1` are excluded from recovery; no staff notification when a thread reaches that state or exhausts retries |
| **Send path** | Operator reviews draft in reception inbox → clicks Send → `POST /api/mcp/inbox/[threadId]/send/route.ts` → `createGmailDraft()` → `sendGmailDraft()` → `updateDraft(status: "approved")` → `updateDraft(status: "sent")` → `updateThreadStatus(status: "sent")` | `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` | No idempotency check before `createGmailDraft()` call — a retry after partial failure creates a second Gmail draft; optimistic lock exists (`expectedUpdatedAt`) but only applies to edit conflicts, not duplicate-send on retry |
| **AI confidence surface** | `deliveryStatus: "needs_follow_up"` returned by `generateDraftCandidate()` when `followUpRequired` blocks exist → used in `AgentDraftResult.status` field → NOT written to D1 thread record → NOT displayed in reception inbox UI | `apps/reception/src/lib/inbox/draft-core/generate.ts:436-439`, `draft-pipeline.server.ts:299` | `needs_follow_up` status is computed but silently dropped; only `qualityResult.passed` gate used for routing |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

| Prescription ID | Prescription Family | Required Route | Required Inputs | Expected Artifacts | Expected Signals |
|---|---|---|---|---|---|
| n/a | | | | | |

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/worker-entry.ts:42-98` — Cloudflare Worker scheduled handler; cron `* * * * *` → inbox-sync; cron `*/30 * * * *` → inbox-recovery
- `apps/reception/src/app/api/internal/inbox-sync/route.ts` — POST endpoint called by cron; delegates to `syncInbox()`
- `apps/reception/src/app/api/internal/inbox-recovery/route.ts` — POST endpoint called by recovery cron; delegates to `recoverStaleThreads()`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` — POST: operator-triggered send action

### Key Modules / Files

- `apps/reception/src/lib/inbox/sync.server.ts` — primary sync loop; `processThread()`, `upsertSyncDraft()`, checkpoint management
- `apps/reception/src/lib/inbox/recovery.server.ts` — stale thread recovery; `recoverStaleThreads()`, `recoverSingleThread()`, `flagForManualDraft()`
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — `generateAgentDraft()` orchestrator; `deriveDraftFailureReason()`
- `apps/reception/src/lib/inbox/draft-core/generate.ts` — `generateDraftCandidate()`; ESCALATION_FALLBACK_SENTENCE; `deliveryStatus` computation
- `apps/reception/src/lib/inbox/draft-core/quality-check.ts` — `runQualityChecks()`; `unanswered_questions` check; `confidence` score
- `apps/reception/src/lib/inbox/repositories.server.ts` — D1 helpers; `createDraftIfNotExists()`, `findStaleAdmittedThreads()`, `updateThreadStatus()`
- `apps/reception/src/lib/inbox/admission.ts` — `classifyForAdmission()`, `classifyOrganizeDecision()`
- `packages/mcp-server/src/tools/gmail-handlers.ts` — legacy Gmail MCP path (handleCreateDraft, handleMarkProcessed); not used by reception sync pipeline
- `packages/mcp-server/src/tools/gmail-organize.ts` — MCP organize-inbox; `runStartupRecovery()` with in-process lock store

### Patterns & Conventions Observed

- D1 threads table: status lifecycle `pending → drafted → approved → sent` (plus `review_later`, `auto_archived`, `resolved`)
- Gmail labels (legacy MCP path): `Brikette/Queue/Needs-Processing → In-Progress → Outcome/Drafted`; lock file in `data/locks/` dir
- Reception app (newer path): pure D1 state; no Gmail label mutation during sync/recovery/send
- `createDraftIfNotExists()` uses `INSERT ... ON CONFLICT(thread_id) DO NOTHING WHERE status = 'generated'` — evidence: `repositories.server.ts` upsert pattern
- Audit log: append-only JSONL at `data/email-audit-log.jsonl` (MCP path only); D1 `thread_events` table used in reception app
- Telemetry events: `email_draft_created`, `email_outcome_labeled`, `email_queue_transition`, `email_reconcile_recovery` (MCP path); `admitted`, `drafted`, `sent`, `send_failed`, `inbox_recovery`, `thread_sync_error` (reception app path)

### Data & Contracts

- Types/schemas/events:
  - `InboxThreadStatus` — `pending | review_later | auto_archived | drafted | approved | sent | resolved` (`repositories.server.ts:9-18`)
  - `InboxDraftStatus` — `generated | edited | approved | sent` (`repositories.server.ts:21-27`)
  - `AgentDraftResult.status` — `ready | needs_follow_up | error` (`draft-pipeline.server.ts:36`)
  - `deliveryStatus` field — `ready | needs_follow_up` — returned by `generateDraftCandidate()` but NOT stored in D1. No-migration path available: `quality_json` (stored as a JSON blob in `drafts.quality_json`) could carry `deliveryStatus` without a D1 schema migration — the field is already a free-form JSON object, so storing `{ ...qualityResult, deliveryStatus: "needs_follow_up" }` requires only a code change to the write path in `createDraft()` and the read path in draft serialization.
  - `QualityCheckResult.confidence` — float 0-1 based on `(totalChecks - failedChecks) / totalChecks`
- Persistence:
  - D1 tables: `threads`, `messages`, `drafts`, `admission_outcomes`, `thread_events`, `inbox_sync_state`
  - `threads.needs_manual_draft` (INTEGER) — set to 1 when draft fails quality gate
  - `threads.recovery_attempts` (INTEGER) — incremented by recovery cron
  - `threads.draft_failure_code`, `threads.draft_failure_message` — set on failure
  - `drafts.gmail_draft_id` — set when Gmail draft created during send; NOT set during sync-path draft creation
- API/contracts:
  - Send route accepts `{ expectedUpdatedAt?: string }` for optimistic lock on edit conflicts; no idempotency token for send
  - Recovery cron query: `WHERE status = 'pending' AND updated_at < staleThreshold AND EXISTS(admit) AND NOT EXISTS(draft) AND (needs_manual_draft IS NULL OR needs_manual_draft != 1)`

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (Google OAuth) — `apps/reception/src/lib/gmail-client.ts`
  - Cloudflare D1 — inbox state persistence
  - Octorate / Firebase — guest booking data for guest matching
- Downstream dependents:
  - Reception inbox UI — reads threads, drafts, and status from D1 via MCP API routes
  - Guest — receives final reply via Gmail send
- Likely blast radius:
  - Problem 1 fix: `recovery.server.ts`, `repositories.server.ts`, potentially reception inbox UI (flag display)
  - Problem 2 fix: `send/route.ts`, potentially `repositories.server.ts` (idempotency helper)
  - Problem 3 fix: `sync.server.ts` (propagate `deliveryStatus`), D1 schema (new column or metadata field), reception inbox UI (confidence indicator)

### Delivery & Channel Landscape

- Audience/recipient: Staff (operator) — reception inbox UI; ultimately, guests via Gmail
- Channel constraints: Changes deploy via GitHub Actions to Cloudflare Worker + D1
- Existing templates/assets: Email templates in `packages/mcp-server/data/email-templates.json`
- Approvals/owners: Peter Cowling (operator)
- Compliance constraints: No PII stored beyond what is already in D1; email body stored in drafts table
- Measurement hooks: `thread_events` table; `email-audit-log.jsonl`; `syncInbox()` return counts

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit + integration); Playwright (E2E — not relevant here)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: Tests run in CI only (per `docs/testing-policy.md`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox sync | Unit (mocked) | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Covers happy path, history stale fallback, draft quality failure routing; does NOT test `needs_follow_up` propagation |
| Recovery | Unit (mocked) | `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`, `recovery-route.test.ts` | Covers retry up to maxRetries, manual-flag path; no test for staff notification on manual-flag |
| Draft pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` | Covers `generateAgentDraft()` happy path; limited tests for `needs_follow_up` routing |
| Quality check | Unit | `apps/reception/src/lib/inbox/__tests__/quality-check.test.ts` | Covers individual check rules; no test for escalation_sentence + quality pass combination |
| Send route | Unit (route test) | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Covers optimistic lock path; NO test for duplicate-send protection |
| Gmail MCP tools | Unit | `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`, `gmail-mark-processed.test.ts`, etc. | Comprehensive coverage of legacy MCP path; lock-file startup recovery tested |
| Draft generate (MCP) | Unit | `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `pipeline-bugs.test.ts` | Coverage of ESCALATION_FALLBACK_SENTENCE content (TC-02); no test that escalation presence + quality pass combination is handled |

#### Coverage Gaps

- Untested paths:
  - Send route: no test that a second `createGmailDraft()` call is skipped when `gmail_draft_id` already exists on current draft
  - Sync pipeline: no test that `deliveryStatus: "needs_follow_up"` is stored in D1 metadata or surfaced in thread record
  - Reception inbox UI: no test/check that threads with `needs_manual_draft = 1` or `deliveryStatus: "needs_follow_up"` are visually distinguished
  - Recovery: no test that when `maxRetries` is exhausted AND `needs_manual_draft` becomes 1, a staff-visible event is emitted that differs from a silent state update
- Extinct tests: None identified

#### Testability Assessment

- Easy to test:
  - Idempotency guard in send route: mock `createGmailDraft`, verify it is not called when `gmail_draft_id` is already set
  - `needs_follow_up` propagation: assert `deliveryStatus` is stored in D1 draft `quality_json` or new column
  - Quality check confidence threshold: unit test with known ESCALATION_FALLBACK_SENTENCE scenario
- Hard to test:
  - End-to-end duplicate send (requires real Gmail API + specific crash timing)
  - Stuck email alert: requires real time passage or clock mocking plus real D1
- Test seams needed:
  - Injectable Gmail client in send route (already exists via `createGmailDraft` import)
  - Clock injection in recovery cron for stale threshold testing

#### Recommended Test Approach

- Unit tests for: idempotency guard (send route), `deliveryStatus` storage, confidence-flag logic, escalation+quality interaction
- Integration tests for: `recoverStaleThreads()` with `needs_manual_draft = 1` threads (verify they are skipped and flagged, not just silently excluded)
- E2E tests for: not needed for these changes
- Contract tests for: send route API — verify `201` is idempotent on retry with same draft content

### Recent Git History (Targeted)

- `apps/reception/src/lib/inbox/*` — Recovery and sync were recently extended (migration 0006, 0007); guest matching was added; `createDraftIfNotExists` guard added to sync path
- `packages/mcp-server/src/tools/gmail-organize.ts` — `runStartupRecovery()` added for lock-file-based recovery of in-flight MCP-path emails

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Reception inbox shows thread status and `needs_manual_draft` flag; no confidence indicator for `needs_follow_up` drafts | No visual distinction between a confident draft and a draft with unanswered questions | Analyse where in the inbox card/list view a confidence flag would render |
| UX / states | Required | Thread status lifecycle well-defined; `needs_manual_draft = 1` threads visible in inbox; but no distinct state for "partial draft — follow-up required" | `deliveryStatus: "needs_follow_up"` state is computed but silently dropped; operator may send a mixed-confidence draft without realising | Define a new thread/draft UI state for follow-up-required drafts |
| Security / privacy | N/A (local code change — no new data exposure, no auth changes) | Staff auth required on all inbox API routes (`requireStaffAuth`); no new endpoints | None | N/A |
| Logging / observability / audit | Required | `thread_events` table records `admitted`, `drafted`, `sent`, `send_failed`, `inbox_recovery`; but `needs_follow_up` is not recorded; duplicate-send attempt would not be logged before the guard | No observable signal when `needs_follow_up` draft is generated; no log entry when duplicate send is blocked | Add telemetry event for `needs_follow_up` draft creation; add audit entry for duplicate-send block |
| Testing / validation | Required | Unit tests cover sync happy path, recovery, quality checks; send route optimistic-lock tested; no test for duplicate-send guard or `needs_follow_up` propagation | Coverage gaps documented above | Add targeted unit tests per gap |
| Data / contracts | Required | `InboxThreadStatus`, `InboxDraftStatus` schemas well-typed; `deliveryStatus` exists in `AgentDraftResult` but NOT in D1 or API response; no idempotency column on drafts for Gmail draft ID before send | Need to propagate `deliveryStatus` to D1; need to check `gmail_draft_id` before creating Gmail draft | Determine whether a new column is needed or `quality_json` can carry `deliveryStatus` |
| Performance / reliability | Required | Recovery cron limited to 20 threads per run (hardcoded default limit in `findStaleAdmittedThreads`); no timeout on per-thread processing; send route has no retry timeout | Recovery throughput may lag during email surges; duplicate-send risk is a reliability gap | Assess whether limit=20 is sufficient for expected volume |
| Rollout / rollback | Required | Deployed via Cloudflare Worker + D1; D1 migrations are additive (ALTER TABLE ADD COLUMN); no feature flags currently | Any new D1 column requires a migration run before code deploy; rollback would need column to remain (nullable) | Plan migration ordering: schema first, then code |

## Questions

### Resolved

- Q: Does the reception inbox pipeline use Gmail labels for state or D1?
  - A: D1 exclusively. The Gmail-label-based state machine is the legacy MCP path (`packages/mcp-server/`). The reception app (`apps/reception/`) uses D1 tables only.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts` — no label mutations during sync; `apps/reception/src/lib/inbox/repositories.server.ts` — all state in D1

- Q: Is there any existing idempotency check before `sendGmailDraft()`?
  - A: No. The send route creates a Gmail draft unconditionally then sends it. The optimistic lock (`expectedUpdatedAt`) only guards against concurrent edits, not duplicate sends on retry.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts:134-146`

- Q: Is `deliveryStatus: "needs_follow_up"` used anywhere after `generateAgentDraft()` returns?
  - A: In `sync.server.ts`, the check is `draftResult.status !== "error" && draftResult.qualityResult?.passed`. `needs_follow_up` status with a passing quality check would be treated as a successful draft with no special routing. The `deliveryStatus` field is not stored in D1.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts:732`, `draft-pipeline.server.ts:299-300`

- Q: When `needs_manual_draft = 1`, does any alert or notification fire?
  - A: No proactive alert. The thread is flagged in D1 and visible in the reception inbox if the operator opens it. No push notification, email, or automated escalation exists.
  - Evidence: `apps/reception/src/lib/inbox/recovery.server.ts:168-172` (flagForManualDraft only writes to D1); `apps/reception/src/lib/inbox/sync.server.ts:744-749`

- Q: How long can a thread stay stuck before recovery retries exhaust?
  - A: Recovery runs every 30 minutes; `maxRetries = 3`; recovery only acts on threads with `updated_at < staleThreshold` (default 2 hours). After 3 failed recovery attempts, thread is flagged `needs_manual_draft = 1` and excluded from all future recovery runs. Total maximum time from admit to manual flag: ~2–4 hours (depending on stale threshold configuration).
  - Evidence: `apps/reception/src/lib/inbox/recovery.server.ts:29`, `apps/reception/src/app/api/internal/inbox-recovery/route.ts:7`

- Q: Does the ESCALATION_FALLBACK_SENTENCE cause the quality check to fail?
  - A: No. The quality check checks for `unanswered_questions` by evaluating keyword coverage of the question text against the draft body. The ESCALATION sentence contains "Pete or Cristiana will follow up" — this does not match question keywords, so questions remain flagged as "missing". If `unanswered_questions` is in `failed_checks`, the draft fails. However, if quality passes (all questions are partially or fully covered by template content) but some questions also received the escalation sentence appended as a supplement, the draft passes with confidence diluted but no flag raised.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/generate.ts:306-308` (escalation appended only if coverage still missing), `draft-core/quality-check.ts:484-491` (unanswered_questions based on coverage evaluation)

### Open (Operator Input Required)

- Q: Should threads flagged `needs_manual_draft = 1` generate a notification (e.g., a highlighted count in the reception UI header, a push notification, or an email alert to staff)?
  - Why operator input is required (not agent-resolvable): This is a product/UX decision about alerting modality and urgency level that depends on how staff currently monitor the reception inbox.
  - Decision impacted: Whether the fix for Problem 1 includes only inbox UI badging or also an external push/email alert.
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default — add a visible count/badge to the inbox navigation for manual-draft-flagged threads. Risk: if staff do not regularly open the reception app, threads may still be missed; a push notification would be more reliable but requires additional infrastructure.

## Confidence Inputs

- Implementation: 88%
  - Evidence: Full source read of sync, recovery, send, draft-pipeline, quality-check, and generate modules. Code paths are clear. Barriers: D1 schema change (new column or `quality_json` field) requires migration planning; Gmail send idempotency approach needs a clear decision.
  - Would raise to ≥90: Confirm idempotency strategy (check `gmail_draft_id` before create vs. use a transaction-scoped flag).

- Approach: 82%
  - Evidence: Three independent, targeted fixes; no architectural change required. Each fix maps to a concrete code location.
  - Would raise to ≥90: Confirm operator preference on alerting modality for Problem 1.

- Impact: 85%
  - Evidence: Problems are well-specified with clear failure modes. Fixes directly address the root cause in each case.
  - Would raise to ≥90: Observe production thread_events to confirm frequency of `needs_manual_draft` flag events.

- Delivery-Readiness: 80%
  - Evidence: All required infrastructure is in place (D1, recovery cron, send route, quality check). No new external dependencies.
  - Would raise to ≥90: Resolve D1 migration ordering question and operator alert decision.

- Testability: 85%
  - Evidence: Existing Jest test scaffolding with mock injection is clean. Send route and sync pipeline are well-structured for unit testing.
  - Would raise to ≥90: Confirm that `gmail_draft_id` column access in send route tests can be mocked without full D1 setup.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| D1 migration deploy ordering: code deployed before migration runs, new column not yet present | Medium | Medium — column access would throw | Plan: always run migration before code deploy; column is nullable so old code is unaffected after migration |
| Optimistic lock (`expectedUpdatedAt`) may not prevent all concurrent sends in the reception UI (two tabs, rapid double-click) | Low | High — duplicate email to guest | Fix: check `gmail_draft_id` is null before creating; if set, skip and use existing |
| `needs_follow_up` propagation to UI may require frontend changes not fully scoped in this fact-find | Medium | Low — backend fix is independent; UI is progressive enhancement | Scope: backend stores flag; UI renders it as a warning badge; not a blocking dependency |
| Recovery cron throttled at 20 threads per run — if backlog exceeds 20, some threads may wait multiple cron cycles | Low (normal volume) | Medium (surge scenario) | Acceptable for now; note for planning: make limit configurable |
| Gmail `users.drafts.send` re-send idempotency: if `sendGmailDraft(id)` is called twice with the same `gmailDraftId`, Gmail may reject the second call (draft is consumed on send) or silently succeed; if the draft is already sent and the ID is reused, outcome is undefined | Medium (on crash-retry) | High — duplicate email or error swallowed | Fix: write `gmailDraftId` to D1 before `sendGmailDraft()` call so any crash-retry path detects the existing ID and can verify thread status before re-sending |

## Planning Constraints & Notes

- Must-follow patterns:
  - D1 schema changes: additive only (ALTER TABLE ADD COLUMN with nullable default); migration file in `apps/reception/migrations/`
  - Tests run in CI only; no local `jest` or `pnpm test` runs
  - Pre-commit hooks must pass; no `--no-verify`
  - Writer lock required via `scripts/agents/with-writer-lock.sh`
- Rollout/rollback expectations:
  - Problem 1 (stuck email alerting): D1 migration → code deploy. Rollback: disable flag display in UI; no data loss.
  - Problem 2 (duplicate send): Code-only change to send route — no migration needed. Rollback: revert send route file.
  - Problem 3 (AI confidence): D1 migration (new column or `quality_json` field update) → code deploy. Rollback: UI stops reading new field; backend continues writing it.
- Observability expectations:
  - Add `inbox_recovery` event with `outcome: "manual_flag_exhausted"` when recovery marks a thread with max retries exceeded
  - Add `send_duplicate_blocked` event in thread_events when idempotency guard fires
  - Add `draft_confidence` metadata to `drafted` thread_events entry

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Stuck email surfacing** — Add `needsManualDraft` count badge to inbox navigation; emit `inbox_recovery` event on every manual-flag transition (not just on max_retries); ensure `needs_manual_draft = 1` threads are visible in a filtered view.
2. **TASK-02: Duplicate send guard** — In `send/route.ts`: (1) check `currentDraft.gmail_draft_id` before calling `createGmailDraft()` — if set, skip creation and jump to send; (2) if not set, call `createGmailDraft()`; (3) immediately write `gmailDraftId` to D1 via `updateDraft()` before `sendGmailDraft()` is called — this is the critical ordering inversion from current code; (4) call `sendGmailDraft()`; add `send_duplicate_blocked` telemetry event when guard fires.
3. **TASK-03: AI confidence flag** — Store `deliveryStatus` from `generateAgentDraft()` in D1 (as new `draft_confidence` column or in `quality_json`); surface as a visual warning in the draft review UI; add `followUpRequired` count to `drafted` telemetry event.
4. **TASK-04: Tests** — Unit tests for all three fixes: idempotency guard, `deliveryStatus` storage, confidence display; integration test for recovery path with `needs_manual_draft = 1` threads.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Three confirmed failure modes each have a code fix merged and deployed
  - CI passes including new tests
  - No regression in existing sync/recovery/send path tests
- Post-delivery measurement plan:
  - Monitor `thread_events` for `send_duplicate_blocked` events (should be zero in normal operation; non-zero confirms the guard fired and prevented a duplicate)
  - Monitor `needs_manual_draft` flag rate in thread_events; expect stable or declining rate as AI quality improves
  - Monitor `draft_confidence` field distribution to validate that `needs_follow_up` drafts are being correctly identified

## Evidence Gap Review

### Gaps Addressed

- Full source read of sync, recovery, send route, draft pipeline, quality check, and generate modules — all three root causes confirmed by reading the actual code rather than inferred.
- D1 schema confirmed by reading `repositories.server.ts` and `migrations/0006_inbox_metadata_columns.sql`.
- `deliveryStatus` drop confirmed: `draft-pipeline.server.ts:299-300` returns it but `sync.server.ts:732` does not check it.
- Duplicate send path confirmed: `send/route.ts:134-146` — no idempotency guard.

### Confidence Adjustments

- Problem 2 confidence raised from initial estimate to 88% — the exact call sequence in `send/route.ts` is unambiguous.
- Problem 3 root cause refined: `deliveryStatus: "needs_follow_up"` is computed but never stored; it is distinct from `qualityResult.passed`, which is the only gate used for routing.

### Remaining Assumptions

- The `gmail_draft_id` column on `InboxDraftRow` is reliably NULL before the send route sets it — this assumption underpins the idempotency guard design.

### Open Questions (Evidence Gaps)

- Q: Does the reception inbox UI read `needs_manual_draft` from D1 and render it visually?
  - Why not resolved: The `needs_manual_draft` column exists on `InboxThreadRow` (confirmed in `repositories.server.ts`) but the reception inbox UI frontend code was not investigated in this fact-find. The column type and D1 access patterns are confirmed — whether the UI surfaces it as a badge or filter is unknown.
  - Decision impacted: Scoping for TASK-01 — if the UI already renders it, only the count/badge in the navigation header needs to be added; if not, both the flag display and the navigation badge are new work.
  - Decision owner: Peter Cowling

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Email pipeline entry point (cron → sync) | Yes | None | No |
| Email state machine (D1 + thread status lifecycle) | Yes | None | No |
| Draft generation (generate.ts, quality-check.ts, draft-pipeline.server.ts) | Yes | `deliveryStatus` computed but not stored or surfaced | Yes — propagate to D1 |
| Stuck email path (recovery.server.ts, findStaleAdmittedThreads) | Yes | No alert fires when `needs_manual_draft = 1`; recovery excludes these threads silently | Yes — add visibility |
| Duplicate send path (send/route.ts) | Yes | No idempotency check before `createGmailDraft()` | Yes — add guard |
| AI confidence signal (escalation sentence, needs_follow_up) | Yes | `needs_follow_up` status dropped after compute; ESCALATION_FALLBACK_SENTENCE appended but does not prevent quality pass | Yes — propagate and surface |
| Monitoring and alerting | Yes | No proactive alert for stuck or low-confidence threads | Yes — add telemetry events |
| Existing test coverage | Yes | Three specific gaps identified (send duplicate, needs_follow_up storage, confidence display) | Yes — new tests required |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items:
  - None — all three root causes confirmed from source; one open question (alerting modality) has a defined default assumption that allows planning to proceed.
- Recommended next step:
  - `/lp-do-analysis` — analyse three implementation options for each problem: (A) minimal code change, (B) full idempotency/flag propagation, (C) schema-first approach with D1 migration.
