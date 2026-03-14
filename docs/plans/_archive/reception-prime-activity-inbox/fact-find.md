---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-activity-inbox
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-prime-activity-inbox/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314140000-BRIK-001
Trigger-Why: Staff cannot see or respond to guest messages in activity group chats; the messages are invisible to Reception.
Trigger-Intended-Outcome: type: operational | statement: Activity channel messages are shadow-written to the Prime D1 messaging DB, surfaced in Reception's Prime column, and staff can reply via the existing send path.
---

# Reception Prime Activity Inbox — Fact-Find Brief

## Scope

### Summary

The Prime guest app supports activity-based group chat channels (e.g. yoga, group dinner). Guests post messages to Firebase RTDB paths under `messaging/channels/<activityInstanceId>/messages`. These messages are read by the guest app but are never shadow-written to the Prime D1 `PRIME_MESSAGING_DB`, so Reception has no visibility. Reception's inbox currently knows three channel types: `email`, `prime_direct`, and `prime_broadcast`. An `activity` channel type does not exist in any layer. This work adds a complete pipeline: shadow-write activity messages to D1 → add a `prime_activity` channel type to Reception → surface activity threads in the Prime column → enable staff reply via the existing `review-thread-send.ts` path with a Firebase write using the existing `CF_FIREBASE_API_KEY` REST auth token.

### Goals
- Shadow-write inbound activity messages to `PRIME_MESSAGING_DB` (new CF Pages Function or extended trigger).
- Add `prime_activity` channel type across all layers where `prime_direct` and `prime_broadcast` exist.
- Show activity threads in Reception's Prime inbox column alongside `prime_direct` threads.
- Allow staff to reply to activity threads; reply is projected back to Firebase via the existing `projectPrimeThreadMessageToFirebase` path.

### Non-goals
- Automated AI draft generation for activity channels (can be added later; not in scope).
- Presence tracking changes or attendance lifecycle.
- Modifying the Firebase RTDB security rules (existing rules already permit `messaging` read+write for any `auth != null`, which the service account satisfies).
- Reception displaying the full activity roster or RSVP status.

### Constraints & Assumptions
- Constraints:
  - Prime D1 `message_threads.channel_type` is `TEXT NOT NULL`. The schema comment `-- direct|broadcast` is documentation only — SQLite has no CHECK constraint. Adding `'activity'` requires no schema migration; the change is TypeScript-side only (add to the `PrimeMessagingChannelType` union and update code that branches on this value).
  - The existing `resolveChannel` function in `prime-review-api.ts` maps `else` to `prime_direct`. A new explicit branch is needed for `activity`.
  - The `PrimeMessagingChannelType` union in `prime-messaging-repositories.ts` is `['direct', 'broadcast']` — needs `activity` added.
  - Firebase RTDB rules at `messaging.write: "auth != null"` already permit staff-service-account writes to activity channel message nodes.
- Assumptions:
  - Each `ActivityInstance.id` is used verbatim as the Firebase `channelId` under `messaging/channels/<id>`.
  - Activity IDs do not collide with `dm_*` or `broadcast_*` prefixes; they are `crypto.randomUUID()` values set in `activity-manage.ts` at creation time.
  - The existing `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` env vars available to `activity-manage.ts` are also available in the new shadow-write function context (same Pages Function environment).
  - `bookingId` is not intrinsically tied to an activity channel (activities are hostel-wide), so a synthetic or nullable `booking_id` value is needed in `message_threads`. The activity instance `createdBy` field and presence data could provide a guest's booking context, but the simpler initial model uses a constant like `hostel` or the activity instance ID.

## Outcome Contract

- **Why:** Staff have no visibility into activity group chats. Guest questions or issues posted to activity channels go unnoticed. This creates a service gap for a running feature.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity channel messages appear in Reception's Prime inbox column within the same polling window as direct messages. Staff can read full conversation history and post replies that appear in the guest app.
- **Source:** operator

## Current Process Map

**Trigger:** A guest posts a message to an activity channel in the Prime guest app.

### Process Area 1 — Guest sends an activity message

