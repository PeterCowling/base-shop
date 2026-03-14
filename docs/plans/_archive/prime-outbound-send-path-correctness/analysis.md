---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-outbound-send-path-correctness
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-outbound-send-path-correctness/fact-find.md
Related-Plan: docs/plans/prime-outbound-send-path-correctness/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Outbound Send Path Correctness — Analysis

## Decision Frame

### Summary

The `reception-prime-outbound-messaging` build left four defects in the staff whole-hostel broadcast path:

- **C-01**: `sendPrimeInboxThread` routes broadcasts to `review-campaign-send`, an endpoint designed for review campaigns with `booking`/`room` audience fan-out. For `whole_hostel` it is a needless indirection that adds a KV rate-limit gate (3/60 s), an extra HTTP hop, and the wrong `actorSource` label on the audit record.
- **C-02**: Retry creates a duplicate broadcast. The `prime-compose` route calls `initiatePrimeOutboundThread` first on every attempt; `savePrimeReviewDraft` inside `staff-initiate-thread` uses `isReusableWholeHostelLane` to bypass the `sent`/`resolved` conflict guards and reset `review_status` to `pending`, so a simple "check thread status before send" guard is invalidated before it fires.
- **C-03**: `sendPrimeReviewThread` writes Firebase first (step 2 of 9), then 7 sequential independent D1 writes with no transaction. A Firebase failure silently loses the broadcast with no replay path; a mid-sequence D1 failure leaves partially inconsistent state.
- **C-05**: Delivery model is undocumented — broadcasts reach guests only via Firebase RTDB subscription, not push notifications. Guests without an active Prime session miss the message until they next open the app.

The decision is: which approach eliminates C-01 and C-02 completely, and best mitigates C-03 within reasonable scope?

### Goals

- Correct the send endpoint routing (C-01).
- Achieve retry safety: two identical `prime-compose` calls must not produce two broadcast messages (C-02).
- Fix the `actorSource` audit label.
- Document the delivery model (C-05).
- Test the routing decision and retry behaviour.

### Non-goals

- Full transactional consistency across Firebase and D1 (requires Firebase Transactions or a saga pattern — deferred).
- Guest-facing push notification delivery.
- Changes to `booking`/`room` campaign send paths.

### Constraints & Assumptions

- The `broadcast_whole_hostel` thread is a singleton; its ID is stable and reused across all broadcasts.
- `staff-initiate-thread.ts` and `review-thread-send.ts` are Cloudflare Pages Functions; any new endpoint follows the same pattern.
- No schema migration is needed — D1 tables are unchanged by all three options.
- The `isReusableWholeHostelLane` bypass in `savePrimeReviewDraft` is intentional and correct for the repeated-broadcast use-case; any idempotency fix must preserve it.

## Inherited Outcome Contract

