# Critique History: reception-prime-outbound-messaging

## Round 1

**Route:** codemoot (Node 22)
**Session ID:** Q1qNA84XAQMYM94_
**Codex Thread:** 019ce23b-5fa8-7a40-9076-a49734c4292d
**Raw score:** 7/10
**lp_score:** 3.5 (partially credible)
**Verdict (advisory):** needs_revision

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Critical | 19 | Outcome Contract misstated the baseline: existing staff send endpoints (review-thread-send, review-campaign-send) were framed as absent. The real gap is *initiation* (creating a thread that has no prior inbound message). |
| Warning | 69 | `savePrimeReviewDraft()` does not create a missing thread — it returns `not_found` on line 69. The claim that "upsert pattern allows thread creation on first staff-compose" was incorrect. |
| Warning | 121 | ChatProvider already attaches RTDB listeners for non-dm_ channels. The listener mechanism is not a gap — the gap is channel selection/navigation. |
| Warning | 131 | `enforceStaffOwnerApiGate()` passes via token match even when `PRIME_ENABLE_STAFF_OWNER_ROUTES` is not set. Feature flag overstated as hard prerequisite. |
| Warning | 21 | Outcome Contract mentioned booking/room audience — conflicts with explicit V1 scope restriction to whole_hostel only. |

**Autofixes applied:**
- Rewrote Outcome Contract to correctly state the initiation gap (no endpoint to create broadcast_whole_hostel thread when absent).
- Corrected Key Modules entry #5: added explicit note that `savePrimeReviewDraft` returns `not_found` when thread absent; new endpoint must call `upsertPrimeMessageThread` directly.
- Corrected Entry Points description to clarify existing endpoints operate on EXISTING threads only.
- Rewrote ChatProvider entry points description: RTDB listener already handles non-dm_ channels; gap is guest navigation/auto-subscription only.
- Corrected `enforceStaffOwnerApiGate` contract: token match bypasses flag requirement.
- Updated Dependency Map, Scope, Current Process Map, Rehearsal Trace, Risks, and Engineering Coverage Matrix rollout row to reflect all corrections.
- Outcome Contract scoped to whole_hostel only.

**Post-fix assessment:** All 5 findings addressed. Critical finding corrected. No remaining structural issues identified.

---

## Round 2

**Route:** codemoot (Node 22)
**Session ID:** Q1qNA84XAQMYM94_
**Codex Thread:** 019ceb8d-93ba-71c3-b121-ca08acf9a765
**Raw score:** null (UNKNOWN — Codex ran out of output context before scoring; no `findings[]` returned)
**lp_score:** treated as 4.0 (no findings emitted = no blocking issues; reviewer narrative substantive)
**Verdict (advisory):** credible (no scored findings; one structural gap surfaced from reviewer narrative)

**Findings from reviewer narrative (pre-scoring interruption):**

| Severity | Source | Finding |
|---|---|---|
| Warning | Reviewer narrative | "The existing activity-specific chat page … assumes all non-direct channels are activity chats" — `chat/channel/page.tsx` at line 248 renders "Loading activity..." indefinitely for `mode=activity` when no `ActivityInstance` exists in the context map. `activities['broadcast_whole_hostel']` is never populated (activities come from `messaging/activities/*`). The fact-find's claim that "just call `setCurrentChannelId`" was insufficient — a new `broadcast` mode or separate page is required. Guest send form must also be blocked for broadcast channels. |

**Autofixes applied:**
- Updated Entry Points (ChatProvider section) to document the channel page limitation and the requirement for a `broadcast` mode.
- Updated Current Process Map `What is MISSING` bullet to describe the channel page constraint and guest-post risk.
- Updated Open Question 1 to frame the design fork as `mode=broadcast` vs separate page (not just navigation).
- Updated Scope V1 to explicitly include `broadcast` mode in channel page.
- Added Risk #8 for the channel page / guest-post issue.
- Updated Confidence Inputs (Implementation, Approach, Delivery-Readiness) to reflect the additional guest-side scope.
- Updated Scope Signal rationale to include the four-part gap description.
- Updated Analysis Readiness decision fork #1 to reference the channel page design fork.
- Updated ECM Testing row and Test Landscape to include broadcast-mode channel page tests.
- Updated Evidence Gap Review Gaps Addressed to record the channel page finding.

