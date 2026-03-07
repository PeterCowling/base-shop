---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Product
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-dismiss-feedback
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-dismiss-feedback/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307120000-0001
---

# Reception Inbox Dismiss & Admission Feedback Fact-Find Brief

## Scope
### Summary
Add a "Not relevant" dismiss action to the reception inbox so staff can mark falsely-admitted emails as irrelevant. Each dismissal records a staff override admission outcome in D1, creating a queryable feedback trail that enables future classifier improvement.

### Goals
- Staff can dismiss irrelevant threads from the active inbox with one action
- Each dismissal records a `staff_override` admission outcome (with `sourceMetadata` containing `senderEmail`, `senderDomain`, `originalAdmissionDecision`, `dismissedByUid`) and a `dismissed` event for classifier learning
- Dismissed threads are hidden from the inbox (same visibility as `auto_archived`)
- No D1 schema migration required — use existing flexible schema

### Non-goals
- Automatic classifier rule generation from override patterns (future work)
- Override analytics dashboard (future work)
- Undo/unarchive dismissed threads (can be added later)

### Constraints & Assumptions
- Constraints:
  - Must follow existing API route patterns (auth → fetch → mutate → event → response)
  - Must not require a D1 migration (using existing `auto_archived` status avoids changes to the `InboxThreadStatus` type union)
  - Tests run in CI only per project policy
- Assumptions:
  - Using `auto_archived` as the thread status (not a new status) is cleaner — avoids changes to `isThreadVisibleInInbox` and all visibility queries
  - Recording the override via `admission_outcomes` table (with `source: "staff_override"`) gives richer audit data than event-only recording
  - Best-effort telemetry is appropriate (not audit-critical like `sent` or `approved`)

## Outcome Contract

- **Why:** Admitted emails include false positives that waste staff time. Staff need a way to dismiss irrelevant threads and feed corrections back so the classifier improves over time.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can dismiss irrelevant inbox threads via a "Not relevant" button. Each dismissal records a staff_override admission outcome in D1, creating a queryable feedback trail for classifier improvement.
- **Source:** operator

## Access Declarations

None — all evidence is in the local codebase. No external services needed.

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts` — existing resolve endpoint, pattern to follow for dismiss
- `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — UI where dismiss button should be added
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — alternative location for dismiss button

### Key Modules / Files
- `apps/reception/src/lib/inbox/repositories.server.ts` — `updateThreadStatus()`, `inboxThreadStatuses` array, `recordAdmission()`
- `apps/reception/src/lib/inbox/telemetry.server.ts` — `inboxEventTypes` array, `recordInboxEvent()`, `isAuditCriticalInboxEvent()`
- `apps/reception/src/lib/inbox/api-models.server.ts` — `isThreadVisibleInInbox()` filters `auto_archived` and `resolved`
- `apps/reception/src/lib/inbox/admission.ts` — classifier rules (`classifyOrganizeDecision()`, signal scoring, outcome mapping)
- `apps/reception/src/lib/inbox/sync.server.ts` — `recordAdmission()` call site (lines 644-659), shows admission recording pattern
- `apps/reception/src/services/useInbox.ts` — client-side hook, needs `dismissThread` action
- `apps/reception/src/lib/inbox/api-route-helpers.ts` — `notFoundResponse()`, `badRequestResponse()`, `inboxApiErrorResponse()`
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` — `requireStaffAuth()` pattern

### Patterns & Conventions Observed
- **API route pattern** (resolve endpoint): `requireStaffAuth()` → `getThread()` → `updateThreadStatus()` → `recordInboxEvent()` → JSON response — evidence: `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts`
- **Thread status is TEXT** — no enum constraint in D1; can use `auto_archived` directly — evidence: `apps/reception/migrations/0001_inbox_init.sql`
- **Admission outcomes table** supports multiple entries per thread with `source` field to distinguish classifier vs manual — evidence: `apps/reception/migrations/0001_inbox_init.sql` lines 57-67
- **Event recording is best-effort** for non-critical events — evidence: `apps/reception/src/lib/inbox/telemetry.server.ts` lines 41-45
- **Auth returns `{uid, roles, email}`** on success — evidence: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`

