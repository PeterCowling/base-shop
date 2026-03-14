---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-outbound-send-path-correctness
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-outbound-send-path-correctness/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314160000-BRIK-003
Trigger-Why: "Prime outbound send path has silent failures and incorrect routing — staff broadcasts are being routed through the review-campaign-send endpoint which was built for review campaigns, not staff announcements; the 3-hop initiate → send chain has no idempotency protection; and there is no clarity on whether audience delivery actually reaches guest devices."
Trigger-Intended-Outcome: "type: operational | statement: The send path for staff whole-hostel broadcasts is correctly routed through review-thread-send (not review-campaign-send), has idempotency protection against retry-created duplicate threads/messages, and the delivery model to guest devices is documented and verified. | source: operator"
---

# Prime Outbound Send Path Correctness — Fact-Find Brief

## Scope

### Summary

The `reception-prime-outbound-messaging` build introduced a staff broadcast flow: Reception → `POST /api/mcp/inbox/prime-compose` → `initiatePrimeOutboundThread` → Prime's `staff-initiate-thread` → then `sendPrimeInboxThread` which, for broadcast threads with a campaign, routes to `review-campaign-send`. The dispatch identifies 4 concerns: (C-01) wrong endpoint routing for broadcasts, (C-02) no idempotency in the 3-hop chain, (C-03) race condition / orphaned thread on partial failure, and (C-05) silent/unclear audience delivery. M-03 asks whether a purpose-built direct-message endpoint exists that should be used instead.

The Outcome Contract requires: (1) correct routing through `review-thread-send`, (2) idempotency protection against retry-created duplicates, and (3) delivery model documented. All three are in scope for this plan.

### Goals

- Determine whether `review-campaign-send` is the correct or incorrect endpoint for whole-hostel broadcasts.
- Determine idempotency status at each hop of the 3-hop chain.
- Map the partial-failure / orphaned-thread race condition and its retry behaviour.
- Determine what `audience: 'whole_hostel'` and `review-campaign-send` actually deliver to guest devices.
- Identify any purpose-built staff-to-guest direct-message endpoint and whether it applies.

### Non-goals

- Changes to guest-facing messaging UI in the Prime app.
- Review campaign flow for booking/room-scoped campaigns (already a separate path).
- Firebase RTDB schema changes.

### Constraints & Assumptions

- The `broadcast_whole_hostel` thread ID is a singleton — the same thread ID is reused across broadcasts by design (see `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel'`).
- The Prime app is a Cloudflare Pages Function app; Reception is a Next.js App Router app. They communicate via HTTP over the internal `RECEPTION_PRIME_API_BASE_URL`.
- `review-campaign-send` uses a KV-based rate limit (3 requests / 60s per actor).

## Outcome Contract

- **Why:** Staff broadcast path routes to an endpoint designed for review campaigns, creating potential misrouting, duplicate sends on retry, and unclear delivery guarantees.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The send path for staff whole-hostel broadcasts is correctly routed through `review-thread-send` (not `review-campaign-send`), has idempotency protection against retry-created duplicate threads/messages, and the delivery model to guest devices is documented and verified.
- **Source:** operator

## Current Process Map

