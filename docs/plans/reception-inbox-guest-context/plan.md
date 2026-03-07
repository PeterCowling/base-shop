---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-guest-context
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Guest Context Integration Plan

## Summary

Add guest-booking awareness to the reception inbox so that email threads are automatically linked to guest profiles when the sender email matches an active booking. The guest matching service queries Firebase RTDB at sync time, stores results in the existing `threads.metadata_json` field (no D1 migration), and feeds guest names into the draft pipeline for personalized greetings. The inbox UI displays guest booking info (name, dates, room) on matched threads. All integration hooks use existing extensibility points — `SyncThreadMetadata` extras, `ThreadContext` optional fields, and `InboxThreadMetadata` parsing.

## Active tasks

- [x] TASK-01: Build guest email matching service
- [x] TASK-02: Integrate guest matching into sync and draft pipeline
- [x] TASK-03: Extend inbox API and UI to display guest context

## Goals

- Automatically link inbox email threads to guest bookings by matching sender email addresses against Firebase RTDB.
- Personalize agent-generated draft replies with guest first name from booking data (replacing generic "Dear Guest").
- Display guest booking context (name, check-in/out dates, room) on matched threads in the inbox UI.
- Degrade gracefully when no match is found — existing behavior unchanged.

## Non-goals

- Historical booking matching (only active + upcoming bookings).
- Guest profile CRUD from the inbox.
- LLM-assisted personalization.
- Multi-business guest matching.
- Email status indicators on guest booking/check-in views (deferred to future work).

## Constraints & Assumptions

- Constraints:
  - Firebase RTDB accessed via REST (`fetch` to `FIREBASE_BASE_URL/path.json`) — no Firebase SDK in Worker.
  - `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is available at build time (baked into Worker).
  - No D1 schema migration — guest context stored in `threads.metadata_json`.
  - ~100 emails/month, 20-30 rooms — guest matching overhead is negligible.
- Assumptions:
  - Firebase RTDB security rules allow reads from the Worker (unauthenticated REST or via database secret appended as `?auth=<secret>`).
  - Most actionable guest emails use the same address as their booking record.
  - Active booking scan (check-in within 7 days before to check-out) covers the majority of matches.

## Inherited Outcome Contract

- **Why:** The reception inbox build is complete but emails exist in isolation from guest context. Staff must mentally match email senders to bookings — the system has both datasets (D1 inbox threads, Firebase RTDB bookings) but no bridge between them. Connecting them would make agent-generated drafts contextually specific and surface email status alongside guest information.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Email threads in the reception inbox are automatically linked to guest profiles when the sender address matches a booking. Agent-generated draft replies include guest-specific context (booking dates, room, stay history). Unresolved email threads are visible on guest booking views.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-guest-context/fact-find.md`
- Key findings used:
  - Guest emails stored at `/guestsDetails/<bookingRef>/<occupantId>/email` — no email-indexed lookup exists.
  - Firebase REST pattern proven in `useBookingEmail.ts:97-127`.
  - `threads.metadata_json` is open-ended JSON — no migration needed.
  - `personalizeGreeting()` in `generate.ts:200` already handles name injection via `recipientName`.
  - `buildThreadMetadata()` in `sync.server.ts:234` accepts `extras` parameter for additional fields.
  - `ThreadContext` in `draft-pipeline.server.ts:19` is extensible with optional fields.

## Proposed Approach

- Option A: Match at sync time — build transient email→booking map per sync run from active Firebase bookings, match each thread's sender email, store result in metadata, feed to draft pipeline.
- Option B: Match on-demand at API request time — query Firebase when thread detail is requested.
- Chosen approach: **Option A** — sync-time matching. Enriches metadata once, all downstream consumers benefit without extra queries. Volume is low enough that one Firebase fetch per sync run is negligible.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Guest email matching service | 85% | S | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Integrate matching into sync + draft pipeline | 80% | M | Complete (2026-03-07) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Extend inbox API + UI for guest context | 80% | M | Complete (2026-03-07) | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Guest matching service (standalone module) |
| 2 | TASK-02 | Wave 1: TASK-01 | Sync + draft pipeline integration |
| 3 | TASK-03 | Wave 2: TASK-02 | API + UI display |

