---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-outbound-messaging
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-outbound-messaging/fact-find.md
Related-Plan: docs/plans/reception-prime-outbound-messaging/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception → Prime Outbound Messaging Analysis

## Decision Frame

### Summary

Reception staff need to initiate a whole-hostel broadcast message through the Prime guest app without requiring a prior inbound guest message. Two implementation forks exist: one for the guest-side broadcast display (new `mode=broadcast` branch in the existing channel page vs a standalone broadcast-viewer page), and one for the Reception compose UI (compose button in PrimeColumn header vs global floating action button). Both forks are resolved here so planning can begin with a decisive task decomposition.

### Goals

- Reception staff can compose and send a new whole-hostel broadcast message from the Inbox UI.
- Sent messages appear in the Prime guest app for current guests navigating to a broadcast viewer.
- Guests cannot post into broadcast channels (read-only for guests).
- Auth chain is explicit: staff Firebase ID token → Reception API → Prime proxy token → Prime gate.
- No schema migrations needed.

### Non-goals

- Per-booking or per-room audience targeting (Firebase occupancy lookup required — deferred to v2).
- Push notifications to guests for new broadcast messages.
- Guest-to-staff replies on broadcast channels.
- Individual staff-to-guest DM initiation (requires `dm_*` channel creation with known guest UUID — different problem).

### Constraints & Assumptions

- Constraints:
  - ChatProvider supports only one active `currentChannelId` at a time — auto-subscribe on session mount is not viable.
  - `upsertPrimeMessageThread` + `savePrimeReviewDraft` are sequential D1 writes within one HTTP request, not transactional.
  - All Prime staff endpoints must use `enforceStaffOwnerApiGate`.
  - Broadcast is a single shared RTDB node (`messaging/channels/broadcast_whole_hostel/messages`) — no fan-out required for v1.
- Assumptions:
  - `PRIME_STAFF_OWNER_GATE_TOKEN == RECEPTION_PRIME_ACCESS_TOKEN` in the production Prime deployment (confirmed indirectly via working review flow).
  - D1 schema migrations 0001–0004 are applied in production.
  - Reception Firebase auth (`requireStaffAuth`) is operational for the compose route.

---

## Inherited Outcome Contract

- **Why:** Staff in Reception have no way to initiate a message to a guest through the Prime app. All threads today are created by shadow-write on inbound guest messages. `savePrimeReviewDraft` returns `not_found` when the thread row does not exist in D1.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception staff can compose a whole-hostel broadcast message (no prior guest message required) and have it appear in the Prime app for current guests. The guest Prime app provides an entry point to view broadcast messages from the `broadcast_whole_hostel` channel.
- **Source:** dispatch

---

## Fact-Find Reference

- Related brief: `docs/plans/reception-prime-outbound-messaging/fact-find.md`
- Key findings used:
  - `savePrimeReviewDraft` returns `not_found` when thread absent (line 69, `prime-review-drafts.ts`). New endpoint must call `upsertPrimeMessageThread` directly before draft creation.
  - Existing `chat/channel/page.tsx` at line 248: `if (channelMode === 'activity' && !activity)` renders permanent "Loading activity..." spinner for broadcast channels because `activities['broadcast_whole_hostel']` is never populated (`activities` map comes from `messaging/activities/*`).
  - ChatProvider RTDB listener already handles non-`dm_*` channels (lines 437–494). No listener code change needed.
  - ChatProvider is single-channel: `currentChannelId` cleared on channel change (line 232) and page unmount (line 343). Auto-subscribe would disrupt active activity/DM sessions.
  - `enforceStaffOwnerApiGate` passes via `x-prime-access-token` token match, without requiring `PRIME_ENABLE_STAFF_OWNER_ROUTES=true`.
  - Rate limit risk is on the SEND path, not thread creation (`upsertPrimeMessageThread` is idempotent).
  - Existing page-level test harness: `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx`.
  - Custom mock D1 bindings in `apps/prime/functions/__tests__/helpers.ts` — established test pattern.
  - `sendPrimeInboxThread(prefixedThreadId)` expects the `prime:`-prefixed inbox thread ID (built by `buildPrimeInboxThreadId()` using `PRIME_THREAD_ID_PREFIX = "prime:"`). Routes broadcast threads to `/api/review-campaign-send?campaignId=<id>` when a campaign is present (not `/api/review-thread-send`). Campaign is created by `savePrimeReviewDraft` internally via `ensureWholeHostelCampaignForDraft`.
  - `isPrimeThreadVisibleInInbox()` filters out threads with `reviewStatus='sent'` — after a broadcast send the thread disappears from the inbox list.
  - `enforceStaffOwnerApiGate` returns HTTP 403 (not 401) when production access is blocked.