- **Trigger:** Staff member composes a whole-hostel broadcast in Reception inbox UI → clicks Send.
- **End condition:** Reception returns `{ success: true }` to the client. Guest devices may or may not have received the message (unclear — see C-05 finding).

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Reception → Prime: initiate | Reception `POST /api/mcp/inbox/prime-compose` calls `initiatePrimeOutboundThread({ text, actorUid })` which POSTs to Prime `/api/staff-initiate-thread` with `{ plainText }`. `staff-initiate-thread` upserts `broadcast_whole_hostel` thread (idempotent), creates a draft via `savePrimeReviewDraft`, which calls `ensureWholeHostelCampaignForDraft` → creates/updates a campaign record. Returns `{ detail }`. | Reception Next.js server action → Prime Cloudflare Function | `prime-compose/route.ts:42-51`, `prime-review.server.ts:590-608`, `staff-initiate-thread.ts:47-73` | Thread upsert is idempotent (ON CONFLICT DO UPDATE). Draft creation is NOT idempotent: each call creates a new draft if no active staff draft exists, or updates the existing draft. Campaign: creates a new campaign record if no non-terminal one exists. Idempotent at thread level, partially idempotent at draft/campaign level. |
| Reception → Prime: send | `prime-compose/route.ts` calls `sendPrimeInboxThread(broadcastPrefixedId, auth.uid)`. `sendPrimeInboxThread` fetches thread detail (a second HTTP call to Prime via `getPrimeInboxThreadDetail`). If thread is `prime_broadcast` AND `detail.campaign.id` is present, it routes to `POST /api/review-campaign-send?campaignId=...`. Otherwise falls through to `POST /api/review-thread-send?threadId=...`. | Reception server → Prime Functions | `prime-review.server.ts:529-579` | **C-01 (Critical):** `review-campaign-send` was built for review campaigns (`booking`/`room` audience), not for whole-hostel staff announcements. The routing is triggered by `(channel === 'prime_broadcast' && campaign.id present)`, which will be true for broadcast_whole_hostel. This sends through `sendPrimeReviewCampaign` → `sendPrimeReviewThread` (for whole_hostel audience). The indirection through campaign-send is unnecessary and adds: (1) a KV rate limit gate (3/60s) that does not belong on staff announcements; (2) an extra network hop; (3) `actorSource` is hardcoded as `'reception_proxy'` (note: `actorUid` IS correctly passed via `x-prime-actor-uid` header — only the source label is wrong). |
| Prime send execution: whole_hostel path | `review-campaign-send` reads `x-prime-actor-uid` header and passes it as `actorUid` to `sendPrimeReviewCampaign(db, env, { campaignId, actorUid, actorSource: 'reception_proxy' })`. `actorUid` is correctly threaded; only `actorSource` is hardcoded. Because `campaign.audience !== 'booking' && !== 'room'`, it falls to `sendPrimeReviewThread(db, env, { threadId: campaign.threadId, ... })`. `sendPrimeReviewThread` order: (1) conflict check, (2) `projectPrimeThreadMessageToFirebase` (Firebase write — external), (3) `createPrimeMessage` (D1), (4) `updatePrimeMessageDraft` (D1), (5) `upsertPrimeMessageThread` status=sent (D1), (6) `markWholeHostelCampaignSent` (D1), (7) `recordPrimeMessageAdmission` (D1), (8) `enqueuePrimeProjectionJob` (D1), (9) `recordWholeHostelCampaignDelivery` (D1). All 7 D1 writes are independent sequential calls — no transaction. The projection job is only enqueued at step 8, AFTER Firebase has already succeeded. | Prime D1 (PRIME_MESSAGING_DB) + Firebase RTDB | `prime-review-campaign-actions.ts:61-134`, `prime-review-send.ts:53-242`, `prime-whole-hostel-campaigns.ts` | **C-03 (Major — upgraded from dispatch assessment):** (a) If Firebase projection (step 2) fails, none of the D1 writes occur — no projection job is enqueued, so there is NO replay job to process. The broadcast is silently lost. (b) If any D1 write after step 2 fails, Firebase already has the message but D1 state is partially inconsistent. (c) If steps 1–9 succeed but the network drops before Reception receives the response, a retry finds the thread with `review_status = 'sent'` → 409 conflict → 502 to the client, with no way to re-send from the compose path. This is worse than the dispatch stated — recovery via `review-campaign-replay` requires a delivery record in D1, which is only created at step 9. If failure occurs before step 9, there is no delivery record to replay. |
| Firebase projection | `projectPrimeThreadMessageToFirebase` writes channel meta to `messaging/channels/{threadId}/meta` and message to `messaging/channels/{threadId}/messages/{messageId}`. For broadcast channel, calls `ensureBroadcastChannelMeta` which validates existing meta or creates it. | Firebase RTDB | `prime-thread-projection.ts:174-220` | Channel ID for whole_hostel is `broadcast_whole_hostel`. Guest client app must subscribe to `messaging/channels/broadcast_whole_hostel/messages` to receive. This is a Firebase RTDB path, not a per-device push notification. Delivery depends on guests having an active Prime app connection. **C-05 finding:** there is no push notification fan-out. |
| Idempotency (3-hop chain) | The retry model is more complex than a simple status check because `initiatePrimeOutboundThread` runs BEFORE `sendPrimeInboxThread` on every compose call. `savePrimeReviewDraft` inside `staff-initiate-thread` checks `isReusableWholeHostelLane` and explicitly bypasses the `sent`/`resolved` conflict guards (lines 73-83 of `prime-review-drafts.ts`), resetting `review_status: 'pending'` via `upsertPrimeMessageThread`. A retry therefore RESETS the thread to `pending` before the send check — making a "check thread status before send" guard unreliable. **The compose initiate step actively undoes any idempotency protection that the send step could provide.** To achieve retry idempotency, either: (a) the initiate step must be skipped on retry if a draft already exists for this message content, or (b) the compose endpoint must carry a client-provided idempotency key, or (c) initiate+send must be collapsed into a single atomic operation on the Prime side. | All hops | `prime-review-drafts.ts:73-83` (isReusableWholeHostelLane bypass), `prime-review-send-support.ts:87-99` | **C-02 (Major):** Idempotency cannot be achieved by a simple status check at the send step because the initiate step resets the thread. This is the core finding for analysis. The correct fix approach must target the initiate step's idempotency, or collapse the two steps. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — POST handler. Calls `initiatePrimeOutboundThread` then `sendPrimeInboxThread` sequentially. No idempotency key. Catches errors at each step but cannot distinguish "thread created, send failed" from "thread creation failed".
- `apps/prime/functions/api/staff-initiate-thread.ts` — POST `/api/staff-initiate-thread`. Upserts thread, creates draft, calls `ensureWholeHostelCampaignForDraft`.
- `apps/prime/functions/api/review-campaign-send.ts` — POST `/api/review-campaign-send?campaignId=...`. Rate-limited (3/60s). This is where `sendPrimeInboxThread` currently routes for broadcast threads.
- `apps/prime/functions/api/review-thread-send.ts` — POST `/api/review-thread-send?threadId=...`. The simpler, direct send path that calls `sendPrimeReviewThread` directly. Does NOT go through campaign-send. No rate limit beyond staff-owner gate.

### Key Modules / Files

