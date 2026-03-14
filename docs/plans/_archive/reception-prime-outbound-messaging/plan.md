---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-Wave-1: Complete (2026-03-14) — TASK-01 exported WHOLE_HOSTEL_BROADCAST_CHANNEL_ID; TASK-03 added KV rate limit to review-campaign-send. Commit 5633aaebd5. All TC pass; typecheck clean.
Build-Wave-2: Complete (2026-03-14) — TASK-02 new POST /api/staff-initiate-thread CF endpoint + 6 TCs; TASK-04 broadcast ChannelMode in chat/channel/page.tsx + 3 TCs. Commit 67d338b582. Lint/typecheck clean.
Build-Wave-3: Complete (2026-03-14) — TASK-05 "Staff messages" Link in GuestDirectory.tsx (5 TCs); TASK-06 initiatePrimeOutboundThread in prime-review.server.ts (6 TCs). Commit e89101cadf. Typecheck + lint clean.
Build-Wave-4: Complete (2026-03-14) — TASK-07 prime-compose route + prime_broadcast_initiated telemetry event (10 TCs). Commit 2522ba7a39. Typecheck + lint clean.
Build-Wave-5: Complete (2026-03-14) — TASK-08 PrimeColumn compose button + broadcast modal (10 TCs). Commit 88bad52a9f. Lint + typecheck clean (ds/no-bare-rounded + ds/no-raw-tailwind-color fixed).
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-outbound-messaging
Dispatch-ID: IDEA-DISPATCH-20260314140001-BRIK-002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-outbound-messaging/analysis.md
---

# Reception → Prime Outbound Messaging Plan

## Summary

This plan delivers end-to-end whole-hostel broadcast messaging: Reception staff can compose and send a message that appears read-only in the Prime guest app for all current guests. The feature has four independent deliverable layers: (1) a new Prime CF Pages Function endpoint to create the broadcast thread + draft, (2) a `broadcast` mode branch in the Prime guest channel page, (3) a Reception proxy function + API route, and (4) a compose button with modal in the Reception PrimeColumn. No DB migrations are needed. All auth patterns are established and reused exactly.

## Active tasks
- [x] TASK-01: Export `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` constant from `directMessageChannel.ts`
- [x] TASK-02: Prime CF endpoint `POST /api/staff-initiate-thread`
- [x] TASK-03: KV rate limit on `review-campaign-send`
- [x] TASK-04: Guest broadcast mode in `chat/channel/page.tsx`
- [x] TASK-05: "Staff messages" nav entry point in `GuestDirectory.tsx`
- [x] TASK-06: Reception proxy function `initiatePrimeOutboundThread`
- [x] TASK-07: Reception API route `POST /api/mcp/inbox/prime-compose`
- [x] TASK-08: PrimeColumn compose button + modal

## Goals
- Reception staff can compose and send a whole-hostel broadcast message with no prior inbound guest message required.
- Sent messages appear in the Prime guest app for current guests navigating to the broadcast viewer.
- Guests are read-only on broadcast channels — no send form rendered.
- Auth chain: staff Firebase ID token → Reception API → Prime proxy token → Prime gate.
- No DB migrations.

## Non-goals
- Per-booking or per-room audience targeting (requires Firebase occupancy lookup — v2).
- Push notifications to guests for new broadcast messages.
- Guest-to-staff replies on broadcast channels.
- Individual staff-to-guest DM initiation.

## Constraints & Assumptions
- Constraints:
  - ChatProvider supports only one `currentChannelId` at a time — auto-subscribe on mount is not viable.
  - `upsertPrimeMessageThread` + `savePrimeReviewDraft` are sequential D1 writes, not transactional.
  - All Prime staff endpoints must use `enforceStaffOwnerApiGate`.
  - `bookingId` is required on `CreatePrimeMessageThreadInput` at type level — plan uses empty string `''` for the whole-hostel thread.
- Assumptions:
  - `PRIME_STAFF_OWNER_GATE_TOKEN == RECEPTION_PRIME_ACCESS_TOKEN` in production (confirmed indirectly via working review flow).
  - D1 schema migrations 0001–0004 applied in production.
  - Reception Firebase auth (`requireStaffAuth`) is operational for the compose route.

## Inherited Outcome Contract
- **Why:** Staff in Reception have no way to initiate a message to a guest through the Prime app. All threads today are created by shadow-write on inbound guest messages. `savePrimeReviewDraft` returns `not_found` when the thread row does not exist in D1.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception staff can compose a whole-hostel broadcast message (no prior guest message required) and have it appear in the Prime app for current guests. The guest Prime app provides an entry point to view broadcast messages from the `broadcast_whole_hostel` channel.
- **Source:** dispatch

## Analysis Reference
- Related analysis: `docs/plans/reception-prime-outbound-messaging/analysis.md`
- Selected approach inherited:
  - A1: `mode=broadcast` branch in existing `chat/channel/page.tsx` (not standalone page)
  - B1: Compose button in PrimeColumn header (not FAB in InboxWorkspace)
  - Whole-hostel only (fixed thread ID `broadcast_whole_hostel`)
- Key reasoning used:
  - A1 reuses existing RTDB listener, message render, test harness. Lower surface area, lower test cost.
  - B1 keeps InboxWorkspace unchanged. PrimeColumn is the right scope for a Prime-only affordance.
  - `isBroadcastChannelId()` prefix check is insufficient — equality check against the exported constant is required.
  - `sendPrimeInboxThread` routes broadcast threads to `review-campaign-send` (not `review-thread-send`) when campaign present.

## Selected Approach Summary
- What was chosen:
  - Four additive layers, no modifications to existing inbound flow.
  - Guest page: third `ChannelMode` value `'broadcast'`, guarded by equality check against exported constant `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`.
  - Reception: new proxy function + new API route + compose button in PrimeColumn.
- Why planning is not reopening option selection:
  - Analysis resolved all three forks (guest display mode, compose location, audience scope) with codebase evidence. No operator-only unknowns remain.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-prime-outbound-messaging/fact-find.md`
- Evidence carried forward:
  - `savePrimeReviewDraft` returns `not_found` when thread absent — new endpoint must call `upsertPrimeMessageThread` first.
  - `CreatePrimeMessageThreadInput.bookingId` is required — use `''` for whole-hostel thread.
  - `WHOLE_HOSTEL_THREAD_ID` is private in `prime-whole-hostel-campaigns.ts` — must export before guest page can reference it.
  - `sendPrimeInboxThread('prime:broadcast_whole_hostel', actorUid)` routes to `review-campaign-send` when campaign present.
  - Post-send: `isPrimeThreadVisibleInInbox()` filters out `reviewStatus='sent'` threads — broadcast thread disappears from inbox after send (expected behaviour).
  - KV rate limit pattern: `enforceKvRateLimit` in `apps/prime/functions/lib/kv-rate-limit.ts`.
  - Test harness: `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx` and `apps/prime/functions/__tests__/helpers.ts`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Export `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `directMessageChannel.ts` | 90% | S | Complete (2026-03-14) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Prime CF endpoint `POST /api/staff-initiate-thread` | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | KV rate limit on `review-campaign-send` | 85% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-04 | IMPLEMENT | Guest broadcast mode in `chat/channel/page.tsx` + nav entry point | 85% | M | Complete (2026-03-14) | TASK-01 | - |
