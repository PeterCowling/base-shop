---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-thread-filters
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-thread-filters/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9201
---

# Reception Inbox Thread Filters Fact-Find Brief

## Scope

### Summary

The reception inbox thread list currently renders all active threads in a single flat list sorted by latest message time. Staff must visually scan every thread to find ones needing attention. This change adds client-side filter controls for status, needs-manual-draft, and sync freshness so staff can quickly isolate threads requiring action.

### Goals

- Add a filter bar to the ThreadList component header area
- Support filtering by thread status (pending, review_later, drafted, sent)
- Support filtering by needsManualDraft (boolean flag)
- Support filtering by sync freshness (stale threads where lastSyncedAt is older than a threshold)
- Preserve existing sort order (latest message time descending)
- Show active filter count so staff know filters are applied

### Non-goals

- Server-side filtering (the API already supports status filtering; client-side filtering of the already-fetched list is sufficient for the current thread volume of ~50 max)
- Full-text search within threads
- Persistent filter state across sessions
- Changes to the ThreadDetailPane or DraftReviewPanel

### Constraints & Assumptions

- Constraints:
  - Must work within the existing `useInbox` hook data flow — threads are fetched once on mount and after sync
  - All filter fields are already present in the `InboxThreadSummary` type returned by the API
  - Must work on both desktop and mobile layouts (the existing responsive pattern hides thread list on mobile when viewing detail)
- Assumptions:
  - Thread list size stays manageable for client-side filtering (currently capped at 50 by the API, typical active count is much lower)
  - `lastSyncedAt` staleness threshold of 24 hours is a reasonable default for identifying threads that may have new unsynced messages

## Outcome Contract

- **Why:** Staff must scan the entire inbox thread list to find threads needing action. With growing thread volume, this wastes time and leads to missed urgent threads (especially those flagged as needing manual drafts).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inbox thread list supports filtering by status, needs-manual-draft, and sync freshness so staff can prioritize efficiently.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inbox/InboxWorkspace.tsx` — top-level inbox page component, orchestrates ThreadList + ThreadDetailPane
- `apps/reception/src/components/inbox/ThreadList.tsx` — renders the thread list, receives `threads: InboxThreadSummary[]` as props
- `apps/reception/src/services/useInbox.ts` — client-side hook that fetches threads via `/api/mcp/inbox` and manages all inbox state

### Key Modules / Files

- `apps/reception/src/components/inbox/ThreadList.tsx` — **primary change target**; currently a pure display component with no filtering. Receives `threads`, `selectedThreadId`, `loading`, `error`, `onSelect` props.
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` — passes threads to ThreadList; already computes `countThreadsNeedingManualDraft()` and `countThreadsReadyToSend()` for the header badge counts; filter state can live here or in ThreadList.
- `apps/reception/src/components/inbox/presentation.ts` — contains `buildInboxThreadBadge()` which maps thread state to badge labels/colors. The badge logic already handles: Manual (needsManualDraft), Edited, Draft ready, Sent, Review, Pending.
- `apps/reception/src/services/useInbox.ts` — defines `InboxThreadSummary` type with all required filter fields: `status`, `needsManualDraft`, `latestMessageAt`, `lastSyncedAt`, `updatedAt`, `currentDraft`.
- `apps/reception/src/app/api/mcp/inbox/route.ts` — API endpoint; already supports `?status=` query parameter for server-side filtering, plus `limit` and `offset`. Currently the client does not use this parameter.
- `apps/reception/src/lib/inbox/repositories.server.ts` — D1 repository layer; `listThreadsWithLatestDraft()` supports `ListThreadsOptions { status?, limit?, offset? }`.
- `apps/reception/src/lib/inbox/api-models.server.ts` — `buildThreadSummaryFromRow()` serializes DB rows to API response; `isThreadVisibleInInbox()` filters out `auto_archived` and `resolved` threads.

### Patterns & Conventions Observed

- **Component pattern**: inbox components are colocated in `apps/reception/src/components/inbox/` with a `presentation.ts` module for pure display logic (badge builders, formatters).
- **Design system usage**: components use `@acme/design-system/atoms` (Button) and `@acme/design-system/primitives` (Cluster). Filter chips/toggles should follow the same pattern.
- **State management**: `useInbox` hook manages all state; ThreadList is a stateless display component. Filter state should be kept in InboxWorkspace (or ThreadList itself) as local React state.
- **Tailwind styling**: components use design tokens (`text-muted-foreground`, `bg-surface-2`, etc.) and the established rounded-2xl card pattern.
- **Mobile-responsive**: InboxWorkspace uses `mobileShowDetail` state with `hidden xl:block` classes. Filter bar must be visible in the thread list column on both desktop and mobile.

