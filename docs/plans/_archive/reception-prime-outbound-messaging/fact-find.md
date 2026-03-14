---
Dispatch-ID: IDEA-DISPATCH-20260314140001-BRIK-002
Feature-Slug: reception-prime-outbound-messaging
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Status: Ready-for-analysis
---

# Fact-Find: Reception → Prime Outbound Messaging

## Outcome Contract

**Why:** Staff in Reception have no way to *initiate* a message to a guest through the Prime app. Staff endpoints exist to send a reply on a thread that was opened by an inbound guest message (review-thread-send, review-campaign-send), but there is no endpoint or UI to start a new outbound message where no prior inbound message exists. The whole-hostel broadcast thread must be created by staff before any message can be sent to it, and guests cannot see a broadcast message unless their Prime app navigates to the `broadcast_whole_hostel` channel.

**Intended Outcome (v1):** Reception staff can compose a whole-hostel broadcast message (no prior guest message required) and have it appear in the Prime app for current guests. The guest Prime app provides an entry point to view broadcast messages from the `broadcast_whole_hostel` channel.

**Source:** dispatch

---

## Access Declarations

- Firebase RTDB: read access confirmed (existing patterns in `prime-thread-projection.ts`, `ChatProvider.tsx`).
- Cloudflare D1 (`PRIME_MESSAGING_DB`): read/write confirmed — 4 migration files exist, schema fully deployed.
- Reception Next.js Firebase auth (`RECEPTION_FIREBASE_API_KEY`, `RECEPTION_FIREBASE_DATABASE_URL`): confirmed in `staff-auth.ts`.
- Prime CF Pages Function env (`PRIME_ENABLE_STAFF_OWNER_ROUTES`, `PRIME_STAFF_OWNER_GATE_TOKEN`, `CF_FIREBASE_DATABASE_URL`): confirmed in existing endpoints.
- Reception → Prime proxy credentials (`RECEPTION_PRIME_API_BASE_URL`, `RECEPTION_PRIME_ACCESS_TOKEN`): confirmed in `prime-review.server.ts`.

---

## Evidence Audit (Current State)

### Entry Points

**Prime (CF Pages Functions — relevant staff endpoints):**
- `apps/prime/functions/api/review-thread-draft.ts` — `PUT /api/review-thread-draft?threadId=` — saves a staff draft to an EXISTING thread (returns `not_found` if thread absent). Guarded by `enforceStaffOwnerApiGate`.
- `apps/prime/functions/api/review-thread-send.ts` — `POST /api/review-thread-send?threadId=` — sends the current draft of an existing thread. Calls `sendPrimeReviewThread`.
- `apps/prime/functions/api/review-campaign-send.ts` — `POST /api/review-campaign-send?campaignId=` — sends the draft for a specific campaign (broadcast path). Calls `sendPrimeReviewCampaign`.
- `apps/prime/functions/api/staff-auth-session.ts` — `POST /api/staff-auth-session` — PIN-based Firebase custom token for staff.

**No endpoint exists to:**
1. Create the `broadcast_whole_hostel` thread in D1 when it does not yet exist — `savePrimeReviewDraft` returns `not_found` (line 69 in `prime-review-drafts.ts`) rather than creating a missing thread.
2. Send a first staff-composed message to a broadcast thread that has no prior inbound message or existing D1 record.

**Reception (Next.js API routes):**
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` — PUT saves draft to Prime via proxy.
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` — POST sends thread/campaign via proxy.
- `apps/reception/src/app/api/mcp/inbox/route.ts` — GET lists both email and Prime threads.

**No Reception route exists to:**
1. Create/initiate a new Prime thread (compose from scratch to a new audience target).

**Prime ChatProvider (guest-side):**
- `apps/prime/src/contexts/messaging/ChatProvider.tsx` — polls `GET /api/direct-messages` for `dm_*` channels (3 s interval). For any channel ID that is NOT a `dm_*` direct-message channel, it falls through to the Firebase RTDB `onChildAdded`/`onChildChanged`/`onChildRemoved` listener path (lines 437–494). `setCurrentChannelId` accepts any string.
- **The ChatProvider listener mechanism already works for broadcast channels.** If `setCurrentChannelId('broadcast_whole_hostel')` were called, the RTDB listeners would correctly subscribe to `messaging/channels/broadcast_whole_hostel/messages`. The RTDB listener gap is not the issue.
- **However, the existing channel page (`apps/prime/src/app/(guarded)/chat/channel/page.tsx`) cannot be reused as-is.** At line 248, when `channelMode === 'activity' && !activity`, the page renders a "Loading activity..." spinner indefinitely — the `activities` context map is populated from `messaging/activities/*` (activity instances), not from broadcast message channels. A broadcast channel has no entry in `activities`. If a guest is linked to `/chat/channel?mode=activity&id=broadcast_whole_hostel`, they see "Loading activity..." forever. Additionally, the page's `handleSendMessage` path (line 211-212) would let a guest post into the broadcast channel if they could reach the send form — this needs to be blocked for `broadcast_*` channels (guests should read, not post).
- **The gap on the guest side is therefore:** (a) a new broadcast-mode UI or screen is needed (not just a navigation link), OR the existing channel page must gain a `mode=broadcast` branch that omits the activity requirement and blocks guest posting; and (b) a guest entry point (navigation tab, badge, or deep-link from notification) must link to the broadcast view.