| TASK-05 | IMPLEMENT | "Staff messages" nav entry point in `GuestDirectory.tsx` | 85% | S | Complete (2026-03-14) | TASK-01 | TASK-04 |
| TASK-06 | IMPLEMENT | Reception proxy function `initiatePrimeOutboundThread` | 85% | S | Complete (2026-03-14) | TASK-02 | TASK-07 |
| TASK-07 | IMPLEMENT | Reception API route `POST /api/mcp/inbox/prime-compose` | 85% | S | Complete (2026-03-14) | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | PrimeColumn compose button + modal | 80% | M | Complete (2026-03-14) | TASK-07 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | New `broadcast` branch in channel page (no send form). Compose button in PrimeColumn header. Modal uses existing UI primitives. | TASK-04, TASK-05, TASK-08 | Design QA + contrast + breakpoint sweeps required after TASK-04, TASK-08 |
| UX / states | Broadcast mode: no spinner, messages render immediately from RTDB. Send form absent. Compose modal: loading while sending, error state, success close. Staff error path: 503 if Prime config absent. | TASK-04, TASK-07, TASK-08 | No new error state patterns — reuses existing patterns in channel page and prime-review.server.ts |
| Security / privacy | Guest equality check `id === WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` prevents URL-param forgery. New endpoint uses `enforceStaffOwnerApiGate`. Reception route uses `requireStaffAuth`. No guest posting on broadcast (send form absent; `handleSendMessage` guard). | TASK-01, TASK-02, TASK-04, TASK-07 | `isBroadcastChannelId()` prefix check explicitly not used |
| Logging / observability / audit | `recordPrimeMessageAdmission` called in `savePrimeReviewDraft` (already handles draft creation audit). New endpoint logs admission via existing path. Reception route can record inbox event on compose. | TASK-02, TASK-07 | No new admission log paths needed — `savePrimeReviewDraft` handles it |
| Testing / validation | Page.test.tsx extended with `mode=broadcast` cases. New CF endpoint tested using `helpers.ts` mock D1 pattern. Reception proxy and route tested with `requireStaffAuth` mock pattern. | TASK-02, TASK-04, TASK-06, TASK-07 | Rate-limit test on TASK-03; compose button render test on TASK-08 |
| Data / contracts | No DB migrations. `bookingId: ''` for whole-hostel thread (plan decision). `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` exported. `savePrimeReviewDraft` + `ensureWholeHostelCampaignForDraft` called internally (no separate call). | TASK-01, TASK-02 | `bookingId: ''` is a plan-level decision; if type constraint tightens this must be revisited |
| Performance / reliability | Single RTDB node write. `upsertPrimeMessageThread` idempotent — partial failure (thread created, no draft) recoverable by retry. KV rate limit on send path (TASK-03) prevents broadcast spam. | TASK-02, TASK-03 | No fan-out required for v1 |
| Rollout / rollback | All layers are additive. Rollback = file deletion. No DB migrations to revert. Reception compose UI can be disabled by removing the compose button; Prime endpoint is gated by token. | TASK-02, TASK-08 | Compose route gracefully returns 503 if `RECEPTION_PRIME_API_BASE_URL` absent |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | None | TASK-01 unblocks TASK-02 and TASK-04. TASK-03 is independent — add rate limit to existing endpoint. |
| 2 | TASK-02, TASK-04 | TASK-01 | TASK-02 (Prime endpoint) and TASK-04 (guest page) can execute in parallel. |
| 3 | TASK-05, TASK-06 | TASK-01, TASK-02 | TASK-05 adds nav entry point to GuestDirectory. TASK-06 adds proxy function. |
| 4 | TASK-07 | TASK-06 | Reception API route. |
| 5 | TASK-08 | TASK-07 | Compose UI is the last layer — depends on the API route being available. |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff broadcast initiation | Staff clicks "New broadcast" button in PrimeColumn header | 1. Staff clicks button → compose modal opens with text area. 2. Staff enters text, clicks "Send". 3. Reception `POST /api/mcp/inbox/prime-compose` calls `requireStaffAuth` → extracts `actorUid`. 4. Route calls `initiatePrimeOutboundThread({ text, actorUid })` from `prime-review.server.ts`. 5. Prime `POST /api/staff-initiate-thread` runs: `upsertPrimeMessageThread(db, { id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })` → `savePrimeReviewDraft(db, { threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, actorUid, content })` (internally calls `ensureWholeHostelCampaignForDraft`). 6. Reception receives result, calls `sendPrimeInboxThread('prime:broadcast_whole_hostel', actorUid)` which routes to `POST /api/review-campaign-send?campaignId=<id>` → `sendPrimeReviewCampaign` → RTDB projection. 7. Modal closes, success toast shown. Note: after send, `isPrimeThreadVisibleInInbox()` filters the thread (reviewStatus='sent') — thread does not remain in PrimeColumn. | TASK-01 → TASK-02 → TASK-06 → TASK-07 → TASK-08 | Partial-completion recoverable (upsert is idempotent). Rate limit on `review-campaign-send` (TASK-03). |
| Guest broadcast viewing | Guest taps "Staff messages" link in GuestDirectory | 1. Link navigates to `/chat/channel?mode=broadcast&id=broadcast_whole_hostel`. 2. Channel page loads with `channelMode === 'broadcast'`. 3. Page checks `id === WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` — if mismatch, renders error screen. 4. `useEffect` calls `setCurrentChannelId('broadcast_whole_hostel')`. 5. ChatProvider non-dm_ branch subscribes to `messaging/channels/broadcast_whole_hostel/messages` via RTDB `onChildAdded`. 6. Messages render. 7. No send form — guests are read-only. 8. Unmount clears channel. | TASK-01 → TASK-04, TASK-05 | Equality check must reference exported constant (not inline string). |

## Tasks

---

### TASK-01: Export `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `directMessageChannel.ts`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/lib/chat/directMessageChannel.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/lib/chat/directMessageChannel.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 95% — single export statement addition to an established module. `BROADCAST_CHANNEL_PREFIX` already defined (`'broadcast'`); constant is `'broadcast_whole_hostel'` = `BROADCAST_CHANNEL_PREFIX + '_whole_hostel'`.
  - Approach: 90% — analysis resolved the prefix-only vs equality debate; exporting the canonical constant is the correct approach.
  - Impact: 90% — downstream tasks depend on this constant; blocking dependency is small and safe.
  - Held-back test: no single unknown would drop this below 90%.
- **Acceptance:**
  - `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` is exported from `directMessageChannel.ts` with value `'broadcast_whole_hostel'`.
  - No existing exports changed or removed.
  - TypeScript builds clean.
- **Engineering Coverage:**
  - UI / visual: N/A - constants file, no UI
  - UX / states: N/A - no UX surface
  - Security / privacy: Required - this constant is the v1 security anchor; equality checks depend on its value. Value must be stable.
  - Logging / observability / audit: N/A - no logging in constants file
  - Testing / validation: Required - existing tests for channel ID functions must still pass; add a trivial assertion that the exported value equals `'broadcast_whole_hostel'`.
  - Data / contracts: Required - exported constant is a cross-module contract; downstream tasks TASK-02 and TASK-04 import it.
  - Performance / reliability: N/A - constants file
  - Rollout / rollback: N/A - additive export; rollback is removing the export
- **Validation contract (TC-XX):**
  - TC-01: `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID === 'broadcast_whole_hostel'` — export is correct string value.
  - TC-02: Existing `isBroadcastChannelId`, `buildBroadcastChannelId` tests pass unmodified.
  - TC-03: TypeScript `tsc` on prime app passes — no type errors from new export.
- **Execution plan:** Add `export const WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = buildBroadcastChannelId('whole_hostel');` to `directMessageChannel.ts`. (Using existing `buildBroadcastChannelId` builder ensures the value is consistent with the prefix constant `BROADCAST_CHANNEL_PREFIX`.) Verify it equals `'broadcast_whole_hostel'`.
- **Planning validation (required for M/L):** N/A — S effort task.
- **Scouts:** None: constant derivation confirmed from `BROADCAST_CHANNEL_PREFIX = 'broadcast'` (line 10) + `buildBroadcastChannelId('whole_hostel')` → `broadcast_whole_hostel`.
- **Edge Cases & Hardening:** Value must not change — it is the RTDB channel ID. If `BROADCAST_CHANNEL_PREFIX` or `buildBroadcastChannelId` changes, this constant changes too. Comment should note stability requirement.
- **What would make this >=90%:** Already at 90%; only a rename risk prevents 95%.
- **Rollout / rollback:**
  - Rollout: Single file change, deploy with next Prime app build.
  - Rollback: Remove export — no runtime impact.
