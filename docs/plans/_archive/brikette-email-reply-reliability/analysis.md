---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Last-reviewed: 2026-03-12
Feature-Slug: brikette-email-reply-reliability
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brikette-email-reply-reliability/fact-find.md
Related-Plan: docs/plans/brikette-email-reply-reliability/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Brikette Email Reply Reliability — Analysis

## Decision Frame

### Summary

Three P1 failures in the guest email reply pipeline need code fixes before the next guest volume spike. The decisions to make here are: (1) how to surface stuck threads proactively without adding external infrastructure; (2) how to make the send route safe on retry without a database transaction primitive; (3) how to propagate AI uncertainty without a breaking schema migration. All three are independent fixes in the same subsystem. This analysis makes a decisive per-problem recommendation so planning can decompose into tasks without revisiting option selection.

### Goals
- Ensure admitted threads that fail draft generation or require follow-up are surfaced to staff within 2 hours.
- Prevent the same email being sent twice to a guest when a retry occurs during the send sequence.
- Surface AI uncertainty at the draft review stage so operators can identify low-confidence drafts before sending.

### Non-goals
- Rebuilding the admission/classification pipeline.
- Changing the AI model or prompt architecture.
- Adding external alerting (SMS, PagerDuty) beyond the existing inbox UI.

### Constraints & Assumptions
- Constraints:
  - D1 (Cloudflare) has no `SELECT FOR UPDATE` or advisory locks; idempotency must use unique constraints or conditional updates.
  - Reception app deploys as a Cloudflare Worker — no persistent in-memory state.
  - Cron triggers are fixed at 1-minute (inbox-sync) and 30-minute (inbox-recovery) intervals.
  - Tests run in CI only.
- Assumptions:
  - `deliveryStatus: "needs_follow_up"` from `generateDraftCandidate` accurately identifies drafts where at least one question was unanswered.
  - `needs_manual_draft = 1` flag is already readable by the inbox UI (column confirmed in `repositories.server.ts`).
  - `drafts.gmail_draft_id` is reliably NULL before the send route sets it for the first time.

## Inherited Outcome Contract

