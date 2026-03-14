---
Type: Plan
Status: Complete
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-outbound-send-path-correctness
Dispatch-ID: IDEA-DISPATCH-20260314160000-BRIK-003
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-outbound-send-path-correctness/analysis.md
---

# Prime Outbound Send Path Correctness — Plan

## Summary

Four defects in the staff whole-hostel broadcast path are fixed by introducing a new single-hop `POST /api/staff-broadcast-send` Prime endpoint that combines draft upsert and send in one Cloudflare Pages Function. The `prime-compose` Reception route is updated to call this single endpoint instead of the current `initiatePrimeOutboundThread` + `sendPrimeInboxThread` two-call chain. The broadcast routing branch is removed from `sendPrimeInboxThread`. Tests for the new endpoint and updated route are written. The Firebase RTDB delivery model is documented inline. `staff-initiate-thread.ts` is deprecated (no active callers remain after the routing change).

## Active tasks

- [x] TASK-01: Create `staff-broadcast-send` Prime endpoint
- [x] TASK-02: Add `staffBroadcastSend` helper to Reception Prime proxy lib
- [x] TASK-03: Update `prime-compose/route.ts` to use `staffBroadcastSend`
- [x] TASK-04: Write unit tests for `staff-broadcast-send.ts`
- [x] TASK-05: Update Reception tests for new broadcast path
- [x] TASK-06: Deprecate `staff-initiate-thread.ts` and `initiatePrimeOutboundThread`

## Goals

- Correct send endpoint routing for whole-hostel broadcasts (C-01).
- Eliminate the multi-hop sequential retry window that causes duplicate broadcasts (C-02).
- Fix `actorSource` audit label on broadcast send path.
- Document the Firebase RTDB delivery model for broadcasts (C-05).
- Maintain or improve test coverage for the changed paths.

## Non-goals

- Full transactional consistency across Firebase and D1.
- Guest-facing push notification delivery.
- Changes to `booking`/`room` campaign send paths.
- Fixing `review-campaign-send.ts` or `review-thread-send.ts` `actorSource` for generic callers.

## Constraints & Assumptions

- Constraints:
  - No D1 schema migrations — no new columns or tables.
  - New Prime endpoint follows the same Cloudflare Pages Function pattern as `staff-initiate-thread.ts` and `review-thread-send.ts`.
  - `inbox-actions.route.test.ts` broadcast test (lines 499–535) calls `sendPrimeInboxThread` via `[threadId]/send/route.ts` — this path is preserved. The routing branch inside `sendPrimeInboxThread` that routes to `review-campaign-send` is removed; the fallback to `review-thread-send` is preserved.
  - `staff-broadcast-send.ts` is staff-owner gated; `enforceStaffOwnerApiGate` returns `null` in non-production environments, so tests do not need to set up access tokens.
- Assumptions:
  - `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` (constant from `apps/prime/src/lib/chat/directMessageChannel.ts`) is importable from Prime functions as it is in `staff-initiate-thread.ts`.
  - `savePrimeReviewDraft` and `sendPrimeReviewThread` are stable; no signature changes are needed.
  - The `isReusableWholeHostelLane` reset in `savePrimeReviewDraft` is correct by design; the new endpoint relies on this for legitimate subsequent broadcasts.

## Inherited Outcome Contract