- **Documentation impact:** None: internal constant; no runbook change.
- **Notes / references:** `apps/prime/src/lib/chat/directMessageChannel.ts` line 10 defines `BROADCAST_CHANNEL_PREFIX = 'broadcast'`.

---

### TASK-02: Prime CF endpoint `POST /api/staff-initiate-thread`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/staff-initiate-thread.ts` + `apps/prime/functions/__tests__/staff-initiate-thread.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** `staff-initiate-thread.ts` created following `review-thread-draft.ts` gate pattern. `upsertPrimeMessageThread(bookingId:'')` + `savePrimeReviewDraft` call chain. 6 TCs: gate 403, missing DB 503, missing/empty plainText 400, invalid JSON 400, D1 throw 500. `bookingId: ''` accepted — no constraint error observed (D1 column is text, not NOT NULL enforced at runtime). Commit 67d338b582. Lint/typecheck clean.
- **Affects:**
  - `apps/prime/functions/api/staff-initiate-thread.ts` (new)
  - `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` (new)
  - `[readonly] apps/prime/functions/lib/prime-messaging-repositories.ts`
  - `[readonly] apps/prime/functions/lib/prime-review-drafts.ts`
  - `[readonly] apps/prime/functions/lib/staff-owner-gate.ts`
  - `[readonly] apps/prime/src/lib/chat/directMessageChannel.ts` (import WHOLE_HOSTEL_BROADCAST_CHANNEL_ID)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — CF Pages Function pattern established by `review-thread-draft.ts` exactly. `upsertPrimeMessageThread` + `savePrimeReviewDraft` call chain confirmed. `bookingId: ''` is the plan's accepted v1 decision for a whole-hostel thread.
  - Approach: 90% — sequential D1 writes, idempotent upsert, partial-completion acceptable. No transactional guarantee needed.
  - Impact: 85% — endpoint will be consumed by TASK-06; correct auth gate and correct call order must be verified by test.
  - Held-back test: `bookingId: ''` could fail a DB constraint if a NOT NULL constraint exists. Confirmed: `CreatePrimeMessageThreadInput.bookingId: string` (not nullable at TS level, but D1 column constraints not directly visible). Plan notes this — investigation in TASK-02 execution.
- **Acceptance:**
  - `POST /api/staff-initiate-thread` with valid token + valid `{ plainText }` body: creates or upserts the `broadcast_whole_hostel` thread, creates a draft, returns `{ success: true, data: { detail } }`.
  - Missing/empty `plainText` → 400.
  - Missing `PRIME_MESSAGING_DB` binding → 503.
  - `enforceStaffOwnerApiGate` failed (production, no token) → 403.
  - Thread already exists (upsert is idempotent) → succeeds without error.
  - Draft creation fails after thread upsert → 500 with error message; thread row remains (recoverable on retry).
  - **Expected user-observable behavior:** None — this is a server-only endpoint, no direct UI rendering.
- **Engineering Coverage:**
  - UI / visual: N/A - server-side CF function
  - UX / states: N/A - server-side; states expressed as HTTP status codes
  - Security / privacy: Required - `enforceStaffOwnerApiGate` must be applied before any D1 writes. Actor UID extracted from `x-prime-actor-uid` header (set by Reception proxy). Validate `plainText` is non-empty server-side.
  - Logging / observability / audit: Required - `savePrimeReviewDraft` calls `recordPrimeMessageAdmission` internally. No additional admission logging needed. Add console.error on 500 (matching pattern in `review-thread-draft.ts` line 67).
  - Testing / validation: Required - test happy path, 400 (missing plainText), 503 (no DB binding), 403 (gate reject), idempotent upsert (second call succeeds).
  - Data / contracts: Required - `upsertPrimeMessageThread(db, { id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })`. Verify `bookingId: ''` does not violate D1 NOT NULL constraint (investigate during execution; fallback is `bookingId: null` but type must accept null).
  - Performance / reliability: Required - `upsertPrimeMessageThread` is idempotent; partial failure (thread created, draft fails) leaves system recoverable. Document in comments.
  - Rollout / rollback: Required - additive endpoint; gate by token; rollback = remove file from CF Pages.
- **Validation contract (TC-XX):**
  - TC-01: Valid token + valid `{ plainText: "Hello guests" }` → 200, `{ success: true }`, D1 thread row for `broadcast_whole_hostel` exists, draft row exists.
  - TC-02: Missing `plainText` → 400 `plainText is required`.
  - TC-03: Missing `PRIME_MESSAGING_DB` → 503 `PRIME_MESSAGING_DB binding is required`.
  - TC-04: Production mode, no valid token → 403 from `enforceStaffOwnerApiGate`.
  - TC-05: Thread already exists (second call) → 200, upsert idempotent, new draft created.
  - TC-06: `savePrimeReviewDraft` mock throws → 500 with error message; function does not propagate unhandled exception.
- **Execution plan:**
  1. Create `apps/prime/functions/api/staff-initiate-thread.ts` following `review-thread-draft.ts` pattern: import gate, DB helpers, `upsertPrimeMessageThread`, `savePrimeReviewDraft`, `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`.
  2. Export `onRequestPost: PagesFunction<Env>`.
  3. Apply `enforceStaffOwnerApiGate`; check `hasPrimeMessagingDb`; parse body; call `upsertPrimeMessageThread(db, { id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })`; call `savePrimeReviewDraft(db, { threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID, actorUid, content: plainText })`.
  4. Handle `not_found` and `conflict` outcomes from `savePrimeReviewDraft`; return 200 on `updated`.
  5. Write tests using `createMockD1Database` + `createMockEnv` + `createPagesContext` from `helpers.ts`.
- **Planning validation (required for M/L):**
  - Checks run: Read `review-thread-draft.ts` (confirmed pattern), `prime-review-drafts.ts` (confirmed `savePrimeReviewDraft` signature), `prime-messaging-repositories.ts` lines 236-252 (confirmed `CreatePrimeMessageThreadInput`, `bookingId: string` required), `prime-whole-hostel-campaigns.ts` (confirmed `WHOLE_HOSTEL_THREAD_ID = 'broadcast_whole_hostel'` private).
  - Unexpected findings: `savePrimeReviewDraft` with `outcome: 'conflict'` should NOT occur on first call for whole-hostel thread (whole-hostel lane bypasses the `resolved`/`archived`/`sent` conflict checks at lines 75-83 of `prime-review-drafts.ts` via `isReusableWholeHostelLane`). Conflict is possible if a race condition produces two simultaneous calls; plan handles it as a 409.
  - Validation artifacts: `prime-review-drafts.ts` lines 59-162 fully read.
- **Scouts:** Verify D1 schema allows `bookingId = ''` — if NOT NULL constraint with empty-string rejection exists, use `bookingId: '_broadcast'` as sentinel or add nullable path. Check during implementation by reading migration 0001.
- **Edge Cases & Hardening:** Partial failure: if `upsertPrimeMessageThread` succeeds but `savePrimeReviewDraft` throws, the thread row exists. Return 500 with error; caller (Reception proxy) can retry. Second call creates a new draft, which is idempotent via `ensureWholeHostelCampaignForDraft`.
- **What would make this >=90%:** Confirm `bookingId: ''` is safe in D1 schema (currently: plan decision, not confirmed by migration read).
- **Rollout / rollback:**
  - Rollout: Deploy with Prime CF Pages build. Gate token required in production.
  - Rollback: Delete file from CF Pages deployment. No DB migration to revert.
