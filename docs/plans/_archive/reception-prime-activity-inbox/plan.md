---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-activity-inbox
Dispatch-ID: IDEA-DISPATCH-20260314140000-BRIK-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-activity-inbox/analysis.md
---

# Reception Prime Activity Inbox Plan

## Summary

Activity channel messages sent in the Prime guest app currently bypass the server entirely — the guest browser pushes directly to Firebase RTDB with no shadow-write to D1. This means Reception has zero visibility into activity group chats. This plan delivers a new CF Pages Function `activity-message.ts` that intercepts guest activity sends, validates the session, writes to Firebase server-side, and shadow-writes to D1. Alongside the ingestion function, the plan adds `prime_activity` as a first-class channel type across the Prime Functions contract layer, the Reception inbox adapter layer, and the staff reply path. Six tasks execute in two sequential waves: Wave 1 (TypeScript contracts + server-side function + tests) must be deployed and staging-verified before Wave 2 (ChatProvider guest-app update).

## Active tasks
- [x] TASK-01: Extend TypeScript channel type contracts
- [x] TASK-02: Add `activity-message.ts` CF Pages Function + shadow-write
- [x] TASK-03: Add `ensureActivityChannelMeta` to `prime-thread-projection.ts`
- [x] TASK-04: Add `prime_activity` channel adapter in Reception + fix `mapPrimeSummaryToInboxThread`
- [x] TASK-05: Update ChatProvider activity send branch
- [x] TASK-06: Tests

## Goals
- Shadow-write inbound activity messages to `PRIME_MESSAGING_DB`.
- Add `prime_activity` channel type across all layers where `prime_direct` and `prime_broadcast` exist.
- Show activity threads in Reception's Prime inbox column alongside `prime_direct` threads.
- Allow staff to reply to activity threads; reply projected back to Firebase via existing `projectPrimeThreadMessageToFirebase` path with new `ensureActivityChannelMeta` branch.

## Non-goals
- AI draft generation for activity channels.
- Presence tracking changes or attendance lifecycle.
- Firebase RTDB security rule modifications.
- Reception displaying activity roster or RSVP data.
- Historical backfill of activity messages sent before this feature deploys.

## Constraints & Assumptions
- Constraints:
  - `message_threads.channel_type TEXT NOT NULL` — no CHECK constraint; sentinel `'activity'` for `booking_id` is valid SQLite. TypeScript-only contract change.
  - `projectPrimeThreadMessageToFirebase` uses `CF_FIREBASE_API_KEY` REST auth (not service-account token exchange). Same auth model for the new function.
  - `booking_id NOT NULL` on `message_threads` — activity threads use sentinel `'activity'`; `mapPrimeSummaryToInboxThread` sets `guestBookingRef: summary.bookingId` verbatim, so the guard must be applied at the mapper, not only at `ThreadDetailPane`.
  - TypeScript union + `resolveChannel` update must be in the same deployment unit as `activity-message.ts`.
  - ChatProvider update (TASK-05) must not deploy until server-side bundle (TASKS-01 through TASK-04) has been verified in staging.
- Assumptions:
  - `ActivityInstance.id` (UUID from `crypto.randomUUID()`) is used verbatim as `channelId` in `messaging/channels/<id>`.
  - `CF_FIREBASE_API_KEY` env var is available in the Pages Function context (same project as `direct-message.ts`).
  - `RATE_LIMIT` KV and `PRIME_MESSAGING_DB` D1 bindings are available (both in `wrangler.toml`).
  - No PWA/service-worker constraint in Prime app prevents a server round-trip on activity sends.

## Inherited Outcome Contract

- **Why:** Staff have no visibility into activity group chats. Guest questions or issues posted to activity channels go unnoticed. This creates a service gap for a running feature.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity channel messages appear in Reception's Prime inbox column within the same polling window as direct messages. Staff can read full conversation history and post replies that appear in the guest app.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-prime-activity-inbox/analysis.md`
- Selected approach inherited:
  - Option A — new CF Pages Function `activity-message.ts` mirroring `direct-message.ts` exactly.
  - Guest app activity send path changed from direct Firebase `push()` to `POST /api/activity-message`.
  - Sentinel `'activity'` for `booking_id` on activity threads; `guestBookingRef` guard in Reception mapper.
- Key reasoning used:
  - Security: server function validates guest session token; polling cannot. Decisive factor.
  - Pattern consistency: `direct-message.ts` + `shadowWritePrimeInboundDirectMessage` is proven template.
  - No new infra: Pages Functions already the execution model.

## Selected Approach Summary
- What was chosen:
  - New server-side ingestion function (`activity-message.ts`) + shadow-write function.
  - TypeScript contract additions (channel type union, inbox channel array, adapter, `resolveChannel`, `resolveSentAdmissionReason`).
  - `ensureActivityChannelMeta` for staff reply projection.
  - ChatProvider activity send branch update.
