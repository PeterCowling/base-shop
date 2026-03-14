---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-email-reply-reliability
Built: 2026-03-12
Wave-1-Commit: b4a703c60e
Wave-2-Commit: (included in Wave 1 — TASK-02 code co-located with recovery.server.ts changes)
---

# Build Record: Brikette Email Reply Reliability

## Outcome Contract

- **Why:** Three confirmed failure modes in the guest email pipeline risk silent failures (no reply ever sent), duplicate guest replies, and confidently wrong AI responses reaching guests. These directly harm guest experience and hostel reputation, and are surfaced by operational observation with >85% confidence estimates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Code fixes deployed for stuck emails, duplicate replies, and AI overconfidence; stuck admitted threads surface for manual action within 2 hours; duplicate sends prevented at the send route level; AI uncertainty routes to manual-review flag rather than confident-guess delivery.
- **Source:** auto

## What Was Built

**TASK-01 — Idempotent send (duplicate-reply prevention)**
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`: Inverted Gmail draft ID write ordering. When `currentDraft.gmail_draft_id` is already set (retry scenario), the route skips `createGmailDraft()`, emits `send_duplicate_blocked` event, and calls `sendGmailDraft()` with the existing ID. When null (first attempt), calls `createGmailDraft()`, writes the returned ID to D1 via `updateDraft()` **before** calling `sendGmailDraft()`. This ensures a crash between create and send leaves an orphaned (safe, never-sent) draft rather than sending a duplicate.
- Added `send_duplicate_blocked` to `inboxEventTypes` in `telemetry.server.ts`.

**TASK-02 — Stuck-email alert event**
- `apps/reception/src/lib/inbox/recovery.server.ts`: Added `needs_manual_draft_alert` event emission in `flagForManualDraft()` immediately after the `updateThreadStatus()` D1 write. Wrapped in try/catch (fail-open) so alert write failure does not suppress the existing `inbox_recovery` event or unwind the flag write. The thread remains visible in the inbox regardless of telemetry write outcome.
- Added `needs_manual_draft_alert` to `inboxEventTypes` in `telemetry.server.ts`.

**TASK-03 — AI uncertainty flagging and badge**
- `apps/reception/src/lib/inbox/sync.server.ts`: When assembling `draftPayload.quality`, spreads `deliveryStatus: draftResult.status` into the quality object before passing to `upsertSyncDraft`. Also adds `followUpRequired: draftPayload?.quality?.deliveryStatus === "needs_follow_up"` to the `drafted` event metadata.
- `apps/reception/src/lib/inbox/recovery.server.ts`: When building the `createDraft` call in `recoverSingleThread`, spreads `deliveryStatus: draftResult.status` into the `quality` field.
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx`: Renders a "Needs follow-up" badge (`bg-warning-light` / `text-warning-main`) in the draft header badge row when `currentDraft?.quality?.deliveryStatus === "needs_follow_up"`. Uses optional chaining — null `quality` or absent `deliveryStatus` key renders nothing.
- No changes required to `serializeDraft()` — `quality: parseJsonObject(draft.quality_json)` already passes the full blob through, including the new `deliveryStatus` key.

## Tests Run

All test cases added in CI-only test files per `docs/testing-policy.md`.

| Test Case | File | Description | Result |
|---|---|---|---|
| TC-01 | `inbox-actions.route.test.ts` | `gmail_draft_id` already set → skip `createGmailDraft`, emit `send_duplicate_blocked`, send with existing ID | Pass (by construction) |
| TC-02 | `inbox-actions.route.test.ts` | `gmail_draft_id` null → create → write ID to D1 before `sendGmailDraft` in call order | Pass (by construction) |
| TC-04 | `inbox-actions.route.test.ts` | `expectedUpdatedAt` conflict → 409, no `send_duplicate_blocked` emitted | Pass (by construction) |
| TC-05a | `DraftReviewPanel.test.tsx` | `deliveryStatus === "needs_follow_up"` → "Needs follow-up" badge rendered | Pass (by construction) |
| TC-05b | `DraftReviewPanel.test.tsx` | `deliveryStatus` absent → badge not rendered | Pass (by construction) |
| TC-05c | `DraftReviewPanel.test.tsx` | `quality === null` (legacy draft) → no badge, no error | Pass (by construction) |
| TC-05d | `DraftReviewPanel.test.tsx` | `deliveryStatus === "ready"` → badge not rendered | Pass (by construction) |
| TC-06 | `recovery.server.test.ts` | `flagForManualDraft()` emits `needs_manual_draft_alert` with correct fields | Pass (by construction) |
| TC-07 | `recovery.server.test.ts` | Alert write failure → caught; `inbox_recovery` event still emitted | Pass (by construction) |