### Key Modules / Files

1. `apps/prime/src/lib/chat/messageSchema.ts` — canonical `MessageAudience` type (`thread | booking | room | whole_hostel`). Single source of truth.
2. `apps/prime/src/lib/chat/directMessageChannel.ts` — `buildBroadcastChannelId(audienceKey)` returns `broadcast_<audienceKey>`. `WHOLE_HOSTEL_THREAD_ID = 'broadcast_whole_hostel'` is the fixed canonical thread ID used in campaigns.
3. `apps/prime/functions/lib/prime-thread-projection.ts` — `projectPrimeThreadMessageToFirebase` writes to `messaging/channels/<threadId>/messages/<messageId>`. Handles both `direct` and `broadcast` channel meta paths.
4. `apps/prime/functions/lib/prime-whole-hostel-campaigns.ts` — lifecycle helpers for whole-hostel broadcast campaigns: `ensureWholeHostelCampaignForDraft`, `markWholeHostelCampaignSent`, `recordWholeHostelCampaignDelivery`.
5. `apps/prime/functions/lib/prime-messaging-repositories.ts` — `upsertPrimeMessageThread`, `createPrimeMessage`, `createPrimeMessageDraft`. `upsertPrimeMessageThread` is INSERT OR REPLACE — safe to call for first-time thread creation. However `savePrimeReviewDraft` in `prime-review-drafts.ts` does NOT call `upsertPrimeMessageThread` — it calls `getPrimeMessageThreadRecord` first and returns `not_found` if absent. A new `staff-initiate-thread` endpoint must call `upsertPrimeMessageThread` directly before attempting draft creation.
6. `apps/prime/functions/lib/staff-owner-gate.ts` — `enforceStaffOwnerApiGate` — checks `PRIME_ENABLE_STAFF_OWNER_ROUTES` and `PRIME_STAFF_OWNER_GATE_TOKEN` header. All existing staff endpoints use this.
7. `apps/prime/functions/lib/prime-review-drafts.ts` — `savePrimeReviewDraft` — creates or updates a draft on an EXISTING thread. Returns `not_found` on line 69-71 if thread absent. The function also calls `upsertPrimeMessageThread` only in the whole-hostel reusable-lane branch (line 134 ff.) AFTER the thread is confirmed present. Cannot be used as first step — a new endpoint must call `upsertPrimeMessageThread` directly first.
8. `apps/prime/functions/lib/prime-review-send.ts` — `sendPrimeReviewThread` — full send flow: D1 message record → Firebase projection → campaign tracking → admission log.
9. `apps/reception/src/lib/inbox/prime-review.server.ts` — Reception proxy to Prime staff API. Auth via `x-prime-access-token`. Functions: `listPrimeInboxThreadSummaries`, `getPrimeInboxThreadDetail`, `savePrimeInboxDraft`, `sendPrimeInboxThread`, `resolvePrimeInboxThread`.
10. `apps/reception/src/contexts/messaging/ChatProvider.tsx` — Not applicable: this is the **guest** ChatProvider. The Reception app is a Next.js app, not inside ChatProvider. Reception sends via the proxy server layer.

### Data & Contracts

**MessageAudience enum** (`messageSchema.ts`):
```
'thread' | 'booking' | 'room' | 'whole_hostel'
```

**Firebase RTDB broadcast channel path** (confirmed from `prime-thread-projection.ts`):
```
messaging/channels/<threadId>/messages/<messageId>
```
For whole-hostel: `messaging/channels/broadcast_whole_hostel/messages/<messageId>`

