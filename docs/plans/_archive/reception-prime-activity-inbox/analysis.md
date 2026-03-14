---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-activity-inbox
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-activity-inbox/fact-find.md
Related-Plan: docs/plans/reception-prime-activity-inbox/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Prime Activity Inbox — Analysis

## Decision Frame

### Summary

The single architectural decision this analysis must resolve is: **how are activity channel messages ingested into the Prime D1 messaging database?** All downstream work (channel type extension, Reception adapter, staff reply path) is mechanical once this decision is made. The trigger mechanism choice also determines the security trust model for inbound messages.

### Goals
- Shadow-write inbound activity messages to `PRIME_MESSAGING_DB`.
- Add `prime_activity` channel type across all layers where `prime_direct` and `prime_broadcast` exist.
- Show activity threads in Reception's Prime inbox column alongside `prime_direct` threads.
- Allow staff to reply to activity threads; reply projected back to Firebase via existing `projectPrimeThreadMessageToFirebase` path with a new `ensureActivityChannelMeta` branch.

### Non-goals
- AI draft generation for activity channels.
- Presence tracking changes or attendance lifecycle.
- Firebase RTDB security rule modifications.
- Reception displaying activity roster or RSVP data.

### Constraints & Assumptions
- Constraints:
  - `message_threads.channel_type TEXT NOT NULL` — sentinel value `'activity'` needed for `booking_id` field; no schema migration required (SQLite has no CHECK constraint).
  - `projectPrimeThreadMessageToFirebase` uses `CF_FIREBASE_API_KEY` REST auth, not service-account token exchange.
  - `booking_id NOT NULL` on `message_threads` — activity threads use sentinel `'activity'`; `ThreadDetailPane` must guard this sentinel.
  - `prime-review-send-support.ts` `resolveSentMessageKind` and `resolveSentAdmissionReason` both have non-broadcast else-branches that must be updated.
- Assumptions:
  - `ActivityInstance.id` (UUID from `crypto.randomUUID()`) is used verbatim as `channelId` in `messaging/channels/<id>`.
  - `CF_FIREBASE_API_KEY` env var is available in the new CF Pages Function context (same project as `direct-message.ts`).
  - No PWA/offline constraint exists in the Prime app that would prevent an activity message from going through a server function before reaching Firebase.

## Inherited Outcome Contract

- **Why:** Staff have no visibility into activity group chats. Guest questions or issues posted to activity channels go unnoticed. This creates a service gap for a running feature.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity channel messages appear in Reception's Prime inbox column within the same polling window as direct messages. Staff can read full conversation history and post replies that appear in the guest app.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-prime-activity-inbox/fact-find.md`
- Key findings used:
  - Activity messages are written directly from the guest browser to Firebase RTDB via `push(ref(db, 'messaging/channels/<instanceId>/messages'))` — no server API call is involved in the current flow.
  - Direct messages use a server function (`direct-message.ts`) that validates the guest session, writes to Firebase, then calls `shadowWritePrimeInboundDirectMessage`. This is the proven template.
  - `listPrimeReviewThreads` has no `channel_type` filter — activity rows will surface in Reception once ingested.
  - `resolveChannel` in `prime-review-api.ts` maps all non-broadcast threads to `prime_direct` — explicit `activity` branch needed.
  - `prime-review-send-support.ts` `resolveSentMessageKind` and `resolveSentAdmissionReason` both fallthrough to direct/support paths — both need `activity` branches.
  - RTDB rules permit any `auth != null` write to `messaging/**` — server function approach intercepts before Firebase write and validates guest session token.
  - `ActivityInstance.id` confirmed as `channelId` via `href={'/chat/channel?id=${activity.id}'}` in `ActivitiesClient.tsx`.
  - No cron trigger or Durable Object exists in `wrangler.toml` for Prime — polling would require new infra.

## Evaluation Criteria