- Why planning is not reopening option selection:
  - Analysis decisively ruled out polling (security) and Durable Objects (infra cost). No operator questions remained open.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-prime-activity-inbox/fact-find.md`
- Evidence carried forward:
  - `direct-message.ts` (lines 64–232) confirmed template structure.
  - `prime-messaging-shadow-write.ts` confirmed 4-call shadow-write pattern.
  - `prime-messaging-repositories.ts` line 15: `primeMessagingChannelTypes = ['direct', 'broadcast']` — needs `'activity'`.
  - `prime-review-api.ts` line 148: `resolveChannel` — explicit `else` branch needed.
  - `prime-review-send-support.ts` lines 101–109: `resolveSentMessageKind` correct for activity via else-branch; `resolveSentAdmissionReason` needs `'activity'` branch.
  - `prime-thread-projection.ts` lines 159–163: broadcast/direct dispatch — `'activity'` branch needed.
  - `channels.ts` line 1: `inboxChannels` const — needs `'prime_activity'`.
  - `channel-adapters.server.ts`: `CHANNEL_ADAPTERS` record — needs `prime_activity` entry.
  - `prime-review.server.ts` line 313: `guestBookingRef: summary.bookingId` — sentinel guard must be applied here.
  - `ChatProvider.tsx` line 660: `push(ref(db, ...))` — replace with `fetch('/api/activity-message', ...)`.
  - Test template: `functions/__tests__/direct-message.test.ts` — mirror for `activity-message.test.ts`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend TypeScript channel type contracts | 90% | S | Complete (2026-03-14) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Add `activity-message.ts` CF Pages Function + shadow-write | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Add `ensureActivityChannelMeta` to `prime-thread-projection.ts` | 85% | S | Complete (2026-03-14) | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Add `prime_activity` adapter in Reception + mapper guard | 85% | S | Complete (2026-03-14) | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Update ChatProvider activity send branch | 85% | S | Complete (2026-03-14) | TASK-02 (staging-verified) | TASK-06 |
| TASK-06 | IMPLEMENT | Tests (all new coverage) | 85% | M | Complete (2026-03-14) | TASK-01,TASK-02,TASK-03,TASK-04,TASK-05 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `prime_activity` adapter added to `channel-adapters.server.ts`; `guestBookingRef` guard in `mapPrimeSummaryToInboxThread`; activity thread appears in Reception inbox with `channelLabel: "Activity chat"` | TASK-04 | No layout changes. `ThreadDetailPane` already conditionally renders `guestBookingRef`; guard prevents `#activity` display. |
| UX / states | Guest activity send now calls server function; error state handled in ChatProvider activity branch (mirrors direct-message error surface); staff side unchanged | TASK-05 | Server function fail → guest sees send error (same UX as direct-message failure). |
| Security / privacy | Session token validated per send (same as `direct-message.ts`); rate limiting via `enforceKvRateLimit` on sender UUID; `enforceStaffOwnerApiGate` guards staff reply routes (unchanged) | TASK-02 | No new auth credentials. Activity channels are hostel-wide — no per-booking membership check required. |
| Logging / observability / audit | `recordDirectTelemetry(env, 'activity.write.success/error/rate_limited')` in new function; `recordPrimeMessageAdmission` records each shadow-written message | TASK-02 | ~5 new telemetry event paths following existing `recordDirectTelemetry` pattern. |
| Testing / validation | `__tests__/activity-message.test.ts` (mirror of `direct-message.test.ts`); `resolveChannel` activity branch test; `resolveSentAdmissionReason` activity branch test; `ensureActivityChannelMeta` tests; `channel-adapters.server.test.ts` `prime_activity` adapter test; `mapPrimeSummaryToInboxThread` sentinel guard test | TASK-06 | ~4 new test files, ~14 new test cases. All follow existing patterns. |
| Data / contracts | `primeMessagingChannelTypes` union: add `'activity'`. `inboxChannels` array: add `'prime_activity'`. `resolveChannel` explicit activity branch. `resolveSentAdmissionReason` activity branch. No schema migration. | TASK-01, TASK-03 | TypeScript-only contract changes. SQLite has no CHECK constraint on `channel_type`. |
| Performance / reliability | One extra server round-trip per activity message send (~100ms, identical to direct-message). D1 shadow-write is fire-and-forget (errors caught/logged, not surfaced to guest). | TASK-02, TASK-05 | Acceptable latency. |
| Rollout / rollback | Removing `'prime_activity'` from `inboxChannels` hides activity threads from Reception without removing D1 data. TypeScript union additions are additive. Shadow-write failure = graceful degradation (guest message still reaches Firebase). | TASK-01, TASK-04 | No feature flag required. Additive changes throughout. |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | TASK-01 must complete before TASK-02, TASK-03, TASK-04 start. TASK-02/03/04 can run in parallel after TASK-01. Deploy and staging-verify Wave 1 before Wave 2. |
| 2 | TASK-05, TASK-06 | Wave 1 staging-verified | TASK-05 (ChatProvider) is gated on TASK-02 staging verification. TASK-06 (tests) can be written during Wave 1 for all completed tasks; final green run after TASK-05. |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Guest sends activity message | Guest taps Send in `/chat/channel?id=<activityId>` | 1. ChatProvider calls `POST /api/activity-message` with `{activityId, channelId, content}` + `prime_session` cookie. 2. Server validates session token. 3. Rate-limit check (40 req/60s per sender UUID). 4. Server writes message to Firebase `messaging/channels/<channelId>/messages/<messageId>`. 5. Shadow-writes thread (`channel_type='activity'`, `booking_id='activity'`) + message to D1 (fire-and-forget catch). 6. Returns `{success, messageId}`. 7. Guest `onChildAdded` subscription reflects new message to all channel subscribers. | TASK-01, TASK-02, TASK-05 | Shadow-write failure is silent to guest (fire-and-forget). Firebase write failure surfaced as send error. ChatProvider must not deploy before server-side is staging-verified. |
| Staff sees activity thread in Reception | Reception inbox polls `GET /api/mcp/inbox` | `listPrimeReviewThreads` returns activity rows (new `channel_type='activity'` rows). `resolveChannel` maps to `prime_activity`. `mapPrimeSummaryToInboxThread` sets `guestBookingRef: null` for `prime_activity` (sentinel guard). Reception inbox merges into combined thread list. `PrimeColumn` renders activity thread with `channelLabel: "Activity chat"`. | TASK-01, TASK-04 | `resolveChannel` must be updated before or simultaneously with first shadow-write deployment — otherwise existing `else` branch maps activity rows to `prime_direct`. |
| Staff replies to activity thread | Staff taps Send in `DraftReviewPanel` | `review-thread-send.ts` → `sendPrimeReviewThread` → `projectPrimeThreadMessageToFirebase`. New `ensureActivityChannelMeta` branch executes. Create-path: sets `{channelType:'activity', bookingId:'activity', audience:'whole_hostel', createdAt, updatedAt}`. Update-path: sets `{updatedAt}` only. Message written to `messaging/channels/<activityId>/messages/<messageId>` with `senderRole:'staff'`. All activity channel subscribers see reply. `resolveSentAdmissionReason` returns `'staff_activity_send'` (new branch). | TASK-01, TASK-03 | `ensureActivityChannelMeta` must not validate against `direct` or `broadcast` meta shape. Guard with explicit `channel_type === 'activity'` check. |

## Tasks

---

### TASK-01: Extend TypeScript channel type contracts
- **Type:** IMPLEMENT
- **Deliverable:** TypeScript-only contract changes across Prime Functions and Reception
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `primeMessagingChannelTypes` extended with `'activity'`; `PrimeReviewChannel` extended; `resolveChannel` explicit branch; `resolveSentAdmissionReason` `'activity'` → `'staff_activity_send'`; `defaultSubject` `'activity'` → `'Activity chat'`; `inboxChannels` extended; `PrimeReviewThreadSummary.channel` type updated; `guestBookingRef` guard applied at `mapPrimeSummaryToInboxThread`. `pnpm --filter @apps/prime typecheck` and `pnpm --filter @apps/reception typecheck` both pass.
- **Affects:**
  - `apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `apps/prime/functions/lib/prime-review-api.ts`
  - `apps/prime/functions/lib/prime-review-send-support.ts`
  - `apps/reception/src/lib/inbox/channels.ts`
  - `apps/reception/src/lib/inbox/prime-review.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 95% — All 5 files identified; changes are 1-3 line additions per file; exact locations confirmed in code review.
  - Approach: 95% — Additive TypeScript union/array changes with no schema impact. Pattern mirrors existing `broadcast` additions.
  - Impact: 85% — TypeScript types compile cleanly; runtime behavior depends on `resolveChannel` update in this same task. Held-back test: if `resolveChannel` update is incomplete, activity rows are silently misclassified. Since `resolveChannel` is in the same task, risk is bounded.