1. Guest opens `/activities` → taps a live activity → routed to `/chat/channel?id=<activityInstanceId>`.
2. `ChatProvider.sendMessage(channelId, content)` is called. Because no `directMessage` option is passed, the activity path fires: `push(ref(db, 'messaging/channels/<activityInstanceId>/messages'))` directly to Firebase RTDB.
3. Message is written to `messaging/channels/<activityInstanceId>/messages/<pushKey>` with fields `{content, senderId, senderRole:'guest', senderName, createdAt}`.
4. **No shadow-write occurs.** There is no CF Pages Function for activity messages analogous to `direct-message.ts`. The message exists only in Firebase.

### Process Area 2 — ChatProvider reads activity messages

5. In the guest app, `ChatProvider` subscribes to `messaging/channels/<activeChannelId>/messages` via `onChildAdded`. Activity instances are fetched via `onValue` on `messaging/activities/instances` filtered to `status` in `['live','upcoming']`.
6. Activity message reads are Firebase-client-only (browser SDK). No API route proxies activity message reads.

### Process Area 3 — Reception inbox loads threads

7. Reception `/api/mcp/inbox` calls `listPrimeInboxThreadSummaries()` (Reception-side) which calls `listPrimeReviewThreadSummaries()` on the Prime messaging DB via `review-threads.ts` → `listPrimeReviewThreads(db)` SQL.
8. `listPrimeReviewThreads` queries `message_threads` filtered by `review_status NOT IN ('resolved','sent','auto_archived')`. No `channel_type` filter exists, so if `activity` rows existed they would be returned. They do not yet exist.
9. `resolveChannel(thread)` maps `channel_type === 'broadcast' ? 'prime_broadcast' : 'prime_direct'`. An `activity` type would incorrectly fall through to `prime_direct`.

### Process Area 4 — Staff replies to a Prime direct thread

10. Staff composes reply in `DraftReviewPanel`. Reception calls `review-thread-send.ts` → `sendPrimeReviewThread()`.
11. `sendPrimeReviewThread` creates a `message_records` row in D1 with `sender_role: 'staff'`, then calls `projectPrimeThreadMessageToFirebase()`.
12. `projectPrimeThreadMessageToFirebase` calls `ensureDirectChannelMeta` or `ensureBroadcastChannelMeta` depending on `channel_type`, then writes to `messaging/channels/<threadId>/messages/<messageId>`. For the activity case, a third branch `ensureActivityChannelMeta` would be needed.

**Known gaps:**
- No ingestion trigger for activity messages into D1.
- `prime_activity` does not exist in `inboxChannels`, `primeMessagingChannelTypes`, `PrimeReviewChannel`, or any adapter.
- `resolveChannel` has no activity branch; activity threads would silently misclassify as `prime_direct`.
- `projectPrimeThreadMessageToFirebase` has no `ensureActivityChannelMeta` branch.
- `booking_id` for activity threads is not straightforward: activities are hostel-wide, not booking-scoped.

## Evidence Audit (Current State)

### Entry Points

| Entry Point | File | Notes |
|---|---|---|
| Guest activity message write | `apps/prime/src/contexts/messaging/ChatProvider.tsx:660` | Direct `push()` to `messaging/channels/<id>/messages` — no server function |
| Guest direct message write | `apps/prime/functions/api/direct-message.ts:onRequestPost` | Calls `shadowWritePrimeInboundDirectMessage` after Firebase write |
| Reception inbox list | `apps/reception/src/app/api/mcp/inbox/route.ts:GET` | Calls `listPrimeInboxThreadSummaries` then merges with email threads |
| Prime review thread list | `apps/prime/functions/api/review-threads.ts:onRequestGet` | Queries `message_threads` via `listPrimeReviewThreads` |
| Staff reply send | `apps/prime/functions/api/review-thread-send.ts:onRequestPost` | Calls `sendPrimeReviewThread` → `projectPrimeThreadMessageToFirebase` |
| Activity management write | `apps/prime/functions/api/activity-manage.ts` | Staff creates/updates activity instances; uses service account Firebase auth |