- **Why:** Staff broadcast path routes to an endpoint designed for review campaigns, creating potential misrouting, duplicate sends on retry, and unclear delivery guarantees.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The send path for staff whole-hostel broadcasts is correctly routed through `review-thread-send` (not `review-campaign-send`), has idempotency protection against retry-created duplicate threads/messages, and the delivery model to guest devices is documented and verified.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-outbound-send-path-correctness/fact-find.md`
- Key findings used:
  - `isReusableWholeHostelLane` bypass resets `review_status` to `pending` on every `initiatePrimeOutboundThread` call — making a post-initiate status check unreliable.
  - `review-thread-send.ts:34` hardcodes `actorSource: 'reception_proxy'` (same as `review-campaign-send.ts`) — routing change alone does not fix the actorSource label.
  - `sendPrimeReviewThread` performs 7 sequential D1 writes after Firebase projection; no transaction and no replay job if Firebase fails.
  - `review-threads.test.ts` TC-06B already covers the whole_hostel send happy path via `review-thread-send`.
  - The `prime-compose` route makes two sequential HTTP calls: initiate, then send. The retry hazard lives between these two calls.

## Evaluation Criteria

| Criterion | Why it matters | Weight |
|---|---|---|
| Eliminates C-02 (retry idempotency) | Core outcome contract requirement — duplicate broadcasts visible to guests are a user-facing defect | High |
| Eliminates C-01 (wrong endpoint routing) | Removes rate-limit gate, unnecessary hop, wrong actorSource | High |
| Code surface and blast radius | Smaller change = lower regression risk to existing review-campaign and review-thread flows | Medium |
| Test writability | Can the approach be unit-tested without deep mocking? | Medium |
| Preserves existing patterns | Deviation from codebase conventions needs clear justification | Medium |
| Addresses C-03 partial mitigation | Firebase failure should at minimum be visible, not silently lost | Low-Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: New single-hop `staff-broadcast-send` endpoint on Prime | Add `POST /api/staff-broadcast-send` that calls `savePrimeReviewDraft` then `sendPrimeReviewThread` in one CF Function invocation. Reception calls this single endpoint directly, bypassing both `staff-initiate-thread` and the `sendPrimeInboxThread` routing logic. `prime-compose/route.ts` is simplified to one HTTP call. | Eliminates the multi-hop sequential retry window — the "failed between hops" scenario cannot occur in a single-hop design (C-02 primary hazard solved). Removes the campaign-send routing branch (C-01 solved). `actorSource` can be set correctly at the call site. One fewer HTTP round-trip on the happy path. Endpoint can be tested in isolation with D1/Firebase mocks. | New file + new test file in Prime. `prime-compose/route.ts` and `initiatePrimeOutboundThread`/`sendPrimeInboxThread` need changes. `staff-initiate-thread.ts` becomes unused. `savePrimeReviewDraft` resets `review_status` to `pending` via `isReusableWholeHostelLane` before `sendPrimeReviewThread` fires — so the conflict check inside `sendPrimeReviewThread` cannot catch a retry if `savePrimeReviewDraft` runs first. Strictly concurrent duplicate requests that both arrive before any write completes can each reset to `pending` and both proceed to send. This is a known D1/SQLite serialization limitation. | C-02 protection is for the sequential multi-hop retry window (the stated problem). Concurrent duplicate requests within the same millisecond window are out of scope for this fix and acceptable given D1 SQLite write serialization in practice. | Yes |
| B: Client idempotency key on `staff-initiate-thread` | Reception generates a UUID per compose attempt and passes it as a header or body field. `staff-initiate-thread` stores the key on the draft/campaign; on retry with same key, returns the existing draft without resetting thread status. Reception can then call `sendPrimeInboxThread` with confidence the thread was not reset. | Preserves two-hop design. Minimal change to `sendPrimeInboxThread` routing (still wrong but can be fixed separately). | Requires a new column or metadata field on the draft/campaign to store the idempotency key — effectively a schema addition. Reception must persist the key for the retry window (e.g. in the request, but if Reception crashes between initiate and send the key is lost). Retry initiated by a different Reception server instance needs the key to be client-side-generated (acceptable) but complex to test. The actorSource bug is not fixed by this option. The routing bug (C-01) also requires a separate fix. | Idempotency key only covers the initiate-send gap; does not eliminate the extra hop or rate-limit problem. Most complex to implement and test. Schema addition is a disproportionate response. | Yes, but inferior |
| C: Skip initiate on `prime-compose` if unsent draft already exists | Before calling `initiatePrimeOutboundThread`, `prime-compose/route.ts` first fetches the thread detail. If a non-sent staff draft exists for `broadcast_whole_hostel`, skip initiate and call `sendPrimeInboxThread` directly. | No new Prime endpoint needed. Preserves the two-hop pattern for the first call. | Requires an extra `getPrimeInboxThreadDetail` HTTP call on every compose request (even first-time calls). The "skip" decision requires inspecting draft state, which is fragile: if the existing draft's content differs from the new text, skipping initiate would silently send stale content. Does not fix C-01 (still routes through campaign-send). Does not fix actorSource. Adds logic to `prime-compose/route.ts` that makes it harder to reason about. Retry window between fetch-and-skip and the actual send still exists. | Fundamentally flawed: cannot skip initiate when the operator typed new broadcast text, so the "skip" guard cannot safely apply to the first new message of a broadcast. Retry idempotency requires knowing whether the prior initiate succeeded, which this option cannot reliably determine without state outside the request. | No — cannot satisfy C-02 without additional state |

## Engineering Coverage Comparison

| Coverage Area | Option A (New single-hop endpoint) | Option B (Idempotency key on initiate) | Option C (Skip initiate) | Chosen implication (Option A) |
|---|---|---|---|---|
| UI / visual | N/A — no UI changes | N/A | N/A | N/A |
| UX / states | `prime-compose/route.ts` returns same 200/400/502/503 shape. The new endpoint returns `{ outcome: 'sent', sentMessageId: ... }` on success. If `sendPrimeReviewThread` returns `{ outcome: 'conflict' }` (e.g. concurrent duplicate), the endpoint returns HTTP 409 → Reception maps to 502. Operator sees a send failure on genuine concurrent duplicates, which is acceptable (rare edge case). | Same external shape. | Same external shape but more failure modes from extra fetch. | Response contract for `staff-broadcast-send`: `{ outcome: 'sent', sentMessageId }` on success; `{ outcome: 'conflict', message }` (409) on duplicate; `{ outcome: 'not_found' }` (404) if thread missing. Plan must specify this contract. |
| Security / privacy | Staff-owner gate preserved. Rate limit removed (belongs on this path). `actorSource` can be set to `'reception_staff_compose'` correctly. | Rate limit and wrong `actorSource` remain without a second fix. | Same problems as current path remain. | Option A removes rate-limit gate and restores correct audit label. |
| Logging / observability / audit | `actorSource: 'reception_staff_compose'` in admission record. One HTTP call to log per compose. | `actorSource` still wrong unless separately patched. | `actorSource` still wrong. | Should log when `sendPrimeReviewThread` returns `conflict` (potential concurrent duplicate detected). One HTTP call per compose attempt (reduced from three). |
| Testing / validation | New endpoint unit-tested in isolation (D1 + Firebase mocks, same pattern as TC-06B). `prime-compose/route.ts` simplified — its tests updated to mock the single new call. | Needs schema change plus new test for idempotency key semantics. | Needs test for draft-existence fetch path; fragile. | Option A has the most testable shape. Routing unit test for `prime-compose` is straightforward with a fetch mock. |
| Data / contracts | No new D1 columns. Campaign + draft + message records unchanged. `actorSource` in admission records changes value. | New column on draft/campaign table for idempotency key — schema drift risk. | No schema change. Extra read on every request. | No schema migration needed for Option A. |
| Performance / reliability | One fewer HTTP hop (3 → 2). Rate limit removed. D1/Firebase non-transactional write sequence unchanged — C-03 partial mitigation only. Idempotency window narrowed to within-function (milliseconds) vs cross-hop (seconds). | Same hop count. Idempotency window unchanged unless key is checked before initiate. | One more HTTP call added (extra fetch). | C-03 (Firebase failure = silent loss) is not fully resolved by any option; plan must document this as a known residual risk. |
| Rollout / rollback | Rollback = revert `prime-compose/route.ts` + remove new Prime endpoint file. No migration to roll back. Feature flag not needed (staff-only internal path). | Rollback requires reverting schema addition AND code. | Rollback = revert `prime-compose/route.ts`. | Option A has the cleanest rollback. |

## Chosen Approach

**Recommendation: Option A — New single-hop `staff-broadcast-send` endpoint on Prime.**

### Why this wins

1. **Solves the C-02 sequential retry hazard.** The original problem is that a retry after a network drop between the two HTTP hops (initiate succeeds, send not yet called, client retries whole request) causes `initiatePrimeOutboundThread` to reset `review_status` to `pending` via `isReusableWholeHostelLane`, then the second send fires. In Option A there is only one HTTP hop — the "failed between hops" scenario disappears structurally. The downside: `savePrimeReviewDraft` still resets `review_status` to `pending` inside the new endpoint before `sendPrimeReviewThread` fires, so strictly concurrent duplicate requests (both arriving before any write completes) could both proceed to send. This is an accepted limitation: the stated C-02 hazard is a sequential retry across hops, not a concurrent race. A "review_status: sent" pre-check before `savePrimeReviewDraft` would block legitimate new broadcasts (since the singleton thread stays `sent` until a new draft is saved), so it is not the right mechanism. The narrowed window (single-function, microseconds vs multi-hop seconds) is the correct mitigation for the practical hazard.

2. **Cleanest solution to C-01.** The new endpoint does not go through `review-campaign-send` at all. The routing branch in `sendPrimeInboxThread` that currently triggers campaign-send for broadcast threads can be removed entirely from the Reception layer.

3. **Fixes `actorSource` at the call site.** The new endpoint can accept an `actorSource` header (e.g. `x-prime-actor-source`) and pass it through to `sendPrimeReviewThread`. Alternatively, the new endpoint can hardcode the correct label `'reception_staff_compose'`, which is always correct for this path.

4. **Lowest blast radius.** Option B requires a schema addition and key-persistence logic. Option C adds fragility. Option A touches only: one new Prime endpoint file, one updated `prime-compose/route.ts`, and the `sendPrimeInboxThread` routing simplification. No table migrations. No new state.

5. **Most testable.** The new endpoint follows the identical pattern to `staff-initiate-thread.ts` and `review-thread-send.ts`. The existing test helpers (`createMockD1Database`, `createMockEnv`, `createPagesContext`) work directly. The Reception test for `prime-compose` reduces to mocking a single HTTP call.

6. **Preserves existing flows unchanged.** `staff-initiate-thread.ts` can remain for now (or be deprecated). Other callers of `sendPrimeInboxThread` (non-broadcast threads) are unaffected. `review-thread-send.ts` and `review-campaign-send.ts` are untouched.

### Why actorSource is not a separate fix

Both `review-thread-send.ts` and `review-campaign-send.ts` hardcode `actorSource: 'reception_proxy'`. This is not an accident — it reflects that these endpoints are generic, not Reception-specific. The correct fix is: the new `staff-broadcast-send` endpoint, which is explicitly a Reception staff path, uses the correct label at its call site. This is cleaner than adding an `actorSource` header protocol to generic endpoints used by other callers.

### What it depends on

- Prime Cloudflare Pages Functions must be deployable — they are (existing pattern confirmed).
- The new endpoint re-uses `savePrimeReviewDraft` (for draft upsert) and `sendPrimeReviewThread` (for send) — both already exist in `functions/lib/`. No new business logic.
- Reception `prime-compose/route.ts` must be updated to call the new endpoint directly instead of calling `initiatePrimeOutboundThread` + `sendPrimeInboxThread`. This means `initiatePrimeOutboundThread` may become unused by the broadcast compose flow (it can be left for potential other callers or removed — planning decides).

### Rejected Approaches

- **Option B (idempotency key)** — Rejected. Requires a schema addition (new column on draft or campaign table for the idempotency key), key persistence logic on the Reception side, and does not fix C-01 or actorSource without additional changes. Disproportionate complexity for a problem that Option A solves structurally.

- **Option C (skip initiate on draft exists)** — Rejected. Cannot distinguish "retry of same message" from "new broadcast with same content". If the operator types identical text twice in quick succession, the second message would be silently dropped. Requires an extra HTTP round-trip on every compose request. Does not fix C-01, actorSource, or C-03.

### Open Questions (Operator Input Required)

- **None.** All blocking questions were resolved during analysis. The idempotency approach (Option A) is decisive. The singleton-reset design is preserved: after each send the thread is `sent`; the next compose call resets to `pending` via `savePrimeReviewDraft`/`isReusableWholeHostelLane`. The C-02 hazard (multi-hop sequential retry creating duplicate) is addressed by collapsing to a single hop. The residual concurrent-duplicate risk is accepted as out-of-scope.

## End-State Operating Model

| Area | Current state | Trigger | Delivered end-state (Option A) | What remains unchanged | Risks / seams for planning |
|---|---|---|---|---|---|
| Reception → Prime: compose | Two HTTP calls: `POST /api/staff-initiate-thread` then `POST /api/review-campaign-send?campaignId=...` (via `sendPrimeInboxThread` routing branch). Total: 3 hops including the `getPrimeInboxThreadDetail` fetch. Rate-limited by campaign-send KV gate. | Staff submits broadcast in Reception inbox UI | Single HTTP call: `POST /api/staff-broadcast-send` from `prime-compose/route.ts`. No routing branch in Reception. | Reception auth gate (`requireStaffAuth`), telemetry event (`prime_broadcast_initiated`), 200/502/503 response shape | A 409 from Prime (concurrent duplicate) maps to 502 at Reception. Plan must specify whether reception wraps this as a user-visible error or suppresses it. |
| Prime: initiate + send | Two separate endpoints: `staff-initiate-thread` (upsert thread + draft + campaign) and `review-thread-send` (send draft). A retry between these two creates a duplicate — the initiate step resets `review_status: pending`, invalidating the send's conflict check. | As above | Single endpoint `staff-broadcast-send`: (1) call `savePrimeReviewDraft` (upserts draft, resets thread to `pending`), (2) call `sendPrimeReviewThread` (conflict check fires here on non-concurrent duplicate, then sends). All in one CF Function invocation. The multi-hop sequential retry window is eliminated. | `sendPrimeReviewThread` logic unchanged. `savePrimeReviewDraft` logic unchanged. `ensureWholeHostelCampaignForDraft` unchanged. `isReusableWholeHostelLane` reset behaviour preserved for legitimate re-use. | D1 writes remain non-transactional (7 sequential writes); Firebase projection still precedes D1. C-03 is reduced (narrower window) but not eliminated. Strictly concurrent duplicate requests within the same millisecond window can bypass the conflict check. |
| Audit / actorSource | `actorSource: 'reception_proxy'` hardcoded on all send paths | As above | `actorSource: 'reception_staff_compose'` set in new endpoint's call to `sendPrimeReviewThread` | `actorUid` already correct on all paths | Need to verify existing admission records with `'reception_proxy'` — already written, cannot be retroactively fixed. New records going forward will have the correct label. |
| Rate limit | KV rate limit 3/60 s per actor via `review-campaign-send` | As above | No rate limit on `staff-broadcast-send` beyond the `enforceStaffOwnerApiGate`. Broadcast is a staff-initiated operation; rate limiting via KV is inappropriate here. | `review-campaign-send` rate limit unchanged for its intended use (review campaigns) | None |
| Delivery to guests | Firebase RTDB write to `messaging/channels/broadcast_whole_hostel/messages/{messageId}`. No push notification. Guests see message on next app open or if actively subscribed. | As above | Unchanged. Documented in code comment on new endpoint. | All downstream Firebase projection logic unchanged | C-05 is a documentation-only fix; no delivery model change in scope |

## Planning Handoff

- **Planning focus:**
  - TASK-01: New `apps/prime/functions/api/staff-broadcast-send.ts` endpoint — handler: (a) enforces staff-owner gate, (b) calls `savePrimeReviewDraft` with text from request body and `actorUid` from header, (c) if draft save returns `not_found` → 404; `conflict` → 409, (d) calls `sendPrimeReviewThread` with `actorSource: 'reception_staff_compose'`, (e) if send returns `sent` → 200 `{ outcome: 'sent', sentMessageId }`; `conflict` → 409; `not_found` → 404. No `review_status: sent` pre-check is needed — the C-02 protection comes from the single-hop design eliminating the multi-hop sequential retry window.
  - TASK-02: Update `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — replace the two-call pattern with a single `primeRequest` to `/api/staff-broadcast-send`. Remove calls to `initiatePrimeOutboundThread` and `sendPrimeInboxThread` from this handler.
  - TASK-03: Update `apps/reception/src/lib/inbox/prime-review.server.ts` — remove the `prime_broadcast + campaign.id` routing branch from `sendPrimeInboxThread` (or remove `sendPrimeInboxThread` entirely if no other callers remain). Add a new `staffBroadcastSend` helper that wraps the single new endpoint.
  - TASK-04: Tests — new unit tests for `staff-broadcast-send.ts` (TC: auth gate, missing DB, missing plainText, happy path creates draft+sends, happy path returns sentMessageId, conflict returns 409). Update `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` to mock the new single `staffBroadcastSend` call (replaces two-call mock chain). Remove or repurpose `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` if `initiatePrimeOutboundThread` loses its broadcast caller. Verify that `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` (lines 499–535, broadcast-specific coverage) still passes against the new `sendPrimeInboxThread` (with the routing branch removed).
  - TASK-05: Documentation — add a code comment to `staff-broadcast-send.ts` explaining the Firebase RTDB delivery model (subscription-based, not push). Update any relevant README or inline docs.