- **Why:** Three confirmed failure modes in the guest email pipeline risk silent failures (no reply ever sent), duplicate guest replies, and confidently wrong AI responses reaching guests. These directly harm guest experience and hostel reputation, and are surfaced by operational observation with >85% confidence estimates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Code fixes deployed for stuck emails, duplicate replies, and AI overconfidence; stuck admitted threads surface for manual action within 2 hours; duplicate sends prevented at the send route level; AI uncertainty routes to manual-review flag rather than confident-guess delivery.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/brikette-email-reply-reliability/fact-find.md`
- Key findings used:
  - `send/route.ts:134-146` — no idempotency check before `createGmailDraft()`; `gmail_draft_id` written only after `sendGmailDraft()` completes; ordering must be inverted.
  - `draft-pipeline.server.ts:299` / `sync.server.ts:732` — `deliveryStatus: "needs_follow_up"` is computed but not stored in D1; routing uses only `qualityResult.passed`.
  - `recovery.server.ts:168-172` — `flagForManualDraft()` only writes to D1; no staff notification fires.
  - `quality_json` on `drafts` table is a free-form JSON blob; `deliveryStatus` can be stored there without a D1 schema migration.
  - `createDraftIfNotExists()` guard (sync path, `repositories.server.ts`) confirms the INSERT-ON-CONFLICT pattern is already established in this codebase.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Implementation complexity | Simpler changes carry lower regression risk; Cloudflare Worker context limits options | High |
| Migration surface | D1 migrations must run before code deploy; nullable columns are safe to add additively | High |
| Testability | Unit tests must be feasible with existing Jest + mock injection pattern | High |
| Rollback safety | Each fix must be independently revertable without data loss | High |
| Reliability under retry | The primary goal is to prevent wrong outcomes on crash-retry | Critical |
| Observability | Staff must be able to detect stuck/low-confidence threads without polling logs | Medium |

## Options Considered

### Problem 1 — Stuck email surfacing

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Dead-letter monitor with cron | Add a new cron check (or extend inbox-recovery) that queries `needs_manual_draft = 1` threads updated more than N minutes ago and emits a `thread_events` entry with `outcome: "needs_manual_draft_alert"`. Add a visible count badge to the reception inbox navigation by querying this status on inbox page load. | Matches existing cron pattern. No new infrastructure. Badge reuses existing `needs_manual_draft` D1 column. | Badge is only visible when staff opens reception app — does not push. Recovery cron is every 30 min so badge update lags by up to 30 min. | Staff may not check inbox frequently. Cron cannot run faster than 30 min. | Yes |
| B — In-process immediate alert at flag time | When `flagForManualDraft()` fires (in `recovery.server.ts` or `sync.server.ts`), synchronously emit a structured `thread_events` entry tagged as a staff-visible alert event. Inbox UI polls or renders this event on next page load. | Alert fires at the exact moment the thread is flagged — no cron lag for the event itself. | Requires `flagForManualDraft()` to write two D1 rows (existing flag + new event) in the same request. Thread still only becomes visible on next UI load (no push). | D1 write failure could lose the alert event (no transaction). | Yes |

**Recommendation: Option B** — emit the alert event at flag time, not on a separate cron pass. This removes the 30-minute lag between thread being flagged and an event being recorded. The badge in the inbox navigation can still be computed on page load from the `thread_events` table. The implementation is a targeted change to `flagForManualDraft()` plus a UI badge query. The D1 double-write risk is low because the thread flag write happens first; if the event write fails, the thread is still flagged and visible in the inbox — the only downside is a missing telemetry entry, not a silent failure.

### Problem 2 — Duplicate send guard

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Pre-send idempotency check: write gmailDraftId before sendGmailDraft | Invert the current ordering in `send/route.ts`: (1) check `currentDraft.gmail_draft_id`; (2) if null, call `createGmailDraft()`, then immediately write `gmailDraftId` to D1 via `updateDraft()`; (3) then call `sendGmailDraft(gmailDraftId)`. If `gmail_draft_id` is already set on retry, skip creation and call `sendGmailDraft()` directly. Emit `send_duplicate_blocked` telemetry event when the guard short-circuits. | Directly addresses the root cause. Code-only change — no migration. Retry path is deterministic. Uses existing `updateDraft()` helper. | Two D1 writes per send (update gmailDraftId, then update status). If crash occurs between `createGmailDraft()` and the D1 write, the Gmail draft leaks (no matching D1 record). Retry will call `createGmailDraft()` again — net result is two Gmail drafts, but the second is the one that gets sent. | Leaked first Gmail draft is orphaned (not sent). This is safe — a draft that was never sent and never has its ID in D1 cannot be re-sent by the route. | Yes |
| B — Optimistic lock upgrade / conditional D1 update | Use a conditional UPDATE (`WHERE gmail_draft_id IS NULL`) to set `gmail_draft_id`, check affected rows; if 0 rows updated, another request already set it and we should read and use that value. This is a stricter guard at the D1 layer. | Stronger concurrency guarantee — at most one caller can set `gmail_draft_id`. | More complex query plumbing. Does not eliminate the window between `createGmailDraft()` and the D1 write — two concurrent callers can both create a Gmail draft before either writes to D1. | Concurrent rapid double-click scenario not fully addressed. | Yes |

**Recommendation: Option A** — pre-send idempotency check with write-before-send ordering. This is the pattern explicitly identified in the fact-find (`send/route.ts` ordering must be inverted). It is a code-only change, matches existing `updateDraft()` patterns, and makes the retry path deterministic. Option B adds complexity without eliminating the concurrent-create window. The leaked-first-draft risk is acceptable: an orphaned Gmail draft that was never sent cannot reach a guest.

### Problem 3 — AI overconfidence

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Store deliveryStatus in quality_json; add UI warning badge | Write `deliveryStatus` into the existing `drafts.quality_json` blob at draft creation time in `sync.server.ts`. Add a warning badge to the draft review UI that reads from `quality_json.deliveryStatus`. Emit a `draft_confidence` metadata field in the `drafted` thread event. No D1 schema migration needed. | No migration. `quality_json` already exists as a free-form JSON blob. Change is confined to write path in `sync.server.ts` and read path in draft serialization + UI component. Rollback is safe — UI simply stops reading the new field. | `quality_json` is not indexed; querying all low-confidence drafts requires reading every draft. No structural contract for the field — a future refactor could drop it. | If `quality_json` is null on legacy rows, must default gracefully. | Yes |
| B — Post-generation scoring gate: block quality pass when deliveryStatus is needs_follow_up | In `draft-pipeline.server.ts`, after `runQualityChecks()`, check `deliveryStatus`; if `needs_follow_up`, override `qualityResult.passed` to false and route to `needs_manual_draft = 1`. No new storage needed. | Simple logic change. Ensures low-confidence drafts never pass quality gate as confident. | Changes routing for all drafts that have any unanswered question — may increase `needs_manual_draft` rate significantly. Operator loses the option to review and send a partially-answered draft. No UI signal; threads just go to manual queue. | Could block legitimate drafts where AI answered most questions but could not answer one peripheral one. Harder to tune. | Yes |

**Recommendation: Option A** — store `deliveryStatus` in `quality_json` and add a warning badge. Option B is a blunt instrument: routing all `needs_follow_up` drafts to `needs_manual_draft = 1` removes operator agency and could flood the manual queue with drafts where the AI answered 90% of questions correctly. Option A surfaces the uncertainty at review time without routing the draft away — the operator sees the warning and decides whether to send or edit. This matches the goal of "surface AI uncertainty at draft review" rather than "block uncertain drafts from reaching operator."

## Chosen Approach

### Problem 1: Stuck email surfacing
**Chosen: Option B — emit alert event at flag time in `flagForManualDraft()`.**

Add a `thread_events` write with a distinct `outcome: "needs_manual_draft_alert"` event type inside `flagForManualDraft()` immediately after the existing `needs_manual_draft = 1` update. Add a navigation badge to the reception inbox that counts threads with this event type that have not subsequently reached `sent` status. This fires the moment a thread is flagged, with no 30-minute cron lag for the event itself.

### Problem 2: Duplicate send guard
**Chosen: Option A — invert gmailDraftId write ordering in `send/route.ts`.**

Before calling `createGmailDraft()`: check `currentDraft.gmail_draft_id`. If already set (non-null), skip creation and call `sendGmailDraft(currentDraft.gmail_draft_id)` directly. If null: call `createGmailDraft()`, write the returned `gmailDraftId` to D1 immediately via `updateDraft()`, then call `sendGmailDraft()`. Emit `send_duplicate_blocked` telemetry event when the guard short-circuits. No D1 migration required.

### Problem 3: AI confidence flag
**Chosen: Option A — write `deliveryStatus` into `quality_json`; add UI warning badge.**

In `sync.server.ts`, when calling `createDraftIfNotExists()` after a successful draft generation, merge `{ deliveryStatus: draftResult.status }` into the `quality_json` payload. In the draft serialization path, expose `deliveryStatus` as a field on the draft API response. In the reception inbox draft review UI, render a visible badge (e.g., "Needs follow-up") when `deliveryStatus === "needs_follow_up"`. Emit `followUpRequired: true` in the `drafted` thread event metadata.

### Combined sequencing

**Problem 2 (idempotency) should land before Problem 1 (monitoring).** The stuck-email monitor should not fire false alerts during the deployment window when an in-flight send may be mid-sequence. With Problem 2 fixed first, the send route is safe and monitoring events are trustworthy.

**Problem 3 (AI confidence) is independent** — it can be developed in parallel with Problem 2 or deployed after. There is no dependency between the two.

Recommended deploy order: Problem 2 → Problem 1 → Problem 3 (or Problem 2 → Problems 1 and 3 together).

## Rejected Options

- **Problem 1 — Option A (dead-letter cron):** Adds a 30-minute lag between a thread being flagged and an alert event being recorded. The event fires at the wrong moment (next cron run) rather than at the causal moment (flagForManualDraft call). Rejected in favor of in-process event emission.
- **Problem 2 — Option B (conditional D1 update as concurrency guard):** Does not eliminate the window where two concurrent callers both call `createGmailDraft()` before either writes to D1. Adds query complexity without resolving the core race. Rejected — the write-before-send ordering in Option A is sufficient for the realistic retry scenario.
- **Problem 3 — Option B (block quality pass on needs_follow_up):** Removes operator agency on partially-answered drafts. Could flood the manual queue. Does not surface *why* a draft is low-confidence — it just routes it away. Rejected because the goal is operator visibility at review, not increased `needs_manual_draft` volume.

## Engineering Coverage Comparison

| Coverage Area | Option A (per problem) | Option B (per problem) | Chosen implication |
|---|---|---|---|
| UI / visual | P1-A: badge computed on page load from existing cron event; P2-A: no UI change; P3-A: warning badge added to draft review card | P1-B: same badge result (existing `InboxWorkspace.tsx` badge already renders `needs_manual_draft` count — no new UI needed for P1); P2-B: no UI change; P3-B: no badge — thread routes to manual queue silently | Chosen: P1-B + P2-A + P3-A. **One** new UI change required: draft confidence badge (P3 only). Problem 1 UI already exists in `InboxWorkspace.tsx:18-22`. Problem 2 has no UI surface. |
| UX / states | P3-A: new `needs_follow_up` visual state on draft review; P1-B: existing `needs_manual_draft` state gains count badge in nav | P3-B: no new state; uncertain drafts just become `needs_manual_draft = 1` without distinction | Chosen adds a new visible draft state for low-confidence drafts. Existing `needs_manual_draft` state is unchanged; it gains a navigation-level count signal. |
| Security / privacy | All options: no new endpoints, no auth changes, no new data exposure. Staff auth (`requireStaffAuth`) continues to protect all routes. | Same | N/A — no security surface change. |
| Logging / observability / audit | P1-B: new `needs_manual_draft_alert` event in `thread_events`; P2-A: new `send_duplicate_blocked` event; P3-A: `deliveryStatus` added to `drafted` event metadata | P1-A: event on cron pass (30-min lag); P2-B: same; P3-B: no new event | Chosen approach adds three distinct new telemetry event types. All write to existing `thread_events` table. No new infrastructure. |
| Testing / validation | P2-A: idempotency guard is easy to test (mock `createGmailDraft`, verify not called when `gmail_draft_id` set); P3-A: `quality_json` write is easy to assert in unit test | P2-B: conditional update requires more complex mock setup; P3-B: routing logic easier to test but badge test is moot | Chosen options have clean test seams. All three fixes have existing mock injection points. No new test infrastructure required. |
| Data / contracts | P2-A: no migration; P3-A: `quality_json` blob extended (no migration); P1-B: new `thread_events` row type (no migration — `thread_events` is append-only with a string `event_type`) | P3-B: no data change | No D1 migration required for any chosen option. All data changes are additive (new event types, new JSON field within existing blob). `InboxDraftRow` type definition needs `deliveryStatus` added to serialization — TypeScript-only change. |
| Performance / reliability | P2-A: adds one extra D1 write per send (gmailDraftId update before send); total send path goes from 2 to 3 D1 writes. P3-A: negligible — one extra JSON field in quality_json. P1-B: one extra D1 write at flag time. | P2-B: one D1 write (conditional update) but more complex query | Chosen adds at most one extra D1 write per operation path. Recovery cron limit of 20 threads is unchanged — acceptable for current volume; noted for planning to make configurable. |
| Rollout / rollback | No D1 migrations required for any chosen option. P3-A: rollback = UI stops reading `deliveryStatus` from `quality_json`; backend can continue writing it safely. P1-B: rollback = remove badge query and stop emitting `needs_manual_draft_alert` events. P2-A: rollback = revert `send/route.ts` ordering. | P3-B: rollback = revert routing logic in draft-pipeline. | Cleanest rollback profile of all options. Each fix is independently revertable with a single-file change. |

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Inbox sync (triage) | Cron every minute → `syncInbox()` → Gmail → per-thread classify → admit/archive/review-later | As now | Unchanged — no modifications to admission or classification | Classification, admission, checkpoint management | None |
| Draft generation | `generateAgentDraft()` → `generateDraftCandidate()` → `runQualityChecks()` → if passed: create draft in D1; else: `needs_manual_draft = 1`. `deliveryStatus` computed but silently dropped. | Draft pipeline runs per admitted thread | `deliveryStatus` is now written into `drafts.quality_json` at draft creation. `drafted` thread event includes `followUpRequired` metadata. AI-uncertain drafts reach operator review with a visible badge. | Quality gate logic unchanged (`qualityResult.passed` still routes to `needs_manual_draft` on failure) | `quality_json` must default gracefully on legacy rows that lack `deliveryStatus` key |
| Recovery cron | Fires every 30 min → `recoverStaleThreads()` → retries up to 3 times → `flagForManualDraft()` on exhaustion; no event at flag time | Exhausted recovery attempts | `flagForManualDraft()` now emits `needs_manual_draft_alert` event to `thread_events` immediately after writing `needs_manual_draft = 1` to `threads` | Recovery query, stale threshold, retry count unchanged | D1 double-write: if event write fails, thread is still flagged; only telemetry is missing |
| Send path | Operator clicks Send → `createGmailDraft()` → `sendGmailDraft()` → status updates. `gmail_draft_id` written only after send completes. No idempotency guard. | Operator send action | Send path now: (1) check `currentDraft.gmail_draft_id`; (2) if set, skip to `sendGmailDraft(existingId)` and emit `send_duplicate_blocked`; (3) if null, `createGmailDraft()` → write `gmailDraftId` to D1 → `sendGmailDraft()` → status updates | Optimistic lock (`expectedUpdatedAt`) for edit conflicts unchanged | Window between `createGmailDraft()` and D1 write: crash here leaks an orphaned Gmail draft. Safe — it cannot be re-sent. |
| Reception inbox UI | `InboxWorkspace.tsx:18-22` already renders `manualDraftCount` badge from D1 `needs_manual_draft` column. No confidence badge on draft review card. | UI page load | **Problem 1 (no new UI work required):** existing `manualDraftCount` badge already surfaces `needs_manual_draft = 1` threads. **Problem 3:** draft review card gains "Needs follow-up" badge when `deliveryStatus === "needs_follow_up"` (read from `quality_json` via draft API response). | Thread list, draft editor, send action, `manualDraftCount` badge | `quality_json.deliveryStatus` must be exposed in draft serialization API response for UI to read |
| Telemetry / observability | `thread_events` has: `admitted`, `drafted`, `sent`, `send_failed`, `inbox_recovery`, `thread_sync_error`. No event for flag-time alert or duplicate-send block or confidence signal. | New events emitted by fixed code | Three new event types: `needs_manual_draft_alert` (at flag time), `send_duplicate_blocked` (when idempotency guard fires), `draft_confidence` metadata on `drafted` events | Existing event types unchanged | `send_duplicate_blocked` should fire at zero rate in normal operation; non-zero rate confirms crashes are occurring |

## Planning Handoff

- Planning focus:
  - TASK-01: Modify `flagForManualDraft()` in `recovery.server.ts` to emit `needs_manual_draft_alert` thread event. Add navigation badge to reception inbox UI. Add unit test verifying event emission.
  - TASK-02: Invert `gmailDraftId` write ordering in `send/route.ts`. Add idempotency guard (check `gmail_draft_id` before `createGmailDraft()`). Emit `send_duplicate_blocked` event. Add unit test for the guard path.
  - TASK-03: Write `deliveryStatus` into `quality_json` in `sync.server.ts` at draft creation. Expose via draft serialization. Add confidence badge to reception inbox draft review UI. Emit `followUpRequired` in `drafted` event. Add unit tests.
  - TASK-04: Integration test — `recoverStaleThreads()` with `needs_manual_draft = 1` threads verifies event emitted; send route retry verifies guard fires.
- Validation implications:
  - All tests run in CI only; no local `jest` or `pnpm test` runs.
  - Send route mock injection (`createGmailDraft` import) is already available — no new test seam needed.
  - `quality_json` read path must handle null/absent `deliveryStatus` key without throwing.
- Sequencing constraints:
  - TASK-02 (send idempotency) must deploy before TASK-01 (stuck-email alert) to avoid false alerts during deployment transitions where in-flight sends may be mid-sequence.
  - TASK-03 (AI confidence) is independent and can be sequenced in parallel with or after TASK-02.
  - No D1 migrations are required — all changes are code-only.
- Risks to carry into planning:
  - Badge query on `thread_events` for navigation count may be slow if the table is large; plan should specify whether to use a cached aggregate or a direct query with a LIMIT.
  - The `flagForManualDraft()` double-write (flag + event) is not transactional in D1. If the event write fails, the thread is still flagged correctly — this is acceptable but should be noted in the unit test.
  - Operator open question: should `needs_manual_draft_alert` threads also surface in the existing `needs_manual_draft` inbox filter, or is the badge sufficient? Default assumption: badge only (no new filter). If operator requires a dedicated filter view, that is additive scope.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Badge query performance on large `thread_events` table | Low (current volume) | Medium | Table size not measured in fact-find | Plan should specify query shape (COUNT with WHERE) and confirm D1 index on `thread_id` + `event_type` |
| Orphaned Gmail draft on crash between createGmailDraft and D1 write (Problem 2) | Low | Low — draft never sent, never surfaced to guest | Inherent to D1's lack of transactions; acceptable risk level | Document in send route comments; add telemetry for orphan detection if volume warrants |
| `quality_json` schema informality (Problem 3) | Low | Low — free-form blob | No migration needed; acknowledged trade-off | Plan should add TypeScript type guard for `quality_json` deserialization |
| Recovery cron limit of 20 threads per run may lag during surge | Low (normal volume) | Medium (surge) | Volume data not available from fact-find | Plan should make limit configurable via env var |
| Operator alerting modality: badge-only may be missed if staff don't open reception app | Medium | Medium | Operator decision required (fact-find open question) | Default to badge; plan should note that push notification is additive scope if operator requests it |

## Planning Readiness
- Status: Go
- Rationale: All three root causes are confirmed from source code. No D1 migrations required for any chosen option. All three fixes have clean test seams and clear implementation paths in named files. The one open operator question (alerting modality) has a defined default assumption (badge-only) that allows planning to proceed without operator input. Sequencing constraints are explicit. Planning can decompose into four tasks without revisiting option selection.
- Post-analysis discovery: `apps/reception/src/components/inbox/InboxWorkspace.tsx:18-22` already renders `countThreadsNeedingManualDraft()` as a count badge from the D1 `needs_manual_draft` column. The UI badge for Problem 1 already exists. Problem 1 UI scope is **backend-only**: only the `needs_manual_draft_alert` event emission in `flagForManualDraft()` is new work. TASK-01 can skip any UI component changes. `deliveryStatus` / confidence signal has no existing rendering — Problem 3 UI badge is confirmed new work.
