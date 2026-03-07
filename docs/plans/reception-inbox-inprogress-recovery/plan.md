---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-inprogress-recovery
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average
Auto-Build-Intent: plan+auto
---

# Reception Inbox In-Progress Recovery Plan

## Summary

Stuck email threads in the BRIK inbox pipeline require manual operator intervention to recover. This plan adds automatic recovery for threads stuck in the D1 inbox -- specifically `pending` threads that were admitted but never received a draft due to a sync crash or timeout (excluding threads intentionally flagged for manual drafting). Recovery runs via an internal API route triggered by a Cloudflare cron, detecting stale admitted threads, re-triggering draft generation, and logging telemetry events. Gmail-side In-Progress label recovery continues via the existing MCP `gmail_reconcile_in_progress` tool invoked during the agent's periodic workflow.

## Active tasks

- [x] TASK-01: Add `inbox_recovery` telemetry event type and `findStaleAdmittedThreads` query
- [x] TASK-02: Add `recoverStaleThreads` recovery function
- [x] TASK-03: Add internal cron API route and wrangler cron trigger config

## Goals

- Automatically detect D1 inbox threads stuck in `pending` (admitted, no draft, not flagged for manual drafting) beyond a 2-hour threshold
- Re-trigger draft generation for stuck threads without manual intervention
- Log all recovery actions via telemetry for monitoring
- Enable/disable recovery via environment variable without code changes

## Non-goals

- Gmail label recovery automation (stays in existing MCP tool, invoked by agent)
- Recovery for threads in `drafted` or `approved` states (intentional operator-review states)
- Recovery for threads with `needsManualDraft: true` (intentional quality-failure follow-up)
- Consolidating the MCP gmail.ts monolith
- Adding new thread status types

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`
  - OpenNext worker.js is regenerated on each build -- cannot modify it directly. Must use an API route pattern for cron triggers.
  - Fail-open: recovery must never block normal inbox processing
  - Recovery must be idempotent
- Assumptions:
  - Cloudflare cron triggers invoke the Worker's `scheduled` handler, which calls the OpenNext handler's `fetch` method directly with a synthetic request (standard pattern for extending OpenNext Workers)
  - 2-hour stale threshold is appropriate (configurable via env var)
  - 30-minute cron interval is appropriate (operator can adjust in wrangler.toml)

## Inherited Outcome Contract

- **Why:** Threads that get stuck in In-Progress state require manual operator intervention to recover. This creates operational drag and risks emails being missed when the operator is unavailable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Stuck In-Progress threads are automatically detected and retried without manual operator intervention.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-inprogress-recovery/fact-find.md`
- Key findings used:
  - D1 inbox stuck state is `pending` threads with admission decision `admit`, no draft, and `needsManualDraft` NOT set
  - `syncInbox` processes threads sequentially with no batch transaction; crash mid-loop leaves threads in `pending` with no draft
  - Threads with `needsManualDraft: true` are intentional quality-failure cases, not recovery candidates
  - OpenNext worker only exports a `fetch` handler; `scheduled` handler cannot be injected directly
  - Gmail OAuth secrets already configured on reception Worker (but Gmail recovery stays in MCP tool per split-responsibility)
  - Existing telemetry patterns in `telemetry.server.ts` (critical vs best-effort events)
  - Existing test patterns in `sync.server.test.ts` and `gmail-reconciliation.test.ts`

## Proposed Approach