- `apps/reception/src/lib/inbox/prime-review.server.ts` — `sendPrimeInboxThread` (lines 529–579): the routing branch. `initiatePrimeOutboundThread` (lines 590–608).
- `apps/prime/functions/lib/prime-review-send.ts` — `sendPrimeReviewThread`: the actual send executor for all thread types including whole_hostel.
- `apps/prime/functions/lib/prime-review-campaign-actions.ts` — `sendPrimeReviewCampaign`: dispatches to `sendPrimeExpandedCampaign` (for booking/room) or `sendPrimeReviewThread` (for whole_hostel). The whole_hostel branch is a thin passthrough.
- `apps/prime/functions/lib/prime-whole-hostel-campaigns.ts` — Campaign record lifecycle for the singleton broadcast thread. `isWholeHostelBroadcastThread` guard, `ensureWholeHostelCampaignForDraft`, `markWholeHostelCampaignSent`, `recordWholeHostelCampaignDelivery`.
- `apps/prime/functions/lib/prime-review-send-support.ts` — `buildThreadSendConflictMessage`: the only idempotency guard in the send path (checks `review_status`).
- `apps/prime/functions/lib/prime-thread-projection.ts` — `projectPrimeThreadMessageToFirebase`: writes to Firebase RTDB `messaging/channels/{threadId}/messages/{messageId}`. For whole_hostel: channel ID is `broadcast_whole_hostel`, guests must subscribe to this channel.
- `apps/prime/functions/lib/prime-messaging-repositories.ts` — `upsertPrimeMessageThread` (ON CONFLICT DO UPDATE — idempotent). `createPrimeMessage` (INSERT — not idempotent).

### Data & Contracts

- Types/schemas/events:
  - `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel'` — singleton, stable ID.
  - Thread `review_status` values: `pending | review_later | auto_archived | resolved | sent`. After `sendPrimeReviewThread` completes, thread is `sent`. After `sendPrimeReviewThread` for whole_hostel: thread is marked `sent` immediately — but the `isReusableWholeHostelLane` guard in `savePrimeReviewDraft` bypasses the `sent`-conflict check, so drafts can still be created for the next broadcast.
  - Campaign `status` values: `drafting | under_review | sent | resolved | archived`. `isTerminalCampaignStatus` = `sent | resolved | archived`.
  - Message ID: `buildReviewMessageId(Date.now())` — time-based, not deterministic on retry.
  - Projection job ID: `proj_message_{messageId}` — not deterministic on retry.

- Persistence:
  - D1 (PRIME_MESSAGING_DB): `message_threads` (singleton broadcast_whole_hostel thread), `message_drafts`, `prime_message_campaigns`, `prime_messages`, `prime_projection_jobs`, `prime_message_campaign_deliveries`.
  - Firebase RTDB: `messaging/channels/broadcast_whole_hostel/meta`, `messaging/channels/broadcast_whole_hostel/messages/{messageId}`.

- API/contracts:
  - `review-campaign-send` response: `{ success: true, data: { campaign, sentMessageId } }` — wraps `sendPrimeReviewCampaign` result.
  - `review-thread-send` response: `{ success: true, data: { thread, draft, campaign, sentMessageId } }` — direct `sendPrimeReviewThread` result.
  - `sendPrimeInboxThread` in Reception returns `{ draft, sentMessageId }`. When routed via campaign-send: `primeRequest` unwraps `payload.data`, so `sentMessageId` from the `review-campaign-send` response (`{ campaign, sentMessageId }`) is correctly accessible. However `sendPrimeInboxThread` only extracts `payload.sentMessageId` in the campaign branch (line 558) — this is correct. `sentMessageId` is not inherently null on the campaign path.

### Dependency & Impact Map

- Upstream dependencies:
  - `RECEPTION_PRIME_API_BASE_URL` and `RECEPTION_PRIME_ACCESS_TOKEN` env vars (Reception).
  - `PRIME_MESSAGING_DB` D1 binding (Prime).
  - `CF_FIREBASE_DATABASE_URL` Firebase env (Prime).
  - `PRIME_ENABLE_STAFF_OWNER_ROUTES` + `PRIME_STAFF_OWNER_GATE_TOKEN` (staff auth gate on Prime).
  - `RATE_LIMIT` KV namespace (review-campaign-send rate limit).

- Downstream dependents:
  - Guest Prime app subscribing to `messaging/channels/broadcast_whole_hostel/messages` in Firebase RTDB.
  - `review-campaign-replay` endpoint — used for re-projecting failed delivery records.
  - Reception inbox thread list — shows thread status after send.
  - `recordInboxEvent` telemetry (fire-and-forget, no failure path).

- Likely blast radius:
  - Changes to `sendPrimeInboxThread` routing in `prime-review.server.ts` affect all send paths (direct threads + broadcast threads).
  - Changes to `staff-initiate-thread.ts` affect the draft/campaign creation on every broadcast.
  - The `broadcast_whole_hostel` thread is a singleton — changes here affect all staff broadcasts.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (Reception + Prime functions), node environment.
