---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Last-reviewed: 2026-03-07
Feature-Slug: reception-inbox-guest-context
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-guest-context/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307120000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Guest Context Integration Fact-Find Brief

## Scope

### Summary

The reception inbox (built in `reception-app-native-inbox`, complete) stores email threads in D1 and generates agent drafts, but has no awareness of guest profiles or bookings in Firebase RTDB. Staff must mentally match email senders to guests. This fact-find investigates bridging the two data stores so that: (1) email threads are automatically linked to guest bookings when the sender address matches, (2) the agent draft pipeline uses booking context to personalize replies, and (3) unresolved email threads are visible on guest views.

### Goals

- Determine how to match incoming email sender addresses to guest booking records in Firebase RTDB.
- Identify the integration points in the inbox pipeline (sync, draft generation, API, UI) where guest context should be injected.
- Assess whether the current inbox data model supports guest context without schema migration.
- Evaluate the performance and reliability implications of querying Firebase RTDB during inbox sync.

### Non-goals

- LLM-assisted draft personalization (beyond the existing deterministic pipeline).
- Automatic task/action creation from email content.
- Guest profile CRUD from the inbox UI.
- Multi-business guest matching.

### Constraints & Assumptions

- Constraints:
  - Email volume is ~100 messages/month during open season — guest matching runs at sync time, not real-time.
  - Firebase RTDB is accessed via REST (`fetch` to `FIREBASE_BASE_URL/path.json`) — no Firebase SDK needed in Worker.
  - The `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var is already available at build time for reception.
  - Guest email addresses are stored at `/guestsDetails/<bookingRef>/<occupantId>/email` — there is no email-indexed lookup. Matching requires scanning.
  - The inbox D1 schema uses `metadata_json` (open-ended JSON) on threads — no migration needed for adding guest fields.
- Assumptions:
  - Most actionable emails come from guests who have an active or recent booking (small search space).
  - Email addresses in guest records match sender addresses closely enough for direct string matching (case-insensitive).
  - The Firebase RTDB REST API is accessible from the Cloudflare Worker (same pattern as `useBookingEmail.ts`).
  - Firebase RTDB security rules allow unauthenticated REST reads for guest data paths (or a database secret can be appended as `?auth=<secret>` to the REST URL). This is unverified — if rules deny unauthenticated reads, the matcher needs a Firebase database secret stored via `wrangler secret put`.

## Outcome Contract

- **Why:** The reception inbox build is complete but emails exist in isolation from guest context. Staff must mentally match email senders to bookings — the system has both datasets (D1 inbox threads, Firebase RTDB bookings) but no bridge between them. Connecting them would make agent-generated drafts contextually specific and surface email status alongside guest information.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Email threads in the reception inbox are automatically linked to guest profiles when the sender address matches a booking. Agent-generated draft replies include guest-specific context (booking dates, room, stay history). Unresolved email threads are visible on guest booking views.
- **Source:** operator

## Access Declarations

- Firebase RTDB (REST API): read access via `NEXT_PUBLIC_FIREBASE_DATABASE_URL` — already configured in reception. No additional credentials needed (public REST endpoint with `.json` suffix).
- D1 database: read/write via `RECEPTION_INBOX_DB` binding — configured in inbox build.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts` — sync pipeline where guest matching would hook in after `getLatestInboundMessage()` and before `classifyForAdmission()`
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — draft generation entry point; `ThreadContext` input type accepts `from` field that could carry guest name
- `apps/reception/src/services/useBookingEmail.ts` — existing pattern for fetching guest emails from Firebase RTDB via REST

### Key Modules / Files