### Key Modules / Files

1. `apps/prime/functions/lib/prime-messaging-shadow-write.ts` — shadow-write logic for direct messages; template for activity shadow-write.
2. `apps/prime/functions/lib/prime-messaging-repositories.ts` — D1 types and SQL; `PrimeMessagingChannelType` union, `upsertPrimeMessageThread`, `createPrimeMessage`, `listPrimeReviewThreads`.
3. `apps/prime/functions/lib/prime-review-api.ts` — `resolveChannel` (maps `channel_type` → `PrimeReviewChannel`); `defaultSubject`; `serializeSummary`.
4. `apps/prime/functions/lib/prime-thread-projection.ts` — `projectPrimeThreadMessageToFirebase`; `ensureDirectChannelMeta`; `ensureBroadcastChannelMeta`.
5. `apps/prime/functions/lib/prime-review-send.ts` — `sendPrimeReviewThread`; uses `channel_type` for `upsertPrimeMessageThread` when marking as sent.
6. `apps/reception/src/lib/inbox/channels.ts` — `inboxChannels` const array; `InboxChannel` union.
7. `apps/reception/src/lib/inbox/channel-adapters.server.ts` — `CHANNEL_ADAPTERS` record; `resolveInboxChannelAdapter`.
8. `apps/prime/src/contexts/messaging/ChatProvider.tsx` — client-side Firebase reads/writes; `MSG_ROOT = 'messaging'`; activity channel path: `messaging/channels/<instanceId>/messages`.
9. `apps/prime/database.rules.json` — RTDB security rules; `messaging.write: "auth != null"` permits service-account writes.
10. `apps/prime/migrations/0001_prime_messaging_init.sql` — D1 schema; `message_threads.channel_type TEXT NOT NULL` with comment `-- direct|broadcast`.

### Data & Contracts

**Firebase RTDB paths:**
- Activity instances: `messaging/activities/instances/<instanceId>` → `ActivityInstance` (status, templateId, title, startTime, etc.)
- Activity channel messages: `messaging/channels/<instanceId>/messages/<pushKey>` → `{content, senderId, senderRole, senderName, createdAt}`
- Activity initial messages template: `messaging/activities/templates/<templateId>/initialMessages`
- Activity presence: `messaging/activities/presence/<channelId>/<guestUuid>` (read in channel page to gate composer)
- Channel metadata: `messaging/channels/<channelId>/meta` → `{channelType, bookingId, memberUids, audience, createdAt}`

**Direct message path (for comparison):**
- `messaging/channels/dm_<uuid>_<uuid>/messages/<key>`

**D1 `message_threads` key fields for activity:**
- `id`: activityInstanceId (UUID from `crypto.randomUUID()`, written by `activity-manage.ts`)
- `booking_id`: **problem** — activities are hostel-wide. Proposed: sentinel value `'activity'` (NOT NULL constraint; see Booking ID section below). `ThreadDetailPane` must guard this sentinel to avoid rendering `#activity` as a booking reference.
- `channel_type`: new value `'activity'` — TypeScript-only change (no schema migration needed; SQLite has no CHECK constraint on this column).
- `audience`: `'whole_hostel'` (existing valid value in `MessageAudience` union).
- `member_uids_json`: `null` or partial list (not available at write time without presence query).
- `title`: `ActivityInstance.title` (available from Firebase instance record).

**Firebase write auth for staff replies:** `projectPrimeThreadMessageToFirebase` calls `new FirebaseRest(env)` which uses `CF_FIREBASE_API_KEY` as the `auth=` query param in REST requests. It does NOT perform a service-account token exchange (unlike `activity-manage.ts`). Staff replies to activity threads will use the same `CF_FIREBASE_API_KEY` REST auth path — no new auth mechanism required.

**PrimeReviewChannel expansion:** Currently `'prime_direct' | 'prime_broadcast'`. Needs `'prime_activity'`.

**InboxChannel expansion:** Currently `["email", "prime_direct", "prime_broadcast"]`. Needs `"prime_activity"`.

### Dependency & Impact Map

