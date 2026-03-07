---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-inprogress-recovery
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-inprogress-recovery/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307142547-9101
Trigger-Source: dispatch-routed
---

# Reception Inbox In-Progress Recovery Fact-Find Brief

## Scope

### Summary

The BRIK gmail pipeline has two parallel systems where threads can get stuck:

1. **MCP server Gmail label pipeline**: Threads labelled `Brikette/Queue/In-Progress` represent emails actively being processed. If processing fails after labelling but before an outcome label is applied, the thread retains the In-Progress label indefinitely. The existing `gmail_reconcile_in_progress` MCP tool can detect and re-route these stale threads, and recently gained per-email telemetry via the `email-logging-observability` build. However, this tool must be invoked manually -- there is no automatic scheduling.

2. **Reception app D1 inbox**: The thread status lifecycle is `pending` -> `drafted` -> `approved` -> `sent` -> `resolved`. The D1 inbox does not have an "In-Progress" status; the relevant stuck state is `pending` -- threads that were admitted and should have received a draft but did not (e.g., because `syncInbox` crashed mid-batch or draft generation failed silently). These `pending` threads without drafts stagnate with no automatic retry.

This fact-find investigates what is needed to automatically detect and recover stuck threads without manual operator intervention. The approach splits responsibility: Gmail label recovery stays in the MCP tool (invoked by the agent during its periodic inbox-processing workflow -- no new scheduling mechanism needed, just consistent inclusion in the existing workflow); D1 inbox recovery runs as a Cloudflare Workers scheduled handler (cron trigger) since it needs no external API access, only the D1 binding.

### Goals

- Identify the mechanisms by which threads get stuck in In-Progress state in both the Gmail label pipeline and the D1 inbox database
- Map existing recovery/reconciliation capabilities and their gaps
- Determine the best approach for automatic scheduling of recovery (cron trigger, Cloudflare scheduled handler, or MCP-initiated periodic task)
- Understand the telemetry and observability already in place from `email-logging-observability`

### Non-goals