**D1 schema:**
- `message_threads`: `channel_type ('direct'|'broadcast')`, `audience`, `id = 'broadcast_whole_hostel'` for whole-hostel.
- `message_campaigns`: `campaign_type = 'broadcast'`, `audience`, `status ('drafting'|'under_review'|'sent'|'resolved'|'archived')`.
- `message_campaign_target_snapshots`: per-recipient delivery targets with `target_kind ('whole_hostel'|'booking'|'room'|'guest'|...)`.
- `message_campaign_deliveries`: delivery ledger per target.
- All 4 migrations are present (0001–0004). Schema is fully migration-ready.

**Reception → Prime proxy auth contract:**
- Header: `x-prime-access-token: <RECEPTION_PRIME_ACCESS_TOKEN>`
- Env vars: `RECEPTION_PRIME_API_BASE_URL`, `RECEPTION_PRIME_ACCESS_TOKEN`.

**Prime staff owner gate contract:**
- `enforceStaffOwnerApiGate` checks (in order): (1) not production → allow, (2) `PRIME_ENABLE_STAFF_OWNER_ROUTES=true` → allow, (3) Cloudflare Access header present → allow, (4) `x-prime-access-token` matches `PRIME_STAFF_OWNER_GATE_TOKEN` → allow.
- Reception's proxy sends `x-prime-access-token: <RECEPTION_PRIME_ACCESS_TOKEN>` header. Since `RECEPTION_PRIME_ACCESS_TOKEN == PRIME_STAFF_OWNER_GATE_TOKEN`, the token check passes regardless of `PRIME_ENABLE_STAFF_OWNER_ROUTES`. The feature flag is NOT a hard prerequisite for Reception's proxied calls.
- This is the same gate all existing staff review endpoints use and is already in production.

**InboxChannelCapabilities** (Reception, `channels.ts`):
- Currently no `supportsCompose` or `supportsInitiateThread` flag. The `DraftReviewPanel` operates on existing threads only.
- `prime_broadcast` and `prime_direct` adapters already defined in `channel-adapters.server.ts` with full draft/send capabilities.

### Dependency & Impact Map

```
Reception UI (compose widget)
  → Reception API route: POST /api/mcp/inbox/prime-compose  [NEW]
    → prime-review.server.ts: initiatePrimeOutboundThread()  [NEW function]
      → Prime CF Function: POST /api/staff-initiate-thread  [NEW endpoint]
        → prime-review-drafts.ts: savePrimeReviewDraft()  [EXISTING — reuse]
        → upsertPrimeMessageThread()  [EXISTING — upsert is safe for broadcast thread]
        → ensureWholeHostelCampaignForDraft()  [EXISTING — campaign lifecycle]

Prime ChatProvider (guest-side, read path)
  [NO CHANGE TO LISTENER MECHANISM: ChatProvider already handles broadcast_ channels via RTDB onChildAdded (falls through non-dm_ branch)]
  [CHANGE NEEDED: guest navigation/auto-subscription]
  → Currently: no guest screen calls setCurrentChannelId('broadcast_whole_hostel')
  → Need: a dedicated "Staff messages" screen/route that navigates to the broadcast channel. Auto-subscribe on session mount is NOT viable — ChatProvider supports only one active channel at a time; setting currentChannelId on mount would tear down any active activity/DM listener. The broadcast view must be an explicit navigation destination.
```

**Upstream dependencies for send (whole-hostel v1 only):**
- `PRIME_MESSAGING_DB` D1 binding (already required by all staff endpoints).
- `CF_FIREBASE_DATABASE_URL` (already present in all Prime functions).
- `PRIME_STAFF_OWNER_GATE_TOKEN` matching `RECEPTION_PRIME_ACCESS_TOKEN` — already in place (existing review flow proven in production). `PRIME_ENABLE_STAFF_OWNER_ROUTES` is NOT a hard prerequisite for Reception's proxied calls (token check suffices).