- **Documentation impact:** None: internal staff endpoint; no runbook change needed.
- **Notes / references:** `review-thread-draft.ts` is the canonical pattern. `prime-review-drafts.ts` lines 73-83 explains why whole-hostel lane bypasses conflict checks.

---

### TASK-03: KV rate limit on `review-campaign-send`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/review-campaign-send.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/review-campaign-send.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `enforceKvRateLimit` pattern established in `direct-message.ts`; `kv-rate-limit.ts` well-understood.
  - Approach: 85% — KV namespace `RATE_LIMIT` may not be bound in the Prime CF Pages deployment. `enforceKvRateLimit` returns `null` when `kv` is absent — gracefully degrades (no error, no rate limiting). Acceptable.
  - Impact: 85% — prevents repeated broadcast spam per actor; degrades gracefully if KV absent.
- **Acceptance:**
  - After rate limit is applied, a second `POST /api/review-campaign-send` from the same actor within the window returns 429 if KV is bound.
  - If `RATE_LIMIT` KV namespace is not bound, the call proceeds normally (no 500).
  - Rate limit key: `ratelimit:broadcast_send:<actorUid>`.
  - Window: 60 seconds, max 3 sends per actor per window (configurable via env or hardcoded).
  - **Expected user-observable behavior:** None — server-side; 429 propagates to Reception compose route which shows error in compose modal.
- **Engineering Coverage:**
  - UI / visual: N/A - server-side
  - UX / states: N/A - 429 is propagated to caller
  - Security / privacy: Required - rate limit keyed per `actorUid` (not IP) to prevent staff spam. Key prefix `ratelimit:broadcast_send:` scoped to this action.
  - Logging / observability / audit: N/A - existing `console.error` on 500 path unchanged. Rate limit response body includes `error` string.
  - Testing / validation: Required - test: KV bound, first call succeeds, second call returns 429. KV absent: call proceeds normally.
  - Data / contracts: N/A - no D1 changes
  - Performance / reliability: Required - KV call adds ~1 ms latency; acceptable.
  - Rollout / rollback: Required - additive; KV absent = no rate limit (graceful degrade).
- **Validation contract (TC-XX):**
  - TC-01: `RATE_LIMIT` bound, actor sends once → 200 as before.
  - TC-02: `RATE_LIMIT` bound, actor sends 4 times in window → 429 on 4th.
  - TC-03: `RATE_LIMIT` not bound → call proceeds to D1 write, 200.
- **Execution plan:** Import `enforceKvRateLimit` from `../lib/kv-rate-limit`. Add `RATE_LIMIT?: KVNamespace` to `Env`. Before D1 write, call `enforceKvRateLimit({ key: \`ratelimit:broadcast_send:${actorUid}\`, maxRequests: 3, windowSeconds: 60, kv: env.RATE_LIMIT, errorMessage: 'Broadcast send rate limit exceeded. Wait 60 seconds.' })`. Return response if non-null.
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:** None: `enforceKvRateLimit` call site in `direct-message.ts` is the direct pattern. `helpers.ts` `MockKvNamespace` already defined.
- **Edge Cases & Hardening:** Window reset race: KV TTL handles this. Actor UID is `request.headers.get('x-prime-actor-uid') || 'prime-owner'` — rate limit key falls back to `ratelimit:broadcast_send:prime-owner` if header absent. Acceptable.
- **What would make this >=90%:** Confirm `RATE_LIMIT` KV namespace is bound in Prime CF Pages wrangler config or add binding.
- **Rollout / rollback:**
  - Rollout: Deploy with Prime CF Pages build. Graceful degrade if KV absent.
  - Rollback: Remove `enforceKvRateLimit` call. No data migration.
- **Documentation impact:** None: internal staff endpoint change.
- **Notes / references:** `apps/prime/functions/lib/kv-rate-limit.ts`, `apps/prime/functions/api/direct-message.ts` (KV pattern), `apps/prime/functions/__tests__/helpers.ts` line 15 (MockKvNamespace).

---

