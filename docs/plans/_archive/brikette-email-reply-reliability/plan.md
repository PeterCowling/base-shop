---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-email-reply-reliability
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brikette-email-reply-reliability/analysis.md
Work-Package-IDs: none
---

# Brikette Email Reply Reliability Plan

## Summary

Three confirmed P1 failure modes in the guest email reply pipeline require targeted code fixes: (1) stuck threads reaching `needs_manual_draft = 1` without any observable staff alert, (2) the send route creating a second Gmail draft on retry because `gmail_draft_id` is written only after send completes, and (3) AI-generated drafts with unanswered questions being delivered to operators without any confidence indicator. All three fixes are code-only — no D1 schema migrations required. TASK-01 and TASK-02 follow a strict deployment order (idempotency first, then alerting); TASK-03 is independent and can be deployed in parallel.

## Active tasks
- [x] TASK-01: Fix duplicate send risk — invert `gmailDraftId` write ordering in `send/route.ts` — Complete (2026-03-12)
- [x] TASK-02: Add stuck-email alert event in `flagForManualDraft()` — Complete (2026-03-12)
- [x] TASK-03: Store AI confidence in `quality_json` and surface badge on draft review card — Complete (2026-03-12)

## Goals
- Ensure admitted threads that fail draft generation or require follow-up are surfaced to staff within 2 hours.
- Prevent the same email being sent twice to a guest when a retry occurs during the send sequence.
- Surface AI uncertainty at the draft review stage so operators can identify low-confidence drafts before sending.

## Non-goals
- Rebuilding the admission/classification pipeline.
- Changing the AI model or prompt architecture.
- Adding external alerting (SMS, PagerDuty) beyond the existing inbox UI.

## Constraints & Assumptions
- Constraints:
  - D1 (Cloudflare) has no `SELECT FOR UPDATE` or advisory locks; idempotency must use unique constraints or conditional updates.
  - Reception app deploys as a Cloudflare Worker — no persistent in-memory state.
  - Cron triggers are fixed at 1-minute (inbox-sync) and 30-minute (inbox-recovery) intervals.
  - Tests run in CI only per `docs/testing-policy.md`.
- Assumptions:
  - `deliveryStatus: "needs_follow_up"` from `generateDraftCandidate` accurately identifies drafts where at least one question was unanswered.
  - `needs_manual_draft = 1` flag is already readable by the inbox UI — confirmed: `InboxWorkspace.tsx:18-22` calls `countThreadsNeedingManualDraft()`.
  - `drafts.gmail_draft_id` is reliably NULL before the send route sets it for the first time.
  - `quality_json` on the `drafts` table is an existing free-form JSON blob; `deliveryStatus` can be stored there without a D1 schema migration.

## Inherited Outcome Contract