### Data & Contracts

- Types/schemas/events:
  - `InboxThreadSummary` (useInbox.ts:26-41): `{ id, status, subject, snippet, latestMessageAt, lastSyncedAt, updatedAt, needsManualDraft, latestAdmissionDecision, latestAdmissionReason, currentDraft, guestBookingRef, guestFirstName, guestLastName }`
  - `status` field values: `"pending" | "review_later" | "auto_archived" | "drafted" | "approved" | "sent" | "resolved"` (repositories.server.ts:7-15)
  - `needsManualDraft`: boolean, derived from `metadata_json.needsManualDraft`
  - `lastSyncedAt`: ISO timestamp or null
  - `currentDraft.status`: `"generated" | "edited" | "approved" | "sent"`
- Persistence: D1 (Cloudflare) via `repositories.server.ts`
- API/contracts: `GET /api/mcp/inbox` returns `{ success: true, data: InboxThreadSummary[] }`

### Dependency & Impact Map

- Upstream dependencies:
  - `useInbox` hook provides the thread list — no changes needed there
  - `@acme/design-system` atoms for UI controls
- Downstream dependents:
  - ThreadList is only consumed by InboxWorkspace — contained blast radius
  - No other components depend on ThreadList
- Likely blast radius:
  - Limited to `ThreadList.tsx` and `InboxWorkspace.tsx`; possibly a new filter utility in `presentation.ts`

### Delivery & Channel Landscape

Not investigated: pure code-change, no external delivery channel.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (brikette app pattern), Playwright for e2e
- Commands: `pnpm -w run test:governed` (CI only per testing policy)
- CI integration: tests run in CI only, not locally

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox API route | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` | Tests GET endpoint with status param |
| Inbox draft route | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox-draft.route.test.ts` | Draft CRUD |
| Inbox actions | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Send/resolve/dismiss |
| Inbox sync | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox-sync.route.test.ts` | Sync flow |
| Inbox recovery | Unit | `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts` | Recovery logic |
| Inbox sync logic | Unit | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Sync state machine |

#### Coverage Gaps

- No component-level tests for ThreadList, InboxWorkspace, ThreadDetailPane, or DraftReviewPanel
- No tests for `presentation.ts` helper functions

#### Testability Assessment

- Easy to test:
  - Filter logic (pure functions on `InboxThreadSummary[]`) — easily unit-testable
  - `presentation.ts` already houses pure functions; filter predicates can follow the same pattern
- Hard to test:
  - Component integration (would require mocking useInbox, design system, etc.) — out of scope for this change per existing pattern of no component tests in inbox

#### Recommended Test Approach

- Unit tests for: filter predicate functions in `presentation.ts` (or a new `filters.ts` module)
- Integration tests for: not needed — filter state is local React state with no side effects
- E2E tests for: deferred — manual smoke test is sufficient for initial release
- Contract tests for: not needed — no API changes

### Recent Git History (Targeted)

Not investigated: inbox components are stable; the current structure is well-established.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** All required data fields are already present in `InboxThreadSummary`. The change is purely client-side UI: a filter bar in the ThreadList header + filter predicates applied to the existing `threads` array prop. No API changes, no data model changes, no new dependencies. The blast radius is confined to 2 components (ThreadList, InboxWorkspace) and 1 utility module (presentation.ts or new filters.ts).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ThreadList component structure | Yes | None | No |
| InboxWorkspace data flow | Yes | None | No |
| InboxThreadSummary type fields | Yes | None | No |
| API endpoint capabilities | Yes | None | No |
| Existing filter/badge logic | Yes | None | No |
| Design system components | Yes | None | No |
| Mobile responsiveness | Yes | None | No |
| Test coverage landscape | Yes | None | No |

## Questions

### Resolved

- Q: Are all required filter fields already available in the client-side data?
  - A: Yes. `InboxThreadSummary` includes `status` (string), `needsManualDraft` (boolean), `lastSyncedAt` (string | null), `latestMessageAt` (string | null), and `currentDraft` (with nested `status`).
  - Evidence: `apps/reception/src/services/useInbox.ts:26-41`

- Q: Does any filtering exist in the UI today?
  - A: No. The only filtering is in `InboxWorkspace` where `countThreadsNeedingManualDraft()` and `countThreadsReadyToSend()` compute header badge counts, but these do not filter the displayed list.
  - Evidence: `apps/reception/src/components/inbox/InboxWorkspace.tsx:15-29`

- Q: Does the API support filtering?
  - A: Yes, the API supports `?status=` query parameter. However, since the client already fetches all visible threads (max 50) and has all fields available, client-side filtering is more responsive and simpler.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/route.ts:43`