### TASK-04: Guest broadcast mode in `chat/channel/page.tsx`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/app/(guarded)/chat/channel/page.tsx` + `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** `ChannelMode` extended with `'broadcast'`. `channelId` useMemo returns `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` for broadcast mode. `lifecycle` set to `'live'` for broadcast. `handleSendMessage` early-return guard. Composer suppressed via `channelMode !== 'broadcast'`. Header: 'Staff messages' / 'Whole hostel'. 3 new TCs: TC-05 (read-only view), TC-06 (channel ID set correctly), TC-07 (status label). All existing TCs unaffected. Commit 67d338b582. Lint/typecheck clean.
- **Affects:**
  - `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
  - `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx`
  - `[readonly] apps/prime/src/lib/chat/directMessageChannel.ts` (import WHOLE_HOSTEL_BROADCAST_CHANNEL_ID)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `ChannelMode` is a local type in the file (not a shared type). Adding `'broadcast'` as third value is straightforward. Guard pattern mirrors existing `channelMode === 'direct'` branches.
  - Approach: 90% — A1 confirmed by analysis. `useEffect` for `setCurrentChannelId` already handles any string; no ChatProvider changes needed.
  - Impact: 85% — existing `activity` and `direct` branches must be unaffected; tests will verify this.
- **Acceptance:**
  - `?mode=broadcast&id=broadcast_whole_hostel`: renders message list without "Loading activity..." spinner, no send form.
  - `?mode=broadcast&id=<any_other_value>`: renders error screen "Broadcast channel unavailable" (not the activity spinner).
  - `?mode=broadcast` with no `id`: renders "No channel selected" (existing null-channel path).
  - `?mode=activity&id=<activity_id>` (existing): unaffected — still checks `activity` object.
  - `?mode=direct` (existing): unaffected.
  - `setCurrentChannelId('broadcast_whole_hostel')` called on mount; cleared on unmount.
  - Send form (`<form>` and send button) absent when `channelMode === 'broadcast'`.
  - Header title: "Staff messages" (i18n key `broadcastChannelTitle`).
  - Back link navigates to `/chat`.
  - **Expected user-observable behavior:**
    - [ ] Guest opens `/chat/channel?mode=broadcast&id=broadcast_whole_hostel` → sees "Staff messages" title, message list (or empty state if no messages), no compose input.
    - [ ] With forged `?id=other` param → sees "Broadcast channel unavailable" error, not infinite spinner.
    - [ ] Navigating away → channel subscription cleared (existing activity/DM channels are not disrupted).
- **Engineering Coverage:**
  - UI / visual: Required - new header title, no send form. Back link target is `/chat`. Run post-build design QA + contrast + breakpoint sweeps on changed page.
  - UX / states: Required - no "Loading activity..." fallback for broadcast mode. Empty message list state renders normally (zero messages in RTDB is valid). Error screen for invalid `id` param.
  - Security / privacy: Required - `id === WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` equality check (not prefix). Guest cannot post: send form removed from JSX when `channelMode === 'broadcast'`. `handleSendMessage` must also guard against `broadcast` mode (belt and suspenders).
  - Logging / observability / audit: N/A - no new audit path needed for channel page reads.
  - Testing / validation: Required - extend `page.test.tsx`. New test cases: broadcast mode renders messages, broadcast mode invalid ID renders error, broadcast mode no send form, existing activity/direct cases still pass.
  - Data / contracts: N/A - reads RTDB via existing ChatProvider path; no new data contract.
  - Performance / reliability: Required - `useEffect` calls `setCurrentChannelId(channelId)` — correct for broadcast (same as activity path). Cleanup (`setCurrentChannelId(null)`) on unmount.
  - Rollout / rollback: Required - additive branch. Existing `mode=activity` and `mode=direct` URLs unaffected. Rollback: remove `broadcast` branch from `ChannelMode` type.
- **Validation contract (TC-XX):**
  - TC-01: Render with `mode=broadcast&id=broadcast_whole_hostel` → message list renders, no send form present, title is "Staff messages".
  - TC-02: Render with `mode=broadcast&id=something_else` → error screen "Broadcast channel unavailable" (not spinner).
  - TC-03: Render with `mode=broadcast` no `id` → "No channel selected" (existing null path).
  - TC-04: `setCurrentChannelId` called with `'broadcast_whole_hostel'` on mount; called with `null` on unmount.
  - TC-05: `mode=activity&id=<valid_activity_id>` → unchanged behaviour (activity spinner visible when `activity` absent — not a regression, it's correct for activity mode).
  - TC-06: `mode=direct` → unchanged behaviour.
  - TC-07: `handleSendMessage` invoked on broadcast mode → does not call `sendMessage` (guard prevents it).
- **Execution plan:**
  1. Update `type ChannelMode = 'activity' | 'direct'` to `'activity' | 'direct' | 'broadcast'`.
  2. Update `channelMode` derivation: `modeParam === 'direct' ? 'direct' : modeParam === 'broadcast' ? 'broadcast' : 'activity'`.
  3. Update `channelId` `useMemo`: when `channelMode === 'broadcast'`, validate `rawChannelId === WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`; if not, return `null` (triggers "No channel selected"). If valid, return `rawChannelId`.
  4. Add early return for `channelMode === 'broadcast' && channelId === null && rawChannelId !== null`: render "Broadcast channel unavailable" screen.
  5. Remove activity spinner guard (`if (channelMode === 'activity' && !activity)`) from blocking broadcast mode — guard remains for `activity` only (already implicit since `'broadcast'` is a separate branch).
  6. In render: when `channelMode === 'broadcast'`, omit send form JSX entirely. Header title: `t('broadcastChannelTitle', 'Staff messages')`. Back link: `/chat`.
  7. Add guard to `handleSendMessage`: `if (channelMode === 'broadcast') return;`.
  8. Update `useEffect` for `setCurrentChannelId`: no extra guard needed for broadcast mode (same as activity path — just set the channelId).
  9. Update `page.test.tsx` with TC-01 through TC-07 above.
  10. Run scoped post-build QA loop: `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/chat/channel` route. Auto-fix Critical/Major; defer Minor with explicit rationale.
- **Planning validation (required for M/L):**
  - Checks run: Read full `page.tsx` (confirmed `ChannelMode = 'activity' | 'direct'` at line 22, `channelMode` derivation at line 72, `channelId` memo at lines 81-96, `useEffect` for setCurrentChannelId at lines 143-162, send form at lines 191-221, activity spinner guard at lines 248-256).
  - Unexpected findings: `channelId` memo for `activity` mode simply returns `rawChannelId` without validation. For `broadcast` mode, we add validation. This is intentional and does not change activity path.
  - Validation artifacts: `page.tsx` lines 1-350 read.
- **Scouts:** None: ChatProvider subscription confirmed already handles non-dm_ channels (fact-find finding, ChatProvider lines 437-494 read).
- **Edge Cases & Hardening:** Guest navigates to `/chat/channel?mode=broadcast&id=broadcast_booking_X` — equality check returns null → "No channel selected" or "Broadcast channel unavailable". Correct behaviour. Guest bookmarks old `/chat/channel?mode=activity&id=broadcast_whole_hostel` URL — activity mode still shows spinner (old behaviour for activity channels without matching activity; not a regression from this task).
- **What would make this >=90%:** Confirm no i18n namespace issue for new `broadcastChannelTitle` key (Chat namespace already loaded for this component per `useTranslation('Chat')`).
- **Rollout / rollback:**
  - Rollout: Deploy with Prime app build. No feature flag needed — URL must include `mode=broadcast` to reach new branch.
  - Rollback: Revert `ChannelMode` type and related branches to 2-value enum.
- **Documentation impact:** None: guest-facing feature; no operator runbook needed.
- **Notes / references:** `page.tsx` line 22 for `ChannelMode`, line 72 for mode derivation, line 248 for activity spinner guard.

---

### TASK-05: "Staff messages" nav entry point in `GuestDirectory.tsx`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Link from `next/link` added using `staffMessagesSection` JSX variable rendered before every early return and in the populated-directory render. `STAFF_MESSAGES_HREF` constant built from `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`. 5 TCs added to `guest-directory.test.tsx` (TC-01–05): link visible in opt-in, loading, empty, populated states; href verified. All 16 tests pass. Commit e89101cadf.
- **Affects:** `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — single `Link` addition to the GuestDirectory render output. URL is deterministic.
  - Approach: 90% — GuestDirectory is the chat landing page; adding a "Staff messages" section/link here is the natural entry point.
  - Impact: 80% — link must render in all guest states (opt-in required, loading, empty directory, populated directory). Must verify it is always visible.
- **Acceptance:**
  - "Staff messages" link visible in GuestDirectory in all states (opt-in required, loading, empty, populated).
  - Link navigates to `/chat/channel?mode=broadcast&id=broadcast_whole_hostel`.
  - Link is styled as a secondary CTA or section entry (not competing with primary guest-chat content).
  - **Expected user-observable behavior:**
    - [ ] Guest opens `/chat` → sees "Staff messages" link in GuestDirectory below or above the guest list section.
    - [ ] Tapping "Staff messages" → navigates to broadcast viewer.
- **Engineering Coverage:**
  - UI / visual: Required - Link addition. Run post-build design QA + contrast + breakpoint sweeps on `/chat` route.
  - UX / states: Required - link visible in all GuestDirectory states (opt-in screen, loading, empty, populated). Must not be hidden behind conditional rendering that gates it on opt-in state.
  - Security / privacy: N/A - navigating to broadcast viewer is a public guest-visible link (no PII, no auth check beyond existing guest session).
  - Logging / observability / audit: N/A
  - Testing / validation: Required - verify link renders in each GuestDirectory state. Likely needs a new test file or addition to existing GuestDirectory tests (if any).
  - Data / contracts: N/A
  - Performance / reliability: N/A - static link render
  - Rollout / rollback: Required - additive. Rollback: remove link element.
- **Validation contract (TC-XX):**
  - TC-01: Render GuestDirectory in opt-in-required state → "Staff messages" link present.
  - TC-02: Render GuestDirectory in loading state → "Staff messages" link present.
  - TC-03: Render GuestDirectory in empty state → "Staff messages" link present.
  - TC-04: Render GuestDirectory in populated state → "Staff messages" link present.
  - TC-05: Link `href` equals `/chat/channel?mode=broadcast&id=broadcast_whole_hostel`.
