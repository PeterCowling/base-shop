---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-process-improvements-page-split
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Critique-Score: 4.3
Critique-Rounds: 2
Related-Analysis: docs/plans/bos-process-improvements-page-split/analysis.md
---

# Business OS: Process Improvements Page Split Plan

## Summary

Split the single `/process-improvements` page into two focused sub-routes: `/process-improvements/in-progress` for active plan monitoring and `/process-improvements/new-ideas` for queue triage. The approach is full extraction: the monolithic `ProcessImprovementsInbox` client component (~1,750 lines) is decomposed into two independent client components (`InProgressInbox` and `NewIdeasInbox`), each with their own `page.tsx` server component and test file. A shared `layout.tsx` adds a sub-nav tab strip. The root route becomes a redirect. No API changes are required.

## Active tasks

- [x] TASK-01: Extract InProgressInbox component + create in-progress sub-route
- [x] TASK-02: Extract NewIdeasInbox component + create new-ideas sub-route + delete monolith
- [x] TASK-03: Add layout.tsx sub-nav + root redirect + update nav link

## Goals

- `/process-improvements/in-progress` — dedicated page for active plan monitoring
- `/process-improvements/new-ideas` — dedicated page for queue triage (WorkItems + Deferred + Recently Actioned)
- Root `/process-improvements` redirects to `/process-improvements/new-ideas`
- Sub-nav tabs allow switching between the two pages
- Navigation header unchanged — root `/process-improvements` redirects to `/new-ideas`; `isActive` highlighting works automatically

## Non-goals

- Changing API routes or data model
- Adding new features during the split
- Redesigning visual style
- Adding a dedicated page for Deferred or Recently Actioned

## Constraints & Assumptions

- Constraints:
  - No new API routes — existing `/api/process-improvements/items` and decision routes are sufficient
  - English-only, no i18n
  - Existing `ProcessImprovementsInbox.test.tsx` tests must be ported (not lost) — same TCs, new component imports
- Assumptions:
  - Deferred and Recently Actioned sections stay with New Ideas page
  - BulkActionBar stays with New Ideas page (queue items only)
  - Business filter retained on both pages (mirrors current behaviour; operator can remove from In Progress later)
  - `InProgressSection` null-render replaced with an empty state message on its own page

## Inherited Outcome Contract

- **Why:** The #new-ideas and #in-progress sections need to be separate pages so each can be focused, navigated to directly, and not compete for vertical space.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** #new-ideas and #in-progress each live at their own URL; navigation links point to each; root /process-improvements redirects or shows a landing.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/bos-process-improvements-page-split/analysis.md`
- Selected approach inherited: Option A — Full extraction into two independent client components, each with their own `page.tsx`, plus shared `layout.tsx` sub-nav and root redirect.
- Key reasoning used: matches existing BOS page.tsx + client-component pattern; clean state isolation; data fetching per page; test portability; Option B (parameterised monolith) is deferred cost not saved cost.

## Selected Approach Summary

- What was chosen: Full extraction — two new client components (`InProgressInbox`, `NewIdeasInbox`), two new sub-route `page.tsx` files, shared `layout.tsx` for sub-nav, root `page.tsx` becomes redirect.
- Why planning is not reopening option selection: Analysis confirmed Option A is decisive. The private sub-components in the monolith are already logically scoped to one section; decomposition is mechanical.

## Fact-Find Support