- **Validation implications:**
  - The `sendPrimeInboxThread` routing branch (`detail.campaign.id && detail.thread.channel === 'prime_broadcast'`) will be removed. Affected test files: (a) `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` (239 lines) — replace two-call mock chain with single `staffBroadcastSend` mock; (b) `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` (154 lines) — remove or repurpose if `initiatePrimeOutboundThread` loses its broadcast caller; (c) `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` lines 499–535 — this tests `sendPrimeInboxThread` for the broadcast thread via `[threadId]/send/route.ts`, which is a SEPARATE path from `prime-compose`. This route must remain functional; only the `sendPrimeInboxThread` broadcast routing branch is being removed, so the `[threadId]/send` route and its test are unaffected if the non-broadcast fallthrough (`review-thread-send`) is preserved.
  - TC-06B in `review-threads.test.ts` covers `review-thread-send` independently — not affected.

- **Sequencing constraints:**
  - TASK-01 (Prime endpoint) must land before TASK-02 (Reception route update) — the Reception route must be able to call the new endpoint.
  - TASK-03 (Reception lib cleanup) can be done in the same PR as TASK-02.
  - TASK-04 (tests) must cover TASK-01 and TASK-02 in the same PR.
  - TASK-05 (docs) can be bundled with TASK-01.