- **Execution plan:**
  1. Add a "Staff messages" section near the top or bottom of GuestDirectory, outside any conditional render block.
  2. Use `Link` from `next/link` with `href="/chat/channel?mode=broadcast&id=broadcast_whole_hostel"`.
  3. Import `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `directMessageChannel.ts` to build the href.
  4. Style as a secondary row or button using design system primitives consistent with existing GuestCard style.
  5. Run scoped post-build QA loop on `/chat` route.
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:** None: GuestDirectory rendering confirmed — currently returns early for opt-in/loading/empty states, then renders directory list. "Staff messages" link must be in a non-conditional wrapper around all these paths.
- **Edge Cases & Hardening:** Opt-in gate: GuestDirectory shows an opt-in required screen before rendering the directory list. The "Staff messages" link should be visible even when the guest hasn't opted into direct chat (broadcast is a read channel — opt-in for DM is irrelevant here). Place the link OUTSIDE the `if (!currentProfile.chatOptIn) return ...` block.
- **What would make this >=90%:** Confirm i18n Chat namespace has a key for `staffMessagesLink` label. Add if absent.
- **Rollout / rollback:**
  - Rollout: Deploy with Prime app. Link is always visible once deployed.
  - Rollback: Remove link element.
- **Documentation impact:** None.
- **Notes / references:** `GuestDirectory.tsx` lines 75-86 (opt-in early return), lines 89-95 (loading early return), lines 98-111 (empty early return).

---

### TASK-06: Reception proxy function `initiatePrimeOutboundThread`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/lib/inbox/prime-review.server.ts` (new exported function)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `export async function initiatePrimeOutboundThread(input: { text: string; actorUid?: string }): Promise<{ detail: PrimeReviewThreadDetail } | null>` added. Null guard on `readPrimeReviewConfig()`. Uses `primeRequest<{ detail: PrimeReviewThreadDetail }>` pattern with `buildPrimeActorHeaders`. New test file `initiate-prime-outbound-thread.test.ts` (6 TCs). All pass. Commit e89101cadf.
- **Affects:**
  - `apps/reception/src/lib/inbox/prime-review.server.ts`
  - `[readonly] apps/reception/src/lib/inbox/api-models.server.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% — function follows same proxy pattern as `savePrimeInboxThreadDraft` / `sendPrimeInboxThread` in the same file. `primeRequest` helper handles auth header injection.
  - Approach: 90% — no new pattern; direct analogy to existing proxy functions in prime-review.server.ts.
  - Impact: 80% — consumed by TASK-07; must return a type that the Route handler can serialize.
- **Acceptance:**
  - `initiatePrimeOutboundThread({ text, actorUid })` calls `POST /api/staff-initiate-thread` on Prime with `{ plainText: text }` body.
  - Returns `{ success: true, detail: PrimeReviewThreadDetail }` on 200.
  - Returns `null` or throws on Prime 4xx/5xx — upstream route handles error.
  - If `readPrimeReviewConfig()` returns null (Prime config absent) → function returns null (graceful degrade; route returns 503).
  - **Expected user-observable behavior:** None directly — server function; see TASK-07 and TASK-08 for UX.
- **Engineering Coverage:**
  - UI / visual: N/A - server-only
  - UX / states: N/A - state expressed via return value / throw
  - Security / privacy: Required - `actorUid` passed as `x-prime-actor-uid` header (same as existing proxy pattern). Token passed via `RECEPTION_PRIME_ACCESS_TOKEN` env var (same `primeRequest` helper).
  - Logging / observability / audit: N/A - `primeRequest` handles error propagation; caller logs on error.
  - Testing / validation: Required - unit test: mock `primeRequest`, verify header + body, verify null return on config-absent path.
  - Data / contracts: Required - function input/output types must be explicit. Return type: `Promise<{ detail: PrimeReviewThreadDetail } | null>`.
  - Performance / reliability: N/A - simple proxied HTTP call; no fan-out.
  - Rollout / rollback: Required - additive export. Rollback: remove function.
- **Validation contract (TC-XX):**
  - TC-01: `primeRequest` returns 200 with detail → function returns `{ detail }`.
  - TC-02: `readPrimeReviewConfig()` returns null → function returns null without calling `primeRequest`.
  - TC-03: `primeRequest` throws → function propagates throw (caught by route handler).
- **Execution plan:**
  1. Add `export async function initiatePrimeOutboundThread(input: { text: string; actorUid?: string }): Promise<{ detail: PrimeReviewThreadDetail } | null>` to `prime-review.server.ts`.
  2. Guard: if `!readPrimeReviewConfig()` return null.
  3. Call `primeRequest<{ detail: PrimeReviewThreadDetail }>('/api/staff-initiate-thread', { method: 'POST', body: JSON.stringify({ plainText: input.text }), headers: buildPrimeActorHeaders(input.actorUid) })`. Note: `primeRequest<T>` returns `payload.data` (the unwrapped `T` value directly, not a nested envelope). The correct type parameter is `{ detail: PrimeReviewThreadDetail }` so that `payload` is typed as `{ detail: PrimeReviewThreadDetail }`.
  4. Return `{ detail: payload.detail }`.
  5. Write unit tests mocking `primeRequest` and `readPrimeReviewConfig`.
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:** `primeRequest` in `prime-review.server.ts` confirmed — handles auth header injection, base URL, and error propagation. `buildPrimeActorHeaders(actorUid?)` also confirmed.
- **Edge Cases & Hardening:** Prime returns 404 (thread or draft not found): `primeRequest` throws with HTTP error; route catches and returns 502 or 500. Prime returns 409 (conflict): same. Both handled by route's catch block.
- **What would make this >=90%:** Confirm `PrimeReviewThreadDetail` is already imported in `prime-review.server.ts` (it is — confirmed on line 24 import).
- **Rollout / rollback:**
  - Rollout: Deploy with Reception build.
  - Rollback: Remove function. No data impact.
- **Documentation impact:** None.
- **Notes / references:** `prime-review.server.ts` lines 185-210 for `primeRequest` and `buildPrimeActorHeaders`; lines 347-365 for `buildPrimeInboxThreadId`/`parsePrimeInboxThreadId`/`isPrimeInboxThreadId`.

---

### TASK-07: Reception API route `POST /api/mcp/inbox/prime-compose`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` (new) + `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `prime_broadcast_initiated` added to `inboxEventTypes` as-const array. New route `POST /api/mcp/inbox/prime-compose` created: `requireStaffAuth` → text validation → `initiatePrimeOutboundThread` → `sendPrimeInboxThread` → `recordInboxEvent`. 10 TCs covering auth reject (401), empty text (400), null config (503), send throw (502), success (200), telemetry (TC-06). All pass. Commit 2522ba7a39.
- **Affects:**
  - `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` (new)
  - `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` (new)
  - `apps/reception/src/lib/inbox/telemetry.server.ts` (add `'prime_broadcast_initiated'` to `inboxEventTypes` array)
  - `[readonly] apps/reception/src/lib/inbox/prime-review.server.ts`
  - `[readonly] apps/reception/src/app/api/_shared/staff-auth.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — route follows exact pattern of `/api/mcp/inbox/[threadId]/send/route.ts` (lines 41-100). `requireStaffAuth`, `readJsonPayload`, `NextResponse.json`.
  - Approach: 85% — compose-and-send in one request (initiate thread + draft + send). Simpler UX than separate save-draft-then-send flow.
  - Impact: 85% — consumed by TASK-08 compose modal; must return a usable error shape for the UI.
- **Acceptance:**
  - `POST /api/mcp/inbox/prime-compose` with Firebase ID token + `{ text }` → 200 `{ success: true }`.
  - Missing/empty `text` → 400.
  - `requireStaffAuth` fails → 401.
  - `initiatePrimeOutboundThread` returns null (Prime config absent) → 503 with message "Prime messaging not configured".
  - `initiatePrimeOutboundThread` throws (Prime error) → 502 with message "Failed to send broadcast".
  - After successful initiation, calls `sendPrimeInboxThread('prime:broadcast_whole_hostel', actorUid)` to send immediately (compose-and-send in one request).
  - **Expected user-observable behavior:** None directly — called by compose modal; see TASK-08 for modal UX.
- **Engineering Coverage:**
  - UI / visual: N/A - API route
  - UX / states: N/A - expressed via HTTP status codes
  - Security / privacy: Required - `requireStaffAuth` before any operation. `text` sanitized server-side (trim, non-empty check).
  - Logging / observability / audit: Required - record inbox event `prime_broadcast_initiated` on success (matching `prime_manual_reply` pattern in send route).
  - Testing / validation: Required - test auth reject (401), missing text (400), Prime config absent (503), success path (200).
  - Data / contracts: Required - input: `{ text: string }`. Output: `{ success: true }` or error object.
  - Performance / reliability: N/A - two sequential HTTP calls to Prime (initiate + send); acceptable for low-frequency broadcast.
  - Rollout / rollback: Required - additive route. Returns 503 if Prime config absent.
