---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: process-improvements-command-centre-redesign
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system
Trigger-Why: The process-improvements pages (/new-ideas and /in-progress) currently look and feel like a bog-standard admin report. Everything from the header counts being wrong, to the flat list layout, to the light-surface colour palette makes it feel passive and static. The operator wants a living command-centre aesthetic — dark surfaces, glowing live indicators, spatial layout, accurate real-time data — so that the pages are genuinely useful as a daily operational hub.
Trigger-Intended-Outcome: type: operational | statement: Redesigned /new-ideas and /in-progress pages that present accurate data, apply a dark command-centre visual theme consistent with the reference design (navy/indigo dark surfaces, gradient hero areas, vibrant accent glows), resolve all identified data-accuracy bugs, and replace the flat-list report layout with a spatially organised dashboard that allows scan-in-3-seconds situational awareness. | source: operator
---

# Process Improvements — Command Centre Redesign Fact-Find

## Scope

### Summary
The `/process-improvements/new-ideas` and `/process-improvements/in-progress` pages are the operator's daily operational interface for triaging ideas and tracking active work. Currently they present as a flat, light-surface admin report with multiple data-accuracy bugs and no sense of liveness. This fact-find covers a two-phase redesign: (1) fix data accuracy and copy issues, (2) apply a dark command-centre visual theme and spatial layout inspired by the reference design below.

**Reference design:** `/Users/petercowling/Downloads/Top-5-Best-UX-UI-Design-Companies-2020-3.jpg` — a crypto wallet dashboard with deep navy/indigo dark surfaces, pink-to-purple gradient hero areas, glassmorphism cards with subtle borders, vibrant electric-blue/purple/magenta accent glows, bold white large-number metrics, and compact list rows with inline mini sparklines. The key aesthetic qualities to port are: dark depth, glowing liveness indicators, bold metric typography, and compact-but-readable data density.

### Goals
- Fix 5 confirmed data-accuracy bugs (stale counts, hardcoded zero, internal copy in operator-facing labels) plus 1 visual artefact (hero-foreground tokens applied outside hero context).
- Apply a scoped dark command-centre theme to the process-improvements section without forcing a global dark-mode switch in BOS.
- Redesign the page layout from flat vertical list → spatial dashboard: hero summary strip with live large-number stats, urgency swimlanes (overdue/active/deferred), and a compact list mode.
- Replace all internal-system copy in operator-facing elements with plain-language labels.
- Upgrade the sub-nav to show live counts and active-state pulse.
- Add genuine liveness signals: animated ring for active-now plans, pulsing dot for the auto-refresh, visible "last synced" that feels like a heartbeat.
- Keep all existing interactive behaviour (defer, decline, do, snooze, bulk actions) fully functional.

### Non-goals
- Full BOS app dark-mode switch (scoped to `/process-improvements` route only).
- Adding new data sources or changing the projection/ledger business logic.
- Mobile-first redesign (desktop operator tool; responsive improvements in scope but not primary focus).
- Keyboard shortcut system (noted as future opportunity; out of scope for this plan).

### Constraints & Assumptions
- Constraints:
  - Must use BOS design-system tokens (`@acme/design-system`, `@acme/ui`) and Tailwind v4 `@theme inline` pattern — no arbitrary hardcoded hex values outside of CSS custom property definitions.
  - New CSS custom properties for the command-centre dark palette must be defined inside `apps/business-os/src/styles/global.css` as scoped `@utility` or class-override blocks — not in `packages/themes/`.
  - The `@acme/design-system` component API (Button, Tag, etc.) must be used for interactive controls; unstyled HTML buttons only where no DS equivalent exists.
  - All TypeScript must pass `pnpm typecheck`; all lint rules enforced (including `ds/no-hardcoded-copy` with BOS exemption comment, `ds/no-nonlayered-zindex` with BOS exemption where needed).
  - No changes to lib layer (`projection.ts`, `active-plans.ts`, `decision-ledger.ts`) — all data accuracy fixes are in page/component layer only.
- Assumptions:
  - The BOS app already imports `packages/themes/base/tokens.css` as the active token file; the dark override variables are available in `packages/themes/dark/tokens.css` as reference for value selection but will be inlined rather than imported.
  - The operator uses this on a desktop browser in a controlled internal environment — no contrast-AA failures will be tolerated but no legacy browser support needed.
  - `isActiveNow` (5-minute file-mtime window) and `isObservedNow` (5-minute observation window) are correct enough for liveness indication purposes.

---

## Outcome Contract