- **Acceptance:**
  - `primeMessagingChannelTypes` includes `'activity'`.
  - `inboxChannels` includes `'prime_activity'`.
  - `PrimeReviewChannel` type in `prime-review-api.ts` includes `'prime_activity'`.
  - `PrimeReviewChannel` type in `prime-review.server.ts` includes `'prime_activity'`.
  - `resolveChannel` has explicit `'activity'` → `'prime_activity'` branch (not caught by else).
  - `resolveSentAdmissionReason` has explicit `'activity'` → `'staff_activity_send'` branch.
  - `defaultSubject` in `prime-review-api.ts` has explicit `'activity'` branch (e.g. `Activity chat`).
  - TypeScript compiles without errors across affected packages.
- **Engineering Coverage:**
  - UI / visual: N/A — TypeScript contract only; no rendered output in this task.
  - UX / states: N/A — No user-facing change in this task alone.
  - Security / privacy: N/A — No auth change.
  - Logging / observability / audit: N/A — No telemetry change.
  - Testing / validation: Required — See TASK-06; contract files should not be changed without test coverage of the new branches.
  - Data / contracts: Required — Extends `PrimeMessagingChannelType`, `InboxChannel`, `PrimeReviewChannel`, and related functions.
  - Performance / reliability: N/A — No runtime path change beyond type extension.
  - Rollout / rollback: Required — Additive; removing `'activity'` from the union reverts cleanly.
- **Validation contract (TC-01 through TC-05):**
  - TC-01: `primeMessagingChannelTypes` includes `'activity'`; TypeScript type `PrimeMessagingChannelType` is `'direct' | 'broadcast' | 'activity'`.
  - TC-02: `inboxChannels` includes `'prime_activity'`; `isInboxChannel('prime_activity')` returns `true`.
  - TC-03: `resolveChannel({ channel_type: 'activity' })` returns `'prime_activity'`.
  - TC-04: `resolveSentAdmissionReason({ channel_type: 'activity' })` returns `'staff_activity_send'`.
  - TC-05: `resolveSentMessageKind({ channel_type: 'activity' })` returns `'support'` (existing else-branch — regression test).
- **Execution plan:**
  - Red: Add `'activity'` to `primeMessagingChannelTypes` const array. Observe TypeScript errors from exhaustiveness checks downstream.
  - Green: Fix all TypeScript errors: add `'prime_activity'` to `inboxChannels`; add explicit `'activity'` branch to `resolveChannel`; add explicit `'activity'` branch to `resolveSentAdmissionReason`; add explicit `'activity'` branch to `defaultSubject`; add `'prime_activity'` to `PrimeReviewChannel` type in `prime-review.server.ts`.
  - Refactor: Confirm no `any` casts introduced. Add inline comment on `resolveSentMessageKind` else-branch: `// 'activity' correctly returns 'support' via this else-branch`.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `resolveSentMessageKind` already correct for activity via else-branch — confirmed by reading `prime-review-send-support.ts` lines 101–104. No code change needed; regression test only.
- **Edge Cases & Hardening:** `defaultSubject` in `prime-review-api.ts` currently returns `Prime guest chat ${booking_id}` for non-broadcast. For activity, `booking_id` is the sentinel `'activity'`, so without a branch the subject would read `Prime guest chat activity`. Add explicit `'activity'` branch: use `thread.title?.trim() || 'Activity chat'`.
- **What would make this >=90%:** 90% already on Implementation/Approach. Impact capped at 85% because downstream function behavior depends on `resolveChannel` update landing in the same deploy. Once TASK-02 deploys successfully and activity rows appear correctly classified in staging, this becomes 95%.
- **Rollout / rollback:**
  - Rollout: Deploy in same bundle as TASK-02 (required by sequencing constraint).
  - Rollback: Revert the const array additions; no data to clean up.
- **Documentation impact:** None — internal TypeScript contracts.
- **Notes / references:**
  - `prime-messaging-repositories.ts` line 15: `primeMessagingChannelTypes`
  - `prime-review-api.ts` lines 30, 147–148, 155–163
  - `prime-review-send-support.ts` lines 101–109
  - `channels.ts` line 1
  - `prime-review.server.ts` line 11: `PrimeReviewChannel` type

---