**Upstream inputs:**
- Firebase RTDB `messaging/channels/<activityInstanceId>/messages` (write source; guest client writes directly)
- `messaging/activities/instances/<instanceId>` (metadata: title, templateId, status)

**Downstream dependents touched by adding `prime_activity`:**
- `PrimeMessagingChannelType` union → all callers of `channel_type` field
- `inboxChannels` const → `isInboxChannel()` guard → `resolveInboxChannelAdapter()` → capabilities used in `DraftReviewPanel`
- `resolveChannel()` in `prime-review-api.ts` → `PrimeReviewThreadSummary.channel` → Reception inbox thread rendering
- `PrimeColumn` in Reception filters by `t.channel !== "email"` — already handles any non-email channel; no change needed there
- `projectPrimeThreadMessageToFirebase` → needs `ensureActivityChannelMeta` branch

**Components NOT needing change:**
- `listPrimeReviewThreads` SQL query (no `channel_type` filter; `activity` rows will naturally appear once ingested)
- `mapPrimeStatus` (status values are channel-agnostic)
- `prime-review-mutations.ts` resolve/dismiss logic (channel-agnostic)
- Firebase RTDB security rules (already permit `auth != null` writes to `messaging/**`)

**Components needing change beyond the primary list:**
- `prime-review-send-support.ts` — `resolveSentMessageKind` returns `'promotion'` for broadcast and `'support'` for everything else; `resolveSentAdmissionReason` returns `'staff_broadcast_send'` for broadcast and `'staff_direct_send'` for everything else. Both functions need an `activity` branch returning `'support'` and `'staff_activity_send'` respectively.
- `ThreadDetailPane` — must guard `guestBookingRef` rendering when `channel === 'prime_activity'` to avoid displaying the `booking_id` sentinel as a booking reference.

### Booking ID Problem for Activity Threads

Activity channels are hostel-wide. No `booking_id` is naturally associated with the channel itself. **This is not low-risk to ignore:** `ThreadDetailPane.tsx` renders `guestBookingRef` verbatim as `#{guestBookingRef}`. A sentinel like `'hostel'` would render as `#hostel` in the staff UI unless the rendering code is guarded.

Options:
1. **Sentinel with UI guard** — store `booking_id = 'activity'` (or `'hostel'`) AND update `ThreadDetailPane` to omit the `#<ref>` display when `channel === 'prime_activity'`. The sentinel is only needed because `booking_id` is `NOT NULL` in the D1 schema. Requires schema guard + UI change.
2. **Nullable `booking_id`** — requires schema migration (`NOT NULL` → nullable). More disruptive but semantically correct.
3. **Per-message booking ID from sender profile** — lookup `guestProfiles/<senderId>/bookingId` at shadow-write time. Accurate. Adds one Firebase read per message but is consistent with how guest context is enriched elsewhere.

Recommended: Option 1 (sentinel `'activity'` + UI guard) for initial implementation, with Option 3 noted as a clean follow-on. Option 2 is avoided to keep migration surface small.