- **Why:** Staff broadcast path routes to an endpoint designed for review campaigns, creating potential misrouting, duplicate sends on retry, and unclear delivery guarantees.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The send path for staff whole-hostel broadcasts is correctly routed through a dedicated single-hop endpoint (`staff-broadcast-send`, not `review-campaign-send`), has structural protection against multi-hop retry-window duplicates, and the delivery model to guest devices is documented and verified.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/prime-outbound-send-path-correctness/analysis.md`
- Selected approach inherited:
  - Option A: New single-hop `staff-broadcast-send` endpoint on Prime — collapses the current `staff-initiate-thread` + `review-campaign-send` (or `review-thread-send`) multi-hop chain into a single CF Function invocation.
- Key reasoning used:
  - Multi-hop retry window (C-02 primary hazard) is eliminated structurally — no inter-hop gap can fail leaving thread in inconsistent state.
  - No schema addition needed; blast radius is contained to one new Prime file + two Reception file edits.
  - `actorSource` can be set correctly at the new endpoint's call site.

## Selected Approach Summary

- What was chosen:
  - New `POST /api/staff-broadcast-send` endpoint that calls `savePrimeReviewDraft` then `sendPrimeReviewThread` in one function.
  - Reception proxy lib gains `staffBroadcastSend` helper; `prime-compose/route.ts` uses it directly.
  - Broadcast routing branch in `sendPrimeInboxThread` removed; `initiatePrimeOutboundThread` deprecated.
- Why planning is not reopening option selection:
  - Analysis evaluated three options; Option A was decisive. No operator-only fork remains. Planning proceeds to decomposition.

## Fact-Find Support

- Supporting brief: `docs/plans/prime-outbound-send-path-correctness/fact-find.md`
- Evidence carried forward:
  - `savePrimeReviewDraft` `isReusableWholeHostelLane` bypass resets `review_status: pending` — new endpoint relies on this for reuse; C-02 protection comes from collapsing to single hop, not from a pre-check.
  - `sendPrimeReviewThread` write order (Firebase first, then 7 D1 writes) is unchanged — C-03 residual risk accepted.
  - `review-threads.test.ts` TC-06B covers `review-thread-send` independently and is not affected.
  - `initiatePrimeOutboundThread` has a single caller: `prime-compose/route.ts`. Confirmed by grep.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `staff-broadcast-send` Prime endpoint | 85% | M | Complete (2026-03-14) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Add `staffBroadcastSend` helper to Reception Prime proxy lib | 90% | S | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Update `prime-compose/route.ts` to use `staffBroadcastSend` | 90% | S | Complete (2026-03-14) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Write unit tests for `staff-broadcast-send.ts` | 85% | M | Complete (2026-03-14) | TASK-01 | - |
| TASK-05 | IMPLEMENT | Update Reception tests for new broadcast path | 85% | S | Complete (2026-03-14) | TASK-02, TASK-03 | - |
| TASK-06 | IMPLEMENT | Deprecate `staff-initiate-thread.ts` and `initiatePrimeOutboundThread` | 85% | S | Complete (2026-03-14) | TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no UI changes | - | Internal API path only |
| UX / states | New endpoint returns `{ outcome: 'sent', sentMessageId }` on success; `{ outcome: 'conflict' }` (409) if `sendPrimeReviewThread` detects a conflict (e.g. thread is `sent` and was not reset); `{ outcome: 'not_found' }` (404) if thread missing. Reception maps 409 → 502. Note: for the whole-hostel reusable lane, `savePrimeReviewDraft` resets `review_status: pending` before `sendPrimeReviewThread` fires — so strictly concurrent duplicates arriving before any write completes may both proceed to send (accepted residual risk; see Risks section). | TASK-01, TASK-02, TASK-04 | Response contract specified in TASK-01 acceptance |
| Security / privacy | Staff-owner gate preserved on new endpoint (`enforceStaffOwnerApiGate`). Rate limit removed — was incorrectly blocking broadcast path. `actorSource: 'reception_staff_compose'` set correctly. | TASK-01 | `enforceStaffOwnerApiGate` pattern is unchanged from existing Prime endpoints |
| Logging / observability / audit | `actorSource: 'reception_staff_compose'` written to admission record (not `'reception_proxy'`). `console.error` when send throws. | TASK-01 | Admission record is written inside `sendPrimeReviewThread` — no change to recording logic |
| Testing / validation | New endpoint tested in isolation (TC: auth gate, missing DB, missing plainText, happy path including cold-DB upsert assertion, 409 conflict). Route test updated to mock single `staffBroadcastSend` call. `inbox-actions.route.test.ts:499-535` mocks `sendPrimeInboxThread` at the boundary and does NOT exercise the internal routing branch — so removal of the branch needs a new proxy-level test added in TASK-05 verifying the branch is gone (or via `sendPrimeInboxThread` unit test in TASK-02). | TASK-04, TASK-05 | TC-06B in `review-threads.test.ts` unaffected; routing branch removal tested in TASK-05 |
| Data / contracts | No schema changes. `actorSource` value changes in new admission records (forward only). `initiatePrimeOutboundThread` exported signature unchanged (deprecated, not removed). | TASK-01, TASK-02, TASK-06 | No D1 column additions |
| Performance / reliability | One fewer HTTP hop (3 → 2). C-03 residual (Firebase → D1 non-transactional) unchanged and accepted as out-of-scope. | TASK-01 | Multi-hop retry window eliminated structurally |
| Rollout / rollback | Rollback = revert `prime-compose/route.ts` + remove `staff-broadcast-send.ts` + restore `staffBroadcastSend` removal from prime-review.server.ts. No migration to roll back. | TASK-01, TASK-02, TASK-03 | Staff-only internal path; no feature flag needed |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | New Prime endpoint; unblocks all other tasks |
| 2 | TASK-02 | TASK-01 | Add Reception helper — depends on knowing the endpoint signature |
| 3 | TASK-03, TASK-04 | TASK-02 (TASK-03), TASK-01 (TASK-04) | Route update and Prime tests can proceed in parallel once TASK-01/02 done |
| 4 | TASK-05, TASK-06 | TASK-02, TASK-03 | Test update and deprecation; TASK-05 needs TASK-03 route final; TASK-06 is last-step cleanup |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff broadcast compose | Staff submits broadcast in Reception inbox UI (POST `/api/mcp/inbox/prime-compose`) | (1) `requireStaffAuth` gate. (2) Validate text. (3) Call `staffBroadcastSend({ text, actorUid })` → single HTTP POST to Prime `/api/staff-broadcast-send`. (4) Prime: staff-owner gate → `upsertPrimeMessageThread(db, { id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, ... })` (cold-DB guard, idempotent ON CONFLICT DO UPDATE) → `savePrimeReviewDraft` (resets singleton thread to `pending`) → `sendPrimeReviewThread` (Firebase write, 7 D1 writes, thread set `sent`). (5) Reception: map `{ outcome: 'sent', sentMessageId }` → 200 success, or map 409 → 502 conflict. (6) Fire-and-forget `recordInboxEvent('prime_broadcast_initiated')`. | TASK-01 (Prime endpoint), TASK-02 (helper), TASK-03 (route) | C-03 residual: Firebase failure = broadcast lost silently. Rollback = revert TASK-03 + remove TASK-01 file. |
| Staff broadcast send via thread-send route | Staff clicks Send for an existing Prime thread via `[threadId]/send/route.ts` | (1) `sendPrimeInboxThread` called with prefixed threadId. (2) Routing branch for `prime_broadcast + campaign.id` removed — all threads fall through to `review-thread-send` endpoint. (3) For non-broadcast threads: unchanged. For broadcast_whole_hostel via this route: goes to `review-thread-send` (same as non-broadcast non-campaign threads). | TASK-02 (routing branch removal) | `inbox-actions.route.test.ts` broadcast coverage (lines 499–535) must pass against the updated `sendPrimeInboxThread`. |

## Tasks

### TASK-01: Create `staff-broadcast-send` Prime endpoint

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/functions/api/staff-broadcast-send.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed `207d90e9a0`. Typecheck and lint passed on `@apps/prime`. File exports `onRequestPost: PagesFunction<Env>`, calls `upsertPrimeMessageThread` → `savePrimeReviewDraft` → `sendPrimeReviewThread` in order, `actorSource: 'reception_staff_compose'`, Firebase delivery model documented inline.
- **Affects:** `apps/prime/functions/api/staff-broadcast-send.ts` (new), `[readonly] apps/prime/functions/lib/prime-review-drafts.ts`, `[readonly] apps/prime/functions/lib/prime-review-send.ts`, `[readonly] apps/prime/functions/lib/staff-owner-gate.ts`, `[readonly] apps/prime/functions/lib/prime-messaging-db.ts`, `[readonly] apps/prime/src/lib/chat/directMessageChannel.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 85%
  - Implementation: 90% — Structure is identical to `staff-initiate-thread.ts` (same gate, same DB check, same error shape). Adds `sendPrimeReviewThread` call after `savePrimeReviewDraft`. Both lib functions are stable and well-typed.
  - Approach: 90% — Pattern verified against `review-thread-send.ts` and `staff-initiate-thread.ts`. No ambiguity in the call sequence.
  - Impact: 85% — The endpoint is the foundation for all other tasks; if the response contract is wrong it cascades. Held-back test: could `savePrimeReviewDraft` return `conflict` for a scenario not covered by the acceptance tests? For `whole_hostel` with `isReusableWholeHostelLane`, the `conflict` branch is bypassed — `not_found` is the only possible non-`updated` outcome after a successful thread upsert. This is documented in `staff-initiate-thread.ts` comment at line 60. Risk is low.