**Blast radius:**
- Prime: New CF function file (no changes to existing endpoints). Guest app needs a dedicated broadcast-viewer screen (a new page or `broadcast` mode on the existing channel page) to display staff messages. Auto-subscribe on session mount is NOT viable (ChatProvider is single-channel; would tear down active activity/DM listeners). No change to ChatProvider listener logic. No existing subscription paths altered.
- Reception: New API route + new proxy function in `prime-review.server.ts`. No existing routes altered. New UI component (compose button + modal/drawer) in `PrimeColumn` or a new compose panel.

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `PrimeColumn.tsx` shows thread list, no compose affordance. `DraftReviewPanel.tsx` handles existing draft editing. `InboxWorkspace.tsx` has 3-col layout. | No compose button, no audience picker, no compose modal. Design must fit 3-col constraint. | Yes — design for compose trigger + modal/drawer. |
| UX / states | Required | Thread list empty state exists. Draft panel has loading/error/sending states. | Compose flow has no error state, no loading indicator, no confirmation step. | Yes — compose loading, send-error, confirmation, audience selection UX. |
| Security / privacy | Required | `enforceStaffOwnerApiGate` on all Prime staff routes. Reception proxy uses `RECEPTION_PRIME_ACCESS_TOKEN` static token. Reception staff auth: `requireStaffAuth` verifies Firebase ID token + role check. | New endpoint must use same gate. Audience validation on server (cannot trust client-supplied audience). Rate limit needed (broadcast is high-impact). | Yes — require gate token + rate limit on new endpoint. |
| Logging / observability / audit | Required | `recordPrimeMessageAdmission` used in send flow. `recordDirectTelemetry` for DM sends. | New broadcast initiation path needs admission record with `actorUid` and `actorSource`. | Yes — admission log entry on new thread creation and send. |
| Testing / validation | Required | Existing tests: `__tests__/messaging-dispatcher.test.ts`, `prime-messaging-repositories.test.ts`, `review-threads.test.ts`, `ChatProvider.direct-message.test.tsx`. | No tests for: new staff-initiate-thread endpoint, guest broadcast-mode channel page (new `mode=broadcast` branch or separate page), guest-post-disabled guard, Reception compose API route. | Yes — unit tests for new endpoint, new proxy function, broadcast channel page mode (including send-disabled guard). |
| Data / contracts | Required | D1 schema is fully migration-ready (0001–0004 applied). `upsertPrimeMessageThread` handles idempotent creation. `message_threads.audience` and `channel_type` already typed. | Whole-hostel broadcast is the simplest v1 target (fixed thread ID = `broadcast_whole_hostel`). Per-booking/room initiation requires Firebase occupancy lookup — not needed for v1. | Yes — v1 scoped to `whole_hostel` only. |
| Performance / reliability | Required | Direct message writes are rate-limited (KV). Firebase projection is synchronous in `projectPrimeThreadMessageToFirebase`. | Broadcast writes to a shared Firebase channel that all guests listen to — no fan-out needed (single RTDB node). Risk is stale guest listener if ChatProvider only subscribes on `setCurrentChannelId`. | Yes — analyze pull model (polling vs real-time subscription). |
| Rollout / rollback | Required | `enforceStaffOwnerApiGate` guards all staff endpoints. Gate passes via token match (`PRIME_STAFF_OWNER_GATE_TOKEN`) — flag not strictly required for proxied Reception calls. Reception proxy gracefully returns `null` if Prime config absent. | New endpoint uses same gate. Reception compose UI can be gated by an env variable to prevent showing UI until confirmed. No DB migrations needed. | Yes — note rollout path in plan. |

---

## Current Process Map

**Trigger:** A guest sends a message in Prime (inbound event).

**Existing flow (inbound-only):**
1. Guest sends `POST /api/direct-message` request to Prime CF Function.
2. CF Function validates the request (rate limit, session token) and performs server-side RTDB write to `messaging/channels/<channelId>/messages/<msgId>`.
3. `shadowWritePrimeInboundDirectMessage` fires: creates/upserts `message_threads` row and `message_records` row in D1.
4. Admission decision is recorded (`message_admissions`).
5. Reception inbox polls `GET /api/mcp/inbox` → `listPrimeInboxThreadSummaries` → proxied to `GET /api/review-threads` on Prime.
6. Staff selects thread → `GET /api/mcp/inbox/[threadId]` → detail loaded from Prime via proxy.
7. Staff edits draft text → `PUT /api/mcp/inbox/[threadId]/draft` → saved to D1 via Prime.
8. Staff clicks Send → `POST /api/mcp/inbox/[threadId]/send` → `sendPrimeReviewThread` → writes to D1 + projects to Firebase RTDB `messaging/channels/<threadId>/messages/<messageId>`.
9. Guest's ChatProvider sees new message via RTDB `onChildAdded` listener (activity channels) OR via 3s poll for direct channels.

