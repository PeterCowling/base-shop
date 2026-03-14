---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: bos-process-improvements-page-split
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/bos-process-improvements-page-split/fact-find.md
Related-Plan: docs/plans/bos-process-improvements-page-split/plan.md
Auto-Plan-Intent: analysis+auto
Critique-Score: 4.2
Critique-Rounds: 1
artifact: analysis
---

# Business OS: Process Improvements Page Split Analysis

## Decision Frame

### Summary
The `/process-improvements` page must be split so that In Progress and New Ideas each have their own URL. The core decision is how to decompose the monolithic `ProcessImprovementsInbox` client component (~1,750 lines) that currently owns all state and renders for both sections. The data layer needs no changes — the question is purely about component structure and routing.

### Goals
- `/process-improvements/in-progress` — focused page for active plan monitoring
- `/process-improvements/new-ideas` — focused page for queue triage (WorkItems + Deferred + Recently Actioned)
- Root `/process-improvements` redirects to `/process-improvements/new-ideas`
- Navigation updated to link to both sub-pages

### Non-goals
- Changing API routes or data model
- Adding new features during the split
- Redesigning visual style

### Constraints & Assumptions
- Constraints:
  - No new API routes — existing `/api/process-improvements/items` and decision routes sufficient
  - English-only, no i18n
  - Existing `ProcessImprovementsInbox.test.tsx` tests must pass after split
- Assumptions:
  - Deferred and Recently Actioned sections stay with New Ideas
  - BulkActionBar stays with New Ideas (queue items only)
  - Business filter retained on both pages (default; operator can remove from In Progress later)

## Inherited Outcome Contract

- **Why:** The #new-ideas and #in-progress sections need to be separate pages so each can be focused, navigated to directly, and not compete for vertical space.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** #new-ideas and #in-progress each live at their own URL; navigation links point to each; root /process-improvements redirects or shows a landing.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-process-improvements-page-split/fact-find.md`
- Key findings used:
  - `ProcessImprovementsInbox` (~1,750 lines) holds all state and renders both sections in a single client component; all private sub-components are already logically scoped to one section
  - Shared state breaks cleanly at the page boundary: each sub-page only needs its own section's state
  - Auto-refresh endpoint returns all 4 data fields; sub-pages can reuse it and ignore the unused subset
  - `NavigationHeader.tsx:41` is the sole nav entry — a single string change updates the primary nav link
  - No existing sub-routes under `/process-improvements/`
  - `ProcessImprovementsInbox.test.tsx` tests the monolith via RTL with `initialXxx` props — directly portable to decomposed components

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Match existing patterns | `page.tsx` (server) + `ClientInbox.tsx` (client) is the established BOS convention | High |
| Test portability | Existing test suite must pass without wholesale rewrite | High |
| State isolation | Each page must own its own state independently | High |
| Decomposition effort | Monolith is large but sections are already logically scoped | Medium |
| Rollback simplicity | Internal tool; revert PR must fully restore current behaviour | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Full extraction | Extract `InProgressInbox` and `NewIdeasInbox` as two independent client components, each with their own `page.tsx`. Root route redirects. Nav gets two links or a sub-nav via `layout.tsx`. | Matches existing pattern exactly; clean state isolation; data fetching per page; test suites independent | More files to create; ~1,750-line monolith must be read carefully during decomposition | Missing a shared utility that both components need (unlikely given fact-find; both sections use only section-specific sub-components) | Yes — **chosen** |
| B — Parameterised monolith | Add `mode: "in-progress" \| "new-ideas"` prop to `ProcessImprovementsInbox`; render only the relevant section; two new `page.tsx` files pass the prop | Fewer new files; monolith stays in one place | All state still initialised regardless of mode; conditional rendering adds coupling; test isolation is superficial; root data fetch remains monolithic; doesn't actually achieve clean page-level separation | State for unused section is initialised and polled; harder to prune later; only looks cheaper on the surface | No |
| C — Shared layout with tabs (no URL split) | Add a `layout.tsx` with tabs, keep URL as `/process-improvements?tab=...` | Zero component decomposition required | Does not meet the goal — operator explicitly wants separate URLs | Fails goal | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (Full extraction) | Option B (Parameterised) | Chosen implication |
|---|---|---|---|
| UI / visual | Hero anchor links become `<Link>` to new routes; sub-nav added via `layout.tsx` | Same link changes needed | Sub-nav rendered by `layout.tsx`; hero tiles become `<Link href="/process-improvements/...">` |
| UX / states | Each page has independent filter state, pendingState, bulkSelection | Shared state still initialised; conditionals guard unused state | Independent state — no cross-section mutation risk |
| Security / privacy | No change — API routes unchanged | Same | No action needed |
| Logging / observability / audit | No change | Same | No action needed |
| Testing / validation | Tests follow component — `InProgressInbox.test.tsx` and `NewIdeasInbox.test.tsx` split from monolith tests | Test must deal with mode prop; existing fixture patterns still work | Portable — RTL render pattern is identical; same `initialXxx` props, different component import |
| Data / contracts | Each `page.tsx` calls only the data functions relevant to its section; auto-refresh continues unchanged | Monolithic data fetch unchanged | `in-progress/page.tsx` calls `loadActivePlans()` only; `new-ideas/page.tsx` calls `loadProcessImprovementsProjection()` + `collectInProgressDispatchIds()` |
| Performance / reliability | Marginally faster page loads (each page fetches less) | No improvement | Negligible; single operator user |
| Rollout / rollback | Revert PR restores full monolith | Same | Clean PR revert |

