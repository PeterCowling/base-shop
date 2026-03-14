---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-projection-job-status
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-prime-projection-job-status/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314200000-0004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Projection Job Status Mismatch — Fact-Find Brief

## Scope

### Summary

When a message is sent through the Prime review flow, a `message_projection_jobs` row is written to D1. This row is supposed to coordinate background sync of that message to Firebase (the real-time database powering the reception inbox). The bug hypothesis was that the job might be written with status `'projected'` — which is the terminal/complete state — rather than `'pending'` — which is the work-queue state the only batch consumer (`listPrimePendingProjectionJobs`) queries for.

Investigation reveals the hypothesis is **substantially revised by deeper code inspection**: Firebase writes happen server-side inline in the API handlers (`direct-message.ts`, `activity-message.ts`) **before** the shadow-write functions are called. This means real-time Firebase sync is not broken for inbound guest messages.

The actual finding is a **status inconsistency** in projection job records across paths:
- `sendPrimeReviewThread` (Path A): writes `status: 'projected'` at INSERT — correct audit record (inline Firebase write happened synchronously before INSERT).
- `direct-message.ts` / `activity-message.ts` (Path B): Firebase write happens inline in the API handler, then `shadowWritePrimeInbound*` writes projection job with `status: 'pending'` (default). The job is an audit record, but is written as a work item — `'pending'` when projection already completed.
- Campaign runtime (Path C): inserts `'pending'`, then immediately `updatePrimeProjectionJob` to `'projected'` — functionally correct but verbose.

**Bottom line**: The queue infrastructure exists (`listPrimePendingProjectionJobs`), it is only called in tests, and no production batch consumer exists. Inbound message jobs written by `shadowWrite*` functions accumulate as `'pending'` but Firebase is not broken because the sync already happened. The fix is to align the status semantics: shadow-write paths should write `'projected'` (or skip the job entirely since projection already completed), and a test should guard the status value at each call site. The inline-vs-batch architectural question is moot for inbound messages — inline is already the design.

### Goals

1. Confirm precisely which callers write `'pending'` vs `'projected'` at INSERT time.
2. Confirm whether any production processor consumes `'pending'` jobs.
3. Document the intended processing model for planning.
4. Identify test gaps in the enqueue → process → complete cycle.

### Non-goals

- Fixing Firebase RTDB schema or the content of projected messages.
- Re-architecting the messaging stack beyond the projection job lifecycle.

### Constraints & Assumptions

- Constraints:
  - Cloudflare Pages does not support `scheduled` cron handlers in the same way as Workers — the `wrangler.toml` for prime uses `pages_build_output_dir`, which is a Pages deployment. Cron triggers require a Worker binding.
  - D1 is the persistence layer; the schema cannot be migrated in an incompatible way during a live session.
- Assumptions:
  - The inline Firebase projection in `sendPrimeReviewThread` is intentional (not a bug) — the job is written post-projection for audit/replay purposes with attempt_count=1.
  - Shadow-write paths (inbound guest messages) are expected to be batched and replayed later — but no such processor exists.

## Outcome Contract

- **Why:** Every time a message is sent through the reception inbox, a background job is created to keep related data up to date. If the status code on that job does not match what the background processor looks for, the jobs quietly pile up and the downstream data is never refreshed — with no error visible to staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Projection job records written by inbound message shadow-write paths carry `status: 'projected'` (not `'pending'`), consistent with the fact that Firebase is already written inline before the shadow-write is called. The shadow-write call sites are guarded by tests that assert the correct status value. There is no silent accumulation of semantically-incorrect `'pending'` records.
- **Source:** operator

## Current Process Map