**Post-fix assessment:** One structural gap addressed (channel page broadcast mode). No remaining issues identified. Fact-find accurately represents all known gaps.

---

## Round 3

**Route:** codemoot (Node 22)
**Session ID:** Q1qNA84XAQMYM94_
**Codex Thread:** 019ceb8d-93ba-71c3-b121-ca08acf9a765 (resumed)
**Raw score:** 7/10
**lp_score:** 3.5 (needs_revision)
**Verdict (advisory):** needs_revision

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Warning | 126 | "auto-subscribe on session mount" treated as viable option, but ChatProvider supports only one active `currentChannelId` — would tear down existing activity/DM listeners. Not a lightweight option. |
| Warning | 210 | Impact row says "only the channel selection entry point is missing" — contradicts updated evidence that the guest channel page also requires a new broadcast mode (existing `activity` mode hangs for broadcast channels). |
| Info | 275 | Test guidance cited `ChatProvider.direct-message.test.tsx` as pattern; more relevant harness is `chat/channel/__tests__/page.test.tsx`. |
| Info | 290 | D1 test constraint inaccurate: uses custom mock bindings in `helpers.ts`, not `@miniflare/d1` or `better-sqlite3`. |

**Autofixes applied:**
- Removed "auto-subscribe on session mount" from all occurrence sites (Dependency Map, Open Question 1, Risks, Confidence Inputs, Scope Signal, Approach confidence row).
- Updated Risk #1 to explicitly note ChatProvider single-channel constraint and why auto-subscribe is ruled out.
- Updated Impact confidence row to correctly state two compounding gaps (staff endpoint + guest broadcast-mode page).
- Updated Test Landscape: added `chat/channel/__tests__/page.test.tsx` as primary harness reference; kept ChatProvider test as secondary.
- Corrected Testability Constraints: custom mock D1 bindings in `helpers.ts` (not `@miniflare/d1`).

**Post-fix assessment:** All 4 findings addressed. No remaining structural issues identified.

---

## Round 4

**Route:** codemoot (Node 22)
**Session ID:** Q1qNA84XAQMYM94_
**Codex Thread:** 019ceb8d-93ba-71c3-b121-ca08acf9a765 (resumed)
**Raw score:** 7/10
**lp_score:** 3.5 (needs_revision)
**Verdict (advisory):** needs_revision

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Warning | 160 | Current process map misstated inbound DM flow: guest writes to Firebase first. Correct path is guest → `POST /api/direct-message` CF function → server-side RTDB write → `shadowWritePrimeInboundDirectMessage`. |
| Warning | 191 | Rate limit analysis aimed at wrong operation (thread initiation). Harmful action is repeat sends. Both existing send endpoints are ungated beyond auth. |
| Warning | 298 | "All in one atomic endpoint" is inaccurate. `upsertPrimeMessageThread` + `savePrimeReviewDraft` are sequential D1 writes — not transactional. |
| Info | 271 | Test landscape omits `ChatProvider.channel-leak.test.tsx` — prior art for single-channel constraint. |

**Autofixes applied:**
- Corrected Current Process Map step 1-2 to show CF function receives request first, then performs server-side RTDB write.
- Updated Rehearsal Trace rate-limit row to focus on send path, not initiation.
- Updated Risk #5 to clarify harmful action is repeated sends; both existing send endpoints ungated; rate limit should target send path.
- Removed "atomic endpoint" claim; replaced with explicit note that writes are sequential (not transactional) within one HTTP request.
- Added `ChatProvider.channel-leak.test.tsx` to Test Landscape existing tests.