- **Why:** Process-improvements pages are the operator's daily work surface for managing ideas and active plans. Currently they feel like a passive report — stale counts, internal jargon, flat lists. For the system to be useful as a command centre the pages need to accurately reflect live state and look and feel like they're alive.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Redesigned `/process-improvements/*` pages with: (a) zero data-accuracy regressions on the 5 identified bugs, (b) a scoped dark command-centre visual theme applied to the process-improvements layout, (c) spatial dashboard layout with urgency-tiered sections, and (d) all internal-system copy replaced with operator-facing plain language.
- **Source:** operator

---

## Current Process Map

- **Trigger:** Operator navigates to `http://localhost:3022/process-improvements/` (redirects to `/new-ideas`) or directly to `/in-progress`.
- **End condition:** Operator has reviewed active items and taken triage decisions (do / defer / decline / mark-done / snooze), or reviewed active plan progress.

### Process Areas
| Area | Current step-by-step flow | Owners / systems | Evidence refs | Known issues |
|---|---|---|---|---|
| New Ideas page load | SSR: `loadProcessImprovementsProjection()` reads queue JSON + operator-actions + decision ledgers → projects items → passes to `NewIdeasInbox` client component → renders | `projection.ts`, `new-ideas/page.tsx`, `NewIdeasInbox.tsx` | `apps/business-os/src/app/process-improvements/new-ideas/page.tsx:9-52` | `initialInProgressCount` is SSR-only, never refreshes |
| In Progress page load | SSR: `loadActivePlans()` reads `docs/plans/*/plan.md` for Status:Active plans, file-mtime activity, JSONL observations → passes to `InProgressInbox` | `active-plans.ts`, `in-progress/page.tsx`, `InProgressInbox.tsx` | `apps/business-os/src/app/process-improvements/in-progress/page.tsx` | Header count was SSR-only (partially fixed 2026-03-13); `newIdeasCount` badge still SSR-locked |
| Auto-refresh (30s) | Client-side `setInterval` polls `/api/process-improvements/items` → updates items + recentActions + inProgressDispatchIds | `useAutoRefresh` hook, `InProgressInbox.useInProgressAutoRefresh` | `NewIdeasInbox.tsx:603-654`, `InProgressInbox.tsx:432-470` | Refresh indicator is easy to miss; `lastRefreshed` not wired to header stat badges |
| Triage decision | Operator expands card → clicks Do/Defer/Decline/Mark-done/Snooze → POST to `/api/process-improvements/decision/[decision]` or `/api/process-improvements/operator-actions/[decision]` → ledger write → optimistic UI update | `NewIdeasInbox.tsx` handlers, API routes | `new-ideas/page.tsx`, `operator-actions/[decision]/route.ts` | Working correctly; UX is functional but buried in expanded cards |
| Sub-navigation | Thin `ProcessImprovementsSubNav` renders two text tab links; no counts, no active indicators | `ProcessImprovementsSubNav.tsx` | `apps/business-os/src/components/process-improvements/ProcessImprovementsSubNav.tsx` | No live counts; no visual distinction from rest of BOS nav |

---

## Evidence Audit (Current State)

### Entry Points
- `apps/business-os/src/app/process-improvements/layout.tsx` — layout wrapper; mounts `ProcessImprovementsSubNav`
- `apps/business-os/src/app/process-improvements/new-ideas/page.tsx` — SSR page; loads projection + active plans
- `apps/business-os/src/app/process-improvements/in-progress/page.tsx` — SSR page; loads active plans
- `apps/business-os/src/app/process-improvements/page.tsx` — redirect to `/new-ideas`

### Key Modules / Files
- `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx` — 1,660-line client component; all inbox logic, filtering, display, decision handlers. **Primary redesign target.**
- `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` — 512-line client component; plan cards, snooze, auto-refresh. **Primary redesign target.**
- `apps/business-os/src/components/process-improvements/ProcessImprovementsSubNav.tsx` — 36-line nav; needs count badges + visual upgrade.
- `apps/business-os/src/styles/global.css` — Tailwind v4 `@theme inline` config; `bg-hero-contrast` utility already provides dark gradient. New `cmd-centre` scoped tokens to be added here.
- `packages/themes/base/tokens.css` — full token set; semantic vars. Read-only for value reference.
- `packages/themes/dark/tokens.css` — existing dark theme overrides; **NOT the target palette**. This file uses near-black (`--color-bg: 0 0% 4%`), not navy. Reviewed to confirm the command-centre dark palette must be entirely new values defined in `global.css` — not copied from this file.

### Confirmed Data-Accuracy Bugs

