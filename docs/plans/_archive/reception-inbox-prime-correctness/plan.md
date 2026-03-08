---
Type: Plan
Status: Archived
Domain: Product-Engineering
Workstream: Product-Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Build-completed: 2026-03-08
Build-commit: 1290cd4c02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-prime-correctness
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average across tasks
Auto-Build-Intent: plan+auto
---

# Reception Inbox Prime Correctness — Plan

## Summary

Four confirmed correctness gaps in the unified Reception inbox are fixed across two deployed apps (Prime Cloudflare Pages Functions and the Reception Next.js app). Issue A (Prime terminal threads appearing in default list) is fixed at both the Prime server query layer and with a Reception-side guard. Issue B (rich Prime message fields stripped before Reception sees them) is fixed at the Prime serializer and propagated through the Reception mapper. Issue C (no server refresh after send) and Issue D (AbortController signal not wired to fetch) are single-function fixes in the Reception client hook. All changes are additive or minimal in blast radius. No new infrastructure, no schema migrations.

## Active Tasks

- [x] TASK-01: Prime visibility filter — server-side query + endpoint
- [x] TASK-02: Prime visibility filter — Reception defense-in-depth
- [x] TASK-03: Prime rich message field serialization
- [x] TASK-04: Reception rich message mapper update
- [x] TASK-05: sendDraft post-send server refresh
- [x] TASK-06: AbortController signal wiring

## Goals

- Prime terminal threads hidden from default inbox list (same rule as email)
- Rich Prime message fields (links, attachments, cards, audience, campaignId) available in Reception thread detail API response
- Canonical server state reloaded after `sendDraft()` completes
- In-flight `fetchInboxThread` requests cancelled when user switches threads

## Non-goals

- No UI rendering changes for rich message fields (deferred per operator open question)
- No changes to email thread behaviour
- No changes to Prime messaging model or Firebase storage
- No changes to resolve/dismiss actions (already correct)

## Constraints & Assumptions

- Constraints:
  - Issues A and B touch `apps/prime` (Cloudflare Pages Functions, deployed independently). Prime must be deployable before or after Reception for each fix — all Reception changes degrade gracefully when Prime hasn't updated yet.
  - Tests run in CI only. Writer lock required before committing.
  - `review-threads.test.ts` TC-02 has the exact SQL query hardcoded — TASK-01 must update this test when the WHERE clause is added.
- Assumptions:
  - `links_json`, `attachments_json`, `cards_json`, `campaign_id` are populated at write time in `message_records`; no backfill needed.
  - `refreshThreadDetail()` is the correct post-send reload granularity — avoids list re-sort disruption.
  - Signal threading (TASK-06) requires no type change to `InboxRequestInit` — it already extends `RequestInit` which includes `signal?: AbortSignal`.

## Inherited Outcome Contract