- Supporting brief: `docs/plans/bos-process-improvements-page-split/fact-find.md`
- Evidence carried forward:
  - `ProcessImprovementsInbox` props: `{ initialItems, initialRecentActions, initialActivePlans?, initialInProgressDispatchIds? }`
  - `InProgressSection` returns `null` when `activePlans.length === 0` — needs empty state on its own page
  - Hero stat tiles: `<a href="#in-progress">` and `<a href="#new-ideas">` → must become `<Link>` to sub-routes on each page
  - `NavigationHeader.tsx:41`: `{ href: "/process-improvements", label: "Process Improvements" }` — single entry to update
  - `newIdeasItems` derivation depends on `inProgressDispatchIds` — new-ideas page.tsx must call both `loadProcessImprovementsProjection()` and `loadActivePlans()` + `collectInProgressDispatchIds()`
  - No `layout.tsx` exists in `process-improvements/` today — safe to create
  - Jest test globs: `?(*.)+(spec|test).{ts,tsx}` — standard naming (`InProgressInbox.test.tsx`) will be picked up automatically

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract InProgressInbox + create in-progress sub-route | 88% | M | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Extract NewIdeasInbox + create new-ideas sub-route + delete monolith | 85% | M | Complete (2026-03-12) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add layout.tsx sub-nav + root redirect + update nav link | 92% | S | Complete (2026-03-12) | TASK-02 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Hero stat tiles become `<Link>` on each page; sub-nav rendered by `layout.tsx` | TASK-01, TASK-02, TASK-03 | Each page keeps its own hero with cross-link tiles |
| UX / states | Each page owns independent state; no shared state between sub-routes | TASK-01, TASK-02 | Filter, pending, bulk selection all scoped per page |
| Security / privacy | N/A | - | API routes unchanged; auth checks unchanged |
| Logging / observability / audit | N/A | - | No analytics on this page |
| Testing / validation | Test file split: `InProgressInbox.test.tsx` + `NewIdeasInbox.test.tsx` covering same TCs as monolith test | TASK-01, TASK-02 | Data-layer tests unchanged |
| Data / contracts | Each page.tsx calls only its needed data functions; auto-refresh reuses same endpoint | TASK-01, TASK-02 | `in-progress/page.tsx` calls `loadActivePlans()` only; `new-ideas/page.tsx` calls projection + activePlans |
| Performance / reliability | N/A | - | Single operator user; marginal improvement from scoped fetches |
| Rollout / rollback | Revert PR restores full monolith | All | Clean PR revert |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Creates InProgressInbox + sub-route; monolith untouched |
| 2 | TASK-02 | TASK-01 complete | Creates NewIdeasInbox + sub-route; deletes monolith |
| 3 | TASK-03 | TASK-02 complete | Both sub-routes must exist before root redirect lands |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Page routing | Operator visits `/process-improvements` or clicks nav | Root `page.tsx` calls `redirect('/process-improvements/new-ideas')`; `layout.tsx` wraps sub-route content with tab strip | TASK-03 | Rollback: revert PR restores old page.tsx |
| In Progress page | Operator navigates to `/process-improvements/in-progress` | `in-progress/page.tsx` calls `loadActivePlans()` → passes `initialActivePlans` to `InProgressInbox` → renders `ActivePlanCard` list; auto-refresh polls same endpoint every 30s using `activePlans` subset | TASK-01 | If no plans, empty state shown (not null-render) |
| New Ideas page | Operator navigates to `/process-improvements/new-ideas` | `new-ideas/page.tsx` calls `loadProcessImprovementsProjection()` + `loadActivePlans()` + `collectInProgressDispatchIds()` → passes all to `NewIdeasInbox` → renders WorkItemCard queue + Deferred + RecentlyActioned; auto-refresh polls same endpoint; bulk actions, defer, do, decline all function as before | TASK-02 | Deferred + RecentlyActioned sections stay here |
| Navigation | Operator clicks "Process Improvements" in nav | Nav link href stays at `/process-improvements`; root redirects to `/new-ideas`; `isActive` (`startsWith`) highlights for both sub-routes — no nav change needed | TASK-03 | Nav unchanged |
| Sub-nav tabs | On any `/process-improvements/*` page | `layout.tsx` renders tab strip with "New Ideas" → `/process-improvements/new-ideas` and "In Progress" → `/process-improvements/in-progress`; active tab highlighted via `pathname.startsWith` | TASK-03 | — |

## Tasks

---

### TASK-01: Extract InProgressInbox component + create in-progress sub-route