**Note on Firebase write authenticity (security):** `database.rules.json` permits any `auth != null` client to write under `messaging/**`, meaning a shadow-write path reading from Firebase cannot treat an activity message as inherently guest-authentic solely because it exists in RTDB. The server-function trigger (Option C) is safer here than a polling approach because the CF Pages Function can enforce rate limits and validate the session token on the send path, just as `direct-message.ts` does. The polling/listener approach would need to trust Firebase writes blindly.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `PrimeColumn` renders all non-email threads; `ThreadDetailPane` uses `capabilities` from adapter | `prime_activity` adapter must define capabilities (no subject, no recipients, supports draft send). Activity title needs to appear in thread list. | Define adapter capabilities; verify PrimeColumn empty-state text update |
| UX / states | Required | Draft panel shows/hides controls based on `capabilities.*`. Send path shows errors. | Staff reply composer must be enabled for activity; "mark presence" gate is guest-only and does not apply to staff. Activity threads may have many senders (unlike 1:1 DM). | Confirm no "member_uids" guard blocks activity sends |
| Security / privacy | Required | RTDB rules: `messaging.write: "auth != null"` — any authenticated client can write. `enforceStaffOwnerApiGate` gates all Prime staff routes. | Option C (server function) intercepts the send path and validates the guest session token before writing to Firebase, providing the same trust guarantees as `direct-message.ts`. A polling/listener approach cannot verify message authenticity and must be treated as untrusted input. `CF_FIREBASE_API_KEY` must be present in the Pages Function env for the projection write path. | Analysis must confirm Option C as the chosen trigger to close the authenticity gap |
| Logging / observability / audit | Required | `recordPrimeMessageAdmission` records each shadow-written message decision. `recordDirectTelemetry` used in direct-message path. | Need equivalent telemetry for activity shadow-write events. Reception has no "activity" label in logs. | Add `recordDirectTelemetry` or equivalent for `activity.shadow_write.success/error` |
| Testing / validation | Required | Direct-message path has `__tests__/direct-message.test.ts`. `review-threads.ts` has `__tests__/review-threads.test.ts`. Channel adapters have `__tests__/channel-adapters.server.test.ts`. | New shadow-write function needs unit tests. `resolveChannel` needs `activity` branch test. `channel-adapters.server.test.ts` needs `prime_activity` adapter test. | ~3 new test files; ~5-10 new test cases |
| Data / contracts | Required | `PrimeMessagingChannelType` is a const union. `InboxChannel` is a const array. Both need `activity` added. No schema migration required — SQLite has no CHECK constraint enforcing the existing `direct|broadcast` comment. | `booking_id NOT NULL` constraint requires sentinel strategy. Sentinel `'activity'` will render as `#activity` in `ThreadDetailPane` unless guarded. No `activity` branch in `resolveChannel` or `prime-review-send-support.ts` — existing code silently misclassifies or uses wrong kind/reason. | Add `activity` to TypeScript unions; sentinel `'activity'` + UI guard in ThreadDetailPane; explicit branches in `resolveChannel`, `resolveSentMessageKind`, `resolveSentAdmissionReason` |
| Performance / reliability | Required | `listPrimeReviewThreads` has no `channel_type` filter so adding `activity` rows incurs no extra query cost. | Shadow-write trigger mechanism choice matters: Firebase client listener in a Durable Object vs. a polling approach vs. a CF Worker scheduled trigger. The direct-message path uses a CF Pages Function trigger (client explicitly calls the API). Activity messages write directly to Firebase with no server API call — a different trigger mechanism is needed. | Analysis must compare trigger options |
| Rollout / rollback | Required | No feature flag currently exists for new channel types. Adding `prime_activity` to const arrays is additive and backward-compatible at the type level. | If shadow-write fails silently, no messages appear in Reception — acceptable degradation (same as current state). Schema migration is additive (new comment only); rollback is safe. | No migration rollback risk; feature flag optional but recommended for initial roll-out |

## Test Landscape

**Existing tests covering touched paths:**
- `apps/prime/functions/__tests__/direct-message.test.ts` — covers `direct-message.ts` handler; shadow-write is called from here.
- `apps/prime/functions/__tests__/review-threads.test.ts` — covers `review-threads.ts` GET handler; tests `listPrimeReviewThreadSummaries`.
- `apps/reception/src/lib/inbox/__tests__/channel-adapters.server.test.ts` — tests `resolveInboxChannelAdapter` for `prime_direct` and `prime_broadcast`.

**Gaps:**
- No test for activity shadow-write function (to be created).
- No test for `resolveChannel` with `activity` channel_type.
- No test for `prime_activity` channel adapter in Reception.
- No test for `ensureActivityChannelMeta` in `prime-thread-projection.ts`.
- `review-threads.test.ts` does not test cross-channel type filtering (could expose regression if query changes).

**Testability constraints:**
- D1 bindings require miniflare or CF Workers test setup (already present in prime functions test infrastructure).
- Firebase RTDB writes in thread projection are mocked in existing tests via `FirebaseRest` constructor injection.

### Recent Git History (Targeted)