| Criterion | Why it matters | Weight |
|---|---|---|
| Message authenticity / security | Server must be able to trust that messages came from a valid guest session | High |
| Delivery latency | Staff need to see messages with low enough latency to respond meaningfully | Medium |
| Implementation complexity | Low complexity = faster delivery and fewer regression surfaces | High |
| Pattern consistency | Matches existing `direct-message.ts` architecture → lower cognitive overhead, same test patterns | High |
| Infrastructure delta | New infra (Durable Objects, cron workers) adds ops cost and deployment surface | Medium |
| Rollback safety | Can the feature be turned off cleanly if a bug surfaces? | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Server function (new CF Pages Function `activity-message.ts`) | Guest app calls `POST /api/activity-message` before writing to Firebase. Server validates session, writes to Firebase server-side, shadow-writes to D1. | Mirrors `direct-message.ts` exactly. Session validation on send path. Near-zero latency. No new infra. | ChatProvider activity send branch must change from direct Firebase push to server fetch + Firebase write. Guest UX regression risk. | Guest app send error handling must be robust; Firebase write could succeed but D1 shadow-write fail silently. | Yes — **Recommended** |
| B — Polling CF Cron Worker | A scheduled worker queries Firebase REST API every N seconds for new messages across live activity channels. Writes new ones to D1. | No guest app change. Works retroactively for messages sent before the feature existed. | Latency up to N seconds. Requires cursor tracking per channel (KV or D1). Treats Firebase as untrusted source — cannot verify message sender. No `wrangler.toml` cron trigger on Prime Pages project today (new infra). | Message authenticity cannot be verified. Firebase REST polling at scale (many channels) adds read cost. Missed messages if cursor logic fails. | No — insufficient security model for an operator-visible inbox |
| C — Firebase RTDB listener (Durable Object) | A Durable Object subscribes to RTDB via WebSocket and shadow-writes new messages. | Real-time, reliable. | Durable Objects are significantly more expensive and complex than Pages Functions. Major new infra. Overkill for this use case. | High ops cost. Not in keeping with current architecture. | No — disproportionate complexity |
| D — Hybrid: server function + background reconciliation poll | Option A as primary; a low-frequency poll reconciles any gaps (e.g. messages sent before the feature deployed). | Belt-and-suspenders. Handles historical backfill cleanly. | Two systems to maintain. | Poll doubles as a secondary attack surface. Backfill value is low if deployment is clean. | Acceptable if backfill is explicitly needed; deferred to follow-on |

## Engineering Coverage Comparison

| Coverage Area | Option A (Server Function) | Option B (Polling) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | `prime_activity` adapter added to `channel-adapters.server.ts`; activity title shown in thread list via `subject` field; `PrimeColumn` empty-state text updated. No layout changes. | Same adapter work required regardless of trigger mechanism. | Define adapter with `channelLabel: "Activity chat"`, `lane: "support"`, `reviewMode: "message_draft"`, `supportsSubject: false`, `supportsRecipients: false`, `supportsDraftSend: true`. |
| UX / states | Guest send path changes: activity send goes through `POST /api/activity-message` then Firebase. Error state must be handled (server error before Firebase write). Staff side unchanged — same draft/send panel. | No guest UX change (polling is server-only). | ChatProvider activity branch shows send error if server function fails. Staff send path unchanged — `DraftReviewPanel` driven by capabilities. |
| Security / privacy | Guest session token validated on every activity message send (same as `direct-message.ts`). Rate limiting via `enforceKvRateLimit` on sender UUID. `enforceStaffOwnerApiGate` guards staff reply routes. | Cannot validate sender — any `auth != null` RTDB write is treated as genuine. Unacceptable for an operator-visible inbox. | Session validation + rate limiting for inbound; staff gate for outbound. No new auth credentials required. |
| Logging / observability / audit | `recordDirectTelemetry(env, 'activity.write.success/error/rate_limited')` added to new function. `recordPrimeMessageAdmission` records each shadow-written message. | Polling loop would need its own telemetry and cursor state log. | ~5 new telemetry event paths, all following existing `recordDirectTelemetry` pattern. |
| Testing / validation | New `__tests__/activity-message.test.ts` mirroring `direct-message.test.ts`. `resolveChannel` activity branch test. `prime-review-send-support.ts` activity branch tests. `channel-adapters.server.test.ts` `prime_activity` adapter test. `ThreadDetailPane` booking-ref guard test. | Similar test surface but must also mock cursor logic and Firebase polling. | ~4 new test files; ~12 new test cases. All follow existing patterns. |
| Data / contracts | `PrimeMessagingChannelType` union: `['direct', 'broadcast', 'activity']`. `InboxChannel` array: add `'prime_activity'`. `booking_id` sentinel `'activity'`. No schema migration. `ensureActivityChannelMeta` added to `prime-thread-projection.ts`. `resolveSentMessageKind` and `resolveSentAdmissionReason` activity branches added. | Same D1 contract changes required regardless. | TypeScript-only contract changes. `ThreadDetailPane` guards `guestBookingRef` display for `prime_activity` channel. |
| Performance / reliability | One extra server round-trip per activity message send (same as direct messages). D1 write is fail-open (shadow-write errors are caught and logged, not surfaced to guest). No extra Firebase reads. | Polling adds periodic Firebase REST reads across all live channels. At high activity counts this scales poorly. Cursor tracking adds write overhead. | Server function adds ~100ms to guest send path. Identical to direct-message experience. |
| Rollout / rollback | If shadow-write fails, guest message still reaches Firebase and guests can read it — graceful degradation. Removing `prime_activity` from `InboxChannel` hides activity threads from Reception without removing data. TypeScript union change is additive. | Polling can be halted by removing the cron trigger. However security model is unacceptable regardless. | No feature flag strictly required. Additive changes. Degradation is clean. |