- **Type:** IMPLEMENT
- **Deliverable:** New `InProgressInbox.tsx` client component + `in-progress/page.tsx` server component + `InProgressInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` (new)
  - `apps/business-os/src/app/process-improvements/in-progress/page.tsx` (new)
  - `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx` (new)
  - `[readonly] apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` (source to extract from — do not delete yet)
  - `[readonly] apps/business-os/src/lib/process-improvements/active-plans.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 88%
  - Implementation: 90% — extraction is mechanical; InProgressSection + ActivePlanCard family sub-components are already scoped to this section; props interface is clear
  - Approach: 88% — follows existing BOS page.tsx + client-component pattern; auto-refresh reuse is straightforward
  - Impact: 88% — creates a functional new route; monolith left intact so no regression risk during this task
- **Acceptance:**
  - [ ] `InProgressInbox` renders the list of active plans (mirrors current InProgressSection output)
  - [ ] When `initialActivePlans` is empty, `InProgressInbox` renders a non-null empty state: "No plans currently in progress"
  - [ ] Auto-refresh polls `/api/process-improvements/items` every 30s and updates `activePlans` from the response
  - [ ] Business filter dropdown present and functional (filters `filteredActivePlans`)
  - [ ] `/process-improvements/in-progress` page loads and renders `InProgressInbox` with server-fetched data
  - [ ] `in-progress/page.tsx` calls only `loadActivePlans()` — no projection data fetched
  - [ ] All TCs from `ProcessImprovementsInbox.test.tsx` that cover in-progress behaviour are ported to `InProgressInbox.test.tsx`
  - **Expected user-observable behavior:**
    - [ ] Visiting `/process-improvements/in-progress` shows the active plans list
    - [ ] Empty state message shows when no plans are in progress (not a blank page)
    - [ ] Business filter works to narrow visible plans
    - [ ] Auto-refresh dot updates plan data every 30 seconds
- **Engineering Coverage:**
  - UI / visual: Required — hero section adapted: "In Progress" tile count shown; "New Ideas" tile becomes a `<Link href="/process-improvements/new-ideas">` cross-link; Deferred and Done tiles omitted from this page's hero
  - UX / states: Required — `activePlans` state, `selectedBusiness` filter state, auto-refresh — all independent of New Ideas page
  - Security / privacy: N/A — admin-only page; no auth changes
  - Logging / observability / audit: N/A — no observability needed
  - Testing / validation: Required — `InProgressInbox.test.tsx` with in-progress TCs ported from monolith test
  - Data / contracts: Required — `in-progress/page.tsx` calls `loadActivePlans()` only; auto-refresh reads `activePlans` from full response
  - Performance / reliability: N/A — single user; no budget
  - Rollout / rollback: Required — monolith file left intact; rollback is deletion of the two new files
- **Validation contract (TC-XX):**
  - TC-01: Render with `initialActivePlans` populated → active plan cards shown
  - TC-02: Render with `initialActivePlans = []` → empty state "No plans currently in progress" shown
  - TC-03: Business filter selected → only plans for that business shown
  - TC-04: Auto-refresh fires (mock fetch) → `activePlans` state updated with response
  - TC-05: `in-progress/page.tsx` renders `InProgressInbox` without error
- **Execution plan:**
  - Red: Write `InProgressInbox.test.tsx` with TC-01 through TC-05; import `InProgressInbox` (not yet existing) — tests fail
  - Green: Create `InProgressInbox.tsx` by copying `InProgressSection`, `ActivePlanCard`, `ActivePlanHeaderBadges`, `ActivePlanActivitySummary` sub-components from the monolith; add `useAutoRefresh` scoped to activePlans; add empty state; add business filter state
  - Green: Create `in-progress/page.tsx` — `export const dynamic = "force-dynamic"` (required; matches existing page.tsx pattern); `loadActivePlans()` is **synchronous** (no `await` — confirmed from current `page.tsx:11`); renders `<InProgressInbox initialActivePlans={activePlans} />`; adapt hero stat tiles (In Progress count + cross-link to new-ideas)
  - Refactor: Ensure all types imported from their source (not re-exported from monolith); verify no circular imports
- **Planning validation (required for M/L):**
  - Checks run: Verified `InProgressSection` (line 904), `ActivePlanCard` (line 1007), `ActivePlanHeaderBadges`, `ActivePlanActivitySummary` are all defined in `ProcessImprovementsInbox.tsx` and not imported from elsewhere. Verified `ProcessImprovementsInbox` props include `initialActivePlans?: ActivePlanProgress[]` — optional, so existing page.tsx still compiles if needed.
  - Validation artifacts: `InProgressSection` renders `null` when `activePlans.length === 0` — confirmed; empty state must replace this. `export const dynamic = "force-dynamic"` present on current `page.tsx:7` — must be on both new pages.
  - Unexpected findings: `loadActivePlans()` is synchronous — no `await` needed (confirmed `page.tsx:11`).
- **Consumer tracing:**
  - New output: `InProgressInbox` component → consumed only by `in-progress/page.tsx`
  - New output: `in-progress/page.tsx` → new Next.js route, no other consumers
  - `ProcessImprovementsInbox` is NOT modified in this task — root `/process-improvements` continues to render it
- **Scouts:** None — all sub-components verified in monolith; `loadActivePlans` synchronous signature confirmed
- **Edge Cases & Hardening:**
  - `activePlans` loaded synchronously but auto-refresh is async — handle empty initial state gracefully (empty state message, not null/blank)
  - `selectedBusiness` reset when plans list changes to avoid stale filter showing zero results
- **What would make this >=90%:** Running the new page in dev server and confirming plan cards render and auto-refresh fires
- **Rollout / rollback:**
  - Rollout: New files only; monolith untouched; no existing route changed
  - Rollback: Delete `InProgressInbox.tsx`, `in-progress/page.tsx`, `InProgressInbox.test.tsx`
- **Documentation impact:** None — internal tool
- **Notes / references:**
  - `InProgressSection`: `ProcessImprovementsInbox.tsx` line ~904
  - `ActivePlanCard`: `ProcessImprovementsInbox.tsx` line ~1007
  - `loadActivePlans`: `apps/business-os/src/lib/process-improvements/active-plans.ts`
  - Auto-refresh: `useAutoRefresh` hook in monolith line ~627; reads full payload, use `activePlans` key only

---

### TASK-02: Extract NewIdeasInbox component + create new-ideas sub-route + delete monolith

- **Type:** IMPLEMENT
- **Deliverable:** New `NewIdeasInbox.tsx` client component + `new-ideas/page.tsx` server component + `NewIdeasInbox.test.tsx`; delete `ProcessImprovementsInbox.tsx` and `ProcessImprovementsInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx` (new)
  - `apps/business-os/src/app/process-improvements/new-ideas/page.tsx` (new)
  - `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx` (new)
  - `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` (delete after extraction complete)
  - `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx` (delete after porting TCs)
  - `[readonly] apps/business-os/src/lib/process-improvements/projection.ts`
  - `[readonly] apps/business-os/src/lib/process-improvements/active-plans.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 87% — `NewIdeasInbox` contains the bulk of the monolith's state and logic; extraction follows same pattern as TASK-01 but is larger surface; `newIdeasItems` derivation requires `inProgressDispatchIds` which must come from server
  - Approach: 85% — straightforward extraction; `newIdeasItems` classification logic is well-understood from fact-find
  - Impact: 85% — completes the split; monolith deletion is irreversible (but git revert covers rollback)