- **Why:** Code audit confirmed four correctness gaps in the unified inbox. Staff can see resolved Prime threads that should be hidden, cannot inspect full message content before approving, see stale state after sending, and waste network resource on thread switches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four inbox correctness gaps are fixed, verified by targeted unit tests, and the inbox behaves consistently between email and Prime paths.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-prime-correctness/fact-find.md`
- Key findings used:
  - Issue A: `listPrimeReviewThreads` SQL has no WHERE clause; Reception route applies `isThreadVisibleInInbox` to email but not Prime
  - Issue B: `PrimeMessageRecordRow` has `links_json`/`attachments_json`/`cards_json`/`campaign_id`; `serializeMessage()` drops them; Reception mapper hardcodes `attachments: []`
  - Issue C: `saveDraft` and `regenerateDraft` call `refreshThreadDetail`; `sendDraft` does not
  - Issue D: `InboxRequestInit extends RequestInit`; signal not passed from `selectThread` to `fetchInboxThread`; `review-threads.test.ts` TC-02 has hardcoded SQL query

## Proposed Approach

Both layers of Issue A require a change (server-authoritative filter + Reception guard). Issue B is a type extension + serializer update. Issues C and D are one-line fixes with stale-thread guards. All tasks are independently safe to deploy in any order.

Chosen approach: Fix all four issues as six targeted tasks. Wave 1 covers all Prime Functions changes plus the two standalone Reception hook fixes. Wave 2 covers the two Reception changes that complete Issue A and Issue B after the Prime layer is updated. Single Prime deployment covers TASK-01 and TASK-03. Single Reception deployment covers TASK-02, TASK-04, TASK-05, TASK-06.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Prime visibility filter — server-side query + endpoint | 85% | M | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Prime visibility filter — Reception defense-in-depth | 85% | S | Complete (2026-03-08) | - | - |
| TASK-03 | IMPLEMENT | Prime rich message field serialization | 80% | M | Complete (2026-03-08) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Reception rich message mapper update | 80% | S | Complete (2026-03-08) | TASK-03 | - |
| TASK-05 | IMPLEMENT | sendDraft post-send server refresh | 90% | S | Complete (2026-03-08) | - | - |
| TASK-06 | IMPLEMENT | AbortController signal wiring | 80% | S | Complete (2026-03-08) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-05, TASK-06 | - | Prime and Reception changes fully independent. Prefer deploying Prime (TASK-01 + TASK-03) first. |
| 2 | TASK-04 | TASK-03 complete | Reception mapper update; can deploy in same Reception build as TASK-02, TASK-05, TASK-06 |

## Tasks

---

### TASK-01: Prime visibility filter — server-side query + endpoint

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/prime/functions/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/prime/functions/lib/prime-messaging-repositories.ts` — `listPrimeReviewThreads()` SQL query; add optional `statusFilter` param
  - `apps/prime/functions/api/review-threads.ts` — parse optional `status` query param and pass to repository
  - `apps/prime/functions/__tests__/review-threads.test.ts` — TC-02 SQL mock key must be updated to match new query; add TC for status filtering
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact query location (`prime-messaging-repositories.ts:1440`), endpoint handler, and test mock confirmed; SQL change is a straightforward WHERE clause addition.
  - Approach: 90% — default exclusion of terminal statuses (`NOT IN ('resolved', 'sent', 'auto_archived')`) with optional override matches the email pattern in Reception.
  - Impact: 85% — closes the authoritative server-side source of terminal threads leaking through; Reception guard in TASK-02 is defense-in-depth.
- **Acceptance:**
  - `listPrimeReviewThreads` excludes `review_status IN ('resolved', 'sent', 'auto_archived')` by default when no status filter provided
  - `GET /api/review-threads` accepts optional `?status=<value>` param; passes it to `listPrimeReviewThreads`
  - TC-02 in `review-threads.test.ts` updated to match new SQL query string
  - New test: resolved/sent/auto_archived threads excluded from default list response
  - New test: explicit `?status=resolved` returns only resolved threads
- **Validation contract:**
  - TC-01: `listPrimeReviewThreads(db)` (no status arg) → SQL query includes `WHERE t.review_status NOT IN ('resolved', 'sent', 'auto_archived')`
  - TC-02: `listPrimeReviewThreads(db, 50, 'pending')` → SQL query includes `WHERE t.review_status = 'pending'`
  - TC-03: `GET /api/review-threads` with a resolved thread in DB → thread absent from response
  - TC-04: `GET /api/review-threads?status=resolved` with a resolved thread in DB → thread present in response
- **Execution plan:**
  - Red: add TC-03 and TC-04 tests (fail against current unfiltered query)
  - Green: add `statusFilter?: PrimeReviewStatus` param to `listPrimeReviewThreads`; update SQL to add `WHERE t.review_status NOT IN (...)` when no filter, or `WHERE t.review_status = ?` when filter provided; update `review-threads.ts` handler to parse and pass `status`; update TC-02 SQL string to match new query
  - Refactor: confirm no other callers of `listPrimeReviewThreads` exist; confirm `serializeSummary` requires no changes
- **Planning validation:**
  - Checks run: Read `prime-messaging-repositories.ts:1440-1479` (SQL confirmed no WHERE); Read `review-threads.ts:28-53` (handler confirmed); Read `review-threads.test.ts:49-107` (TC-02 hardcoded SQL key confirmed)
  - Validation artifacts: SQL query at `prime-messaging-repositories.ts:1472` is the mock key in test
  - Unexpected findings: TC-02 hardcoded SQL string — update is required alongside the production change