---

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Minimal new surface area | Fewer new files = lower defect introduction and simpler rollback | High |
| Reuses existing patterns exactly | Reduces implementation risk and review overhead | High |
| Test seam quality | New code must be independently testable at unit level | High |
| No disruption to existing chat UX | Broadcast viewer must not interfere with activity/DM channels | High |
| Rollout independence | Prime CF function + guest app + Reception changes should deploy independently | Medium |
| Guest read-only enforcement | Guests must not post into `broadcast_*` channels | High |
| Partial-failure behaviour | Thread created but no draft is an acceptable transient state | Low |

---

## Options Considered

### Fork A: Guest broadcast display

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A1: `mode=broadcast` branch in existing `chat/channel/page.tsx` | Add a third `ChannelMode` value `'broadcast'`. Skip `activity` requirement. Disable send form. Add nav entry point from chat page or nav. | Zero new route files. Existing page.test.tsx harness reused directly. URL pattern consistent with activity/direct. | Adds a third branch to an already branching page. Future per-booking channels would each need a URL param. | Must guard against guests using `?mode=broadcast` on non-broadcast channels. | Yes |
| A2: Standalone `/chat/broadcast-viewer` page | New page at `apps/prime/src/app/(guarded)/chat/broadcast-viewer/page.tsx`. Hardcoded to `broadcast_whole_hostel`. | Cleaner page with zero legacy branches. Channel ID doesn't need to be a URL param — can be hardcoded. | New route file + new test file. Navigation from chat page requires a link to a different route. | No harness to inherit; new test from scratch (but straightforward). | Yes |

### Fork B: Reception compose UI location

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| B1: Compose button in PrimeColumn header | Small "New broadcast" button in the Prime column header alongside the column title, triggering a modal/drawer. | Co-located with Prime threads — clear affordance. Consistent with the column's existing "compose" mental model. No InboxWorkspace changes needed. | PrimeColumn header currently has icon + label + optional count badge — one additional element fits cleanly. | Minor layout constraint — manageable. | Yes |
| B2: Floating action button in InboxWorkspace | FAB positioned over the Prime column in the desktop layout. | More visible. Common mobile pattern. | InboxWorkspace is a wider-scope component — changes are harder to isolate. Requires z-index handling in 3-col layout. | Higher blast radius — touching the shared workspace layout is riskier. | Yes (less preferred) |

---

## Engineering Coverage Comparison

| Coverage Area | Option A1 (broadcast branch) | Option A2 (new viewer page) | Chosen implication |
|---|---|---|---|
| UI / visual | Extends existing channel page JSX with a conditional block. Uses existing message list component. Adds a "Staff messages" link from the chat page. | New page with own JSX. Potentially cleaner but requires duplicating the message list rendering pattern. | **A1 chosen**: reuses existing render tree. Compose button in PrimeColumn header (B1). |
| UX / states | Leverages existing channel page loading/error states. Send form disabled via `channelMode === 'broadcast'` guard. | Must re-implement loading/error states from scratch. | A1: inherits states. Both options need send-disabled guard. |
| Security / privacy | Guest cannot send to broadcast: conditional guard on `handleSendMessage` + send button disabled. `channelMode=broadcast` is URL-supplied — must validate `id` equals `'broadcast_whole_hostel'` exactly. Note: `WHOLE_HOSTEL_THREAD_ID` is not currently exported from `directMessageChannel.ts` (private to `prime-whole-hostel-campaigns.ts`); plan must export it or inline the string. Prefix-only check (`isBroadcastChannelId()`) is insufficient — would accept future `broadcast_booking_<id>` IDs. | Hardcoded channel ID removes parameter forgery risk. | A1: equality param validation required (export constant or inline string). A2: cleaner security. Chosen (A1) uses `id === 'broadcast_whole_hostel'` guard. |
| Logging / observability / audit | No change to ChatProvider listener — same RTDB subscription as activity channels. Admission log via `recordPrimeMessageAdmission` on send path. | Same. | Both identical. Carry existing admission logging to new initiation endpoint. |
| Testing / validation | Extends `page.test.tsx` with `mode=broadcast` cases. No new harness setup. | New test file with new harness. Pattern established by `page.test.tsx` but requires duplication. | A1: lower test setup cost. |
| Data / contracts | No data model changes. `broadcast_whole_hostel` is the fixed thread ID. | Same. | Neither option requires schema changes. |
| Performance / reliability | Single RTDB node `broadcast_whole_hostel/messages`. RTDB `onChildAdded` already handles this path. `upsertPrimeMessageThread` is idempotent — partial-completion (thread created, no draft) leaves system in recoverable state. | Same. | No fan-out needed. Synchronous Firebase projection acceptable. Rate limit on send path. |
| Rollout / rollback | New `mode=broadcast` doesn't break existing `mode=activity` or `mode=direct` routes. Entire feature is additive (new endpoint, new mode, new compose button). | Same additive characteristic. New route has no pre-existing users. | Both fully additive. Rollback is file deletion. No DB migrations to revert. |