- **Why:** Three confirmed failure modes in the guest email pipeline risk silent failures (no reply ever sent), duplicate guest replies, and confidently wrong AI responses reaching guests. These directly harm guest experience and hostel reputation, and are surfaced by operational observation with >85% confidence estimates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Code fixes deployed for stuck emails, duplicate replies, and AI overconfidence; stuck admitted threads surface for manual action within 2 hours; duplicate sends prevented at the send route level; AI uncertainty routes to manual-review flag rather than confident-guess delivery.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/brikette-email-reply-reliability/analysis.md`
- Selected approach inherited:
  - Problem 1 (stuck emails): Option B — emit `needs_manual_draft_alert` event at flag time in `flagForManualDraft()`.
  - Problem 2 (duplicate send): Option A — invert `gmailDraftId` write ordering in `send/route.ts`; write D1 before `sendGmailDraft()`.
  - Problem 3 (AI overconfidence): Option A — store `deliveryStatus` in `quality_json` blob; surface confidence badge in draft review UI.
- Key reasoning used:
  - Option B for Problem 1 eliminates the 30-min cron lag — alert fires at flag time, not at next recovery pass.
  - Option A for Problem 2 is a code-only change with a deterministic retry path; Option B added complexity without eliminating the concurrent-create window.
  - Option A for Problem 3 avoids flooding the manual queue and preserves operator agency on partially-answered drafts.

## Selected Approach Summary
- What was chosen:
  - TASK-01: Pre-send idempotency check in `send/route.ts` — check `currentDraft.gmail_draft_id` before `createGmailDraft()`, write `gmailDraftId` to D1 immediately after creation and before `sendGmailDraft()`, emit `send_duplicate_blocked` event when guard fires.
  - TASK-02: In-process alert in `flagForManualDraft()` (`recovery.server.ts`) — after writing `needs_manual_draft = 1`, emit a `needs_manual_draft_alert` event to `thread_events`.
  - TASK-03: Write `deliveryStatus` into `drafts.quality_json` in both sync (`upsertSyncDraft` / `createDraftIfNotExists`) and recovery (`createDraft`) draft creation paths; expose `deliveryStatus` in `serializeDraft()` / `InboxDraftApiModel`; render badge in draft review UI when value is `"needs_follow_up"`.
- Why planning is not reopening option selection:
  - All three options were evaluated and decided in `analysis.md`. No new evidence from source code inspection contradicts the chosen approaches. The source reads confirm exact file paths, function signatures, and call sequences.

## Fact-Find Support
- Supporting brief: `docs/plans/brikette-email-reply-reliability/fact-find.md`
- Evidence carried forward:
  - `send/route.ts:134-146` — `createGmailDraft()` called unconditionally; `gmailDraftId` written only after `sendGmailDraft()` at line 149-160.
  - `recovery.server.ts:330-358` — `flagForManualDraft()` calls `updateThreadStatus()` then `recordInboxEvent()` with outcome only; no distinct alert event type emitted.
  - `draft-pipeline.server.ts:300` — `status: generationResult.deliveryStatus` returned in `AgentDraftResult`; never written to D1.
  - `sync.server.ts:732-740` — `draftResult.status !== "error" && draftResult.qualityResult?.passed` used as gate; `draftResult.status` ("needs_follow_up") not stored.
  - `api-models.server.ts:242-260` — `serializeDraft()` maps `quality_json` blob but has no `deliveryStatus` field in `InboxDraftApiModel`.
  - `InboxWorkspace.tsx:18-22` — `countThreadsNeedingManualDraft()` already exists; Problem 1 UI is **backend-only** (no new UI component required).

## Plan Gates
- Foundation Gate: Pass — all three fixes are code-only; no D1 migrations; source file paths confirmed; test seams available.
- Sequenced: Yes — TASK-01 before TASK-02 (idempotency must land before alerting to avoid false alerts during deployment transitions); TASK-03 independent.
- Edge-case review complete: Yes — orphaned Gmail draft risk on crash documented; D1 double-write non-transactional risk documented; `quality_json` null-default handling required.
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix duplicate send: invert gmailDraftId write ordering in send/route.ts | 88% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add stuck-email alert event in flagForManualDraft() | 87% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Store AI confidence in quality_json; surface badge on draft review card | 84% | M | Pending | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | New "Needs follow-up" badge on draft review card when `deliveryStatus === "needs_follow_up"` | TASK-03 | Problem 1 and 2 have no new UI. `manualDraftCount` badge in `InboxWorkspace.tsx` already exists for Problem 1. |
| UX / states | New visual draft state ("Needs follow-up") surfaced at review time; existing `needs_manual_draft` state unchanged | TASK-03 | Default graceful handling when `deliveryStatus` absent/null on legacy rows required |
| Security / privacy | N/A — no new endpoints, no auth changes, no new data exposure; `requireStaffAuth` continues to protect all routes | - | All three fixes are internal to existing staff-authenticated routes |
| Logging / observability / audit | Three new telemetry event types: `send_duplicate_blocked` (TASK-01), `needs_manual_draft_alert` (TASK-02), `followUpRequired` metadata on `drafted` event (TASK-03) | TASK-01, TASK-02, TASK-03 | All write to existing `thread_events` table; no new infrastructure |
| Testing / validation | Unit tests for idempotency guard, alert event emission, `deliveryStatus` storage, and confidence badge rendering; all in CI only | TASK-01, TASK-02, TASK-03 | Existing mock injection points cover all three; no new test seam needed |
| Data / contracts | `InboxDraftApiModel` gains `deliveryStatus` field; `quality_json` blob extended additively; three new `thread_events` event types (append-only, no migration) | TASK-01, TASK-02, TASK-03 | No D1 schema migrations required for any task |
| Performance / reliability | At most one extra D1 write per operation path: TASK-01 adds pre-send gmailDraftId write; TASK-02 adds post-flag event write; TASK-03 adds deliveryStatus field to quality blob (negligible) | TASK-01, TASK-02, TASK-03 | Recovery cron limit of 20 threads unchanged; make limit env-configurable noted as adjacent scope |
| Rollout / rollback | Each fix independently revertable with a single-file change; no migration to roll back | TASK-01, TASK-02, TASK-03 | TASK-01 rollback: revert `send/route.ts`; TASK-02 rollback: remove alert event emission; TASK-03 rollback: UI stops reading `deliveryStatus` from quality blob |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | TASK-01 and TASK-03 are independent; run in parallel |
| 2 | TASK-02 | TASK-01 deployed | TASK-02 must wait for TASK-01 to land to avoid false alerts during in-flight send transitions |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Inbox sync (triage) | Cron every minute | Unchanged — no modifications to admission or classification | None | None |
| Draft generation (sync path) | Admitted thread, no prior draft | `syncInbox()` → `upsertSyncDraft()` → `createDraftIfNotExists()` — `deliveryStatus` from `draftResult.status` now merged into `quality_json` payload before insert; `drafted` event gains `followUpRequired` metadata | TASK-03 | `quality_json` must default gracefully on legacy rows that lack `deliveryStatus` key |
| Draft generation (recovery path) | Recovery cron, stale admitted thread | `recoverStaleThreads()` → `recoverSingleThread()` → `createDraft()` — `deliveryStatus` from `draftResult.status` now merged into `quality` field before D1 insert | TASK-03 | Same null-default seam as sync path |
| Recovery cron — manual flag | Recovery exhausts retries OR draft fails quality gate | `flagForManualDraft()` → `updateThreadStatus(needs_manual_draft = 1)` → **NEW: `recordInboxEvent(needs_manual_draft_alert)`** | TASK-02 | D1 double-write non-transactional: if event write fails, thread still flagged correctly; only telemetry entry is lost |
| Send path | Operator clicks Send | (1) check `currentDraft.gmail_draft_id`; (2) if already set → skip creation, emit `send_duplicate_blocked`, call `sendGmailDraft(existing id)`; (3) if null → `createGmailDraft()` → **write `gmailDraftId` to D1 immediately** → `sendGmailDraft()` → update status → record events | TASK-01 | Window between `createGmailDraft()` and D1 write: crash here leaks an orphaned Gmail draft (never sent, never re-sent — safe) |
| Draft review UI | Operator opens draft for review | Draft card reads `quality.deliveryStatus` from API response; **NEW: "Needs follow-up" badge rendered** when value is `"needs_follow_up"` | TASK-03 | `serializeDraft()` must expose `deliveryStatus` from `quality_json` in API response |
| Telemetry / observability | New events from fixed code | Three new event types now recorded in `thread_events`: `needs_manual_draft_alert`, `send_duplicate_blocked`, `followUpRequired` on `drafted` events | TASK-01, TASK-02, TASK-03 | `send_duplicate_blocked` should fire at zero rate in normal operation; non-zero rate confirms crashes are occurring |

## Tasks

---

### TASK-01: Fix duplicate send risk — invert `gmailDraftId` write ordering in `send/route.ts`
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`; new test cases in `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 88%
  - Implementation: 90% — exact call sequence at `send/route.ts:134-160` confirmed; `updateDraft()` helper already accepts `gmailDraftId` at `repositories.server.ts:1344-1346`; `recordInboxEvent` import already present.
  - Approach: 88% — write-before-send ordering is the standard idempotency pattern; risk of orphaned Gmail draft on crash is documented and acceptable.
  - Impact: 88% — directly addresses the root cause; the guard is deterministic on retry.
- **Acceptance:**
  - [ ] When `currentDraft.gmail_draft_id` is already set (non-null), `createGmailDraft()` is NOT called and `send_duplicate_blocked` event is recorded.
  - [ ] When `currentDraft.gmail_draft_id` is null, `createGmailDraft()` is called, the returned ID is written to D1 via `updateDraft()` BEFORE `sendGmailDraft()` is called.
  - [ ] After the ordering inversion, `sendGmailDraft(created.id)` still completes successfully and the thread reaches `sent` status.
  - [ ] `send_duplicate_blocked` event appears in `thread_events` with correct `threadId` and `actorUid`.
  - [ ] Existing optimistic lock conflict path (`expectedUpdatedAt`) is unaffected.
  - [ ] CI tests pass with no regression in existing send route tests.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change; send is operator-triggered action with existing success/error UX.
  - UX / states: N/A — send success and error states unchanged; `send_duplicate_blocked` is a guard that results in a normal send.
  - Security / privacy: N/A — no new endpoint, no new data exposure; `requireStaffAuth` unchanged.
  - Logging / observability / audit: Required — new `send_duplicate_blocked` event emitted to `thread_events`; confirms guard fired and prevented duplicate; non-zero rate in production signals crash-retry is occurring.
  - Testing / validation: Required — unit test: mock `createGmailDraft` and verify it is NOT called when `currentDraft.gmail_draft_id` is already set; unit test: verify `updateDraft({ gmailDraftId })` is called BEFORE `sendGmailDraft()` in the normal path.
  - Data / contracts: Required — `updateDraft()` called with `{ gmailDraftId: created.id }` before status updates; no schema migration; existing `gmail_draft_id` column on `drafts` table used.
  - Performance / reliability: Required — adds one extra D1 write per send (gmailDraftId before send, then status updates); total send path goes from 2 to 3 D1 writes; acceptable at current volume.
  - Rollout / rollback: Required — code-only change; rollback = revert `send/route.ts` to prior ordering; no data migration needed.
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `gmail_draft_id` already set → `createGmailDraft` mock called 0 times; `send_duplicate_blocked` event recorded; `sendGmailDraft` called with existing ID.
  - TC-02: `gmail_draft_id` is null → `createGmailDraft` called once; `updateDraft({ gmailDraftId })` called before `sendGmailDraft` in mock call order; thread reaches `sent` status.
  - TC-03: `createGmailDraft` returns no `id` → throws "Gmail draft creation did not return a draft id"; `send_failed` event recorded; no D1 gmailDraftId update attempted.
  - TC-04: `expectedUpdatedAt` conflict → 409 returned; `send_duplicate_blocked` not emitted; existing conflict path unchanged.
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test asserting `updateDraft({ gmailDraftId })` is called before `sendGmailDraft`.
  - Green: In `send/route.ts`, before `sendGmailDraft(created.id)`: (1) check `if (currentDraft.gmail_draft_id)` — if set, emit `send_duplicate_blocked` and call `sendGmailDraft(currentDraft.gmail_draft_id)` directly; (2) if null, call `createGmailDraft()`, then immediately call `updateDraft({ draftId: currentDraft.id, gmailDraftId: created.id, createdByUid: auth.uid })`, then call `sendGmailDraft(created.id)`.
  - Refactor: Remove the first `updateDraft` call with `status: "approved"` and `gmailDraftId: created.id` (lines 149-154 of current code) now that `gmailDraftId` is written earlier; keep the `status: "approved"` update but without re-writing `gmailDraftId`. Verify no observable regression.
- **Planning validation:**
  - Checks run: Read `send/route.ts` lines 133-160; read `repositories.server.ts:1336-1436` (updateDraft signature); confirmed `updateDraft` accepts `gmailDraftId` as optional field; confirmed `recordInboxEvent` already imported.
  - Validation artifacts: `send/route.ts:134` — `createGmailDraft()` called at line 134 unconditionally; `updateDraft` with `gmailDraftId` at lines 149-154 only after `sendGmailDraft(created.id)` at line 146 — ordering inversion confirmed.
  - Unexpected findings: None — `updateDraft()` already has the `gmailDraftId` parameter; no new function signature needed.
- **Scouts:** None required — `updateDraft` with `gmailDraftId` already exists; `recordInboxEvent` already imported.
- **Edge Cases & Hardening:**
  - If `createGmailDraft()` succeeds but the subsequent `updateDraft({ gmailDraftId })` D1 write fails: a retry will call `createGmailDraft()` again, creating a second Gmail draft. The first draft is orphaned (never sent, never ID'd in D1 — safe). Document this in a code comment.
  - If `sendGmailDraft()` fails after `gmailDraftId` is written to D1: a retry will detect `gmail_draft_id` is set, skip creation, and call `sendGmailDraft()` with the existing ID. This is the desired retry behavior.
- **What would make this >=90%:** Confirm via a test run in CI that the mock injection for `createGmailDraft` works correctly in the route test context.
- **Rollout / rollback:**
  - Rollout: Deploy `send/route.ts` change; no migration required; no env var changes.
  - Rollback: Revert `send/route.ts` to prior ordering; no data loss (D1 drafts with `gmail_draft_id` set remain safe as the old code never checked that field).
- **Documentation impact:** Add a code comment in `send/route.ts` at the idempotency guard explaining the orphaned-draft risk and why it is safe.
- **Notes / references:** `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts:134-160` is the exact block being changed. `repositories.server.ts:1344-1346` confirms `updateDraft()` already supports `gmailDraftId`.

---

### TASK-02: Add stuck-email alert event in `flagForManualDraft()`
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/lib/inbox/recovery.server.ts`; new/updated test cases in `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/recovery.server.ts`, `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 90% — `flagForManualDraft()` at `recovery.server.ts:330-358` is a contained function; `recordInboxEvent` already imported; adding one `recordInboxEvent` call is minimal risk.
  - Approach: 87% — in-process event emission is the correct pattern; D1 double-write non-transactional risk is acknowledged and acceptable (failure loses only the telemetry entry, not the flag).
  - Impact: 85% — event fires at the moment of flagging (no cron lag); operator sees it on next inbox load. Badge for `needs_manual_draft` count in UI already exists; this adds the observable trigger.
- **Acceptance:**
  - [ ] After `flagForManualDraft()` writes `needs_manual_draft = 1` to `threads`, a `needs_manual_draft_alert` event is recorded in `thread_events`.
  - [ ] The alert event includes `threadId`, `outcome` (the caller-supplied value), and `attempts` from `existingMetadata.recoveryAttempts`.
  - [ ] If the `recordInboxEvent` call for the alert fails, the function does NOT re-throw — the existing flag write succeeds regardless (fail-open on event write).
  - [ ] Existing `inbox_recovery` event (at the end of `flagForManualDraft`) continues to be emitted unchanged.
  - [ ] CI tests pass; recovery test file verifies alert event is emitted.
- **Engineering Coverage:**
  - UI / visual: N/A — `countThreadsNeedingManualDraft()` badge in `InboxWorkspace.tsx:18-22` already renders `needsManualDraft` flag; no new UI component required.
  - UX / states: N/A — `needs_manual_draft` UX state already exists; this fix only adds backend event emission.
  - Security / privacy: N/A — event is staff-internal; no new data exposed.
  - Logging / observability / audit: Required — new `needs_manual_draft_alert` event type fires at flag time (not cron lag); operators can detect stuck threads via event timeline without waiting for the next recovery pass.
  - Testing / validation: Required — unit test in `recovery.server.test.ts` verifying that when `flagForManualDraft()` is called, `recordInboxEvent` is called with `eventType: "needs_manual_draft_alert"`.
  - Data / contracts: Required — new `thread_events` row with event type `needs_manual_draft_alert`; append-only; no D1 schema migration needed.
  - Performance / reliability: Required — one extra D1 write per `flagForManualDraft()` invocation; acceptable (function called only on exhausted recovery); wrapped in try/catch fail-open.
  - Rollout / rollback: Required — rollback = remove the `recordInboxEvent("needs_manual_draft_alert")` call; no data loss; existing `needs_manual_draft` flag and `inbox_recovery` event unaffected.
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `flagForManualDraft()` called → `recordInboxEvent` called with `eventType: "needs_manual_draft_alert"` and matching `threadId`.
  - TC-02: `recordInboxEvent` for alert throws → error is caught; function resolves normally; existing `inbox_recovery` event still emitted.
  - TC-03: `recoverSingleThread` with `attempts >= maxRetries` → `flagForManualDraft` called → `needs_manual_draft_alert` event emitted; `result.manualFlagged` incremented.
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test asserting `recordInboxEvent` is called with `eventType: "needs_manual_draft_alert"` inside `flagForManualDraft`.
  - Green: In `flagForManualDraft()` at `recovery.server.ts`, after the existing `updateThreadStatus()` call (line 339-352) and before the existing `recordInboxEvent` call (line 354-358), add: `try { await recordInboxEvent({ threadId: thread.id, eventType: "needs_manual_draft_alert", metadata: { outcome, attempts: existingMetadata.recoveryAttempts ?? 0, failureCode: failureCode ?? null } }); } catch (e) { console.warn("[recovery] needs_manual_draft_alert event write failed", { threadId: thread.id, error: ... }); }`.
  - Refactor: Verify that the existing `recordInboxEvent` call at lines 354-358 (outcome event) is unchanged and still fires after the alert event.
- **Planning validation:**
  - Checks run: Read `recovery.server.ts:330-358`; confirmed `recordInboxEvent` already imported at `recovery.server.ts:27`; confirmed `flagForManualDraft` signature and call sites.
  - Validation artifacts: `recovery.server.ts:354-358` shows existing `recordInboxEvent({ eventType: "inbox_recovery", metadata: { outcome, attempts } })` — the new alert event is an additional write before this.
  - Unexpected findings: None.
- **Scouts:** None required.
- **Edge Cases & Hardening:** Alert event write failure is caught and logged; function does not re-throw so the existing flag + outcome event path is unaffected. D1 double-write non-transactional: if event write fails, thread is still `needs_manual_draft = 1` and visible in inbox.
- **What would make this >=90%:** Observation of actual `flagForManualDraft` call frequency in production `thread_events` to confirm the event would fire at meaningful rate.
- **Rollout / rollback:**
  - Rollout: Deploy `recovery.server.ts` change; no migration required.
  - Rollback: Remove the `needs_manual_draft_alert` `recordInboxEvent` call; no data loss; existing `needs_manual_draft` flag unaffected.
- **Documentation impact:** None required beyond code comment.
- **Notes / references:** Depends on TASK-01 being deployed first to ensure no in-flight sends create spurious alert events during the deployment window.

---

### TASK-03: Store AI confidence in `quality_json`; surface badge on draft review card
- **Type:** IMPLEMENT
- **Deliverable:** Code changes to `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/recovery.server.ts`, `apps/reception/src/lib/inbox/api-models.server.ts`; new badge in draft review UI component; new/updated tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/lib/inbox/sync.server.ts` (upsertSyncDraft — merge deliveryStatus into quality payload)
  - `apps/reception/src/lib/inbox/recovery.server.ts` (createDraft call — merge deliveryStatus into quality field)
  - `apps/reception/src/lib/inbox/api-models.server.ts` (InboxDraftApiModel type + serializeDraft)
  - `apps/reception/src/components/inbox/` (draft review card component — add confidence badge)
  - `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` (new test for deliveryStatus storage)
  - `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts` (new test for deliveryStatus in recovery path)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 85% — `quality_json` write path is in `upsertSyncDraft` and `createDraft`; `serializeDraft` already maps `quality_json`; UI draft review card location needs confirmation during build.
  - Approach: 85% — storing in free-form JSON blob is the minimal-migration approach; null-default on legacy rows is straightforward.
  - Impact: 82% — operators will see the badge on uncertain drafts; uncertain drafts already pass to operator review; badge adds signal without blocking delivery. Caveat: badge is only visible when operator opens the draft, not at list level.