- Commands: governed jest runner for Reception; `pnpm test` in Prime app.
- CI integration: per MEMORY.md — tests run in CI only. Do not run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `staff-initiate-thread.ts` | Unit (Jest) | `functions/__tests__/staff-initiate-thread.test.ts` | Covers auth gate, missing DB binding, missing/empty plainText, D1 error → 500. Does NOT cover happy path (no mock for `upsertPrimeMessageThread` or `savePrimeReviewDraft` via actual D1). Tests guard structure only. |
| `initiatePrimeOutboundThread` | Unit (Jest) | `reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` | Covers HTTP dispatch to correct endpoint, actor header, null return when unconfigured, error propagation. Good coverage. |
| `POST /api/mcp/inbox/prime-compose` | Unit (Jest) | `reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` | Covers auth, empty text, initiate null (503), send throws (502), success path, telemetry event. Mocks both `initiatePrimeOutboundThread` and `sendPrimeInboxThread` — does NOT test actual routing logic of `sendPrimeInboxThread`. |
| `review-campaign-send` rate limit | Unit (Jest) | `functions/__tests__/review-campaign-send-rate-limit.test.ts` | Rate limit tests only. |
| `sendPrimeInboxThread` routing | None | — | **No test for the branch that decides between `review-campaign-send` and `review-thread-send`.** The routing condition is untested. |
| `sendPrimeReviewThread` whole_hostel path | Unit (Jest) | `functions/__tests__/review-threads.test.ts` (TC-06B line 2854) | TC-06B covers `review-thread-send` projecting a broadcast reply and verifying canonical send state. TC-03D (line 2071) covers whole_hostel draft save reopening the lane. Campaign-replay and projection-replay coverage also present in this suite. Coverage is meaningful but does NOT cover partial-failure scenarios or retry idempotency. |
| Idempotency / retry scenarios | None | — | No tests for retry creating duplicate messages on partial failure (Firebase write succeeds, D1 fails). |

#### Coverage Gaps

- Untested paths:
  - `sendPrimeInboxThread` routing branch (lines 544–561 of `prime-review.server.ts`) — the `prime_broadcast + campaign.id` condition that currently routes to `review-campaign-send`. No test verifies which endpoint the Reception layer calls.
  - The full 3-hop integration: `prime-compose → initiate → send` (Reception-side integration test, not individual unit tests).
  - Retry/idempotency behaviour: what happens when `prime-compose` is called twice — thread `review_status: sent` on retry, how Reception handles the 409 back-propagated as 502.
  - Partial failure states: Firebase write succeeds, D1 writes fail partially — confirmed by TC-06B that happy path works, but no test for the partial-failure recovery gap.
- Note: `review-threads.test.ts` TC-06B already covers the whole_hostel send happy path including sent campaign state and projection job creation. TC-03D covers whole_hostel draft save. The gap is idempotency and partial-failure coverage, not absence of any whole_hostel send coverage.

#### Testability Assessment

- Easy to test: `sendPrimeInboxThread` routing condition is a pure function over the `detail` object — mockable.
- Hard to test: the 3-hop integration end-to-end requires mocking both Prime endpoints (fetch mocks in Reception) and D1 + Firebase in Prime.
- Test seams needed: `sendPrimeReviewThread` and `sendPrimeReviewCampaign` are called inside Prime functions. The D1/Firebase dependencies need seams for unit tests of idempotency behaviour.

### Recent Git History (Targeted)

- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — commit `2522ba7a39` "feat(reception-prime-outbound): Wave 4 — prime-compose API route + telemetry event". New file in this build.
- `apps/prime/functions/api/staff-initiate-thread.ts` — commit `67d338b582` "feat(reception-prime-outbound-messaging): Wave 2 - staff-initiate-thread endpoint + broadcast ChannelMode (TASK-02, TASK-04)". New file in this build.
- `apps/reception/src/lib/inbox/prime-review.server.ts` — commit `e89101cadf` "feat(reception-prime-outbound): Wave 3 — staff messages link + initiatePrimeOutboundThread". Added `initiatePrimeOutboundThread` and `sendPrimeInboxThread` routing.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Reception compose UI was built in the outbound messaging build; no UI changes needed here | No UI gap | No |
| UX / states | Required | `prime-compose/route.ts` returns 200/400/502/503 — but the retry/partial-failure UX is untested; if send returns 502, the thread may be in an inconsistent state with no operator-visible recovery path | No operator-visible error recovery UX for orphaned thread state | Yes |
| Security / privacy | Required | Staff-owner gate on Prime endpoints; `requireStaffAuth` on Reception route. Rate limit on `review-campaign-send` (3/60s) — this rate limit does not belong on a staff announcement path. Guest message content passes through Reception → Prime HTTP — no PII fan-out beyond Firebase RTDB broadcast channel. | Rate limit gate mismatch; actor UID passthrough verified. | Yes |
| Logging / observability / audit | Required | `recordInboxEvent` fires `prime_broadcast_initiated` (fire-and-forget). `sendPrimeReviewThread` writes `recordPrimeMessageAdmission` with `actorSource: 'reception_proxy'`. No observable signal when thread is left in partial-failure state. | No alert/log when thread is orphaned. Audit trail exists but silent on partial failure. | Yes |
| Testing / validation | Required | `review-threads.test.ts` TC-06B covers whole_hostel send happy path (via `review-thread-send`). TC-03D covers whole_hostel draft save. Routing branch in `sendPrimeInboxThread` (Reception) is untested. Retry/partial-failure/idempotency scenarios are untested. | Routing branch + retry/partial-failure coverage missing. New tests required for routing decision and idempotency scenarios. | Yes |
| Data / contracts | Required | Singleton `broadcast_whole_hostel` thread; campaign record per broadcast; draft per broadcast; message per broadcast. Thread `review_status: sent` blocks re-use from the normal send path but `isReusableWholeHostelLane` in `savePrimeReviewDraft` bypasses the draft conflict check, enabling future broadcasts. `sendPrimeReviewThread` performs 7 sequential independent D1 writes (no transaction): `createPrimeMessage`, `updatePrimeMessageDraft`, `upsertPrimeMessageThread`, `markWholeHostelCampaignSent`, `recordPrimeMessageAdmission`, `enqueuePrimeProjectionJob`, `recordWholeHostelCampaignDelivery`. Firebase projection (step 1 of the sequence) precedes all 7 D1 writes. Failure at any point leaves partial state. | Firebase/D1 split-write AND non-transactional D1 write sequence are the core data integrity risks. | Yes |
| Performance / reliability | Required | 3 sequential HTTP hops (Reception → staff-initiate-thread → [detail fetch] → review-campaign-send). Each hop is a point of failure. Rate limit on campaign-send adds unnecessary restriction. `buildReviewMessageId(Date.now())` is non-idempotent on retry — different messageId each time. | Sequential hops with no idempotency key across chain. | Yes |
| Rollout / rollback | Required | The feature is already deployed (committed). Fix will be a targeted routing change in `sendPrimeInboxThread` (Reception) + any idempotency additions. Rollback = revert routing change. Singleton thread state in D1 may need cleanup if broadcasts were sent via wrong path. No migration required for schema (no new tables). | Existing sent-broadcast state in D1/Firebase is not affected by routing fix. | Yes |