| # | Bug | Location | Root cause | Severity |
|---|---|---|---|---|
| B1 | `inProgressCount` on new-ideas page never updates after SSR | `NewIdeasInbox.tsx:1573` | `initialInProgressCount` prop is static; not refreshed by auto-poll | High |
| B2 | `ProcessImprovementsSummary` always shows `inProgressCount={0}` | `NewIdeasInbox.tsx:1596` | Hardcoded literal `0` passed to prop | High |
| B3 | `InboxSection` count badge uses React children length, not item count | `NewIdeasInbox.tsx:1433` | `Array.isArray(children) ? children.length : 1` is inaccurate for filtered lists | Medium |
| B4 | `newIdeasCount` badge on `/in-progress` page is SSR-locked | `in-progress/page.tsx:20-25` | Computed server-side; API endpoint (`/api/process-improvements/items`) does return `activePlans` in its response (`route.ts:25`), but no client subscriber in `InProgressInbox` derives or displays `newIdeasCount` from those refreshed values | Medium |
| B5 | `priorityReason` exposes internal projection labels in operator UI | `NewIdeasInbox.tsx:758-764` ("Queue backlog P2", "Active decision_waiting") | `WorkItemPriorityPanel` renders raw `item.priorityReason` string | Medium |

### Not-A-Bug Clarifications

| # | Original claim | Actual code state |
|---|---|---|
| (was B6) | `overallConfidence` shows raw `"—"` in plan cards | Already guarded: `InProgressInbox.tsx:282` checks `plan.overallConfidence !== "—"` before rendering. Not a bug. |
| (was B7) | Plans with `tasksTotal === 0` show as in-progress with 0% ring | Unreachable: `active-plans.ts:533-536` (`parseActivePlanRecord`) returns `null` when `tasks.total === 0`, so zero-task plans never enter the `activePlans` array. The client filter `p.tasksTotal === 0` is dead code. |

### Visual Artefact (Resolved by Theme Change)

| # | Issue | Location | Note |
|---|---|---|---|
| V1 | Hero stat badges use `hero-foreground` tokens on a light surface | `NewIdeasInbox.tsx:1568-1592` | `border-hero-foreground/16 bg-hero-foreground/8` are near-transparent on white; resolved automatically when the command-centre dark background is applied |

### Patterns & Conventions Observed
- **Tailwind v4 + CSS vars**: All colour utilities map to `hsl(var(--color-*))` via `@theme inline` block in `global.css`. New palette vars must follow the same pattern.
- **`bg-hero-contrast` utility**: Already defined in `global.css`; provides the dark multi-radial gradient used in hero sections. The command-centre design can reuse/extend this pattern for the whole page background.
- **Design-system components**: `Button`, `Tag` from `@acme/design-system/atoms`; `Inline`, `Stack` from primitives. These accept `color` + `tone` props and resolve to semantic tokens.
- **`eslint-disable ds/no-hardcoded-copy` comments**: BOS-PI-101/102 exemption present; same exemption needed on new components.
- **`eslint-disable ds/no-nonlayered-zindex`**: Needed for sticky bars and dropdowns; BOS-PI-103 exemption already exists.
- **`"use client"` boundary**: All inbox components are client components. Pages are async server components that pass SSR data as props. This pattern must be preserved.

### Design Reference Analysis (Reference Image)

Extracted from `/Users/petercowling/Downloads/Top-5-Best-UX-UI-Design-Companies-2020-3.jpg`:

| Visual Quality | Description | Implementation approach |
|---|---|---|
| Background | Deep navy/indigo `~hsl(222 30% 10%)` — almost-black with blue undertone | Scoped CSS var `--cmd-bg` applied to `.cmd-centre` wrapper class |
| Card surfaces | `~hsl(222 22% 16%)` with `rgba(255,255,255,0.06)` border — glassy, elevated | `--cmd-surface-1`, `--cmd-surface-2`; `backdrop-filter: blur` on hero cards |
| Hero gradient | Pink → purple linear gradient across primary metric card: `hsl(320 80% 65%) → hsl(265 75% 58%)` | New `bg-cmd-hero` utility; applied to summary strip |
| Accent glows | Small scattered dots in electric blue `hsl(210 100% 70%)`, magenta `hsl(310 90% 65%)`, teal `hsl(180 80% 55%)` — radial glow behind key numbers | CSS `radial-gradient` decorative layers on stat cards; animated `opacity` pulse for liveness |
| Number typography | Bold tabular `font-size: 2.5rem+`, white, with decimal in smaller weight | `text-4xl font-bold tabular-nums text-white` for primary metric values |
| Progress rings | Thin-stroke donut rings with gradient stroke (`conic-gradient` or SVG with `stroke-dasharray`) | Extend existing SVG ring in `ActivePlanCard`; upgrade stroke to use gradient + glow |
| List rows | Rounded `hsl(222 22% 20%)` rows with icon pill on left, title + subtitle in centre, badge + mini-chart on right | Map to `WorkItemCard` compact view; icon pill replaces left accent bar |
| Sparklines | Tiny inline SVG path charts in green/red per row | Not in scope for this plan; note as future opportunity |
| Sub-tabs | Purple underline indicator, white text, compact pill style | `ProcessImprovementsSubNav` upgrade |