- Q: What thread statuses are visible in the inbox?
  - A: All except `auto_archived` and `resolved` (filtered by `isThreadVisibleInInbox()`). Visible statuses: `pending`, `review_later`, `drafted`, `approved`, `sent`.
  - Evidence: `apps/reception/src/lib/inbox/api-models.server.ts:255-257`

- Q: What badge types does the presentation layer already support?
  - A: Manual (needsManualDraft), Edited (draft edited), Draft ready (draft generated), Sent, Review (review_later), Pending (default).
  - Evidence: `apps/reception/src/components/inbox/presentation.ts:31-71`

- Q: What staleness threshold should be used for sync freshness?
  - A: 24 hours is a reasonable default. Threads with `lastSyncedAt` older than 24 hours (or null) can be flagged as "stale". This aligns with the hostel's daily operational cycle.
  - Evidence: Operational reasoning — hostel reception processes emails at least daily.

### Open (Operator Input Required)

None. All design decisions can be resolved from the existing codebase patterns and operational context.

## Confidence Inputs

- Implementation: 95% — all required data is available; the change is purely additive UI with no API or data model changes. To reach 100%: confirm design system has suitable chip/toggle components.
- Approach: 90% — client-side filtering is the right approach for the current scale (max 50 threads). To reach 100%: validate with real thread volumes.
- Impact: 85% — staff will be able to quickly find threads needing attention. To reach 90%+: observe actual filter usage patterns post-launch.
- Delivery-Readiness: 95% — no blockers, no external dependencies, no approvals needed.
- Testability: 85% — filter predicates are pure functions, easily unit-testable. To reach 95%: add component-level tests (out of scope for this change).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Filter bar takes too much vertical space on mobile | Low | Low | Use compact chip/toggle design; test on mobile viewport |
| Staff confusion about active filters hiding threads | Low | Medium | Show active filter count badge; "Clear filters" button always visible when filters active |
| Thread count too large for client-side filtering | Very Low | Low | API already caps at 50; if needed later, server-side filtering is already supported |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `@acme/design-system` atoms for filter controls where available
  - Follow established Tailwind token usage (no arbitrary colors)
  - Keep filter state as local React state (no global store)
  - Place pure filter logic in `presentation.ts` or a new `filters.ts` colocated module
- Rollout/rollback expectations:
  - No feature flag needed — this is an additive UI enhancement with no data changes
  - Rollback: revert the commit
- Observability expectations:
  - None required for initial release — purely local UI state

## Suggested Task Seeds (Non-binding)

1. Define filter types and predicate functions (pure logic, testable)
2. Build FilterBar component with status chips, needsManualDraft toggle, staleness toggle
3. Integrate FilterBar into ThreadList header area with filter state in InboxWorkspace
4. Add unit tests for filter predicate functions
5. Manual smoke test on desktop and mobile viewports

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Filter bar renders in ThreadList header
  - Clicking filter chips narrows the displayed thread list
  - Active filter count is shown
  - "Clear filters" resets to showing all threads
  - Filter predicates have unit tests
- Post-delivery measurement plan:
  - Staff feedback on filter usability (qualitative, informal)

## Evidence Gap Review

### Gaps Addressed

- Confirmed all filter fields exist in `InboxThreadSummary` type (status, needsManualDraft, lastSyncedAt)
- Confirmed no existing filtering UI exists
- Confirmed API already supports status filtering server-side (unused by client)
- Confirmed visible thread statuses via `isThreadVisibleInInbox()`
- Confirmed badge logic maps to the same status categories we want to filter by
- Confirmed design system atoms (Button) are available; filter chips can be built from the same primitives

### Confidence Adjustments

- No adjustments needed — all evidence confirms the approach is straightforward

### Remaining Assumptions

- Thread volume stays within client-side filtering performance bounds (currently max 50, API-capped)
- 24-hour staleness threshold is appropriate (reasonable default, can be adjusted)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-thread-filters --auto`