## Questions

### Resolved

- Q: Is `review-campaign-send` the correct endpoint for whole-hostel broadcasts, or is it repurposing review campaign infrastructure?
  - A: **Incorrect endpoint.** `review-campaign-send` was built for `booking`/`room` audience campaigns that need fan-out expansion. For `whole_hostel`, `sendPrimeReviewCampaign` simply falls through to `sendPrimeReviewThread` (the same function called by `review-thread-send`). Going via `review-campaign-send` adds: (1) a KV rate limit gate (3/60s per actor) that does not belong on staff announcements; (2) an extra HTTP hop (`getPrimeInboxThreadDetail` to find the campaignId, then `review-campaign-send`); (3) `actorSource` is hardcoded as `'reception_proxy'` rather than passing the Reception-side source label. Note: `actorUid` IS correctly passed via the `x-prime-actor-uid` header — only `actorSource` is wrong.
  - Evidence: `prime-review-campaign-actions.ts:110-133` (whole_hostel falls to `sendPrimeReviewThread`); `review-campaign-send.ts:26,51` (`actorUid` from header, `actorSource` hardcoded); `prime-review-send.ts:53` (the actual executor).

- Q: Is there a purpose-built staff-to-guest direct-message endpoint (M-03)?
  - A: Yes — `apps/prime/functions/api/review-thread-send.ts` (`POST /api/review-thread-send?threadId=...`) is the direct send path. It calls `sendPrimeReviewThread` directly without rate limiting or extra hops. This is the correct endpoint for the whole-hostel broadcast send. The Reception layer already has the fallback path to `review-thread-send` in `sendPrimeInboxThread` (lines 563–578 of `prime-review.server.ts`) — it is used when no campaign is present. Fixing C-01 means routing whole_hostel broadcasts to this path unconditionally.
  - Evidence: `prime-review.server.ts:563-578` (fallback path); `review-thread-send.ts:31` (direct call).

- Q: Does `audience: 'whole_hostel'` actually deliver to guest devices (C-05)?
  - A: Delivery is via Firebase RTDB real-time subscription, NOT push notifications. The message is written to `messaging/channels/broadcast_whole_hostel/messages/{messageId}`. Guests with an active Prime app session subscribed to this channel will receive it in real-time. Guests without an active session will receive it when they next open the app and fetch the channel. There is NO fan-out to individual guest device push notification tokens — the whole_hostel model is a shared channel, not a per-device send. This is by design (the `deliveryModel: 'shared_whole_hostel_broadcast_thread'` metadata confirms it). The delivery is real but depends on guest app connectivity; it is not a reliable "push to all" delivery.
  - Evidence: `prime-thread-projection.ts:186-219` (Firebase RTDB write to channel); `prime-whole-hostel-campaigns.ts:38-43` (`deliveryModel: 'shared_whole_hostel_broadcast_thread'`).

- Q: Is the `broadcast_whole_hostel` thread singleton re-usable across broadcasts? Does `review_status: sent` block future broadcasts?
  - A: Re-usable by design. `savePrimeReviewDraft` has an `isReusableWholeHostelLane` check (line 73–83 of `prime-review-drafts.ts`) that bypasses the `sent`/`resolved`/`archived` conflict guards when saving a new draft. `upsertPrimeMessageThread` resets `review_status: pending` when saving the new draft for a whole_hostel thread. So each broadcast: upserts thread to `pending`, creates campaign, creates draft, sends → thread goes to `sent`. Next broadcast: upserts thread back to `pending` via the draft save, creates new campaign, etc. This cycle works but the `sent` state momentarily blocks send if a retry hits before the status is reset.
  - Evidence: `prime-review-drafts.ts:73-151` (isReusableWholeHostelLane guard).