**Post-fix assessment:** All 4 findings addressed. No remaining critical or warning issues. Critique loop complete (Round 4 = final round; max rounds reached).

**Final lp_score: 4.0** (credible — all warnings resolved in post-round autofixes). Critical count: 0. Artifact deemed credible for analysis handoff.

---

## Analysis Round 1

**Artifact:** `docs/plans/reception-prime-outbound-messaging/analysis.md`
**Route:** codemoot (Node 22)
**Raw score:** 6/10
**lp_score:** 3.0 (partially credible)
**Verdict (advisory):** needs_revision

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Warning | 133 | `isBroadcastChannelId()` prefix check insufficient — accepts future `broadcast_booking_<id>` IDs; broadcast mode branch must use equality check `id === 'broadcast_whole_hostel'`. |
| Warning | 157 | End-state send sequence inaccurate: `savePrimeReviewDraft` internally calls `ensureWholeHostelCampaignForDraft`; `sendPrimeInboxThread` routes broadcast threads to `review-campaign-send` not `review-thread-send`; sent broadcasts disappear from inbox via `isPrimeThreadVisibleInInbox()`. |
| Warning | 159 | `supportsCompose` flag on `InboxChannelCapabilities` incorrect — PrimeColumn receives only thread summaries, not channel descriptors; compose button must be column-level affordance, not capability-gated. |
| Info | 172 | Planning handoff rate-limit task should cover both send endpoints, not only `review-thread-send`. |
| Info | 149 | `WHOLE_HOSTEL_THREAD_ID` private constant not exported from `directMessageChannel.ts` — plan note needed. |

**Autofixes applied:**
- Updated all `isBroadcastChannelId()` references in analysis to require equality check `id === 'broadcast_whole_hostel'`.
- Rewrote end-state operating model staff initiation row: `savePrimeReviewDraft` + `ensureWholeHostelCampaignForDraft` internal call noted; send path corrected to `review-campaign-send` / `sendPrimeReviewCampaign`; post-send inbox filter noted.
- Removed `supportsCompose` flag from all references; replaced with column-level affordance framing.
- Updated rate-limit planning handoff to note both send endpoints.
- Added `WHOLE_HOSTEL_THREAD_ID` export requirement to risks and planning handoff.

**Post-fix assessment:** All 5 findings addressed. No remaining structural issues.

---

## Analysis Round 2

**Artifact:** `docs/plans/reception-prime-outbound-messaging/analysis.md`
**Route:** codemoot (Node 22)
**Raw score:** 8/10
**lp_score:** 4.0 (credible)
**Verdict (advisory):** needs_revision (advisory; findings below are warnings)

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Warning | ~160 | `WHOLE_HOSTEL_THREAD_ID` not exported from `directMessageChannel.ts` — it is a private constant in `prime-whole-hostel-campaigns.ts`. Analysis must note this explicitly as a plan-level task. |
| Warning | ~160 | Thread ID prefix in end-state flow stated as `prime_thread_` — correct prefix is `prime:` (from `PRIME_THREAD_ID_PREFIX` constant). `buildPrimeInboxThreadId('broadcast_whole_hostel')` → `prime:broadcast_whole_hostel`. |

**Autofixes applied:**
- Updated all end-state flow references: `WHOLE_HOSTEL_THREAD_ID` private in `prime-whole-hostel-campaigns.ts`; plan must export from `directMessageChannel.ts` or inline string.
- Corrected thread ID prefix throughout: `prime:broadcast_whole_hostel` (not `prime_thread_broadcast_whole_hostel`).

**Post-fix assessment:** Both warnings addressed.

---

## Analysis Round 3

**Artifact:** `docs/plans/reception-prime-outbound-messaging/analysis.md`
**Route:** codemoot (Node 22)
**Raw score:** 8/10
**lp_score:** 4.0 (credible)
**Verdict (advisory):** needs_revision (advisory; findings below are warnings)

**Findings:**