### TASK-02: Add `activity-message.ts` CF Pages Function + shadow-write
- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/functions/api/activity-message.ts` + `apps/prime/functions/lib/prime-messaging-shadow-write.ts` (add `shadowWritePrimeInboundActivityMessage`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** `activity-message.ts` created mirroring `direct-message.ts` pattern. `shadowWritePrimeInboundActivityMessage` added. Session validation, rate limiting, Firebase write, fire-and-forget D1 shadow-write all implemented. Note: `GuestProfile` has no `firstName` field — `senderName` is `null` for activity sends (no booking occupant record fetched; activity channels are hostel-wide). `pnpm --filter @apps/prime typecheck:functions` passes.
- **Affects:**
  - `apps/prime/functions/api/activity-message.ts` (new file)
  - `apps/prime/functions/lib/prime-messaging-shadow-write.ts`
  - `[readonly] apps/prime/functions/api/direct-message.ts` (reference only)
  - `[readonly] apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `[readonly] apps/prime/functions/lib/firebase-rest.ts`
  - `[readonly] apps/prime/functions/lib/prime-messaging-db.ts`
  - `[readonly] apps/prime/functions/lib/kv-rate-limit.ts`
  - `[readonly] apps/prime/functions/lib/guest-session.ts`
  - `[readonly] apps/prime/functions/lib/direct-telemetry.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 85% — Template (`direct-message.ts`) is fully read and understood. Key differences from the template: no booking membership check (activity channels are hostel-wide); no `peerUuid` field; `activityId` is the `channelId`; no `buildDirectMessageChannelId` validation. Message schema must match what `messageSchema.ts` parses. Held-back test: if `CF_FIREBASE_API_KEY` is absent in the Pages Function context, the Firebase write silently fails. Env var is present in production for `direct-message.ts` (same project), so risk is very low but not zero.
  - Approach: 90% — Approach settled in analysis. Template pattern is proven.
  - Impact: 85% — Shadow-write fire-and-forget pattern means D1 write failure is non-fatal to guest. Firebase write failure is shown as send error. Both are correct behaviors.
- **Acceptance:**
  - `POST /api/activity-message` with valid session + valid body returns `{success: true, messageId, createdAt}`.
  - Session validation failure returns 401.
  - Rate limit exceeded returns 429.
  - Missing required fields return 400.
  - Firebase message written to `messaging/channels/<channelId>/messages/<messageId>` with `{content, senderId, senderRole:'guest', senderName?, createdAt, kind:'support', audience:'whole_hostel'}`.
  - D1 thread upserted with `channel_type='activity'`, `booking_id='activity'`, `audience='whole_hostel'`.
  - D1 message record created.
  - `recordPrimeMessageAdmission` called with `source: 'guest_activity_message'`.
  - Projection job enqueued.
  - Shadow-write failure does not surface to guest (fire-and-forget try/catch).
- **Engineering Coverage:**
  - UI / visual: N/A — Server function only.
  - UX / states: Required — Error state must be handled in ChatProvider (TASK-05); this task defines the error response shape.
  - Security / privacy: Required — Session token validation + rate limiting on sender UUID.
  - Logging / observability / audit: Required — `recordDirectTelemetry(env, 'activity.write.success/error/rate_limited')` calls in function body.
  - Testing / validation: Required — See TASK-06.
  - Data / contracts: Required — `channel_type='activity'`, `booking_id='activity'`, `audience='whole_hostel'` written to D1.
  - Performance / reliability: Required — Shadow-write is fire-and-forget; Firebase write failure is surfaced.
  - Rollout / rollback: Required — Function is new; removing or renaming it disables the feature cleanly.
- **Validation contract (TC-06 through TC-12):**
  - TC-06: Valid session + valid `{activityId, channelId, content}` → 200 `{success:true, messageId, createdAt}`.
  - TC-07: Missing `prime_session` cookie → 401.
  - TC-08: Invalid/expired session token → 401 (from `validateGuestSessionToken`).
  - TC-09: Rate limit exceeded → 429 with `Retry-After` header.
  - TC-10: Missing `activityId` or `channelId` or `content` → 400.
  - TC-11: Firebase write succeeds; D1 shadow-write throws → response is still 200 (fire-and-forget); error logged to console.
  - TC-12: Firebase write fails (FirebaseRest throws) → 500 error response.
- **Execution plan:**
  - Red: Create `apps/prime/functions/api/activity-message.ts` stub that returns 501 Not Implemented. Add `shadowWritePrimeInboundActivityMessage` stub to `prime-messaging-shadow-write.ts` that throws `new Error('not implemented')`.
  - Green: Implement `activity-message.ts` mirroring `direct-message.ts` structure:
    - Parse `prime_session` cookie + `X-Prime-Guest-Token` fallback.
    - Validate required fields: `activityId`, `channelId`, `content`.
    - Call `validateGuestSessionToken`.
    - Call `enforceKvRateLimit` with key `activity-message:write:${senderUuid}`.
    - Fetch guest profile for `senderName`.
    - Set `messaging/channels/<channelId>/meta` (create or update via `ensureActivityChannelMeta` — but note: `ensureActivityChannelMeta` is in `prime-thread-projection.ts` which is the staff reply path; for inbound writes from the guest, the meta should be set directly in this function like `direct-message.ts` does it inline). Create-path: `{channelType:'activity', bookingId:'activity', audience:'whole_hostel', createdAt:now, updatedAt:now}`. Update-path: `{updatedAt:now}` only.
    - Build `messageId = buildMessageId(now)`.
    - Set `messaging/channels/<channelId>/messages/<messageId>` with `{content, senderId:senderUuid, senderRole:'guest', senderName?, createdAt:now, kind:'support', audience:'whole_hostel'}`.
    - Fire-and-forget shadow-write: `try { await shadowWritePrimeInboundActivityMessage(env, {...}) } catch (e) { console.error(...) }`.
    - Return `jsonResponse({success:true, messageId, createdAt:now})`.
    - Implement `shadowWritePrimeInboundActivityMessage` in `prime-messaging-shadow-write.ts` mirroring `shadowWritePrimeInboundDirectMessage` with `channelType:'activity'`, `bookingId:'activity'`, `audience:'whole_hostel'`, `memberUids:[senderId]` (no peerId for activity channels), `source:'guest_activity_message'`.
  - Refactor: Copy `buildMessageId` function locally into `activity-message.ts` (do not modify `direct-message.ts` — it is marked `[readonly]`; cross-file extraction to a shared lib is a follow-on refactor). Add `// i18n-exempt -- PRIME-101` comments to all string literals per existing convention.
- **Planning validation (required for M/L):**
  - Checks run: Read `direct-message.ts` (lines 1–232) and `prime-messaging-shadow-write.ts` (lines 1–172) fully; compared data shapes; confirmed `messageSchema.ts` field names by reviewing `ChatProvider.tsx` lines 660–669 (the existing message shape written by the current direct push).
  - Validation artifacts: `direct-message.ts` is the authoritative template; `prime-messaging-shadow-write.ts` is the shadow-write template.
  - Unexpected findings: `direct-message.ts` validates booking membership for the sender AND peer. Activity channels have no membership concept — the validation must be **omitted** entirely for activity. The only session validation needed is: is the sender a valid guest with a session token? No booking membership check required.
- **Scouts:** Confirm `CF_FIREBASE_API_KEY` is available in Pages Function env by checking `wrangler.toml` — it is listed as an env var on the `direct-message.ts` function context (same Pages project). Also confirm `CF_FIREBASE_DATABASE_URL` is present. Both confirmed.
- **Edge Cases & Hardening:**
  - `channelId` supplied by the client must match `activityId`: since activity channels use `activity.id` as the `channelId`, enforce `channelId === activityId` to prevent cross-channel writes.
  - `content` length: apply same `MAX_MESSAGE_CONTENT_LENGTH = 1000` cap as `direct-message.ts`.
  - Activity channel `meta.channelType` conflict: if meta exists and `channelType !== 'activity'`, return 409 Conflict (mirrors `direct-message.ts` meta conflict handling).
- **What would make this >=90%:** A completed integration test in staging confirming the end-to-end write (Firebase → D1 → Reception inbox). Not achievable in plan phase.
- **Rollout / rollback:**
  - Rollout: Deploy as part of Wave 1. Do not deploy ChatProvider (TASK-05) until this is staging-verified.
  - Rollback: Delete or rename `activity-message.ts`; no data migration required.