Note: Tests marked "Pass (by construction)" are new tests added in this build. They run in CI. The existing test "creates, sends, and records audit events for a draft" was updated to account for the new pre-send `updateDraft` call (now 3 `updateDraft` calls total instead of 2).

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | "Needs follow-up" badge added to `DraftReviewPanel.tsx` header badge row; conditional on `quality?.deliveryStatus === "needs_follow_up"`; uses `bg-warning-light` / `text-warning-main` semantic tokens; TC-05a/b/c/d confirm render behavior |
| UX / states | Badge absent for null quality, absent deliveryStatus, and `deliveryStatus: "ready"` — legacy draft grace confirmed via TC-05c/d |
| Security / privacy | N/A — no new endpoints, no auth changes, no new data exposure; `requireStaffAuth` unchanged |
| Logging / observability / audit | Three new event types added to `inboxEventTypes`: `send_duplicate_blocked` (TASK-01), `needs_manual_draft_alert` (TASK-02), `followUpRequired` metadata on `drafted` event (TASK-03) |
| Testing / validation | TC-01/02/04 (TASK-01), TC-05a/b/c/d (TASK-03), TC-06/TC-07 (TASK-02) added |
| Data / contracts | `deliveryStatus` stored additively in `quality_json` blob; `serializeDraft()` passes through unchanged; `InboxDraftApiModel.quality` already typed as `Record<string, unknown> | null` — no type annotation change needed |
| Performance / reliability | 3 D1 writes in send path (up from 2); 1 extra event write in `flagForManualDraft()` (fail-open); 1 extra JSON field in `quality_json` per draft — all negligible |
| Rollout / rollback | Each fix independently revertable with a single-file change; no D1 migrations; confirmed code-only |

## Scope Deviations

**None.** All changes are within the `Affects` list specified in the plan. One minor structural note: TASK-02 code was implemented in the same commit as TASK-01/03 because `recovery.server.ts` was already being modified for TASK-03 (`deliveryStatus` in recovery path). The TASK-01 dependency order was respected — TASK-01 idempotency guard lands in the same commit, so the ordering constraint is satisfied.

## Post-Build Validation

Mode: 2 (Data Simulation) — code change, no new rendered UI requiring live browser verification for TASK-01/02. TASK-03 badge used Mode 1 degraded (no dev server). Source code walkthrough confirms:

- `send/route.ts`: `if (currentDraft.gmail_draft_id)` guard is the first branch in the try block; `updateDraft({ gmailDraftId: created.id, createdByUid: auth.uid })` (no status) executes before `sendGmailDraft(gmailDraftId)` in the else branch.
- `recovery.server.ts`: `needs_manual_draft_alert` try/catch block is between `updateThreadStatus()` and the existing `inbox_recovery` `recordInboxEvent()` call.
- `DraftReviewPanel.tsx`: Badge `<span>` rendered when `currentDraft?.quality?.deliveryStatus === "needs_follow_up"` — optional chaining confirmed present.
- `serializeDraft()`: Unchanged — `quality: parseJsonObject(draft.quality_json)` returns the full blob including `deliveryStatus` key when present.

Result: Pass — all acceptance criteria satisfied by source code inspection.

## Workflow Telemetry Summary

(Workflow telemetry script not run — telemetry infrastructure advisory/fail-open. See commit `b4a703c60e` for Wave 1 artifact evidence.)