- **Risks to carry into planning:**
  - C-03 residual: Firebase → D1 non-transactional write sequence is unchanged. Plan must note this as a known limitation and add a log entry when Firebase projection fails (making the failure observable).
  - Reception `initiatePrimeOutboundThread` may have callers beyond `prime-compose/route.ts` — planning must audit callers before removing it.
  - `staff-initiate-thread.ts` may have callers outside Reception — planning must check before deprecating/removing.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| C-03 residual: Firebase write fails silently — no replay job, broadcast lost | Low (Firebase is reliable in practice) | High (broadcast invisibly not sent to guests) | Requires Firebase transactions or a saga/outbox pattern — out of scope for this fix | Add structured logging when Firebase projection throws; enqueue a projection job BEFORE Firebase write as a pre-registration pattern (optional stretch task) |
| `initiatePrimeOutboundThread` has other callers that would break if removed | Low (grep shows single caller in prime-compose) | Medium | Audit is a planning-time code search, not analysis-time | Planning task: grep for all callers of `initiatePrimeOutboundThread` before removing |
| `staff-initiate-thread.ts` has other callers | Very low (endpoint was added in the outbound messaging build) | Medium | Same as above | Planning task: grep + deprecate/remove if safe |
| `review-campaign-send` routing branch removal changes behaviour for non-broadcast threads | Very low (branch only fires for `prime_broadcast` channel) | Low | The non-broadcast fallthrough (`review-thread-send`) is unchanged | Test the non-broadcast path remains functional |
| Concurrent duplicate requests within the same millisecond window both send | Very low (requires two near-simultaneous operator submit actions) | Medium (duplicate broadcast visible to guests) | Requires CAS/D1 transaction — out of scope; C-02 fix targets sequential multi-hop retry, not concurrent race | Document as accepted limitation; no action required |

## Planning Readiness

- Status: Go
- Rationale: All three options evaluated. Option A is decisive — eliminates C-01, eliminates the multi-hop sequential retry hazard (C-02 primary case), fixes actorSource, has the smallest blast radius, and is directly testable. Residual concurrent-duplicate risk is accepted and documented. No operator-only questions remain. Engineering coverage comparison complete. End-state operating model written. C-03 residual risk documented and accepted as out-of-scope for this plan. Blast radius accurately includes `prime-compose/route.test.ts`, `initiate-prime-outbound-thread.test.ts`, and `inbox-actions.route.test.ts`.