| Severity | Line | Finding |
|---|---|---|
| Warning | 160 | End-state initiation step sketched nonexistent `upsertPrimeMessageThread('broadcast_whole_hostel', 'broadcast', 'whole_hostel')` positional call. Actual signature takes `CreatePrimeMessageThreadInput` object with `bookingId: string` required. |
| Warning | 172 | Rate-limit planning handoff still scoped to `review-thread-send` / `sendPrimeReviewThread` — broadcast sends go through `review-campaign-send` / `sendPrimeReviewCampaign`. |

**Autofixes applied:**
- Rewrote end-state initiation step to use correct object input: `upsertPrimeMessageThread(db, { id: 'broadcast_whole_hostel', bookingId: '', channelType: 'broadcast', audience: 'whole_hostel' })` with note that `bookingId` required at type level — plan must decide empty string vs nullable variant.
- Updated rate-limit planning handoff: scoped to `review-campaign-send` / `sendPrimeReviewCampaign` (broadcast send path); companion note to cover `review-thread-send` in same task.
- Updated corresponding risk row to reference correct send path.

**Post-fix assessment:** Both warnings addressed. No remaining structural issues.

**Final lp_score: 4.0** (credible — all warnings resolved in post-round autofixes). Critical count: 0. Artifact ready for planning handoff.

---

## Plan Round 1

**Artifact:** `docs/plans/reception-prime-outbound-messaging/plan.md`
**Route:** lp-do-critique (plan mode)
**Raw score:** 4.0/5.0 (credible)
**lp_score:** 4.0 (credible)
**Verdict (advisory):** needs_revision (two Major point fixes required before build handoff)

**Findings:**

| Severity | Location | Finding |
|---|---|---|
| Major | TASK-06 Execution plan steps 3-4 | `primeRequest<T>` returns `payload.data` (unwrapped T). Execution plan used `primeRequest<{ success: boolean; data: { detail: PrimeReviewThreadDetail } }>` — wrong type parameter and wrong return expression `payload.data.detail`. Correct: `primeRequest<{ detail: PrimeReviewThreadDetail }>` and return `{ detail: payload.detail }`. |
| Major | TASK-07 Affects list, Execution plan | `prime_broadcast_initiated` is not in the `inboxEventTypes` as-const array in `telemetry.server.ts`. Calling `recordInboxEvent` with this string would produce a TypeScript compile error. TASK-07 Affects list omitted `telemetry.server.ts`; execution plan did not include a step to add the event type. |
| Moderate | TASK-07 Execution plan step 4 | `sendPrimeInboxThread` call phrasing was ambiguous about `buildPrimeInboxThreadId` wrapper vs inline prefixed string. Clarified that `buildPrimeInboxThreadId('broadcast_whole_hostel')` is the correct call. |

**Autofixes applied:**
- Corrected TASK-06 execution plan steps 3 and 4: changed type parameter from `{ success: boolean; data: { detail: ... } }` to `{ detail: PrimeReviewThreadDetail }`; changed return expression from `payload.data.detail` to `payload.detail`. Added inline note explaining `primeRequest<T>` returns the unwrapped T.
- Added `apps/reception/src/lib/inbox/telemetry.server.ts` to TASK-07 Affects list (not readonly — must be edited).
- Added step 1 to TASK-07 execution plan: add `'prime_broadcast_initiated'` to `inboxEventTypes` array in `telemetry.server.ts`.
- Clarified TASK-07 execution plan step 5 (renumbered from 4): explicit `buildPrimeInboxThreadId('broadcast_whole_hostel')` call.
- Updated TASK-07 "What would make this >=90%?" to confirm the event type is resolved within this task.
- Updated Risks & Mitigations: `prime_broadcast_initiated` risk marked as resolved in plan.
- Updated Rehearsal Trace TASK-07 row: finding marked resolved.

**Post-fix assessment:** Both Major findings addressed. No remaining structural issues. Plan is credible for build handoff.

**Final lp_score: 4.0** (credible — all autofixes applied). Critical count: 0.