- **Scouts:**
  - Verify no other callers of `listPrimeReviewThreads` in `apps/prime/functions/` before changing signature (expected: only `review-threads.ts`)
- **Edge Cases & Hardening:**
  - Invalid `?status` value → return 400 (matches existing `parseLimit` error pattern in the handler)
  - `status` param present but value not in `primeReviewStatuses` → treat as bad request
- **What would make this ≥90%:**
  - Confirm no other callers of `listPrimeReviewThreads` exist (scout above)
  - Confirm `primeReviewStatuses` enum is the authoritative source for valid status values (already confirmed via `prime-messaging-repositories.ts:20`)
- **Rollout / rollback:**
  - Rollout: Prime Functions deploy (independent of Reception)
  - Rollback: revert Prime Functions deploy; Reception is unaffected
- **Documentation impact:** None: internal implementation detail
- **Notes / references:**
  - Terminal statuses to exclude: `resolved`, `sent`, `auto_archived` — matches `isThreadVisibleInInbox` in `api-models.server.ts:274-276`

---

### TASK-02: Prime visibility filter — Reception defense-in-depth

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/lib/inbox/prime-review.server.ts` — add `isPrimeThreadVisibleInInbox()` guard function; update `listPrimeInboxThreadSummaries()` to accept and forward optional `status`
  - `apps/reception/src/app/api/mcp/inbox/route.ts` — apply `isPrimeThreadVisibleInInbox` when `status` is not set; pass `status` to `listPrimeInboxThreadSummaries`
  - `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` — add test: resolved Prime row absent from default list
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact functions and line numbers confirmed; pattern mirrors `isThreadVisibleInInbox`
  - Approach: 90% — independent guard that works regardless of Prime server filter state; defense-in-depth is the correct pattern
  - Impact: 85% — closes the Reception-side gap; independently useful if Prime server ever regresses
- **Acceptance:**
  - `isPrimeThreadVisibleInInbox(row)` returns false for `status` in `['resolved', 'sent', 'auto_archived']`
  - `route.ts` applies this filter to `filteredPrimeRows` when `status` is undefined (same logic as `visibleRows` on line 54)
  - `listPrimeInboxThreadSummaries()` accepts optional `status?: string` and appends `&status=<value>` to Prime API call when provided
  - Test: inbox list with a mocked resolved Prime row → row absent; mocked pending Prime row → row present
- **Validation contract:**
  - TC-01: `isPrimeThreadVisibleInInbox({ status: 'resolved' })` → `false`
  - TC-02: `isPrimeThreadVisibleInInbox({ status: 'pending' })` → `true`
  - TC-03: `GET /api/mcp/inbox` with resolved Prime row mocked → response excludes that row
  - TC-04: `GET /api/mcp/inbox?status=resolved` with resolved Prime row → response includes it (explicit override)
- **Execution plan:**
  - Red: add TC-03 and TC-04 tests
  - Green: add `isPrimeThreadVisibleInInbox` to `prime-review.server.ts`; update `route.ts` filter block (lines 62-64) to apply it when no status param; update `listPrimeInboxThreadSummaries` to forward status
  - Refactor: confirm `route.ts` filter logic reads consistently with email path at line 54
- **Planning validation:**
  - Checks run: Read `route.ts:54-64` (filter gap confirmed); `api-models.server.ts:274-276` (pattern to mirror confirmed)
  - Unexpected findings: None
- **Scouts:** None: all surfaces confirmed in fact-find
- **Edge Cases & Hardening:** `status` param passed as-is to Prime — malformed values are rejected by Prime server (TASK-01 adds 400 response)
- **What would make this ≥90%:** Already at 90% for Implementation and Approach; Impact capped at 85% because this is defense-in-depth; raising to 90% would require evidence that the guard has prevented a real regression.
- **Rollout / rollback:**
  - Rollout: Reception deploy
  - Rollback: revert Reception deploy; Prime unaffected
- **Documentation impact:** None
- **Notes / references:**
  - Expected user-observable behavior: resolved/sent/auto_archived Prime threads no longer appear in the default inbox list. Staff refresh will remove any currently-visible terminal Prime threads.

---

### TASK-03: Prime rich message field serialization

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/prime/functions/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/prime/functions/lib/prime-review-api.ts` — extend `PrimeReviewMessage` type; update `serializeMessage()` to include `links_json`, `attachments_json`, `cards_json`, `campaign_id`, and `audience` (direct enum value, no JSON parse)
  - `apps/prime/functions/__tests__/review-threads.test.ts` — add test asserting rich fields present in detail response when DB has them
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 90% — `PrimeMessageRecordRow` confirmed to have all four columns; `serializeMessage()` at line 160 confirmed to omit them; JSON parse helpers already present in codebase
  - Approach: 90% — additive type extension with optional fields; all new fields are `| null`; existing callers unaffected
  - Impact: 80% — data becomes available in the API response; staff cannot see it in the Review UI until TASK-04 and a future UI task land