- Q: Does the 3-hop chain have any idempotency protection (C-02)?
  - A: Partial. Hop 1 (thread upsert): idempotent. Draft creation: not idempotent on a clean retry (creates a new draft if no non-sent/non-dismissed draft exists). Campaign creation: idempotent if a non-terminal campaign exists. Hop 2 (`sendPrimeInboxThread` → route decision): not idempotent — calls `getPrimeInboxThreadDetail` which is a fresh read, so on retry the thread may be `sent` or may not be. Hop 3 (send): `buildThreadSendConflictMessage` checks `review_status: sent` → returns 409 Conflict, which becomes 502 in Reception. There is NO idempotency key propagated across hops.
  - Evidence: `prime-messaging-repositories.ts:696-727` (upsert); `prime-review-drafts.ts:86-109` (draft create/update); `prime-review-send-support.ts:87-99` (conflict guard).

### Open (Operator Input Required)

- Q: For the idempotency fix: is it acceptable to add a new combined `staff-broadcast` endpoint to Prime that atomically creates the draft and sends in one hop? Or should the existing two-hop design be preserved and a client idempotency key added instead?
  - Why operator input is required: This is an architectural preference decision — single-hop simplicity vs preserving the existing two-hop pattern. Both are technically viable; they have different code change surface areas.
  - Decision impacted: Whether the fix adds a new Prime endpoint or modifies the existing two-hop composition.
  - Decision owner: Product / operator
  - Default assumption (if no input): analysis should compare both and recommend based on implementation cost. Single-hop is likely simpler and resolves C-01, C-02, and C-03 simultaneously.

- Q: Should the `broadcast_whole_hostel` singleton thread be reset to `pending` as part of the send path fix, or is the current design (reset via next draft save) acceptable?
  - Why operator input is required: This is a behavioural product decision — whether a "ready for next broadcast" state should be an explicit post-send operation or remain lazy (only reset when next draft is started). Both are correct technically; the choice affects observable system state.
  - Decision impacted: Whether a `upsertPrimeMessageThread({ reviewStatus: 'pending' })` call needs to be added to `sendPrimeReviewThread` after the whole_hostel send completes.
  - Decision owner: Product / operator
  - Default assumption: Current lazy-reset (reset on next draft save) is acceptable and matches the existing `isReusableWholeHostelLane` design. The fix should NOT add an explicit post-send reset without operator confirmation.

## Confidence Inputs

- **Implementation:** 90% — All key files read. The routing bug and its fix are unambiguous. The idempotency gap is well-understood. The only uncertainty is the operator preference on singleton thread state reset.
  - Raises to ≥80: already there — fix path is `sendPrimeInboxThread` routing condition + `review-thread-send` direct usage.
  - Raises to ≥90: already there — full read of all 7 primary files and the two endpoint handlers.

- **Approach:** 85% — Three credible fix approaches exist (see Risks): (A) change routing in Reception to skip campaign-send for whole_hostel, (B) add idempotency key to the 3-hop chain, (C) collapse 3 hops into 2 by combining initiate+send in one Prime endpoint. Approach A resolves C-01 and reduces C-02 risk without adding complexity.
  - Raises to ≥90: operator confirmation of singleton reset preference (open question above).

- **Impact:** 90% — Fix removes rate-limit gate, restores correct actor UID, eliminates extra network hop, reduces retry duplicate risk.
  - Raises to ≥90: already there — impact is well-bounded.

- **Delivery-Readiness:** 85% — All files are located. Test seams exist. The routing fix is a small targeted change. Idempotency hardening requires more work.
  - Raises to ≥90: confirm whether idempotency hardening is in scope for this plan or deferred.

- **Testability:** 80% — `sendPrimeInboxThread` routing branch is unit-testable. `sendPrimeReviewThread` whole_hostel path requires a test harness with D1/Firebase mocks (already present in Prime test infrastructure). Integration of 3-hop chain requires fetch mocks (pattern exists in Reception tests).
  - Raises to ≥90: build the routing unit test + whole_hostel send path test.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Changing `sendPrimeInboxThread` routing breaks non-whole_hostel broadcast send | Low | High | The routing branch is narrow: `channel === 'prime_broadcast' && campaign?.id`. Non-whole_hostel broadcast channels are not currently used. Add test to cover the else-branch. |
