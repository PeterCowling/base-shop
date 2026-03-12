---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: bos-process-improvements-page-split
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Critique-Score: 4.3
Critique-Rounds: 1
Trigger-Why: The #new-ideas and #in-progress sections need to be separate pages so each can be focused, navigated to directly, and not compete for vertical space.
Trigger-Intended-Outcome: type: operational | statement: #new-ideas and #in-progress each live at their own URL (/process-improvements/new-ideas and /process-improvements/in-progress); navigation links point to each page; the root /process-improvements route redirects or shows a landing | source: operator
---

# Business OS: Process Improvements Page Split Fact-Find

## Scope

### Summary
The `/process-improvements` page currently renders all sections on a single page: In Progress, New Ideas, Deferred, and Recently Actioned. The operator wants `#in-progress` and `#new-ideas` split into separate pages — each with its own URL, independent data load, and focused chrome. The monolithic `ProcessImprovementsInbox` client component (~1,750 lines) holds all state and all section renders in one unit; it must be decomposed.

### Goals
- `/process-improvements/in-progress` — dedicated page for active plan monitoring
- `/process-improvements/new-ideas` — dedicated page for queue triage (WorkItems + Deferred + Recently Actioned)
- Navigation links in `NavigationHeader` (or a sub-nav) point to the new routes
- Root `/process-improvements` becomes a redirect or a minimal landing page

### Non-goals
- Changing the API routes or data model
- Adding new sections or features during the split
- Changing the Deferred or Recently Actioned sections (they stay with New Ideas or can follow later)
- Redesigning the visual style of either page

### Constraints & Assumptions
- Constraints:
  - No new API routes required — existing `/api/process-improvements/items` and decision routes are sufficient
  - No i18n — English-only internal tool (confirmed in memory)
  - `ProcessImprovementsInbox.test.tsx` tests must continue to pass after the split
- Assumptions:
  - Deferred and Recently Actioned sections stay with the New Ideas page (they are downstream of triage)
  - The `ProcessImprovementsSummary` pill row either becomes page-scoped or is dropped per page
  - Auto-refresh can stay on both pages independently (30s poll, same endpoint)
  - `BulkActionBar` stays on the New Ideas page (bulk select only applies to queue items)

## Outcome Contract

- **Why:** The #new-ideas and #in-progress sections need to be separate pages so each can be focused, navigated to directly, and not compete for vertical space.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** #new-ideas and #in-progress each live at their own URL; navigation links point to each; root /process-improvements redirects or shows a landing.
- **Source:** operator

## Current Process Map

- Trigger: Operator visits `/process-improvements` or clicks the nav link
- End condition: Operator sees both In Progress section and New Ideas section on the same scrollable page

### Process Areas
| Area | Current step-by-step flow | Owners / systems | Evidence refs | Known issues |
|---|---|---|---|---|
| Page load | Server component fetches 3 data sources → passes all as `initialXxx` props to `ProcessImprovementsInbox` | `page.tsx:9-88`, `projection.ts`, `active-plans.ts` | `page.tsx` | No sub-routes |
| In Progress rendering | `ProcessImprovementsInbox` computes `filteredActivePlans` → renders `<InProgressSection id="in-progress">` | `ProcessImprovementsInbox.tsx:910` | — | Renders `null` when no plans — no empty state |
| New Ideas rendering | Computes `newIdeasItems` (items not in `inProgressDispatchIds`) → renders `<InboxSection id="new-ideas">` | `ProcessImprovementsInbox.tsx:796` | — | — |
| Anchor navigation | Hero header stat tiles are `<a href="#in-progress">` and `<a href="#new-ideas">` — fragment-only, same page | `page.tsx:49,56` | — | Will break when sections are on separate pages |
| Global nav | `NavigationHeader.tsx:41` links to `/process-improvements` only | `NavigationHeader.tsx` | — | No sub-nav today |
| Auto-refresh | `useAutoRefresh` polls `/api/process-improvements/items` every 30s, blocked while `pendingState != null` | `ProcessImprovementsInbox.tsx:627` | — | Returns all 4 data types regardless of which section is displayed |

## Evidence Audit (Current State)

### Entry Points
- `apps/business-os/src/app/process-improvements/page.tsx` — server component, data fetching entry point
- `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` — monolithic client component (~1,750 lines)
- `apps/business-os/src/app/api/process-improvements/items/route.ts` — auto-refresh endpoint
- `apps/business-os/src/components/layout/NavigationHeader.tsx:41` — nav link definition

### Key Modules / Files
- `apps/business-os/src/lib/process-improvements/projection.ts` — `loadProcessImprovementsProjection()` — queue items + recent actions
- `apps/business-os/src/lib/process-improvements/active-plans.ts` — `loadActivePlans()` + `collectInProgressDispatchIds()`
- `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` — all client state + both section renders
- `apps/business-os/src/app/process-improvements/page.tsx` — server component shell
- `apps/business-os/src/app/layout.tsx` — global layout (`ToastProvider`, `KeyboardShortcutProvider`, `CaptureFAB`)