- **Acceptance:**
  - `PrimeReviewMessage` has optional fields: `links?: MessageLink[] | null`, `attachments?: MessageAttachment[] | null`, `cards?: MessageCard[] | null`, `audience?: MessageAudience`, `campaignId?: string | null`
  - `serializeMessage()` parses `links_json`, `attachments_json`, `cards_json` as JSON arrays (null/invalid → `null` or `[]`); maps `campaign_id` to `campaignId`; maps `audience` directly (no JSON parse — it is a plain enum string in the row)
  - New test: `serializeMessage(row)` with populated `links_json` → parsed array present in output
  - Existing TC-02 (list route) unaffected — it only checks summary, not message detail
- **Validation contract:**
  - TC-01: `serializeMessage` with `links_json: '[{"url":"https://example.com","label":"Link"}]'` → output has `links` array
  - TC-02: `serializeMessage` with `attachments_json: null` → output has `attachments: null` or `attachments: []`
  - TC-03: `serializeMessage` with `audience: 'thread'` → output has `audience: 'thread'` (direct pass-through, not JSON parsed)
  - TC-04: `GET /api/review-thread?threadId=X` with rich-field DB row → response message includes `links`, `attachments`, `cards`, `audience`, `campaignId`
- **Execution plan:**
  - Red: add TC-01, TC-02, TC-03
  - Green: extend `PrimeReviewMessage` with five optional fields (`links`, `attachments`, `cards`, `audience`, `campaignId`); update `serializeMessage()` to parse `links_json`, `attachments_json`, `cards_json` as JSON arrays using `parseMetadata`-style pattern; pass `audience` directly (no JSON parse); map `campaign_id` to `campaignId`
  - Refactor: confirm no existing callers of `PrimeReviewMessage` use a spread pattern that would silently discard new fields
- **Planning validation:**
  - Checks run: Read `prime-review-api.ts:41-50` (type), `prime-review-api.ts:160-171` (serializer), `prime-messaging-repositories.ts:96-109` (columns confirmed)
  - Validation artifacts: `parseMetadata` helper at line 109 used as pattern for JSON parsing
  - Unexpected findings: `audience` is already a field in `PrimeMessageRecordRow` (not a JSON column); it's a typed enum value and should be included directly, not parsed from JSON
- **Consumer tracing (new outputs):**
  - New fields on `PrimeReviewMessage` are consumed by: (a) `PrimeReviewThreadDetail.messages` in Reception's `prime-review.server.ts` (addressed in TASK-04); (b) `review-threads.test.ts` type assertions (updated in this task)
  - All consumers accounted for
- **Scouts:** Confirm `audience` field on `PrimeMessageRecordRow` is a direct value (not JSON); confirm `MessageLink`, `MessageAttachment`, `MessageCard` types are importable from `../../src/types/messenger/chat`
- **Edge Cases & Hardening:**
  - Malformed JSON in `links_json` → parse error → return `null` (same pattern as `parseMetadata`)
  - Empty array `[]` → return `[]` (valid)
  - `campaign_id` is a plain string or null — no JSON parsing needed
- **What would make this ≥90%:** UI rendering of rich fields added (TASK-04 + future UI task); impact would be fully realised
- **Rollout / rollback:**
  - Rollout: Prime Functions deploy (alongside TASK-01 in same deployment)
  - Rollback: revert Prime Functions deploy