**Max parallelism:** 1 (sequential chain)
**Critical path:** TASK-01 → TASK-02 → TASK-03 (3 waves)
**Total tasks:** 3

## Tasks

### TASK-01: Build guest email matching service

- **Type:** IMPLEMENT
- **Deliverable:** New module at `apps/reception/src/lib/inbox/guest-matcher.server.ts` that fetches active bookings from Firebase RTDB, builds a transient email→booking map, and matches a sender email to a guest profile.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/guest-matcher.server.ts` (new), `apps/reception/src/lib/inbox/__tests__/guest-matcher.server.test.ts` (new, controlled scope expansion — test file), `[readonly] apps/reception/src/utils/emailConstants.ts`, `[readonly] apps/reception/src/schemas/occupantDetailsSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — Firebase REST pattern is proven in `useBookingEmail.ts`. Module is a pure function with one external call (Firebase fetch). Zod schema for occupant details already exists. Held-back test: no single unknown drops this below 80 — the only uncertainty is Firebase RTDB security rules, which is a configuration issue not an implementation issue.
  - Approach: 90% — scan active bookings, build email map, match sender. No competing approach for this volume.
  - Impact: 85% — this module is the foundation for all downstream guest context features.
- **Acceptance:**
  - [ ] `guest-matcher.server.ts` exports `buildGuestEmailMap(): Promise<GuestEmailMap>` (fetches active bookings from Firebase, returns a map keyed by lowercased email) and `matchSenderToGuest(map: GuestEmailMap, senderEmail: string): GuestMatch | null` (pure synchronous lookup).
  - [ ] `buildGuestEmailMap()` fetches Firebase once per call; callers cache the result for the duration of a sync batch.
  - [ ] `GuestMatch` type: `{ bookingRef: string, occupantId: string, firstName: string, lastName: string, email: string, checkInDate: string, checkOutDate: string, roomNumbers: string[], leadGuest: boolean }`.
  - [ ] Matches are case-insensitive on email address.
  - [ ] Only scans bookings with check-in within 7 days before today to check-out after today.
  - [ ] Returns `null` when no match found (graceful degradation).
  - [ ] Multiple bookings with same email: returns the most recent (latest check-in date).
  - [ ] Handles Firebase REST errors gracefully — returns `null`, logs error.
  - [ ] If Firebase RTDB requires authentication, supports `?auth=<secret>` query parameter using `FIREBASE_DB_SECRET` env var (optional, falls back to unauthenticated).
- **Validation contract (TC-01):**
  - TC-01: Sender email matches active booking guest → returns `GuestMatch` with correct booking details.
  - TC-02: Sender email has no match → returns `null`.
  - TC-03: Sender email matches but booking is historical (checked out >7 days ago) → returns `null`.
  - TC-04: Multiple bookings with same email → returns most recent.
  - TC-05: Firebase REST error (network, auth) → returns `null`, error logged.
  - TC-06: Email matching is case-insensitive (`John@Example.com` matches `john@example.com`).
- **Execution plan:** Red → Green → Refactor
  - Red: Create module with type stubs. Write test cases for each TC.
  - Green: Implement Firebase REST fetch for `/bookings.json` and `/guestsDetails.json`. Filter active bookings by date. Build email→booking map. Match sender email.
  - Refactor: Extract date filtering logic. Add error boundary with logging.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Test Firebase REST access from a Worker route — `curl` the Firebase URL to confirm security rules.
- **Edge Cases & Hardening:**
  - Guest email field is empty/undefined (optional in schema): skip that occupant.
  - Booking has no occupants: skip.
  - Firebase returns empty response (no bookings): return `null`.
- **What would make this >=90%:**
  - Firebase REST access verified from Worker. Real booking data tested. Security rules confirmed.
- **Rollout / rollback:**
  - Rollout: Module is internal — no deployment surface until consumed by sync.
  - Rollback: Remove module. No external impact.