- `f146ea5dc1 feat(prime): complete unified messaging review flow` — most recent Prime messaging change; added broadcast and campaign support across the full stack.
- `c49db5dbb6 Fix Prime changed-file lint CI gate` — minor CI fix.
- No recent changes to `channels.ts` or `channel-adapters.server.ts`.

## Trigger Mechanism for Activity Shadow-Write

This is the key architectural decision the analysis must resolve.

**Problem:** Activity messages are written directly from the guest browser to Firebase RTDB using the Firebase client SDK. There is no server API endpoint called (unlike direct messages which call `POST /api/direct-message`). This means there is no natural CF Pages Function request to intercept.

**Options:**

**Option A — Firebase RTDB listener in a long-running CF Durable Object or queue worker**
- A Durable Object subscribes to `messaging/channels/*/messages` and shadow-writes new messages to D1.
- High complexity; Durable Objects add significant infra cost.

**Option B — Polling CF Scheduled Worker (Cron Trigger)**
- A CF Pages Cron trigger queries Firebase REST API periodically (e.g. every 30s) for new messages across all live activity channels.
- Requires tracking `lastSeenAt` cursor per channel in D1 or KV.
- Latency: up to 30s. Acceptable for staff-visibility use case (not real-time critical).
- Low infra complexity; consistent with the existing `process-messaging-queue.ts` pattern.

**Option C — Guest app calls a server function before writing to Firebase**
- Change `ChatProvider.sendMessage` for activity channels to call `POST /api/activity-message` (new CF Function) which writes to Firebase server-side and shadow-writes to D1.
- Mirrors the `direct-message.ts` pattern exactly.
- Breaks offline/optimistic writes in the guest app; adds round-trip latency.
- Requires guest app change.

**Option D — Hybrid: server function + fallback poll**
- Activity message send calls a new `POST /api/activity-message` function.
- A background poll reconciles any missed messages (e.g. from before the function existed).
- Clean, low-latency, proven pattern. Higher initial implementation cost.

**Recommended direction for analysis:** Option C (server function) as the primary path, matching the proven `direct-message.ts` architecture. No polling, no Durable Objects. Latency is near-zero. The guest app change is minimal (update `ChatProvider.sendMessage` activity branch to call the server function before or instead of the direct Firebase push). Rate limiting and telemetry follow the same pattern.

## Scope Signal

Signal: `right-sized`
Rationale: All four work streams (shadow-write trigger, D1 channel type extension, Reception inbox channel adapter, staff reply via existing send path) are clearly bounded by existing patterns. The `direct-message.ts` / `prime-messaging-shadow-write.ts` pair provides a complete template. The Reception adapter layer is mechanical (add `prime_activity` alongside `prime_broadcast`). The only genuine architectural question is the trigger mechanism, which has a clear preferred answer (Option C). No new infrastructure is required beyond a new CF Pages Function.

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 80 | Direct parallel in `direct-message.ts` + `prime-messaging-shadow-write.ts`. D1 schema requires only additive change. TypeScript union extension is well-understood. |
| Approach | 75 | Option C (server function) is strongly preferred but not yet confirmed; the analysis must validate the guest app change is acceptable. |
| Impact | 85 | No existing functionality is removed. All changes are additive. Blast radius is limited to Prime channel handling. |
| Delivery-Readiness | 78 | Evidence floor passed. One open question (booking_id strategy) has a low-risk default answer. Trigger mechanism decision is the only blocker. |
| Testability | 82 | Test patterns exist for all touched layers. New tests follow established patterns. |

What raises Implementation to ≥80: confirmed in direct evidence — template exists.
What raises Approach to ≥80: analysis confirmation that Option C guest-app change is low-risk (no offline/PWA constraint prevents a server round-trip for activity sends).
What raises Delivery-Readiness to ≥80: confirm `booking_id` sentinel strategy is acceptable to downstream rendering code.

## Risks