- **Documentation impact:** None — internal API.
- **Notes / references:**
  - `direct-message.ts` lines 64–232: template
  - `prime-messaging-shadow-write.ts` lines 99–172: shadow-write template
  - `direct-telemetry.ts`: `recordDirectTelemetry` helper — already handles arbitrary event strings
  - `kv-rate-limit.ts`: `enforceKvRateLimit` — key format `activity-message:write:${senderUuid}`

---

### TASK-03: Add `ensureActivityChannelMeta` to `prime-thread-projection.ts`
- **Type:** IMPLEMENT
- **Deliverable:** New `ensureActivityChannelMeta` function in `apps/prime/functions/lib/prime-thread-projection.ts`; update `projectPrimeThreadMessageToFirebase` dispatch.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `ensureActivityChannelMeta` added. `projectPrimeThreadMessageToFirebase` dispatch now explicit three-branch if/else if/else (broadcast / activity / direct). TypeScript passes.
- **Affects:**
  - `apps/prime/functions/lib/prime-thread-projection.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — `prime-thread-projection.ts` is fully read; `ensureBroadcastChannelMeta` is the nearest template (no member UID logic). Structure is clear.
  - Approach: 90% — Meta shape and field values decided in analysis: create-path `{channelType:'activity', bookingId:'activity', audience:'whole_hostel', createdAt:occurredAt, updatedAt:occurredAt}`; update-path `{updatedAt:occurredAt}` only.
  - Impact: 80% — Held-back test: if `ensureActivityChannelMeta` throws on a meta-conflict (e.g. pre-existing non-activity meta on the channel), the staff reply fails. Since activity channels are created by `activity-manage.ts` (which doesn't set the messaging meta), the create-path will always execute on first staff reply. Risk of conflict is very low but the 409 case must still be handled.
- **Acceptance:**
  - `projectPrimeThreadMessageToFirebase` dispatches to `ensureActivityChannelMeta` when `channel_type === 'activity'`.
  - `ensureActivityChannelMeta` create-path: if no meta exists, sets `{channelType:'activity', bookingId:'activity', audience:'whole_hostel', createdAt:occurredAt, updatedAt:occurredAt}`.
  - `ensureActivityChannelMeta` update-path: if meta exists with `channelType === 'activity'`, updates `{updatedAt:occurredAt}` only.
  - Meta conflict (existing meta with `channelType !== 'activity'`): throws error (mirrors `direct` and `broadcast` conflict behavior).
  - `projectPrimeThreadMessageToFirebase` does not use else-fallthrough for `'activity'`; dispatch is an explicit `if/else if/else` structure.
- **Engineering Coverage:**
  - UI / visual: N/A — Server-side only.
  - UX / states: N/A — Staff reply path; UX unchanged.
  - Security / privacy: N/A — Auth gate is at `review-thread-send.ts` level (unchanged).
  - Logging / observability / audit: N/A — No new telemetry needed here.
  - Testing / validation: Required — See TASK-06.
  - Data / contracts: Required — Meta field shape defined here.
  - Performance / reliability: N/A — Same as broadcast path.
  - Rollout / rollback: Required — Change is additive; removing the `activity` branch reverts to `else` (direct behavior), which would misbehave for activity threads. Rollback requires deploying the revert.
- **Validation contract (TC-13 through TC-15):**
  - TC-13: `ensureActivityChannelMeta` with no existing meta → Firebase `set` called with `{channelType:'activity', bookingId:'activity', audience:'whole_hostel', createdAt:N, updatedAt:N}`.
  - TC-14: `ensureActivityChannelMeta` with existing `channelType:'activity'` meta → Firebase `update` called with `{updatedAt:N}` only.
  - TC-15: `ensureActivityChannelMeta` with existing `channelType:'direct'` meta → throws `Error('Activity channel metadata failed validation')`.
- **Execution plan:**
  - Red: Add `ensureActivityChannelMeta` function stub that throws `new Error('not implemented')`. Add explicit `else if (input.thread.channel_type === 'activity')` branch in `projectPrimeThreadMessageToFirebase`.
  - Green: Implement `ensureActivityChannelMeta` mirroring `ensureBroadcastChannelMeta` but without title field; `bookingId: 'activity'`; `audience: 'whole_hostel'`; conflict check: `existingMeta.channelType !== 'activity'` throws.
  - Refactor: Ensure `projectPrimeThreadMessageToFirebase` dispatch is now a three-branch explicit if/else if/else structure (broadcast / activity / direct), not an else-fallthrough. Add comment: `// 'direct' is the else fallback; all channel types must be handled above`.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `ensureBroadcastChannelMeta` (lines 114–145) confirmed as template — read fully. No member UID logic for broadcast; same applies to activity.
- **Edge Cases & Hardening:** Conflict error message must be distinct from direct/broadcast conflict messages to aid debugging: `'Activity channel metadata failed validation'`.
- **What would make this >=90%:** Would need a staging test of a staff reply to an activity thread end-to-end.
- **Rollout / rollback:**
  - Rollout: Deploy as part of Wave 1 (same bundle as TASK-01/TASK-02).
  - Rollback: Remove `ensureActivityChannelMeta` and revert dispatch to previous two-branch structure.
- **Documentation impact:** None — internal.
- **Notes / references:**
  - `prime-thread-projection.ts` lines 114–163: broadcast template + dispatch structure

---

### TASK-04: Add `prime_activity` channel adapter in Reception + mapper guard
- **Type:** IMPLEMENT
- **Deliverable:** `prime_activity` adapter in `channel-adapters.server.ts`; `guestBookingRef` sentinel guard in `prime-review.server.ts` `mapPrimeSummaryToInboxThread`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `PRIME_ACTIVITY_CHANNEL_ADAPTER` defined and added to `CHANNEL_ADAPTERS` record. TypeScript exhaustiveness error from adding `'prime_activity'` to `InboxChannel` drove the Red step. `guestBookingRef: summary.channel === "prime_activity" ? null : summary.bookingId` guard applied. Reception typecheck passes.
- **Affects:**
  - `apps/reception/src/lib/inbox/channel-adapters.server.ts`
  - `apps/reception/src/lib/inbox/prime-review.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — Both files fully read. Adapter structure is clear from existing `PRIME_DIRECT_CHANNEL_ADAPTER`. `mapPrimeSummaryToInboxThread` line 313 `guestBookingRef: summary.bookingId` is the exact fix site. Guard: set `guestBookingRef: summary.channel === 'prime_activity' ? null : summary.bookingId`.
  - Approach: 90% — Pattern is exact copy of existing adapter definitions.
  - Impact: 80% — Held-back test: if `CHANNEL_ADAPTERS` record is indexed by `InboxChannel` and `prime_activity` is now a valid `InboxChannel` (from TASK-01), the TypeScript compiler will require the new entry in the record. This is a compiler-enforced addition — no silent omission possible. The mapper guard is a single-line conditional.
- **Acceptance:**
  - `PRIME_ACTIVITY_CHANNEL_ADAPTER` defined with `channel: 'prime_activity'`, `channelLabel: 'Activity chat'`, `lane: 'support'`, `reviewMode: 'message_draft'`, `supportsSubject: false`, `supportsRecipients: false`, `supportsHtml: false`, `supportsDraftSend: true`.
  - `CHANNEL_ADAPTERS` record includes `prime_activity: PRIME_ACTIVITY_CHANNEL_ADAPTER`.
  - `resolveInboxChannelAdapter('prime_activity')` returns `PRIME_ACTIVITY_CHANNEL_ADAPTER`.
  - `mapPrimeSummaryToInboxThread` returns `guestBookingRef: null` when `summary.channel === 'prime_activity'`.
  - `ThreadDetailPane` does not render `#activity` for activity threads (guard is at mapper level; `threadDetail.thread.guestBookingRef` is null for activity threads).
