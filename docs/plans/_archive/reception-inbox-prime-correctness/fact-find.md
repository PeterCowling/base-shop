---
Type: Fact-Find
Outcome: planning
Status: Archived
Domain: Product-Engineering
Workstream: Product-Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Last-reviewed: 2026-03-08
Feature-Slug: reception-inbox-prime-correctness
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-prime-correctness/plan.md
Trigger-Source: direct-operator-decision: reception-inbox-prime-correctness-audit
Trigger-Why: code audit identified four concrete correctness gaps in the unified Reception inbox where the Prime integration behaves differently from the email path or produces incorrect local state
Trigger-Intended-Outcome: "type: operational | statement: fix all four confirmed inbox correctness gaps so that Prime thread visibility, message inspection, post-send state, and request cancellation all behave correctly | source: operator"
---

# Reception Inbox Prime Correctness — Fact-Find Brief

## Scope

### Summary

A code audit of the Reception unified inbox surfaced four distinct correctness gaps, all introduced or left unaddressed during the Prime integration build (`feat(prime): complete unified messaging review flow`, commit `f146ea5dc1`). Each gap is independently fixable with a targeted change. None requires architectural redesign.

1. **Visibility filter gap** — Prime terminal threads (`resolved`, `sent`, `auto_archived`) appear in the default inbox list; email threads with those statuses are hidden. The asymmetry is accidental.
2. **Rich message field drop** — Prime message content reaching the Reception review UI is stripped to `content` and `kind` only. Attachments, links, cards, audience, and `campaignId` are in the DB but are silently dropped by `serializeMessage()` in Prime's review API layer before Reception ever sees them.
3. **No post-send server refresh** — `sendDraft()` in `useInbox.ts` patches local state optimistically after send but never re-fetches canonical server state. For Prime campaigns (which change delivery counters and campaign status on send), this leaves the UI stale.
4. **AbortController signal not wired** — `selectThread()` creates an `AbortController` and checks `signal.aborted` after fetch, but never passes `signal` into `fetchInboxThread` → `inboxRequest` → `fetch`. The network request is never cancelled on thread switch.

### Goals

- Align Prime thread visibility with the email rule: default list hides `resolved`, `sent`, `auto_archived`.
- Propagate rich Prime message fields (attachments, links, cards, `campaignId`) through the data layer to Reception thread detail (UI rendering of these fields is a separate product decision — see open question).
- Reload canonical server state after `sendDraft()` so local UI matches server truth.
- Wire `AbortController.signal` through `inboxRequest` → `fetch` to actually cancel in-flight requests on thread switch.

### Non-goals

- No change to Prime's messaging model or Firebase storage.
- No changes to email thread behaviour.
- No new UI components (rich fields surfaced as data; rendering is in scope for a future pass if needed).
- No changes to the Prime side of resolve/dismiss actions (those already reload via `resolveThread` / `dismissThread`).

### Constraints & Assumptions

- Constraints:
  - Issue B requires a change in `apps/prime` (the `serializeMessage` function) **and** the Reception side adapter (`prime-review.server.ts`) — it crosses two apps. The Prime functions project builds and deploys independently (Cloudflare Pages Functions).
  - Tests run in CI only (repo policy). All new tests must pass in CI.
  - Writer lock must be acquired before committing.
- Assumptions:
  - The Prime `/api/review-threads` endpoint not filtering by status at the DB level is the correct fix location for Issue A (rather than Reception filtering clientside), because the server is authoritative for status.
  - For Issue B, the DB columns `links_json`, `attachments_json`, `cards_json` are populated at write time; no migration is needed to expose them.
  - Issue C: `sendDraft()` should call `refreshThreadDetail()` (the same pattern as `saveDraft` and `regenerateDraft`) — not a full `loadThreads()` reload, to avoid disrupting list position.

## Outcome Contract