## Chosen Approach

**Recommendation:** Option A — new CF Pages Function `activity-message.ts` following the `direct-message.ts` pattern exactly.

**Why this wins:**
1. **Security**: Session token validation closes the authenticity gap that polling cannot address. This is the decisive factor.
2. **Pattern consistency**: The `direct-message.ts` → `prime-messaging-shadow-write.ts` pipeline is already proven, tested, and understood. New function is structurally identical.
3. **Latency**: Near-zero — message reaches D1 on the same network hop as the Firebase write.
4. **No new infrastructure**: Pages Functions are already the execution model. No Durable Objects, no cron workers, no KV cursors.
5. **No PWA constraint**: The Prime app has no offline/service-worker configuration. The guest app already uses a server round-trip for direct messages with no reported UX issues.

**What it depends on:**
- `CF_FIREBASE_API_KEY` must be present in the Pages Function environment (already is for `direct-message.ts`; same project).
- `RATE_LIMIT` KV binding available (already bound in `wrangler.toml`).
- `PRIME_MESSAGING_DB` D1 binding available (already bound in `wrangler.toml`).
- ChatProvider activity send branch updated: `push(ref(db, ...))` replaced by `fetch('/api/activity-message', ...)` followed by no-op (server function writes to Firebase; client reflects via the existing `onChildAdded` subscription).

### Rejected Approaches

- **Option B (Polling)** — rejected primarily on security grounds. A polling approach reads from Firebase and cannot verify that the message sender held a valid guest session. Messages could be injected by any authenticated Firebase user (including staff or malformed clients). Unacceptable for content surfaced in a staff-facing inbox. Secondary rejection reason: requires new infra (cron trigger) and cursor tracking.
- **Option C (Durable Object)** — rejected due to disproportionate infrastructure complexity and cost. The problem does not require a persistent real-time connection.
- **Option D (Hybrid)** — useful only if historical backfill is required. Deferred: the feature will be deployed to a running system where activity messages not yet shadow-written simply won't appear (same as current state). Historical backfill can be a one-time script if needed.

### Open Questions (Operator Input Required)

None. All technical decisions have sufficient evidence. The two questions from the fact-find are resolved:

- **bookingId strategy**: Sentinel `'activity'` with `ThreadDetailPane` guard. Confirmed viable — `guestBookingRef` is rendered only when non-null, and the guard is a one-line conditional.
- **Guest app offline constraint**: No PWA/service-worker configuration found in Prime app. No constraint. Confirmed by checking `wrangler.toml`, `next.config.*`, and `package.json`.