---

## Chosen Approach

- **Recommendation:** Option A1 (`mode=broadcast` branch in `chat/channel/page.tsx`) + Option B1 (compose button in PrimeColumn header).

- **Why this wins:**
  - **A1 over A2**: The existing `chat/channel/page.tsx` already has the correct test harness, the correct RTDB message rendering, and the correct ChatProvider integration. A `broadcast` mode adds one conditional branch and guards against the send form — the `direct` mode branch is the exact precedent. A new standalone page would duplicate 80% of the channel page code with no meaningful UX benefit. The URL param security risk (guest using `?mode=broadcast&id=broadcast_booking_<x>`) is mitigated by an equality check against the canonical string `'broadcast_whole_hostel'` — either via an exported constant added to `directMessageChannel.ts` (plan task) or the string inlined directly. NOT via `isBroadcastChannelId()` which is a prefix-only check accepting any `broadcast_*` id.
  - **B1 over B2**: PrimeColumn is a focused, isolated component that only concerns itself with Prime threads. Adding a "New broadcast" button to the column header is co-located with the relevant affordance and keeps `InboxWorkspace` unchanged. FAB approach (B2) would require z-index coordination in a shared 3-column layout and adds risk to the InboxWorkspace component which handles both mobile and desktop layouts.

- **What it depends on:**
  - A constant equal to `'broadcast_whole_hostel'` must be used for the equality security check in the `broadcast` mode branch. `WHOLE_HOSTEL_THREAD_ID` is currently a private constant in `apps/prime/functions/lib/prime-whole-hostel-campaigns.ts` and is NOT exported from `apps/prime/src/lib/chat/directMessageChannel.ts`. The plan must either: (a) export this constant from `directMessageChannel.ts` (preferred — already the canonical channel naming module), or (b) inline the string `'broadcast_whole_hostel'` directly in the guard. Do not use `isBroadcastChannelId()` — it is a prefix-only check that would accept future `broadcast_booking_<id>` IDs.
  - PrimeColumn header currently renders: an icon, the "Prime" label, and an optional thread count badge. Space is available for a small compose button alongside or below the header row.
  - `enforceStaffOwnerApiGate` and `requireStaffAuth` already deployed (confirmed).

### Rejected Approaches

- **A2 (standalone broadcast-viewer page)** — rejected because it duplicates the channel page rendering logic without adding clarity. The `direct` mode branch in `chat/channel/page.tsx` is the exact precedent for a non-activity channel mode. Adding `broadcast` as a third mode is the lower-surface, lower-test-cost option.
- **B2 (FAB in InboxWorkspace)** — rejected because it requires changes to `InboxWorkspace`, the shared 3-col layout root, which is a wider blast radius than needed. PrimeColumn-local compose button achieves the same goal with no shared component changes.
- **Auto-subscribe on session mount** — rejected because ChatProvider maintains only one `currentChannelId`; setting it on mount would tear down any active activity or DM listener immediately. Must be an explicit navigation destination.

### Open Questions (Operator Input Required)

None. All design forks are resolved by codebase evidence. The three open questions from the fact-find are answered above: A1 for guest display, B1 for compose location, whole-hostel only for v1.