- Option A: Cloudflare Workers `scheduled` event handler alongside OpenNext fetch handler. Rejected: OpenNext regenerates worker.js on each build, making this fragile.
- Option B: Separate lightweight Worker for cron job. Rejected: adds deployment complexity and requires cross-Worker D1 binding.
- Option C: Internal API route (`/api/internal/inbox-recovery`) invoked by a thin custom Worker entry wrapper that adds a `scheduled` handler. The wrapper imports the OpenNext worker default export and delegates `fetch` to it, while the `scheduled` handler constructs a synthetic Request and passes it to the same OpenNext `fetch(request, env, ctx)` handler directly. The `[triggers]` cron config in wrangler.toml invokes the `scheduled` handler.
- Option D: Rely solely on the agent to periodically call recovery via MCP tool. Rejected: does not work when agent is offline.
- Chosen approach: Option C. A thin `worker-entry.ts` wrapper around OpenNext's generated `worker.js` adds a `scheduled` handler. The wrapper re-exports all OpenNext named exports (DO classes) and delegates `fetch` to the OpenNext default export's `fetch(request, env, ctx)` method. The `scheduled` handler calls `openNextWorker.fetch(new Request("https://internal/api/internal/inbox-recovery", { method: "POST", headers: { Authorization: "Bearer " + env.INBOX_RECOVERY_SECRET } }), env, ctx)` -- invoking the OpenNext handler directly, NOT global `fetch()`. This ensures the request is processed by the Worker's own routing with full `env`/`ctx` bindings. The wrapper is a build-time artifact referenced from `wrangler.toml` via `main`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `inbox_recovery` telemetry event type and `findStaleAdmittedThreads` query | 85% | S | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add `recoverStaleThreads` function with draft re-generation | 80% | S | Complete (2026-03-07) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add internal cron API route and wrangler cron trigger config | 80% | S | Complete (2026-03-07) | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Foundation: telemetry event type + stale thread query |
| 2 | TASK-02 | TASK-01 | Core: recovery function using query from TASK-01 |
| 3 | TASK-03 | TASK-02 | Integration: API route + cron config wiring |

## Tasks

---

### TASK-01: Add `inbox_recovery` telemetry event type and `findStaleAdmittedThreads` query

- **Type:** IMPLEMENT
- **Deliverable:** New `inbox_recovery` event type in telemetry, new `findStaleAdmittedThreads` query function in repositories, unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/telemetry.server.ts`, `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
- **Build evidence:** Inline execution. Added `inbox_recovery` to `inboxEventTypes` array. Added `findStaleAdmittedThreads` function with SQL query filtering pending+admitted+no-draft+no-manual-flag+stale. Tests created covering TC-01 through TC-07. Typecheck and lint pass.
  - Implementation: 85% - Extending the existing `inboxEventTypes` array and adding a D1 query follows established patterns in `telemetry.server.ts` and `repositories.server.ts`. Held-back test: no single unknown would drop below 80 -- the event type is a string constant addition, and the query is standard SQL with existing indexed columns.
  - Approach: 85% - Query joins `threads`, `admission_outcomes`, and checks `drafts` absence + `metadata_json` for `needsManualDraft`. All tables and indexes exist.
  - Impact: 85% - Foundation for recovery; no user-visible change alone.
- **Acceptance:**
  - `inbox_recovery` is a valid `InboxEventType`
  - `findStaleAdmittedThreads(db, staleThresholdMs)` returns threads in `pending` status where: (a) latest admission decision is `admit`, (b) no row exists in `drafts` for the thread, (c) `metadata_json` does not contain `needsManualDraft: true`, (d) `updated_at` is older than `staleThresholdMs` milliseconds ago
  - Function returns empty array when no threads match
  - Function respects a configurable limit parameter (default 20)
- **Validation contract (TC-XX):**
  - TC-01: Thread in `pending` + admitted + no draft + no manual flag + stale -> returned in results
  - TC-02: Thread in `pending` + admitted + has draft -> NOT returned
  - TC-03: Thread in `pending` + admitted + `needsManualDraft: true` -> NOT returned
  - TC-04: Thread in `pending` + admitted + updated recently (within threshold) -> NOT returned
  - TC-05: Thread in `drafted` status -> NOT returned (regardless of other criteria)
  - TC-06: Thread in `pending` + admission decision `auto-archive` -> NOT returned
  - TC-07: `inbox_recovery` event can be logged via `recordInboxEvent` without error