### Data & Contracts
- Types/schemas/events:
  - `InboxThreadStatus` = `"pending" | "review_later" | "auto_archived" | "drafted" | "approved" | "sent" | "resolved"` — defined in `repositories.server.ts`
  - `InboxEventType` = `"admitted" | "auto_archived" | "review_later" | "drafted" | "draft_edited" | "approved" | "sent" | "resolved"` — defined in `telemetry.server.ts`
  - `RecordAdmissionInput` = `{threadId, decision, source, classifierVersion?, matchedRule?, sourceMetadata?}` — defined in `repositories.server.ts`
- Persistence:
  - `threads` table: TEXT status column (no migration needed for new values)
  - `admission_outcomes` table: records each classification with `source` distinguishing origin
  - `thread_events` table: audit trail with `event_type`, `actor_uid`, `metadata_json`
- API/contracts:
  - Resolve endpoint: `POST /api/mcp/inbox/[threadId]/resolve` → `{success, data: {thread}}`
  - Send endpoint: `POST /api/mcp/inbox/[threadId]/send` → `{success, data: {sentMessageId}}`
  - Client-side: `useInbox()` hook exposes action functions that POST and refresh thread list

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase Auth (`requireStaffAuth`) — no changes needed
  - D1 database — no schema changes needed
- Downstream dependents:
  - `isThreadVisibleInInbox()` already hides `auto_archived` threads — using this status means zero visibility logic changes
  - `ThreadList` component filters by `isThreadVisibleInInbox` server-side — dismissed threads will auto-hide
  - Admission override records are queryable for future classifier rule suggestions
- Likely blast radius:
  - New API route (additive)
  - New event type in telemetry (additive — best-effort, no audit-critical implications)
  - New client action in `useInbox` hook (additive)
  - New button in DraftReviewPanel (additive)
  - **Zero changes to existing visibility/query logic** if using `auto_archived` status

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (CI-only per project policy)
- Commands: `pnpm -w run test:governed`
- CI integration: tests run on push, not locally

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Resolve endpoint | Integration | `__tests__/inbox-actions.route.test.ts` | Tests auth, status update, event recording |
| Send endpoint | Integration | `__tests__/inbox-actions.route.test.ts` | Tests draft validation, sending, event recording |
| Draft operations | Integration | `__tests__/inbox-draft.route.test.ts` | Tests save, regenerate |
| Inbox list | Integration | `__tests__/inbox.route.test.ts` | Tests listing, filtering |
| Inbox sync | Integration | `__tests__/inbox-sync.route.test.ts` | Tests sync flow |

#### Coverage Gaps
- No test for dismiss endpoint (does not exist yet)
- No test for admission override recording

#### Testability Assessment
- Easy to test:
  - Dismiss endpoint follows exact same pattern as resolve — test can be modeled directly on the resolve test
  - `recordAdmission()` is already tested via sync tests
- Hard to test:
  - UI button behavior (would need component tests or E2E)
- Test seams needed:
  - None — existing D1 mock infrastructure in tests is sufficient

#### Recommended Test Approach
- Integration test: dismiss endpoint in `inbox-actions.route.test.ts` following the resolve test pattern
- Verify: thread status set to `auto_archived`, event recorded with type `dismissed`, admission outcome recorded with `source: "staff_override"`

### Recent Git History (Targeted)
- `836fa1a446` — `feat(reception): integrate guest booking context into inbox` — most recent inbox change, added guest matching
- `08ff2e8d83` — `Add reception inbox workflow and Brikette route localization` — initial inbox build
- `be57faf029` — `security(reception): harden CSP and security headers` — CSP hardening (current session)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| D1 schema (threads, admission_outcomes, thread_events) | Yes | None | No |
| Repository layer (updateThreadStatus, recordAdmission, createEvent) | Yes | None | No |
| API route pattern (resolve endpoint as template) | Yes | None | No |
| Telemetry (event types, audit-critical classification) | Yes | None | No |
| Visibility logic (isThreadVisibleInInbox) | Yes | None — auto_archived already hidden | No |
| Client hook (useInbox) | Yes | None — additive action | No |
| UI components (DraftReviewPanel) | Yes | None — additive button | No |
| Test infrastructure | Yes | None — follows existing test patterns | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The feature is well-bounded: one new API endpoint, one new event type, one new UI button, one new client action. All patterns are established and the schema is flexible enough to avoid migrations. No external dependencies.

## Questions
### Resolved
- Q: Should we use a new thread status (`dismissed`) or the existing `auto_archived`?
  - A: Use `auto_archived`. It already means "not needing a reply" and is already hidden by `isThreadVisibleInInbox()`. A different `source` field (`staff_override` vs `reception_sync`) in `admission_outcomes` distinguishes manual from automated archiving. Adding a new status would require changes to visibility logic, queries, and the status type — unnecessary complexity.
  - Evidence: `api-models.server.ts` line 241, `repositories.server.ts` lines 7-15