---

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Staff broadcast initiation | No path exists. `savePrimeReviewDraft` returns `not_found` for absent threads. | Staff clicks "New broadcast" button in PrimeColumn header | 1. Staff clicks compose → modal/drawer opens with text area. 2. Staff enters message, clicks "Send". 3. Reception `POST /api/mcp/inbox/prime-compose` calls `requireStaffAuth` → extracts `actorUid`. 4. Route calls `initiatePrimeOutboundThread()` in `prime-review.server.ts` with text + actorUid. 5. Prime `POST /api/staff-initiate-thread` runs: `upsertPrimeMessageThread(db, { id: 'broadcast_whole_hostel', bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })` (note: `bookingId` is required at type level — plan must decide whether to use empty string or add a nullable variant to `CreatePrimeMessageThreadInput`) → `savePrimeReviewDraft(threadId, text, actorUid)` (which internally calls `ensureWholeHostelCampaignForDraft` — no separate call needed). 6. Reception receives the raw Prime thread ID `'broadcast_whole_hostel'`, builds the prefixed inbox ID via `buildPrimeInboxThreadId('broadcast_whole_hostel')` → `prime:broadcast_whole_hostel` (prefix is `prime:`, not `prime_thread_`), then calls `sendPrimeInboxThread('prime:broadcast_whole_hostel', actorUid)` which, finding a broadcast thread with an active campaign, routes to `POST /api/review-campaign-send?campaignId=<id>` → `sendPrimeReviewCampaign` → RTDB projection. 7. Reception shows success toast. Compose modal closes. Note: after send, the broadcast thread gains `reviewStatus='sent'` and is filtered out of the inbox list by `isPrimeThreadVisibleInInbox()` — the thread does NOT remain visible in PrimeColumn after send. This is expected behavior (sent broadcasts are not pending review). | Existing inbound-first flow unchanged. All prior review endpoints unaltered. | Partial completion (thread created, no draft): `upsertPrimeMessageThread` is idempotent — retry is safe. Draft creation failure leaves thread row but no draft; retry via same compose endpoint succeeds. Rate limit on send path should be KV-based per actorUid. |
| Guest broadcast viewing | Channel page (`chat/channel/page.tsx`) renders "Loading activity..." indefinitely for broadcast channels. No guest-facing entry point exists. | Guest navigates to "Staff messages" link in Prime chat page → `/chat/channel?mode=broadcast&id=broadcast_whole_hostel` | 1. Guest taps "Staff messages" link from the chat page. 2. Channel page loads with `mode=broadcast` (new third mode). 3. Page validates `id` param equals `'broadcast_whole_hostel'` exactly — if not, shows error (equality check, not prefix-only `isBroadcastChannelId()` which would accept future `broadcast_booking_<id>` IDs). 4. `useEffect` calls `setCurrentChannelId('broadcast_whole_hostel')`. 5. ChatProvider's existing non-dm_ branch subscribes to `messaging/channels/broadcast_whole_hostel/messages` via RTDB `onChildAdded`. 6. Messages render in the message list. 7. Send form is absent — guests are read-only on broadcast channels. 8. Cleanup on unmount clears channel subscription. | ChatProvider listener logic unchanged. Activity and DM channels unaffected. Page URL pattern consistent with existing channel routing. | Equality string check required. Note: `WHOLE_HOSTEL_THREAD_ID` is private in `prime-whole-hostel-campaigns.ts`; plan must export it from `directMessageChannel.ts` or inline `'broadcast_whole_hostel'`. |
| Reception compose capability | No compose affordance in PrimeColumn. `InboxChannelCapabilities` has no compose flag. | Staff arrives at Inbox page | PrimeColumn header shows a "New broadcast" button (small `+` icon or labeled). Button is always visible in the column header — it is a column-level affordance, not gated by any thread capability flag. PrimeColumn does not receive channel descriptor objects, only thread summaries, so capability-flag gating is not applicable. Clicking the button opens a compose modal/drawer; state lives in PrimeColumn or a new `usePrimeCompose` hook. After send completes, modal closes. Thread list state is unchanged (sent threads are filtered out). | EmailColumn unchanged. InboxWorkspace unchanged. ThreadDetailPane unchanged. `InboxChannelCapabilities` type unchanged — no new `supportsCompose` flag needed. | Compose button is always rendered — ensure it is styled consistently with the column header and responsive on mobile. |

---

## Planning Handoff

- **Planning focus:**
  - Four independent deliverable layers (can be parallelised but have a dependency order): (1) Prime CF function endpoint, (2) Prime guest channel page `broadcast` mode + nav entry point, (3) Reception proxy function + API route, (4) Reception compose UI.
  - Dependency: Reception compose UI requires the Prime endpoint to be deployed or mockable.
  - The `staff-initiate-thread` endpoint should call `upsertPrimeMessageThread` then `savePrimeReviewDraft` sequentially. Since these are not transactional, the plan should document that a failed draft creation leaves a thread row — this is tolerable because `upsertPrimeMessageThread` is idempotent and a retry will succeed.
  - Rate limit on send path: the plan should add a KV-based send rate limit scoped per `actorUid` to `review-campaign-send` / `sendPrimeReviewCampaign` — the actual send path for broadcast threads (not `review-thread-send` / `sendPrimeReviewThread`, which is the DM/review send path). This is a gap in the existing flow too — flag it as a standalone task covering both send endpoints.