- **Acceptance:**
  - [ ] `NewIdeasInbox` renders the WorkItems queue (new ideas), Deferred section, and Recently Actioned section
  - [ ] Queue triage actions (do, defer, decline) work as before with optimistic updates
  - [ ] Operator action items (snooze, done) work as before
  - [ ] BulkActionBar works for multi-select queue items
  - [ ] Business, type, and priority filter dropdowns work
  - [ ] Auto-refresh polls every 30s and updates items + inProgressDispatchIds
  - [ ] `newIdeasItems` derivation correctly excludes items whose dispatchId is in `inProgressDispatchIds`
  - [ ] `/process-improvements/new-ideas` page loads and renders `NewIdeasInbox`
  - [ ] `new-ideas/page.tsx` calls `loadProcessImprovementsProjection()` + `loadActivePlans()` + `collectInProgressDispatchIds()`
  - [ ] `ProcessImprovementsInbox.tsx` and `ProcessImprovementsInbox.test.tsx` deleted (no orphaned imports)
  - [ ] All remaining TCs from `ProcessImprovementsInbox.test.tsx` not ported in TASK-01 are ported here
  - **Expected user-observable behavior:**
    - [ ] Visiting `/process-improvements/new-ideas` shows the queue with triage actions
    - [ ] Defer, do, decline buttons function identically to the current page
    - [ ] Bulk actions work for selecting multiple items
    - [ ] Deferred section and recently actioned section visible below the queue
    - [ ] Auto-refresh dot updates data every 30 seconds
- **Engineering Coverage:**
  - UI / visual: Required — hero adapted: "New Ideas" tile count shown; "In Progress" tile becomes `<Link href="/process-improvements/in-progress">` cross-link; Deferred and Done tiles shown as plain stat tiles (non-linking, no anchor needed)
  - UX / states: Required — all state fully independent; `inProgressDispatchIds` scoped to this page; filter/pending/bulk state all local
  - Security / privacy: N/A — no changes
  - Logging / observability / audit: N/A — no changes
  - Testing / validation: Required — `NewIdeasInbox.test.tsx` with all remaining TCs from monolith test; monolith test deleted after porting
  - Data / contracts: Required — `new-ideas/page.tsx` calls both projection and activePlans functions; auto-refresh reads `items`, `recentActions`, `inProgressDispatchIds` from full response
  - Performance / reliability: N/A
  - Rollout / rollback: Required — monolith deletion is in this task; rollback is git revert