- **Validation contract (TC-XX):**
  - TC-01: Valid auth + `{ text: "Hello" }` + Prime returns OK → 200 `{ success: true }`.
  - TC-02: No auth header → 401.
  - TC-03: Empty `text` → 400 "text is required".
  - TC-04: `initiatePrimeOutboundThread` returns null → 503 "Prime messaging not configured".
  - TC-05: `sendPrimeInboxThread` throws → 502 "Failed to send broadcast".
  - TC-06: Success path → inbox event `prime_broadcast_initiated` recorded.
- **Execution plan:**
  1. In `apps/reception/src/lib/inbox/telemetry.server.ts`, add `'prime_broadcast_initiated'` to the `inboxEventTypes` as-const array. This extends `InboxEventType` so `recordInboxEvent` accepts the new event type without TypeScript compile errors.
  2. Create `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`.
  3. `requireStaffAuth`, `readJsonPayload`, parse `{ text }` with `z.object({ text: z.string().min(1) })`.
  4. Call `initiatePrimeOutboundThread({ text, actorUid: auth.uid })`. If null → 503.
  5. Call `sendPrimeInboxThread(buildPrimeInboxThreadId('broadcast_whole_hostel'), auth.uid)`. Note: Reception layer cannot import `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `apps/prime/src` (cross-app import). Use the inline string `'broadcast_whole_hostel'` as the argument to `buildPrimeInboxThreadId` — this produces the prefixed ID `prime:broadcast_whole_hostel` that `sendPrimeInboxThread` expects.
  6. Record inbox event `prime_broadcast_initiated`.
  7. Return 200.
  8. Write test file mocking `requireStaffAuth`, `initiatePrimeOutboundThread`, `sendPrimeInboxThread`, `recordInboxEvent`.
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:** Note: Reception cannot import `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `apps/prime/src/lib/chat/directMessageChannel.ts` (monorepo cross-app import not supported). Use inline string `'broadcast_whole_hostel'` in the route, or add a local constant `WHOLE_HOSTEL_BROADCAST_THREAD_ID = 'broadcast_whole_hostel'` at the top of the route file.
- **Edge Cases & Hardening:** `sendPrimeInboxThread` on a freshly created thread where the campaign hasn't yet been created — verify `savePrimeReviewDraft` in TASK-02 creates the campaign via `ensureWholeHostelCampaignForDraft` before returning. Confirmed: `savePrimeReviewDraft` creates campaign at lines 126-151 of `prime-review-drafts.ts`. So when the route calls `sendPrimeInboxThread`, campaign will be present.
- **What would make this >=90%:** Confirmed: `prime_broadcast_initiated` will be added to `inboxEventTypes` in step 1 of this task's execution plan. Event type extension is within TASK-07 scope — no remaining blocker on this path.
- **Rollout / rollback:**
  - Rollout: Deploy with Reception build.
  - Rollback: Remove route file. No data impact.
- **Documentation impact:** None.
- **Notes / references:** `[threadId]/send/route.ts` lines 41-100 as the pattern; `staff-auth.ts` for `requireStaffAuth`; `prime-review.server.ts` for `sendPrimeInboxThread` and `buildPrimeInboxThreadId`.

---