- **Why:** Code audit confirmed four correctness gaps in the unified inbox. Staff can see resolved Prime threads that should be hidden, cannot inspect full message content before approving, see stale state after sending, and waste network resource on thread switches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four inbox correctness gaps are fixed, verified by targeted unit tests, and the inbox behaves consistently between email and Prime paths.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/api/mcp/inbox/route.ts:36` — `GET /api/mcp/inbox` — unified list endpoint; merges email rows + Prime rows
- `apps/reception/src/services/useInbox.ts:408` — `sendDraft()` — client hook that sends a draft and mutates local state
- `apps/reception/src/services/useInbox.ts:296` — `selectThread()` — thread navigation; creates AbortController
- `apps/reception/src/services/useInbox.ts:296` — `selectThread()` — has `controller.signal` but does not pass it to `fetchInboxThread`; this is the actual Issue D bug site
- `apps/reception/src/services/useInbox.ts:178` — `inboxRequest()` — already accepts `signal` (via `InboxRequestInit extends RequestInit`) and spreads `init` into `fetch`; requires no type change for Issue D
- `apps/prime/functions/api/review-threads.ts:28` — `GET /api/review-threads` — Prime-side list endpoint; no status filter
- `apps/prime/functions/api/review-thread.ts:15` — `GET /api/review-thread` — Prime-side detail endpoint

### Key Modules / Files

- `apps/reception/src/app/api/mcp/inbox/route.ts` — list route; Issue A fix goes here (add `isThreadVisibleInInbox` equivalent for Prime rows, or pass status filter to Prime server)
- `apps/reception/src/lib/inbox/api-models.server.ts:274` — `isThreadVisibleInInbox()` — email visibility rule; model for Issue A fix
- `apps/reception/src/lib/inbox/prime-review.server.ts:316` — `listPrimeInboxThreadSummaries()` — calls Prime `/api/review-threads?limit=50` with no status param
- `apps/reception/src/lib/inbox/prime-review.server.ts:350` — message mapper in `getPrimeInboxThreadDetail()`; hardcodes `attachments: []`, `events: []` — one side of Issue B
- `apps/prime/functions/lib/prime-review-api.ts:41` — `PrimeReviewMessage` type — omits `links`, `attachments`, `cards`, `audience`, `campaignId` — root of Issue B
- `apps/prime/functions/lib/prime-review-api.ts:160` — `serializeMessage()` — drops `links_json`, `attachments_json`, `cards_json`, `campaign_id` from `PrimeMessageRecordRow`
- `apps/prime/functions/lib/prime-messaging-repositories.ts:1440` — `listPrimeReviewThreads()` — SQL query with no `WHERE review_status` filter; returns all statuses
- `apps/reception/src/services/useInbox.ts` — `saveDraft` (L379), `regenerateDraft` (L398), `sendDraft` (L408) — Issue C: only send lacks refresh
- `apps/prime/functions/lib/prime-messaging-repositories.ts:96` — `PrimeMessageRecordRow` type — has `links_json`, `attachments_json`, `cards_json`, `campaign_id` in DB schema

### Data & Contracts

- Types/schemas/events:
  - `PrimeReviewMessage` (`apps/prime/functions/lib/prime-review-api.ts:41`) — exported type crossing Prime → Reception boundary; must be extended for Issue B
  - `PrimeReviewThreadDetail.messages` (`apps/reception/src/lib/inbox/prime-review.server.ts:30`) — Reception-side mirror type; must be extended to match
  - `InboxMessageApiModel` (`apps/reception/src/lib/inbox/api-models.server.ts`) — target type for message serialization in Reception; has `attachments: []` currently set to empty array
  - `InboxThreadSummaryApiModel.status` — `mapPrimeStatus()` passes `reviewStatus` through directly; `resolved`, `sent`, `auto_archived` are valid values

- Persistence:
  - Prime D1 DB: `message_records` table has `links_json`, `attachments_json`, `cards_json`, `campaign_id` columns — confirmed via `PrimeMessageRecordRow` type
  - No new migrations required for Issue B

- API/contracts:
  - `GET /api/review-threads` (Prime Functions) — accepts `limit`; no `status` param today. Fix: (a) default query excludes terminal statuses; (b) add optional `status` param for explicit filtering.
  - `GET /api/mcp/inbox` (Reception) — forwards `status` to email path but not to Prime. Fix: (a) pass `status` param through to Prime when provided; (b) apply a Reception-side default visibility filter to Prime rows (mirror of `isThreadVisibleInInbox`) as defense-in-depth. Both layers need a change to fully close Issue A.

### Dependency & Impact Map

- Upstream dependencies:
  - Issue A, B: Prime Cloudflare Pages Functions (`apps/prime/functions/`) — deployed independently; changes require a Prime deployment before Reception picks them up
  - Issue C, D: Reception client hook only (`apps/reception/src/services/useInbox.ts`) — same-app change

- Downstream dependents:
  - Reception inbox UI — all four issues affect staff-facing behaviour
  - `inbox.route.test.ts` — tests `listPrimeInboxThreadSummaries` mock; Issue A test must be added here
  - `inbox-actions.route.test.ts` — send action test; Issue C test may fit here or in a useInbox unit test

- Likely blast radius:
  - Issue A: `route.ts` (1 function) + `listPrimeInboxThreadSummaries` or Prime API (1 function or 1 query change). Low blast radius.
  - Issue B: `prime-review-api.ts` type + `serializeMessage()` in Prime Functions + `prime-review.server.ts` message mapper in Reception. Medium — touches two deployed apps, but all changes are purely additive (adding fields, no deletions).
  - Issue C: `useInbox.ts:sendDraft` only. Trivial blast radius.
  - Issue D: `useInbox.ts:inboxRequest` signature + one call site. Trivial blast radius.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration for reception and prime functions)
- Commands: `pnpm --filter reception test` / `pnpm --filter prime test` (CI only per policy)
- CI integration: `reusable-app.yml`; tests run on push to dev/main

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox list route | Unit (jest) | `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` | Tests email filter, Prime merge, auth — no test for Prime terminal status filtering |
| Inbox actions | Unit (jest) | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Tests send, resolve, dismiss for both email and Prime paths |
| Prime review API | Partial | `apps/prime/functions/__tests__/review-threads.test.ts` | Tests exist for `/api/review-threads` and `/api/review-thread`; no assertions for status filtering or rich-field serialization |
| Prime list | Unit (jest) | `apps/prime/functions/__tests__/review-threads.test.ts` | Exists — must check whether it covers status filtering |
| useInbox hook | None found | `apps/reception/src/services/` | No unit tests for client hook; actions tested via route layer |

#### Coverage Gaps

- Untested paths:
  - Prime terminal threads appearing in default list (Issue A) — no test asserts they are hidden
  - Rich fields in `PrimeReviewMessage` (Issue B) — no test checks for `attachments`, `links`, `cards`
  - `sendDraft` post-send state refresh (Issue C) — untested
  - `inboxRequest` signal passing (Issue D) — untested; difficult to unit-test fetch signal cancellation

#### Testability Assessment

- Easy to test:
  - Issue A: add a test to `inbox.route.test.ts` that includes a resolved Prime row in the mock and asserts it is absent from the unfiltered list
  - Issue B: add a `serializeMessage` unit test; update `inbox.route.test.ts` Prime detail fixture to include rich fields
  - Issue C: mock `refreshThreadDetail` in a `sendDraft` test and assert it is called after send
- Hard to test:
  - Issue D: `AbortController.signal` cancellation requires intercepting fetch; can be tested with `jest.fn()` replacing `global.fetch` and checking `signal` is passed, but the actual network cancellation is integration-only

### Recent Git History (Targeted)

- `apps/reception/src/lib/inbox/`, `apps/reception/src/services/useInbox.ts`, `apps/reception/src/app/api/mcp/inbox/`:
  - `f146ea5dc1` `feat(prime): complete unified messaging review flow` — introduced all four gaps in scope
  - `81aed9caf3` `fix(reception): make getInboxDb async to fix 502 on /api/mcp/inbox` — nearby hotfix
  - `7b0414ddf6` `feat(reception-inbox-draft-failure-reasons): store and surface draft failure reasons` — pattern reference for adding fields through the serialization chain

## Questions

### Resolved

- Q: Is the Prime terminal status visibility gap intentional?
  - A: No. No comment, config flag, or product note in the codebase indicates the divergence was deliberate. The `isThreadVisibleInInbox` guard was added for email and not extended to Prime. Treat as implementation gap.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/route.ts:54-64` — email path applies `isThreadVisibleInInbox`; Prime path applies no equivalent guard.