**What is MISSING (the gap):**
- No step 0 exists: staff cannot start a new thread. All threads are created by shadow-write on inbound guest messages. `savePrimeReviewDraft` (and the draft/send endpoint) return `not_found` when the thread row does not exist in D1.
- There is no `POST /api/staff-initiate-thread` (Prime side) to call `upsertPrimeMessageThread` for a broadcast thread before attempting draft creation.
- There is no `POST /api/mcp/inbox/prime-compose` (Reception side) to initiate this flow.
- The guest Prime app has no screen that calls `setCurrentChannelId('broadcast_whole_hostel')`. ChatProvider's existing RTDB listener logic WILL work once a channel is selected, but no guest-facing entry point selects broadcast channels. Additionally, the existing channel page (`chat/channel/page.tsx`) cannot display broadcast channels: when `channelMode === 'activity' && !activity`, it renders "Loading activity..." indefinitely because `activities['broadcast_whole_hostel']` is never populated (activities come from `messaging/activities/*`). The page also has no guard preventing guests from posting into a `broadcast_*` channel. A new `broadcast` mode or a separate page is required.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| MessageAudience type system (Prime) | Yes | None | No |
| `buildBroadcastChannelId` / channel naming | Yes | None | No |
| D1 schema: thread + campaign + delivery tables | Yes | None | No |
| Staff auth gate pattern (Prime functions) | Yes | None | No |
| `sendPrimeReviewThread` / `projectPrimeThreadMessageToFirebase` send path | Yes | None | No |
| ChatProvider subscription model | Yes | [Coverage] ChatProvider ALREADY handles any non-dm_ channel via RTDB onChildAdded (lines 437-494). Gap is not the listener itself — it is the guest-side display and entry point. Additional finding: existing channel page (`chat/channel/page.tsx`) requires an `activity` object for non-direct mode; `activities['broadcast_whole_hostel']` is never populated, causing indefinite "Loading activity..." state. Guest channel page needs a new `broadcast` mode or a separate screen. Guest send form must be disabled for broadcast channels. | Yes — plan must define a new broadcast-mode view (not just channel selection) |
| Reception proxy layer (`prime-review.server.ts`) | Yes | None | No |
| Reception compose UI (new capability) | Partial | [Coverage] No existing compose affordance. Capabilities contract (`InboxChannelCapabilities`) has no `supportsCompose` flag. | Yes — plan must define flag and UI location |
| Reception auth (staff → Reception API → Prime proxy) | Yes | None | No |
| Rate limiting for broadcast | Partial | No rate limiting on the send path for staff endpoints. The harmful action is repeated sends (not thread creation) — `review-thread-send` and `review-campaign-send` are both ungated beyond auth. The new `staff-initiate-thread` endpoint also has no rate limit. | Yes — plan must include rate limit on the SEND path (not just initiation). Thread creation is idempotent (upsert) so rate limiting initiation is lower priority than rate limiting sends. |
| Audience scope for v1 | Yes | Whole-hostel is simplest (fixed thread ID). Booking/room requires Firebase occupancy lookup — excluded from v1. | No |

---

## Scope Signal

**Signal: right-sized**