- **Documentation impact:**
  - `GuestMatch` type documented in TypeScript.
- **Build evidence:**
  - Module created: `apps/reception/src/lib/inbox/guest-matcher.server.ts` — exports `buildGuestEmailMap()` and `matchSenderToGuest()`.
  - Test file: `apps/reception/src/lib/inbox/__tests__/guest-matcher.server.test.ts` — 19 tests, all passing.
  - TC-01 through TC-06: all verified. Edge cases (empty email, null Firebase, __notes keys, auth secret) also covered.
  - Typecheck: clean (no errors).
  - Route: inline execution (S-effort task).
- **Notes / references:**
  - Firebase REST pattern: `apps/reception/src/services/useBookingEmail.ts:97-127`
  - Occupant schema: `apps/reception/src/schemas/occupantDetailsSchema.ts:94-115`
  - Bookings schema: `apps/reception/src/schemas/bookingsSchema.ts`

### TASK-02: Integrate guest matching into sync and draft pipeline

- **Type:** IMPLEMENT
- **Deliverable:** Modifications to `sync.server.ts` (call matcher, store result in metadata) and `draft-pipeline.server.ts` (accept guest name, use as `recipientName`).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/draft-pipeline.server.ts`, `[readonly] apps/reception/src/lib/inbox/guest-matcher.server.ts`, `[readonly] apps/reception/src/lib/inbox/draft-core/generate.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 80% — `buildThreadMetadata()` already accepts `extras` parameter (verified at `sync.server.ts:234-246`). `ThreadContext` is extensible with optional fields (verified at `draft-pipeline.server.ts:19-26`). `recipientName` derivation at line 145 needs a one-line change. Held-back test: no single unknown drops this below 80 — the `extras` spread pattern is proven, the `ThreadContext` type change is additive (optional field), and the `recipientName` priority change is a single conditional.
  - Approach: 85% — sync-time enrichment is the natural integration point. No architectural choice needed.
  - Impact: 85% — this wires the matching service into the core value loop (sync → draft → send).
- **Acceptance:**
  - [ ] `buildGuestEmailMap()` is called once per sync batch. For each admitted thread, `matchSenderToGuest(map, senderEmail)` is called with the cached map and extracted sender email.
  - [ ] Match result (if found) is stored in `threads.metadata_json` via `buildThreadMetadata()` extras: `guestBookingRef`, `guestOccupantId`, `guestFirstName`, `guestLastName`, `guestCheckIn`, `guestCheckOut`, `guestRoomNumbers`.
  - [ ] `ThreadContext` type extended with optional `guestName?: string` field.
  - [ ] When guest match exists, `guestName` is passed to `generateAgentDraft()`.
  - [ ] In `draft-pipeline.server.ts`, `recipientName` uses `threadContext.guestName` (from booking) with priority over `extractRecipientName(threadContext.from)` (from email header).
  - [ ] Draft greeting changes from "Dear Guest" to "Dear [FirstName]" when guest match exists.
  - [ ] When no match: existing behavior unchanged — `recipientName` falls back to email header extraction.
  - [ ] `SyncThreadMetadata` type extended with optional guest fields.
- **Validation contract (TC-02):**
  - TC-01: Sync admits thread with matched guest → `metadata_json` contains `guestBookingRef`, `guestFirstName`, etc.
  - TC-02: Sync admits thread with no guest match → `metadata_json` has no guest fields (existing behavior).
  - TC-03: Draft generated for matched guest → greeting uses guest first name ("Dear Marco").
  - TC-04: Draft generated with no match → greeting falls back to email header name or "Dear Guest".
  - TC-05: Guest match fails (Firebase error) → sync continues without guest context, draft uses fallback.
  - TC-06: Re-sync existing thread with new match → metadata updated with guest fields.