### Dependency & Impact Map
- Upstream dependencies:
  - `projection.ts`, `active-plans.ts` — data sources; not being modified
  - `/api/process-improvements/items` endpoint — auto-refresh source; not being modified
  - `packages/themes/base/tokens.css` — semantic tokens for DS components; read-only
- Downstream dependents:
  - `NewIdeasInbox.test.tsx`, `InProgressInbox.test.tsx` — snapshot/behaviour tests; will need updates for new markup
  - BOS app `global.css` — new utilities added; no removals
- Blast radius:
  - Changes are contained to `apps/business-os/src/app/process-improvements/` and `src/components/process-improvements/` plus `src/styles/global.css`. No cross-app impact.

### Test Landscape

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| InProgressInbox — snooze | Unit/component | `InProgressInbox.test.tsx` | Snooze localStorage behaviour (3d/7d, read, persist) |
| InProgressInbox — active-now signal | Unit/component | `InProgressInbox.test.tsx:74` | TC-07: verifies `Active now` badge and `Touched Xm ago` text from file-mtime activity |
| InProgressInbox — pending execution | Unit/component | `InProgressInbox.test.tsx:93` | TC-08: verifies `1 handoff in flight` badge when `hasPendingExecution` |
| InProgressInbox — agent observation | Unit/component | `InProgressInbox.test.tsx:112` | TC-09: verifies `Agent observed Xm ago via lp-do-build` when `isObservedNow` |
| NewIdeasInbox (partial) | Unit/component | `NewIdeasInbox.test.tsx` | Decision handlers; no visual/layout tests |

#### Coverage Gaps
- No visual regression tests for process-improvements UI.
- No test covering the data-accuracy bugs listed above.
- No test for `InProgressCountBadge` client component (added 2026-03-13).

#### Recommended Test Approach
- Unit tests for: each confirmed bug fix (B1–B5) — add assertions for corrected counts and copy
- Snapshot tests: update after redesign; keep intentionally narrow (avoid snapshotting className strings)
- E2E: out of scope for this plan; existing Cypress suite is not run locally per policy

### Recent Git History (Targeted)
- `apps/business-os/src/components/process-improvements/*` — `500d9f41` snooze tests, `9b185d75` snooze UI, `c7081ff3` decision brief panel redesign, `f9c54bbcf` rationale capture — active development in last sprint

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `NewIdeasInbox.tsx`, `InProgressInbox.tsx`, `ProcessImprovementsSubNav.tsx`, `global.css` — light surface, flat layout | Core redesign target. New dark palette vars, gradient utilities, glow effects, compact card variants needed. | Yes — primary scope |
| UX / states | Required | Expand/collapse, pending, error, bulk-select, defer-picker, snooze — all implemented | All states must be re-skinned without changing behaviour. Loading/empty states need dark-mode equivalents. | Yes — re-skin all states |
| Security / privacy | N/A | Internal operator tool; no user PII; no auth changes | None | No |
| Logging / observability / audit | N/A | No changes to decision ledger or API routes | None | No |
| Testing / validation | Required | 2 component test files; no visual tests | B1–B7 fixes each need a test assertion. Snapshot updates required. | Yes — test updates per bug fix |
| Data / contracts | Required | `projection.ts` types flow to `NewIdeasInboxProps` — no type changes. `inProgressCount` fix changes prop usage pattern. | Props interface for `NewIdeasInbox` may need `inProgressCount` removed if count moves client-side. Verify `ProcessImprovementsSummary` prop type update. | Yes — minimal prop refactor |
| Performance / reliability | Required | `NewIdeasInbox.tsx` is 1,660 lines; `useMemo` used throughout. Adding new CSS utilities. | Scoped CSS vars on a wrapper element are zero-cost. No new data fetches. Component split opportunity (not required). | No — note only |
| Rollout / rollback | Required | Local dev only (`localhost:3022`); BOS is deployed to Workers but this is an internal tool | Git revert is the rollback. No feature flags needed for an internal-only operator tool. | No |

---

## Proposed Command-Centre Theme Architecture

### Scoped Dark Palette Strategy