- **Documentation impact:** None
- **Notes / references:**
  - `MessageLink`, `MessageAttachment`, `MessageCard`, `MessageAudience` — import path: `../../src/types/messenger/chat`

---

### TASK-04: Reception rich message mapper update

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/lib/inbox/api-models.server.ts` — extend `InboxMessageApiModel` with five optional Prime-specific rich fields: `links?: unknown[] | null`, `primeAttachments?: unknown[] | null`, `cards?: unknown[] | null`, `audience?: string | null`, `campaignId?: string | null`. Use `primeAttachments` (not `attachments`) because the existing `attachments` field is email-shaped `{filename, mimeType, size}` which is structurally incompatible with Prime's `{kind, url, ...}` shape.
  - `apps/reception/src/services/useInbox.ts` — extend `InboxMessage` client type (lines 63-80) with the same five optional fields to match the server API model
  - `apps/reception/src/lib/inbox/prime-review.server.ts` — update `PrimeReviewThreadDetail.messages` local type (lines 30-39) to include optional rich fields matching `PrimeReviewMessage`; update message mapper (lines 350-364) to set `primeAttachments: message.attachments ?? null` and pass through `links`, `cards`, `audience`, `campaignId`
  - `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` — update Prime detail fixture to include a message with rich fields; assert they appear in response
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — exact mapper lines confirmed; local `PrimeReviewThreadDetail` type in `prime-review.server.ts` mirrors `PrimeReviewMessage` and must be extended in parallel
  - Approach: 90% — straightforward pass-through; no logic required
  - Impact: 80% — same as TASK-03 impact: data available in API response, not yet rendered in UI
- **Acceptance:**
  - `InboxMessageApiModel` gains five optional fields: `links`, `primeAttachments`, `cards`, `audience`, `campaignId` (all `unknown[] | null` or `string | null`); existing `attachments` field unchanged (email-shaped)
  - `InboxMessage` (client type in `useInbox.ts`) gains the same five optional fields
  - `PrimeReviewThreadDetail.messages` type in `prime-review.server.ts` includes optional rich fields matching `PrimeReviewMessage`
  - Message mapper sets `primeAttachments: message.attachments ?? null` and passes through `links`, `cards`, `audience`, `campaignId`; existing `attachments: []` removed (was incorrect anyway)
  - `events: []` hardcode (line 365) is unchanged (events not in Prime API contract)
  - Test: Prime thread detail fixture with a message containing `links: [...]` → response includes `links` in message
- **Validation contract:**
  - TC-01: `GET /api/mcp/inbox/{primeThreadId}` with mocked Prime detail containing rich message fields → response message has `links`, `attachments`, `cards`, `audience`, `campaignId`
  - TC-02: `GET /api/mcp/inbox/{primeThreadId}` with mocked Prime detail containing `links: null` → response message has `links: null` (not empty array override)
- **Execution plan:**
  - Red: update `inbox.route.test.ts` Prime detail fixture with rich fields (including `primeAttachments`); add TC assertions
  - Green: extend `InboxMessageApiModel` in `api-models.server.ts` with five optional fields (`links`, `primeAttachments`, `cards`, `audience`, `campaignId`); extend `InboxMessage` in `useInbox.ts` with the same five fields; extend local `PrimeReviewThreadDetail.messages` type in `prime-review.server.ts`; update message mapper to pass through new fields using `message.X ?? null` pattern; map `message.attachments` → `primeAttachments`; remove hardcoded `attachments: []`
  - Refactor: confirm email `serializeMessage` in `api-models.server.ts` does not set the new fields (they remain `undefined` for email messages — TypeScript accepts this for optional fields)
- **Planning validation:**
  - Checks run: Read `prime-review.server.ts:30-65` (local types), `prime-review.server.ts:350-365` (mapper); confirmed `events: []` is separate from `attachments: []`
  - Unexpected findings: `events` field exists in `InboxMessageApiModel` but not in Prime API contract — leave as hardcoded `[]` (correct)
- **Consumer tracing:** New fields on `PrimeReviewThreadDetail.messages` are consumed by: the `GET /api/mcp/inbox/{threadId}` route which returns the full detail object — no additional consumers identified
- **Scouts:** Confirm email `serializeMessage` in `api-models.server.ts` compiles cleanly after type extension (new optional fields → `undefined` for email messages; TypeScript strict-null check not triggered because fields are `| null` optional)
- **Edge Cases & Hardening:** If `message.links` is `undefined` (Prime hasn't deployed TASK-03 yet), mapper should treat as `null` — use `message.links ?? null`
- **What would make this ≥90%:** UI rendering; same constraint as TASK-03
- **Rollout / rollback:**
  - Rollout: Reception deploy (alongside TASK-02, TASK-05, TASK-06)
  - Rollback: revert Reception deploy; Prime unaffected (fields remain in Prime response but Reception won't forward them)
- **Documentation impact:** None
- **Notes / references:**
  - `events: []` at prime-review.server.ts:365 is intentional — Prime has no `events` concept; leave unchanged

---

### TASK-05: sendDraft post-send server refresh

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/services/useInbox.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/services/useInbox.ts` — `sendDraft()` (line 408): add `refreshThreadDetail(threadId)` after send; add stale-thread guard to `refreshThreadDetail()`
  - `apps/reception/src/services/__tests__/useInbox.test.ts` (new file) — hook-level test using `renderHook` from `@testing-library/react`; confirms `sendDraft()` calls `fetchInboxThread` after send
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact function and call site confirmed; pattern identical to `saveDraft` (line 381) and `regenerateDraft` (line 400)
  - Approach: 95% — `refreshThreadDetail` is the minimal correct refresh; avoids list re-sort disruption
  - Impact: 90% — eliminates post-send stale state for Prime campaign delivery counters and status