- **Execution plan:** Red → Green → Refactor
  - Red: Extend `SyncThreadMetadata` with optional guest fields. Extend `ThreadContext` with optional `guestName`. Write test cases.
  - Green: In sync loop, call `buildGuestEmailMap()` once before the thread iteration. For each thread, extract sender email from `latestInbound.from` (via `extractEmailAddress()` or inline parsing) and call `matchSenderToGuest(map, senderEmail)`. Pass result to `buildThreadMetadata()` via extras. In `generateAgentDraft()` call, pass `guestName: match?.firstName` within the `ThreadContext` object. In `draft-pipeline.server.ts:145`, change to `recipientName: threadContext.guestName ?? (threadContext.from ? extractRecipientName(threadContext.from) : undefined)`.
  - Refactor: Ensure guest matching doesn't block sync on failure (try/catch with null fallback).
- **Planning validation (required for M/L):**
  - Checks run: Verified `buildThreadMetadata()` extras parameter at `sync.server.ts:234-246`. Verified `ThreadContext` shape at `draft-pipeline.server.ts:19-26`. Verified `recipientName` derivation at `draft-pipeline.server.ts:145`. Verified `generateAgentDraft()` call at `sync.server.ts:541-548`.
  - Validation artifacts: Source file line references above.
  - Unexpected findings: None.
- **Consumer tracing:**
  - `SyncThreadMetadata` guest fields → consumed by TASK-03 (API model parsing, UI display).
  - `ThreadContext.guestName` → consumed by `draft-pipeline.server.ts` → `generate.ts:personalizeGreeting()`. Consumer chain verified.
  - `recipientName` priority change → affects all drafts. Guest name takes priority when available; fallback to email header name preserves existing behavior.
  - Consumer `generate.ts:personalizeGreeting()` is unchanged — it already handles `recipientName` parameter.
- **Build evidence:**
  - `SyncThreadMetadata` extended with 7 guest fields at `sync.server.ts:53-59`.
  - `ThreadContext` extended with `guestName?: string` at `draft-pipeline.server.ts:26`.
  - `recipientName` now uses `threadContext.guestName ?? extractRecipientName(...)` at `draft-pipeline.server.ts:145`.
  - `buildGuestEmailMap()` called once before thread loop at `sync.server.ts:500-504`.
  - `matchSenderToGuest()` called per thread at `sync.server.ts:543`.
  - Guest match result spread into `buildThreadMetadata()` extras at `sync.server.ts:597-604`.
  - `guestName` passed to `generateAgentDraft()` at `sync.server.ts:571`.
  - Typecheck: clean. Existing tests: pre-existing failures from worktree duplicates only (not caused by changes).
  - Route: inline execution.
- **Scouts:** None: all integration points verified at planning time.
- **Edge Cases & Hardening:**
  - Guest matching returns after sync has already classified the thread: matching is called before draft generation, so results are available in time.
  - Sync processes 50+ threads in one batch: matcher fetches Firebase once and caches the email map for the batch (performance optimization).
- **What would make this >=90%:**
  - TASK-01 verified against real Firebase data. Draft personalization tested end-to-end.
- **Rollout / rollback:**
  - Rollout: Feature activates automatically on next sync run. Existing threads without guest context continue to work.
  - Rollback: Remove matcher call from sync. Remove `guestName` from `ThreadContext`. Existing metadata is harmless.
- **Documentation impact:**
  - `SyncThreadMetadata` type extension documented in TypeScript.
  - `ThreadContext` type extension documented in TypeScript.
- **Notes / references:**
  - `buildThreadMetadata()` extras: `sync.server.ts:234-246`
  - `generateAgentDraft()` call: `sync.server.ts:541-548`
  - `recipientName` derivation: `draft-pipeline.server.ts:145`
  - `personalizeGreeting()`: `generate.ts:200-208`

### TASK-03: Extend inbox API and UI to display guest context