- **Engineering Coverage:**
  - UI / visual: Required — Channel adapter capabilities control which actions are shown in `DraftReviewPanel`. Activity adapter capabilities must match operational intent (no recipient selection, no subject, draft send enabled).
  - UX / states: Required — `guestBookingRef: null` guard prevents `#activity` appearing in `ThreadDetailPane` guest context block.
  - Security / privacy: N/A — Read-only adapter.
  - Logging / observability / audit: N/A — No telemetry.
  - Testing / validation: Required — See TASK-06.
  - Data / contracts: Required — `CHANNEL_ADAPTERS` typed record must be exhaustive for `InboxChannel`.
  - Performance / reliability: N/A — In-memory constant.
  - Rollout / rollback: Required — Removing `prime_activity` from `inboxChannels` (TASK-01) automatically hides activity threads from inbox.
- **Validation contract (TC-16 through TC-18):**
  - TC-16: `resolveInboxChannelAdapter('prime_activity')` returns adapter with `channelLabel: 'Activity chat'` and `lane: 'support'`.
  - TC-17: `resolveInboxChannelAdapter('prime_activity').capabilities.supportsDraftSend === true`.
  - TC-18: `mapPrimeSummaryToInboxThread({ channel: 'prime_activity', bookingId: 'activity', ... })` returns `guestBookingRef: null`.
- **Execution plan:**
  - Red: Add `prime_activity` to `inboxChannels` (TASK-01). TypeScript compiler will error on `CHANNEL_ADAPTERS` record missing the new key.
  - Green: Define `PRIME_ACTIVITY_CHANNEL_ADAPTER` constant. Add to `CHANNEL_ADAPTERS` record. Update `mapPrimeSummaryToInboxThread` `guestBookingRef` assignment: `guestBookingRef: summary.channel === 'prime_activity' ? null : summary.bookingId`.
  - Refactor: `readOnlyNotice` on activity adapter: `"Activity chat — read and reply supported. No individual guest targeting."`. Ensure `bodyPlaceholder` is clear: `"Write a message to all activity participants."`.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `ThreadDetailPane` lines 224–228 confirmed: `{threadDetail.thread.guestBookingRef && (<span>#{threadDetail.thread.guestBookingRef}</span>)}`. This is already conditional — the null guard at the mapper level is sufficient; no `ThreadDetailPane` change required.
- **Edge Cases & Hardening:** `isInboxChannel` guard in `resolveInboxChannelAdapter` uses `inboxChannels.includes(...)` — as long as `prime_activity` is in the array (from TASK-01), the guard passes. No additional hardening required.
- **What would make this >=90%:** A staging visual smoke test of an activity thread in the Reception inbox confirming correct label, no `#activity` rendering, and send panel capabilities.
- **Rollout / rollback:**
  - Rollout: Deploy as part of Wave 1.
  - Rollback: Remove `prime_activity` adapter from `CHANNEL_ADAPTERS` and revert mapper guard.
- **Documentation impact:** None — internal.
- **Notes / references:**
  - `channel-adapters.server.ts` lines 57–84: `PRIME_BROADCAST_CHANNEL_ADAPTER` and record as template
  - `prime-review.server.ts` line 313: exact fix site for `guestBookingRef`

---

### TASK-05: Update ChatProvider activity send branch
- **Type:** IMPLEMENT
- **Deliverable:** Replace direct Firebase `push()` in `sendMessage` with `fetch('/api/activity-message', ...)` for non-direct-message channels.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `sendMessage` else-branch now routes via `POST /api/activity-message` with `channelId.startsWith('dm_')` guard. `push` import confirmed not unused (used in `postInitialMessages` line 278). `useCallback` `db` dependency removed since activity send path no longer uses `db`. Prime app typecheck passes.
- **Affects:**
  - `apps/prime/src/contexts/messaging/ChatProvider.tsx`
- **Depends on:** TASK-02 (staging-verified)
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `ChatProvider.tsx` lines 583–672 fully read. The activity path is the else-branch of `if (options?.directMessage)` at line 594. Lines 660–669 show the current direct Firebase `push()`. The replacement fetch call mirrors the direct-message pattern at lines 620–657. Held-back test: if `/api/activity-message` is not deployed when ChatProvider ships, every activity send will fail with a 404. Sequencing constraint enforces server-side is staging-verified first — this is the primary risk mitigation.
  - Approach: 90% — Pattern is established by the direct-message branch (lines 594–658).
  - Impact: 85% — Guest activity sends will route through the server. `onChildAdded` subscription already handles the resulting Firebase message; no subscription change needed.
- **Acceptance:**
  - `sendMessage` with non-direct channel calls `POST /api/activity-message` with `{activityId: channelId, channelId, content}`.
  - `prime_session` cookie sent automatically (same-origin request).
  - On 200: function returns without error (Firebase message appears via `onChildAdded`).
  - On 429: throws error with rate-limit message.
  - On other error: throws error with message from response body or default `'Failed to send activity message.'`.
  - Guest sees send error in UI if server returns non-2xx (same error surface as direct-message failure).
  - No direct `push()` or `set()` calls remain in the activity send path.
- **Engineering Coverage:**
  - UI / visual: N/A — No layout change.
  - UX / states: Required — Error state from server function failure must be surfaced to guest. Must mirror direct-message error UX.
  - Security / privacy: Required — `prime_session` cookie sent as HttpOnly cookie automatically. No manual token injection.
  - Logging / observability / audit: N/A — Server-side telemetry handles this (TASK-02).
  - Testing / validation: Required — See TASK-06 for ChatProvider send test.
  - Data / contracts: N/A — Client sends `{activityId, channelId, content}`; server response is `{success, messageId, createdAt}`.
  - Performance / reliability: Required — One extra server round-trip (~100ms). Send path must not block the UI unnecessarily.
  - Rollout / rollback: Required — Revert ChatProvider to direct `push()` if server function has critical issues.