1. **booking_id NOT NULL constraint** — Activity threads have no natural booking_id. Sentinel `'hostel'` is a workaround; downstream code that joins `guestBookingRef` to booking data will get no match. Medium impact, low probability of breaking anything (currently returns null/empty anyway for broadcast threads).
2. **Trigger architecture** — If Option C (server function) is chosen, the guest app ChatProvider must be modified. Any regression in the activity send path breaks guest-facing UX. Mitigated by existing test coverage and the pattern being identical to direct messages.
3. **Firebase write concurrency on activity channels** — Activity channels can have many concurrent guest senders. The shadow-write function must be idempotent on `messageId` (already guaranteed by `createPrimeMessage` using `id TEXT PRIMARY KEY`).
4. **resolveChannel fallthrough** — Without an explicit `activity` branch, any shadow-written activity thread would silently display as `prime_direct` in Reception. This must be fixed before any rows are written.
5. **ensureActivityChannelMeta validation** — The existing `ensureDirectChannelMeta` validates `channelType === 'direct'` and rejects mismatches. A staff reply to an activity thread must not accidentally trigger this validation. An explicit `ensureActivityChannelMeta` branch is required.
6. **PrimeColumn empty state text** — `PrimeColumn` currently reads "Prime campaign messages will appear here." This is misleading once activity threads appear. Low impact but should be updated.
7. **Review status semantics** — `review_status: 'pending'` for an activity thread means the same as for a direct thread (staff should look at it). No semantic mismatch found. Low risk.

## Open Questions

1. **bookingId strategy confirmed?** Sentinel `'hostel'` vs. lookup from `guestProfiles/<senderId>/bookingId` at shadow-write time. Operator preference or technical constraint?
2. **Guest app offline / optimistic send constraint?** Does any PWA offline caching requirement prevent adding a server round-trip to the activity message send path (Option C)?

## Evidence Gap Review

### Gaps Addressed
- Firebase RTDB paths confirmed from `ChatProvider.tsx` line-level evidence (`MSG_ROOT/channels/<instanceId>/messages`).
- D1 schema confirmed from `0001_prime_messaging_init.sql` — `channel_type TEXT NOT NULL`, comment `direct|broadcast`.
- Reception channel adapter confirmed — no `prime_activity` entry in `channels.ts` or `channel-adapters.server.ts`.
- Staff reply Firebase write path confirmed in `prime-thread-projection.ts` (`projectPrimeThreadMessageToFirebase`).
- RTDB security rules confirmed — `messaging.write: "auth != null"` permits service-account writes.
- `listPrimeReviewThreads` SQL confirmed — no `channel_type` filter; activity rows would pass through.
- `resolveChannel` confirmed — else-branch maps to `prime_direct`; explicit activity branch needed.

### Confidence Adjustments
- `booking_id` problem identified and a low-risk solution (sentinel) proposed; does not block planning.
- Trigger mechanism has a clear recommended answer (server function); analysis should confirm.

### Remaining Assumptions
- `ActivityInstance.id` (Firebase push key) is stable and used verbatim as the channel path `messaging/channels/<id>`.
- `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are available in the new activity shadow-write function environment.
- Staff reply to an activity thread (posting to `messaging/channels/<activityInstanceId>/messages`) is visible to all channel subscribers without additional Firebase subscription changes in the guest app.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-prime-activity-inbox`

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Firebase paths for activity messages | Yes | None | No |
| Shadow-write data flow (direct-message template) | Yes | None — pattern maps cleanly | No |
| D1 channel_type schema + migration surface | Yes | booking_id NOT NULL needs sentinel strategy | No — defaulted |
| Reception InboxChannel const + adapter | Yes | `prime_activity` absent from all layers | No — gap is the feature |
| Reception inbox route + Prime review API flow | Yes | resolveChannel else-branch misclassifies activity | No — gap is the feature |
| Staff reply Firebase write path | Yes | ensureActivityChannelMeta branch missing | No — gap is the feature |
| RTDB security rules for staff writes | Yes | None — `auth != null` permits service account | No |
| Trigger mechanism (no server intercept for activity sends) | Partial | 4 options identified; no definitive choice yet | Yes — analysis decision |
| Test landscape | Yes | ~3 test files and ~8 test cases needed | No — carry to plan |