- **Acceptance:**
  - [ ] When `draftResult.status === "needs_follow_up"`, the `quality_json` blob written to D1 contains `{ ..., deliveryStatus: "needs_follow_up" }`.
  - [ ] When `draftResult.status === "ready"`, `quality_json` contains `{ ..., deliveryStatus: "ready" }` (or null if result is absent).
  - [ ] `serializeDraft()` exposes `deliveryStatus` from `quality_json` in the API response (via the `quality` field or as a top-level field on `InboxDraftApiModel`).
  - [ ] The draft review UI renders a visible "Needs follow-up" badge when `deliveryStatus === "needs_follow_up"`.
  - [ ] Legacy drafts where `quality_json` has no `deliveryStatus` key render without the badge (default graceful — no error thrown).
  - [ ] `drafted` event in `thread_events` includes `followUpRequired: true` when `deliveryStatus === "needs_follow_up"`.
  - [ ] CI tests pass; unit test asserts `deliveryStatus` written into `quality_json` in both sync and recovery draft creation paths.
  - [ ] Expected user-observable behavior:
    - [ ] Operator opens a draft for a thread where AI could not answer all questions → sees "Needs follow-up" badge on the draft review card.
    - [ ] Operator opens a draft where AI answered all questions → no badge (or badge absent).
    - [ ] Old drafts (no `deliveryStatus` in `quality_json`) → no badge, no error.