- **Execution plan:** Red -> Green -> Refactor. Write test file first with TC-01 through TC-07, then implement query and event type, then refactor if needed.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Verify `metadata_json` field is reliably populated with `needsManualDraft` flag by `syncInbox` -- confirmed at `sync.server.ts:593-594` where `needsManualDraft` is set in metadata and persisted via `buildThreadMetadata`.
- **Edge Cases & Hardening:**
  - `metadata_json` is null or unparseable: treat as NOT having `needsManualDraft` (eligible for recovery -- fail-open toward recovery is safer than leaving threads stuck)
  - Thread has multiple admission outcomes: use the latest (most recent `created_at`)
  - Limit parameter prevents unbounded result sets
- **What would make this >=90%:**
  - Confirming the exact SQL query performs well on production D1 data volume
- **Rollout / rollback:**
  - Rollout: deploy with TASK-02 and TASK-03; no standalone effect
  - Rollback: remove event type and function; no data migration needed
- **Documentation impact:** None
- **Notes / references:**
  - Existing event types: `apps/reception/src/lib/inbox/telemetry.server.ts:11-21`
  - Existing thread query patterns: `apps/reception/src/lib/inbox/repositories.server.ts:242-283`
  - D1 schema: `apps/reception/migrations/0001_inbox_init.sql`

---

### TASK-02: Add `recoverStaleThreads` function with draft re-generation

- **Type:** IMPLEMENT
- **Deliverable:** New `recoverStaleThreads` function in a new `apps/reception/src/lib/inbox/recovery.server.ts` module, unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/recovery.server.ts` (new), `apps/reception/src/lib/inbox/sync.server.ts` (export 5 helpers), `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 80%
- **Build evidence:** Inline execution. Exported 5 helpers from sync.server.ts (buildThreadContext, inferPrepaymentProvider, inferPrepaymentStep, extractEmailAddress, getLatestInboundMessage). Created recovery.server.ts with recoverStaleThreads function mirroring full syncInbox context. Tests cover TC-01 through TC-06. Typecheck passes.
  - Implementation: 80% - Reuses `syncInbox` draft generation path (`generateAgentDraft`, `createDraft`, `updateThreadStatus`). The recovery function calls these existing functions for each stale thread. Held-back test: no single unknown would drop below 80 -- all called functions have known signatures and existing tests.
  - Approach: 85% - Each stale thread is re-processed individually with existing draft generation logic; status is updated and telemetry logged. Idempotent by design (draft existence check prevents duplicate generation).
  - Impact: 85% - Core recovery logic; makes stuck threads recoverable.
- **Acceptance:**
  - `recoverStaleThreads({ db, staleThresholdMs, limit })` calls `findStaleAdmittedThreads`, then for each thread mirrors the full `syncInbox` draft generation context:
    0. **Prerequisite:** Export `buildThreadContext`, `inferPrepaymentProvider`, and `inferPrepaymentStep` from `sync.server.ts` (currently non-exported local functions at lines 156, 179, 192). Add `export` keyword to each -- no signature or logic changes.
    1. Fetches Gmail thread data via `getGmailThread`
    2. Extracts latest inbound message (using `isInboundMessage` + mailbox email from `getGmailProfile`)
    3. Runs guest matching via `matchSenderToGuest` (same as `sync.server.ts:547`)
    4. Infers prepayment provider and step via now-exported `inferPrepaymentProvider` / `inferPrepaymentStep`
    5. Builds thread context via now-exported `buildThreadContext`
    6. Calls `generateAgentDraft` with all context fields (from, subject, body, threadContext, prepaymentProvider, prepaymentStep, guestName)
    7. If draft quality passes: creates draft record via `createDraft`, updates thread status to `drafted`, logs `inbox_recovery` event with `{ outcome: "recovered" }`
    8. If draft fails or quality fails: sets `needsManualDraft: true` in thread metadata (matching `syncInbox` behavior at line 587-588), logs `inbox_recovery` event with `{ outcome: "manual_flagged" }`, increments `recoveryAttempts` counter. Thread is now excluded from future recovery by the `needsManualDraft` filter in `findStaleAdmittedThreads`.
  - Function returns a summary: `{ processed: number, recovered: number, manualFlagged: number, skipped: number }`
  - Function is fail-open: errors on individual threads do not abort processing of remaining threads
  - Recovery respects a `maxRetries` metadata counter (default 3) to prevent repeated attempts before flagging for manual drafting