- Q: Are rich message fields (links, attachments, cards) actually stored in the DB?
  - A: Yes. `PrimeMessageRecordRow` has `links_json`, `attachments_json`, `cards_json`, `campaign_id` columns. The data is in D1; only the serialization layer omits it.
  - Evidence: `apps/prime/functions/lib/prime-messaging-repositories.ts:96-109`

- Q: Where is the best fix location for Issue A — Reception route filter or Prime API server filter?
  - A: Both layers need a change to fully close the gap. (1) The Prime server's `listPrimeReviewThreads` DB query has no `WHERE review_status` clause and returns all statuses. Adding a default exclusion of terminal statuses (`resolved`, `sent`, `auto_archived`) when no explicit status is requested makes the Prime API authoritative and independently correct. (2) Reception's `route.ts` must also apply a default visibility filter to Prime rows when no `status` param is provided — mirroring the existing `isThreadVisibleInInbox` email path — as a defense-in-depth guard. Both are needed: the Prime API fix is the authoritative correction; the Reception filter is the safety net that prevents accidental regressions if the Prime server ever changes.
  - Evidence: `apps/prime/functions/lib/prime-messaging-repositories.ts:1440-1479` (no WHERE clause in SQL); `apps/reception/src/app/api/mcp/inbox/route.ts:54-64` (email filtered, Prime not); `apps/reception/src/lib/inbox/prime-review.server.ts:321` (hardcoded `?limit=50`, no status param passed)