- **Engineering Coverage:**
  - UI / visual: Required — new "Needs follow-up" badge on draft review card; reads `deliveryStatus` from `quality` field of draft API response; badge visible only on drafts with `deliveryStatus === "needs_follow_up"`.
  - UX / states: Required — new draft state at review time; no UX change for drafts with `deliveryStatus === "ready"` or absent; legacy null-default required.
  - Security / privacy: N/A — badge reads from existing `quality_json` field already returned to authenticated staff; no new data exposure.
  - Logging / observability / audit: Required — `drafted` event in `thread_events` gains `followUpRequired: true` metadata when `deliveryStatus === "needs_follow_up"`; enables monitoring distribution of uncertain drafts.
  - Testing / validation: Required — unit test: mock `generateAgentDraft` returning `status: "needs_follow_up"`, assert `quality_json` contains `deliveryStatus: "needs_follow_up"` after draft creation; unit test: `serializeDraft` with `quality_json` containing `deliveryStatus` exposed correctly; UI: QA loop on draft review card.
  - Data / contracts: Required — `InboxDraftApiModel.quality` already typed as `Record<string, unknown> | null`; `deliveryStatus` is a new key in that blob; TypeScript-only contract addition in `api-models.server.ts`. No D1 migration.
  - Performance / reliability: Required — one extra JSON field in `quality_json` per draft; negligible. Null-default on legacy rows with no `deliveryStatus` key must not throw.
  - Rollout / rollback: Required — rollback: remove badge from UI component and `deliveryStatus` merge from draft creation; backend can safely continue writing `deliveryStatus` without UI reading it. No data loss.