- **Validation contract (TC-XX):**
  - TC-01: Render with populated `initialItems` → WorkItemCards visible in New Ideas section
  - TC-02: Defer action → item moves to Deferred section optimistically
  - TC-03: Do action → item removed from New Ideas, recorded in recently actioned
  - TC-04: Operator action snooze → item state updated
  - TC-05: Operator action done → item moved to recently actioned
  - TC-06: Business filter → only items for selected business shown
  - TC-07: Item with `dispatchId` in `inProgressDispatchIds` → not shown in New Ideas (correctly excluded)
  - TC-08: Auto-refresh (mock fetch) → items + inProgressDispatchIds updated
  - TC-09: `new-ideas/page.tsx` renders `NewIdeasInbox` without error
  - TC-10: Bulk select multiple items + bulk decision → all selected items updated
- **Execution plan:**
  - Red: Write `NewIdeasInbox.test.tsx` with TC-01 through TC-10; import `NewIdeasInbox` (not yet existing)
  - Green: Create `NewIdeasInbox.tsx` — copy remaining sub-components (`InboxSection`, `WorkItemCard`, `BulkActionBar`, `RecentlyActionedSection`, `ProcessImprovementsSummary`, `FilterSelect`, helper components) from monolith; port state: `items`, `recentActions`, `inProgressDispatchIds`, filter state, pendingState, bulkSelection, expandedKeys; port `newIdeasItems` and `filteredDeferredItems` useMemos; port `useAutoRefresh` reading `items`/`recentActions`/`inProgressDispatchIds` from response
  - Green: Create `new-ideas/page.tsx` — `export const dynamic = "force-dynamic"` (required); `loadProcessImprovementsProjection()` is async (`await`); `loadActivePlans()` is **synchronous** (no `await`); calls `collectInProgressDispatchIds(activePlans)` to get IDs; renders `<NewIdeasInbox>` with all initial props; adapt hero stat tiles
  - Cleanup: Confirm `ProcessImprovementsInbox` has no remaining callers (grep confirms only `page.tsx` imports it; `page.tsx` no longer uses it after this task); delete `ProcessImprovementsInbox.tsx`; delete `ProcessImprovementsInbox.test.tsx`
- **Planning validation (required for M/L):**
  - Checks run: Verified `ProcessImprovementsInbox` is imported only by `apps/business-os/src/app/process-improvements/page.tsx` (the root page). After TASK-02 creates `new-ideas/page.tsx`, the root `page.tsx` no longer needs the monolith import. Verified `newIdeasItems` derivation at lines ~730-738 depends on `inProgressDispatchIds` Set — must be passed as prop from server.
  - Validation artifacts: `collectInProgressDispatchIds` returns `string[]` which the component converts to `Set<string>` — existing pattern confirmed.
  - Unexpected findings: `new-ideas/page.tsx` must call `loadActivePlans()` to derive `inProgressDispatchIds`; it does not need to pass the full `activePlans` array to `NewIdeasInbox`, only the IDs.
- **Consumer tracing:**
  - New output: `NewIdeasInbox` component → consumed only by `new-ideas/page.tsx`
  - Deleted: `ProcessImprovementsInbox` → only caller was root `page.tsx` which is converted to redirect in TASK-03
  - Modified behavior: root `page.tsx` loses its `ProcessImprovementsInbox` import; safe because TASK-03 replaces the page body with a redirect
- **Scouts:** None — `newIdeasItems` derivation logic verified from source
- **Edge Cases & Hardening:**
  - Items whose `dispatchId` appears in `inProgressDispatchIds` must be excluded from New Ideas; verify Set lookup is used (O(1), not Array.includes)
  - Auto-refresh response includes all 4 fields; `NewIdeasInbox` reads only `items`, `recentActions`, `inProgressDispatchIds` — `activePlans` field ignored
  - `ProcessImprovementsInbox.tsx` deletion: grep for all imports before deleting to avoid broken builds
- **What would make this >=90%:** Running both sub-pages in dev server; confirming a "do" action removes an item from New Ideas; confirming In Progress page data is unaffected
- **Rollout / rollback:**
  - Rollout: New files created first; monolith deleted only after new files confirmed working
  - Rollback: `git revert` restores monolith and removes new files