| Partial-failure: Firebase projection succeeds but D1 writes fail — broadcast message visible in Firebase but not recorded in D1; no projection job enqueued, so no replay path | Medium | High | The only mitigation is: if thread status was NOT yet written to D1 as `sent`, a retry finds `review_status: pending` and can re-send. But if Firebase write succeeds and D1 writes start then partially fail, the state is inconsistent and there is no automated recovery. The projection job enqueued at step 8 depends on steps 2–7 all completing — if any earlier D1 write fails, there is no replay job. |
| Retry of compose after all D1 writes complete finds thread `review_status: sent` → 409 → 502 — broadcast was sent but client sees error | Medium | Medium | No in-band recovery path from the compose endpoint. Staff would need to check Prime review thread list to confirm send. Should be documented / surfaced in Reception UI. |
| Rate limit on `review-campaign-send` (3/60s per actor) blocks rapid staff announcement retries | High (current path) | Medium | Fix: route through `review-thread-send` which has no KV rate limit. |
| `actorSource` label is hardcoded as `'reception_proxy'` on BOTH `review-campaign-send.ts` (line 51) AND `review-thread-send.ts` (line 34) — affects audit trail regardless of routing fix | High | Low | The actorSource fix requires a new query param or header on the Prime endpoint (both `review-thread-send` and `review-campaign-send`). Simply routing through `review-thread-send` does NOT fix this. Requires an explicit change to both Prime endpoints or a new `actorSource` input path. `actorUid` is correctly threaded on both paths. |
| Retry of `prime-compose` after partial failure creates a second draft/campaign but finds thread `sent` → 409 → 502 to client, leaving orphaned campaign/draft records | Medium | Low | Draft and campaign records are cheap. The old draft/campaign will be superseded on the next broadcast attempt (new draft upserts over the old non-sent one). No functional impact, minor data noise. |
| `broadcast_whole_hostel` Firebase channel not subscribed by guest app = silent non-delivery | Medium | Medium | This is a known platform limitation — not introduced by this fix. Should be documented. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Do not bypass `enforceStaffOwnerApiGate` on any Prime endpoint.
  - The `isReusableWholeHostelLane` pattern in `savePrimeReviewDraft` must be preserved — it is required for the singleton thread to support repeated broadcasts.
  - Keep `actorUid` passthrough from Reception staff auth through to Prime — do not use hardcoded actor strings.
  - The fix to `sendPrimeInboxThread` must not break the non-broadcast send path (lines 563–578 of `prime-review.server.ts`).

- Rollout/rollback expectations:
  - No schema migration needed.
  - Existing sent broadcasts in D1/Firebase are not affected.
  - Fix is a targeted routing change. Rollback = revert `prime-review.server.ts` change.

- Observability expectations:
  - Add logging when the routing branch fires for whole_hostel vs non-whole_hostel to make the path observable.
  - Consider adding a log when `broadcast_whole_hostel` thread is found in `sent` state at send time (potential duplicate attempt).

## Suggested Task Seeds (Non-binding)

1. Fix routing in `sendPrimeInboxThread`: for `prime_broadcast` channel, skip `review-campaign-send` and call `review-thread-send` (or the Prime-side equivalent) directly. Remove the `detail.campaign.id` branch for broadcast.
2. Add unit tests for the `sendPrimeInboxThread` routing branch covering: (a) `prime_broadcast` with campaign → now routes to `review-thread-send`, (b) `prime_broadcast` without campaign → routes to `review-thread-send`, (c) non-broadcast thread → routes to `review-thread-send`.
3. Add unit tests for `sendPrimeReviewThread` whole_hostel path in Prime (verify `markWholeHostelCampaignSent` and `recordWholeHostelCampaignDelivery` are called).
4. Document C-05 (Firebase RTDB subscription-based delivery, no push notifications) in a code comment or README section.
5. Address idempotency in the compose flow. A simple "check status before send" is insufficient because `initiatePrimeOutboundThread` resets `review_status` to `pending` on every call (via `isReusableWholeHostelLane`). Analysis must choose the correct approach: (a) collapse `staff-initiate-thread` + send into a single atomic Prime endpoint; (b) add a client-provided idempotency key that `staff-initiate-thread` respects; or (c) make `prime-compose` skip the initiate step if a non-sent draft already exists for this actor. The approach decision belongs in analysis.
6. Fix `actorSource` on the send path: both `review-thread-send.ts` and `review-campaign-send.ts` hardcode `actorSource: 'reception_proxy'`. Neither endpoint currently accepts an `actorSource` parameter from callers. The fix requires: (a) pass an `actorSource` query param or header from Reception, and (b) update the Prime endpoint to read it. Alternatively, define `actorSource: 'reception_staff_compose'` as the correct label for this flow and patch it directly in `review-thread-send.ts`.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Routing fix in `prime-review.server.ts` (`sendPrimeInboxThread`) — route whole_hostel broadcasts to `review-thread-send` not `review-campaign-send`
  - Idempotency protection: define the approach (collapse initiate+send, or content-hash based dedup, or idempotency key) — analysis must determine the viable approach given that initiate resets thread status
  - `actorSource` label corrected in `review-thread-send.ts` (and/or `review-campaign-send.ts` if still used)
  - Tests for routing decision branch and retry/partial-failure scenarios
  - Code comment documenting delivery model (Firebase RTDB subscription, no push)
  - No schema changes required
- Post-delivery measurement plan:
  - Verify `review-campaign-send` is no longer called for whole_hostel broadcasts (absent from logs).
  - Confirm `actorSource` is correctly labeled in admission records (not `'reception_proxy'`).
  - Verify retry of compose after first send does not create a second broadcast message.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The Outcome Contract explicitly requires idempotency protection, so C-02 is in scope — specifically: making `prime-compose` retry-safe by checking thread status before calling `sendPrimeInboxThread`. C-01 (wrong endpoint) is a one-branch change in `prime-review.server.ts`. C-03 (orphaned thread on partial Firebase failure) is documented and a partial mitigation (idempotency check at compose level) is in scope; full transactional D1/Firebase consistency requires larger architectural change and is deferred. C-05 (delivery model clarity) is resolved as documentation/comment. The scope is bounded to: fix routing, add compose-level idempotency check, fix actorSource label, add tests, document delivery model.