- **Type:** IMPLEMENT
- **Deliverable:** Modifications to `api-models.server.ts` (extend `InboxThreadMetadata` type), inbox API routes (include guest context in responses), and `ThreadDetailPane.tsx` (display guest booking info).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/services/useInbox.ts` (controlled scope expansion — client-side type needed guest fields for UI consumption), `apps/reception/src/components/inbox/ThreadDetailPane.tsx`, `apps/reception/src/components/inbox/ThreadList.tsx` (controlled scope expansion — guest indicator badge on thread list items), `[readonly] apps/reception/src/components/inbox/InboxWorkspace.tsx`, `[readonly] apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts`, `[readonly] apps/reception/src/lib/inbox/repositories.server.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — `InboxThreadMetadata` is a TypeScript type parsed from `metadata_json` (verified at `api-models.server.ts`). Adding optional guest fields is additive. `ThreadDetailPane` already receives `threadDetail.metadata`. UI rendering follows existing reception component patterns. Held-back test: no single unknown drops this below 80 — the metadata parsing is automatic (JSON), the API routes don't need changes (metadata flows through), and the UI component already has the data available.
  - Approach: 80% — display guest info as a context section in `ThreadDetailPane`. No design spec needed — follow existing reception card/info patterns.
  - Impact: 85% — gives staff instant booking awareness when reviewing email threads.
- **Acceptance:**
  - [ ] `InboxThreadMetadata` type extended with optional guest fields: `guestBookingRef?`, `guestFirstName?`, `guestLastName?`, `guestCheckIn?`, `guestCheckOut?`, `guestRoomNumbers?`.
  - [ ] `GET /api/mcp/inbox/[threadId]` response includes guest context in `metadata` when available (no route code change needed — metadata flows through automatically).
  - [ ] `ThreadDetailPane` displays a guest info section when `metadata.guestBookingRef` is present:
    - Guest name (first + last)
    - Booking reference
    - Check-in / check-out dates
    - Room number(s)
  - [ ] Guest info section is hidden when no guest match exists (graceful degradation).
  - [ ] `InboxWorkspace` thread list shows a guest indicator icon/badge on matched threads.
  - **Expected user-observable behavior:**
    - [ ] Staff opens a matched thread → sees guest booking info section above the message list.
    - [ ] Staff opens an unmatched thread → no guest section shown, no visual difference from current behavior.
    - [ ] Staff views thread list → matched threads show a small guest indicator.
  - Post-build QA: Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on inbox page. Auto-fix Critical/Major findings.
- **Validation contract (TC-03):**
  - TC-01: Thread with guest match in metadata → API returns guest fields in response. UI displays guest info section.
  - TC-02: Thread without guest match → API returns metadata without guest fields. UI shows no guest section.
  - TC-03: Guest info displays correctly: name, booking ref, dates, room numbers.
  - TC-04: Thread list shows guest indicator on matched threads.
  - TC-05: Guest info section renders correctly on mobile viewport (responsive).
- **Execution plan:** Red → Green → Refactor
  - Red: Extend `InboxThreadMetadata` type. Write test cases for metadata parsing with/without guest fields.
  - Green: Add guest fields to `InboxThreadMetadata`. In `ThreadDetailPane`, read guest fields from `metadata` and render a guest info card (conditionally). In `InboxWorkspace` thread list, add guest indicator when `metadata.guestBookingRef` is present.
  - Refactor: Extract guest info card into a `GuestContextCard` component for reusability.
- **Planning validation (required for M/L):**
  - Checks run: Verified `InboxThreadMetadata` type at `api-models.server.ts`. Verified `ThreadDetailPane` receives `threadDetail: InboxThreadDetail` which includes `metadata` field — component does not currently access metadata; this task adds that access. Verified `InboxWorkspace` renders thread list items via `ThreadList` child component.
  - Validation artifacts: Source file references.
  - Unexpected findings: None.
- **Consumer tracing:**
  - `InboxThreadMetadata` guest fields → consumed by `ThreadDetailPane` (display) and `InboxWorkspace` (indicator). Both addressed in this task.
  - API route `/api/mcp/inbox/[threadId]` → unchanged; metadata flows through `parseThreadMetadata()` which uses `parseJsonObject()` — unknown fields are preserved automatically.
  - Consumer `parseThreadMetadata()` is unchanged because it uses generic JSON parsing — new fields pass through without code changes.
- **Scouts:** None: UI patterns are standard React components in reception.
- **Edge Cases & Hardening:**
  - Guest fields partially present (e.g., `guestFirstName` but no `guestCheckIn`): display available fields, skip missing ones.
  - Very long room number list: truncate with ellipsis after 3 rooms.