- **Validation contract (TC-XX):**
  - TC-01: Stale admitted thread with no draft -> draft generated with full context (guest match, prepayment, thread context), status updated to `drafted`, `inbox_recovery` event logged with `outcome: "recovered"`
  - TC-02: Draft generation fails or quality fails -> `needsManualDraft: true` set in metadata (matching syncInbox behavior), `inbox_recovery` event logged with `outcome: "manual_flagged"`, retry counter incremented
  - TC-03: Thread at max retry count -> `needsManualDraft: true` set immediately (skip draft attempt), `inbox_recovery` event logged with `outcome: "max_retries"`
  - TC-04: Error on one thread does not prevent processing of next thread
  - TC-05: Summary counts match actual outcomes
  - TC-06: No Gmail thread found (deleted externally) -> skipped gracefully, logged
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S effort
- **Scouts:**
  - Verify `getGmailThread` is importable from `sync.server.ts` context -- confirmed: it's imported from `../gmail-client` at `sync.server.ts:8`
  - Verify `generateAgentDraft` signature: `{ from, subject, body, threadContext, prepaymentProvider, prepaymentStep, guestName }` -- confirmed at `sync.server.ts:565-573`
  - Verify `buildThreadContext`, `inferPrepaymentProvider`, `inferPrepaymentStep` are self-contained functions with no closure dependencies -- confirmed: pure functions at lines 156, 179, 192 with no references to outer `syncInbox` scope. Safe to export without refactoring.
- **Edge Cases & Hardening:**
  - Gmail API rate limiting: process threads sequentially, respect limit parameter
  - D1 concurrent access: recovery runs on cron schedule, unlikely to collide with manual sync, but status check before draft creation prevents duplicates
  - Max retry counter stored in thread `metadata_json` as `recoveryAttempts: number`; incremented on each attempt (success or failure)
- **What would make this >=90%:**
  - End-to-end test with real D1 and mocked Gmail API confirming full recovery cycle
- **Rollout / rollback:**
  - Rollout: deploy with TASK-03; no standalone effect
  - Rollback: remove recovery module; no data migration