- **Acceptance:**
  - [ ] File `apps/prime/functions/api/staff-broadcast-send.ts` exists and exports `onRequestPost: PagesFunction<Env>`.
  - [ ] Handler calls `enforceStaffOwnerApiGate` first; returns gate response if non-null.
  - [ ] Handler checks `hasPrimeMessagingDb(env)`; returns 503 if false.
  - [ ] Handler parses and validates `plainText` from JSON body; returns 400 if empty.
  - [ ] Handler reads `actorUid` from `x-prime-actor-uid` header (fallback `'prime-owner'`).
  - [ ] Handler calls `upsertPrimeMessageThread(db, { id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })` before `savePrimeReviewDraft` — ensures thread exists on cold DB. Pattern from `staff-initiate-thread.ts:46-52`.
  - [ ] Handler calls `savePrimeReviewDraft(db, { threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, actorUid, content: plainText })`.
  - [ ] Draft save `not_found` → 500 error response (not 404 — matches `staff-initiate-thread.ts:60-63` pattern: post-upsert `not_found` is an internal invariant violation, not a client error).
  - [ ] Draft save `conflict` → 409 error response with `result.message`.
  - [ ] Handler calls `sendPrimeReviewThread(db, env, { threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, actorUid, actorSource: 'reception_staff_compose' })`.
  - [ ] Send `not_found` → 404 error response.
  - [ ] Send `conflict` → 409 error response with `result.message`.
  - [ ] Send `sent` → 200 `jsonResponse({ success: true, data: { outcome: 'sent', sentMessageId: result.sentMessageId } })`.
  - [ ] Top-level catch returns 500 with `console.error` logging.
  - [ ] Inline JSDoc comment documents Firebase RTDB delivery model: subscription-based, no push notifications, guests see message on next app open.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI
  - UX / states: Required — success (200), draft-save not_found → 500 (invariant), draft-save conflict (409 — defensive, cannot fire for whole_hostel lane), send conflict (409), send not_found (404), missing DB (503), invalid body (400), auth gate (403), unexpected error (500)
  - Security / privacy: Required — `enforceStaffOwnerApiGate` called first; `actorSource: 'reception_staff_compose'` set (not hardcoded `'reception_proxy'`)
  - Logging / observability / audit: Required — `console.error` in catch; `actorSource` in admission record via `sendPrimeReviewThread`
  - Testing / validation: Required — covered by TASK-04
  - Data / contracts: Required — response shape: `{ success: true, data: { outcome: 'sent', sentMessageId: string | null } }` on success; `{ success: false, error: string }` on error
  - Performance / reliability: Required — no rate limit gate; `AbortSignal.timeout` not needed (intra-CF call); single-function eliminates inter-hop retry window
  - Rollout / rollback: Required — new file, no migration; rollback = remove file and revert TASK-03
- **Validation contract (TC):**
  - TC-01: Valid request → `upsertPrimeMessageThread` called first, then `savePrimeReviewDraft` returns `{ outcome: 'updated', detail }`, then `sendPrimeReviewThread` returns `{ outcome: 'sent', ..., sentMessageId: 'msg_123' }` → 200 `{ success: true, data: { outcome: 'sent', sentMessageId: 'msg_123' } }`
  - TC-01b: Verify `upsertPrimeMessageThread` is called with `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` and `audience: 'whole_hostel'` (cold-DB guard assertion)
  - TC-02: Missing DB (`hasPrimeMessagingDb` returns false) → 503
  - TC-03: `plainText` empty or missing → 400
  - TC-04: Auth gate fires (production, no token) → 403
  - TC-05: `savePrimeReviewDraft` returns `{ outcome: 'not_found' }` → 500 (internal invariant failure — not a client 404)
  - TC-06: `sendPrimeReviewThread` returns `{ outcome: 'conflict', message: 'already sent' }` → 409
  - TC-07: `sendPrimeReviewThread` throws → 500 with console.error
- **Execution plan:** Red → Green → Refactor. Create file with full handler. Tests in TASK-04 provide the green validation.
- **Planning validation (required for M/L):**
  - Checks run: Read `staff-initiate-thread.ts` (model), `review-thread-send.ts` (model), `prime-review-drafts.ts:59-160` (savePrimeReviewDraft return types), `prime-review-send.ts:42-51` (SendPrimeReviewThreadResult type), `staff-owner-gate.ts` (gate signature: `(request, env) → Response | null`), `prime-messaging-db.ts` (`hasPrimeMessagingDb`, `getPrimeMessagingDb` pattern).
  - Validation artifacts: All imports confirmed present. `Env` interface pattern: `extends FirebaseEnv` + `StaffOwnerGateEnv` fields + `PRIME_MESSAGING_DB`. `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` imported from `../../src/lib/chat/directMessageChannel`. `jsonResponse` / `errorResponse` from `../lib/firebase-rest`.
  - Unexpected findings: None. `savePrimeReviewDraft` does not return `conflict` for the whole_hostel lane (isReusableWholeHostelLane bypass), but the handler should still map the `conflict` branch defensively for correctness.