### Patterns & Conventions Observed
- Server components fetch data and pass as `initialXxx` props to client components — evidence: `page.tsx:9-88`
- Client components own all mutable state; no React context for cross-component state — evidence: `ProcessImprovementsInbox.tsx`
- `"use client"` components co-located in `src/components/` — evidence: `ProcessImprovementsInbox.tsx`
- No `layout.tsx` inside `process-improvements/` — page manages its own chrome
- i18n-exempt: hardcoded English strings throughout

### Data & Contracts

Types/schemas/events:
- `ProcessImprovementsItem` (queue items) — defined in `projection.ts`
- `ActivePlanProgress` — defined in `active-plans.ts`
- Auto-refresh payload shape: `{ items, recentActions, activePlans, inProgressDispatchIds }` — returned by `/api/process-improvements/items`

Persistence:
- Queue items read from JSONL file via `loadProcessImprovementsProjection()`
- Active plans read from `docs/plans/` filesystem scan via `loadActivePlans()`

API/contracts:
- `GET /api/process-improvements/items` — returns all 4 data fields; no query params for section filtering
- `POST /api/process-improvements/decision/[decision]` — queue item decisions (do/defer/decline)
- `POST /api/process-improvements/operator-actions/[decision]` — operator action decisions (done/snooze)

### Dependency & Impact Map

Upstream dependencies:
- `projection.ts` — reads JSONL file; no change needed
- `active-plans.ts` — scans `docs/plans/`; no change needed

Downstream dependents:
- `NavigationHeader.tsx` — links to `/process-improvements`; needs updating
- `page.tsx` hero anchor links — become broken after split; must become `<Link>` to new routes
- `ProcessImprovementsInbox.test.tsx` — tests the monolithic component directly; tests will need to follow the component split

Likely blast radius:
- `ProcessImprovementsInbox.tsx` — large decomposition; highest-effort file
- `page.tsx` — needs to split into two server components + optional landing/redirect
- `NavigationHeader.tsx` — add sub-nav entries or update single link
- Test file — must stay in sync with component decomposition

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- CI integration: governed test runner (`pnpm -w run test:governed`)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `ProcessImprovementsInbox` client component | Unit (Jest + RTL) | `ProcessImprovementsInbox.test.tsx` | TCs cover queue triage, defer, do, operator action snooze/done, error handling, business filter |
| `projection.ts` | Unit | `projection.test.ts` | Data layer — unaffected by split |
| `active-plans.ts` | Unit | `active-plans.test.ts` | Data layer — unaffected by split |
| Decision API routes | Unit | `decision/[decision]/route.test.ts`, `operator-actions/[decision]/route.test.ts` | API layer — unaffected by split |

#### Coverage Gaps
- No tests for `page.tsx` (server component) — gaps will persist after split unless new server-component tests are added
- Auto-refresh hook not directly unit-tested (implicitly covered by component tests via mocked `fetch`)

#### Recommended Test Approach
- Unit tests for: each decomposed client component (InProgressPage client, NewIdeasPage client); follow existing RTL patterns
- Integration tests for: auto-refresh on each page independently
- No E2E required (internal operator tool, single user)

### Recent Git History (Targeted)
- `apps/business-os/src/components/process-improvements/` — bulk actions, custom defer periods, advanced filtering added in `0d70286d86`

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Single page with two major sections separated by scroll; anchor links in hero | Hero anchor links break after split; sub-nav or updated links needed | Yes — nav update required |
| UX / states | Required | Shared filter state, shared pendingState, shared bulkSelection across both sections | Split breaks shared filter UX; each page needs independent filter state | Yes — state scope changes |
| Security / privacy | N/A | Admin-only page, auth check on API routes | No change — routes unchanged | No |
| Logging / observability / audit | N/A | No analytics on this page | No change | No |
| Testing / validation | Required | `ProcessImprovementsInbox.test.tsx` covers full component | Tests must follow component decomposition | Yes |
| Data / contracts | Required | Auto-refresh endpoint returns all data in one payload | Each sub-page will fetch only relevant subset; endpoint usable as-is (pages ignore unused fields) | Yes — confirm no wasted over-fetch |
| Performance / reliability | N/A | Single internal operator user; no perf budget | No concern | No |
| Rollout / rollback | Required | PR-based; internal tool | Rollback: revert PR; forward: redirect root route or keep as landing | Yes |

## Questions

### Resolved
- Q: Should Deferred and Recently Actioned sections stay with New Ideas or get their own pages?
  - A: Stay with New Ideas. They are downstream of queue triage; separating them adds no UX value and increases complexity.
  - Evidence: Both sections render in `ProcessImprovementsInbox` after `#new-ideas`; operator intent is to split In Progress vs queue triage.

- Q: Should the root `/process-improvements` become a redirect or a landing page?
  - A: Redirect to `/process-improvements/new-ideas` (the triage queue is the primary operator destination). A landing page adds no value for a single-user internal tool.
  - Evidence: Nav link is the only entry point; a redirect is simpler and keeps existing bookmarks working.