- **Acceptance:**
  - `sendDraft()` calls `await refreshThreadDetail(threadId)` after `sendInboxDraft()` completes
  - `refreshThreadDetail()` guards `setSelectedThread` with `if (threadId === selectedThreadIdRef.current)` check before applying state updates (prevents race when user switches thread during refresh)
  - Hook-level test in new `useInbox.test.ts`: send action → a second `fetch` call is made after the send `fetch` call (verified via `global.fetch = jest.fn()` — the correct seam, since `sendInboxDraft`, `fetchInboxThread`, and `inboxRequest` are all defined lexically in the same module and cannot be reliably intercepted via `jest.mock` of module exports)
  - Expected user-observable behavior: after clicking Send, the thread status and draft state immediately reflect the server's post-send values (not a locally-patched copy)
- **Validation contract:**
  - TC-01 (hook test): `global.fetch = jest.fn()` returning mock detail; render `useInbox`; call `sendDraft()` → assert `fetch` called twice (once for send, once for detail refresh)
  - TC-02 (hook test): `sendDraft()` called → if `selectedThreadId` changes before refresh completes, stale-thread guard prevents wrong thread state being set
- **Execution plan:**
  - Red: add TC-01 hook test (new `useInbox.test.ts`; `global.fetch = jest.fn()`; render hook; call `sendDraft()`; assert `fetch` called twice)
  - Green: add `await refreshThreadDetail(threadId)` in `sendDraft` after `sendInboxDraft` succeeds; add `if (threadId === selectedThreadIdRef.current)` guard in `refreshThreadDetail` before each `setSelectedThread` / `setThreads` call
  - Refactor: apply the stale-thread guard consistently across all `refreshThreadDetail` callers (`saveDraft`, `regenerateDraft`, `sendDraft`)
- **Planning validation:**
  - Checks run: Read `useInbox.ts:370-452` (saveDraft, regenerateDraft, sendDraft patterns confirmed)
  - Unexpected findings: The stale-thread guard in `refreshThreadDetail` is an incremental improvement needed regardless of Issue C; adding it here is same-outcome (protects the new `sendDraft` refresh call)