Rather than switching all of BOS to dark mode, a `.cmd-centre` wrapper class is applied to the `<main>` in the process-improvements layout. Inside this scope, CSS custom properties are overridden to use the command-centre dark values. Design-system components pick up the overrides via the token vars automatically.

**Important distinction — reference image palette vs. existing repo dark tokens:**

The existing `packages/themes/dark/tokens.css` uses a near-black palette (`--color-bg: 0 0% 4%` — almost pure black, `--surface-2: 222 14% 13%`). This is NOT the same as the reference image, which uses a richer **navy/indigo** dark (`~hsl(222 30% 10%)`). The command-centre theme targets the reference image palette, not the existing `dark` theme. New CSS custom property values must be defined from scratch in `global.css` — not by importing `packages/themes/dark/tokens.css`.

**New CSS custom properties (to add to `global.css` — these are net-new values, not copies of existing dark theme):**

```css
/* Command-centre scoped dark palette — reference: navy/indigo dashboard aesthetic */
.cmd-centre {
  --color-bg: 222 30% 10%;           /* deep navy (ref image bg, richer than dark theme's 0 0% 4%) */
  --surface-1: 222 22% 14%;          /* card surface */
  --surface-2: 222 20% 18%;          /* elevated card / hover */
  --surface-3: 222 18% 22%;          /* inset surface */
  --color-fg: 0 0% 94%;              /* primary text */
  --color-fg-muted: 220 15% 60%;     /* muted text */
  --color-border: 220 20% 25%;       /* subtle border */
  --color-border-muted: 220 18% 20%; /* muted border */
  --hero-fg: 0 0% 100%;              /* hero text */

  /* Accent glow colours — extracted from reference image */
  --cmd-glow-blue: 210 100% 70%;
  --cmd-glow-magenta: 310 90% 65%;
  --cmd-glow-teal: 180 75% 55%;
  --cmd-hero-from: 320 80% 62%;
  --cmd-hero-to: 265 72% 56%;
}
```

**New `@utility` blocks:**

```css
@utility bg-cmd-hero {
  background-image:
    radial-gradient(circle at 20% 50%, hsl(var(--cmd-glow-magenta) / 0.25), transparent 40%),
    radial-gradient(circle at 80% 30%, hsl(var(--cmd-glow-blue) / 0.20), transparent 35%),
    linear-gradient(135deg, hsl(var(--cmd-hero-from)) 0%, hsl(var(--cmd-hero-to)) 100%);
}

@utility cmd-glow-blue {
  box-shadow: 0 0 20px hsl(var(--cmd-glow-blue) / 0.35);
}

@utility cmd-glow-magenta {
  box-shadow: 0 0 20px hsl(var(--cmd-glow-magenta) / 0.35);
}
```

### Layout Architecture (New Ideas page)

```
┌─────────────────────────────────────────────────────────────────┐
│  ProcessImprovementsSubNav (dark, with live counts + pulse dot) │
├─────────────────────────────────────────────────────────────────┤
│  HERO STRIP — bg-cmd-hero gradient                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │  7 Awaiting  │ │  3 In        │ │  2 Overdue   │ │ Filters│ │
│  │  decision    │ │  progress    │ │  ← urgent    │ │        │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ⚠ OVERDUE (2) — danger callout strip                          │
│  [urgent item card] [urgent item card]                          │
├─────────────────────────────────────────────────────────────────┤
│  ● OPERATOR ACTIONS (N) — needs your attention                 │
│  [action card] [action card] [action card]                      │
├─────────────────────────────────────────────────────────────────┤
│  IDEAS QUEUE (N) — awaiting first decision                      │
│  [idea card] [idea card] [idea card]                            │
├─────────────────────────────────────────────────────────────────┤
│  ▾ DEFERRED (N) — collapsed by default                         │
├─────────────────────────────────────────────────────────────────┤
│  ✓ RECENTLY DONE (N) — collapsed timeline strip                │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Architecture (In Progress page)

```
┌─────────────────────────────────────────────────────────────────┐
│  ProcessImprovementsSubNav (shared, with live counts)          │
├─────────────────────────────────────────────────────────────────┤
│  HERO STRIP — bg-cmd-hero gradient                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  3 Active    │ │  1 Blocked   │ │  2 Pending   │           │
│  │  plans       │ │  ← urgent    │ │  execution   │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  ⚡ RUNNING NOW (1) — animated pulse ring                       │
│  [active-now plan card — full width, glowing ring]             │
├─────────────────────────────────────────────────────────────────┤
│  ⚠ BLOCKED (1) — warning callout                               │
│  [blocked plan card]                                            │
├─────────────────────────────────────────────────────────────────┤
│  IN PROGRESS (N) — remaining plans                             │
│  [plan card] [plan card]                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Questions