- **Validation contract (TC-01 through TC-05):**
  - TC-01: `upsertSyncDraft` called with `draftPayload.quality` containing `deliveryStatus: "needs_follow_up"` → draft row in D1 has `quality_json` with `deliveryStatus: "needs_follow_up"`.
  - TC-02: `serializeDraft` called on draft with `quality_json: '{"deliveryStatus":"needs_follow_up"}'` → returned `InboxDraftApiModel.quality` contains `deliveryStatus: "needs_follow_up"`.
  - TC-03: `serializeDraft` called on legacy draft with `quality_json: null` → `quality` is null; no error; badge not shown.
  - TC-04: `serializeDraft` called on draft with `quality_json: '{"confidence":0.9}'` (no `deliveryStatus` key) → badge not shown; no error.
  - TC-05: Draft review UI renders "Needs follow-up" badge when `draft.quality?.deliveryStatus === "needs_follow_up"`; renders nothing extra when absent.
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test asserting `quality_json` contains `deliveryStatus` after draft creation from a `needs_follow_up` draft result.
  - Green:
    1. In `sync.server.ts`, in `upsertSyncDraft` — when building `draftPayload.quality`, merge `deliveryStatus: draftResult.status` (captured from `draftResult` in `processThread` before calling `upsertSyncDraft`). Pass `deliveryStatus` as part of the `quality` object passed to `updateDraft` / `createDraftIfNotExists`.
    2. In `recovery.server.ts`, in `recoverSingleThread` — when calling `createDraft(...)`, merge `deliveryStatus: draftResult.status` into the `quality` field.
    3. In `api-models.server.ts` — `serializeDraft` already returns `quality: parseJsonObject(draft.quality_json)` which naturally includes `deliveryStatus` if present. No serialization function change required. `InboxDraftApiModel.quality` is already typed as `Record<string, unknown> | null` which accommodates the new field; no type annotation change needed.
    4. In `sync.server.ts`, in the `drafted` event recording (lines 841-851), add `followUpRequired: draftResult.status === "needs_follow_up"` to the event metadata.
    5. In the draft review UI component (exact path to be confirmed during build — likely within `apps/reception/src/components/inbox/ThreadDetailPane.tsx` or a child draft card component) — add a badge that reads `draft.quality?.deliveryStatus === "needs_follow_up"` and renders "Needs follow-up" text with appropriate styling.
  - Refactor: Ensure null-default: wherever `quality_json` is read and `deliveryStatus` accessed, use optional chaining `quality?.deliveryStatus`.