- Q: Should dismiss be audit-critical or best-effort?
  - A: Best-effort. Dismiss has no financial or commitment implications (unlike `sent` or `approved`). The `isAuditCriticalInboxEvent` set should not include `dismissed`.
  - Evidence: `telemetry.server.ts` lines 41-45

- Q: Where should the dismiss button go in the UI?
  - A: In the DraftReviewPanel action bar alongside Save/Regenerate/Send/Resolve. It's a thread-level action that belongs with the other thread actions. Label: "Not relevant".
  - Evidence: `DraftReviewPanel.tsx` lines 250-298

- Q: Should we record an admission outcome or just an event?
  - A: Both. The event provides audit trail. The admission outcome (with `source: "staff_override"`, `decision: "auto-archive"`, `matchedRule: "staff-not-relevant"`) enables querying override patterns for future classifier improvements — e.g., "which sender domains are staff consistently dismissing?"
  - Evidence: `sync.server.ts` lines 644-659 (admission recording pattern)

### Open (Operator Input Required)
None — all questions resolved from available evidence.

## Confidence Inputs
- Implementation: 95% — follows established resolve endpoint pattern exactly; no schema changes; additive code only
- Approach: 90% — using `auto_archived` status with `source: "staff_override"` is the cleanest approach; avoids visibility logic changes
- Impact: 85% — directly addresses staff pain (false positive admitted emails); feedback trail enables future classifier improvement
- Delivery-Readiness: 95% — all infrastructure exists; test patterns established; no blockers
- Testability: 90% — resolve test is a direct template; D1 mock infrastructure is in place

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Staff over-dismiss legitimate emails | Low | Medium | Dismissed threads can be re-admitted on next sync if the sender emails again; future: add undo button |
| Admission override data not used | Medium | Low | Data accumulates passively; a future report/script can mine patterns — no cost to collecting now |

## Planning Constraints & Notes
- Must-follow patterns:
  - Follow resolve endpoint pattern exactly (auth → fetch → mutate → event → response)
  - Add `dismissed` to `inboxEventTypes` array (new event type for telemetry)
  - Do NOT add `dismissed` to `inboxThreadStatuses` — use existing `auto_archived` status to avoid visibility logic changes
- Rollout/rollback expectations:
  - Additive feature — no rollback needed; removing the button is sufficient
- Observability expectations:
  - Admission outcomes with `source: "staff_override"` are queryable via D1

## Suggested Task Seeds (Non-binding)
1. Add `dismissed` event type to `inboxEventTypes` in telemetry
2. Create `POST /api/mcp/inbox/[threadId]/dismiss` endpoint
3. Add `dismissThread` action to `useInbox` hook
4. Add "Not relevant" button to DraftReviewPanel UI
5. Add integration test for dismiss endpoint
6. Record admission override in `admission_outcomes` table with `sourceMetadata: {senderEmail, senderDomain, originalAdmissionDecision, dismissedByUid}`

## Execution Routing Packet
- Primary execution skill:
  - lp-do-build
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Dismiss endpoint returns `{success: true}` and sets thread status to `auto_archived`
  - Admission outcome recorded with `source: "staff_override"`, `decision: "auto-archive"`, `sourceMetadata` populated with `senderEmail`, `senderDomain`, `originalAdmissionDecision`, `dismissedByUid`
  - Event recorded with type `dismissed`
  - Thread disappears from inbox list after dismiss
  - Integration test passes in CI
- Post-delivery measurement plan:
  - Query `admission_outcomes WHERE source = 'staff_override'` to track dismiss frequency

## Evidence Gap Review
### Gaps Addressed
- Verified D1 schema flexibility (TEXT status column, no migration needed)
- Verified `isThreadVisibleInInbox` already hides `auto_archived` (no visibility changes needed)
- Verified resolve endpoint pattern is directly reusable
- Verified admission_outcomes table supports multi-entry per thread with different sources
- Verified test infrastructure has D1 mocks and follows the resolve test pattern

### Confidence Adjustments
- None — all initial confidence scores confirmed by evidence

### Remaining Assumptions
- Staff will use the dismiss action for genuinely irrelevant emails (not to skip work)
- Accumulated override data will be useful for classifier improvements (low-risk assumption — data collection is free)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-inbox-guest-context --auto`