- **Validation implications:**
  - New Prime function endpoint: test happy path (`broadcast_whole_hostel` thread created + draft), partial-failure (thread upserted, draft fails — verify thread row present), gate rejection (no valid token in production → 403 from `enforceStaffOwnerApiGate`; missing bearer token → 401 from `enforceStaffAuthTokenGate` if used).
  - Guest channel page `broadcast` mode: test with no `activity` in context (must render messages, not spinner). Test with `mode=broadcast` and non-broadcast `id` param (must reject or show error). Test that send button is absent.
  - Reception compose API: test `requireStaffAuth` rejection, test proxy config absent (503 not 500), test success path.
  - All tests follow established harness patterns (no new test infrastructure needed).

- **Sequencing constraints:**
  - Layer 1 (Prime endpoint) must be merged before Layer 3 (Reception proxy) can be tested end-to-end.
  - Layer 2 (guest channel page) is fully independent — can be merged in any order.
  - Layer 4 (Reception compose UI) can be built and merged after Layer 3.
  - No DB migrations needed — zero migration ordering risk.

- **Risks to carry into planning:**
  - Rate limit on broadcast send path is a new task (currently both existing send endpoints are ungated beyond auth). Plan should include this as a distinct task.
  - Equality check against `'broadcast_whole_hostel'` (not `isBroadcastChannelId()` prefix check) on the `broadcast` mode branch — must prevent guests subscribing to future booking/room broadcast IDs. `WHOLE_HOSTEL_THREAD_ID` is currently private in `prime-whole-hostel-campaigns.ts` — plan must export it from `directMessageChannel.ts` or inline the string.
  - No `InboxChannelCapabilities` type change needed — compose button is always visible in PrimeColumn header (column-level affordance, not thread-capability-gated).
  - `RECEPTION_PRIME_API_BASE_URL` and `RECEPTION_PRIME_ACCESS_TOKEN` must be set in the production Reception deployment before the compose route is enabled. Graceful fallback: return 503 if config absent.

---

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Partial completion on thread initiation (thread row created, draft fails) | Low | Low | `upsertPrimeMessageThread` is idempotent; retry is safe. No rollback logic needed, but plan should document the partial-state behavior. | Add error-handling note to `staff-initiate-thread` implementation task. |
| Guest URL param forgery (`?mode=broadcast&id=<arbitrary>`) | Medium | Medium | Analysis resolved the approach; constant availability is a plan-level task. | Use equality check `id === 'broadcast_whole_hostel'` in `broadcast` mode branch (not prefix check — `isBroadcastChannelId()` would accept future booking/room IDs). Plan must export `WHOLE_HOSTEL_THREAD_ID` from `directMessageChannel.ts` or inline the string. Reject non-matching IDs with error screen or redirect. |
| Missing rate limit on send path | Medium | Medium | Existing endpoints are also ungated — this is a pre-existing gap, not introduced by this feature. | Plan should include a dedicated rate-limit task for `review-campaign-send` / `sendPrimeReviewCampaign` (the broadcast send path). As a lower-priority companion, cover `review-thread-send` / `sendPrimeReviewThread` (DM/review send path) in the same task or a follow-up. |
| Reception config absent at runtime | Low | Medium | Known from fact-find. | New compose route returns 503 (not 500) when `RECEPTION_PRIME_API_BASE_URL` absent. Separate from list endpoint graceful degradation. |
| Guest nav entry point discoverability | Low | Low | Design risk, not implementation risk. "Staff messages" link location (e.g., below the activity list on the chat page) is a UX call for the implementation task. | Plan should specify where the nav link lives with enough specificity that the build task doesn't require another design decision. |

---

## Planning Readiness

- Status: Go
- Rationale: All three design forks resolved (A1 broadcast mode, B1 PrimeColumn compose button, whole-hostel only for v1). No operator-only unknowns remain. All entry points, auth contracts, data contracts, and test harnesses confirmed. Four deliverable layers identified with clear dependency order. No DB migrations. No new test infrastructure needed.