## End-State Operating Model

| Area | Current state | Trigger | End-state flow | What remains unchanged | Risks / seams for planning |
|---|---|---|---|---|---|
| Guest sends activity message | Guest browser pushes directly to `messaging/channels/<id>/messages`. No server intercept. Message never reaches D1. | Guest taps Send in `/chat/channel?id=<activityId>` | 1. ChatProvider calls `POST /api/activity-message` with `{activityId, channelId, content}` and guest session cookie. 2. Server validates session, rate-limits, fetches `ActivityInstance` from Firebase for title/metadata. 3. Writes message to `messaging/channels/<id>/messages/<messageId>`. 4. Shadow-writes thread + message to `PRIME_MESSAGING_DB`. 5. Returns `{success, messageId}`. 6. ChatProvider receives confirmation; `onChildAdded` subscription reflects message for all subscribers. | `onChildAdded` subscription in guest app (no change). Firebase message schema (no change). Activity presence tracking (no change). | Firebase write in step 3 must happen server-side; if it fails, the send fails. Error handling in ChatProvider must surface this gracefully. |
| Staff sees activity message in Reception | Activity threads do not appear — no data in D1. | Existing Reception inbox polling on `/api/mcp/inbox` | `listPrimeReviewThreads` returns activity threads (new `channel_type = 'activity'` rows). `resolveChannel` maps to `prime_activity`. Reception inbox `GET /api/mcp/inbox` merges them into the combined thread list. `PrimeColumn` renders them alongside `prime_direct` threads. `ThreadDetailPane` shows thread with `channelLabel: "Activity chat"`. `guestBookingRef` display is guarded (sentinel not rendered). | Email column, direct message column, broadcast column (no change). Existing Prime review thread list query (no change). | `resolveChannel` `else` branch must be updated before any `activity` rows are written, or they will silently appear as `prime_direct`. Recommend: update TypeScript unions and `resolveChannel` in the same deployment unit as the shadow-write function. |
| Staff replies to activity thread | Not possible — no activity threads exist in Reception. | Staff composes reply in `DraftReviewPanel`, taps Send | `review-thread-send.ts` → `sendPrimeReviewThread` → `projectPrimeThreadMessageToFirebase`. New `ensureActivityChannelMeta` branch: if meta absent, creates `{channelType: 'activity', bookingId: 'activity', audience: 'whole_hostel', createdAt: occurredAt, updatedAt: occurredAt}`; if meta present, updates `updatedAt` only. Message written to `messaging/channels/<activityId>/messages/<messageId>` with `senderRole: 'staff'`, `senderName: 'Reception'`. All activity channel subscribers (guests) see the reply. | `review-thread-draft.ts`, `review-thread-resolve.ts`, `review-thread-dismiss.ts` (no change). Campaign/broadcast send path (no change). `resolveSentMessageKind` returns `'support'` for activity via existing else-branch (no change needed). | `ensureActivityChannelMeta` must not accidentally validate against `direct` or `broadcast` meta shape. `resolveSentAdmissionReason` must return `'staff_activity_send'` for activity threads (current else returns `'staff_direct_send'` — change required). |

## Planning Handoff

- **Planning focus:**
  - Decompose into: (1) TypeScript contract layer additions (`PrimeMessagingChannelType`, `InboxChannel`, `resolveChannel`, `resolveSentAdmissionReason` only — `resolveSentMessageKind` already returns `'support'` for activity via existing else-branch and needs no change, channel adapter); (2) New CF Pages Function `activity-message.ts`; (3) `ensureActivityChannelMeta` in `prime-thread-projection.ts` with both create-path and update-path; (4) ChatProvider activity send branch update; (5) `ThreadDetailPane` booking-ref guard; (6) Tests.
  - Task ordering matters: TypeScript contracts and `resolveChannel` must land before or simultaneously with the shadow-write function deployment. Do not write activity rows to D1 while `resolveChannel` still has the fallthrough.