- **Scouts:** The new endpoint does not call `upsertPrimeMessageThread` directly (unlike `staff-initiate-thread.ts` which upserts the thread first). `savePrimeReviewDraft` calls `getPrimeMessageThreadRecord` which reads the thread; if the thread doesn't exist yet, it returns `not_found`. In production, `staff-initiate-thread.ts` was responsible for the thread upsert. Since we're replacing the two-call chain, the new endpoint must either call `upsertPrimeMessageThread` first (as `staff-initiate-thread.ts` does) OR accept that the thread pre-exists. **Key finding**: For the `broadcast_whole_hostel` thread, the upsert in `staff-initiate-thread.ts` is idempotent and safe to call on every request (ON CONFLICT DO UPDATE). The new `staff-broadcast-send` endpoint MUST include the `upsertPrimeMessageThread` call before `savePrimeReviewDraft`, otherwise first-use after deployment (cold start with empty DB) returns 404.
- **Edge Cases & Hardening:**
  - First-use after cold DB: thread upsert must precede draft save (see Scouts finding above).
  - `actorUid` fallback: use `'prime-owner'` (same as `staff-initiate-thread.ts`).
  - JSON parse failure: return 400.
  - `plainText` after trim is empty string: return 400.
- **What would make this >=90%:**
  - CI green on the Prime test suite (TASK-04) confirming the upsert → draft → send sequence end-to-end. Tests are the coverage gate; CI is the execution environment.
- **Rollout / rollback:**
  - Rollout: File is deployed as part of the same PR as TASK-03. No activation flag needed — it becomes active only when Reception calls it.
  - Rollback: Remove `staff-broadcast-send.ts`, revert `prime-compose/route.ts` (TASK-03) and `prime-review.server.ts` (TASK-02) changes. No data cleanup needed.
- **Documentation impact:**
  - JSDoc inline comment on the new file documents Firebase RTDB delivery model.
- **Notes / references:**
  - `staff-initiate-thread.ts:46-52`: upsert pattern to replicate.
  - `review-thread-send.ts`: overall handler pattern to follow.
  - `prime-review-drafts.ts:59-160`: `savePrimeReviewDraft` return shape.
  - `prime-review-send.ts:42-51`: `SendPrimeReviewThreadResult` type.

---

### TASK-02: Add `staffBroadcastSend` helper to Reception Prime proxy lib

- **Type:** IMPLEMENT
- **Deliverable:** New exported function `staffBroadcastSend` in `apps/reception/src/lib/inbox/prime-review.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `staffBroadcastSend` exported from `prime-review.server.ts`. Routing branch (`detail?.campaign?.id && detail.thread.channel === "prime_broadcast"`) removed from `sendPrimeInboxThread`; the `getPrimeInboxThreadDetail` call that fed the branch was also removed as dead code (lint confirmed `detail` unused). Typecheck and lint passed on `@apps/reception`.
- **Affects:** `apps/reception/src/lib/inbox/prime-review.server.ts`; `[readonly] prime-review.server.ts` (routing branch in `sendPrimeInboxThread` to be removed)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — Pattern is identical to `initiatePrimeOutboundThread`. `primeRequest` and `buildPrimeActorHeaders` and `readPrimeReviewConfig` are all available in the same file.
  - Approach: 95% — No ambiguity. Single `primeRequest` POST to `/api/staff-broadcast-send`.
  - Impact: 90% — Also removes the routing branch in `sendPrimeInboxThread` (line 545). This branch removal changes the `[threadId]/send` path for broadcast threads: they now fall through to `review-thread-send` instead of `review-campaign-send`. The `inbox-actions.route.test.ts` broadcast test (lines 499–535) mocks `sendPrimeInboxThread` directly and does not test the internal routing branch — it will not be broken by removing the branch.
- **Acceptance:**
  - [ ] `staffBroadcastSend(input: { text: string; actorUid?: string }): Promise<{ sentMessageId: string | null } | null>` exported from `prime-review.server.ts`.
  - [ ] Returns `null` when `readPrimeReviewConfig()` returns null (same pattern as `initiatePrimeOutboundThread`).
  - [ ] Calls `primeRequest<{ outcome: string; sentMessageId: string | null }>('/api/staff-broadcast-send', ...)` with `method: 'POST'`, JSON body `{ plainText: input.text }`, actor headers, `AbortSignal.timeout(10_000)`. Note: `primeRequest<T>` already unwraps the `{ success, data }` envelope and returns `payload.data` typed as `T` — so the type parameter is the inner data type, not the envelope.
  - [ ] Returns `{ sentMessageId: payload.sentMessageId }` (direct field access — no `.data` nesting).
  - [ ] Propagates throws from `primeRequest` (caller converts to 502).
  - [ ] Routing branch in `sendPrimeInboxThread` (lines 545–561: `if (detail?.campaign?.id && detail.thread.channel === "prime_broadcast")`) is removed.
  - [x] The `getPrimeInboxThreadDetail` call that preceded the routing branch was also removed — it was only used to populate `detail` for the campaign-send branch. After branch removal `detail` was unused; the non-broadcast path uses `threadId` directly in the `review-thread-send` query param. Removing the call keeps the function lint-clean (no unused-var error).
  - [ ] All other non-broadcast logic in `sendPrimeInboxThread` is unchanged — fallthrough to `review-thread-send` remains.
  - [ ] JSDoc on `staffBroadcastSend` describes the function and cites the single-hop design.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — null return maps to 503 in caller; throw maps to 502 in caller; success returns `{ sentMessageId }`
  - Security / privacy: N/A — auth is handled at the Prime endpoint; `buildPrimeActorHeaders` passes `x-prime-actor-uid`
  - Logging / observability / audit: N/A — logging done at the Prime endpoint
  - Testing / validation: Required — covered by TASK-05 (reception route test) and indirectly by TASK-04 (Prime endpoint test)
  - Data / contracts: Required — `primeRequest<T>` returns the inner data typed as `T`; Prime sends `{ success: true, data: { outcome: 'sent', sentMessageId } }` over the wire; `primeRequest<{ outcome: string; sentMessageId: string | null }>` returns `{ outcome, sentMessageId }` directly. `staffBroadcastSend` returns `{ sentMessageId }` from this.
  - Performance / reliability: Required — 10-second `AbortSignal.timeout` (matches `initiatePrimeOutboundThread` pattern)
  - Rollout / rollback: Required — routing branch removal is live immediately; rollback = restore the removed branch
- **Validation contract (TC):**
  - TC-01: `readPrimeReviewConfig` returns null → returns null without calling fetch
  - TC-02: `primeRequest` resolves with `{ outcome: 'sent', sentMessageId: 'msg_123' }` (already-unwrapped inner data) → `staffBroadcastSend` returns `{ sentMessageId: 'msg_123' }`
  - TC-03: `primeRequest` throws → propagates throw
- **Execution plan:** Red → Green → Refactor. Add `staffBroadcastSend` export. Remove routing branch from `sendPrimeInboxThread`. Verify remaining function shape unchanged.
- **Planning validation:**
  - Checks run: Read `prime-review.server.ts` lines 529–610 (full `sendPrimeInboxThread` + `initiatePrimeOutboundThread`). Routing branch at 545–561. `primeRequest` signature at line 229. `readPrimeReviewConfig` at line 185.
  - Validation artifacts: Confirmed `primeRequest` is generic `<T>` returning `Promise<T>`, unwrapping `payload.data` for envelope format. The Prime endpoint wraps response as `jsonResponse({ success: true, data: {...} })` — so `primeRequest` returns `{ outcome, sentMessageId }` directly (after unwrapping the `data` field per the `primeRequest` implementation).
  - Unexpected findings: Need to verify how `primeRequest` unwraps the envelope. Let execution confirm; the test in TASK-05 will catch any shape mismatch.
- **Scouts:** None beyond planning validation above.
- **Edge Cases & Hardening:**
  - After branch removal, `sendPrimeInboxThread` will route broadcast threads through `review-thread-send`. This is the correct destination for all thread-level sends regardless of channel type.
- **What would make this >=90%:**
  - Verifying that `primeRequest` unwraps `payload.data` correctly for the staff-broadcast-send response shape. TASK-05 tests will confirm.
- **Rollout / rollback:**
  - Rollout: Same PR as TASK-03.
  - Rollback: Restore routing branch; remove `staffBroadcastSend`.
- **Documentation impact:** JSDoc on `staffBroadcastSend`.
- **Notes / references:** `initiatePrimeOutboundThread:590-610` as the implementation model.

---

### TASK-03: Update `prime-compose/route.ts` to use `staffBroadcastSend`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `prime-compose/route.ts` imports `staffBroadcastSend` and `buildPrimeInboxThreadId` only. Single try/catch around `staffBroadcastSend`. Null → 503, throw → 502, success → fire-and-forget `recordInboxEvent` with `buildPrimeInboxThreadId('broadcast_whole_hostel')`. Typecheck and lint clean on `@apps/reception`.
- **Affects:** `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — The route currently has two sequential calls; replacing them with one is a direct substitution.
  - Approach: 95% — No routing decisions at this layer; pure call-site simplification.
  - Impact: 85% — The `initiatePrimeOutboundThread` null-check (which triggers 503 "Prime messaging not configured") must be reproduced via the `staffBroadcastSend` null-return check.