- Consolidating the MCP server gmail.ts monolith with the extracted gmail-reconciliation.ts module (explicitly deferred per email-logging-observability plan)
- Changing the thread status lifecycle or adding new statuses
- Modifying the draft generation pipeline
- Adding recovery for threads in operator-review states (`drafted`, `approved`) -- these are awaiting intentional human action, not stuck
- Moving Gmail API access into the reception Worker (Gmail-side recovery stays in the MCP tool; the scheduled handler covers D1 recovery only)

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`
  - The MCP server runs as a Node.js process alongside Claude Code -- it does not have its own cron scheduler
  - The reception app runs on Cloudflare Workers via OpenNext -- Cloudflare Workers support `scheduled` event handlers (cron triggers)
  - Fail-open policy: recovery operations must not block normal inbox processing
  - The two systems (MCP Gmail labels and D1 inbox) are loosely coupled -- Gmail recovery stays in MCP (agent-scheduled), D1 recovery runs as a Worker cron handler
- Assumptions:
  - Cloudflare Workers cron triggers are a viable scheduling mechanism for the reception app side
  - The existing `gmail_reconcile_in_progress` MCP tool logic can be reused or called from a scheduled handler
  - A 2-hour stale threshold (current default in the reconcile tool) is a reasonable starting point

## Outcome Contract

- **Why:** Threads that get stuck in In-Progress state require manual operator intervention to recover. This creates operational drag and risks emails being missed when the operator is unavailable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Stuck In-Progress threads are automatically detected and retried without manual operator intervention.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

1. **MCP Gmail reconcile tool** -- `packages/mcp-server/src/tools/gmail.ts:3209` (local `handleReconcileInProgress`) and `packages/mcp-server/src/tools/gmail-reconciliation.ts:41` (extracted module, not on router path). Invoked manually via `gmail_reconcile_in_progress` MCP tool call.

2. **Reception inbox sync** -- `apps/reception/src/lib/inbox/sync.server.ts:444` (`syncInbox`). Called from MCP inbox route handlers. Processes Gmail threads, runs admission classification, generates drafts, persists to D1.

3. **Reception inbox API routes** -- `apps/reception/src/app/api/mcp/inbox/route.ts` (list threads), `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` (get thread), `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` (send draft), `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts` (resolve thread), `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts` (dismiss thread).

### Key Modules / Files

| # | File | Role |
|---|---|---|
| 1 | `packages/mcp-server/src/tools/gmail.ts` | Monolith gmail tool handler; contains local `handleReconcileInProgress` at line 3209, local `handleMarkProcessed`, label constants, telemetry functions |
| 2 | `packages/mcp-server/src/tools/gmail-reconciliation.ts` | Extracted reconcile module (NOT on router path); contains `reconcileInProgressSchema` with `staleHours` (default 2), `limit` (default 100), `dryRun` (default true) |
| 3 | `packages/mcp-server/src/tools/gmail-shared.ts` | Shared label constants: `LABELS.PROCESSING = "Brikette/Queue/In-Progress"`, `LEGACY_LABELS.PROCESSING = "Brikette/Inbox/Processing"` |
| 4 | `apps/reception/src/lib/inbox/sync.server.ts` | `syncInbox()` -- full inbox sync flow; processes threads sequentially; no error recovery for partial failures |
| 5 | `apps/reception/src/lib/inbox/repositories.server.ts` | D1 repository layer; thread statuses: `pending`, `review_later`, `auto_archived`, `drafted`, `approved`, `sent`, `resolved` |
| 6 | `apps/reception/src/lib/inbox/telemetry.server.ts` | Inbox event logging; event types: `admitted`, `auto_archived`, `review_later`, `drafted`, `draft_edited`, `approved`, `sent`, `resolved`, `dismissed` |
| 7 | `apps/reception/src/lib/inbox/db.server.ts` | D1 database binding access (`RECEPTION_INBOX_DB`) |
| 8 | `apps/reception/src/lib/inbox/sync-state.server.ts` | Sync checkpoint management (history ID tracking) |
| 9 | `apps/reception/migrations/0001_inbox_init.sql` | D1 schema: `threads`, `messages`, `drafts`, `thread_events`, `admission_outcomes` tables |
| 10 | `apps/reception/migrations/0002_inbox_sync_state.sql` | D1 schema: `inbox_sync_state` table |

### Patterns & Conventions Observed

- **Two parallel processing systems**: The MCP Gmail label pipeline uses Gmail labels (`Brikette/Queue/In-Progress`) as state markers. The reception D1 inbox uses a `status` column on the `threads` table. These are loosely coupled -- the MCP tool modifies Gmail labels, and `syncInbox` reads Gmail state and writes to D1. Evidence: `packages/mcp-server/src/tools/gmail-shared.ts` lines 25-26, `apps/reception/src/lib/inbox/repositories.server.ts` lines 7-16.

- **No transactional coordination**: `syncInbox` processes threads in a for-loop with no transaction wrapping the entire batch. A failure mid-loop leaves some threads processed and others untouched. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 508-698.

- **Status preservation on re-sync**: When a thread's latest inbound message is unchanged, `syncInbox` preserves the existing D1 status rather than resetting it. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 519-537.

- **Fail-open telemetry**: Non-critical telemetry events use `logInboxEventBestEffort` which catches and logs errors. Critical events (`admitted`, `approved`, `sent`) throw on failure. Evidence: `apps/reception/src/lib/inbox/telemetry.server.ts` lines 42-46, 97-116.

- **MCP reconcile is dry-run by default**: The `gmail_reconcile_in_progress` tool defaults to `dryRun: true`, requiring explicit opt-in for actual recovery. Evidence: `packages/mcp-server/src/tools/gmail-reconciliation.ts` line 33.

### Data & Contracts

- Types/schemas/events:
  - `InboxThreadStatus`: `"pending" | "review_later" | "auto_archived" | "drafted" | "approved" | "sent" | "resolved"` -- `apps/reception/src/lib/inbox/repositories.server.ts:7-16`
  - `InboxEventType`: `"admitted" | "auto_archived" | "review_later" | "drafted" | "draft_edited" | "approved" | "sent" | "resolved" | "dismissed"` -- `apps/reception/src/lib/inbox/telemetry.server.ts:11-21`
  - `reconcileInProgressSchema`: Zod schema with `dryRun`, `staleHours`, `limit`, `actor` -- `packages/mcp-server/src/tools/gmail-reconciliation.ts:30-35`
  - `email_reconcile_recovery` telemetry event key (added by email-logging-observability) -- emitted per recovered email in non-dry-run reconcile

- Persistence:
  - D1 `threads` table: `status` column tracks lifecycle state -- `apps/reception/migrations/0001_inbox_init.sql:4-15`
  - D1 `thread_events` table: audit trail of status changes -- `apps/reception/migrations/0001_inbox_init.sql:47-55`
  - D1 `inbox_sync_state` table: sync checkpoint with `last_history_id` -- `apps/reception/migrations/0002_inbox_sync_state.sql:3-10`
  - Gmail labels: `Brikette/Queue/In-Progress` marks threads being processed by the MCP pipeline

- API/contracts:
  - MCP tool `gmail_reconcile_in_progress`: input schema accepts `dryRun`, `staleHours`, `limit`, `actor`; returns counts and samples
  - Reception inbox API: REST endpoints under `/api/mcp/inbox/` for thread CRUD operations

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (message list, get, label modify) -- used by both MCP reconcile tool and `syncInbox`
  - D1 database binding (`RECEPTION_INBOX_DB`) -- used by reception inbox
  - Cloudflare Workers runtime -- hosts reception app

- Downstream dependents:
  - Inbox UI (`apps/reception/src/components/inbox/`) -- reads thread list via API
  - MCP tools (`gmail_list_pending`, `gmail_get_email`) -- read Gmail label state
  - Operator daily workflow -- relies on seeing pending threads in the inbox

- Likely blast radius:
  - Adding a scheduled handler to the reception app touches `wrangler.toml` (cron trigger config) and requires a new route or scheduled handler
  - Recovery logic that resets D1 thread status could affect the inbox UI view
  - Recovery logic that re-labels Gmail messages could affect MCP tool state

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit tests), governed test runner
- Commands: `pnpm -w run test:governed -- jest -- --testPathPattern=<pattern>`
- CI integration: tests run in CI only per testing-policy.md

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Telemetry | Unit | `apps/reception/src/lib/inbox/__tests__/telemetry.server.test.ts` | Tests critical/best-effort event logging, metadata truncation, list filtering |
| Sync | Unit | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Tests syncInbox flow with mocked dependencies |
| Admission | Unit | `apps/reception/src/lib/inbox/__tests__/admission.test.ts` | Tests email classification rules |
| MCP Reconcile | Unit | `packages/mcp-server/src/__tests__/gmail-reconciliation.test.ts` | Tests TC-R3 (non-dry-run emits telemetry) and TC-R4 (dry-run no telemetry) |
| Guest Matcher | Unit | `apps/reception/src/lib/inbox/__tests__/guest-matcher.server.test.ts` | Tests sender-to-guest matching |
| Draft Pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` | Tests draft generation flow |