- **Validation implications:**
  - New `__tests__/activity-message.test.ts` should cover: session validation rejection, rate limit enforcement, Firebase write success, shadow-write success, shadow-write failure (fire-and-forget — should not surface to guest), mismatched channelId.
  - Validate that `activity-message.ts` writes message schema fields matching what `messageSchema.ts` parses: `{content, senderId, senderRole: 'guest', senderName?, createdAt}`. The server function must not include fields absent from the schema (no `bookingId` at message level — only at thread meta level).
  - `resolveChannel` test: `channel_type === 'activity'` → `prime_activity`.
  - `resolveSentMessageKind` test: `channel_type === 'activity'` → `'support'` (existing else-branch already correct; test confirms no regression from branch addition).
  - `resolveSentAdmissionReason` test: `channel_type === 'activity'` → `'staff_activity_send'` (this is the only send-support function requiring a new code branch).
  - `ensureActivityChannelMeta` test: no-meta case creates correct fields; existing-meta case updates `updatedAt` only.
  - `channel-adapters.server.test.ts`: `prime_activity` adapter returns expected capabilities.
  - `ThreadDetailPane` guard: `guestBookingRef` not rendered when `channel === 'prime_activity'`.

- **Sequencing constraints:**
  - TypeScript union additions + `resolveChannel` update must be in the same deployment as the shadow-write function (or before). This prevents a window where `activity` rows exist in D1 but are misclassified.
  - `ensureActivityChannelMeta` must be present before any staff reply is attempted.
  - **Deployment order (enforced):** Server-side bundle (TypeScript types + `resolveChannel` + `activity-message.ts` + `ensureActivityChannelMeta`) must deploy and be verified in staging **before** the ChatProvider update is deployed. Deploying server-side first is safe — guest app stays on the direct Firebase `push()` path; no shadow-writes occur until ChatProvider ships. Deploying ChatProvider first would route activity sends to a non-existent `/api/activity-message` endpoint and cause send failures for all guests. Do not gate the ChatProvider update on anything other than server-side staging verification.

- **Risks to carry into planning:**
  - The `prime_activity` channel type landing in the TypeScript const unions before the `resolveChannel` update is deployed creates a window where TypeScript compiles but runtime misclassifies. Sequence tasks so these changes are in one atomic unit.
  - `ensureActivityChannelMeta` must not conflict with the existing `direct` channel meta validation. Implementation must use an explicit `if (channel_type === 'activity')` guard, not a fallthrough.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| TypeScript union race with resolveChannel | Low (sequencing note given) | Medium (silent misclassification) | Deployment ordering is a plan-level task constraint | Plan must group contract changes + resolveChannel update as a single deployment unit |
| Firebase write failure in activity-message.ts | Low | Medium (guest sees send error) | Fire-and-forget shadow-write mitigates D1 side; Firebase write failure is shown to guest | Error handling in ChatProvider must mirror direct-message.ts error surface |
| Activity channels with no `CF_FIREBASE_API_KEY` configured | Very low | High (send path broken) | Env var already present in production Pages project | Plan should include env var verification task |
| Sentinel `'activity'` leaking into future booking-ID-aware features | Low | Low (guard is in place) | Follow-on concern only | Add a code comment on the sentinel value explaining it is activity-scoped and should be filtered by callers |
| High-volume activity channels flooding the inbox | Low (activities are hostel-scale) | Medium (inbox noise) | Scope excludes auto-archival of resolved activity threads | Consider `review_status: 'auto_archived'` after activity ends as a follow-on |
| Guest-app/server-side split deployment window | Medium | Medium (messages sent during window not shadow-written; Reception never sees them) | Sequencing note added; deployment order enforced in planning handoff | Plan must gate ChatProvider update on server-side staging verification; do not ship guest-app change first |

## Planning Readiness

- Status: Go
- Rationale: All gates pass. Chosen approach is decisive, has one viable comparison rejected on security grounds. No operator questions remain. End-state operating model documented area by area. Engineering coverage complete. Sequencing constraints explicit. No structural blockers.