### Resolved

- **Q: How does `ProcessImprovementsSubNav` get live counts if it currently receives no props and is mounted from `layout.tsx` with no data?**
  - A: `ProcessImprovementsSubNav` is a client component but currently receives no data. The `InProgressCountBadge` pattern (derived from `initialActivePlans`) only works on pages that already have plan data as props — it cannot be reused directly in the layout. Three viable approaches: (a) sub-nav independently polls `/api/process-improvements/items` on mount — simple, self-contained; (b) React context provider in `layout.tsx` shares counts from SSR data — adds complexity; (c) sub-nav remains static labels — degrades UX. **Default: option (a)** — sub-nav polls the items API on mount and derives both counts locally. Single `useEffect` + `fetch`, keeps the layout thin.
  - Evidence: `ProcessImprovementsSubNav.tsx:1-36` (no props, no fetching today); `/api/process-improvements/items` returns both `items` (source of new-ideas count) and `activePlans` (source of in-progress count) per `route.ts:22-26`.

- **Q: Should the dark theme cover the entire BOS app or just the process-improvements section?**
  - A: Scoped to process-improvements only via `.cmd-centre` wrapper class on the section `<main>` element. Other BOS pages are unaffected.
  - Evidence: Operator description "everything from presentation" is specific to these two pages; global BOS dark mode is a larger separate concern.

- **Q: Can we add new CSS custom properties (token overrides) to `global.css` or must they go in `packages/themes/`?**
  - A: `global.css` is the correct location for app-scoped utilities and token overrides. `packages/themes/` files are build-system generated. Adding to `global.css` via `.cmd-centre` class scope is the established pattern.
  - Evidence: `global.css` already defines `bg-hero`, `bg-hero-contrast`, `shadow-elevation-*` utilities as app-level additions.

- **Q: Is `isActiveNow` (5-minute file-mtime window) reliable enough to drive a "Running now" section?**
  - A: Yes, with appropriate labelling. "Active in last 5 minutes" is an honest and useful signal. The section title should say "Recently active" or show the last-touched timestamp, not "Running right now" (which implies real-time process monitoring).
  - Evidence: `active-plans.ts:50` — `ACTIVE_PLAN_ACTIVITY_WINDOW_MS = 5 * 60 * 1000`.

- **Q: For B1/B4 (stale count badges): should `inProgressCount` and `newIdeasCount` be moved to client-side computation or returned by the auto-refresh API?**
  - A: Client-side computation from already-fetched data is correct. The auto-refresh already returns `items` and `activePlans`; the counts can be derived from those in the client rather than adding a separate server round-trip.
  - Evidence: `/api/process-improvements/items` already returns `activePlans` array per `InProgressInbox.tsx:450`.

- **Q: Do the two test files (`NewIdeasInbox.test.tsx`, `InProgressInbox.test.tsx`) need to pass before this can ship?**
  - A: Yes per testing policy — tests run in CI. Plan must update snapshots and add regression tests for each bug fix.
  - Evidence: `docs/testing-policy.md` — "Tests run in CI only. NEVER run jest locally. Push and use `gh run watch`."

- **Q: Should "deferred" items continue to appear in the new-ideas inbox, just in a collapsed section?**
  - A: Yes — deferred items belong in the inbox as they will surface again when the defer window expires. Collapsed by default keeps them from polluting the active decision area.
  - Evidence: The current inbox shows deferred items inline mixed with active items — the new design separates them spatially, which is strictly better.

- **Q: Replace `WorkItemPriorityPanel` "Why now" copy from internal labels — what are the operator-readable equivalents?**
  - A: Mapping: `"Queue backlog P1"` → `"High priority"`, `"Queue backlog P2"` → `"Normal priority"`, `"Queue backlog P3"` → `"Low priority"`, `"Deferred queue item"` → `"Returning from deferral"`, `"Active decision_waiting"` → `"Waiting for your decision"`, `"Active blocker"` → `"Blocking active work"`, `"Active stage_gate"` → `"Stage gate — needs sign-off"`, `"Active next_step"` → `"Next step pending"`, `"Overdue …"` → `"Overdue"`.
  - Evidence: `projection.ts:308-355` — `getOperatorPriorityReason` and `getQueuePriorityReason` are the source; labels match the raw `actionKind` and priority strings.

### Open (Operator Input Required)