- **Documentation impact:** None
- **Notes / references:**
  - `newIdeasItems` derivation: `ProcessImprovementsInbox.tsx` lines ~730-738
  - `collectInProgressDispatchIds`: `apps/business-os/src/lib/process-improvements/active-plans.ts`
  - Sub-components to port: `InboxSection` (~1305), `WorkItemCard` (~1431), `RecentlyActionedSection` (~1559), `ProcessImprovementsSummary` (~1166), `BulkActionBar`, `FilterSelect`, `SummaryPill`, `WorkItemIdentityRow`, `WorkItemPriorityPanel`, `WorkItemNotice`, `PostponePickerButton`, `ActionButton`

---

### TASK-03: Add layout.tsx sub-nav + root redirect + update nav link

- **Type:** IMPLEMENT
- **Deliverable:** New `layout.tsx` inside `process-improvements/`; root `page.tsx` converted to redirect; `NavigationHeader.tsx` nav link updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/business-os/src/app/process-improvements/layout.tsx` (new)
  - `apps/business-os/src/app/process-improvements/page.tsx` (replace body with redirect)
  - `[readonly] apps/business-os/src/components/layout/NavigationHeader.tsx` (no change needed — root redirect makes it work)
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 93% — `layout.tsx` is a simple wrapper with two `<Link>` tabs; redirect is a one-liner; nav link change is a single string
  - Approach: 92% — Next.js App Router `layout.tsx` + `redirect()` is the canonical pattern
  - Impact: 92% — completes the routing; both sub-routes must exist (TASK-02 prerequisite) before redirect is safe
- **Acceptance:**
  - [ ] `layout.tsx` renders a tab strip with "New Ideas" → `/process-improvements/new-ideas` and "In Progress" → `/process-improvements/in-progress`; active tab highlighted based on `pathname`
  - [ ] Root `/process-improvements` redirects to `/process-improvements/new-ideas` (server-side redirect, no flash)
  - [ ] `NavigationHeader.tsx` nav link href stays at `"/process-improvements"` (no change needed — root redirects to `/new-ideas`; `isActive` via `startsWith("/process-improvements")` correctly highlights for both sub-routes)
  - [ ] Global layout (`ToastProvider`, `KeyboardShortcutProvider`, `CaptureFAB`) unaffected
  - **Expected user-observable behavior:**
    - [ ] Clicking "Process Improvements" in the top nav lands on the New Ideas page
    - [ ] Sub-nav tabs visible on both `/new-ideas` and `/in-progress` pages
    - [ ] Active tab is visually distinct from inactive tab
    - [ ] Visiting `/process-improvements` directly redirects to `/process-improvements/new-ideas` without a visible flash
- **Engineering Coverage:**
  - UI / visual: Required — tab strip styling consistent with BOS design system tokens; active state uses `pathname`
  - UX / states: Required — tab active state derived from `usePathname()` (client component); layout is a server component wrapping a client tab strip
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — manual smoke test: nav link → new-ideas; root redirect → new-ideas; tab switching → in-progress; no automated test needed (routing is trivially verifiable)
  - Data / contracts: N/A — no data fetching in layout
  - Performance / reliability: N/A
  - Rollout / rollback: Required — revert PR restores root `page.tsx` and removes layout.tsx
- **Validation contract (TC-XX):**
  - TC-01: GET `/process-improvements` → 307/308 redirect to `/process-improvements/new-ideas`
  - TC-02: GET `/process-improvements/new-ideas` → 200 with tab strip; "New Ideas" tab active
  - TC-03: GET `/process-improvements/in-progress` → 200 with tab strip; "In Progress" tab active
  - TC-04: Nav link click → lands on `/process-improvements/new-ideas`
  - TC-05: Tab "In Progress" click → navigates to `/process-improvements/in-progress`
- **Execution plan:**
  - Create `layout.tsx`: server component that renders `<SubNav>` (client component using `usePathname`) above `{children}`; tab links styled with BOS semantic tokens
  - Convert root `page.tsx`: remove all data fetching + JSX; replace with `import { redirect } from 'next/navigation'; export default function Page() { redirect('/process-improvements/new-ideas'); }`
  - `NavigationHeader.tsx`: **no href change needed** — root `/process-improvements` redirects to `/new-ideas`; `startsWith("/process-improvements")` isActive check correctly highlights for both sub-routes without any modification
- **Planning validation (required for M/L):** None — S-effort task
- **Scouts:** None — `layout.tsx` absence confirmed; `redirect()` from `next/navigation` is the correct import for App Router
- **Edge Cases & Hardening:**
  - Tab active state: use `pathname === href` (exact) not `startsWith` for tabs (to avoid both tabs being active simultaneously)
  - `layout.tsx` wraps the redirect `page.tsx` too — but user never sees the layout since redirect fires before render
- **What would make this >=90%:** Dev server smoke test confirming redirect + tab switching
- **Rollout / rollback:**
  - Rollout: Depends on TASK-02; both sub-routes must exist before root redirect fires
  - Rollback: Revert PR; root `page.tsx` restored; layout.tsx removed; nav link reverted
- **Documentation impact:** None
- **Notes / references:**
  - `NavigationHeader.tsx:41`: `{ href: "/process-improvements", label: "Process Improvements" }`
  - `isActive` uses `pathname?.startsWith(href)` — updating href to `/new-ideas` still highlights for `/in-progress` if using startsWith on `/process-improvements` prefix, but the nav entry now points to the new primary page
  - Next.js App Router redirect: `import { redirect } from 'next/navigation'`

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Monolith has a shared utility used by both sections not identified in fact-find | Low | Medium | Run full grep for any function called from both `InProgressSection` and `InboxSection` before extraction |
| `ProcessImprovementsInbox.tsx` deletion causes broken import in root `page.tsx` | Low | Low | TASK-03 converts root `page.tsx` to redirect (removing the import) in the same task as deletion completion confirmation |
| Jest glob misses new test file names | Very Low | Low | Standard `*.test.tsx` naming confirmed to match existing glob pattern |

## Observability

None: internal single-operator tool; no logging, metrics, or dashboards needed.

## Acceptance Criteria (overall)

- [ ] `/process-improvements/in-progress` accessible and renders active plans list
- [ ] `/process-improvements/new-ideas` accessible and renders queue triage interface
- [ ] Root `/process-improvements` redirects to `/process-improvements/new-ideas`
- [ ] Sub-nav tab strip visible on both pages with correct active state
- [ ] Navigation header unchanged; clicking "Process Improvements" hits root redirect → lands on `/process-improvements/new-ideas`
- [ ] All triage/defer/decline/snooze/done actions work on New Ideas page
- [ ] All tests in `InProgressInbox.test.tsx` and `NewIdeasInbox.test.tsx` pass
- [ ] `ProcessImprovementsInbox.tsx` deleted; no orphaned imports
- [ ] No TypeScript errors
- [ ] No lint errors

## Decision Log

- 2026-03-12: Full extraction chosen over parameterised monolith — clean state isolation, matches existing pattern, real not cosmetic separation
- 2026-03-12: Deferred and Recently Actioned sections stay with New Ideas page — downstream of triage, no separate page needed
- 2026-03-12: Business filter retained on In Progress page by default — mirrors current behaviour; operator can adjust later
- 2026-03-12: Root redirect to `/new-ideas` rather than landing page — simpler, single-user internal tool
- 2026-03-12: `layout.tsx` sub-nav rather than modifying `NavigationHeader` with sub-entries — keeps top nav clean; in-page tabs are the right pattern for sub-sections

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract InProgressInbox | Yes — monolith file exists; `loadActivePlans` confirmed importable; no existing sub-routes to conflict | None | No |
| TASK-02: Extract NewIdeasInbox + delete monolith | Yes — TASK-01 complete; `InProgressInbox` already handles in-progress TCs; `collectInProgressDispatchIds` importable; monolith still has no other callers | Advisory: monolith deletion is irreversible; verify no remaining callers before deleting | No — git revert is rollback |
| TASK-03: layout.tsx + redirect + nav update | Yes — both sub-routes exist after TASK-02; `layout.tsx` absent confirmed; `redirect()` from `next/navigation` is correct import | None | No |

## Overall-confidence Calculation

- TASK-01: confidence 88%, effort M (weight 2)
- TASK-02: confidence 85%, effort M (weight 2)
- TASK-03: confidence 92%, effort S (weight 1)
- Overall = (88×2 + 85×2 + 92×1) / (2+2+1) = (176 + 170 + 92) / 5 = 438/5 = **88%**