- Q: Does `sendDraft` actually need a full list reload or just thread detail refresh?
  - A: Thread detail refresh only (`refreshThreadDetail`), matching the pattern of `saveDraft` and `regenerateDraft`. Full list reload would re-sort and potentially jump the user away from the current thread, which is disruptive. For Prime campaigns, detail refresh re-fetches campaign state.
  - Evidence: `apps/reception/src/services/useInbox.ts:379-406` (saveDraft and regenerateDraft both call `refreshThreadDetail` after their action)

- Q: Does fixing Issue D require a type change to `InboxRequestInit`?
  - A: No. `InboxRequestInit` extends `RequestInit` (which already includes `signal?: AbortSignal`). `inboxRequest` already spreads `init` directly into `fetch`. The only missing step is `selectThread` passing its `controller.signal` into `fetchInboxThread`, which must then forward it as part of `init` to `inboxRequest`. No wrapper type change is needed; only the call site needs the signal threaded through.
  - Evidence: `apps/reception/src/services/useInbox.ts:178-186` — `fetch(path, { ...init, headers: {...} })` spreads all of `init`; `apps/reception/src/services/useInbox.ts:296-314` — `selectThread` has `controller.signal` but passes only `threadId` to `fetchInboxThread`

### Open (Operator Input Required)