## Chosen Approach

- **Recommendation:** Option A — Full extraction into two independent client components, each with their own `page.tsx` sub-route. Root `/process-improvements` redirects to `/process-improvements/new-ideas`. Sub-nav rendered by a shared `layout.tsx` inside the `process-improvements/` directory.
- **Why this wins:** It matches the existing `page.tsx` + client-component pattern used throughout BOS. State isolation is real, not cosmetic. Data fetching per page is more precise. Tests follow the component and remain fully independent. The decomposition is mechanical — all private sub-components in the monolith are already logically scoped to one section.
- **What it depends on:** The monolith's private sub-components (`InProgressSection`, `ActivePlanCard`, `InboxSection`, `WorkItemCard`, `BulkActionBar`, `RecentlyActionedSection`, `ProcessImprovementsSummary`) being extractable without coupling; the fact-find confirms this (no cross-section sub-component usage found).

### Rejected Approaches
- Option B (parameterised monolith) — superficially cheaper but keeps all state initialised for both sections, adds conditional logic, and doesn't achieve clean URL-level separation. Deferred cost, not saved cost.
- Option C (tabs, no URL split) — fails the stated goal of separate URLs.

### Open Questions (Operator Input Required)
- Q: Should the business filter dropdown appear on the In Progress page?
  - Why operator input is required: UX preference; the filter is trivial to include or exclude technically.
  - Planning impact: affects which filter UI elements are included in `InProgressInbox`; default assumption is to include it (mirrors current behaviour).

## End-State Operating Model