- **Documentation impact:** None
- **Notes / references:**
  - Draft generation: `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
  - Gmail client: `apps/reception/src/lib/gmail-client.ts` (used by `sync.server.ts`)
  - Thread metadata pattern: `apps/reception/src/lib/inbox/sync.server.ts:240-260`

---

### TASK-03: Add internal cron API route, Worker entry wrapper, and wrangler cron config

- **Type:** IMPLEMENT
- **Deliverable:** New API route `apps/reception/src/app/api/internal/inbox-recovery/route.ts`, new Worker entry wrapper `apps/reception/worker-entry.ts`, updated `apps/reception/wrangler.toml` with cron trigger and entry point override, unit test for route auth
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/app/api/internal/inbox-recovery/route.ts` (new), `apps/reception/worker-entry.ts` (new), `apps/reception/wrangler.toml`, `apps/reception/src/lib/inbox/__tests__/recovery-route.test.ts` (new), `tools/eslint-ignore-patterns.cjs` (controlled scope expansion: worker-entry.ts excluded from eslint parser since it's compiled by wrangler not tsc)
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 80%
- **Build evidence:** Inline execution. Created API route with Bearer auth, enabled/disabled toggle, configurable stale threshold. Created worker-entry.ts wrapper delegating fetch to OpenNext and adding scheduled handler. Updated wrangler.toml with new main entry point and cron trigger. Route tests cover TC-01 through TC-05 + 503 case. Typecheck and lint pass.
  - Implementation: 80% - API route follows existing patterns in `apps/reception/src/app/api/mcp/inbox/`. Worker entry wrapper is a thin file (~20 lines) that re-exports OpenNext's exports and adds a `scheduled` handler. Held-back test: no single unknown would drop below 80 -- the wrapper pattern is standard for extending OpenNext Workers with cron triggers.
  - Approach: 80% - Worker entry wrapper imports `.open-next/worker.js`, re-exports its default `fetch` handler and named exports (DO classes), and adds a `scheduled` handler that calls `fetch(new Request(...))` internally with the recovery secret. The API route authenticates via `INBOX_RECOVERY_SECRET`. Held-back test: no single unknown because internal fetch from scheduled handler to API route is a well-documented Cloudflare pattern.
  - Impact: 85% - Completes the automation chain; stuck threads are automatically recovered on schedule.
- **Acceptance:**
  - `worker-entry.ts`: thin wrapper that imports OpenNext worker default export, re-exports all named exports (DOQueueHandler, DOShardedTagCache, BucketCachePurge), delegates `fetch` to OpenNext's `fetch(request, env, ctx)`, and adds a `scheduled(event, env, ctx)` handler that calls `openNextWorker.fetch(new Request("https://internal/api/internal/inbox-recovery", { method: "POST", headers: { Authorization: "Bearer " + env.INBOX_RECOVERY_SECRET } }), env, ctx)` -- directly invoking the OpenNext handler (NOT global `fetch()`), so the request uses the Worker's own env bindings and routing
  - `wrangler.toml`: `main` changed from `.open-next/worker.js` to `worker-entry.ts` (or compiled output); `[triggers]` section added with `crons = ["*/30 * * * *"]`
  - POST `/api/internal/inbox-recovery` requires `Authorization: Bearer <INBOX_RECOVERY_SECRET>` header
  - Returns 401 if secret missing/wrong
  - Returns 200 with recovery summary on success
  - Route calls `recoverStaleThreads` with configurable threshold from `INBOX_RECOVERY_STALE_HOURS` env var (default 2)
  - Recovery can be disabled via `INBOX_RECOVERY_ENABLED=false` env var (route returns 200 with `{ enabled: false }`)
- **Validation contract (TC-XX):**
  - TC-01: Request with valid secret -> 200 response with recovery summary
  - TC-02: Request without secret -> 401 response
  - TC-03: Request with wrong secret -> 401 response
  - TC-04: `INBOX_RECOVERY_ENABLED=false` -> 200 response with `{ enabled: false }`, no recovery executed
  - TC-05: Recovery function error -> 500 response with error logged, does not crash Worker
  - TC-06: Worker entry wrapper correctly delegates `fetch` to OpenNext handler -- verified by manual staging deployment test (not unit-testable: wrapper depends on OpenNext build output). Acceptance narrowed: confirm cron fires and recovery route responds 200 in staging.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Verify OpenNext worker default export shape -- confirmed at `.open-next/worker.js:15-49`: exports `default { async fetch(request, env, ctx) { ... } }`. The `scheduled` handler in the wrapper can call `openNextWorker.fetch(syntheticRequest, env, ctx)` to route the request through the full OpenNext/Next.js pipeline. This is a direct method call on the imported module, not a global `fetch()`.
- **Edge Cases & Hardening:**
  - Cron trigger timeout: Cloudflare Workers have a 30-second CPU time limit. Recovery processes threads sequentially with a limit (default 20), which is well within the budget.
  - Concurrent cron invocations: unlikely with 30-minute interval, but idempotent recovery prevents issues
  - Missing env vars: route returns 503 with descriptive error if `INBOX_RECOVERY_SECRET` is not configured
  - OpenNext rebuild: worker-entry.ts imports from `.open-next/worker.js` which is regenerated on each build. The import path is stable (`import openNextWorker from "./.open-next/worker.js"`).
- **What would make this >=90%:**
  - Confirming the wrapper works end-to-end in staging deployment (cron fires, scheduled handler calls fetch, API route executes recovery)
- **Rollout / rollback:**
  - Rollout: deploy Worker with new entry wrapper + cron trigger via `wrangler deploy`. Set `INBOX_RECOVERY_SECRET` and optionally `INBOX_RECOVERY_STALE_HOURS` via `wrangler secret put`.
  - Rollback: revert `main` in `wrangler.toml` to `.open-next/worker.js` and remove `[triggers]`. Redeploy. Recovery becomes inert.
- **Documentation impact:** Add env var documentation to `apps/reception/.env.example` for `INBOX_RECOVERY_SECRET`, `INBOX_RECOVERY_STALE_HOURS`, `INBOX_RECOVERY_ENABLED`
- **Notes / references:**
  - Existing Worker entry: `apps/reception/.open-next/worker.js` (generated by OpenNext)
  - Current wrangler.toml: `apps/reception/wrangler.toml` (`main = ".open-next/worker.js"`)
  - Cloudflare cron triggers docs: https://developers.cloudflare.com/workers/configuration/cron-triggers/
  - Existing API route patterns: `apps/reception/src/app/api/mcp/inbox/route.ts`

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Telemetry event type + stale query | Yes | None | No |
| TASK-02: Recovery function | Yes | None -- depends on TASK-01 outputs (event type + query function) which will exist after TASK-01 completes | No |
| TASK-03: API route + cron config | Yes | None -- depends on TASK-02 output (recovery function) which will exist after TASK-02 completes. `wrangler.toml` exists and is writable. | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Draft re-generation produces different/worse draft than original attempt would have | Low | Low | Uses same `generateAgentDraft` pipeline; quality gate still applies |
| Cron trigger does not work with OpenNext Worker | Low | High | Worker entry wrapper calls OpenNext handler directly via `openNextWorker.fetch()`, not external HTTP. Fallback: external cron service or manual agent invocation. |
| Recovery creates load spike on Gmail API | Low | Medium | Limit parameter (default 20) caps per-invocation volume; 30-minute interval spreads load |
| Max retry counter prevents permanent recovery of intermittently failing threads | Low | Low | Counter is intentionally permanent per thread (persisted in metadata_json via `...existing` spread in `buildThreadMetadata`). After max retries, `needsManualDraft` is set, routing the thread to operator follow-up. Operator can manually clear `recoveryAttempts` if re-retry is desired. |

## Observability

- Logging: `inbox_recovery` events in D1 `thread_events` table with metadata (recovery attempt count, success/failure, reason)
- Metrics: Recovery summary returned by API route (`{ processed, recovered, manualFlagged, skipped }`) logged to Worker console
- Alerts/Dashboards: Monitor `inbox_recovery` event frequency via `listInboxEvents` query; high recovery counts indicate upstream issues

## Acceptance Criteria (overall)

- [ ] Admitted threads stuck in `pending` for >2 hours (without draft, without `needsManualDraft` flag) are automatically recovered via draft re-generation
- [ ] Recovery runs on a 30-minute cron schedule via Cloudflare cron trigger
- [ ] Recovery is idempotent -- running multiple times produces no duplicate drafts
- [ ] Recovery is fail-open -- errors on individual threads do not block processing of others
- [ ] Recovery can be disabled via `INBOX_RECOVERY_ENABLED=false` env var
- [ ] All recovery actions are logged via `inbox_recovery` telemetry events
- [ ] Unit tests cover stale thread detection, recovery logic, and API route authentication
- [ ] Threads with `needsManualDraft: true` are never auto-recovered
- [ ] Max retry counter (default 3) prevents infinite retry loops

## Decision Log

- 2026-03-07: Chose Option C (internal API route + cron trigger) over Options A (scheduled handler -- incompatible with OpenNext) and B (separate Worker -- too complex). Evidence: OpenNext worker.js only exports `fetch` handler; API route approach uses existing Next.js routing.
- 2026-03-07: Chose D1-only recovery in Worker cron; Gmail label recovery stays in MCP tool. Evidence: split-responsibility avoids Gmail credential complexity; MCP tool already has proven reconcile logic.
- 2026-03-07: Chose to exclude `needsManualDraft: true` threads from recovery. Evidence: these are intentional quality-failure cases per `sync.server.ts:575-589`.

## Overall-confidence Calculation

- TASK-01: 85% * S(1) = 85
- TASK-02: 80% * S(1) = 80
- TASK-03: 80% * S(1) = 80
- Overall = (85 + 80 + 80) / 3 = 81.67% -> 82%