#### Coverage Gaps

- No tests for thread status stuck detection or recovery
- No tests for scheduled/cron-triggered handlers in reception app
- No integration test covering the full cycle of a thread getting stuck and being recovered

#### Testability Assessment

- Easy to test: D1 query logic for finding stale threads (pure SQL with mockable D1), recovery status transitions (unit testable with mocked repositories)
- Hard to test: Cloudflare Workers cron trigger invocation (requires wrangler dev or integration test), Gmail label state synchronization between MCP and D1
- Test seams needed: A `findStaleThreads(db, staleThresholdMs)` function that can be unit tested independently from the cron handler

#### Recommended Test Approach

- Unit tests for: stale thread detection query, recovery status transition logic, recovery event logging
- Integration tests for: not needed at this stage (cron invocation tested via wrangler dev manually)
- Contract tests for: not needed

### Recent Git History (Targeted)

- `c26c2e867e` (2026-03-06) -- `feat(email-observability): close three logging gaps in Gmail pipeline` -- Added `email_reconcile_recovery` telemetry event to reconcile handler, `error_reason` on lock-released audit entries, stderr warnings for label creation failures. This is the most recent and directly relevant change.
- `ea63dee932` -- `perf(reception-inbox): eliminate N+1 queries, remove Gmail blocking, add client cache` -- Performance improvements to inbox thread listing.
- `5b747728f7` -- `feat(reception-inbox-draft-edit-tracking): preserve original AI-generated draft text on staff edits` -- Added original text preservation on draft edits.
- `50db7a0581` -- `feat(reception): add inbox dismiss action with admission feedback` -- Added dismiss capability.
- `836fa1a446` -- `feat(reception): integrate guest booking context into inbox` -- Added guest matching.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is well-bounded: add automatic scheduling for the existing reconciliation logic. The MCP reconcile tool already contains the core recovery logic; the gap is purely the trigger mechanism. The D1 inbox side needs a complementary stale-thread detector, but the status lifecycle and query patterns are straightforward. No new external dependencies are required -- Cloudflare Workers cron triggers are a built-in platform capability.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| MCP Gmail reconcile tool (existing logic) | Yes | None | No |
| Gmail label state and In-Progress lifecycle | Yes | None | No |
| D1 inbox thread status lifecycle | Yes | None | No |
| Sync failure modes and stuck thread scenarios | Yes | None | No |
| Cloudflare Workers cron trigger capability | Partial | [Scope gap] Minor: wrangler.toml cron config not inspected directly | No |
| Telemetry from email-logging-observability | Yes | None | No |
| Test landscape for new recovery code | Yes | None | No |