- Trigger: A message event is written in Prime — either (A) staff sending a review thread reply via `sendPrimeReviewThread`, or (B) inbound guest message arriving via `shadowWritePrimeInbound*`.
- End condition: Firebase RTDB is updated with the message content so the reception inbox displays it in real time.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Path A — staff outbound (review send) | `sendPrimeReviewThread` (1) calls `projectPrimeThreadMessageToFirebase` inline, (2) writes D1 records (message, draft, thread, admission), (3) calls `enqueuePrimeProjectionJob` with `status: 'projected'`, `attemptCount: 1`, `lastAttemptAt: <now>` | Prime functions / D1 + Firebase | `prime-review-send.ts:207-222` | No bug — Firebase already written. Job is audit record. But intent is invisible from schema. |
| Path B — inbound shadow-write (guest messages) | The **API handler** (`direct-message.ts:168-217` / `activity-message.ts:116-153`) (1) writes the message to Firebase RTDB server-side **before** calling `shadowWritePrimeInbound*`. The shadow-write then (2) writes D1 records (thread, message, admission) and (3) calls `enqueuePrimeProjectionJob` with no status override (defaults to `'pending'`), `attemptCount: 0`. | Prime functions API / D1 + Firebase | `direct-message.ts:200-207` (Firebase write then shadow-write), `activity-message.ts:139-153`, `prime-messaging-shadow-write.ts:175,253` | **Revised diagnosis**: Firebase is already written inline in the API handler, before shadow-write is called. The `'pending'` projection job written by `shadowWritePrimeInbound*` is therefore a dead/audit record similar to Path A — but written as `'pending'` instead of `'projected'`, making it appear as a work item. The shadow-write wraps its call in a `try/catch` — if the shadow-write fails, the Firebase write has already succeeded. The projection job being `'pending'` is arguably incorrect (should be `'projected'` since projection already happened) but the real-time Firebase sync is not broken. |
| Path C — campaign runtime | `prime-review-campaign-runtime.ts` (1) calls Firebase projection inline, (2) calls `updatePrimeProjectionJob` to `'projected'` | Campaign runtime / D1 + Firebase | `prime-review-campaign-runtime.ts:428-431` | Correct pattern — update, not insert. No bug. |
| Path D — campaign actions replay | `prime-review-campaign-actions.ts` — replay manually triggered via API; calls Firebase inline then updates job status to `'projected'` | Replay API / D1 + Firebase | `prime-review-campaign-actions.ts:213` | Correct — manual replay path only. |
| Batch consumer | `listPrimePendingProjectionJobs` queries `WHERE status = 'pending'`. Called only in tests. No production caller exists. | No owner / no system | `prime-messaging-repositories.ts:1423–1440` | Dead infrastructure — function exists, no production invocation path. |
| Replay API | `review-projection-replay.ts` / `review-campaign-replay.ts` — staff-triggered manual replay per job or delivery ID | Staff owner API / D1 + Firebase | `functions/api/review-projection-replay.ts` | Only handles `status != 'projected'` — rejects already-projected jobs (conflict). No batch replay. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — direct-inject path, no discovery contract.

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/functions/api/direct-message.ts` — inbound guest direct message handler; writes Firebase inline (lines 168-207) then calls `shadowWritePrimeInboundDirectMessage`
- `apps/prime/functions/api/activity-message.ts` — inbound guest activity message handler; writes Firebase inline (lines 116-153) then calls `shadowWritePrimeInboundActivityMessage`
- `apps/prime/functions/lib/prime-review-send.ts` — staff outbound send; writes Firebase inline then writes projection job with `status: 'projected'`
- `apps/prime/functions/lib/prime-messaging-shadow-write.ts` — inbound guest message shadow-write; writes D1 records and projection job with `status: 'pending'` (default) AFTER Firebase is already written by caller
- `apps/prime/functions/lib/prime-review-campaign-runtime.ts` — broadcast campaign; INSERT `'pending'`, immediately UPDATE to `'projected'`
- `apps/prime/functions/api/review-projection-replay.ts` — manual per-job replay API endpoint

### Key Modules / Files

- `apps/prime/functions/lib/prime-messaging-repositories.ts` — `enqueuePrimeProjectionJob` (line 980), `listPrimePendingProjectionJobs` (line 1423), `updatePrimeProjectionJob` (line 1039), type definitions (line 38: `primeProjectionJobStatuses = ['pending', 'projected', 'failed']`)
- `apps/prime/functions/lib/prime-projection-replay.ts` — `replayPrimeProjectionJob` — fetches job by ID, validates it is not already `'projected'`, projects to Firebase, updates to `'projected'`
- `apps/prime/functions/lib/prime-thread-projection.ts` — `projectPrimeThreadMessageToFirebase` — the actual Firebase write
- `apps/prime/functions/__tests__/prime-messaging-repositories.test.ts` — unit test verifying `listPrimePendingProjectionJobs` queries for `status = 'pending'`; does not test a live end-to-end cycle
- `apps/prime/functions/__tests__/direct-message.test.ts` — TC-08 verifies projection INSERT is called for inbound messages; does NOT assert the status bind value (bind index 5 is unchecked)
- `apps/prime/wrangler.toml` — no `[triggers] crons` block; Pages deployment with D1 binding

### Patterns & Conventions Observed

- **Inline-then-record pattern** (Path A and C): Firebase write happens synchronously; job is inserted/updated to `'projected'` immediately as a completion receipt, never as a work item.
- **Enqueue-and-forget pattern** (Path B): Job inserted with `'pending'`; no processor picks it up. This diverges silently from the inline pattern.
- **`status?` is optional** in `EnqueuePrimeProjectionJobInput` — callers that omit it get `'pending'` (the queue default). Callers that pass `status: 'projected'` explicitly signal they have already done the work. This dual use is unguarded.

### Data & Contracts

- Types/schemas/events:
  - `PrimeProjectionJobStatus = 'pending' | 'projected' | 'failed'` — `prime-messaging-repositories.ts:38`
  - `EnqueuePrimeProjectionJobInput.status?: PrimeProjectionJobStatus` — optional, defaults to `'pending'` — `prime-messaging-repositories.ts:336`
  - `PrimeMessageProjectionJobRow` — D1 row shape — `prime-messaging-repositories.ts:148`
- Persistence:
  - D1 table: `message_projection_jobs` with columns: `id, thread_id, entity_type, entity_id, projection_target, status, attempt_count, last_attempt_at, last_error, created_at, updated_at`
  - Index `idx_message_projection_jobs_status_updated` on `(status, updated_at)` exists — `apps/prime/migrations/0001_prime_messaging_init.sql:113`. Query is indexed.
- API/contracts:
  - `POST /api/review-projection-replay?jobId=<id>` — staff-owner-gated manual replay
  - `POST /api/review-campaign-replay?campaignId=<id>&deliveryId=<id>` — campaign-delivery replay

### Dependency & Impact Map

- Upstream dependencies:
  - D1 database binding `PRIME_MESSAGING_DB` — required at runtime
  - Firebase RTDB (`CF_FIREBASE_DATABASE_URL`, `CF_FIREBASE_API_KEY`) — required for projection
- Downstream dependents:
  - Reception inbox (`apps/reception`) reads from Firebase RTDB for real-time message display
  - `projection_job_id` is stored in `message_campaign_deliveries` and `message_records`; referenced in tests and reception's `prime-review.server.ts`
- Likely blast radius:
  - Bug fix: low blast radius — changing the enqueue status for Path B shadow-write, or adding a processor. No schema change needed.
  - Adding a batch processor: medium blast radius — new Cloudflare Worker or DO, new wrangler config, new auth surface.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (Cloudflare Workers environment via `@cloudflare/vitest-pool-workers` or custom mock)
- Commands: Tests run in CI only per testing policy; governed runner: `pnpm -w run test:governed`
- CI integration: GitHub Actions

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `listPrimePendingProjectionJobs` query | Unit (mock D1) | `prime-messaging-repositories.test.ts:748` | Verifies SQL query and bind values — no integration with a real processor |
| `updatePrimeProjectionJob` | Unit (mock D1) | `prime-messaging-repositories.test.ts:783` | Updates to `'failed'` — correct |
| `enqueuePrimeProjectionJob` default status | Unit (mock D1) | `prime-messaging-repositories.test.ts:107` — asserts `binds[5] === 'pending'` | Correct: default path inserts `'pending'` |
| `sendPrimeReviewThread` projection job INSERT | Integration-style (mock D1 + Firebase) | `review-threads.test.ts:2848,3195` — TC-06A and TC-06B explicitly assert `binds[5] === 'projected'` for direct and broadcast sends respectively | Covered — `sendPrimeReviewThread` INSERT status is tested |
| TC-08 inbound direct message | Mock D1 | `direct-message.test.ts:451` | Asserts projection INSERT is called, entity type, entity ID — does NOT assert status bind |
| `replayPrimeProjectionJob` full cycle | Unit (mock) | No test found for the full enqueue→pending→replay→projected cycle | Gap |

#### Coverage Gaps

- Untested paths:
  - TC-08 (`direct-message.test.ts:451`) does not assert `projectionInsert.binds[5]` at all — after the fix (shadow-write should write `'projected'`), a regression back to `'pending'` would not be caught.
  - `activity-message.test.ts:349` has the same omission — no assertion on projection INSERT status bind value.
  - End-to-end manual replay cycle: `enqueuePrimeProjectionJob` (`'pending'`) → `listPrimePendingProjectionJobs` finds it → `replayPrimeProjectionJob` → `'projected'`. Useful to test the replay tool itself (not a background processor — there is none).
  - `sendPrimeReviewThread` INSERT status IS already tested: `review-threads.test.ts:2848,3195` assert `binds[5] === 'projected'`.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test:
  - Adding a `binds[5]` assertion to TC-08 for `'pending'` status is trivial.
  - Adding a unit test: `enqueuePrimeProjectionJob` with no status → `listPrimePendingProjectionJobs` finds it → `replayPrimeProjectionJob` → status is `'projected'`.
- Hard to test:
  - A real batch processor would need Cloudflare Workers cron testing infrastructure.
- Test seams needed:
  - The processor (if built) should accept an injectable `db` and `env` for unit testing without a live cron.

#### Recommended Test Approach

- Unit tests for: `enqueuePrimeProjectionJob` default inserts `'pending'` (existing); `replayPrimeProjectionJob` transitions `'pending'` → `'projected'` (cycle test, new)
- Contract tests for: TC-08 (`direct-message.test.ts`) should assert `projectionInsert.binds[5] === 'projected'` (after fix); `activity-message.test.ts` equivalent projection insert should assert `binds[5] === 'projected'` (after fix); `sendPrimeReviewThread` insert already asserted in `review-threads.test.ts:2848,3195`

### Recent Git History (Targeted)

- `apps/prime/functions/lib/prime-review-send.ts` — last modified in `f146ea5` "feat(prime): complete unified messaging review flow"
- `apps/prime/functions/lib/prime-messaging-repositories.ts` — last modified in `f146ea5`
- `apps/prime/functions/lib/prime-messaging-shadow-write.ts` — modified in `1290cd4` "fix(inbox): four Prime inbox correctness gaps"

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI change — backend job lifecycle only | None | No |
| UX / states | N/A | No user-facing state change | None | No |
| Security / privacy | Required | Staff-owner gate on replay API; no new auth surface in fix | Fix does not introduce new attack surface; batch processor would need auth | If batch processor added: confirm no unauthenticated trigger path |
| Logging / observability / audit | Required | No current log on shadow-write job insertion; `attempt_count` + `last_error` on job row provide post-hoc auditability | No observable signal when `'pending'` jobs pile up — silent failure | Add log/metric when job count exceeds threshold, or at write time |
| Testing / validation | Required | TC-08 missing status assertion; no enqueue→process→complete cycle test | Regression risk if default status changes | Add bind assertion + cycle test |
| Data / contracts | Required | Schema unchanged. `status` enum is correct. `EnqueuePrimeProjectionJobInput.status?` is optional — dual-use (work-queue vs audit) is ambiguous | Optional `status` allows callers to silently bypass the queue | Consider whether `status` should be required at call sites, or add named factory helpers |
| Performance / reliability | Required | `listPrimePendingProjectionJobs` queries with `WHERE status = 'pending' ORDER BY updated_at ASC`. Index `idx_message_projection_jobs_status_updated` on `(status, updated_at)` already exists — `apps/prime/migrations/0001_prime_messaging_init.sql:113` | No index gap. Concern is retry backoff if inline projection is added; no max retry count defined | Define max retry count or circuit breaker for inline projection failures |
| Rollout / rollback | Required | Schema is forward-compatible; job rows are idempotent by ID | If shadow-write path is changed to inline-project, rollback is straightforward; if a processor is added, rollback requires disabling the processor trigger | Low risk for status-only fix; medium risk for processor addition |

## Questions

### Resolved

- Q: Does `enqueuePrimeProjectionJob` insert jobs with `'pending'` or `'projected'`?
  - A: Depends on the caller. Default is `'pending'` (line 991: `input.status ?? 'pending'`). `sendPrimeReviewThread` explicitly passes `status: 'projected'`. Shadow-write callers omit status, getting `'pending'`.
  - Evidence: `prime-messaging-repositories.ts:991`, `prime-review-send.ts:212`, `prime-messaging-shadow-write.ts:175,253`

- Q: Does the projection consumer query for `'pending'` or `'projected'`?
  - A: Queries for `'pending'` — `WHERE status = 'pending'` — `prime-messaging-repositories.ts:1431`.
  - Evidence: `prime-messaging-repositories.ts:1431`

- Q: Is `listPrimePendingProjectionJobs` called by any production code?
  - A: No. It is defined in `prime-messaging-repositories.ts` and imported only in `prime-messaging-repositories.test.ts`. No production handler, cron, DO, or API route calls it.
  - Evidence: full codebase grep across `.ts` files returned only test file + declaration.

- Q: Is `sendPrimeReviewThread` writing `'projected'` a bug?
  - A: No — the Firebase write is done inline immediately before the INSERT. The job with `'projected'` is an audit/replay record, not a work-queue item. Semantically correct, but the pattern is invisible from the schema.
  - Evidence: `prime-review-send.ts:120–130` (inline Firebase call before INSERT), `prime-review-send.ts:207–222` (INSERT with `status: 'projected'`)

- Q: Are inbound shadow-write `'pending'` jobs currently stacking up?
  - A: Unknown from code alone — no production DB access in this fact-find. Code analysis confirms that `'pending'` jobs from shadow-write are inserted and never consumed. Whether rows are accumulating depends on inbound message volume since the shadow-write feature was deployed.
  - Evidence: code analysis; production DB count not checked.

- Q: Is there an end-to-end test for the enqueue → process → complete cycle?
  - A: No. Tests validate individual functions in isolation but not the full cycle from `shadowWrite` insert through `listPrimePendingProjectionJobs` to `replayPrimeProjectionJob` completing the job.
  - Evidence: review of `prime-messaging-repositories.test.ts`, `direct-message.test.ts`, `review-threads.test.ts`

### Open (Operator Input Required)

- Q: Should `message_projection_jobs` rows written by shadow-write paths be retained as audit records (with `status: 'projected'`), or should they be removed entirely since Firebase projection is already done by the time shadow-write is called?
  - Why operator input is required: This is a data-retention preference. Keeping the records enables historical replay and debugging; removing them reduces table churn. Both are defensible.
  - Decision impacted: Whether TASK-03 is (a) change shadow-write enqueue call to pass `status: 'projected'` (align with Path A pattern) or (b) remove the `enqueuePrimeProjectionJob` call from shadow-write paths entirely.
  - Decision owner: operator / engineering lead
  - Default assumption (if any) + risk: Recommend retaining records with `status: 'projected'` for direct-channel threads — consistent with Path A. **For activity-channel threads:** retaining the job record provides no practical replay benefit because `replayPrimeProjectionJob` rejects non-direct threads (`prime-projection-replay.ts:66`). The activity-channel job record can be retained for audit purposes only, or omitted entirely — neither option fixes a broken sync path since Firebase is already written.
  - **Note:** The inline-vs-batch question is moot for inbound messages — Firebase is already written inline in the API handler. The design question is record retention only.

## Confidence Inputs

- Implementation: 95% — root cause is confirmed; the fix is a one-line status change at two call sites in `prime-messaging-shadow-write.ts`. The only open question is whether to retain the job as `'projected'` or omit it entirely.
  - To reach 98%: operator confirms retain-vs-remove preference for shadow-write projection records.
- Approach: 90% — inline projection is already the design; status alignment fix is the correct and minimal approach.
  - To reach 95%: operator confirms retain vs remove.
- Impact: 85% — Firebase sync is not currently broken; fixing the status is an audit/correctness improvement. Real-time delivery is unaffected.
  - To reach 90%: verify production `'pending'` count and confirm no downstream tooling reads `status = 'pending'` as a health signal.
- Delivery-Readiness: 90% — fix is very small; tests are well-defined; only one preference question is open.
  - To reach 95%: operator confirms retain vs remove.
- Testability: 95% — highly testable with mock D1 and mock Firebase; two test assertions to add.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `'pending'` jobs accumulating in production from past shadow-write inserts | Medium | Low — Firebase sync is not broken; jobs are dead audit records | Check `message_projection_jobs WHERE status = 'pending'` count; backfill `'projected'` if desired |
| TC-08 and activity-message test lack status bind assertion — shadow-write regression undetected | Medium | Medium — status value could silently regress | Add explicit `binds[5] === 'projected'` assertion after fix |
| `sendPrimeReviewThread` and shadow-write pattern both do inline projection but write different statuses — future callers confused | Medium | Medium — new callers may write `'pending'` when inline projection already done | Add JSDoc to `enqueuePrimeProjectionJob` explaining when to use `'projected'` vs `'pending'` |
| Manual replay via `review-projection-replay.ts` blocked for non-direct thread jobs (activity channel) | Low (manual path) | Medium — activity-thread `'pending'` jobs cannot be manually replayed via existing API | Not in scope for this fix; document as separate concern |

## Planning Constraints & Notes

- Must-follow patterns:
  - D1 writes in prime functions use `db.prepare(...).bind(...).run()` pattern — no ORMs.
  - Tests use mock D1 (`createMockDb` / `createMockD1Database`) — no live D1 in unit tests.
  - Testing policy: tests run in CI only — no local `pnpm test`.
- Rollout/rollback expectations:
  - Status-only fix (change shadow-write to write `'projected'` after inline projection): zero schema change, zero migration, instant rollback by reverting commit.
  - Batch processor addition: requires new wrangler config, new Cloudflare resource, migration to add index — needs staged rollout.
- Observability expectations:
  - If inline projection path added: log `projection_result: ok | error` per shadow-write call for observability.
  - If batch processor added: emit count of jobs processed per run.

## Suggested Task Seeds (Non-binding)

1. TASK-01: Fix shadow-write enqueue status — change `enqueuePrimeProjectionJob` in `prime-messaging-shadow-write.ts` to pass `status: 'projected'` (inline Firebase write already happened in the API handler). Two call sites: `shadowWritePrimeInboundDirectMessage` (line 175) and `shadowWritePrimeInboundActivityMessage` (line 253) — 30 min.
2. TASK-02: Add `binds[5] === 'projected'` assertion to TC-08 in `direct-message.test.ts` and equivalent assertion in `activity-message.test.ts` — 30 min.
3. TASK-03: Add end-to-end cycle test for the replay path: `enqueuePrimeProjectionJob` (`'pending'`) → `listPrimePendingProjectionJobs` finds it → `replayPrimeProjectionJob` → job status is `'projected'`. This tests the manual replay tool, not a background processor. — 1 hr.
4. TASK-04: Add JSDoc to `enqueuePrimeProjectionJob` distinguishing work-queue (`'pending'`) vs audit-record (`'projected'`) call sites, to prevent future callers from repeating this ambiguity.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Tests pass; `direct-message.test.ts` TC-08 and `activity-message.test.ts` assert projection INSERT status; shadow-write paths write correct status (`'projected'` or removed); no `'pending'` jobs written by shadow-write after fix.
- Post-delivery measurement plan: Check `message_projection_jobs WHERE status = 'pending'` count in production D1 before and after — should trend to 0 for new shadow-write-originated inserts after fix.
- Key files in scope: `prime-messaging-shadow-write.ts`, `prime-messaging-repositories.ts`, `direct-message.ts`, `activity-message.ts`, `direct-message.test.ts`, `activity-message.test.ts`

## Evidence Gap Review

### Gaps Addressed

- Confirmed exact SQL query in `listPrimePendingProjectionJobs` (`WHERE status = 'pending'`).
- Confirmed `sendPrimeReviewThread` explicitly passes `status: 'projected'` — intentional, post-inline-projection.
- Confirmed shadow-write paths omit status (default `'pending'`) — orphaned.
- Confirmed no production caller of `listPrimePendingProjectionJobs`.
- Confirmed no `scheduled` / cron handler in `wrangler.toml`.
- Identified that TC-08 does not assert projection status bind.

### Confidence Adjustments

- Initial dispatch confidence 0.85. Post-investigation (including Round 1 and Round 2 critique corrections): status mismatch confirmed for shadow-write path; Firebase sync is already inline in API handlers so real-time delivery is not broken. Root cause refined from "jobs never consumed, Firebase broken" to "shadow-write jobs written with incorrect status (`'pending'` instead of `'projected'`), Firebase already synced". Confidence in diagnosis: 95%. Confidence in fix approach: 90%.

### Remaining Assumptions

- Firebase RTDB SET semantics for the message node are idempotent (last-write-wins) — standard for RTDB but not tested explicitly.
- No downstream tooling or monitoring reads `status = 'pending'` in `message_projection_jobs` as a health signal that would produce false alerts after the fix.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `enqueuePrimeProjectionJob` INSERT status | Yes | None | No |
| `listPrimePendingProjectionJobs` query predicate | Yes | None — confirmed queries `'pending'` | No |
| All callers of `enqueuePrimeProjectionJob` | Yes | `prime-review-send.ts` writes `'projected'` explicitly (intentional); `shadow-write.ts` writes `'pending'` (orphaned) | No |
| Production consumer existence | Yes | [Structural] [High]: No production consumer of `listPrimePendingProjectionJobs` exists | No — documented as finding |
| End-to-end test coverage | Yes | [Coverage] [Medium]: No cycle test; TC-08 and activity-message test missing status bind assertion for shadow-write `'pending'`; `sendPrimeReviewThread` INSERT is asserted in review-threads tests | No — documented as gap |
| Cron / scheduled handler | Yes | [Structural] [High]: `wrangler.toml` has no cron triggers | No — documented as finding |
| Campaign runtime paths | Yes | None — inline projection + immediate update to `'projected'` is correct | No |
| Replay API — direct-thread constraint | Yes | [Structural] [Medium]: `replayPrimeProjectionJob` rejects non-direct threads (`prime-projection-replay.ts:66`) — activity-channel `'pending'` jobs cannot use this helper without extension | No — documented as blocker for batch processor option |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** The scope is bounded to three files (repositories, shadow-write, review-send), two test files, and one architectural decision. The fix is small (status or inline projection), the tests are well-defined, and the open question (inline vs batch) is operator-resolvable with a single confirmation.

## Analysis Readiness

- Status: Needs-input
- Blocking items:
  - Critique score 3.0/5.0 (partially credible) — deterministic gate requires ≥4.0 for `Ready-for-analysis`. All critique findings from Rounds 1–3 were applied and the diagnosis was substantially improved, but the score did not cross the readiness threshold.
  - One open preference question: retain shadow-write projection records as `'projected'` or remove them entirely (see Open Questions). Either path unblocks the fix; analysis can proceed with both options.
- **Top findings addressed in Round 3 autofixes:**
  - Outcome contract revised to reflect correct problem statement (status inconsistency, not broken sync).
  - Coverage-gap section updated to assert `'projected'` after fix.
  - Replay benefit for activity-channel jobs clarified (not replayable via current API).
  - Analysis handoff inconsistency resolved.
- Recommended next step: Operator review of findings summary above; confirm retain-vs-remove preference; then invoke `/lp-do-analysis reception-prime-projection-job-status` to continue.