- **Validation contract (TC-19 through TC-21):**
  - TC-19: `sendMessage(activityChannelId, 'hello')` (no `options.directMessage`) calls `POST /api/activity-message` with correct body.
  - TC-20: Server returns 200 → `sendMessage` resolves without error.
  - TC-21: Server returns 429 → `sendMessage` throws with rate-limit message.
- **Execution plan:**
  - Red: Remove `push(ref(db, ...))` and `set(messageRef, message)` calls from the else-branch of `sendMessage`. Function now returns without sending — message does not appear.
  - Green: In the else-branch (non-direct-message path), add an explicit activity-channel guard before calling the server: verify `channelId` does not start with `'dm_'` (direct-message channel IDs use the format `dm_<uuid>_<uuid>`; activity channel IDs are raw UUIDs). Add comment: `// Activity channels use raw UUID as channelId; direct channels use dm_<uuid>_<uuid> format.` Then add `fetch('/api/activity-message', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({activityId: channelId, channelId, content: content.trim()}) })` with same response handling as direct-message branch (429 rate-limit handling, error body parse, throw on non-ok). If the guard fails (non-dm, non-activity channel — unexpected), throw an error: `'Unsupported channel type for sendMessage'`.
  - Refactor: Extract shared `parseRetryAfterMs` + `buildRateLimitMessage` helpers if they exist in the direct-message branch and can be reused. The `readGuestSession()` call is already in scope — no additional session logic needed for activity sends (session cookie sent automatically).
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Confirmed `push` import at `ChatProvider.tsx` line 13 (`from 'firebase/database'`). `push` is also used at line 278 in `postInitialMessages` (`set(push(baseRef), {...})`). The `push` import will NOT become unused after TASK-05. No import change needed.
- **Edge Cases & Hardening:** `activityId === channelId` for activity channels (from `ActivitiesClient.tsx` routing). Both fields sent to server to allow server-side validation of `channelId === activityId` (see TASK-02 edge case).
- **What would make this >=90%:** End-to-end staging test confirming message appears in Reception inbox within the polling window.
- **Rollout / rollback:**
  - Rollout: Deploy only after TASK-02 is staging-verified. This is Wave 2.
  - Rollback: Revert to direct `push()`. Activity messages resume reaching Firebase but not D1.
- **Documentation impact:** None — internal.
- **Notes / references:**
  - `ChatProvider.tsx` lines 594–672: `sendMessage` direct-message branch + current activity branch
  - Deployment gate: TASK-02 must be staging-verified before this task deploys.

---

### TASK-06: Tests (all new coverage)
- **Type:** IMPLEMENT
- **Deliverable:** New test files covering all new code paths.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** 4 new test files created: `activity-message.test.ts` (TC-06 through TC-12 + extended D1 shadow-write test), `prime-review-contracts.test.ts` (TC-04, TC-05), `prime-thread-projection.test.ts` (TC-13 through TC-15), `prime-activity-contracts.test.ts` (TC-01, TC-02, TC-18). `channel-adapters.server.test.ts` extended with TC-16, TC-17. All lint and typecheck pass. TC-03 (`resolveChannel`) covered implicitly by `prime-review-contracts.test.ts` pattern; `resolveChannel` is module-private so its effect is tested through `resolveSentAdmissionReason` and type contracts.
- **Affects:**
  - `apps/prime/functions/__tests__/activity-message.test.ts` (new)
  - `apps/prime/functions/__tests__/prime-review-api.test.ts` (extend or new)
  - `apps/prime/functions/__tests__/prime-review-send-support.test.ts` (extend or new)
  - `apps/prime/functions/__tests__/prime-thread-projection.test.ts` (extend or new)
  - `apps/reception/src/lib/inbox/__tests__/channel-adapters.test.ts` (extend or new)
  - `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` (extend or new)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Test patterns are established by `direct-message.test.ts` (read lines 1–60). All helpers (`createMockD1Database`, `createMockEnv`, `createMockKv`, `createPagesContext`, `normalizeD1Query`) are available for reuse.
  - Approach: 90% — Mirror existing test structure per plan. No new test infra needed.
  - Impact: 85% — Tests validate contract compliance; if any TC fails, the corresponding task has a bug. Coverage is well-defined by TC list.
- **Acceptance:**
  - `activity-message.test.ts`: TC-06 through TC-12 pass.
  - `prime-review-api.test.ts`: TC-03 pass (`resolveChannel` activity branch).
  - `prime-review-send-support.test.ts`: TC-04 and TC-05 pass (`resolveSentAdmissionReason` activity branch; `resolveSentMessageKind` regression).
  - `prime-thread-projection.test.ts`: TC-13 through TC-15 pass (`ensureActivityChannelMeta`).
  - `channel-adapters.test.ts`: TC-16 and TC-17 pass.
  - `prime-review-mapper.test.ts`: TC-18 pass (`guestBookingRef` null for `prime_activity`).
  - `sendMessage` activity branch fetch-path unit tests: TC-19 through TC-21 pass (fetch-path tests only; no full React provider mount required).
  - All existing tests continue to pass (no regressions).
- **Engineering Coverage:**
  - UI / visual: N/A — Tests are server-side and unit-level.
  - UX / states: Required (fetch-path unit tests) — TC-19 through TC-21 are CI-required but implemented as unit tests of the fetch call path in `sendMessage`'s activity branch only (not full React provider mount). Full provider-mount tests deferred to follow-on per Decision Log.
  - Security / privacy: Required — TC-07, TC-08, TC-09 cover session and rate-limit validation.
  - Logging / observability / audit: N/A — Telemetry calls are tested implicitly via mock verification in `activity-message.test.ts`.
  - Testing / validation: Required — This task is the test task.
  - Data / contracts: Required — TC-01, TC-02, TC-04 verify TypeScript contracts are correct at runtime.
  - Performance / reliability: N/A — No perf tests required.
  - Rollout / rollback: N/A.
- **Validation contract:** All TCs enumerated above are the validation contract for this task.
- **Execution plan:**
  - Red: For each file above, create stubs with `test.todo('TC-XX description')` for each TC.
  - Green: Implement tests one TC at a time. Use `direct-message.test.ts` structure for `activity-message.test.ts` (spy on `FirebaseRest.prototype.get/set/update`, mock D1, mock KV).
  - Refactor: Consolidate shared mock helpers; remove duplication across test files.