- **Consumer tracing (modified behavior):** `refreshThreadDetail` guard change: callers are `saveDraft`, `regenerateDraft`, and (after this task) `sendDraft`. The guard only suppresses state updates when the thread has changed — this is strictly correct behaviour for all callers.
- **Scouts:** Confirm `selectedThreadIdRef.current` is accessible in `refreshThreadDetail` closure (it is — defined at the same hook scope level, line 281)
- **Edge Cases & Hardening:**
  - Network error in refresh → should not mask the successful send; wrap refresh in try/catch and log only
  - Thread switches rapidly after send → stale-thread guard prevents wrong thread being overwritten
- **What would make this ≥90%:** Already 90%; raising to 95% requires a live integration test
- **Rollout / rollback:**
  - Rollout: Reception deploy
  - Rollback: revert Reception deploy
- **Documentation impact:** None

---

### TASK-06: AbortController signal wiring

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/services/useInbox.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/services/useInbox.ts` — `fetchInboxThread()` (line 203): add optional `signal?: AbortSignal` param; pass it in `inboxRequest` init; `selectThread()` (line 296): pass `controller.signal` to `fetchInboxThread`
  - `apps/reception/src/services/__tests__/useInbox.test.ts` (shared with TASK-05) — hook test asserting `global.fetch` receives `signal` when `selectThread` is called
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — exact call sites confirmed; `InboxRequestInit extends RequestInit` so `signal` is already a valid field; no type change required
  - Approach: 85% — threading signal through one extra function hop (`fetchInboxThread`) is mechanical; risk is minimal
  - Impact: 80% — prevents wasted in-flight requests and stale-error races; operational severity is lower than Issues A-C
- **Acceptance:**
  - `fetchInboxThread(threadId, signal?)` accepts optional signal
  - `selectThread()` passes `controller.signal` to `fetchInboxThread`
  - `fetchInboxThread` passes `signal` as part of `inboxRequest` init
  - Hook test in `useInbox.test.ts`: `global.fetch` mocked; `selectThread('thread-1')` called; mock verifies fetch call includes `signal` in init options
- **Validation contract:**
  - TC-01 (hook test): `global.fetch = jest.fn()`; render `useInbox`; call `selectThread('thread-1')` → `fetch` call receives `signal` in init (not undefined, not null)
  - TC-02 (hook test): call `selectThread('thread-1')` then immediately `selectThread('thread-2')` → first fetch's signal is aborted before second proceeds
- **Execution plan:**
  - Red: add TC-01 in `useInbox.test.ts` (mock `global.fetch`; render hook; call `selectThread`; assert signal in fetch call)
  - Green: add `signal?: AbortSignal` param to `fetchInboxThread`; pass it as `{ signal }` in the `inboxRequest` init spread; pass `controller.signal` from `selectThread` to `fetchInboxThread`
  - Refactor: confirm `fetchInboxThread` called from `refreshThreadDetail` (line 286) continues to work without signal — leave it signalless (intentional)
- **Planning validation:**
  - Checks run: Read `useInbox.ts:178-207` (`inboxRequest` and `fetchInboxThread` signatures confirmed); `InboxRequestInit` at line 152 confirmed as `RequestInit & { errorCode?: string }`
  - Unexpected findings: `refreshThreadDetail` also calls `fetchInboxThread` (line 286) — leave without signal; it is not a navigation-triggered call
- **Consumer tracing (modified behavior):** `fetchInboxThread` signature change: callers are `selectThread` (passes signal after this change) and `refreshThreadDetail` (passes nothing — still valid because `signal` is optional). No breaking change.
- **Scouts:** Confirm Jest environment in reception supports `global.fetch = jest.fn()` pattern (confirmed — existing `inbox-actions.route.test.ts` uses fetch-related patterns)
- **Edge Cases & Hardening:**
  - If `signal` is already aborted when `fetchInboxThread` is called → fetch rejects immediately with `AbortError`; existing `catch` block in `selectThread` at line 320 already handles errors from `fetchInboxThread`
- **What would make this ≥90%:** Live integration test demonstrating network cancellation; or confirm Jest environment supports fetch signal assertions (scout above)
- **Rollout / rollback:**
  - Rollout: Reception deploy
  - Rollback: revert Reception deploy
- **Documentation impact:** None

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Prime visibility filter server-side | Yes | [Scope gap Minor]: TC-02 in `review-threads.test.ts` has SQL query hardcoded as mock key — must be updated when WHERE clause added. Documented in task Acceptance and Execution plan. | No — in task |
| TASK-02: Reception defense-in-depth | Yes | None | No |
| TASK-03: Prime rich fields serialization | Yes | [Type contract Moderate]: `audience` field in `PrimeMessageRecordRow` is a direct enum value, not JSON — plan must not apply JSON parse to it. Documented in task. | No — in task |
| TASK-04: Reception rich mapper | Yes | [Type contract Moderate]: `InboxMessageApiModel` in `api-models.server.ts` must be extended before `prime-review.server.ts` mapper can pass rich fields through — both files now in Affects. Email serializer is not affected (new fields are optional). | No — resolved in task |
| TASK-05: sendDraft post-send refresh | Yes | [Integration boundary Minor]: network error in `refreshThreadDetail` after send must not mask the successful send — wrap in try/catch. Documented in Edge Cases. | No — in task |
| TASK-06: AbortController signal | Yes | [Ordering Minor]: `refreshThreadDetail` calls `fetchInboxThread` without signal — this is correct (it is not a navigation call); plan explicitly documents this non-change. | No — in task |

## Rehearsal-Critical-Waiver

None required. No Critical findings.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TC-02 SQL mock string mismatch after TASK-01 WHERE clause | High (certain) | Low (test failure only, not production) | Update TC-02 mock key in same PR as TASK-01 SQL change |
| Reception deploys before Prime for TASK-03/04 | Low | Low — all new fields optional; Reception falls back to `null` | Prefer Prime-first deployment; fallback is safe |
| stale-thread guard in `refreshThreadDetail` causes missed updates | Low | Low — guard only suppresses when thread has changed; normal path unaffected | Unit test TC-02 in TASK-05 covers this |
| TASK-06 test: Jest doesn't support fetch signal assertions | Low | Minor — test seam limitation; document and accept | Scout confirms `global.fetch = jest.fn()` pattern used in this project |

## Observability

- Logging: None new — existing `console.error` in Prime fetch catch covers failures
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] Prime default list does not include `resolved`, `sent`, or `auto_archived` threads
- [ ] Rich Prime message fields (`links`, `attachments`, `cards`, `audience`, `campaignId`) present in thread detail API response when populated in DB
- [ ] Thread detail reloaded from server after `sendDraft()` completes
- [ ] `fetchInboxThread` called by `selectThread` passes `AbortController.signal` to `fetch`
- [ ] All new tests pass in CI
- [ ] No existing tests broken (TC-02 SQL key updated in TASK-01)

## Decision Log

- 2026-03-08: Issue B scoped to data layer only; UI rendering of rich fields deferred. Risk: staff cannot inspect attachment/card content in review UI until follow-on task.
- 2026-03-08: `refreshThreadDetail` stale-thread guard added to TASK-05 scope (same-outcome — protects the new sendDraft refresh path and improves general hook correctness).
- 2026-03-08: `audience` field in TASK-03 — direct enum value, not JSON — passed through directly without JSON parse.
- 2026-03-08: Prime attachments use separate `primeAttachments` field on `InboxMessageApiModel` because email-shaped `attachments: {filename,mimeType,size}` is structurally incompatible with Prime-shaped `{kind,url,...}` — keeping both avoids a breaking change to email consumers.
- 2026-03-08: [Adjacent: delivery-rehearsal] UI rendering of `primeAttachments`, `links`, `cards` in `ThreadDetailPane` deferred — out of scope for this plan; route to post-build fact-find when operator is ready.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Contribution |
|---|---|---|---|---|
| TASK-01 | 85% | M | 2 | 170 |
| TASK-02 | 85% | S | 1 | 85 |
| TASK-03 | 80% | M | 2 | 160 |
| TASK-04 | 80% | S | 1 | 80 |
| TASK-05 | 90% | S | 1 | 90 |
| TASK-06 | 80% | S | 1 | 80 |
| **Total** | | | **8** | **665** |

Overall-confidence = 665 / 8 = **83.1% → 80%** (downward bias rule: uncertain between 80% and 85%, assign lower)