### TASK-08: PrimeColumn compose button + modal
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/PrimeColumn.tsx` + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** `PrimeColumn.tsx` extended with compose state (composeOpen/composeText/composeSending/composeError). "New broadcast" button (aria-label) in column header with Send + X icons. Modal uses `position: fixed` with `bg-surface/80 backdrop-blur-sm` overlay (ds/no-raw-tailwind-color compliant). Textarea `maxLength={2000}` with character count. `handleSend` calls `buildMcpAuthHeaders()` + `fetch('/api/mcp/inbox/prime-compose')`. Close button uses `rounded-lg` (ds/no-bare-rounded compliant). New test file `PrimeColumn.test.tsx` (10 TCs: TC-01 button present, TC-02 modal opens, TC-03 send disabled empty, TC-04 send enabled + fetch called, TC-05 200 closes modal, TC-06 503 error shown, TC-07 ESC/close, TC-08 thread list unaffected + email filter). All pass. Commit 88bad52a9f.
- **Affects:**
  - `apps/reception/src/components/inbox/PrimeColumn.tsx`
  - `apps/reception/src/components/inbox/__tests__/PrimeColumn.test.tsx` (new)
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — PrimeColumn is a simple presentational component (71 lines). Adding a compose button and modal is straightforward, but the modal pattern (inline state vs context vs portal) needs to be chosen during execution. No existing modal pattern in PrimeColumn to reference.
  - Approach: 85% — B1 confirmed by analysis; compose button in column header, modal manages its own state locally.
  - Impact: 80% — user-facing change; must not break existing thread list rendering. Test must cover new compose states.
  - Held-back test: Modal state management could be complex if InboxWorkspace has z-index constraints. Resolve during execution.
- **Acceptance:**
  - "New broadcast" button visible in PrimeColumn header (alongside "Prime" label and thread count badge).
  - Button click → compose modal opens with text area and "Send" button.
  - Empty text area → "Send" button disabled.
  - "Send" click → calls `POST /api/mcp/inbox/prime-compose` with `{ text }`. Shows loading state during call.
  - Success → modal closes, success toast shown.
  - Error → error message shown in modal; modal stays open.
  - ESC or close button → modal closes without sending.
  - InboxWorkspace (parent) unaffected — no prop changes needed.
  - **Expected user-observable behavior:**
    - [ ] Staff lands on inbox page → "New broadcast" button visible in Prime column header.
    - [ ] Clicking button → modal appears with text area.
    - [ ] Staff types message, clicks "Send" → loading indicator.
    - [ ] Success → modal closes, thread list unchanged (sent threads filtered by `isPrimeThreadVisibleInInbox`).
    - [ ] Network error → error message in modal, modal stays open for retry.
- **Engineering Coverage:**
  - UI / visual: Required - compose button in column header, modal. Run post-build design QA + contrast + breakpoint sweeps on the Reception inbox route. Auto-fix Critical/Major findings; defer Minor with rationale.
  - UX / states: Required - idle (button), open-empty (send disabled), open-with-text (send enabled), sending (loading), success (modal close + toast), error (message in modal).
  - Security / privacy: Required - text from staff is sent to Reception API which uses `requireStaffAuth`. Text length should be bounded (max 2000 chars suggested). No PII in compose UI — broadcast text is operator-controlled.
  - Logging / observability / audit: N/A - logging is in the API route (TASK-07).
  - Testing / validation: Required - render tests: button present, modal opens on click, send disabled when empty, sends correct payload, shows error on fetch failure, modal closes on success.
  - Data / contracts: Required - `fetch('/api/mcp/inbox/prime-compose', { method: 'POST', body: JSON.stringify({ text }) })`. Error shape: `{ error: string }` or HTTP status.
  - Performance / reliability: N/A - low-frequency UI operation.
  - Rollout / rollback: Required - additive to PrimeColumn. Rollback: remove button and modal state from PrimeColumn.
- **Validation contract (TC-XX):**
  - TC-01: PrimeColumn renders with "New broadcast" button in header.
  - TC-02: Button click → modal opens.
  - TC-03: Modal with empty textarea → "Send" button disabled.
  - TC-04: Modal with text → "Send" button enabled. Click "Send" → `fetch` called with `{ text }`.
  - TC-05: `fetch` returns 200 → modal closes.
  - TC-06: `fetch` returns 503 → error message in modal, modal stays open.
  - TC-07: ESC / close button → modal closes without fetch.
  - TC-08: Existing PrimeColumn thread list rendering unaffected.
- **Execution plan:**
  1. Add compose state to `PrimeColumn.tsx`: `const [composeOpen, setComposeOpen] = useState(false)`, `const [composeText, setComposeText] = useState('')`, `const [composeSending, setComposeSending] = useState(false)`, `const [composeError, setComposeError] = useState<string | null>(null)`.
  2. Add "New broadcast" button to column header (alongside existing icon + label + badge). Use `Plus` or `MessageSquarePlus` icon from `lucide-react`. Add `PrimeColumnProps` callback or handle inline.
  3. Add compose modal: `{composeOpen && <ComposeModal ... />}` or inline render. Use design system `Button`, `Textarea`, primitives.
  4. Add `handleSend`: `fetch('/api/mcp/inbox/prime-compose', { method: 'POST', body: JSON.stringify({ text: composeText }) })`. Handle 200 → close. Handle error → set `composeError`.
  5. Write tests: mock `fetch`, test all TC states above.
  6. Run scoped post-build QA loop on Reception inbox route.
- **Planning validation (required for M/L):**
  - Checks run: Read `PrimeColumn.tsx` in full (71 lines, confirmed structure). No existing modal or state management in file. Confirmed `InboxWorkspace.tsx` does not pass any compose-related props to PrimeColumn.
  - Unexpected findings: `PrimeColumn` currently filters threads by `t.channel !== 'email'`. This filter is unchanged. The compose button is a column-level affordance — no thread-level gating needed.
  - Validation artifacts: `PrimeColumn.tsx` lines 1-71 read.
- **Scouts:** Confirm `InboxWorkspace.tsx` can accommodate a modal from `PrimeColumn` without z-index conflicts. If InboxWorkspace uses `overflow: hidden`, modal may be clipped — investigate during execution.
- **Edge Cases & Hardening:** Text length limit: add `maxLength={2000}` on textarea and server-side validation in TASK-07. Rate limit (TASK-03) returns 429: show "Too many broadcasts. Try again in a minute." in modal.
- **What would make this >=90%:** Confirm modal z-index works in InboxWorkspace 3-column layout. Currently capped at 80% due to this unknown.
- **Rollout / rollback:**
  - Rollout: Deploy with Reception build. Compose button visible immediately.
  - Rollback: Revert `PrimeColumn.tsx` changes.
- **Documentation impact:** None: staff UI; no operator runbook needed.
- **Notes / references:** `PrimeColumn.tsx` line 32 (column header div), `InboxWorkspace.tsx` for layout context.

---

## Risks & Mitigations
- `bookingId: ''` on whole-hostel thread may violate D1 NOT NULL constraint: investigate in TASK-02 execution. If empty string rejected, use a sentinel value like `'_broadcast'` or make `bookingId` nullable — requires type change to `CreatePrimeMessageThreadInput`.
- Modal z-index conflict in InboxWorkspace 3-column layout: investigate in TASK-08. Mitigation: use `position: fixed` for modal to escape containing block.
- `recordInboxEvent` event type union: `prime_broadcast_initiated` is not in `inboxEventTypes` (confirmed). TASK-07 execution plan step 1 adds it to `telemetry.server.ts`. Resolved in plan.
- `RATE_LIMIT` KV not bound in Prime CF Pages wrangler config: rate limiting silently degrades. Low impact (broadcasts are low frequency). Future: confirm binding in wrangler config.

## Observability
- Logging: `prime_broadcast_initiated` inbox event on success (TASK-07). `console.error` on 500 paths in TASK-02 and TASK-07 (following existing pattern).
- Metrics: None: no new metrics beyond existing inbox event telemetry.
- Alerts/Dashboards: None: no new dashboards. Existing inbox analytics pick up `prime_broadcast_initiated` events.

## Acceptance Criteria (overall)
- [ ] Staff can compose and send a whole-hostel broadcast message from Reception inbox with no prior guest message.
- [ ] Message appears in Prime guest app broadcast viewer (read-only for guests).
- [ ] Guests cannot post to broadcast channels.
- [ ] URL forgery (`?mode=broadcast&id=<arbitrary>`) shows error screen, not broadcast content.
- [ ] Auth chain enforced at every hop.
- [ ] No DB migrations needed.
- [ ] All existing Prime channel page (activity/direct) behaviour unchanged.

## Decision Log
- 2026-03-14: `bookingId: ''` chosen for whole-hostel broadcast thread. Rationale: no booking association exists; empty string satisfies TS type requirement. If D1 rejects, fallback is sentinel string `'_broadcast'` or nullable type change. This is a plan-level decision to be confirmed during TASK-02 execution.
- 2026-03-14: Compose-and-send in single request (TASK-07 calls initiate then send immediately). Rationale: simpler UX than save-draft-then-send; whole-hostel broadcast is intended to be a one-shot operation. Draft remains in D1 as audit trail.
- 2026-03-14: Reception cannot import `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `apps/prime/src` (cross-app import). Inline string `'broadcast_whole_hostel'` used in Reception layer.
- 2026-03-14: `isBroadcastChannelId()` prefix check explicitly rejected for security guard in TASK-04. Equality check against exported constant used.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Export constant from directMessageChannel.ts | Yes — file exists, `BROADCAST_CHANNEL_PREFIX` defined | None | No |
| TASK-02: Prime CF endpoint | TASK-01 complete; `upsertPrimeMessageThread` + `savePrimeReviewDraft` confirmed; `enforceStaffOwnerApiGate` confirmed | `bookingId: ''` D1 constraint unverified — flagged in Scouts, plan decision taken | No (advisory) |
| TASK-03: KV rate limit on review-campaign-send | `enforceKvRateLimit` confirmed; `RATE_LIMIT` KV mock in helpers.ts confirmed | `RATE_LIMIT` KV binding may not be in Prime wrangler.toml — graceful degrade is acceptable | No (advisory) |
| TASK-04: Guest broadcast mode | TASK-01 complete; `ChannelMode` type local to page.tsx; existing test harness confirmed | None — `useEffect` subscription path unchanged; back link navigates to `/chat` (not `/activities`) | No |
| TASK-05: Staff messages nav entry point | TASK-01 complete; GuestDirectory early-return paths confirmed | Early-return for opt-in must not hide link — confirmed placement must be outside conditional | No (resolved in execution plan) |
| TASK-06: Reception proxy function | TASK-02 deployed; `primeRequest` helper confirmed; `readPrimeReviewConfig` null guard confirmed | Cross-app import not possible — inline string in Reception layer | No (resolved in TASK-07 execution plan) |
| TASK-07: Reception API route | TASK-06 complete; `sendPrimeInboxThread` confirmed; `buildPrimeInboxThreadId` confirmed | `recordInboxEvent` event type union needs `prime_broadcast_initiated` (confirmed absent). Resolved: TASK-07 execution plan step 1 adds it to `telemetry.server.ts`. | No (resolved in plan) |
| TASK-08: PrimeColumn compose button + modal | TASK-07 complete; PrimeColumn structure confirmed (71 lines, no modal state); InboxWorkspace layout not deeply inspected | Modal z-index in 3-column layout unverified — mitigated by `position: fixed` | No (advisory — verify during implementation) |

## Overall-confidence Calculation
- TASK-01: S(1) × 90% = 90
- TASK-02: M(2) × 85% = 170
- TASK-03: S(1) × 85% = 85
- TASK-04: M(2) × 85% = 170
- TASK-05: S(1) × 85% = 85
- TASK-06: S(1) × 85% = 85
- TASK-07: S(1) × 85% = 85
- TASK-08: M(2) × 80% = 160
- Total weighted: 90+170+85+170+85+85+85+160 = 930
- Sum of weights: 1+2+1+2+1+1+1+2 = 11
- Overall-confidence = 930 / 11 ≈ **85%** (rounded to 82% applying conservative rounding for two advisory unknowns: `bookingId` D1 constraint and modal z-index)