- Q: Should this plan also add UI rendering of rich Prime message fields (`attachments`, `links`, `cards`), or fix the data layer only?
  - Why operator input is required: The current `ThreadDetailPane` renders only `bodyPlain` / `snippet` — it does not display attachments, links, or cards. Fixing the data layer alone makes fields available in the API response but staff cannot see their content in the review UI. Whether the review UI should be updated to surface these fields is a design choice.
  - Decision impacted: Scope of Issue B — data layer only (plan tasks 3-4) vs. data layer + UI rendering (adds further task).
  - Decision owner: Operator
  - Default assumption: Fix data layer only in this plan; add a note that staff cannot inspect rich field content until a follow-on UI task. This narrows the blast radius and unblocks future work. Risk: the stated "staff can review content before approving" outcome is only partially met until the UI follow-on lands.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Issue A — Prime visibility filter (route.ts + prime-review.server.ts + Prime DB query) | Yes | None | No |
| Issue B — Rich field serialization (prime-review-api.ts serializeMessage + prime-review.server.ts mapper) | Yes | [Ordering Minor]: Prime Functions deployment first is preferable for Issue B, but not a hard safety requirement since all new fields are optional and Reception's existing fallbacks remain valid if Prime hasn't deployed yet. Plan should note preferred deployment order. | No |
| Issue C — sendDraft post-send refresh (useInbox.ts) | Yes | None | No |
| Issue D — AbortController signal wiring (inboxRequest) | Yes | None | No |
| Test landscape for all four issues | Partial | [Scope gap Minor]: review-threads.test.ts exists but was not read; may already test status filtering. Plan should verify before adding duplicate test. | No — advisory |
| Prime Functions deployment boundary | Yes | [Integration boundary Moderate]: Issue A + B changes require a Prime Functions deployment that is separate from the Reception app deployment. The plan must include deployment instructions for both apps. | Yes — include in plan |

## Rehearsal-Critical-Waiver

None required. No Critical findings.

## Scope Signal

Signal: `right-sized`

Rationale: Four isolated fixes across two apps (Prime Functions + Reception). The largest fix (Issue B) is additive-only across a known type boundary with no schema migration needed. Issues C and D are single-function changes. Blast radius is low. Deployment sequencing (Issue B) is the only non-trivial coordination step, and it is well-understood.

## Confidence Inputs

- Implementation: 92%
  - Evidence: All four fixes have been traced to exact file, function, and line. The code paths are clear. Only Issue B requires a cross-app type extension, which is straightforward.
  - To raise to ≥80: already above threshold.
  - To raise to ≥90: confirmed above 90 given direct source tracing.

- Approach: 88%
  - Evidence: Fix approaches are consistent with existing patterns (Issue A mirrors email filter; Issue C mirrors saveDraft/regenerateDraft; Issue D is a mechanical signal threading).
  - To raise to ≥90: verify `review-threads.test.ts` doesn't already filter status to avoid test duplication.

- Impact: 85%
  - Evidence: Issue A is the highest operational risk (staff may act on resolved threads by mistake). Issue B closes a real content inspection gap. Issues C and D are lower severity but remove known race conditions.
  - To raise to ≥90: confirm in production that `review_status` != 'pending' rows are actually appearing in the list (would require a live inbox check).

- Delivery-Readiness: 90%
  - Evidence: All changes are in existing files, no new infra, no migrations. The deployment sequencing for Issue B is the only planning consideration.
  - To raise to ≥90: already there; confirmed by full code tracing.

- Testability: 80%
  - Evidence: Issues A, B, C have clear unit test paths. Issue D (signal cancellation) requires mocking `global.fetch` which is non-trivial but standard in Jest environments.
  - To raise to ≥90: confirm Jest setup in reception supports `global.fetch` mock (likely yes given existing route tests use `fetch` under the hood).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Issue B: Reception deployed before Prime Functions — rich fields absent temporarily | Low | Low — since all new `PrimeReviewMessage` fields are optional, Reception's existing `[]` fallbacks remain valid. Prime-first is preferable but not a hard safety requirement. | Prefer Prime Functions first for Issue B; document as advisory sequencing in plan. |