## Questions

### Resolved

- Q: How do threads get stuck in In-Progress state in the Gmail label pipeline?
  - A: When `gmail_mark_processed` is called, it applies the `Brikette/Queue/In-Progress` label. If the processing fails after labelling but before the outcome label is applied (e.g., draft generation fails, network error), the thread retains the In-Progress label with no further processing scheduled. The `cleanupInProgress` function exists to handle this, but only runs within the same tool invocation's error path -- it does not cover failures that crash the process entirely.
  - Evidence: `packages/mcp-server/src/tools/gmail.ts:3209-3265` (reconcile handler scans for In-Progress labelled messages older than `staleHours`)

- Q: How do threads get stuck in the D1 inbox?
  - A: The `syncInbox` function processes threads in a sequential for-loop with no batch transaction. If the process crashes mid-loop after a thread is admitted but before draft generation completes, the thread stays in `pending` status with no draft. On next sync, if the latest inbound message is unchanged, the status is preserved (`latestInboundUnchanged` check at line 519-537). Important distinction: threads where draft generation ran but failed quality checks are intentionally left as `pending` with `needsManualDraft: true` in metadata -- these are NOT candidates for automatic recovery (they need manual drafting). Only threads where draft generation never ran (crash/timeout) should be retried.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts:508-698` (main loop), lines 575-589 (manual draft flag on quality failure), lines 700-714 (checkpoint write at end)

- Q: What scheduling mechanism is available in Cloudflare Workers?
  - A: Cloudflare Workers support `scheduled` event handlers via cron triggers configured in `wrangler.toml`. This is the standard approach for periodic tasks on the platform.
  - Evidence: Cloudflare Workers documentation (platform capability)

- Q: Should recovery target the Gmail labels, the D1 inbox, or both?
  - A: Both, but with different approaches and different trigger mechanisms. Gmail label recovery reuses the existing `handleReconcileInProgress` logic and stays in the MCP server -- the agent calls it on a schedule (no Worker Gmail API access needed). D1 inbox recovery runs as a Cloudflare Workers scheduled handler and detects `pending` threads that were admitted but never received a draft (stuck due to sync crash or draft generation failure), then re-triggers draft generation. Threads in `drafted` or `approved` status are intentionally awaiting operator action and are not candidates for automatic recovery.
  - Evidence: architectural analysis of the two parallel systems; Gmail API credentials live in MCP server only

- Q: What stale threshold is appropriate?
  - A: The existing MCP reconcile tool defaults to 2 hours (`staleHours: 2`). This is reasonable for Gmail labels. For D1 inbox `pending` threads that were admitted but lack a draft, a 2-hour threshold is also appropriate -- any admitted thread that has not progressed to `drafted` within 2 hours likely failed silently.
  - Evidence: `packages/mcp-server/src/tools/gmail-reconciliation.ts:33` (schema default)

### Open (Operator Input Required)

- Q: What frequency should the automatic recovery run at?
  - Why operator input is required: This is an operational preference -- too frequent wastes resources; too infrequent delays recovery.
  - Decision impacted: Cron trigger schedule in wrangler.toml
  - Decision owner: Operator
  - Default assumption: Every 30 minutes. Risk: minimal -- reconcile is lightweight (scans labels, re-routes stale threads).

## Confidence Inputs

- **Implementation: 80%** -- The existing `handleReconcileInProgress` logic provides a proven pattern. Adding a Cloudflare Workers cron trigger is straightforward. The D1 stale-thread query is simple SQL. Evidence: existing reconcile handler code, D1 schema with indexed `status` + `updated_at` columns. Raises to >=90: confirming wrangler.toml cron trigger config works with OpenNext-deployed Workers.

- **Approach: 85%** -- Split-responsibility approach: Gmail label recovery stays in MCP tool (agent-scheduled), D1 inbox recovery runs as a Cloudflare Workers scheduled handler. This avoids the Gmail credentials problem entirely and keeps each system's recovery in the component that owns the state. Evidence: clear separation of the two systems in the codebase. Raises to >=90: confirming cron triggers work with OpenNext-deployed Workers.

- **Impact: 85%** -- Eliminates manual operator intervention for stuck threads, which is a direct operational improvement. Evidence: dispatch payload states this creates operational drag and risks missed emails. Raises to >=90: production data on frequency of stuck threads (currently unknown).

- **Delivery-Readiness: 82%** -- All building blocks exist: reconcile logic in MCP, D1 query patterns in repositories.server.ts, Cloudflare Workers cron triggers as a platform feature. Gmail credentials are not a concern since Gmail recovery stays in the MCP tool. Raises to >=90: confirming `wrangler.toml` cron trigger config works alongside OpenNext Worker deployment.

- **Testability: 80%** -- Core detection and recovery logic is easily unit-testable with mocked D1 and Gmail client. Cron trigger invocation is harder to test but can be validated via wrangler dev. Evidence: existing test patterns in `sync.server.test.ts` and `gmail-reconciliation.test.ts`. Raises to >=90: adding a test fixture for stale thread scenarios.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Recovery creates duplicate draft generation (re-generates draft for a thread that already has one via a different path) | Low | Medium | Check for existing drafts before re-triggering generation; `syncInbox` preserves status for unchanged inbound messages. |
| Cron trigger conflicts with manual MCP reconcile invocation | Low | Low | Both are idempotent -- running reconcile twice on the same thread is safe (it will be a no-op on the second run if already re-routed). |
| Recovery masks underlying bugs (threads get stuck due to a bug, recovery hides it) | Low | Medium | Emit telemetry for every recovery action so stuck-thread frequency can be monitored. Alert if recovery count exceeds threshold. |
| Cloudflare Workers cron trigger not compatible with OpenNext deployment | Low | High | Verify during planning that `wrangler.toml` supports `[triggers]` section alongside OpenNext Worker config. Fallback: use a Cloudflare Pages Function cron or a separate lightweight Worker. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Fail-open: recovery must never block normal inbox processing
  - Idempotent: running recovery multiple times must be safe
  - Telemetry: emit events for all recovery actions (builds on `email_reconcile_recovery` from email-logging-observability)
- Rollout/rollback expectations:
  - Cron trigger can be disabled by removing the trigger from wrangler.toml without code changes
  - Recovery logic should be behind a feature check (e.g., env var `INBOX_RECOVERY_ENABLED`) for quick disable
- Observability expectations:
  - Recovery actions logged to D1 `thread_events` table
  - Recovery counts visible in telemetry (existing `email_reconcile_recovery` event key for Gmail side; new event type for D1 side)

## Suggested Task Seeds (Non-binding)

1. Add `findStaleAdmittedThreads` D1 query function that returns threads in `pending` status with admission decision `admit`, no associated draft, AND `needsManualDraft` metadata flag is NOT set (excludes threads intentionally flagged for manual follow-up after draft quality/error failure)
2. Add `recoverStaleThread` function that re-triggers draft generation for stuck admitted threads and logs a recovery event
3. Add Cloudflare Workers scheduled handler (`scheduled` event) that calls stale thread detection and recovery for D1 inbox
4. Configure cron trigger in `wrangler.toml` for the scheduled handler
5. Add unit tests for stale thread detection and recovery logic
6. Add `inbox_recovery` telemetry event type for D1 inbox recovery (complement to `email_reconcile_recovery` on the Gmail side)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: unit tests passing in CI, recovery handler deployed, telemetry events emitted on recovery
- Post-delivery measurement plan: monitor recovery event frequency via telemetry; confirm zero manual reconciliation interventions needed over a 1-week period

## Evidence Gap Review

### Gaps Addressed

- [x] Citation integrity: all claims cite specific file paths and line numbers
- [x] Integration boundaries: Gmail API and D1 database boundaries inspected; auth boundary for scheduled handler identified as a risk
- [x] Error/fallback paths: sync failure modes analyzed; recovery idempotency confirmed
- [x] Existing tests verified: `gmail-reconciliation.test.ts` (TC-R3, TC-R4), `telemetry.server.test.ts`, `sync.server.test.ts` all confirmed present
- [x] Coverage gaps identified: no tests for stale thread detection or cron handler
- [x] Confidence scores reflect evidence (Delivery-Readiness at 82%, Gmail credentials concern eliminated by split-responsibility architecture)

### Confidence Adjustments

- No downward adjustments needed. Split-responsibility approach (Gmail recovery in MCP, D1 recovery in Worker cron) eliminates the Gmail credentials risk.

### Remaining Assumptions

- Cloudflare Workers cron triggers work with OpenNext-deployed Workers (high confidence, standard platform feature)
- 2-hour stale threshold is appropriate for both Gmail and D1 recovery (medium confidence, may need tuning based on production data)
- `pending` threads with admission decision `admit`, no associated draft, and `needsManualDraft` NOT set are the correct population for D1 recovery (high confidence -- excludes both non-admitted threads and threads where draft generation deliberately failed quality checks)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none. Gmail credentials concern eliminated by keeping Gmail-side recovery in the MCP tool. D1 recovery in the scheduled Worker handler only needs the D1 binding (already configured).
- Recommended next step: `/lp-do-plan reception-inbox-inprogress-recovery --auto`

## Access Declarations

- Gmail API: required for reading In-Progress labelled messages and modifying labels. Access via MCP server OAuth credentials (verified in existing `gmail_reconcile_in_progress` tool). Status: VERIFIED. Gmail-side recovery stays in the MCP tool; no Worker access needed.
- D1 database (`RECEPTION_INBOX_DB`): required for querying stale threads and updating status. Access via Cloudflare Worker binding. Status: VERIFIED (`apps/reception/src/lib/inbox/db.server.ts`).