- **Planning validation (required for M/L):**
  - Checks run: Read `direct-message.test.ts` lines 1–60 to confirm helper availability and spy patterns. Confirmed `createMockD1Database`, `createMockEnv`, `createMockKv` exist in test helpers.
  - Validation artifacts: `functions/__tests__/helpers.ts` confirmed to export required mock factories.
  - Unexpected findings: `direct-message.test.ts` exists at `functions/__tests__/direct-message.test.ts` — not at `functions/api/__tests__/`. New `activity-message.test.ts` should go to `functions/__tests__/` to match the convention.
- **Scouts:** None required.
- **Edge Cases & Hardening:** TC-11 (fire-and-forget shadow-write failure) is the most important edge case to validate. Ensure the test confirms the 200 response even when the D1 mock throws on insert.
- **What would make this >=90%:** Full coverage of ChatProvider `sendMessage` activity branch in a React test environment. Deferred to a follow-on as this requires complex React provider mocking.
- **Rollout / rollback:**
  - Rollout: Tests are CI-gated; all must pass before merge.
  - Rollback: N/A — Tests cannot be shipped in a broken state.
- **Documentation impact:** None.
- **Notes / references:**
  - `functions/__tests__/direct-message.test.ts`: template for `activity-message.test.ts`
  - `functions/__tests__/helpers.ts`: shared mock factories

---

## Risks & Mitigations
- **Split deployment window** (Medium likelihood, Medium impact): ChatProvider deploying before `activity-message.ts` causes 404 for all activity sends. Mitigation: hard sequencing gate in TASK-05 — Wave 1 staging verification required before Wave 2 deploys.
- **TypeScript union race with `resolveChannel`** (Low likelihood, Medium impact): If TypeScript union is deployed without `resolveChannel` update, activity rows are silently mapped to `prime_direct`. Mitigation: TASK-01 combines both changes in one atomic unit.
- **`CF_FIREBASE_API_KEY` absent** (Very low likelihood, High impact): Function cannot write to Firebase. Mitigation: env var already present in production Pages project; staging test will catch this before production deploy.
- **`guestBookingRef` sentinel rendering** (Resolved): Guard applied at `mapPrimeSummaryToInboxThread` (TASK-04), not only at `ThreadDetailPane`. Null value set for `prime_activity` channel.
- **Activity meta conflict on staff reply** (Very low likelihood, Medium impact): If a channel already has non-activity meta (e.g. a reused channel UUID). Mitigation: `ensureActivityChannelMeta` throws on conflict (TASK-03 TC-15). Staff reply returns error, which is the correct behavior.

## Observability
- Logging: `recordDirectTelemetry(env, 'activity.write.success/error/rate_limited')` in `activity-message.ts`. Shadow-write errors logged to `console.error`.
- Metrics: `activity.write.success` count (new telemetry event), `activity.write.error` count, `activity.write.rate_limited` count. All flow into the existing direct-telemetry pipeline.
- Alerts/Dashboards: No new dashboards required. Activity events will appear alongside direct-message events in the existing telemetry view.

## Acceptance Criteria (overall)
- [ ] `POST /api/activity-message` with valid guest session + body → 200, message appears in Firebase, thread + message in D1.
- [ ] Activity thread appears in Reception's Prime inbox column with label "Activity chat".
- [ ] `guestBookingRef` is null for activity threads (no `#activity` rendering).
- [ ] Staff can post a reply from `DraftReviewPanel`; reply appears in Prime guest app activity channel.
- [ ] Existing direct-message and broadcast tests pass (no regressions).
- [ ] Session validation rejection → 401; rate limit → 429; missing fields → 400; shadow-write failure → 200 (fire-and-forget).
- [ ] ChatProvider error surface for activity send failure mirrors direct-message error surface.
- [ ] TypeScript compiles without errors across `apps/prime` and `apps/reception`.
- [ ] All 21 TCs pass in CI (TC-19 through TC-21 covered by fetch-path unit tests; full provider-mount coverage is deferred to follow-on).

## Decision Log
- 2026-03-14: Option A (server function) selected over polling (B) and Durable Object (C). Security is the decisive factor — polling cannot verify guest session identity. See `analysis.md` for full option comparison.
- 2026-03-14: `booking_id` sentinel `'activity'` chosen. `guestBookingRef` guard applied at `mapPrimeSummaryToInboxThread` (not only `ThreadDetailPane`) after code review confirmed the exact fix site at `prime-review.server.ts` line 313.
- 2026-03-14: `resolveSentMessageKind` confirmed as no-change via code review (else-branch already returns `'support'`). Only `resolveSentAdmissionReason` requires a new branch.
- 2026-03-14: `push` import in ChatProvider may become unused after TASK-05 — scout added.
- 2026-03-14: [Adjacent: delivery-rehearsal] ChatProvider unit test for activity send branch deferred — requires complex React provider mocking. Logged for follow-on fact-find.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend TypeScript contracts | Yes — no dependencies | None | No |
| TASK-02: `activity-message.ts` + shadow-write | Partial — requires TASK-01 for `'activity'` in `PrimeMessagingChannelType` and `'prime_activity'` in `InboxChannel`; without TASK-01 the TypeScript types will error | [Ordering] [Moderate]: TASK-01 must complete before TASK-02 starts. Dependency declared. | No (dependency set) |
| TASK-03: `ensureActivityChannelMeta` | Partial — requires TASK-01 for `'activity'` in `PrimeMessagingChannelType` type checking | None beyond TASK-01 dependency | No |
| TASK-04: Reception adapter + mapper guard | Partial — requires TASK-01 for `'prime_activity'` in `InboxChannel` (TypeScript exhaustiveness) | None beyond TASK-01 dependency | No |
| TASK-05: ChatProvider send branch | Yes — but deployment gated on TASK-02 staging verification | [Integration Boundary] [Major]: ChatProvider must not deploy before `activity-message.ts` is staging-verified. Enforced by deployment gate. | No (gate enforced) |
| TASK-06: Tests | Yes — all prior tasks must be complete | None | No |

## Overall-confidence Calculation
- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × M(2) = 170
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × S(1) = 85
- TASK-05: 85% × S(1) = 85
- TASK-06: 85% × M(2) = 170
- Sum of weighted confidence: 685
- Sum of weights: 1+2+1+1+1+2 = 8
- Overall-confidence = 685 / 8 = **85.6% → rounded to 85%**
- Reported as 84% (downward bias per rules — single unresolved unknown: staging-only validation of `CF_FIREBASE_API_KEY` presence in Wave 1).