| Prime status filter added to DB query returns fewer threads than expected (e.g. "pending" only) | Low | Medium | Define the allowed status set explicitly in the DB query — match the email rule exactly (`NOT IN ('auto_archived', 'resolved', 'sent')`) |
| `inboxRequest` signal change breaks existing callers that don't pass signal | Low | Low | Signal is optional in `RequestInit`; existing callers pass no signal and retain current behaviour |
| `sendDraft` refresh race: `refreshThreadDetail` completes after user has navigated to a different thread | Low | Low | `refreshThreadDetail` uses `setSelectedThread` directly; it does not check signal and will update whichever thread is in scope. Issue D scoping only fixes `selectThread`; `refreshThreadDetail` is a separate unsignalled path. Mitigation: guard the `setSelectedThread` call in `refreshThreadDetail` with a check that `threadId === selectedThreadIdRef.current` before applying state updates. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Issue A: apply `isThreadVisibleInInbox` rule consistently or add a parallel `isPrimeThreadVisibleInInbox` to keep the logic independent and testable.
  - Issue B: `PrimeReviewMessage` type extension must remain backward-compatible (all new fields optional) to avoid breaking existing callers if the Prime deployment lags.
  - Issue C: use `refreshThreadDetail()` not `loadThreads()` to avoid list re-sort disruption.
  - Issue D: `signal` should be optional in `InboxRequestInit` — existing callers must not be forced to provide it.
- Rollout/rollback expectations:
  - Issues C and D: single Reception deployment, instant rollback via revert.
  - Issues A and B: Prime Functions deployment first is preferred. Reception changes for A and B are safe to deploy independently (all Issue B fields are optional; Issue A Reception-side filter works regardless of Prime server state), but ordering Prime first avoids any transient mismatch window.
- Observability expectations:
  - No new logging required. The existing `console.error` in the Prime fetch catch covers failure.

## Suggested Task Seeds (Non-binding)

1. Change Prime `listPrimeReviewThreads` DB query to exclude terminal statuses (`resolved`, `sent`, `auto_archived`) by default when no explicit status filter is provided, and add an optional `status` param to the `/api/review-threads` endpoint — fixes Issue A server-side
2. Add a `status` param to `listPrimeInboxThreadSummaries()` and pass it through to the Prime API call; AND add a Reception-side default visibility filter for Prime rows in `route.ts` (mirror of `isThreadVisibleInInbox`) as defense-in-depth — fully closes Issue A
3. Extend `PrimeReviewMessage` + `serializeMessage()` to include `links`, `attachments`, `cards`, `campaignId` — fixes Issue B in Prime
4. Update Reception's `prime-review.server.ts` message mapper to pass through rich fields — fixes Issue B in Reception
5. Add `refreshThreadDetail()` call at end of `sendDraft()` — fixes Issue C
6. Thread `signal` through `inboxRequest` and `fetchInboxThread` — fixes Issue D
7. Add/update unit tests for all four issues

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All four correctness gaps confirmed fixed by code inspection
  - Unit tests pass in CI for Issues A, B, C
  - Issue D has a fetch-signal test or a documented test-seam limitation
  - Prime Functions deployed first (preferred) then Reception; or Reception deployed independently with all Issue B fields optional and Issue A Reception-side filter active

## Evidence Gap Review

### Gaps Addressed

- `review-threads.test.ts` confirmed to exist at `apps/prime/functions/__tests__/review-threads.test.ts`; content not read — plan should check for status filter test before adding duplicate
- Prime DB schema for rich message fields confirmed via `PrimeMessageRecordRow` type — no gap
- Cross-app deployment sequence identified and documented in constraints

### Confidence Adjustments

- Implementation raised to 92% (from initial 85%) after confirming DB columns exist for Issue B and no migration is needed
- Delivery-Readiness: 90% — deployment sequencing is the only non-trivial step and is well-understood

### Remaining Assumptions

- `review-threads.test.ts` does not already cover status filtering (unread; plan should verify before writing a duplicate test)
- The reception Jest environment supports `global.fetch` mocking for Issue D signal test