- `apps/reception/src/lib/inbox/sync.server.ts` — sync orchestrator; sender email extracted via `extractEmailAddress(latestInbound.from)`, available for matching
- `apps/reception/src/lib/inbox/repositories.server.ts` — CRUD layer; `CreateThreadInput.metadata` and `UpdateThreadStatusInput.metadata` both accept `Record<string, unknown>` — extensible without schema change
- `apps/reception/src/lib/inbox/draft-core/generate.ts` — `personalizeGreeting()` at line ~200 already replaces "Dear Guest" with `recipientName` when provided; slot resolution mechanism supports additional slots
- `apps/reception/src/lib/inbox/api-models.server.ts` — `InboxThreadMetadata` type; extensible, serialized from `threads.metadata_json`
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — thread detail UI; renders `threadDetail.metadata` which would include guest context
- `apps/reception/src/schemas/occupantDetailsSchema.ts` — `OccupantDetails` Zod schema; `email` field is `z.string().optional()`
- `apps/reception/src/hooks/data/useGuestDetails.ts` — client-side hook for reading `/guestsDetails` from Firebase RTDB
- `apps/reception/src/hooks/data/useBookingsData.ts` — client-side hook for reading `/bookings` from Firebase RTDB
- `apps/reception/src/utils/emailConstants.ts` — `FIREBASE_BASE_URL` derived from `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, used for REST access

### Patterns & Conventions Observed

- **Firebase REST access pattern**: `fetch(\`${FIREBASE_BASE_URL}/path.json\`)` — used in `useBookingEmail.ts:101` for fetching guest emails. Works server-side (no SDK, just HTTP fetch). Evidence: `apps/reception/src/services/useBookingEmail.ts:97-127`
- **No email index exists**: Guest emails are nested under `/guestsDetails/<bookingRef>/<occupantId>/email`. There is no `/guestsByEmail` lookup node. Matching requires either: (a) scanning all guest details, or (b) building a local email index.
- **Occupant → booking reverse lookup**: `/guestsByBooking/<occupantId>` maps to `reservationCode`. Evidence: `apps/reception/src/hooks/data/useGuestsByBooking.tsx`
- **Metadata extensibility**: `threads.metadata_json` is an open-ended JSON column. `SyncThreadMetadata` type in `sync.server.ts` already has ~10 optional fields; adding `guestId`, `bookingRef`, `occupantName` is straightforward.
- **Slot injection in drafts**: `generate.ts` has a `personalizeGreeting()` function that replaces "Dear Guest" with a real name. The `resolveSlotsWithParity()` function handles `{{SLOT:KEY}}` patterns with fallback. Adding `{{SLOT:BOOKING_DATES}}` or similar follows the same mechanism.

### Data & Contracts

- Types/schemas/events:
  - `OccupantDetails` (Zod): `{ email?: string, firstName?: string, lastName?: string, ... }` — `apps/reception/src/schemas/occupantDetailsSchema.ts:94-115`
  - `SyncThreadMetadata` (TypeScript): extensible object stored in `threads.metadata_json` — `apps/reception/src/lib/inbox/sync.server.ts`
  - `ThreadContext` (TypeScript): draft pipeline input — `{ from?, subject?, body?, threadContext?, prepaymentStep?, prepaymentProvider? }` — `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
  - `InboxThreadMetadata` (TypeScript): API response model parsed from `metadata_json` — `apps/reception/src/lib/inbox/api-models.server.ts`
- Persistence:
  - Firebase RTDB: `/guestsDetails/<bookingRef>/<occupantId>` — guest personal details including email
  - Firebase RTDB: `/bookings/<bookingRef>/<occupantId>` — booking dates, room numbers, lead guest flag
  - Firebase RTDB: `/guestsByBooking/<occupantId>` — reverse lookup to booking ref
  - D1: `threads.metadata_json` — extensible JSON for thread-level metadata
  - D1: `messages.sender_email` — extracted and lowercased sender email, indexed
- API/contracts:
  - `GET /api/mcp/inbox/[threadId]` returns `InboxThreadDetail` including `metadata` — guest context would flow through here
  - Firebase REST: `GET ${FIREBASE_BASE_URL}/guestsDetails/<bookingRef>.json` returns all occupant details for a booking

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase RTDB availability (REST endpoint) during inbox sync
  - `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var (already configured)
  - Inbox D1 schema (complete, no changes needed)
- Downstream dependents:
  - Draft pipeline: would receive richer `ThreadContext` with guest name/booking info
  - Inbox API routes: would return guest context in thread metadata
  - Inbox UI: would display guest booking info alongside email thread
- Likely blast radius:
  - `sync.server.ts` — add guest matching call after sender extraction
  - `draft-pipeline.server.ts` — extend `ThreadContext` type with optional guest fields
  - `generate.ts` — pass guest name as `recipientName` (existing mechanism)
  - `api-models.server.ts` — extend `InboxThreadMetadata` type
  - `ThreadDetailPane.tsx` — render guest context section
  - New file: `apps/reception/src/lib/inbox/guest-matcher.server.ts` — matching service

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (CI-only per testing policy)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: tests run in CI only; not run locally

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Admission gate | Unit | `apps/reception/src/lib/inbox/__tests__/admission.test.ts` | Classification outcomes tested |
| Telemetry | Unit | `apps/reception/src/lib/inbox/__tests__/telemetry.server.test.ts` | Event logging tested |
| Draft interpret | Unit | `apps/reception/src/lib/inbox/__tests__/interpret.test.ts` | Intent extraction tested |
| Draft generate | Unit | `apps/reception/src/lib/inbox/__tests__/draft-helpers.test.ts`, `generate.test.ts` | Slot injection and template ranking tested |
| Quality check | Unit | `apps/reception/src/lib/inbox/__tests__/quality-check.test.ts` | 6 hard checks tested |
| Draft pipeline | Integration | `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` | End-to-end pipeline with fixtures |
| Sync | Unit | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Sync flow tested |

#### Coverage Gaps

- No tests for guest matching (doesn't exist yet)
- No tests for Firebase REST access from server-side code (client hooks tested via React testing)

#### Testability Assessment

- Easy to test:
  - Guest email matching logic (pure function: email string → match result)
  - Metadata enrichment (deterministic: match result → metadata fields)
  - Draft personalization with guest name (existing slot mechanism)
- Hard to test:
  - Firebase REST calls from Worker (requires mocking or fixture data)
  - Full sync + matching flow end-to-end (multiple external dependencies)

#### Recommended Test Approach

- Unit tests for: guest email matching function (mock Firebase response), metadata enrichment
- Integration tests for: sync with guest matching (mock Firebase + Gmail)
- Contract tests for: Firebase REST response shape matches `OccupantDetails` schema

## Questions

### Resolved

- Q: Can the Worker access Firebase RTDB?
  - A: Yes — Firebase RTDB supports REST access via `fetch(\`${baseUrl}/path.json\`)`. The reception app already uses this pattern in `useBookingEmail.ts:97-127`. The `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var is available at build time.
  - Evidence: `apps/reception/src/services/useBookingEmail.ts:97-127`, `apps/reception/src/utils/emailConstants.ts:22-29`

- Q: Does the inbox schema need migration for guest context?
  - A: No — `threads.metadata_json` is an open-ended JSON column. Guest fields (`guestId`, `bookingRef`, `occupantName`, `checkInDate`, `checkOutDate`) can be stored directly. `CreateThreadInput.metadata` already accepts `Record<string, unknown>`.
  - Evidence: `apps/reception/migrations/0001_inbox_init.sql`, `apps/reception/src/lib/inbox/repositories.server.ts`

- Q: How is the draft greeting personalized today?
  - A: `generate.ts` has `personalizeGreeting()` which replaces "Dear Guest" with `recipientName`. The `recipientName` is extracted from the `from` field of the inbound message (e.g., "John Doe <john@example.com>" → "John Doe"). If a guest match provides a first name from the booking, this is a better source — the booking name is validated at check-in, while the email `from` name may be informal or absent.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/generate.ts:200-208`

- Q: Is there an email-indexed lookup in Firebase?
  - A: No. Guest emails are nested at `/guestsDetails/<bookingRef>/<occupantId>/email`. To find a guest by email, you must either scan all guest details or build a local index. Given ~100 messages/month and small guest volume, scanning active bookings is feasible.
  - Evidence: `apps/reception/src/schemas/occupantDetailsSchema.ts:99`, `apps/reception/src/hooks/data/useGuestDetails.ts`

- Q: Should guest matching happen at sync time or on-demand?
  - A: At sync time. Matching at sync enriches the thread metadata once, and all downstream consumers (drafts, API, UI) benefit without extra queries. The volume is low enough (~100/month) that adding one Firebase fetch per sync run is negligible.
  - Evidence: Low volume constraint from fact-find; sync already does Gmail API calls, one Firebase call is marginal.

- Q: Where in the sync pipeline should matching hook in?
  - A: After `getLatestInboundMessage()` extracts the sender email, before `classifyForAdmission()`. The sender email is already extracted and available. The match result feeds into both `buildThreadMetadata()` (for persistence) and `generateAgentDraft()` (for personalization).
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts` — sync flow order

- Q: How to scope the Firebase scan for matching?
  - A: Fetch only active bookings (current date within check-in/check-out range, or upcoming within 7 days). At hostel scale (~20-30 rooms), this is a small dataset. Build a transient email→booking map per sync run. Cache for the duration of a single sync batch.
  - Evidence: Booking volume is bounded by physical capacity; `/bookings` node structure groups by bookingRef

- Q: Should the inbox show guest booking details from historical bookings (past guests who email again), or only active/upcoming bookings?
  - A: Match active + upcoming bookings only (check-in within 7 days before to check-out date). Historical matching would expand the Firebase scan scope significantly, surface potentially stale data (old room numbers, old dates), and add complexity with no clear benefit for v1. A returning guest who emails before their new booking is created won't be matched — this is acceptable since staff at a 20-30 room hostel will recognise returning guests by name. Historical matching can be added later if the match rate is too low.
  - Evidence: Volume constraint (~100 emails/month, 20-30 rooms) makes active-only matching sufficient. Stale booking data would be misleading.

### Open (Operator Input Required)

(none)

## Confidence Inputs

- Implementation: 85%
  - Evidence: All integration points verified. No schema migration needed — `metadata_json` is extensible. Firebase REST access pattern proven in `useBookingEmail.ts`. Slot injection mechanism for draft personalization already exists in `generate.ts`. Guest matching logic is a pure function (email string comparison).
  - What would raise to 90%: Firebase REST access verified from a Cloudflare Worker (not just client-side). Firebase RTDB security rules confirmed to allow reads (with or without database secret).
  - What would raise to 95%: Guest matching tested against real Firebase data with edge cases (missing emails, multiple bookings same email).

- Approach: 85%
  - Evidence: Sync-time matching is the natural integration point — enriches metadata once, all consumers benefit. The inbox was built with extensibility in mind (`metadata_json`, `Record<string, unknown>` input types). No alternative approaches compete seriously — on-demand matching would add latency to every API call.
  - What would raise to 90%: Confirmation that active booking scan is fast enough (<500ms) for the sync pipeline.

- Impact: 80%
  - Evidence: Staff currently must mentally match emails to guests — automation removes this cognitive load. Personalized draft greetings ("Dear Marco" instead of "Dear Guest") improve communication quality. Guest context on the thread detail view gives staff instant booking awareness.
  - What would raise to 90%: Quantified time savings or error reduction from user testing.

- Delivery-Readiness: 85%
  - Evidence: Inbox build is complete. Firebase access pattern is proven. No new infrastructure needed. No external dependencies beyond existing Firebase RTDB.
  - What would raise to 90%: All three integration surfaces (matching, draft enrichment, UI display) prototyped.

- Testability: 80%
  - Evidence: Guest matching is a pure function — fully unit testable. Draft personalization is already tested (`generate.test.ts`). Firebase REST calls can be mocked.
  - What would raise to 90%: Fixture data from real Firebase bookings for integration tests.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Firebase REST latency adds to sync duration | Low | Low | ~100 messages/month; one Firebase fetch per sync run is marginal. Cache active-booking map for the sync batch. |
| Guest email not in booking record (optional field) | Medium | Low | Graceful degradation — thread has no guest context, draft uses fallback "Dear Guest". No functional regression. |
| Multiple bookings share same email (returning guest) | Low | Medium | Match to most recent active booking. If ambiguous, attach all matches and let staff see them. |
| Email address mismatch (guest uses different email) | Medium | Medium | Inherent limitation of email matching. No mitigation needed for v1 — staff can still manually identify the guest. |
| Firebase RTDB security rules block unauthenticated reads | Medium | High | Not yet verified. Mitigation: append `?auth=<database-secret>` to REST URL (Firebase legacy token). Store secret via `wrangler secret put FIREBASE_DB_SECRET`. Cheap test: `curl` the Firebase URL from outside the app. |
| Firebase RTDB structure changes | Low | Medium | Schema is stable and validated via Zod. Changes would break existing hooks too, not just this feature. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use Firebase REST pattern from `useBookingEmail.ts` (not Firebase SDK).
  - Store guest context in `threads.metadata_json` via `SyncThreadMetadata` extension.
  - Use existing `personalizeGreeting()` and slot injection in `generate.ts` — don't create parallel personalization mechanisms.
  - Guest matching must be a server-only module (`.server.ts`) since it accesses Firebase via env var.
- Rollout/rollback expectations:
  - Rollout: Feature activates automatically on next sync run. Existing threads without guest context continue to work (graceful degradation).
  - Rollback: Remove guest matching call from sync. Existing metadata is harmless (extra JSON fields ignored).
- Observability expectations:
  - Log match results during sync (matched/unmatched counts).
  - Include `guestMatchSource` in thread metadata for debugging.

## Suggested Task Seeds (Non-binding)

1. Build guest email matching service (`guest-matcher.server.ts`) — fetch active bookings from Firebase, build email→booking map, match sender
2. Integrate matching into sync pipeline — call matcher after sender extraction, store results in thread metadata
3. Enrich draft pipeline with guest context — pass guest name as `recipientName`, add booking context slots
4. Extend inbox UI to display guest context — show booking info in ThreadDetailPane, highlight matched guests
5. (Stretch) Surface email thread status on guest booking views — add unresolved email indicator to booking/check-in screens

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Guest matching produces correct results for test fixture data
  - Draft greetings use guest first name when match exists
  - Thread detail API returns guest context in metadata
  - UI displays guest booking info on matched threads
  - Unmatched threads degrade gracefully (no guest section shown, "Dear Guest" greeting)
- Post-delivery measurement plan:
  - Track match rate (% of admitted threads with guest context) — target >60% for active-booking emails
  - Monitor sync duration increase (should be <500ms added)

## Scope Signal

- Signal: right-sized
- Rationale: The three integration points (matching, draft enrichment, UI display) are all bounded by the existing inbox architecture. No new infrastructure is needed — Firebase REST access is proven, D1 metadata is extensible, draft slot injection exists. The stretch goal (email status on guest views) is explicitly deferred. The scope touches 5-6 files with well-defined integration points.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Firebase RTDB data model (guest details, bookings) | Yes | None — structure verified via schemas and hooks | No |
| Email matching logic (sender → guest lookup) | Yes | None — pure function, testable | No |
| Inbox sync pipeline integration point | Yes | None — clear hookpoint after `getLatestInboundMessage()`, before classification | No |
| D1 metadata extensibility | Yes | None — `metadata_json` is open-ended JSON, no migration needed | No |
| Draft pipeline personalization | Yes | None — `personalizeGreeting()` and slot injection already exist | No |
| API response model | Yes | None — `InboxThreadMetadata` is extensible, serialized from `metadata_json` | No |
| UI display of guest context | Partial | [Minor]: No design spec for how guest info appears in `ThreadDetailPane`. Existing UI patterns in reception provide adequate guidance. | No |
| Firebase REST from Worker | Partial | [Moderate]: `useBookingEmail.ts` uses Firebase REST but runs client-side. Server-side (Worker) access via the same pattern is expected to work but not yet verified in this app. Business-OS uses `getCloudflareContext()` for D1 but not Firebase REST. | No |

## Evidence Gap Review

### Gaps Addressed

- Firebase data model fully mapped: guest details at `/guestsDetails/<bookingRef>/<occupantId>`, bookings at `/bookings/<bookingRef>/<occupantId>`, reverse lookup at `/guestsByBooking/<occupantId>`.
- No email index exists — matching strategy defined (scan active bookings, build transient map).
- All inbox integration points verified: sync, draft pipeline, repositories, API models, UI components.
- No schema migration needed — `metadata_json` extensibility confirmed.

### Confidence Adjustments

- Implementation raised from initial 80% to 85% based on finding that all integration points support extensibility without breaking changes.
- Approach held at 85% — sync-time matching is clearly the right pattern given low volume.

### Remaining Assumptions

- Firebase REST access works from Cloudflare Worker (not verified in this app, but pattern is standard HTTP fetch with no SDK dependency).
- Active booking scan completes within acceptable latency (~200-500ms for 20-30 bookings).
- Email address matching (case-insensitive exact match) covers the majority of cases.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-guest-context --auto`