- **Planning validation (M effort):**
  - Checks run: Read `sync.server.ts:732-851` (draft quality gate, upsertSyncDraft call, drafted event); read `recovery.server.ts:268-324` (createDraft call in recoverSingleThread); read `api-models.server.ts:242-260` (serializeDraft); read `draft-pipeline.server.ts:299-305` (deliveryStatus returned in AgentDraftResult).
  - Validation artifacts:
    - `sync.server.ts:732` — gate checks `draftResult.status !== "error"` but does NOT store `draftResult.status`; `draftPayload.quality` is `draftResult.qualityResult` only (line 737); `deliveryStatus` must be merged here.
    - `recovery.server.ts:269-282` — `createDraft(...)` call passes `quality: draftResult.qualityResult as Record<string, unknown>` (line 276); `draftResult.status` available but not included.
    - `api-models.server.ts:255` — `quality: parseJsonObject(draft.quality_json)` already passes the full blob through; no additional serialization change required for the blob content itself.
    - `draft-pipeline.server.ts:300` — `status: generationResult.deliveryStatus` is the return value; confirmed it is `"ready" | "needs_follow_up"`.
  - Unexpected findings:
    - In `sync.server.ts`, `draftPayload` is assembled at lines 734-740 and does NOT include `draftResult.status`. The fix must add `deliveryStatus: draftResult.status` to the `quality` field when assembling `draftPayload`. The variable `draftResult` is in scope at that point.
    - In `recovery.server.ts`, the `createDraft` call at lines 270-282 passes `quality: draftResult.qualityResult as Record<string, unknown>`. The fix must spread `{ ...draftResult.qualityResult, deliveryStatus: draftResult.status }`.