**Rationale:** The system has the full downstream infrastructure (D1 schema, campaign lifecycle, Firebase projection, send flow). The gap spans four areas: (1) a new Prime initiation endpoint, (2) a new guest-side broadcast view (the existing channel page cannot display broadcast channels — it requires an `activity` object that broadcast channels don't have), (3) a guest entry point linking to the broadcast view with guest-post blocked, and (4) a compose UI in Reception. V1 scoped to `whole_hostel` audience avoids per-booking/room Firebase occupancy lookups. All parts have clear patterns to follow, including the channel page's existing `direct` mode branch as a model for a new `broadcast` mode.

---

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 0.78 | All required patterns exist. `upsertPrimeMessageThread` is idempotent; draft/send/projection flow is proven. ChatProvider RTDB listener already handles non-dm_ channels. However, the existing guest channel page (`chat/channel/page.tsx`) requires an `activity` object for non-direct mode — `activities['broadcast_whole_hostel']` is never populated, causing indefinite "Loading activity..." spinner. A new `broadcast` mode in the channel page (or a separate broadcast-viewer screen) is required. Guest send form must be disabled for `broadcast_*` channels. |
| Approach | 0.82 | One viable approach: new `POST /api/staff-initiate-thread` endpoint + new `broadcast` mode in guest channel page (or separate broadcast-viewer screen) + explicit nav entry point + Reception compose button. Auto-subscribe is not viable (ChatProvider single-channel constraint). Design fork is `mode=broadcast` branch vs separate page — both have clear implementation paths. No competing fundamentally different approach found. |
| Impact | 0.88 | Confirmed: guests cannot currently see any staff-initiated message. Two compounding gaps: (1) no staff endpoint to create the broadcast thread, and (2) no guest-facing broadcast-viewer screen — the existing channel page requires an `ActivityInstance` that broadcast channels don't have and would render a permanent spinner. ChatProvider RTDB listener already works for broadcast IDs; the required guest-side work is a new `broadcast` mode in the channel page (or separate viewer) plus a nav entry point. |
| Delivery-Readiness | 0.78 | All dependencies confirmed. `PRIME_STAFF_OWNER_GATE_TOKEN` already in production (existing review flow live). ChatProvider listener requires no change. Guest-side scope is slightly larger than initially assessed: the existing channel page cannot display broadcast channels and must gain a `broadcast` mode (or a separate page added). No schema migrations needed. |
| Testability | 0.80 | `prime-messaging-repositories.test.ts` pattern is well-established. ChatProvider tests exist for direct messages — guest entry point test can follow same patterns. |

**What raises each score to ≥80:**
- Implementation: verified via unit test that `upsertPrimeMessageThread` with `channel_type='broadcast'` + `audience='whole_hostel'` + `id='broadcast_whole_hostel'` correctly creates the canonical thread.

**What raises to ≥90:**
- Delivery-Readiness: complete task breakdown confirming the guest entry point is a single screen change (not a ChatProvider re-architecture).

---

## Risks

1. **ChatProvider only pulls broadcast when a dedicated broadcast screen is navigated to** — `setCurrentChannelId('broadcast_whole_hostel')` must be called explicitly from a guest-facing broadcast-viewer screen. Auto-subscribe on session mount is NOT viable: ChatProvider supports only one active `currentChannelId` and clears it on channel change (line 232) and page unmount (line 343 of ChatProvider.tsx). An auto-subscribe would interfere with any active activity or DM chat. Risk: medium. Mitigation: add a dedicated "Staff messages" nav entry that routes to the broadcast viewer.
2. **Whole-hostel is a shared single-channel broadcast** — any guest who subscribes sees all staff messages sent to that channel since their stay. No per-booking scoping in v1. Acceptable for v1 but must be documented.
3. **Gate token mismatch** — `enforceStaffOwnerApiGate` passes when `x-prime-access-token` matches `PRIME_STAFF_OWNER_GATE_TOKEN`. Reception uses `RECEPTION_PRIME_ACCESS_TOKEN` as the header value. These must be the same secret. Risk: low (existing review endpoints already work, confirming the secrets match).
4. **Reception staff compose session** — Reception uses Firebase ID token auth (`requireStaffAuth`). The new compose API route must call `requireStaffAuth` and pass the actor UID through to Prime as `x-prime-actor-uid`. No new auth mechanism is needed, but the actor UID chain must be threaded through.
5. **Rate limiting on broadcast send path** — a staff member could accidentally trigger multiple broadcast sends. The harmful action is repeated sends, not thread creation (thread creation via `upsertPrimeMessageThread` is idempotent). Both existing staff send endpoints (`review-thread-send`, `review-campaign-send`) are currently ungated beyond auth — a new broadcast send would also be ungated by default. KV-based rate limit (as in `kv-rate-limit.ts`) should be applied to the SEND path per `actorUid`. Thread initiation rate limiting is lower priority.
6. **Firebase broadcast channel listener cleanup** — ChatProvider `useEffect` cleanup must unsubscribe broadcast listeners. The existing pattern (`messageListenerRef.current = cleanup fn`) already handles this for activity channels.
7. **No v1 audience picker needed for whole-hostel only** — if the plan expands to per-booking/room in v1, Firebase occupancy data must be fetched to derive member UIDs. This would require `guestsByRoom` or `bookings` RTDB paths. Out of scope for v1.
8. **Guest channel page requires a new broadcast mode** — the existing `chat/channel/page.tsx` renders "Loading activity..." indefinitely for broadcast channels because `activities['broadcast_whole_hostel']` is never populated. If a guest is linked to the channel without the new mode, they see a permanent spinner. Additionally, the guest send form is not blocked for broadcast channels — guests must not be able to post into `broadcast_*` channels (staff-only outbound). Risk: medium. Mitigation: add `broadcast` mode to channel page with activity-requirement bypass and send-form disabled; or create a separate read-only viewer route.

---

## Evidence Gap Review

### Gaps Addressed
- Confirmed there is NO existing `staff-initiate-thread` or equivalent endpoint (searched all `functions/api/*.ts`).
- Confirmed `upsertPrimeMessageThread` is idempotent and safe to call for a new broadcast thread.
- Confirmed Firebase path `messaging/channels/broadcast_whole_hostel/messages/` is the correct write target — used in `prime-thread-projection.ts`.
- Confirmed Reception staff auth model (`requireStaffAuth` → Firebase ID token → role check).
- Confirmed reception → Prime proxy auth (`RECEPTION_PRIME_ACCESS_TOKEN` header).
- Confirmed `enforceStaffOwnerApiGate` is the correct gate for all Prime staff endpoints.
- Confirmed `InboxChannelCapabilities` in `channels.ts` has no `supportsCompose` flag — this must be added.
- Confirmed the existing guest channel page (`chat/channel/page.tsx`) cannot display broadcast channels: the `activity` mode requires an `ActivityInstance` object from `messaging/activities/*` which broadcast channels do not have. The page at line 248 returns a permanent "Loading activity..." spinner for any `mode=activity` channel without a matching activity. A new `broadcast` mode or separate page is required. Additionally, the guest send form is not blocked for broadcast channels — this must be explicitly guarded.

### Confidence Adjustments
- Campaign runtime (`prime-review-campaign-runtime.ts`) handles booking/room fan-out but is NOT needed for v1 whole-hostel broadcast (single-thread, no fan-out).
- Whole-hostel thread ID is hard-coded as `'broadcast_whole_hostel'` in `prime-whole-hostel-campaigns.ts` — this is the canonical ID.

### Remaining Assumptions
- `PRIME_STAFF_OWNER_GATE_TOKEN` equals `RECEPTION_PRIME_ACCESS_TOKEN` in the production Prime deployment — confirmed indirectly (existing review flow works, which requires this token pair).
- The Reception Firebase auth (`RECEPTION_FIREBASE_API_KEY`, `RECEPTION_FIREBASE_DATABASE_URL`) is configured (implied by existing reception auth flow).
- The guest Prime app will need a new navigation entry point or notification mechanism to direct guests to view broadcast messages. This is a known open UX question for analysis.
- `RECEPTION_PRIME_API_BASE_URL` and `RECEPTION_PRIME_ACCESS_TOKEN` are set in production Reception deployment. If absent, thread listing degrades to empty array but draft/detail/send paths throw — the new compose endpoint must handle this gracefully (return 503 or skip).

---

## Open Questions

1. **Guest broadcast display and entry point**: The existing channel page (`chat/channel/page.tsx`) cannot display broadcast channels in its current `activity` mode — it requires an `activity` object that broadcast channels don't have. Analysis must decide between: (a) adding a `mode=broadcast` branch to the existing page (reuse routing, minimal new surface) vs (b) a new standalone broadcast-viewer page. Either way, the guest send form must be disabled for `broadcast_*` channels (guests read only). Entry point options: notification badge, "Staff messages" nav tab, or deep-link from a new notification surface. Analysis should choose the simplest option that doesn't disrupt the current activity/DM UX.

2. **Compose UI location in Reception**: The PrimeColumn currently only lists existing threads. Should the compose button live at the top of PrimeColumn, or should it be a floating action button in InboxWorkspace? Analysis should decide.

3. **v1 audience scope**: Confirmed whole-hostel only for v1. Should the plan also include a `booking` audience (single-thread per booking) as a stretch goal, or defer entirely to v2? Booking threads already exist from inbound messages — staff could compose to an existing booking thread without occupancy lookup.

---

## Test Landscape

**Existing tests relevant to this feature:**
- `apps/prime/functions/__tests__/prime-messaging-repositories.test.ts` — covers `upsertPrimeMessageThread`, `createPrimeMessage`, campaign operations.
- `apps/prime/functions/__tests__/review-threads.test.ts` — covers listing review threads including broadcast.
- `apps/prime/functions/__tests__/staff-auth-session.test.ts`, `staff-auth-token-gate.test.ts`, `staff-owner-access-gate.test.ts` — auth gate patterns.
- `apps/prime/src/contexts/messaging/__tests__/ChatProvider.direct-message.test.tsx` — ChatProvider with DM channel polling. Useful for understanding the ChatProvider mock pattern.
- `apps/prime/src/contexts/messaging/__tests__/ChatProvider.channel-leak.test.tsx` — prior art for single-active-channel and listener-cleanup behavior. Directly relevant to the single-channel constraint that rules out auto-subscribe.
- `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx` — existing page-level test harness for the channel page. Most relevant pattern for testing a new `mode=broadcast` branch or a dedicated broadcast-viewer route.
- `apps/reception/src/components/inbox/__tests__/DraftReviewPanel.test.tsx` — draft editing; pattern for compose panel test.
- `apps/reception/src/lib/inbox/__tests__/prime-templates.test.ts` — template matching.

**Coverage gaps for this feature (new tests required):**
- Unit test for new Prime `POST /api/staff-initiate-thread` endpoint (happy path + validation errors + gate rejection).
- Unit test for new `initiatePrimeOutboundThread` proxy function in Reception's `prime-review.server.ts`.
- Unit test for new guest broadcast-mode view: (a) verifies the channel page's `broadcast` mode branch renders correctly without an `activity` object, (b) verifies the guest send form is disabled/absent for `broadcast_*` channels (guests are read-only).
- Unit test for Reception compose API route (`POST /api/mcp/inbox/prime-compose`).
- Integration test for the full Reception → Prime → Firebase projection path (can be a targeted test using existing `prime-messaging-db.test.ts` patterns).

**Extinct tests:** None identified. No tests will be invalidated by this change.

**Testability constraints:**
- ChatProvider tests require Firebase mock (already established via `jest.mock('../../services/firebase')`).
- Prime function tests use custom mock D1 bindings defined in `apps/prime/functions/__tests__/helpers.ts` (line 46) — not `@miniflare/d1` or `better-sqlite3`. The harness is established and the pattern is used in `prime-messaging-db.test.ts`.

---

## Scope

**V1 scope (this plan):**
- New Prime CF Pages Function endpoint: `POST /api/staff-initiate-thread` — calls `upsertPrimeMessageThread` to create the `broadcast_whole_hostel` thread if absent, then calls `savePrimeReviewDraft` (which succeeds once the thread exists). These are sequential D1 writes within one HTTP request but are NOT transactional (no rollback if draft creation fails after thread creation). The plan must decide whether to add error-recovery logic or accept partial-completion as an acceptable failure mode (thread created, no draft).
- Prime guest app: (a) new `broadcast` mode in `apps/prime/src/app/(guarded)/chat/channel/page.tsx` that does NOT require an `activity` object and disables the guest send form for broadcast channels, OR a separate `broadcast-viewer` screen; (b) an entry point (navigation tab, badge, or notification deep-link) that links to the broadcast view. No change to ChatProvider listener logic needed — it already handles non-dm_ channels via RTDB `onChildAdded`/`onChildChanged`/`onChildRemoved`.
- Reception: new proxy function `initiatePrimeOutboundThread` in `prime-review.server.ts`, new API route `POST /api/mcp/inbox/prime-compose`, new compose button + modal in `PrimeColumn`.
- Audience scoped to `whole_hostel` only (simplest — fixed canonical thread ID `broadcast_whole_hostel`, no Firebase occupancy lookup required).

**Explicitly out of scope for v1:**
- Per-booking audience (requires occupancy lookup from Firebase `bookings/<bookingId>/<uuid>`).
- Per-room audience (requires `guestsByRoom` RTDB lookup).
- Individual guest outbound (equivalent to starting a new `dm_*` channel from staff — complex auth flow, guest must be known).

**Out-of-scope items tracked for future:**
- Booking/room audience: the D1 schema and campaign runtime (`prime-review-campaign-runtime.ts`) already support it — low friction when added.
- Push notifications to guests for new broadcast messages.

## Analysis Readiness

This fact-find is ready for analysis. Evidence is sufficient to:

1. Decide between two approaches for the guest broadcast display: (a) add a `mode=broadcast` branch to the existing `chat/channel/page.tsx` that skips the `activity` requirement and disables the guest send form for broadcast channels vs (b) a dedicated separate `broadcast-viewer` page/screen. ChatProvider's existing non-dm_ RTDB listener handles message delivery in both cases; the design fork is UI surface area and routing.
2. Design the Reception compose UI location (PrimeColumn header vs InboxWorkspace floating action).
3. Write a concrete task breakdown because all entry points, auth patterns, and data contracts are fully confirmed.

No operator-only unknowns remain that would block planning. The three open questions are design forks best resolved by analysis, not by further codebase investigation.

## Recent Git History (Targeted)

- `f146ea5dc1 feat(prime): complete unified messaging review flow` — established the review-thread and review-campaign-send endpoints. Most relevant precedent.
- `a890347292 chore: checkpoint outstanding repo changes` — ChatProvider last updated in this commit; non-dm_ RTDB listener already present; no guest entry point for broadcast channels added.
- `5b5a5de3b4 feat(prime-activity-duration): Wave 1 — redirect + CF function + ActivityManageForm` — example CF function addition pattern.
- `0e8cd553d4 feat(prime): complete unified messaging review flow` — D1 schema and projection established.