- **Q: Should the command-centre dark theme apply only in the browser or also in server-rendered HTML (i.e. should `html` or `body` carry a dark class for this section, or just the `<main>` element)?**
  - Why operator input is required: Setting `.cmd-centre` on `<main>` means the page background (`<html>`/`<body>`) will stay light-coloured while the inner content is dark — this could produce a flash of light background on scroll or on initial load. Setting a dark class on `<html>` for just these routes requires a layout-level mechanism. Operator preference is needed on whether a brief flash is acceptable.
  - Decision impacted: Whether to use a layout-level `dark` body class (applied server-side) or a scoped wrapper (may flash).
  - Decision owner: operator
  - Default assumption: Use scoped `.cmd-centre` on `<main>` initially; if the flash is visible/annoying, escalate to layout-level body class override in a follow-up.

---

## Confidence Inputs
- Implementation: 88% — all files identified, token architecture clear, pattern precedents exist in `global.css`. Bug fixes are straightforward. Risk: component complexity in `NewIdeasInbox.tsx` (1,660 lines).
- Approach: 90% — scoped CSS override approach is well-established; no dependency on external packages.
- Impact: 95% — changes are entirely self-contained within `apps/business-os/src/`.
- Delivery-Readiness: 85% — one open question (body flash); default assumption is viable.
- Testability: 80% — bug fixes are unit-testable. Visual changes require snapshot updates. No E2E needed.

What would raise each to ≥90%: Operator answers the body-class flash question (Delivery-Readiness); add one snapshot test per redesigned component (Testability).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `.cmd-centre` scope creates visual flash on page load (light body bg briefly visible) | Medium | Low — cosmetic only | Default: scoped wrapper; follow-up body class if flash is noticed |
| DS component tokens don't resolve correctly inside `.cmd-centre` scope (some use hardcoded colours) | Low | Medium — components look wrong | Test all DS atoms in isolation with scope applied; use `@theme inline` var inspection |
| `NewIdeasInbox.tsx` (1,660 lines) is complex; refactor risk during reskin | Low | Medium — regression in triage logic | Re-skin only; zero logic changes. Add regression tests per bug fix before visual changes. |
| Snapshot tests fail in CI after markup changes | High | Low — expected; just need updating | Update snapshots as part of the plan. Document which snapshots are intentional changes. |
| `priorityReason` copy mapping misses an edge case in `getOperatorPriorityReason` | Low | Low — worst case: internal label visible | Add exhaustive switch in the display layer with a fallback to `item.stateLabel` |
| BOS is a live production deployment; CI/deploy failure blocks the fix | Low | Medium — delayed fix | Three-commit strategy (data → theme → layout) keeps each diff reviewable and CI failure scope narrow |

---

## Planning Constraints & Notes
- Must-follow patterns:
  - All new colour values via CSS custom properties, never bare hex/hsl literals in Tailwind classes.
  - `eslint-disable ds/no-hardcoded-copy` with BOS-PI-10x tag and TTL on any hardcoded strings.
  - Bug fixes (B1–B7) must each have a corresponding test assertion — commit data fixes before visual redesign to keep diffs separable.
  - No changes to `lib/process-improvements/` — projection logic is stable.
- Rollout/rollback expectations:
  - BOS is deployed to production Workers at `business-os.peter-cowling1976.workers.dev` via `.github/workflows/`. Even though this is an internal operator tool, changes affect a live deployed surface and must be treated as production releases.
  - Rollback: git revert + redeploy via CI. No feature flags needed for this internal surface.
  - Stage: data-fix commit → visual theme commit → layout restructure commit (three separable commits recommended for clarity; each must pass CI before the next).
- Observability expectations:
  - `RefreshIndicator` upgrade: heartbeat clock showing "synced Xs ago" that updates every second client-side.

---

## Suggested Task Seeds (Non-binding)