- **Consumer tracing for `deliveryStatus`:**
  - Producer: `generateDraftCandidate()` at `draft-core/generate.ts:436-439`; returned via `draft-pipeline.server.ts:300` as `AgentDraftResult.status`.
  - Storage writers: `upsertSyncDraft` (sync path, `sync.server.ts`) and `createDraft` (recovery path, `recovery.server.ts`) — both modified in this task.
  - Serialization: `serializeDraft()` in `api-models.server.ts:255` — returns `quality: parseJsonObject(draft.quality_json)` which includes `deliveryStatus` once stored. No additional change required to the serialization function itself; `InboxDraftApiModel.quality` is already `Record<string, unknown> | null`.
  - UI consumer: Draft review card component reads `draft.quality?.deliveryStatus` — new badge added in this task.
  - Other consumers of `InboxDraftApiModel`: `prime-review.server.ts` uses `InboxDraftApiModel` but only for template matching and send operations — does not read `quality` blob; no silent ignore risk.
  - `drafted` event metadata: `sync.server.ts:841-851` — `followUpRequired` added to existing event metadata; no other consumers.
- **Scouts:** None required — `quality_json` is a confirmed free-form blob; `deliveryStatus` field addition is additive.
- **Edge Cases & Hardening:**
  - Legacy drafts with `quality_json: null` → `parseJsonObject(null)` returns null; badge check `quality?.deliveryStatus === "needs_follow_up"` evaluates to false. No error.
  - Legacy drafts with `quality_json` containing no `deliveryStatus` key → `quality?.deliveryStatus` is undefined; badge not shown.
  - `draftResult.status` is `"error"` — draft creation is not called (gated at `draftResult.status !== "error"`); no storage path reached.
- **What would make this >=90%:** Confirm exact UI component file path for draft review card during build phase.
- **Rollout / rollback:**
  - Rollout: Deploy all three file changes together; no migration required; existing drafts continue to work without `deliveryStatus` key.
  - Rollback: Remove badge from UI component; remove `deliveryStatus` merge from `upsertSyncDraft` and `createDraft`; `serializeDraft` change is purely additive (stops being read by UI). No data loss.