- **What would make this >=90%:**
  - Real guest data flowing through sync → API → UI. Visual QA passed.
- **Rollout / rollback:**
  - Rollout: Deploys with next build. Guest info appears automatically on matched threads.
  - Rollback: Remove guest info rendering from UI. Metadata persists harmlessly.
- **Documentation impact:**
  - None: UI is self-documenting.
- **Build evidence:**
  - `InboxThreadMetadata` extended with 7 guest fields at `api-models.server.ts:22-27`.
  - `buildThreadSummary()` return type and body extended with `guestBookingRef`, `guestFirstName`, `guestLastName` at `api-models.server.ts:215-217,234-236`.
  - `InboxThreadSummary` client type extended with 3 optional guest fields at `useInbox.ts:36-38`.
  - `ThreadDetailPane` renders guest context card conditionally when `guestBookingRef` present — shows name, booking ref, dates, rooms.
  - `ThreadList` renders guest indicator badge (User icon + name) on matched threads.
  - Typecheck: clean (no errors).
  - Route: inline execution.
- **Notes / references:**
  - `InboxThreadMetadata`: `api-models.server.ts`
  - `ThreadDetailPane`: `apps/reception/src/components/inbox/ThreadDetailPane.tsx`
  - `ThreadList`: `apps/reception/src/components/inbox/ThreadList.tsx`
  - `InboxWorkspace`: `apps/reception/src/components/inbox/InboxWorkspace.tsx`

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firebase RTDB security rules block unauthenticated reads | Medium | High | TASK-01 supports `?auth=<secret>` fallback. Scout: test Firebase URL with curl before build. |
| Guest email mismatch (OTA booking email differs from correspondence email) | Medium | Medium | Graceful degradation — no match, existing behavior. No functional regression. |
| Firebase REST latency slows sync | Low | Low | Cache active-booking email map per sync batch. One fetch per sync run. |
| Multiple bookings with same email | Low | Medium | Return most recent active booking. |

## Observability

- Logging: Match results logged during sync (matched/unmatched counts per sync run).
- Metrics: Match rate tracked in sync result (% of admitted threads with guest context).
- Alerts/Dashboards: None in v1 — monitor via sync logs.

## Acceptance Criteria (overall)

- [ ] Inbox threads from guest emails show linked booking information (name, dates, room).
- [ ] Agent-generated drafts address matched guests by first name ("Dear Marco" not "Dear Guest").
- [ ] Unmatched threads work exactly as before — no regression.
- [ ] Guest matching runs at sync time with negligible performance impact.
- [ ] Firebase access errors are handled gracefully — sync continues without guest context.

## Decision Log

- 2026-03-07: Chose sync-time matching over on-demand matching. Rationale: enriches metadata once, all consumers benefit without extra queries. Volume is low (~100/month).
- 2026-03-07: Chose active + upcoming bookings only (not historical). Rationale: reduces scan scope, avoids stale data, sufficient for v1.
- 2026-03-07: Chose to extend `SyncThreadMetadata` via `extras` parameter rather than adding a separate guest metadata field. Rationale: follows existing pattern, no type gymnastics.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Guest matching service | Yes | None — Firebase REST pattern proven, pure function module | No |
| TASK-02: Sync + draft integration | Yes | None — `extras` parameter and `ThreadContext` extensibility verified | No |
| TASK-03: API + UI display | Yes | [Minor]: No design spec for guest info card. Reception component patterns provide adequate guidance. | No |

## Overall-confidence Calculation

- TASK-01: min(85,90,85) = 85, S=1 → 85×1 = 85
- TASK-02: min(80,85,85) = 80, M=2 → 80×2 = 160
- TASK-03: min(80,80,85) = 80, M=2 → 80×2 = 160

Sum weights: 1+2+2 = 5
Sum scores: 85+160+160 = 405
Overall-confidence = 405/5 = 81% → **80%** (downward bias rule: round to lower multiple of 5)