## Evidence Gap Review

### Gaps Addressed
- Full call graph from Reception `prime-compose` route through all 3 hops to Firebase projection — traced and confirmed.
- `review-campaign-send` audience routing logic — confirmed by reading `sendPrimeReviewCampaign` (falls to `sendPrimeReviewThread` for whole_hostel, not expansion path).
- Idempotency at each hop — confirmed as partial, with specific gap at the draft-create and message-create steps.
- Delivery model (C-05) — confirmed as Firebase RTDB subscription, no push notifications.
- Purpose-built direct-message endpoint (M-03) — confirmed: `review-thread-send.ts` exists and is the correct path.

### Confidence Adjustments
- C-01 severity confirmed as routing bug. Corrected claim: `review-campaign-send` does not lose `actorUid` (correctly threaded via header) but does hardcode `actorSource: 'reception_proxy'` — and this same hardcoding exists on `review-thread-send.ts` as well. The actorSource fix is not free with the routing change.
- C-02 severity upgraded — the campaign-send rate limit (3/60s per actor) is a concrete operational blocker on the current path.
- C-03 severity upgraded. Initial assessment understated the failure surface: Firebase projection is step 1, the projection job is only enqueued at step 8 (after Firebase succeeds and 6 D1 writes complete). A Firebase failure at step 1 leaves NO projection job to replay — there is no async recovery path for that failure mode. The "reduced risk because replay exists" claim in the initial draft was incorrect.

### Remaining Assumptions
- Guest Prime app subscribes to `messaging/channels/broadcast_whole_hostel/messages` — this is inferred from the projection writing to that path; not verified by reading guest app source code.
- No existing production broadcasts have been sent via the wrong `review-campaign-send` path that would need cleanup — the feature was just committed.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point: `prime-compose/route.ts` | Yes | None | No |
| Entry point: `staff-initiate-thread.ts` | Yes | None | No |
| Entry point: `review-campaign-send.ts` | Yes | None — routing incorrectness confirmed as a code quality issue, not a missing investigation path | No |
| Key module: `sendPrimeInboxThread` routing logic | Yes | [Scope gap in investigation] [Minor]: the `detail.thread.channel` type mapping (`prime_broadcast`) vs D1 `channel_type` (`broadcast`) was not traced through `mapPrimeSummaryToInboxThread` — confirmed as correct mapping via `resolveInboxChannelAdapter`. | No |
| Key module: `sendPrimeReviewCampaign` whole_hostel path | Yes | [Scope gap] [Minor]: initial draft overstated actor UID loss — `actorUid` is correctly threaded via header; only `actorSource` is hardcoded. Corrected in Round 1. Round 2 further corrected: `review-thread-send.ts` ALSO hardcodes `actorSource: 'reception_proxy'` (line 34), so routing change alone does not fix actorSource. Corrected in Round 2. | No |
| Key module: `sendPrimeReviewThread` + whole_hostel campaign tracking | Yes | [Scope gap] [Minor]: initial draft claimed D1 writes were "atomic" — they are 7 independent sequential calls with no transaction. Corrected Round 1. Projection job enqueue order corrected (step 8, after Firebase). C-03 severity upgraded. | No |
| Outcome Contract / scope alignment | Yes | [Scope gap] [Moderate — resolved]: initial draft deferred idempotency as optional while Outcome Contract requires idempotency protection. Corrected in Round 2: idempotency check at compose level is now in scope. | No |
| Key module: `projectPrimeThreadMessageToFirebase` Firebase write | Yes | None | No |
| Key module: `prime-messaging-repositories.ts` upsert semantics | Yes | None | No |
| Idempotency audit (all 3 hops) | Yes | None | No |
| Test landscape coverage | Yes | None | No |
| M-03: purpose-built endpoint | Yes | None | No |
| C-05: delivery model | Yes | None | No |

## Critique Summary

- Rounds: 3
- Final score: 3.0/5.0 (codemoot 6/10 mapped)
- Verdict: partially credible
- Critical findings remaining: 1 (idempotency approach — deferred to analysis as open architectural question; addressed in artifact as open question and scope note)

## Analysis Readiness

- Status: Needs-input
- Blocking items:
  - **Idempotency approach:** A second `prime-compose` call runs `initiatePrimeOutboundThread` which calls `savePrimeReviewDraft` → `isReusableWholeHostelLane` bypass → resets `review_status: 'pending'`. A simple "check thread status before send" guard is bypassed because the initiate step actively resets the status on every call. The fact-find documents the correct behaviour but cannot choose the fix approach — analysis must decide between: (a) collapse initiate+send into a new single-hop Prime endpoint; (b) add a client-provided idempotency key to `staff-initiate-thread`; (c) make `prime-compose` skip initiate if an unsent draft already exists for the actor.
- Recommended next step:
  - Operator confirms preferred idempotency approach from the three options above (or delegates to analysis), then `/lp-do-analysis prime-outbound-send-path-correctness` auto-executes.