- **Documentation impact:** None required beyond inline code comments.
- **Notes / references:** `sync.server.ts:732-740` is the primary write-path change. `recovery.server.ts:268-282` is the secondary write-path. `api-models.server.ts:242-260` is the serialization path (already passes `quality_json` through; minor type annotation update). UI component path to be confirmed during build.

---

## Risks & Mitigations
- **Orphaned Gmail draft on crash between `createGmailDraft()` and D1 write (TASK-01):** Likelihood low; impact low — the orphaned draft is never sent and never re-sent (no D1 record). Mitigation: documented in code comment; acceptable risk.
- **D1 double-write non-transactional in `flagForManualDraft()` (TASK-02):** Likelihood low; impact low — if event write fails, thread is still `needs_manual_draft = 1` and visible in inbox; only the telemetry entry is lost. Mitigation: wrapped in try/catch; fail-open.
- **`quality_json` schema informality (TASK-03):** Likelihood low; impact low — free-form blob has no migration, which is the chosen trade-off. Mitigation: null-default handling throughout; TypeScript type annotation added.
- **Badge query performance on large `thread_events` table:** Likelihood low at current volume; impact medium at surge. Mitigation: badge for `needs_manual_draft` uses D1 `needs_manual_draft` column on `threads` table (not `thread_events`) — existing `countThreadsNeedingManualDraft()` already queries threads table directly. Not a concern for the current plan.
- **Recovery cron limit of 20 threads per run may lag during surge:** Likelihood low at normal volume. Mitigation: noted as adjacent scope; making limit env-configurable is a small follow-up.
- **Operator alerting modality (badge-only):** Likelihood medium that badge is missed if staff don't open reception app. Mitigation: default to badge; push notification is additive scope if operator requests.

## Observability
- Logging: Three new `thread_events` types: `send_duplicate_blocked`, `needs_manual_draft_alert`, `followUpRequired` metadata on `drafted` events.
- Metrics: Monitor `send_duplicate_blocked` rate (expected zero in normal operation; non-zero confirms crash-retries occurring). Monitor `needs_manual_draft_alert` rate to track stuck thread frequency.
- Alerts/Dashboards: Existing `countThreadsNeedingManualDraft()` badge in reception inbox surfaces manual-draft threads. No new dashboard required for this plan.

## Acceptance Criteria (overall)
- [ ] All three TASK-level acceptance criteria met.
- [ ] CI passes with no regression in `sync.server.test.ts`, `recovery.server.test.ts`, `inbox-actions.route.test.ts`.
- [ ] `send_duplicate_blocked`, `needs_manual_draft_alert`, and `followUpRequired` events appear in `thread_events` for their respective trigger conditions.
- [ ] "Needs follow-up" badge visible in draft review UI for `needs_follow_up` drafts; absent for `ready` drafts and legacy drafts.
- [ ] No D1 schema migrations required or applied.

## Decision Log
- 2026-03-12: TASK-01 and TASK-02 sequenced (TASK-01 first) to avoid false `needs_manual_draft_alert` events during deployment window where in-flight sends may be mid-sequence. TASK-03 independent — runs in parallel with TASK-01.
- 2026-03-12: `deliveryStatus` stored in `quality_json` blob rather than a new D1 column. Trade-off: no migration required; field has no index; agreed acceptable at current volume.
- 2026-03-12: Problem 1 UI badge (TASK-02) — no new UI component required. `countThreadsNeedingManualDraft()` already renders badge from `needs_manual_draft` column. Backend-only change.
- 2026-03-12: [Adjacent: delivery-rehearsal] Recovery cron limit (20 threads) not changed in this plan; noted as follow-up scope to make env-configurable.
- 2026-03-12: [Adjacent: delivery-rehearsal] Push notification for stuck threads not in scope; badge-only chosen as default. Additive scope if operator requests.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Pre-send idempotency check in `send/route.ts` | Yes — `send/route.ts` exists; `gmail_draft_id` column on `InboxDraftRow` confirmed; `updateDraft()` already accepts `gmailDraftId`; `recordInboxEvent` imported | None | No |
| TASK-02: Alert event in `flagForManualDraft()` | Yes — TASK-01 deployed; `flagForManualDraft()` exists at `recovery.server.ts:330`; `recordInboxEvent` imported | None | No |
| TASK-03: `deliveryStatus` into `quality_json` + badge | Yes — `draftResult.status` available in both sync and recovery draft creation paths; `quality_json` is existing free-form blob; `serializeDraft` already passes blob through; UI draft review card exists | Badge requires confirming exact UI component file path — deferred to build phase | No (non-blocking) |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 88% × 1 = 88
- TASK-02: 87% × 1 = 87
- TASK-03: 84% × 2 = 168
- Sum(confidence × weight) = 88 + 87 + 168 = 343
- Sum(weights) = 1 + 1 + 2 = 4
- Overall = 343 / 4 = **85.75% → rounded to 86%**