- **Acceptance:**
  - [ ] Route no longer imports `initiatePrimeOutboundThread` or `sendPrimeInboxThread` from `prime-review.server.ts`.
  - [ ] Route imports `staffBroadcastSend` (and still imports `buildPrimeInboxThreadId` for the telemetry event's `threadId`).
  - [ ] Handler calls `staffBroadcastSend({ text, actorUid: auth.uid })` in a try/catch.
  - [ ] `staffBroadcastSend` returns null → 503 "Prime messaging not configured".
  - [ ] `staffBroadcastSend` throws → 502 "Failed to send broadcast".
  - [ ] Success → fire-and-forget `recordInboxEvent` with `threadId: buildPrimeInboxThreadId('broadcast_whole_hostel')`. The `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` constant lives in the Prime app and is not importable in Reception; use the literal string `'broadcast_whole_hostel'` (same value, stable by definition).
  - [ ] Returns `NextResponse.json({ success: true })` on success path.
  - [ ] Existing 400 (empty text) and 401 (auth) paths unchanged.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — 200 success, 400 empty text, 401 auth, 503 Prime not configured, 502 send failure
  - Security / privacy: Required — `requireStaffAuth` gate unchanged; actor uid propagation unchanged
  - Logging / observability / audit: Required — `recordInboxEvent('prime_broadcast_initiated')` retained
  - Testing / validation: Required — TASK-05 updates route tests
  - Data / contracts: Required — import list changes; telemetry `threadId` uses `buildPrimeInboxThreadId('broadcast_whole_hostel')` (literal string — constant is in Prime app, not importable in Reception)
  - Performance / reliability: Required — one HTTP call instead of two
  - Rollout / rollback: Required — rollback = restore prior two-call pattern
- **Validation contract (TC):**
  - TC-01: `staffBroadcastSend` resolves `{ sentMessageId: 'msg_123' }` → 200 `{ success: true }`
  - TC-02: `staffBroadcastSend` returns null → 503
  - TC-03: `staffBroadcastSend` throws → 502
  - TC-04: `recordInboxEvent` called with correct `threadId` and `actorUid`
- **Execution plan:** Red → Green → Refactor. Replace import list and handler body.
- **Planning validation:**
  - Checks run: Read route at `prime-compose/route.ts:1-88`. `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` is available via import from `@acme/prime` or via `buildPrimeInboxThreadId` helper. Current route uses `initiateResult.detail.thread.id` to build the prefixed thread id — with single-hop, use `buildPrimeInboxThreadId('broadcast_whole_hostel')` or the constant directly.
  - Validation artifacts: `buildPrimeInboxThreadId` is exported from `prime-review.server.ts`. `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` lives in `apps/prime/src/lib/chat/directMessageChannel.ts` and is NOT importable in Reception. Definitive approach: use the literal string `'broadcast_whole_hostel'` in `buildPrimeInboxThreadId('broadcast_whole_hostel')`. The constant equals this value by definition (`buildBroadcastChannelId('whole_hostel')` = `'broadcast_whole_hostel'`). No new import needed.
  - Unexpected findings: None — the ambiguity between constant and literal is resolved; literal wins.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - `staffBroadcastSend` returns `null`: 503 path. Do not attempt to record telemetry event on 503.
- **What would make this >=90%:**
  - Verifying that `buildPrimeInboxThreadId('broadcast_whole_hostel')` produces the correct prefixed string `'prime:broadcast_whole_hostel'`. This is confirmed by `parsePrimeInboxThreadId` at line 351 which strips the `'prime:'` prefix; the prefix is `'prime:'`.
- **Rollout / rollback:**
  - Rollout: Same PR as TASK-01 and TASK-02.
  - Rollback: Restore prior two-call pattern in route.
- **Documentation impact:** None beyond inline code comments.
- **Notes / references:** `prime-compose/route.ts:1-88` — full file.

---

### TASK-04: Write unit tests for `staff-broadcast-send.ts`

- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/prime/functions/__tests__/staff-broadcast-send.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14) — commit `8d424c0744`
- **Affects:** `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` (new), `[readonly] apps/prime/functions/__tests__/helpers.ts`, `[readonly] apps/prime/functions/__tests__/review-threads.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Test pattern is well established in `review-threads.test.ts` and `staff-initiate-thread.test.ts`. `createMockD1Database`, `createMockEnv`, `createPagesContext` helpers exist.
  - Approach: 90% — No ambiguity in test structure. Mock `savePrimeReviewDraft` and `sendPrimeReviewThread` as jest mocks.
  - Impact: 80% — Tests must verify the TC list from TASK-01. Held-back test: could the upsert step added in TASK-01 (Scouts finding) require an additional mock not yet accounted for? Yes — `upsertPrimeMessageThread` must be mocked in the D1 mock, or the test will fail on DB method not found. This is the key test setup detail; it is addressed by using `createMockD1Database` which stubs all D1 methods. Risk: low.
- **Acceptance:**
  - [x] File `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` exists.
  - [x] TC-01: Valid request → `upsertPrimeMessageThread` called before `savePrimeReviewDraft` → draft save + send → 200 `{ success: true, data: { outcome: 'sent', sentMessageId: ... } }`.
  - [x] TC-01b: TC-01 spy on `upsertPrimeMessageThread` (via `jest.mock('../../lib/prime-messaging-repositories', ...)`) asserts it was called with `id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` and `audience: 'whole_hostel'` — this is the explicit cold-DB guard assertion. Without this, the endpoint could silently omit the upsert and return 404 on first use.
  - [x] TC-02: Missing DB → 503.
  - [x] TC-03: Missing `plainText` or empty after trim → 400.
  - [x] TC-04: Auth gate fires (production + no token) → 403.
  - [x] TC-05: `savePrimeReviewDraft` returns `not_found` → 500 (invariant failure after upsert — not a 404).
  - [x] TC-06: `sendPrimeReviewThread` returns `conflict` → 409.
  - [x] TC-07: `sendPrimeReviewThread` throws → 500 (and `console.error` called).
  - [x] TC-08: `actorSource` passed to `sendPrimeReviewThread` is `'reception_staff_compose'`.
  - [x] Tests use `jest.mock` on `'../lib/prime-review-drafts'`, `'../lib/prime-review-send'`, and `'../lib/prime-messaging-repositories'` (relative paths from `apps/prime/functions/__tests__/`).
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — all TC outcomes
  - Security / privacy: Required — TC-04 (auth gate)
  - Logging / observability / audit: Required — TC-07 verifies `console.error`
  - Testing / validation: Required — the tests themselves
  - Data / contracts: Required — TC-01 verifies response shape; TC-08 verifies `actorSource`
  - Performance / reliability: N/A for unit tests
  - Rollout / rollback: N/A
- **Validation contract (TC):** See Acceptance above.
- **Execution plan:** Red → Green. Write all TCs with mocks. Verify file does not fail lint or typecheck.
- **Planning validation:**
  - Checks run: Read `staff-initiate-thread.test.ts` (test pattern), `review-threads.test.ts` header (imports from `helpers.ts`), `helpers.ts` (createMockD1Database, createMockEnv, createPagesContext).
  - Validation artifacts: `createPagesContext` in `helpers.ts` creates a `PagesContext` with request + env. Mock pattern (correct relative path from `apps/prime/functions/__tests__/`): `jest.mock('../lib/prime-review-drafts', () => ({ savePrimeReviewDraft: jest.fn() }))`. Confirmed by `prime-messaging-repositories.test.ts:35` which imports from `'../lib/prime-messaging-repositories'`.
  - Unexpected findings: `upsertPrimeMessageThread` is called at the lib level (`../lib/prime-messaging-repositories`), not as a raw D1 call. TC-01b requires a `jest.mock('../lib/prime-messaging-repositories', ...)` spy to assert the upsert was called with the correct arguments. `createMockD1Database` stubs the underlying D1 prepare/run methods but does not provide the named-function spy needed for TC-01b. The mock for `prime-messaging-repositories` is therefore required and is already listed in the Acceptance item for TC-01b.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Test must not set `NODE_ENV=production` or `PRIME_ENABLE_STAFF_OWNER_ROUTES=true` to avoid triggering the auth gate on non-auth TCs.
- **What would make this >=90%:**
  - Running the Prime Jest suite against the new file in CI. The test structure is straightforward; confidence is limited only by not having run it yet.
- **Rollout / rollback:** N/A — test file, no production impact.
- **Documentation impact:** None.
- **Notes / references:** `staff-initiate-thread.test.ts`, `review-threads.test.ts`, `helpers.ts`.

---

### TASK-05: Update Reception tests for new broadcast path

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` + new routing-branch removal test in `apps/reception/src/lib/inbox/__tests__/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14) — commit `8d424c0744`
- **Affects:** `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts`, `apps/reception/src/lib/inbox/__tests__/send-prime-inbox-thread.test.ts` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Direct mechanical update. Replace `initiatePrimeOutboundThread` + `sendPrimeInboxThread` mocks with `staffBroadcastSend` mock. Test assertions simplified.
  - Approach: 90% — Test structure is preserved; only mock targets change.
  - Impact: 80% — Must verify that `initiate-prime-outbound-thread.test.ts` (154 lines) does not break from the `initiatePrimeOutboundThread` function still existing (it is deprecated, not removed, in TASK-06). Held-back test: could the `initiate-prime-outbound-thread.test.ts` tests fail if `initiatePrimeOutboundThread` is removed in TASK-06 before TASK-05 runs? TASK-06 is sequenced after TASK-03 and TASK-05 are done. No ordering issue.
- **Build evidence:**
  - `route.test.ts` rewritten to mock single `staffBroadcastSend` call (TC-01 through TC-06).
  - `send-prime-inbox-thread.test.ts` created with TC-01/02/03 verifying `review-campaign-send` is never called.
  - Pre-commit hooks: lint clean (warnings only in unrelated files), typecheck passes.
- **Acceptance:**
  - [x] `initiatePrimeOutboundThread` and `sendPrimeInboxThread` mocks removed from the mock setup.
  - [x] `staffBroadcastSend` added to mock: `jest.mock('@/lib/inbox/prime-review.server', () => ({ ..., staffBroadcastSend: jest.fn() }))`.
  - [x] TC-01 (`staffBroadcastSend` succeeds → 200 `{ success: true }`) passes.
  - [x] TC-02 (auth fails → 401) passes — unchanged.
  - [x] TC-03 (empty text → 400) passes — unchanged.
  - [x] TC-04 (`staffBroadcastSend` returns null → 503) passes.
  - [x] TC-05 (`staffBroadcastSend` throws → 502) passes.
  - [x] TC-06 (`prime_broadcast_initiated` event recorded on success) passes.
  - [x] No unused mock variables in file (lint clean).
  - [x] A separate test in `apps/reception/src/lib/inbox/__tests__/send-prime-inbox-thread.test.ts` verifies that `sendPrimeInboxThread` never calls `review-campaign-send` for any thread type.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — all TC outcomes
  - Security / privacy: N/A — auth gate tested via TC-02 which is unchanged
  - Logging / observability / audit: Required — TC-06 (telemetry event)
  - Testing / validation: Required — the tests themselves
  - Data / contracts: Required — import mock list correct
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC):** See Acceptance above.
- **Execution plan:** Red → Green. Replace mock targets; update test bodies accordingly. Verify lint clean.
- **Planning validation:**
  - Checks run: Read full `route.test.ts` (1–239 lines). All existing TCs map 1:1 to new single-call structure.
  - Validation artifacts: TC-04 replaces the `initiatePrimeOutboundThread returns null → 503` test with `staffBroadcastSend returns null → 503`. TC-05 replaces the two throw scenarios with one `staffBroadcastSend throws → 502`.
  - Unexpected findings: TC-05 currently has two it() tests (initiate throws; send throws). After the change there is only one throw scenario. The two tests collapse into one.
- **Scouts:** None.
- **Edge Cases & Hardening:** None beyond planning validation.
- **What would make this >=90%:** Running the test suite against the changes. Confidence is limited by not having executed yet.
- **Rollout / rollback:** N/A.
- **Documentation impact:** None.
- **Notes / references:** `route.test.ts:1-239`.

---

### TASK-06: Deprecate `staff-initiate-thread.ts` and `initiatePrimeOutboundThread`

- **Type:** IMPLEMENT
- **Deliverable:** Deprecation notice on `apps/prime/functions/api/staff-initiate-thread.ts` and `initiatePrimeOutboundThread` in `prime-review.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14) — commit `cadcf87681`
- **Affects:** `apps/prime/functions/api/staff-initiate-thread.ts`, `apps/reception/src/lib/inbox/prime-review.server.ts`, `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Simple JSDoc/comment addition. No code change to `staff-initiate-thread.ts` logic itself.
  - Approach: 90% — Deprecation-only; no removal yet. The `initiate-prime-outbound-thread.test.ts` continues to test the function's current behaviour without modification. Removal can be a follow-up when confirmed no other callers exist.
  - Impact: 80% — Must confirm no other callers of `initiatePrimeOutboundThread` in the codebase besides `prime-compose/route.ts` (which is removed in TASK-03). Grep confirmed one caller in `prime-compose/route.ts`. Held-back test: could a CI build fail if `initiatePrimeOutboundThread` is exported but unused after TASK-03? TypeScript `no-unused-vars` does not flag exports; ESLint `no-unused-modules` is not configured for this project (no evidence). Risk: low.
- **Build evidence:**
  - `@deprecated` JSDoc added to `onRequestPost` in `staff-initiate-thread.ts` and to `initiatePrimeOutboundThread` in `prime-review.server.ts`.
  - File-level deprecation comment added to `initiate-prime-outbound-thread.test.ts`.
  - Pre-commit hooks: typecheck passes on both `@apps/prime` and `@apps/reception`.
- **Acceptance:**
  - [x] `apps/prime/functions/api/staff-initiate-thread.ts` has a `@deprecated` JSDoc comment directing to `staff-broadcast-send.ts`.
  - [x] `initiatePrimeOutboundThread` in `prime-review.server.ts` has a `@deprecated` JSDoc directing to `staffBroadcastSend`.
  - [x] `initiate-prime-outbound-thread.test.ts` file-level comment updated to note the function is deprecated.
  - [x] No code logic changes in any of the above files (deprecation is comment-only).
  - [x] Typecheck and lint pass.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — no behaviour change
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — no test changes except comment update
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC):**
  - TC-01: Typecheck passes with deprecated exports present.
  - TC-02: `grep -rn "initiatePrimeOutboundThread"` in `apps/reception/src/` excluding test files returns only the definition in `prime-review.server.ts` (no call sites).
- **Execution plan:** Add `@deprecated` JSDoc comments. Verify typecheck.
- **Planning validation:**
  - Checks run: `grep -rn "initiatePrimeOutboundThread" apps/reception/src/ | grep -v ".test.ts" | grep -v "__tests__"` → only `prime-compose/route.ts` (2 callers, both removed by TASK-03) and `prime-review.server.ts` (definition). After TASK-03, only definition remains.
  - Validation artifacts: Confirmed. One unique caller in production code.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:** None.
- **What would make this >=90%:** Confirmed by CI typecheck pass.
- **Rollout / rollback:** N/A — comment only.
- **Documentation impact:** `@deprecated` JSDoc is the documentation.
- **Notes / references:** `prime-review.server.ts:590-610`.

---

## Risks & Mitigations

- **C-03 residual:** Firebase write failure before D1 writes = broadcast silently lost, no replay job. Mitigation: `console.error` in TASK-01 catch block provides observability; full saga pattern is deferred. Accepted.
- **Concurrent duplicate requests:** Two near-simultaneous compose calls can both proceed to send within the single-hop window. Mitigation: accepted as out-of-scope; risk is very low in practice (requires two operator submits within milliseconds).
- **`inbox-actions.route.test.ts` broadcast test breakage:** Lines 499–535 test `sendPrimeInboxThread` for broadcast thread via `[threadId]/send/route.ts`. The routing branch removal in TASK-02 changes `sendPrimeInboxThread` behavior for broadcast threads — they now fall through to `review-thread-send` instead of `review-campaign-send`. The test mocks `sendPrimeInboxThread` at the function level, not the internal routing — so the test is not broken by TASK-02. Confirmed.
- **`upsertPrimeMessageThread` in new endpoint:** The Scouts finding in TASK-01 identified that `staff-broadcast-send.ts` must include the initial thread upsert (like `staff-initiate-thread.ts` does). This is specified in TASK-01 acceptance and execution plan.

## Observability

- Logging: `console.error` in `staff-broadcast-send.ts` top-level catch for unexpected errors; existing `console.error` patterns in the send lib unchanged.
- Metrics: None new; existing admission records via `sendPrimeReviewThread` will have `actorSource: 'reception_staff_compose'` (improved signal).
- Alerts/Dashboards: None required; this is an internal staff path.

## Acceptance Criteria (overall)

- [ ] `POST /api/staff-broadcast-send` on Prime processes a staff broadcast end-to-end (staff auth → draft upsert → send → Firebase write → D1 writes → 200 `{ success: true }`).
- [ ] `prime-compose/route.ts` makes a single HTTP call to `/api/staff-broadcast-send` (not two calls).
- [ ] Admission records for broadcasts have `actorSource: 'reception_staff_compose'` (not `'reception_proxy'`).
- [ ] `review-campaign-send` routing branch removed from `sendPrimeInboxThread`.
- [ ] All new tests pass (TASK-04, TASK-05).
- [ ] Existing broadcast coverage in `inbox-actions.route.test.ts:499-535` passes unmodified.
- [ ] Typecheck and lint pass across both `apps/prime` and `apps/reception`.
- [ ] `staff-initiate-thread.ts` and `initiatePrimeOutboundThread` marked `@deprecated`.

## Decision Log

- 2026-03-14: Option A (new single-hop endpoint) chosen in analysis. Options B (idempotency key + schema) and C (skip initiate) rejected. See `analysis.md`.
- 2026-03-14: `already_sent` pre-check design rejected in analysis critique rounds 1–2. C-02 protection comes from collapsing multi-hop to single-hop, not from a status pre-check. Concurrent-duplicate risk accepted as out-of-scope.
- 2026-03-14 [Adjacent: delivery-rehearsal]: Consider adding a `review_projection_failed` structured log field in `projectPrimeThreadMessageToFirebase` when Firebase write throws, to improve C-03 observability. Out of scope for this plan — route to post-build reflection.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `staff-broadcast-send` Prime endpoint | Yes — `savePrimeReviewDraft`, `sendPrimeReviewThread`, `enforceStaffOwnerApiGate`, `getPrimeMessagingDb`, `hasPrimeMessagingDb`, `jsonResponse`, `errorResponse`, `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` all verified present and importable. | [Ordering inversion] [Minor]: `upsertPrimeMessageThread` call must precede `savePrimeReviewDraft` (thread may not exist on cold DB). Addressed in TASK-01 Scouts and Acceptance. | No — resolved in task spec |
| TASK-02: Add `staffBroadcastSend` helper | Yes — `primeRequest`, `readPrimeReviewConfig`, `buildPrimeActorHeaders` confirmed present in same file. `sendPrimeInboxThread` routing branch at lines 545–561 confirmed for removal. | [API signature mismatch] [Minor]: `primeRequest` envelope unwrapping — caller receives `payload.data` not `payload` directly. Plan notes this and delegates confirmation to TASK-05 tests. | No — advisory |
| TASK-03: Update `prime-compose/route.ts` | Yes — `staffBroadcastSend` will be available after TASK-02. `buildPrimeInboxThreadId` remains importable from `prime-review.server.ts`. | [Missing data dependency] [Minor]: `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` not directly importable in Reception from Prime — plan resolves by using `buildPrimeInboxThreadId('broadcast_whole_hostel')` with hardcoded string. | No — resolved in task spec |
| TASK-04: Write unit tests for `staff-broadcast-send.ts` | Yes — TASK-01 must complete first. `helpers.ts` test utilities confirmed present. Jest mock pattern confirmed from `staff-initiate-thread.test.ts`. | None | No |
| TASK-05: Update `prime-compose/route.test.ts` | Yes — TASK-02 and TASK-03 must complete first. Test file structure confirmed from read. | None | No |
| TASK-06: Deprecate `staff-initiate-thread.ts` | Yes — TASK-03 must complete first (caller removed). Single caller confirmed by grep. | None | No |

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × S(1) = 90
- TASK-04: 85% × M(2) = 170
- TASK-05: 85% × S(1) = 85
- TASK-06: 85% × S(1) = 85
- Sum weights: 2+1+1+2+1+1 = 8
- Weighted total: 170+90+90+170+85+85 = 690
- Overall-confidence: 690/800 = **86%** (rounded per 5-multiple rule → **85%**)