1. **[Data] Fix B1+B4** — Remove `initialInProgressCount` prop; derive in-progress count client-side from `activePlans` in `NewIdeasInbox`; wire `newIdeasCount` on `/in-progress` to refresh endpoint response. Add regression tests.
2. **[Data] Fix B2** — Replace hardcoded `inProgressCount={0}` in `ProcessImprovementsSummary` call with live client-derived count.
3. **[Data] Fix B3** — Replace React children count with explicit `count` prop in `InboxSection`.
4. **[Data] Fix B5** — Create `formatPriorityReason(item)` helper with operator-readable mapping; replace all `item.priorityReason` usages in display components.
5. **[Data] Fix B3 fully** — Replace React children count in `InboxSection` with an explicit `count` prop passed from the filtered items array. Add regression assertion.
6. **[Theme] Add `.cmd-centre` dark palette** — Add CSS custom property overrides and new `bg-cmd-hero`, `cmd-glow-*` utilities to `global.css`.
7. **[Theme] Apply `.cmd-centre` wrapper** — Update `layout.tsx` to wrap children in `.cmd-centre` scoped element; update hero sections on both pages to use `bg-cmd-hero`.
8. **[Layout] Redesign ProcessImprovementsSubNav** — Convert to a client component that polls `/api/process-improvements/items` on mount to derive in-progress count (from `activePlans`) and new-ideas count (from `items` filtered to active, non-in-progress). Add pulse dot when any plan `isActiveNow`. Apply dark surface styling consistent with `.cmd-centre` scope.
9. **[Layout] New Ideas page — hero strip + spatial layout** — Hero strip with large stats; split active items into Overdue / Operator Actions / Queue swimlanes; Deferred collapsed by default; Recently Done as timeline strip.
10. **[Layout] In Progress page — hero strip + urgency swimlanes** — Hero strip with plan count + blocked count; "Running now" section (isActiveNow plans); Blocked section; remaining plans.
11. **[Polish] Command-centre liveness** — Upgrade `RefreshIndicator` to ticking `Xs ago` clock; upgrade active plan ring to gradient stroke + glow; upgrade WorkItemCard to dark glassmorphism style.
12. **[Test] Snapshot + regression updates** — Update all snapshot files; add B1–B7 regression assertions.

---

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: `tools-design-system` (for token and DS component compliance review)
- Deliverable acceptance package:
  - Both pages load with no console errors in `localhost:3022`.
  - Header counts match rendered item counts (no stale/wrong values).
  - No internal-system strings visible in operator-facing UI.
  - Dark command-centre theme applied; `bg-cmd-hero` gradient visible in hero strip.
  - All existing triage actions (do/defer/decline/mark-done/snooze/bulk) continue to work.
  - CI passes (typecheck + lint + updated tests).
- Post-delivery measurement plan:
  - Operator feedback after first use session (informal).

---

## Evidence Gap Review

### Gaps Addressed
- Full component source read (both inbox components, sub-nav, both pages, layout).
- All design tokens and utilities in `global.css` and `packages/themes/base/tokens.css` reviewed.
- Reference image analysed for palette, layout patterns, and implementation approach.
- All bugs reviewed: 5 confirmed (B1–B5), 2 disproved (former B6/B7 not present in code), 1 visual artefact (V1) — all traced to root cause with file + line evidence.
- Git history reviewed — no conflicting in-flight work on these files.

### Confidence Adjustments
- Initial concern: DS component token resolution inside `.cmd-centre` scope — rated Low risk after verifying that DS atoms use `hsl(var(--color-*))` references that will correctly pick up the scoped overrides.
- Initial concern: `NewIdeasInbox.tsx` size — rated low impact since re-skinning requires no logic changes; the complexity is in the decision handlers which are untouched.

### Remaining Assumptions
- Assumption: The operator will accept a brief light-background flash on initial page load if the scoped approach is used (default assumption chosen; see Open Questions).
- Assumption: No other BOS routes use `.cmd-centre` class today (verified: grep finds zero usages).

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Data accuracy bugs B1–B8 | Yes | None — all traced to root cause with file+line | No |
| Theme architecture (CSS var scope) | Yes | None — `global.css` pattern confirmed viable | No |
| Design reference extraction | Yes | None — palette values extracted from image | No |
| DS component token resolution | Partial | Advisory [Assumption] Medium: DS atoms must resolve correctly inside `.cmd-centre` — not runtime-verified | No (low risk; verify during build) |
| Test landscape | Yes | None — InProgressInbox.test.tsx coverage confirmed broader than initial assessment (TC-07, TC-08, TC-09 verified) | No |
| Open question (body flash) | Partial | Advisory [Preference] Low: Default assumption viable; operator preference not confirmed | No — default assumption taken |
| Git history / in-flight conflicts | Yes | None — no conflicting branches active on these files | No |
| Reference image palette vs. repo dark tokens | Yes | None — distinction now explicitly documented; new CSS vars are net-new values, not copies of existing dark theme | No |
| BOS production deployment | Yes | None — rollout/rollback section updated to reflect live Workers deployment | No |

---

## Scope Signal

- **Signal: right-sized**
- **Rationale:** The scope covers exactly the two pages and their components. Data fixes are traceable to specific lines. The visual redesign has a clear implementation path (scoped CSS vars + utility classes). No new data fetching or API changes. The open question has a viable default. Task seeds map 1:1 to identified problems with no speculative additions.

---

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None. Open question on body-class flash has a viable default assumption.
- Recommended next step: `/lp-do-analysis process-improvements-command-centre-redesign`