- Q: Can the auto-refresh endpoint (`/api/process-improvements/items`) be reused as-is for both sub-pages?
  - A: Yes. The endpoint returns all 4 fields; each page uses only the relevant subset. No endpoint change needed.
  - Evidence: `route.ts` returns `{ items, recentActions, activePlans, inProgressDispatchIds }` — New Ideas page uses items/recentActions/inProgressDispatchIds; In Progress page uses activePlans.

- Q: Does `ProcessImprovementsSummary` (the pill row with counts for both sections) make sense on a per-page view?
  - A: Each page should show only its own counts. The summary component can be parameterized or replaced with a simpler heading. No need to show In Progress count on the New Ideas page.
  - Evidence: `ProcessImprovementsSummary` at line 1166 receives all counts; on a focused page only the local count is relevant.

### Open (Operator Input Required)
- Q: Should the In Progress page retain the business filter dropdown, or is it not needed when the page is dedicated to that section only?
  - Why operator input is required: this is a UX preference; the filter is technically trivial to include or exclude.
  - Decision impacted: whether to include `selectedBusiness` filter state on the In Progress page component
  - Decision owner: operator
  - Default assumption: include it (mirror current behaviour); operator can remove later.

## Confidence Inputs
- Implementation: 88% — component decomposition is mechanical; all state boundaries are clear; the monolithic file is large but well-understood
- Approach: 90% — split into two sub-routes with shared data layer is the standard Next.js App Router pattern; no unknowns
- Impact: 95% — purely internal UX change; no external consumers; rollback is a revert
- Delivery-Readiness: 90%
- Testability: 85% — existing test patterns are directly portable to decomposed components

What would raise implementation to ≥90%: confirming `ProcessImprovementsInbox` private sub-components (`InProgressSection`, `InboxSection`, `WorkItemCard`, etc.) can be extracted to separate files without breaking the existing test suite.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Optimistic state update on triage decision briefly shows stale data on In Progress page | Low | Low | Pages are independent; no shared state needed; 30s refresh catches any drift |
| Missing sub-nav means users must navigate via URL directly | Medium | Low | Add sub-nav links in `NavigationHeader` or as a tab strip on each page |
| `ProcessImprovementsInbox.test.tsx` tests fail after decomposition | Medium | Medium | Decomposed components follow same prop/interface contracts; tests are portable |

## Planning Constraints & Notes
- Must-follow patterns:
  - Server component fetches data and passes `initialXxx` props to client component — keep this pattern per existing convention
  - Client components in `src/components/`, page shells in `src/app/`
  - No new API routes; reuse existing `/api/process-improvements/items` for auto-refresh
  - `"use client"` directive on any component using hooks
- Rollout/rollback expectations:
  - PR-based; internal tool; no staged rollout needed
  - Rollback: revert PR; root `/process-improvements` continues to work as before
- Observability expectations:
  - None: internal single-user tool

## Suggested Task Seeds (Non-binding)
- TASK-01: Extract `InProgressSection` + `ActivePlanCard` family into a standalone `InProgressInbox` client component; add `page.tsx` at `/process-improvements/in-progress`
- TASK-02: Extract `InboxSection` + `WorkItemCard` + `BulkActionBar` + `RecentlyActionedSection` + `ProcessImprovementsSummary` into a `NewIdeasInbox` client component; add `page.tsx` at `/process-improvements/new-ideas`
- TASK-03: Add redirect from `/process-improvements` → `/process-improvements/new-ideas`; update nav link in `NavigationHeader`; update hero stat tile anchor links to `<Link>` pointing to new routes

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: both new routes accessible; root redirects; nav links work; no TS errors; existing tests pass
- Post-delivery measurement plan: none (internal tool)

## Evidence Gap Review

### Gaps Addressed
- Component hierarchy traced end-to-end through the monolithic component
- All shared state dependencies between the two sections identified
- Auto-refresh endpoint payload shape confirmed — no API change needed
- Test file coverage confirmed — tests target `ProcessImprovementsInbox` directly and are portable

### Confidence Adjustments
- Implementation raised from initial 85% to 88%: state boundaries are well-understood; no hidden coupling found

### Remaining Assumptions
- Deferred and Recently Actioned sections stay with New Ideas (not yet confirmed by operator, but default is reasonable)
- Business filter included on In Progress page (pending operator preference)

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Routing / sub-routes | Yes | None — no sub-routes today; new `page.tsx` files needed | No |
| Monolithic component decomposition | Yes | None — all private sub-components identified and role-mapped | No |
| Shared state coupling | Yes | None — 5 shared state items documented; all break cleanly at page boundary | No |
| Data fetching per sub-page | Yes | None — server fns can be called independently; auto-refresh endpoint reusable | No |
| Navigation update | Yes | None — `NavigationHeader.tsx:41` is the sole nav entry; anchor links in hero also need update | No |
| Test portability | Yes | Advisory: `ProcessImprovementsInbox.test.tsx` renders the full monolith; will need to follow decomposed components | No |

## Scope Signal
- Signal: right-sized
- Rationale: The decomposition is straightforward — the two sections are already logically separated inside the monolith; the data layer requires no changes; the test suite is directly portable. No over-scoping risk. Three task seeds cover the complete split.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis bos-process-improvements-page-split`