| Area | Current state | Trigger | Delivered end-state flow | What remains unchanged | Risks / seams |
|---|---|---|---|---|---|
| Page routing | `/process-improvements` — single page, all sections | Operator visits URL or clicks nav | `/process-improvements` → redirects to `/process-improvements/new-ideas`; `/process-improvements/new-ideas` and `/process-improvements/in-progress` each serve their own page | All API routes unchanged | Root redirect must be a Next.js `redirect()` in the root `page.tsx` to avoid middleware dependency |
| Navigation | `NavigationHeader.tsx` single link to `/process-improvements` | — | Nav updated with two entries: "New Ideas" → `/process-improvements/new-ideas`, "In Progress" → `/process-improvements/in-progress` — OR sub-nav rendered by `layout.tsx` | Global layout unchanged | Sub-nav via `layout.tsx` is cleaner and avoids modifying the top nav for internal sub-pages |
| In Progress section | Part of `ProcessImprovementsInbox`, shares state with New Ideas | Monolith mounts | `InProgressInbox` client component: own state (`activePlans`, `selectedBusiness`), own auto-refresh (polls same endpoint, uses `activePlans` subset), own `page.tsx` calling `loadActivePlans()` only | `ActivePlanCard` render logic; decision API routes | `InProgressSection` currently renders `null` when no plans — add empty state message |
| New Ideas section | Part of `ProcessImprovementsInbox`, shares state with In Progress | Monolith mounts | `NewIdeasInbox` client component: own state (`items`, `recentActions`, `inProgressDispatchIds`, filter state, bulkSelection, pendingState), own auto-refresh, own `page.tsx` calling `loadProcessImprovementsProjection()` + `collectInProgressDispatchIds()` | All triage/defer/decline logic; `WorkItemCard`; `BulkActionBar`; `RecentlyActionedSection` | Hero stat tiles become `<Link href="...">` — two tiles remain on each page pointing to the other page |
| Hero stat tiles | `<a href="#in-progress">` and `<a href="#new-ideas">` in `page.tsx` hero | — | Tiles become `<Link href="/process-improvements/in-progress">` and `<Link href="/process-improvements/new-ideas">` — present on each sub-page's hero, pointing to the sibling page | All other stat tiles (Deferred, Done) | — |
| Auto-refresh | Single `useAutoRefresh` in monolith polls `/api/process-improvements/items` every 30s | — | Each page has its own `useAutoRefresh` instance; same endpoint reused; each page reads only its subset of the response | Endpoint unchanged; 30s interval unchanged | Two independent polls; no shared state to conflict |
| Tests | `ProcessImprovementsInbox.test.tsx` covers full monolith | — | Tests split: `InProgressInbox.test.tsx` and `NewIdeasInbox.test.tsx`; same RTL patterns, same `initialXxx` prop conventions | Data-layer tests (`projection.test.ts`, `active-plans.test.ts`, route tests) unchanged | Test file rename must not break CI path patterns |

## Planning Handoff

- Planning focus:
  - TASK-01: Create `layout.tsx` inside `process-improvements/` with sub-nav tabs linking to both sub-routes; redirect root `page.tsx` to `/new-ideas`
  - TASK-02: Extract `InProgressInbox` client component from monolith; create `/process-improvements/in-progress/page.tsx`; split tests
  - TASK-03: Extract `NewIdeasInbox` client component from monolith; create `/process-improvements/new-ideas/page.tsx`; split tests; update hero tile links
- Validation implications:
  - Existing `ProcessImprovementsInbox.test.tsx` must be split across `InProgressInbox.test.tsx` and `NewIdeasInbox.test.tsx` covering the same TCs
  - Hero tile link update in `page.tsx` must use Next.js `<Link>` (not `<a>`)
  - Root `page.tsx` redirect must use `import { redirect } from 'next/navigation'`
- Sequencing constraints:
  - TASK-01 (layout + redirect) can be done first or last — it is independent of component decomposition
  - TASK-02 and TASK-03 can be done in either order but must not be parallelised (both touch the monolith file)
  - Suggested order: TASK-02 → TASK-03 → TASK-01 (extract heavier In Progress first, then New Ideas which carries Deferred + Recently Actioned, then wire routing)
- Risks to carry into planning:
  - `InProgressSection` renders `null` when `activePlans.length === 0` — needs an empty state on its own page
  - Hero tiles on each sub-page should cross-link to the sibling page (not self-link); planner must confirm which tiles appear on which page
  - Business filter on In Progress page: include by default unless operator says otherwise

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `InProgressSection` null-render becomes confusing empty page | Medium | Low | Implementation detail for build | Add explicit empty state: "No plans in progress" |
| Test renaming breaks CI path patterns | Low | Low | Depends on Jest config globs; trivial to verify | Check `jest.config.cjs` glob before finalising test file names |
| Hero cross-links become stale if page structure changes later | Low | Low | Future concern | Use `<Link>` — no further mitigation needed |

## Planning Readiness
- Status: Go
- Rationale: All gates pass. Approach is decisive. Data layer requires no changes. Component decomposition is mechanical with clear section boundaries. Existing test patterns are directly portable. No unresolved blockers.
